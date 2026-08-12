import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'

const o = new THREE.Object3D()

/** Pollen drifting in the spotlight beams. One instanced draw call. */
export default function Motes({ count = 90 }: { count?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null!)

  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: THREE.MathUtils.randFloatSpread(11),
        y: THREE.MathUtils.randFloatSpread(9),
        z: THREE.MathUtils.randFloat(-3.5, 2),
        speed: THREE.MathUtils.randFloat(0.05, 0.22),
        drift: THREE.MathUtils.randFloat(0.3, 1.4),
        phase: Math.random() * Math.PI * 2,
        scale: THREE.MathUtils.randFloat(0.01, 0.026),
      })),
    [count],
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime
    seeds.forEach((s, i) => {
      // Slow rise, sideways sway, wrapped into a 9-unit tall band
      o.position.set(
        s.x + Math.sin(t * s.drift + s.phase) * 0.5,
        ((s.y + t * s.speed + 4.5) % 9) - 4.5,
        s.z,
      )
      o.scale.setScalar(s.scale)
      o.updateMatrix()
      ref.current.setMatrixAt(i, o.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#ffcf8a" toneMapped={false} transparent opacity={0.55} />
    </instancedMesh>
  )
}
