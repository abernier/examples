import { useRef } from 'react'
import { Environment, Lightformer, Sky } from '@react-three/drei'
import type { Sky as SkyImpl } from 'three-stdlib'

import { Godrays, Motes, OceanUnderside, Seafloor, useOceanWater } from './Ocean'
import { Rig } from './Rig'
import { Surfboard } from './Surfboard'
import { SUN } from './env'

export function Scene() {
  const sky = useRef<SkyImpl>(null)
  const water = useOceanWater()

  return (
    <>
      <ambientLight intensity={0.35} color="#a6d2da" />
      <directionalLight position={[-190, 60, -430]} intensity={1.7} color="#ffdca8" />
      <directionalLight position={[60, -40, 40]} intensity={0.35} color="#3ba3b4" />

      {/* Reflections for the boards, built from lightformers so nothing is fetched. */}
      <Environment resolution={128} frames={1} environmentIntensity={0.9}>
        <color attach="background" args={['#0a2f3c']} />
        <Lightformer
          form="rect"
          intensity={6}
          color="#ffd9a5"
          position={[-6, 2, -9]}
          scale={[12, 6, 1]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="circle"
          intensity={4}
          color="#dff6ff"
          rotation-x={Math.PI / 2}
          position={[0, 8, 0]}
          scale={[14, 14, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.6}
          color="#0e7c8a"
          rotation-y={Math.PI / 2}
          position={[9, -1, 0]}
          scale={[16, 8, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.2}
          color="#124e5c"
          rotation-y={-Math.PI / 2}
          position={[-9, -2, 2]}
          scale={[16, 8, 1]}
        />
      </Environment>

      <Sky
        ref={sky}
        distance={4500}
        sunPosition={SUN}
        turbidity={7}
        rayleigh={2.4}
        mieCoefficient={0.006}
        mieDirectionalG={0.86}
      />

      <primitive object={water} />
      <OceanUnderside />
      <Seafloor />
      <Godrays />
      <Motes />

      <Surfboard position={[3.6, 0.1, 22]} rotation={0.5} scale={2.3} deck="#0f6f7a" />
      <Surfboard
        position={[-5.2, 0.1, 16]}
        rotation={-0.9}
        scale={2.1}
        color="#f6e7cf"
        deck="#e2734a"
        phase={2.4}
      />
      <Surfboard
        position={[-1.4, 0.1, 31]}
        rotation={2.1}
        scale={2.5}
        color="#eef6f4"
        deck="#123a4a"
        phase={5.1}
      />

      <Rig sky={sky} water={water} />
    </>
  )
}
