import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdaptiveDpr,
  Environment,
  Lightformer,
  PointMaterial,
  Points,
  Sparkles,
  Stars,
} from '@react-three/drei'
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import { LIGHT_DIR, Planet } from './Planet'
import { Nebula } from './Nebula'
import { Observatory } from './Observatory'
import { pointer, scroll } from '../lib/viewport'

const PLANET_POS: [number, number, number] = [3.1, 0.7, -2.2]

/**
 * Near-field dust, lifted straight from the pmndrs "gatsby-stars" demo
 * (drei <Points> + <PointMaterial>, rotated on two axes in useFrame). The
 * demo's maath `random.inSphere` is inlined here so the page pulls no extra
 * dependency.
 */
function Dust({ count = 1600, radius = 14 }: { count?: number; radius?: number }) {
  const ref = useRef<THREE.Points>(null!)

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      // Uniform sampling inside a sphere.
      let x = 0
      let y = 0
      let z = 0
      let d = 2
      while (d > 1 || d === 0) {
        x = Math.random() * 2 - 1
        y = Math.random() * 2 - 1
        z = Math.random() * 2 - 1
        d = x * x + y * y + z * z
      }
      const r = radius * Math.cbrt(Math.random())
      const len = Math.sqrt(d)
      arr[i * 3 + 0] = (x / len) * r
      arr[i * 3 + 1] = (y / len) * r
      arr[i * 3 + 2] = (z / len) * r
    }
    return arr
  }, [count, radius])

  useFrame((_, delta) => {
    ref.current.rotation.x -= delta / 34
    ref.current.rotation.y -= delta / 48
  })

  return (
    <group rotation={[0, 0, Math.PI / 5]}>
      <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#9fc6ff"
          size={0.035}
          sizeAttenuation
          depthWrite={false}
          opacity={0.75}
        />
      </Points>
    </group>
  )
}

/** Camera dolly driven by window scroll + a little pointer parallax. */
function Rig() {
  const target = useMemo(() => new THREE.Vector3(), [])
  const look = useMemo(() => new THREE.Vector3(), [])
  const current = useMemo(() => new THREE.Vector3(0.6, -0.1, -0.4), [])

  useFrame((state, delta) => {
    const s = scroll.hero
    const p = scroll.progress

    target.set(
      pointer.x * 0.75 - s * 1.4,
      -pointer.y * 0.5 + s * 2.6,
      9.4 + s * 5.2 + p * 1.5,
    )
    const damp = 1 - Math.pow(0.0015, delta)
    state.camera.position.lerp(target, damp)

    look.set(0.7 - s * 0.9, 0.25 - s * 2.2, -1)
    current.lerp(look, damp)
    state.camera.lookAt(current)
  })

  return null
}

function Lighting() {
  const key = useMemo(() => LIGHT_DIR.clone().multiplyScalar(24), [])
  return (
    <>
      <ambientLight intensity={0.12} />
      <directionalLight position={key} intensity={2.2} color="#d7e8ff" />
      {/* Red-light discipline: the only warm source on site. */}
      <pointLight position={[-3.4, -2.4, 3.2]} intensity={9} distance={11} decay={2} color="#ff3d2a" />
      <pointLight position={[6, 2, 4]} intensity={4} distance={20} decay={2} color="#3f7bd0" />

      {/* Declarative environment — Lightformers only, no HDR fetch. */}
      <Environment resolution={64} frames={1}>
        <mesh scale={60}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshBasicMaterial color="#05070f" side={THREE.BackSide} toneMapped={false} />
        </mesh>
        <Lightformer
          form="rect"
          intensity={2.4}
          color="#cfe4ff"
          position={[-6, 3, 4]}
          scale={[8, 8, 1]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="circle"
          intensity={1.6}
          color="#5f8fd6"
          position={[5, 1.5, -3]}
          scale={[5, 5, 1]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="ring"
          intensity={1.1}
          color="#ff4a2e"
          position={[0, -4, 2]}
          scale={[6, 6, 1]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="rect"
          intensity={0.35}
          color="#1a2740"
          rotation-x={Math.PI / 2}
          position={[0, 6, 0]}
          scale={[14, 14, 1]}
        />
      </Environment>
    </>
  )
}

function Effects() {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom
        mipmapBlur
        intensity={1.35}
        luminanceThreshold={0.18}
        luminanceSmoothing={0.24}
        radius={0.86}
        levels={7}
      />
      <Vignette offset={0.22} darkness={0.85} eskil={false} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  )
}

export function Scene() {
  return (
    <>
      <color attach="background" args={['#03050c']} />

      <Lighting />

      <Nebula />
      <Stars radius={140} depth={70} count={6000} factor={4.5} saturation={0} fade speed={0.6} />
      <Dust />
      <Sparkles
        count={110}
        scale={[20, 12, 10]}
        size={1.3}
        speed={0.22}
        opacity={0.4}
        noise={0.4}
        color="#cfe6ff"
      />

      <Planet position={PLANET_POS} radius={1.75} />
      <Observatory position={[4.05, -2.5, 1.2]} scale={0.5} />

      <Rig />
      <Effects />
      <AdaptiveDpr pixelated={false} />
    </>
  )
}
