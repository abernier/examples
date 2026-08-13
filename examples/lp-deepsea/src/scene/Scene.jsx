import * as THREE from 'three'
import { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer, PerformanceMonitor, Preload } from '@react-three/drei'
import { EffectComposer, Bloom, DepthOfField, Noise, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { easing } from 'maath'

import { Submersible } from './Submersible'
import { Seabed } from './Seabed'
import { MarineSnow, Bioluminescence } from './MarineSnow'
import { pageScroll } from './scroll'

/**
 * Camera rig driven by document scroll instead of <ScrollControls>, so the page
 * keeps native sticky/anchor behaviour. Damping is maath's easing.damp3, the
 * same rig shape used by the pmndrs "volumetric-light-godray" demo.
 */
const FRAMING = [
  [0.0, -1.3],
  [0.1, -1.3],
  [0.24, 1.9],
  [0.66, 1.9],
  [0.84, 0],
  [1.0, 0],
]

const smooth = (x) => x * x * (3 - 2 * x)

function framing(t) {
  for (let i = 1; i < FRAMING.length; i++) {
    const [t1, v1] = FRAMING[i]
    if (t <= t1) {
      const [t0, v0] = FRAMING[i - 1]
      const k = t1 === t0 ? 1 : smooth((t - t0) / (t1 - t0))
      return v0 + (v1 - v0) * k
    }
  }
  return 0
}

const UP = new THREE.Vector3(0, 1, 0)

function ScrollRig() {
  const target = useRef(new THREE.Vector3())
  const goal = useRef(new THREE.Vector3())
  const right = useRef(new THREE.Vector3())
  useFrame((state, delta) => {
    const t = pageScroll.offset
    const px = state.pointer.x
    const py = state.pointer.y
    const portrait = state.size.width < state.size.height * 1.05

    // three staged vantage points: face-on -> orbit low -> pull back and up
    const orbit = t * Math.PI * 0.85
    const pull = portrait ? 2.6 : 0
    const radius = 7.4 + pull - Math.sin(t * Math.PI) * 1.6 + t * 2.4
    const x = Math.sin(orbit) * radius + px * 0.7
    const z = Math.cos(orbit) * radius
    const y = 0.55 + Math.sin(t * Math.PI) * 1.35 + t * 0.9 + py * 0.45

    // Framing follows the layout: hero copy owns the left half (vessel right),
    // the feature/spec columns own the right (vessel left), then it recentres.
    const offX = portrait ? 0 : framing(t)

    easing.damp3(state.camera.position, [x, y, z], 0.55, delta)

    // shift the look-at along the camera's own right vector, so the framing
    // holds no matter where the orbit currently is (a world-X offset would not)
    right.current.set(-x, 0, -z).cross(UP).normalize()
    goal.current.set(right.current.x * offX, -0.15 - t * 0.35, right.current.z * offX)
    easing.damp3(target.current, goal.current, 0.55, delta)
    state.camera.lookAt(target.current)
  })
  return null
}

function Water() {
  return (
    <>
      <color attach="background" args={['#02080c']} />
      <fogExp2 attach="fog" args={['#040f16', 0.082]} />
      <ambientLight intensity={0.22} color="#2b7f9c" />
      <hemisphereLight args={['#0c4256', '#01070a', 0.75]} />
      {/* the cold shaft from far above */}
      <spotLight
        position={[-3.5, 11, -2.5]}
        angle={0.55}
        penumbra={1}
        decay={1.4}
        distance={40}
        intensity={220}
        color="#8fe6ff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
      />
      <pointLight position={[5, 1.5, 4]} distance={18} decay={2} intensity={22} color="#0f5f7d" />
      <pointLight position={[-6, -1, -4]} distance={20} decay={2} intensity={16} color="#123b57" />
    </>
  )
}

/** Custom, fully offline environment map — Lightformers, no remote HDRI. */
function DeepEnv() {
  return (
    <Environment resolution={256}>
      {/* surface light, far above */}
      <Lightformer
        intensity={6}
        color="#a9efff"
        rotation-x={Math.PI / 2}
        position={[0, 9, 0]}
        scale={[14, 14, 1]}
      />
      {/* cold rim bars */}
      <Lightformer intensity={2.4} color="#3fd0f0" rotation-y={Math.PI / 2} position={[-7, 1, 0]} scale={[24, 3, 1]} />
      <Lightformer intensity={1.6} color="#1c7ea1" rotation-y={-Math.PI / 2} position={[7, 0.5, 0]} scale={[24, 2, 1]} />
      {/* warm titanium kicker so the metal is not monochrome */}
      <Lightformer intensity={0.9} color="#7a6a53" form="ring" position={[3, 3, -6]} scale={[6, 6, 1]} />
      <Lightformer intensity={1.2} color="#0a2b3a" position={[0, -6, 0]} rotation-x={-Math.PI / 2} scale={[20, 20, 1]} />
    </Environment>
  )
}

export function Scene() {
  const [degraded, degrade] = useState(false)

  return (
    <Canvas
      shadows
      dpr={[1, degraded ? 1 : 1.75]}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0.9, 7.4], fov: 34, near: 0.5, far: 60 }}
      eventSource={typeof document !== 'undefined' ? document.getElementById('root') : undefined}
      eventPrefix="client"
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.15
      }}
    >
      <PerformanceMonitor onDecline={() => degrade(true)} />
      <Water />
      <Suspense fallback={null}>
        {/* vessel sits at y=0.35, seabed silt at y=-2.05 — the caustics catcher
            plane is dropped to y=-2.015 world, just clear of the silt */}
        <Submersible position={[0, 0.35, 0]} causticsY={-2.365} />
        <Seabed y={-2.05} />
        <MarineSnow count={degraded ? 160 : 340} />
        <Bioluminescence count={degraded ? 14 : 26} />
        <DeepEnv />
        <Preload all />
      </Suspense>
      <ScrollRig />
      <EffectComposer multisampling={0}>
        <DepthOfField focusDistance={0.026} focalLength={0.085} bokehScale={2.6} height={360} />
        <Bloom mipmapBlur luminanceThreshold={0.5} luminanceSmoothing={0.28} intensity={0.62} radius={0.72} />
        <Noise premultiply blendFunction={BlendFunction.ADD} opacity={0.055} />
        <Vignette offset={0.18} darkness={1.15} eskil={false} />
      </EffectComposer>
    </Canvas>
  )
}
