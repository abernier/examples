import { Chess, type Color, type Move, type PieceSymbol, type Square } from 'chess.js'

// chess.js owns the rules; this file owns the *toys*. The library thinks in
// board snapshots — a piece on e2 in one position and on e4 in the next — and a
// snapshot can't be animated: Woody has to be the same object before and after
// the move, or he teleports. So every toy keeps an id from the moment the set
// comes out of its box, and each move is applied to that list by hand.

export type Toy = {
  id: string
  type: PieceSymbol
  color: Color
  square: Square
  /** Sat out on the carpet, in the order it was knocked over. */
  takenAt: number | null
}

export const FILES = 'abcdefgh'
export const RANKS = '12345678'

/** a1 is the far-left corner from white's seat; white plays from +z. */
export function squarePosition(square: Square): [number, number] {
  return [FILES.indexOf(square[0]) - 3.5, 3.5 - RANKS.indexOf(square[1])]
}

export function newGame() {
  const chess = new Chess()
  const toys: Toy[] = []
  chess.board().forEach((row) =>
    row.forEach((piece) => {
      if (piece) toys.push({ id: `${piece.square}`, ...piece, takenAt: null })
    })
  )
  return { chess, toys }
}

/**
 * Walk the toys through a move chess.js has already validated. Three of them
 * touch a square the move doesn't name: en passant takes a pawn that isn't on
 * the target square, castling drags a rook along, and a promotion turns a pawn
 * into something else — which is why this can't just be "set square = to".
 */
export function applyMove(toys: Toy[], move: Move, taken: number): Toy[] {
  const captured = move.isEnPassant()
    ? ((move.to[0] + move.from[1]) as Square) // the pawn stayed on its own rank
    : move.to

  return toys.map((toy) => {
    if (toy.takenAt !== null) return toy
    if (toy.square === captured && toy.color !== move.color) {
      return { ...toy, takenAt: taken }
    }
    if (toy.square === move.from) {
      return { ...toy, square: move.to, type: move.promotion ?? toy.type }
    }
    // The rook the king jumped over, on the rank the king moved along.
    if (toy.type === 'r' && toy.color === move.color) {
      const rank = move.to[1]
      if (move.isKingsideCastle() && toy.square === `h${rank}`)
        return { ...toy, square: `f${rank}` as Square }
      if (move.isQueensideCastle() && toy.square === `a${rank}`)
        return { ...toy, square: `d${rank}` as Square }
    }
    return toy
  })
}

const VALUE: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }

/**
 * The other side plays the way a kid plays: greedily. It takes what it can see,
 * prefers a check to a shuffle, and is random enough between equals to play a
 * different game every time. Deliberately not an engine — losing to it should
 * feel like losing to someone who is enjoying themselves.
 */
export function reply(chess: Chess): Move | null {
  const moves = chess.moves({ verbose: true })
  if (!moves.length) return null
  const scored = moves.map((move) => {
    let score = move.captured ? VALUE[move.captured] * 2 : 0
    if (move.promotion) score += 8
    if (move.san.includes('#')) score += 100
    else if (move.san.includes('+')) score += 1.5
    // A pawn or a knight that walks forward beats a rook shuffling on its rank.
    if ('pn'.includes(move.piece)) score += 0.4
    return { move, score: score + Math.random() * 1.6 }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored[0].move
}

export function verdict(chess: Chess) {
  if (chess.isCheckmate()) return chess.turn() === 'w' ? 'lost' : 'won'
  if (chess.isStalemate()) return 'stalemate'
  if (chess.isDraw()) return 'draw'
  if (chess.inCheck()) return 'check'
  return 'playing'
}

/**
 * Which square the pointer is over, and nothing else about it.
 *
 * A plain object rather than React state on purpose: a pointer crossing the
 * board writes this dozens of times a second, and every write would otherwise
 * re-render thirty-two pieces and the camera controls. The board writes it, the
 * pieces read it in their frame loop, and no render ever happens.
 */
export const pointer: { square: Square | null } = { square: null }

/** The square a point on the board plane falls in — the inverse of the above. */
export function squareAt(x: number, z: number): Square | null {
  const file = Math.round(x + 3.5)
  const rank = Math.round(3.5 - z)
  if (file < 0 || file > 7 || rank < 0 || rank > 7) return null
  return `${FILES[file]}${RANKS[rank]}` as Square
}
