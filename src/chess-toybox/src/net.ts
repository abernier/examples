import { useEffect, useRef, useState } from 'react'
import { joinRoom } from 'trystero'
import type { Color } from 'chess.js'

import type { Ply } from './game'

// Two people, one board, and no server anywhere — the page is a file on a static
// host and has to stay one. Trystero borrows a public relay for the few seconds
// it takes two browsers to find each other, then gets out of the way: from the
// first move on, the moves go straight from one browser to the other.
//
// What crosses the wire is a pair of squares, never a position. Both sides run
// the same chess.js and the same `applyMove`, so a move played here and the same
// move replayed there land on the same board *and* on the same toys — which is
// the part a FEN would lose.

const APP_ID = 'abernier-examples-chess-toybox'

/** The whole game so far. `reset` is a restart: take it even if it's shorter. */
export type Board = { plies: Ply[]; reset: boolean }

type Handlers = {
  move: (ply: Ply) => void
  board: (board: Board) => void
  /** Where our game is up to, for a friend who just walked in. */
  history: () => Ply[]
}

/** Who's currently listening: the mounted component, or nobody. */
type Seat = { on: { current: Handlers }; friend: (there: boolean) => void } | null

type Wire = {
  move: (ply: Ply) => void
  board: (board: Board) => void
  peers: Set<string>
  seat: Seat
}

/**
 * One table per room, for as long as the page is open — joined once here rather
 * than in the effect that uses it.
 *
 * Joining is not something you can undo and redo in the same tick: a relay told
 * we've left doesn't put us back, and the room comes up empty. React mounts
 * every effect twice in development, which is exactly that, so the room has to
 * outlive the component, and only the listening is hung on and off.
 */
const tables = new Map<string, Wire>()

function sit(room: string): Wire {
  const known = tables.get(room)
  if (known) return known

  const wire: Wire = { move: () => {}, board: () => {}, peers: new Set(), seat: null }

  const join = () => {
    const table = joinRoom({ appId: APP_ID }, room)
    const move = table.makeAction<Ply>('move')
    const board = table.makeAction<Board>('board')

    move.onMessage = (ply) => wire.seat?.on.current.move(ply)
    board.onMessage = (data) => wire.seat?.on.current.board(data)
    // A send with nobody there is a no-op, not a failure worth a red console.
    wire.move = (ply) => void move.send(ply).catch(() => {})
    wire.board = (data) => void board.send(data).catch(() => {})

    // Both sides offer their game when someone appears, and the longer one
    // wins — that way a reload is survivable from either chair, and neither of
    // the two has to be the one that remembers.
    table.onPeerJoin = (id) => {
      wire.peers.add(id)
      if (!wire.seat) return
      wire.seat.friend(true)
      wire.board({ plies: wire.seat.on.current.history(), reset: false })
    }

    table.onPeerLeave = (id) => {
      wire.peers.delete(id)
      if (wire.peers.size) return
      wire.seat?.friend(false)
      // Leave and sit down again, at the same room and so behind the same link.
      // A seat someone has got up from doesn't take anyone else: the half of the
      // handshake that remembers them stays theirs, and the next arrival waves
      // at a table that never waves back. Standing up and sitting down is the
      // whole of the cure, and it costs a second nobody is watching.
      table.leave().then(join)
    }
  }

  join()
  tables.set(room, wire)
  return wire
}

export type Table = {
  /** The colour you play: white if the table is yours, black if you joined one. */
  color: Color
  /** Is someone actually sitting on the other side? */
  friend: boolean
  move: (ply: Ply) => void
  board: (board: Board) => void
}

/**
 * Every page is a table, from the moment it opens — there's nothing to click to
 * make one. The address bar already holds the invitation, and handing it to
 * someone is the one deliberate act the whole thing needs.
 *
 * Which side of the board you're on falls out of that: the tab that made the
 * room plays white, a tab that arrived at someone else's room plays black. It's
 * remembered per room rather than read off the URL, because after the host
 * reloads their own page the URL is the one they shared — and reading the colour
 * out of it would sit two blacks at the same table.
 */
function table(): { room: string; color: Color } {
  const found = new URLSearchParams(location.hash.slice(1)).get('r')
  if (found) return { room: found, color: sessionStorage.getItem(`toybox:${found}`) === 'w' ? 'w' : 'b' }

  const room = Math.random().toString(36).slice(2, 8)
  sessionStorage.setItem(`toybox:${room}`, 'w')
  // replace, not push: the room isn't a place you go back from.
  history.replaceState(null, '', `#r=${room}`)
  return { room, color: 'w' }
}

export function useTable(handlers: Handlers): Table {
  const [{ room, color }] = useState(table)
  const [friend, setFriend] = useState(false)

  // The handlers close over the game, which changes every move; the table is
  // joined once. So the table reads them from here rather than being taken down
  // and rebuilt around each new one.
  const on = useRef(handlers)
  useEffect(() => {
    on.current = handlers
  })

  const wire = useRef<Wire | null>(null)

  useEffect(() => {
    const seated = sit(room)
    wire.current = seated
    seated.seat = { on, friend: setFriend }
    setFriend(seated.peers.size > 0)
    return () => {
      seated.seat = null
      wire.current = null
    }
  }, [room])

  return {
    color,
    friend,
    move: (ply) => wire.current?.move(ply),
    board: (board) => wire.current?.board(board),
  }
}
