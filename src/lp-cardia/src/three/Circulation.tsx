import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'

import { contraction, phaseAt } from '../lib/cardiac'

const dummy = new THREE.Object3D()

/**
 * Circulation: instanced cells on tilted orbits around the heart, surging
 * outward and speeding up on every ejection.
 *
 * Ported from `instanced-particles-effects` — one InstancedMesh, one dummy
 * Object3D, all the motion computed on the CPU into instance matrices. At this
 * count that is one draw call, which is what makes it affordable next to a
 * transmissive hero.
 */
export default function Circulation({ count = 150 }: { count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null!)

  const cells = useMemo(() => {
    const out = []
    for (let i = 0; i < count; i++) {
      out.push({
        // A tight band around the heart. Wider than this and it stops reading
        // as circulation and starts reading as confetti over the copy.
        radius: 1.25 + Math.random() * 0.85,
        tilt: (Math.random() - 0.5) * 1.5,
        yaw: Math.random() * Math.PI * 2,
        offset: Math.random() * Math.PI * 2,
        speed: 0.22 + Math.random() * 0.42,
        lift: (Math.random() - 0.5) * 1.1,
        size: 0.012 + Math.random() * 0.019,
        // A per-cell lag, so the surge sweeps outward through the field rather
        // than every cell jumping on the same frame.
        lag: Math.random() * 0.25,
      })
    }
    return out
  }, [count])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i]
      const surge = contraction(phaseAt(t - c.lag))
      const angle = c.offset + t * c.speed * (1 + surge * 1.5)
      const r = c.radius * (1 + surge * 0.14)

      const x = Math.cos(angle) * r
      const z = Math.sin(angle) * r
      // Tilt the orbit so the field reads as a volume, not a flat ring.
      dummy.position.set(
        x * Math.cos(c.yaw) - z * Math.sin(c.yaw) * Math.sin(c.tilt),
        c.lift + Math.sin(angle + c.tilt) * 0.45 * Math.sin(c.tilt) + Math.sin(t * 0.3 + c.offset) * 0.05,
        x * Math.sin(c.yaw) + z * Math.cos(c.yaw) * Math.sin(c.tilt),
      )
      dummy.scale.setScalar(c.size * (1 + surge * 0.7))
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color="#b82340"
        roughness={0.35}
        metalness={0.1}
        transparent
        opacity={0.72}
      />
    </instancedMesh>
  )
}
