import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import type { Square } from 'chess.js'

import { pointer, squareAt, squarePosition } from '../game'
import { checks } from '../textures'

const LIGHT = '#f3e3c0'
const DARK = '#c8402f'
const TRAY = '#2f6cb5'

// How the tray is stacked, bottom to top. The board is a slab with real
// thickness sitting *in* the tray rather than a print floating above its floor:
// nothing here shares a plane with anything else, which is the only fix for a
// z-fight that holds whatever precision the depth buffer happens to have. The
// phones that were still showing bands through the board at full zoom-out
// resolve about two centimetres at that distance; the board now stands eight
// clear of the lip around it.
const TRAY_TOP = 0.222
/** The playing surface — where a toy's feet are, and every other height here. */
const SURFACE = 0.302
/** Deep enough that the bottom of it is buried in the tray, not resting on it. */
const SLAB = 0.092

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
  // The slab, faced six ways: the checks printed on top, and the moulded blue
  // everywhere else — the edge of it is what you see standing proud of the lip.
  const faces = useMemo(() => {
    const tray = new THREE.MeshStandardMaterial({ color: TRAY, roughness: 0.35 })
    const top = new THREE.MeshStandardMaterial({ map: checks(LIGHT, DARK), roughness: 0.45 })
    // `BoxGeometry` groups run +x, −x, +y, −y, +z, −z.
    return [tray, tray, top, tray, tray, tray]
  }, [])

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
        args={[9.6, TRAY_TOP, 9.6]}
        radius={0.09}
        smoothness={4}
        position={[0, TRAY_TOP / 2, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={TRAY} roughness={0.35} />
      </RoundedBox>
      {/* The board, dropped into the tray. One mesh where there were
          sixty-four, and the checks are on its top face rather than over it. */}
      <mesh position={[0, SURFACE - SLAB / 2, 0]} material={faces} receiveShadow castShadow>
        <boxGeometry args={[8, SLAB, 8]} />
      </mesh>
      {selected && (
        <mesh
          position={[squarePosition(selected)[0], SURFACE + 0.014, squarePosition(selected)[1]]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[1, 1]} />
          {/* The one thing left that has to lie on a surface rather than beside
              it. It gets both belts: enough clearance for a coarse depth buffer
              to resolve on its own, and the offset a decal wants anyway. */}
          <meshBasicMaterial
            color="#ffe14d"
            transparent
            opacity={0.5}
            polygonOffset
            polygonOffsetFactor={-4}
            polygonOffsetUnits={-4}
          />
        </mesh>
      )}
      {[...targets].map(([square, capture]) => (
        <Marker key={square} position={squarePosition(square)} capture={capture} />
      ))}
    </group>
  )
}
