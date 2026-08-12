import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { nebulaTexture } from './textures'

type Sheet = {
  seed: number
  tint: [number, number, number]
  position: [number, number, number]
  scale: number
  rotation: number
  spin: number
  opacity: number
}

/** Layered, slowly counter-rotating emission sheets standing in for the Gum Nebula. */
const SHEETS: Sheet[] = [
  { seed: 11, tint: [255, 96, 120], position: [-9, 3.4, -30], scale: 34, rotation: 0.4, spin: 0.006, opacity: 0.62 },
  { seed: 27, tint: [88, 150, 255], position: [11, -3.2, -36], scale: 42, rotation: -0.9, spin: -0.004, opacity: 0.7 },
  { seed: 43, tint: [150, 92, 255], position: [2, 7.5, -44], scale: 52, rotation: 1.7, spin: 0.003, opacity: 0.6 },
  { seed: 61, tint: [64, 224, 208], position: [-16, -8, -26], scale: 26, rotation: -0.35, spin: -0.008, opacity: 0.5 },
]

function Sheet({ seed, tint, position, scale, rotation, spin, opacity }: Sheet) {
  const ref = useRef<THREE.Mesh>(null!)
  const map = useMemo(() => nebulaTexture({ seed, tint }), [seed, tint])

  useFrame((_, delta) => {
    ref.current.rotation.z += delta * spin * 0.1
  })

  return (
    <mesh ref={ref} position={position} rotation={[0, 0, rotation]} scale={scale}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={map}
        transparent
        opacity={opacity}
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  )
}

export function Nebula() {
  const group = useRef<THREE.Group>(null!)

  useFrame((state) => {
    // A very slight parallax swing keeps the backdrop from feeling like wallpaper.
    group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.02) * 0.05
  })

  return (
    <group ref={group} renderOrder={-10}>
      {SHEETS.map((sheet) => (
        <Sheet key={sheet.seed} {...sheet} />
      ))}
    </group>
  )
}
