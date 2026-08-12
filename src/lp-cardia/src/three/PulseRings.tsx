import * as THREE from 'three'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

import { PERIOD } from '../lib/cardiac'

const COUNT = 3
const MAX_RADIUS = 1.9

/**
 * The beat leaving the chest: thin rings that spawn on each R wave and expand
 * out past the heart. Three meshes, staggered a third of a cycle apart, so
 * there is always one in flight without anything ever being spawned or
 * destroyed at runtime.
 */
export default function PulseRings() {
  const rings = useRef<THREE.Mesh[]>([])

  useFrame((state) => {
    const beats = state.clock.elapsedTime / PERIOD
    for (let i = 0; i < COUNT; i++) {
      const ring = rings.current[i]
      if (!ring) continue

      // Age of this ring in cycles, 0..1 — offset so the three take turns.
      let age = (beats - 0.32 - i / COUNT) % 1
      if (age < 0) age += 1

      const eased = 1 - (1 - age) ** 2.2
      ring.scale.setScalar(0.9 + eased * MAX_RADIUS)
      const material = ring.material as THREE.MeshBasicMaterial
      material.opacity = 0.22 * (1 - age) ** 1.7
    }
  })

  // Facing the camera, centred on the heart. Laid flat they read as puddles
  // sprawling across the bottom of the page; head-on they read as the beat.
  return (
    <group position-z={-0.6}>
      {Array.from({ length: COUNT }, (_, i) => (
        <mesh
          key={i}
          ref={(node) => {
            if (node) rings.current[i] = node
          }}
        >
          <ringGeometry args={[0.97, 1, 96]} />
          <meshBasicMaterial
            color="#c2113b"
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  )
}
