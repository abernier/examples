import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import type { Square } from 'chess.js'

import { FILES, RANKS, pointer, squareAt, squarePosition } from '../game'

const LIGHT = '#f3e3c0'
const DARK = '#c8402f'
const TRAY = '#2f6cb5'

const TILES = RANKS.split('').flatMap((rank) =>
  FILES.split('').map((file) => {
    const square = `${file}${rank}` as Square
    return {
      square,
      position: squarePosition(square),
      light: (FILES.indexOf(file) + RANKS.indexOf(rank)) % 2 === 1,
    }
  })
)

/**
 * A disc on an empty square, a ring around an occupied one: where you can go.
 * It answers no pointer events — the board underneath it does that, and one
 * thing answering for a square is enough.
 */
function Marker({ position, capture }: { position: [number, number]; capture: boolean }) {
  const ref = useRef<THREE.Mesh>(null!)
  useFrame((state) => {
    const t = state.clock.elapsedTime * 3 + position[0]
    ref.current.position.y = 0.32 + Math.sin(t) * 0.03
    ref.current.scale.setScalar(1 + Math.sin(t) * 0.06)
  })
  return (
    <mesh
      ref={ref}
      position={[position[0], 0.32, position[1]]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      {capture ? <ringGeometry args={[0.36, 0.46, 32]} /> : <circleGeometry args={[0.3, 24]} />}
      <meshBasicMaterial color={capture ? '#ffe14d' : '#ffffff'} transparent opacity={0.8} />
    </mesh>
  )
}

/**
 * The board is a moulded plastic tray, the kind a boxed game comes in: a blue
 * shell with a raised lip, and the checks printed on the floor of it. Sixty-four
 * tiles, two materials — the highlight under the selected toy is its own mesh
 * rather than an emissive on one of them, so nothing here is per-square except
 * the geometry it's drawn at.
 */
export function Board({
  targets,
  selected,
  actionable,
  onPick,
}: {
  /** Legal destinations for the toy in hand, and whether each one is a take. */
  targets: Map<Square, boolean>
  /** Whether clicking a square would do anything — all the cursor needs to know. */
  actionable: (square: Square) => boolean
  selected: Square | null
  onPick: (square: Square) => void
}) {
  const [light, dark] = useMemo(
    () => [
      new THREE.MeshStandardMaterial({ color: LIGHT, roughness: 0.45 }),
      new THREE.MeshStandardMaterial({ color: DARK, roughness: 0.45 }),
    ],
    []
  )

  // One sheet of glass over the whole board, and the only thing on this page
  // that answers the pointer. Everything you can point at is a square — which is
  // what "click a piece" means at a chessboard anyway — so the square comes out
  // of where the ray meets the board rather than out of hit-testing thirty-two
  // toys. Nothing can occlude it: it *is* the board, so a piece standing in
  // front of a square no longer takes the click meant for that square, and the
  // pointer costs one ray/plane test however full the board is.
  const last = useRef<Square | null>(null)
  const point = (event: ThreeEvent<PointerEvent>) => {
    const square = squareAt(event.point.x, event.point.z)
    if (square === last.current) return
    last.current = square
    pointer.square = square
    document.body.style.cursor = square && actionable(square) ? 'pointer' : 'auto'
  }
  const away = () => {
    last.current = pointer.square = null
    document.body.style.cursor = 'auto'
  }

  return (
    <group>
      <mesh
        position={[0, 0.31, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={point}
        onPointerOut={away}
        onClick={(event) => {
          const square = squareAt(event.point.x, event.point.z)
          if (square) onPick(square)
        }}
      >
        <planeGeometry args={[8, 8]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* The tray, and the lip moulded around it. Bevelled corners because
          nothing that came out of a mould has a sharp one. */}
      <RoundedBox
        args={[9.6, 0.3, 9.6]}
        radius={0.12}
        smoothness={4}
        position={[0, 0.15, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={TRAY} roughness={0.35} />
      </RoundedBox>
      {/* The checks sit *on* the tray floor, not level with it: coplanar and the
          z-fight eats the board. */}
      {TILES.map((tile) => (
        <mesh
          key={tile.square}
          position={[tile.position[0], 0.301, tile.position[1]]}
          rotation={[-Math.PI / 2, 0, 0]}
          material={tile.light ? light : dark}
          receiveShadow
        >
          <planeGeometry args={[1, 1]} />
        </mesh>
      ))}
      {selected && (
        <mesh
          position={[squarePosition(selected)[0], 0.306, squarePosition(selected)[1]]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial color="#ffe14d" transparent opacity={0.5} />
        </mesh>
      )}
      {[...targets].map(([square, capture]) => (
        <Marker key={square} position={squarePosition(square)} capture={capture} />
      ))}
    </group>
  )
}
