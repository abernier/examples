import * as THREE from 'three'
import { useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  Environment,
  Lightformer,
  Float,
  MeshTransmissionMaterial,
  MeshReflectorMaterial,
  PerformanceMonitor,
  Preload,
} from '@react-three/drei'
import {
  EffectComposer,
  GodRays,
  Bloom,
  ChromaticAberration,
  Vignette,
} from '@react-three/postprocessing'
import { easing } from 'maath'

import { AuroraMaterial } from './AuroraMaterial'
import { view } from './viewport'

/* -------------------------------------------------------------------------- */
/*  Aurora ribbons — custom shaderMaterial curtains                            */
/* -------------------------------------------------------------------------- */

function Ribbon({
  seed = 0,
  colorLow = '#0d6f92',
  colorHigh = '#7cffd4',
  opacity = 0.9,
  bend = 1,
  size = [64, 26],
  ...props
}) {
  const ref = useRef(null)
  useFrame((state) => {
    if (!ref.current) return
    ref.current.uTime = state.clock.elapsedTime
    // the curtains swell as the hero scrolls away and calm down again deeper
    // in the page, so the background reads as a single continuous night
    ref.current.uIntensity = 0.75 + view.hero * 0.5 - view.progress * 0.35
  })
  return (
    <mesh frustumCulled={false} {...props}>
      <planeGeometry args={[size[0], size[1], 96, 24]} />
      <auroraMaterial
        key={AuroraMaterial.key}
        ref={ref}
        uSeed={seed}
        uOpacity={opacity}
        uBend={bend}
        uColorLow={new THREE.Color(colorLow)}
        uColorHigh={new THREE.Color(colorHigh)}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  )
}

function Sky() {
  const group = useRef(null)
  useFrame((state, delta) => {
    if (!group.current) return
    // parallax: the sky drifts a fraction of the camera rig
    easing.damp(group.current.rotation, 'y', view.px * 0.05, 0.6, delta)
  })
  return (
    <group ref={group}>
      <Ribbon
        seed={0.12}
        position={[0, 7.5, -26]}
        rotation={[0, 0, 0.05]}
        size={[80, 30]}
        colorLow="#0b4f7a"
        colorHigh="#63e8ff"
        opacity={0.75}
        bend={1.35}
      />
      <Ribbon
        seed={0.47}
        position={[-6, 5.4, -20]}
        rotation={[0, 0.12, -0.09]}
        size={[62, 26]}
        colorLow="#0f7a6d"
        colorHigh="#8dffc7"
        opacity={0.95}
        bend={1}
      />
      <Ribbon
        seed={0.81}
        position={[9, 6.2, -16]}
        rotation={[0, -0.18, 0.11]}
        size={[54, 24]}
        colorLow="#2b2f8a"
        colorHigh="#b79bff"
        opacity={0.7}
        bend={0.8}
      />
      <Ribbon
        seed={0.33}
        position={[2, 3.2, -11]}
        rotation={[0, 0.05, -0.04]}
        size={[46, 18]}
        colorLow="#0a5f74"
        colorHigh="#5ff0d8"
        opacity={0.5}
        bend={0.55}
      />
    </group>
  )
}

/* -------------------------------------------------------------------------- */
/*  Ice motes — instanced drifting particles                                   */
/* -------------------------------------------------------------------------- */

const dummy = new THREE.Object3D()

function Motes({ count = 420 }) {
  const ref = useRef(null)
  const motes = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: THREE.MathUtils.randFloatSpread(34),
        y: THREE.MathUtils.randFloatSpread(20),
        z: THREE.MathUtils.randFloatSpread(22) - 4,
        speed: 0.06 + Math.random() * 0.22,
        phase: Math.random() * Math.PI * 2,
        scale: 0.5 + Math.random() * 1.6,
      })),
    [count]
  )

  useFrame((state, delta) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i]
      m.y -= m.speed * delta
      if (m.y < -10) m.y = 10
      dummy.position.set(m.x + Math.sin(t * 0.3 + m.phase) * 0.6, m.y, m.z)
      dummy.rotation.set(t * 0.2 + m.phase, t * 0.15, 0)
      dummy.scale.setScalar(m.scale)
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
    }
    ref.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
      <octahedronGeometry args={[0.05, 0]} />
      <meshBasicMaterial color="#cbf3ff" toneMapped={false} fog={false} transparent opacity={0.75} />
    </instancedMesh>
  )
}

/* -------------------------------------------------------------------------- */
/*  The product — glass halo with a living core                                */
/* -------------------------------------------------------------------------- */

function Device(props) {
  const group = useRef(null)
  const inner = useRef(null)
  const core = useRef(null)

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    if (group.current) {
      // scroll spins the halo a little under a full turn across the page
      easing.damp(group.current.rotation, 'y', -0.35 + view.progress * 4.4, 0.5, delta)
      easing.damp(group.current.rotation, 'x', 0.18 + view.py * 0.12 - view.progress * 0.35, 0.6, delta)
      easing.damp(group.current.position, 'y', -0.1 + Math.sin(t * 0.5) * 0.08, 0.4, delta)
    }
    if (inner.current) inner.current.rotation.z = -t * 0.35
    if (core.current) {
      // the core breathes on a slow 12s "dusk" cycle
      const pulse = 0.82 + Math.sin(t * 0.52) * 0.18
      core.current.material.opacity = pulse
      core.current.scale.setScalar(0.98 + Math.sin(t * 0.52) * 0.03)
    }
  })

  return (
    <group ref={group} {...props}>
      {/* outer glass halo */}
      <mesh>
        <torusGeometry args={[1.72, 0.33, 40, 128]} />
        <MeshTransmissionMaterial
          samples={4}
          resolution={256}
          transmission={1}
          thickness={0.55}
          roughness={0.05}
          ior={1.42}
          chromaticAberration={0.07}
          anisotropicBlur={0.2}
          distortion={0.22}
          distortionScale={0.35}
          temporalDistortion={0.08}
          color="#cdeeff"
          attenuationColor="#5fd8ff"
          attenuationDistance={2.4}
          background={new THREE.Color('#050a16')}
        />
      </mesh>

      {/* inner diffuser disc */}
      <mesh ref={inner} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.44, 1.44, 0.09, 96]} />
        <meshPhysicalMaterial
          color="#9fd8f2"
          roughness={0.22}
          metalness={0}
          transmission={0.92}
          thickness={0.35}
          ior={1.3}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>

      {/* emissive core — the light itself */}
      <mesh ref={core}>
        <sphereGeometry args={[0.86, 48, 48]} />
        <meshBasicMaterial color="#a8f4ff" toneMapped={false} transparent opacity={0.9} />
      </mesh>

      {/* machined collar */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <torusGeometry args={[1.995, 0.04, 16, 128]} />
        <meshStandardMaterial color="#5d708c" roughness={0.25} metalness={1} envMapIntensity={2.5} />
      </mesh>

      {/* stem + base */}
      <mesh position={[0, -2.35, 0]}>
        <cylinderGeometry args={[0.075, 0.075, 1.4, 24]} />
        <meshStandardMaterial color="#4c5f78" roughness={0.3} metalness={1} envMapIntensity={2} />
      </mesh>
      <mesh position={[0, -3.02, 0]}>
        <cylinderGeometry args={[1.05, 1.15, 0.1, 64]} />
        <meshStandardMaterial color="#2c3a4d" roughness={0.35} metalness={0.9} />
      </mesh>
    </group>
  )
}

/* -------------------------------------------------------------------------- */
/*  Studio — a declarative, live environment map built from Lightformers       */
/* -------------------------------------------------------------------------- */

function Studio({ frames = Infinity }) {
  const drift = useRef(null)
  useFrame((state, delta) => {
    if (drift.current) drift.current.rotation.y += delta * 0.12
  })
  return (
    <Environment frames={frames} resolution={128}>
      {/* the sky the glass "sees" */}
      <mesh scale={80}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#060b18" side={THREE.BackSide} />
      </mesh>

      {/* cold key from above */}
      <Lightformer
        intensity={1.1}
        rotation-x={Math.PI / 2}
        position={[0, 6, -3]}
        scale={[12, 12, 1]}
        color="#dff3ff"
      />
      {/* teal rim, left */}
      <Lightformer
        form="rect"
        intensity={4}
        rotation-y={Math.PI / 2}
        position={[-6, 0.6, 0]}
        scale={[16, 2.2, 1]}
        color="#3ee6c8"
      />
      {/* indigo rim, right */}
      <Lightformer
        form="rect"
        intensity={3.2}
        rotation-y={-Math.PI / 2}
        position={[6, -0.4, 0]}
        scale={[16, 1.6, 1]}
        color="#7b6cff"
      />
      {/* rotating accents so the envmap is genuinely live */}
      <group ref={drift}>
        <Lightformer form="ring" intensity={2.4} scale={7} position={[-8, 3, -6]} color="#63e8ff" />
        <Lightformer form="circle" intensity={1.8} scale={5} position={[7, 4, -7]} color="#a8ffe4" />
      </group>
      <Float speed={2.4} floatIntensity={2.4} rotationIntensity={1.6}>
        <Lightformer form="ring" intensity={2.6} scale={9} position={[0, -5, -9]} color="#2f7fff" />
      </Float>
    </Environment>
  )
}

/* -------------------------------------------------------------------------- */
/*  Camera rig                                                                 */
/* -------------------------------------------------------------------------- */

function Rig() {
  useFrame((state, delta) => {
    const p = view.progress
    easing.damp3(
      state.camera.position,
      [view.px * 1.7, 0.5 + view.py * 0.7 + p * 2.6, 13.5 - p * 4.2],
      0.5,
      delta
    )
    state.camera.lookAt(0, 0.35 + p * 1.1, 0)
  })
  return null
}

/* -------------------------------------------------------------------------- */
/*  Post FX                                                                    */
/* -------------------------------------------------------------------------- */

function Effects({ sun, degraded }) {
  const offset = useMemo(() => new THREE.Vector2(0.0007, 0.0011), [])
  if (!sun) return null
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <GodRays
        sun={sun}
        density={0.94}
        decay={0.93}
        weight={0.5}
        exposure={0.28}
        samples={degraded ? 30 : 60}
        clampMax={1}
        blur
      />
      <Bloom mipmapBlur luminanceThreshold={0.55} luminanceSmoothing={0.2} intensity={1.15} levels={8} />
      <ChromaticAberration offset={offset} radialModulation={false} modulationOffset={0} />
      <Vignette offset={0.22} darkness={0.92} />
    </EffectComposer>
  )
}

/* -------------------------------------------------------------------------- */

export default function Scene() {
  const [sun, setSun] = useState(null)
  const [degraded, degrade] = useState(false)

  return (
    <Canvas
      dpr={[1, degraded ? 1.2 : 1.75]}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0.5, 13.5], fov: 34, near: 0.5, far: 90 }}
    >
      <color attach="background" args={['#04060d']} />
      <fog attach="fog" args={['#04060d', 22, 68]} />

      <ambientLight intensity={0.35 * Math.PI} />
      <directionalLight position={[-6, 8, 4]} intensity={0.7} color="#bfe6ff" />

      <Sky />
      <Motes />

      {/* the horizon glow that feeds the god rays */}
      <mesh ref={setSun} position={[0, 1.6, -34]}>
        <sphereGeometry args={[3.4, 32, 32]} />
        <meshBasicMaterial color="#5fd9ff" toneMapped={false} fog={false} />
      </mesh>

      <Float speed={1.1} rotationIntensity={0.25} floatIntensity={0.6}>
        <Device position={[0, 0.2, 0]} />
      </Float>

      {/* black-ice floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.15, 0]}>
        <planeGeometry args={[90, 90]} />
        <MeshReflectorMaterial
          blur={[380, 90]}
          resolution={degraded ? 256 : 512}
          mixBlur={1}
          mixStrength={38}
          mixContrast={1.1}
          roughness={1}
          depthScale={1.2}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#050a14"
          metalness={0.85}
          mirror={0.55}
        />
      </mesh>

      <Studio frames={degraded ? 1 : Infinity} />
      <PerformanceMonitor onDecline={() => degrade(true)} />
      <Rig />
      <Effects sun={sun} degraded={degraded} />
      <Preload all />
    </Canvas>
  )
}
