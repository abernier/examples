import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { ThreeElements } from '@react-three/fiber'
import {
  BakeShadows,
  Environment,
  Lightformer,
  MeshReflectorMaterial,
  Sparkles,
} from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { easing } from 'maath'
import { Cabinet } from './Cabinet'
import type { CabinetSpec } from './Cabinet'
import { makeSignTexture } from '../lib/textures'

/* ------------------------------------------------------------------ *
 * The floor line-up
 * ------------------------------------------------------------------ */

type Placed = { spec: CabinetSpec; position: [number, number, number]; rotation: number }

const ROW: Placed[] = [
  {
    position: [-4.85, 0, -2.7],
    rotation: 0.62,
    spec: {
      title: 'Kraken Cove',
      accent: '#00f0ff',
      accent2: '#6bff8f',
      ink: '#6bff8f',
      ink2: '#00f0ff',
      variant: 3,
    },
  },
  {
    position: [-3.15, 0, -1.25],
    rotation: 0.42,
    spec: {
      title: 'Vector Runner',
      accent: '#b45cff',
      accent2: '#00f0ff',
      ink: '#00f0ff',
      ink2: '#ffffff',
      variant: 0,
    },
  },
  {
    position: [-1.6, 0, -0.28],
    rotation: 0.2,
    spec: {
      title: 'Nebula Strike',
      accent: '#00f0ff',
      accent2: '#ff2d95',
      ink: '#6bff8f',
      ink2: '#ffc700',
      variant: 1,
      glow: true,
    },
  },
  {
    position: [0, 0, 0.15],
    rotation: 0,
    spec: {
      title: 'Turbo Circuit',
      accent: '#ff2d95',
      accent2: '#ffc700',
      ink: '#ff2d95',
      ink2: '#ffc700',
      variant: 2,
      glow: true,
    },
  },
  {
    position: [1.6, 0, -0.28],
    rotation: -0.2,
    spec: {
      title: 'Pixel Punch II',
      accent: '#ffc700',
      accent2: '#ff2d95',
      ink: '#ff2d95',
      ink2: '#00f0ff',
      variant: 3,
      glow: true,
    },
  },
  {
    position: [3.15, 0, -1.25],
    rotation: -0.42,
    spec: {
      title: 'Midnight Motel',
      accent: '#6bff8f',
      accent2: '#b45cff',
      ink: '#ffc700',
      ink2: '#ff2d95',
      variant: 1,
    },
  },
  {
    position: [4.85, 0, -2.7],
    rotation: -0.62,
    spec: {
      title: 'Astro Diner',
      accent: '#ff2d95',
      accent2: '#00f0ff',
      ink: '#00f0ff',
      ink2: '#6bff8f',
      variant: 0,
    },
  },
]

/* ------------------------------------------------------------------ *
 * Synthwave backdrop — a single shader plane far behind the row.
 * Ignores fog on purpose so it reads as a lit horizon.
 * ------------------------------------------------------------------ */

const horizonVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const horizonFrag = /* glsl */ `
  precision highp float;
  uniform float uTime;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  void main() {
    vec2 p = vUv;
    float hy = 0.19;

    vec3 col = mix(vec3(0.16, 0.02, 0.24), vec3(0.01, 0.005, 0.05), smoothstep(hy, 0.9, p.y));

    // banded sun (uv is stretched 150x46, so x is corrected to keep it round)
    float d = length((p - vec2(0.435, hy + 0.1)) * vec2(3.26, 1.0));
    float sun = 1.0 - smoothstep(0.094, 0.1, d);
    float bands = step(0.4, fract((p.y - hy) * 90.0));
    vec3 sunCol = mix(vec3(1.5, 0.14, 0.6), vec3(1.4, 0.85, 0.1), smoothstep(hy, hy + 0.2, p.y));
    col += sun * bands * sunCol;

    // stars
    col += step(0.9965, hash(floor(p * vec2(420.0, 150.0)))) * step(hy + 0.16, p.y) * vec3(0.9, 0.85, 1.2);

    // perspective grid below the horizon
    if (p.y < hy) {
      float k = hy - p.y;
      float z = 0.32 / (k + 0.004);
      float xw = (p.x - 0.5) * z * 1.6;
      float gx = abs(fract(xw) - 0.5);
      float gz = abs(fract(z * 0.16 - uTime * 0.06) - 0.5);
      float w = 0.02 + k * 0.9;
      float g = (1.0 - smoothstep(0.0, w, gx)) + (1.0 - smoothstep(0.0, w * 1.4, gz));
      float fade = smoothstep(0.0, 0.035, k) * (1.0 - smoothstep(0.09, 0.185, k));
      col += g * fade * vec3(0.9, 0.11, 0.68);
    }

    // horizon flare
    col += vec3(1.2, 0.22, 0.9) * (1.0 - smoothstep(0.0, 0.012, abs(p.y - hy))) * 0.5;

    gl_FragColor = vec4(col, 1.0);
  }
`

function Horizon() {
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), [])
  useFrame((_, delta) => {
    uniforms.uTime.value += delta
  })
  return (
    <mesh position={[0, 16, -42]}>
      <planeGeometry args={[150, 46]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={horizonVert}
        fragmentShader={horizonFrag}
        toneMapped={false}
        fog={false}
        depthWrite={false}
      />
    </mesh>
  )
}

/* ------------------------------------------------------------------ *
 * Hanging shop sign
 * ------------------------------------------------------------------ */

function Sign(props: Omit<ThreeElements['group'], 'children'>) {
  const tex = useMemo(() => makeSignTexture(), [])
  const mat = useRef<THREE.MeshBasicMaterial>(null!)
  useFrame((state) => {
    if (!mat.current) return
    // lazy neon flicker
    const t = state.clock.elapsedTime
    const f = 0.86 + 0.14 * Math.sin(t * 2.1) + (Math.sin(t * 47.0) > 0.96 ? -0.35 : 0)
    mat.current.color.setRGB(2.1 * f, 1.0 * f, 1.9 * f)
  })
  return (
    <group {...props}>
      <mesh>
        <planeGeometry args={[4.2, 1.32]} />
        <meshBasicMaterial ref={mat} map={tex} transparent toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------ *
 * Slowly tumbling tokens
 * ------------------------------------------------------------------ */

const COIN_GEO = new THREE.CylinderGeometry(0.11, 0.11, 0.018, 18)
const coinMat = new THREE.MeshBasicMaterial({
  color: new THREE.Color('#ffc700').multiplyScalar(2.2),
  toneMapped: false,
})

function Coin({ position, phase }: { position: [number, number, number]; phase: number }) {
  const ref = useRef<THREE.Mesh>(null!)
  useFrame((state) => {
    const t = state.clock.elapsedTime + phase
    ref.current.rotation.x = Math.PI / 2
    ref.current.rotation.y = t * 1.2
    ref.current.position.y = position[1] + Math.sin(t * 0.8) * 0.16
  })
  return <mesh ref={ref} geometry={COIN_GEO} material={coinMat} position={position} />
}

/* ------------------------------------------------------------------ *
 * Camera
 * ------------------------------------------------------------------ */

function CameraRig() {
  useFrame((state, delta) => {
    const aspect = state.size.width / Math.max(1, state.size.height)
    const z = 7.6 * THREE.MathUtils.clamp(1.72 / aspect, 1, 1.9)
    const t = state.clock.elapsedTime
    easing.damp3(
      state.camera.position,
      [
        1.15 + state.pointer.x * 1.3 + Math.sin(t * 0.22) * 0.4,
        1.5 + state.pointer.y * 0.38 + Math.sin(t * 0.31) * 0.08,
        z,
      ],
      0.55,
      delta,
    )
    state.camera.lookAt(-0.55, 1.25, 0)
  })
  return null
}

/* ------------------------------------------------------------------ *
 * Scene
 * ------------------------------------------------------------------ */

export function Scene() {
  return (
    <>
      <color attach="background" args={['#05030e']} />
      <fog attach="fog" args={['#05030e', 11, 32]} />

      <hemisphereLight intensity={0.18} color="#8a6bff" groundColor="#080510" />
      <spotLight
        position={[6, 9, 6]}
        angle={0.5}
        penumbra={1}
        decay={0}
        intensity={0.9}
        castShadow
        shadow-mapSize={1024}
        shadow-bias={-0.0006}
      />
      <spotLight position={[-7, 6, 4]} angle={0.6} penumbra={1} decay={0} intensity={0.35} color="#ff2d95" />

      <Horizon />

      <group position={[0, -0.02, 0]}>
        {ROW.map((c, i) => (
          <Cabinet
            key={i}
            spec={c.spec}
            position={c.position}
            rotation={[0, c.rotation, 0]}
          />
        ))}

        {/* mirror floor */}
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[70, 70]} />
          <MeshReflectorMaterial
            blur={[380, 90]}
            resolution={1024}
            mixBlur={1}
            mixStrength={62}
            depthScale={1.1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            roughness={0.82}
            metalness={0.8}
            color="#0a0716"
          />
        </mesh>
      </group>

      <Sign position={[1.1, 4.1, -5.5]} />

      <Coin position={[-2.35, 2.5, 1.4]} phase={0} />
      <Coin position={[2.6, 2.15, 1.1]} phase={2.1} />
      <Coin position={[0.7, 3.1, -0.6]} phase={4.4} />

      <Sparkles count={70} scale={[16, 6, 8]} position={[0, 2.4, -0.5]} size={2.4} speed={0.22} color="#ff9de0" />

      {/* Rim light rig — Lightformers instead of a fetched HDRI so the page
          works with no network at all. */}
      <Environment resolution={128}>
        <group rotation={[-Math.PI / 3, 0, 0]}>
          <Lightformer form="rect" intensity={2.2} color="#ff2d95" position={[-4, 2, -3]} scale={[6, 3, 1]} />
          <Lightformer form="rect" intensity={2.0} color="#00f0ff" position={[4, 2, -3]} scale={[6, 3, 1]} />
          <Lightformer form="circle" intensity={1.6} color="#b45cff" position={[0, 5, -2]} scale={5} />
          <Lightformer form="rect" intensity={0.9} color="#ffffff" position={[0, -3, 2]} scale={[10, 4, 1]} />
        </group>
      </Environment>

      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur luminanceThreshold={0.85} luminanceSmoothing={0.14} intensity={1.25} radius={0.72} />
        <Vignette offset={0.26} darkness={0.72} />
      </EffectComposer>

      <CameraRig />
      <BakeShadows />
    </>
  )
}
