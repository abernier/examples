import * as THREE from 'three'
import { Suspense, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  AccumulativeShadows,
  Backdrop,
  Environment,
  Float,
  GradientTexture,
  Instance,
  Instances,
  Lightformer,
  MeshTransmissionMaterial,
  PerformanceMonitor,
  RandomizedLight,
  Sparkles,
} from '@react-three/drei'
import { EffectComposer, N8AO, Bloom, Vignette, SMAA } from '@react-three/postprocessing'
import { easing } from 'maath'

import { vesselGeometry } from './pottery.js'
import { clayMaps, GLAZES } from './clay.js'
import { viewport } from '../lib/viewport.js'

/* ------------------------------------------------------------------ *
 * Camera rig — scroll-keyed, critically damped
 * ------------------------------------------------------------------ */

const KEYFRAMES = [
  { t: 0.0, pos: [0.62, 0.86, 2.35], look: [0.02, 0.3, 0.0] },
  { t: 0.2, pos: [-1.18, 0.4, 1.72], look: [-0.02, 0.21, 0.02] },
  { t: 0.42, pos: [1.24, 1.28, 1.62], look: [0.06, 0.26, -0.05] },
  { t: 0.62, pos: [0.5, 0.3, 1.2], look: [0.24, 0.13, 0.4] },
  { t: 0.82, pos: [-0.72, 0.78, 2.0], look: [-0.05, 0.28, 0.0] },
  { t: 1.0, pos: [0.05, 1.32, 2.95], look: [0.0, 0.26, 0.0] },
]

const smoothstep = (x) => x * x * (3 - 2 * x)

function sampleTrack(t, outPos, outLook) {
  let i = 0
  while (i < KEYFRAMES.length - 2 && t > KEYFRAMES[i + 1].t) i++
  const a = KEYFRAMES[i]
  const b = KEYFRAMES[i + 1]
  const k = smoothstep(THREE.MathUtils.clamp((t - a.t) / (b.t - a.t), 0, 1))
  outPos.set(
    THREE.MathUtils.lerp(a.pos[0], b.pos[0], k),
    THREE.MathUtils.lerp(a.pos[1], b.pos[1], k),
    THREE.MathUtils.lerp(a.pos[2], b.pos[2], k)
  )
  outLook.set(
    THREE.MathUtils.lerp(a.look[0], b.look[0], k),
    THREE.MathUtils.lerp(a.look[1], b.look[1], k),
    THREE.MathUtils.lerp(a.look[2], b.look[2], k)
  )
}

const UP = new THREE.Vector3(0, 1, 0)

function Rig() {
  const goalPos = useMemo(() => new THREE.Vector3(), [])
  const goalLook = useMemo(() => new THREE.Vector3(), [])
  const forward = useMemo(() => new THREE.Vector3(), [])
  const right = useMemo(() => new THREE.Vector3(), [])
  const look = useRef(new THREE.Vector3(0, 0.3, 0))

  useFrame((state, delta) => {
    const narrow = state.size.width < 900
    sampleTrack(viewport.progress, goalPos, goalLook)

    // Narrow viewports pull back and re-centre.
    if (narrow) {
      goalPos.multiplyScalar(1.3)
      goalPos.y = Math.max(goalPos.y, 0.32)
    } else {
      // Wide viewports slide the whole frame left along the camera's own right
      // axis, so the still life sits in the right third and the editorial
      // column keeps its air. Proportional to distance, so the close-ups on the
      // glass don't shove it off screen.
      forward.subVectors(goalLook, goalPos)
      const dist = forward.length()
      right.crossVectors(forward.normalize(), UP).normalize().multiplyScalar(-0.24 * dist)
      goalPos.add(right)
      goalLook.add(right)
    }

    // A breath of pointer parallax — never enough to feel like a toy.
    goalPos.x += viewport.pointer.x * (narrow ? 0.02 : 0.08)
    goalPos.y += viewport.pointer.y * (narrow ? 0.01 : 0.045)

    easing.damp3(state.camera.position, goalPos, 0.55, delta)
    easing.damp3(look.current, goalLook, 0.5, delta)
    state.camera.lookAt(look.current)
  })

  return null
}

/* ------------------------------------------------------------------ *
 * Clay
 * ------------------------------------------------------------------ */

function Vessel({ profile, glaze = 'ochre', rings, ...props }) {
  const maps = clayMaps()
  const geometry = useMemo(
    () => vesselGeometry(profile, rings === undefined ? {} : { throwRings: rings }),
    [profile, rings]
  )
  const g = GLAZES[glaze]
  return (
    <mesh geometry={geometry} castShadow receiveShadow {...props}>
      <meshStandardMaterial
        color={g.color}
        roughness={g.roughness}
        metalness={0}
        bumpMap={maps.bump}
        bumpScale={g.bumpScale}
        roughnessMap={maps.roughness}
        envMapIntensity={0.85}
      />
    </mesh>
  )
}

/** The one glossy piece: blown glass beside all that chalk. */
function GlassVessel(props) {
  const geometry = useMemo(() => vesselGeometry('glass', { throwRings: 0, segments: 96 }), [])
  return (
    <mesh geometry={geometry} castShadow {...props}>
      <MeshTransmissionMaterial
        samples={6}
        resolution={256}
        thickness={0.28}
        roughness={0.03}
        anisotropicBlur={0.05}
        chromaticAberration={0.05}
        distortion={0.08}
        distortionScale={0.28}
        temporalDistortion={0.02}
        ior={1.46}
        color="#f6efe2"
        attenuationColor="#e7c9a1"
        attenuationDistance={0.8}
      />
    </mesh>
  )
}

/* ------------------------------------------------------------------ *
 * Drying shelf — one draw call for the whole wall of beakers
 * ------------------------------------------------------------------ */

const SHELF_ROWS = [
  { y: 0.44, z: -0.98, count: 9 },
  { y: 0.86, z: -1.12, count: 8 },
]

function Shelf() {
  const maps = clayMaps()
  const geometry = useMemo(() => vesselGeometry('cup', { segments: 40 }), [])
  const cups = useMemo(() => {
    const out = []
    let seed = 7
    const rand = () => {
      seed = (seed * 16807) % 2147483647
      return seed / 2147483647
    }
    for (const row of SHELF_ROWS) {
      for (let i = 0; i < row.count; i++) {
        const spread = 0.185
        out.push({
          position: [
            (i - (row.count - 1) / 2) * spread + (rand() - 0.5) * 0.02,
            row.y,
            row.z + (rand() - 0.5) * 0.03,
          ],
          rotation: [0, rand() * Math.PI * 2, 0],
          scale: 0.86 + rand() * 0.3,
          color: ['#c8763a', '#cdae86', '#e6d7bf', '#8a7358'][Math.floor(rand() * 4)],
        })
      }
    }
    return out
  }, [])

  return (
    <group>
      {SHELF_ROWS.map((row) => (
        <mesh key={row.y} position={[-0.02, row.y - 0.021, row.z]} receiveShadow>
          <boxGeometry args={[2.1, 0.038, 0.24]} />
          <meshStandardMaterial color="#7c5a3d" roughness={0.92} metalness={0} />
        </mesh>
      ))}
      <Instances limit={40} range={cups.length} geometry={geometry} castShadow={false}>
        <meshStandardMaterial
          roughness={0.93}
          metalness={0}
          bumpMap={maps.bump}
          bumpScale={0.2}
          envMapIntensity={0.7}
        />
        {cups.map((cup, i) => (
          <Instance key={i} {...cup} />
        ))}
      </Instances>
    </group>
  )
}

/* ------------------------------------------------------------------ *
 * Light — a south window, a whitewashed ceiling, a warm bounce
 * ------------------------------------------------------------------ */

function KilnLight({ degraded }) {
  return (
    <Environment frames={degraded ? 1 : Infinity} resolution={degraded ? 128 : 256}>
      {/* The window: tall, warm, slightly to the left — 10am light */}
      <Lightformer
        form="rect"
        intensity={3.4}
        color="#ffe0b3"
        position={[-2.6, 1.35, 0.9]}
        rotation-y={Math.PI / 2}
        scale={[2.6, 2.2, 1]}
      />
      <Lightformer
        form="rect"
        intensity={1.5}
        color="#ffd6a2"
        position={[-2.55, 0.35, -0.6]}
        rotation-y={Math.PI / 2}
        scale={[1.6, 1.2, 1]}
      />
      {/* Limewashed ceiling */}
      <Lightformer
        form="rect"
        intensity={0.9}
        color="#fff4e4"
        position={[0, 3.2, 0]}
        rotation-x={Math.PI / 2}
        scale={[6, 6, 1]}
      />
      {/* Floor bounce off the terracotta tiles */}
      <Lightformer
        form="rect"
        intensity={0.75}
        color="#b96a34"
        position={[0, -1.4, 0.6]}
        rotation-x={-Math.PI / 2}
        scale={[6, 5, 1]}
      />
      {/* Cool fill from the courtyard door, keeps the shadows from going muddy */}
      <Lightformer
        form="rect"
        intensity={0.5}
        color="#cfd8e6"
        position={[2.9, 1.0, -0.8]}
        rotation-y={-Math.PI / 2}
        scale={[2.4, 2.0, 1]}
      />
      {/* Accent: a slow ring of kiln-glow drifting behind the shelf */}
      <Float speed={1.4} floatIntensity={2.2} rotationIntensity={1.4}>
        <Lightformer
          form="ring"
          color="#ff7a2f"
          intensity={1.2}
          scale={2.4}
          position={[-1.9, 1.2, -3.4]}
          target={[0, 0, 0]}
        />
      </Float>
      {/* The room itself */}
      <mesh scale={30}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial side={THREE.BackSide}>
          <GradientTexture
            stops={[0, 0.45, 0.72, 1]}
            colors={['#8a5a34', '#d8b088', '#f5e6d2', '#efdcc4']}
            size={256}
          />
        </meshBasicMaterial>
      </mesh>
    </Environment>
  )
}

/* ------------------------------------------------------------------ *
 * Scene
 * ------------------------------------------------------------------ */

function Scene({ degraded, setDegraded }) {
  // The first couple of seconds are spent baking 80 shadow frames, which will
  // trip any frame-rate monitor. Only listen once the studio has settled.
  const mounted = useRef(typeof performance !== 'undefined' ? performance.now() : 0)
  const onDecline = () => {
    if (performance.now() - mounted.current > 6000) setDegraded(true)
  }

  return (
    <>
      <PerformanceMonitor onDecline={onDecline} />

      <color attach="background" args={['#f3e9da']} />
      <fog attach="fog" args={['#f0e2cd', 3.4, 9]} />

      <ambientLight intensity={0.35} />
      <directionalLight
        position={[-2.6, 2.4, 1.4]}
        intensity={1.15}
        color="#ffdfb5"
        castShadow={false}
      />

      <Rig />
      <KilnLight degraded={degraded} />

      {/* Limewashed studio wall */}
      <Backdrop
        floor={1.6}
        segments={24}
        position={[0, -0.001, -2.1]}
        scale={[14, 4.2, 3.4]}
        receiveShadow
      >
        <meshStandardMaterial color="#e9dac1" roughness={1} metalness={0} />
      </Backdrop>

      <Shelf />

      {/* The still life — a plan laid out so no two footprints touch */}
      <group position={[0, 0, 0]}>
        <Vessel profile="cup" glaze="ash" position={[-0.7, 0, -0.02]} rotation-y={2.4} scale={0.92} />
        <Vessel profile="carafe" glaze="bone" position={[-0.44, 0, 0.14]} rotation-y={1.9} />
        <Vessel profile="amphora" glaze="sienna" position={[-0.06, 0, -0.16]} rotation-y={0.5} />
        <Vessel profile="cup" glaze="sand" position={[-0.14, 0, 0.26]} rotation-y={0.2} scale={1.1} />
        <Vessel profile="bowl" glaze="ochre" position={[0.46, 0, -0.02]} rotation-y={-0.8} />
        <GlassVessel position={[0.24, 0, 0.4]} rotation-y={-0.3} />
      </group>

      {/* Glaze test discs, drying on their wires */}
      <Float speed={1.1} rotationIntensity={0.35} floatIntensity={0.7} floatingRange={[-0.02, 0.05]}>
        <group position={[0.92, 0.72, -0.75]} rotation={[0.2, -0.5, 0.12]}>
          <mesh>
            <cylinderGeometry args={[0.075, 0.075, 0.012, 48]} />
            <meshStandardMaterial color="#c8763a" roughness={0.82} />
          </mesh>
          <mesh position={[0.19, -0.09, 0.05]} rotation={[0.1, 0.3, -0.2]}>
            <cylinderGeometry args={[0.06, 0.06, 0.012, 48]} />
            <meshStandardMaterial color="#8a7358" roughness={0.9} />
          </mesh>
        </group>
      </Float>

      {/* Dust in the window light */}
      <Sparkles
        count={48}
        scale={[3.2, 1.6, 2.2]}
        position={[0, 0.7, 0]}
        size={2.2}
        speed={0.22}
        opacity={0.45}
        color="#ffdcae"
      />

      {/* Soft-shadow bake: 80 jittered lights, then zero cost forever after */}
      <AccumulativeShadows
        temporal
        frames={80}
        scale={5.2}
        alphaTest={0.86}
        opacity={0.9}
        color="#5d2f16"
        colorBlend={1.6}
        resolution={1024}
        position={[0, 0.001, 0]}
      >
        <RandomizedLight
          amount={8}
          radius={2.6}
          ambient={0.55}
          intensity={Math.PI}
          position={[-2.4, 2.6, 1.4]}
          bias={0.001}
        />
      </AccumulativeShadows>

      {!degraded && (
        <EffectComposer multisampling={0}>
          <N8AO
            halfRes
            color="#3d1f0e"
            aoRadius={0.42}
            distanceFalloff={0.7}
            intensity={2.4}
            aoSamples={8}
            denoiseSamples={4}
          />
          <Bloom
            mipmapBlur
            luminanceThreshold={0.86}
            luminanceSmoothing={0.3}
            intensity={0.38}
          />
          <Vignette offset={0.24} darkness={0.42} />
          <SMAA />
        </EffectComposer>
      )}
    </>
  )
}

export default function Experience() {
  const [degraded, setDegraded] = useState(false)
  return (
    <Canvas
      shadows
      dpr={[1, degraded ? 1.2 : 1.75]}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      camera={{ position: [0.6, 0.9, 2.4], fov: 34, near: 0.1, far: 60 }}
      onCreated={(state) => {
        state.gl.toneMappingExposure = 1.02
      }}
    >
      <Suspense fallback={null}>
        <Scene degraded={degraded} setDegraded={setDegraded} />
      </Suspense>
    </Canvas>
  )
}
