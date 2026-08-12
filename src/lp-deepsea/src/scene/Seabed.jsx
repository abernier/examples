import * as THREE from 'three'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AccumulativeShadows, RandomizedLight } from '@react-three/drei'
import './CausticFloorMaterial'

/**
 * Abyssal plain: a silt plane, drei's temporal <AccumulativeShadows> for the
 * vessel's soft contact shadow, and the custom caustic sheet on top.
 */
export function Seabed({ y = -2.05 }) {
  const mat = useRef(null)

  useFrame((state) => {
    if (mat.current) mat.current.uTime = state.clock.elapsedTime
  })

  return (
    <group position={[0, y, 0]}>
      {/* silt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[70, 70, 1, 1]} />
        <meshStandardMaterial color="#0a1319" roughness={1} metalness={0} />
      </mesh>

      {/* soft accumulated shadow, lifted a hair to avoid z-fighting */}
      <AccumulativeShadows
        temporal
        frames={60}
        alphaTest={0.8}
        opacity={0.85}
        colorBlend={1.6}
        color="#020a0e"
        scale={16}
        resolution={1024}
        position={[0, 0.006, 0]}
      >
        <RandomizedLight
          amount={6}
          radius={5}
          ambient={0.55}
          intensity={Math.PI}
          position={[-1.6, 4.2, -1.2]}
          bias={0.001}
        />
      </AccumulativeShadows>

      {/* floodlight caustics */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[15, 15, 1, 1]} />
        <causticFloorMaterial
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uIntensity={0.34}
          uScale={2.1}
        />
      </mesh>
    </group>
  )
}
