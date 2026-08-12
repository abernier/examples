import * as THREE from 'three'
import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { SpotLight, useDepthBuffer, type SpotLightProps } from '@react-three/drei'

/**
 * Two volumetric spots raking the comb, ported from `volumetric-spotlight`:
 * drei's SpotLight fed with a one-frame depth buffer for soft particles, and a
 * target lerped towards the pointer.
 */
export default function Spots() {
  // Cheap: rendered once. The comb behind is static, which is what the soft
  // particles actually intersect.
  const depthBuffer = useDepthBuffer({ frames: 1 })
  return (
    <>
      <MovingSpot depthBuffer={depthBuffer} color="#ffbe4d" position={[3.5, 4, 3]} />
      <MovingSpot depthBuffer={depthBuffer} color="#ff7a18" position={[-3.5, 4, 1.5]} />
    </>
  )
}

function MovingSpot({ vec = new THREE.Vector3(), ...props }: { vec?: THREE.Vector3 } & SpotLightProps) {
  const light = useRef<THREE.SpotLight>(null!)
  const viewport = useThree((state) => state.viewport)

  useFrame((state) => {
    light.current.target.position.lerp(
      vec.set((state.pointer.x * viewport.width) / 2, (state.pointer.y * viewport.height) / 2, 0),
      0.06,
    )
    light.current.target.updateMatrixWorld()
  })

  return (
    // No castShadow: the comb is a flat wall, the shadow maps only bought two
    // extra passes over ~600 instances and a frozen first second.
    <SpotLight
      ref={light}
      penumbra={1}
      distance={14}
      angle={0.42}
      attenuation={7}
      anglePower={4}
      intensity={2.6 * Math.PI}
      decay={0}
      {...props}
    />
  )
}
