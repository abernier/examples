import * as THREE from 'three'
import { type ReactNode, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

/**
 * Ported from the `tying-canvas-to-scroll-offset` example: the DOM keeps the
 * scrollbar, the canvas just damps a group towards `viewport.height * scroll`.
 * `factor` lets a layer drift slower than the rest, for parallax.
 */
export default function ScrollGroup({
  scroll,
  factor = 1,
  sections = 1,
  children,
}: {
  scroll: React.RefObject<number>
  factor?: number
  sections?: number
  children: ReactNode
}) {
  const group = useRef<THREE.Group>(null!)
  const viewport = useThree((state) => state.viewport)

  useFrame((_state, delta) => {
    group.current.position.y = THREE.MathUtils.damp(
      group.current.position.y,
      viewport.height * scroll.current * (sections - 1) * factor,
      4,
      delta,
    )
  })

  return <group ref={group}>{children}</group>
}
