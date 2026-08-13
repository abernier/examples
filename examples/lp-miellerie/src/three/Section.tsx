import * as THREE from 'three'
import { type ReactNode, useRef } from 'react'
import { useFrame } from '@react-three/fiber'

/**
 * Hides a section's contents while it is off screen. This is not an
 * optimisation detail: MeshTransmissionMaterial renders the scene into its own
 * buffer on every frame it is drawn, so six cells left visible at once means
 * nine full scene renders per frame — enough to freeze the first seconds.
 * `visible = false` skips the mesh, and with it the buffer.
 */
export default function Section({
  index,
  scroll,
  sections,
  children,
}: {
  index: number
  scroll: React.RefObject<number>
  sections: number
  children: ReactNode
}) {
  const group = useRef<THREE.Group>(null!)

  useFrame(() => {
    group.current.visible = Math.abs(scroll.current * (sections - 1) - index) < 0.8
  })

  return <group ref={group}>{children}</group>
}
