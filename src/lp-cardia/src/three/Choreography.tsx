import * as THREE from 'three'
import { type ReactNode, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

/** Where the hero sits in each section. `x` is a fraction of viewport width. */
const KEYS = [
  { x: 0.25, y: 0.07, s: 1.12 },
  { x: -0.26, y: 0.0, s: 0.82 },
  { x: 0.24, y: 0.0, s: 0.72 },
  // Last section is centred copy, so the heart has to clear it upward rather
  // than sit behind it — centred over the headline it swallows the CTA whole.
  { x: 0.0, y: 0.27, s: 0.8 },
]

export const SECTIONS = KEYS.length

const smoothstep = (x: number) => x * x * (3 - 2 * x)

/**
 * The scroll rig, in the shape the rest of this repo uses: the DOM owns the
 * scrollbar and writes a 0..1 ref, the canvas only reads it inside useFrame —
 * no state, no re-render per scroll event.
 *
 * Rather than translating a tall stack past the camera, this keeps the hero on
 * screen the whole way down and moves it between per-section marks, so the copy
 * always has the heart beside it.
 */
export default function Choreography({
  scroll,
  children,
}: {
  scroll: React.RefObject<number>
  children: ReactNode
}) {
  const group = useRef<THREE.Group>(null!)
  const viewport = useThree((state) => state.viewport)

  useFrame((_state, delta) => {
    const p = THREE.MathUtils.clamp(scroll.current, 0, 1) * (SECTIONS - 1)
    const i = Math.min(SECTIONS - 2, Math.floor(p))
    const f = smoothstep(p - i)
    const a = KEYS[i]
    const b = KEYS[i + 1]

    // Below ~square the copy stacks under the hero, so the sideways offsets
    // would push it off screen — centre it and give back some size instead.
    const narrow = viewport.aspect < 1.05
    const spread = narrow ? 0 : viewport.width
    const shrink = narrow ? 0.66 : 1

    const x = THREE.MathUtils.lerp(a.x, b.x, f) * spread
    // Narrow gets one fixed lift instead of the per-section marks: stacking a
    // lift on top of them pushes the last section's heart off the top edge.
    const y = narrow
      ? viewport.height * 0.17
      : THREE.MathUtils.lerp(a.y, b.y, f) * viewport.height
    const s = THREE.MathUtils.lerp(a.s, b.s, f) * shrink

    group.current.position.x = THREE.MathUtils.damp(group.current.position.x, x, 4, delta)
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, y, 4, delta)
    const next = THREE.MathUtils.damp(group.current.scale.x, s, 4, delta)
    group.current.scale.setScalar(next)
  })

  return <group ref={group}>{children}</group>
}
