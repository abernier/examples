import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, Sparkles } from '@react-three/drei'
import { easing } from 'maath'

import Starfield from './Starfield.jsx'
import Planet from './Planet.jsx'
import OrbitSystem from './OrbitSystem.jsx'
import Debris from './Debris.jsx'
import Satellite from './Satellite.jsx'
import Effects from './Effects.jsx'
import { view } from '../store.js'

/* Camera keyframes, one per narrative beat of the page. */
const KEYS = [
  { pos: [0, 1.4, 21], look: [0, -1.6, 0] }, // hero — wide, limb low
  { pos: [7.6, 2.6, 15], look: [-1.6, -0.4, 0] }, // capabilities
  { pos: [-7.2, 5.4, 16.5], look: [1.4, -2.4, 0] }, // manifest
  { pos: [0, 8.2, 27], look: [0, -3.4, 0] }, // testimonial / footer
]

function sample(list, p, out) {
  const t = THREE.MathUtils.clamp(p, 0, 0.9999) * (list.length - 1)
  const i = Math.floor(t)
  const f = t - i
  const a = list[i]
  const b = list[Math.min(list.length - 1, i + 1)]
  out.set(
    THREE.MathUtils.lerp(a[0], b[0], f),
    THREE.MathUtils.lerp(a[1], b[1], f),
    THREE.MathUtils.lerp(a[2], b[2], f)
  )
  return out
}

/**
 * Scroll rig. Reads document scrollTop (normalized in store.js) and damps the
 * camera towards it — the `tying-canvas-to-scroll-offset` pattern from pmndrs,
 * swapped from THREE.MathUtils.damp on a group to maath easing.damp3 on the
 * camera so the real DOM page stays the scroll surface.
 */
function Rig() {
  const { camera } = useThree()
  const positions = useMemo(() => KEYS.map((k) => k.pos), [])
  const targets = useMemo(() => KEYS.map((k) => k.look), [])
  const pos = useMemo(() => new THREE.Vector3(), [])
  const look = useMemo(() => new THREE.Vector3(), [])
  const current = useRef(new THREE.Vector3(0, -1.6, 0))

  useFrame((state, delta) => {
    const small = state.size.width < 760
    const k = small ? 0.62 : 1
    sample(positions, view.scroll, pos)
    sample(targets, view.scroll, look)
    pos.x = pos.x * k + view.px * 1.5
    pos.y = pos.y + view.py * 0.9
    pos.z = small ? pos.z * 1.28 : pos.z
    easing.damp3(camera.position, pos, 0.55, delta)
    easing.damp3(current.current, look, 0.55, delta)
    camera.lookAt(current.current)
  })
  return null
}

export default function Scene() {
  return (
    <>
      <color attach="background" args={['#04050a']} />
      <fog attach="fog" args={['#04050a', 30, 88]} />

      <Rig />

      <hemisphereLight args={['#2a3a63', '#05060a', 0.5]} />
      <directionalLight position={[-11, 7, 9]} intensity={2.6} color="#ffd9c0" />
      <directionalLight position={[9, -3, -8]} intensity={0.7} color="#4d7bd6" />

      <Starfield />
      <Planet />
      <OrbitSystem />
      <Debris />
      <Satellite />

      {/* ion dust drifting through the frame */}
      <Sparkles
        count={110}
        scale={[46, 26, 26]}
        size={2.4}
        speed={0.28}
        opacity={0.55}
        noise={0.6}
        color="#ffb27a"
        position={[0, -1, 2]}
      />

      {/*
        Rim lighting with no HDRI on the wire: an <Environment> whose whole
        content is <Lightformer> panels — the `lusion-connectors` recipe,
        recoloured to warm ignition orange against cold starlight.
      */}
      <Environment resolution={256}>
        <group rotation={[-Math.PI / 3.4, 0, 0.6]}>
          <Lightformer form="rect" intensity={5} color="#ff5b1f" scale={[9, 3]} position={[-9, 3, -6]} rotation-y={Math.PI / 2.2} />
          <Lightformer form="circle" intensity={3.2} color="#ffd2b0" scale={5} position={[0, 8, -10]} rotation-x={Math.PI / 2} />
          <Lightformer form="rect" intensity={2.4} color="#5f8bff" scale={[14, 5]} position={[10, 1, 2]} rotation-y={-Math.PI / 2} />
          <Lightformer form="ring" intensity={2} color="#9ec2ff" scale={3.4} position={[-4, -5, 6]} />
          <Lightformer form="rect" intensity={1.2} color="#243357" scale={[24, 24]} position={[0, 0, -18]} />
        </group>
      </Environment>

      <Effects />
    </>
  )
}
