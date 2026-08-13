import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { MeshDistortMaterial, Float } from '@react-three/drei'
import { easing } from 'maath'
import { scroll } from '../scroll'

/**
 * The chrome blob.
 * Sphere + MeshDistortMaterial + ContactShadows staging comes from the pmndrs
 * "wobbling-sphere" example; here the material is pushed to a mirror finish
 * (metalness 1 / roughness ~0) so it only ever shows the Lightformer rig.
 */
export function Blob(props) {
  const mesh = useRef(null)
  const material = useRef(null)

  useFrame((state, delta) => {
    const p = scroll.progress
    if (mesh.current) {
      const t = state.clock.elapsedTime
      // it breathes, and it deflates a little as you travel down the page
      const s = 1.0 - p * 0.18 + Math.sin(t / 2.2) * 0.015
      easing.damp3(mesh.current.scale, [s, s, s], 0.4, delta)
      easing.dampE(
        mesh.current.rotation,
        [state.pointer.y * 0.15, t * 0.12 + state.pointer.x * 0.3, 0],
        0.6,
        delta,
      )
    }
    if (material.current) {
      material.current.distort = THREE.MathUtils.damp(
        material.current.distort,
        0.24 + p * 0.3,
        3,
        delta,
      )
    }
  })

  return (
    <Float speed={1.1} rotationIntensity={0.25} floatIntensity={0.6} floatingRange={[-0.06, 0.12]}>
      <mesh ref={mesh} castShadow {...props}>
        <sphereGeometry args={[1, 128, 128]} />
        <MeshDistortMaterial
          ref={material}
          distort={0.24}
          speed={1.1}
          color="#e9ecef"
          metalness={1}
          roughness={0.075}
          envMapIntensity={1.6}
        />
      </mesh>
    </Float>
  )
}
