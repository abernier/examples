import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  Caustics,
  CubeCamera,
  Environment,
  Float,
  MeshRefractionMaterial,
  PerformanceMonitor,
  Sparkles,
} from '@react-three/drei'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { easing } from 'maath'

import { createBrilliantGeometry, createStepCutGeometry } from './gem'
import { getEnvironmentTexture } from './environment'
import { useScrollOffset } from './useScrollOffset'

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

/**
 * The centrepiece stone, its two satellites and the gold band.
 * Adapted from the pmndrs `diamond-refraction` example: CubeCamera films the
 * scene once into a cube map, MeshRefractionMaterial ray-casts through the
 * facets against it, and Caustics projects the result onto a catcher plane.
 */
function Jewels({ scroll }: { scroll: React.RefObject<number> }) {
  const envMap = useMemo(() => getEnvironmentTexture(), [])
  const brilliant = useMemo(() => createBrilliantGeometry(16), [])
  const stepCut = useMemo(() => createStepCutGeometry(), [])

  const rig = useRef<THREE.Group>(null!)
  const spin = useRef<THREE.Group>(null!)

  useFrame((state, delta) => {
    const p = scroll.current

    // everything is expressed against the viewport so the composition holds
    // from a phone to an ultrawide
    const k = Math.min(1.05, Math.max(0.42, state.viewport.width / 5.8))

    // hero: the stone sits to the right of the headline; it drifts further out
    // for the craftsmanship column, then comes back to centre for the CTA
    const back = smoothstep(3.6, 4.6, p)
    const aside = smoothstep(1.7, 2.7, p)
    const x = k * (1.45 + 0.32 * aside - 1.77 * back)
    const y = k * (0.3 - 0.28 * smoothstep(0, 1, p) + 0.22 * back)
    const s = k * (0.82 - 0.16 * aside + 0.12 * back)

    easing.damp3(rig.current.position, [x, y, 0], 0.45, delta)
    easing.damp3(rig.current.scale, [s, s, s], 0.45, delta)

    // a slow, jewellery-case turn, nudged by the pointer
    spin.current.rotation.y += delta * 0.22
    easing.dampE(
      rig.current.rotation,
      [state.pointer.y * 0.18 - 0.06, state.pointer.x * 0.35, 0],
      0.6,
      delta,
    )
  })

  return (
    <group ref={rig}>
      <CubeCamera resolution={256} frames={1} envMap={envMap}>
        {(texture) => (
          <group ref={spin}>
            <Caustics
              causticsOnly={false}
              backside={false}
              frames={Infinity}
              resolution={256}
              color="#ffd9a0"
              position={[0, -1.9, 0]}
              lightSource={[3.5, 6, 2.5]}
              worldRadius={0.09}
              ior={1.75}
              intensity={0.12}
            >
              {/* Caustics is a group anchored on its catcher plane, so the stone
                  has to be lifted back up out of it — same trick the demo uses. */}
              <mesh geometry={brilliant} scale={1.15} position={[0, 1.92, 0]}>
                <MeshRefractionMaterial
                  envMap={texture}
                  bounces={3}
                  ior={2.42}
                  fresnel={0.9}
                  aberrationStrength={0.025}
                  color="#ffffff"
                  fastChroma={false}
                  toneMapped={false}
                />
              </mesh>
            </Caustics>

            {/* satellite stones — emerald cuts, so the trio doesn't read as clones */}
            <Float speed={1.4} rotationIntensity={0.6} floatIntensity={0.7}>
              <mesh geometry={stepCut} scale={0.4} position={[-1.5, 1.05, -0.5]}>
                <MeshRefractionMaterial
                  envMap={texture}
                  bounces={2}
                  ior={2.1}
                  fresnel={0.6}
                  aberrationStrength={0.02}
                  color="#ffeccf"
                  toneMapped={false}
                />
              </mesh>
            </Float>
            <Float speed={1.1} rotationIntensity={0.5} floatIntensity={0.6}>
              <mesh
                geometry={stepCut}
                scale={0.3}
                position={[1.45, -1.0, -0.3]}
                rotation={[0.4, 0.9, 0.2]}
              >
                <MeshRefractionMaterial
                  envMap={texture}
                  bounces={2}
                  ior={2.0}
                  fresnel={0.6}
                  aberrationStrength={0.03}
                  color="#e9f0ff"
                  toneMapped={false}
                />
              </mesh>
            </Float>

            {/* the setting: a brushed yellow-gold band, tilted off axis */}
            <Float speed={0.8} rotationIntensity={0.3} floatIntensity={0.4}>
              <mesh rotation={[Math.PI / 2.4, 0.4, 0]} position={[0, -0.05, -0.8]}>
                <torusGeometry args={[1.6, 0.05, 20, 140]} />
                <meshStandardMaterial
                  color="#c8a45c"
                  metalness={1}
                  roughness={0.18}
                  envMapIntensity={1.6}
                />
              </mesh>
            </Float>
          </group>
        )}
      </CubeCamera>
    </group>
  )
}

/**
 * Emissive strips parked behind the camera. They never appear on screen, but
 * the cube camera films them, so they show up as long specular streaks inside
 * the stone — the trick `<Lightformer>` pulls inside an <Environment>.
 */
function StudioStrips() {
  return (
    <group>
      <mesh position={[-3.6, 2.4, 7.5]} rotation={[0, -0.5, 0.35]}>
        <planeGeometry args={[1.1, 7]} />
        <meshBasicMaterial color="#fff6e6" toneMapped={false} />
      </mesh>
      <mesh position={[4.2, 1.2, 7]} rotation={[0, 0.6, -0.25]}>
        <planeGeometry args={[0.7, 6]} />
        <meshBasicMaterial color="#ffd9a3" toneMapped={false} />
      </mesh>
      <mesh position={[0, 5.5, 4]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[9, 3]} />
        <meshBasicMaterial color="#cfe0ff" toneMapped={false} />
      </mesh>
    </group>
  )
}

export function Experience() {
  const scroll = useScrollOffset()
  const [degraded, degrade] = useState(false)
  const envMap = useMemo(() => getEnvironmentTexture(), [])

  return (
    <Canvas
      className="canvas"
      dpr={[1, degraded ? 1.2 : 1.85]}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0.35, 7], fov: 30 }}
    >
      <PerformanceMonitor onDecline={() => degrade(true)} />
      <color attach="background" args={['#08080b']} />
      <fog attach="fog" args={['#08080b', 11, 22]} />

      <Environment map={envMap} environmentIntensity={1} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[3.5, 6, 2.5]} intensity={1.4} color="#fff2dd" />

      <StudioStrips />
      <Jewels scroll={scroll} />

      <Sparkles count={38} scale={[11, 7, 5]} size={1.6} speed={0.25} opacity={0.5} color="#ffe9c2" />

      <EffectComposer multisampling={degraded ? 0 : 4} enableNormalPass={false}>
        <Bloom mipmapBlur luminanceThreshold={0.85} luminanceSmoothing={0.35} intensity={0.9} levels={7} />
        <Vignette offset={0.32} darkness={0.75} />
      </EffectComposer>
    </Canvas>
  )
}
