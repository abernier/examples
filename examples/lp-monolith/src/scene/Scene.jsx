import { Suspense } from 'react'
import { Environment, ContactShadows, MeshReflectorMaterial } from '@react-three/drei'
import { EffectComposer, N8AO, Bloom, SMAA, Vignette } from '@react-three/postprocessing'
import { Lightformers } from './Lightformers'
import { Blob } from './Blob'
import { Colonnade } from './Colonnade'
import { Rig } from './Rig'

const FLOOR_Y = -0.75

/**
 * Polished-concrete floor.
 * Props follow drei's MeshReflectorMaterial as used in the pmndrs example
 * "ground-reflections-and-video-textures" (blur / resolution / mixBlur /
 * mixStrength / mirror), tuned for a wet-looking dark slab.
 */
function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, 0]} receiveShadow>
      <planeGeometry args={[90, 90]} />
      <MeshReflectorMaterial
        resolution={512}
        blur={[420, 110]}
        mixBlur={20}
        mixStrength={14}
        mirror={0.55}
        depthScale={1.1}
        minDepthThreshold={0.35}
        maxDepthThreshold={1.35}
        depthToBlurRatioBias={0.25}
        color="#1c1c20"
        roughness={0.72}
        metalness={0.7}
      />
    </mesh>
  )
}

/** the object the whole studio is named after */
function Slab() {
  return (
    <group position={[-2.45, 0, -7.6]}>
      <mesh position={[0, 3.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.4, 8, 1.1]} />
        <meshStandardMaterial color="#2c2c31" roughness={0.95} metalness={0.05} />
      </mesh>
      {/* the shutter joint, the only line on the whole face */}
      <mesh position={[1.12, 1.9, 0.556]}>
        <boxGeometry args={[0.024, 3.4, 0.02]} />
        <meshBasicMaterial color="#c8ff00" toneMapped={false} />
      </mesh>
    </group>
  )
}

export function Scene() {
  return (
    <>
      <color attach="background" args={['#0a0a0b']} />
      <fog attach="fog" args={['#0a0a0b', 11, 40]} />

      <ambientLight intensity={0.45} />
      {/* the one hard studio lamp — everything else is the environment rig */}
      <spotLight
        position={[6, 12, 4]}
        angle={0.5}
        penumbra={0.85}
        intensity={210}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-8, 6, -6]} intensity={1.3} color="#9aa3ad" />

      <Suspense fallback={null}>
        <Floor />
        <Slab />
        <Colonnade />
        <Blob position={[1.95, 0.5, -0.1]} />

        <ContactShadows
          position={[1.95, FLOOR_Y + 0.005, -0.1]}
          scale={16}
          blur={2.4}
          far={3.4}
          opacity={0.85}
          resolution={512}
          color="#000000"
        />

        {/* live, animated environment — no remote HDRI, everything is geometry */}
        <Environment frames={Infinity} resolution={128} environmentIntensity={1.15}>
          <Lightformers />
        </Environment>
      </Suspense>

      <Rig />

      <EffectComposer multisampling={0}>
        <N8AO halfRes color="black" aoRadius={2.2} intensity={2.4} aoSamples={6} denoiseSamples={4} />
        <Bloom mipmapBlur luminanceThreshold={1.02} luminanceSmoothing={0.28} intensity={0.5} levels={6} />
        <Vignette eskil={false} offset={0.25} darkness={0.72} />
        <SMAA />
      </EffectComposer>
    </>
  )
}
