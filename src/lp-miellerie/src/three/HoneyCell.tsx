import * as THREE from 'three'
import { useRef } from 'react'
import { useFrame, type ThreeElements } from '@react-three/fiber'
import { MeshTransmissionMaterial } from '@react-three/drei'

/**
 * A hexagonal cell of raw honey. The material settings are the ones from the
 * `inter-epoxy-resin` example — thick, distorted transmission with a touch of
 * chromatic aberration — retuned from pink epoxy to amber honey.
 */
export default function HoneyCell({
  radius = 1.2,
  depth = 0.5,
  spin = 0.12,
  float = 0.06,
  // Every cell renders the scene into its own buffer, so the small ones — four
  // of them on screen at once — get a cheaper one.
  samples = 4,
  resolution = 384,
  backside = true,
  color = '#ffc247',
  thickness = 0.85,
  ...props
}: {
  radius?: number
  depth?: number
  spin?: number
  float?: number
  samples?: number
  resolution?: number
  backside?: boolean
  color?: string
  thickness?: number
} & Omit<ThreeElements['group'], 'ref'>) {
  const inner = useRef<THREE.Group>(null!)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    inner.current.rotation.z = t * spin
    inner.current.rotation.x = Math.sin(t * 0.35) * 0.14
    inner.current.position.y = Math.sin(t * 0.6) * float
  })

  return (
    <group {...props}>
      <group ref={inner}>
        {/* chromaticAberration stays low: the comb behind is high-frequency and
            a wide split fringes every hexagon edge red/green */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[radius, radius, depth, 6, 1]} />
          <MeshTransmissionMaterial
            backside={backside}
            backsideThickness={0.4}
            samples={samples}
            resolution={resolution}
            transmission={1}
            clearcoat={1}
            clearcoatRoughness={0.05}
            thickness={thickness}
            chromaticAberration={0.14}
            anisotropy={0.3}
            roughness={0.05}
            distortion={0.3}
            distortionScale={0.25}
            temporalDistortion={0.04}
            ior={1.47}
            color={color}
          />
        </mesh>
      </group>
    </group>
  )
}
