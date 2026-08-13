import { useMemo } from 'react'
import * as THREE from 'three'
import type { ThreeElements } from '@react-three/fiber'
import { CrtScreen } from './CrtScreen'
import { makeMarqueeTexture, makePlacardTexture } from '../lib/textures'

/* ------------------------------------------------------------------ *
 * Shared geometry + materials.
 * Every cabinet reuses the same four geometries and the same three body
 * materials, so seven cabinets cost almost nothing to upload.
 * ------------------------------------------------------------------ */

const BOX = new THREE.BoxGeometry(1, 1, 1)
const CYL = new THREE.CylinderGeometry(1, 1, 1, 14)
const SPH = new THREE.SphereGeometry(1, 14, 10)

const shellMat = new THREE.MeshStandardMaterial({
  color: '#14101f',
  roughness: 0.48,
  metalness: 0.3,
})
const trimMat = new THREE.MeshStandardMaterial({
  color: '#08060f',
  roughness: 0.75,
  metalness: 0.15,
})
const panelMat = new THREE.MeshStandardMaterial({
  color: '#1d1730',
  roughness: 0.62,
  metalness: 0.2,
})
const chromeMat = new THREE.MeshStandardMaterial({
  color: '#b9b4c8',
  roughness: 0.22,
  metalness: 0.95,
})

const BUTTONS = ['#ff2d95', '#00f0ff', '#ffc700', '#6bff8f']

export type CabinetSpec = {
  title: string
  accent: string
  accent2: string
  ink: string
  ink2: string
  variant: number
  /** adds a coloured point light — reserved for the front row */
  glow?: boolean
}

export function Cabinet({
  spec,
  ...props
}: { spec: CabinetSpec } & Omit<ThreeElements['group'], 'children'>) {
  const { title, accent, accent2, ink, ink2, variant, glow } = spec

  const marquee = useMemo(
    () => makeMarqueeTexture(title, accent, accent2),
    [title, accent, accent2],
  )
  const placard = useMemo(() => makePlacardTexture('INSERT COIN', '#ffc700'), [])

  const neonMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(accent).multiplyScalar(2.8),
        toneMapped: false,
      }),
    [accent],
  )
  const neonMat2 = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(accent2).multiplyScalar(2.4),
        toneMapped: false,
      }),
    [accent2],
  )
  const marqueeMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: marquee,
        toneMapped: false,
        color: new THREE.Color(1.7, 1.7, 1.7),
      }),
    [marquee],
  )
  const placardMat = useMemo(
    () => new THREE.MeshBasicMaterial({ map: placard, toneMapped: false }),
    [placard],
  )
  const buttonMats = useMemo(
    () =>
      BUTTONS.map(
        (c) =>
          new THREE.MeshBasicMaterial({
            color: new THREE.Color(c).multiplyScalar(1.9),
            toneMapped: false,
          }),
      ),
    [],
  )

  return (
    <group {...props}>
      {/* plinth */}
      <mesh
        castShadow
        receiveShadow
        geometry={BOX}
        material={trimMat}
        position={[0, 0.06, 0]}
        scale={[0.86, 0.12, 0.88]}
      />

      {/* lower body — deep, holds the coin door and the control panel */}
      <mesh
        castShadow
        receiveShadow
        geometry={BOX}
        material={shellMat}
        position={[0, 0.57, 0]}
        scale={[0.8, 0.9, 0.82]}
      />

      {/* monitor housing — set back so the bezel reads as recessed */}
      <mesh
        castShadow
        receiveShadow
        geometry={BOX}
        material={shellMat}
        position={[0, 1.51, -0.11]}
        scale={[0.8, 0.98, 0.6]}
      />

      {/* monitor bezel + CRT, angled towards the player */}
      <group position={[0, 1.5, 0.16]} rotation={[-0.18, 0, 0]}>
        <mesh castShadow geometry={BOX} material={trimMat} scale={[0.74, 0.6, 0.1]} />
        <CrtScreen variant={variant} ink={ink} ink2={ink2} position={[0, 0.005, 0.056]} />
      </group>

      {/* marquee header */}
      <mesh
        castShadow
        geometry={BOX}
        material={trimMat}
        position={[0, 2.09, -0.02]}
        scale={[0.84, 0.3, 0.54]}
      />
      <mesh geometry={BOX} material={marqueeMat} position={[0, 2.09, 0.255]} scale={[0.78, 0.24, 0.01]} />

      {/* control panel — everything on it lives in panel space */}
      <group position={[0, 1.04, 0.4]} rotation={[0.2, 0, 0]}>
        <mesh castShadow receiveShadow geometry={BOX} material={panelMat} scale={[0.8, 0.08, 0.38]} />
        {/* joystick */}
        <mesh geometry={CYL} material={chromeMat} position={[-0.21, 0.075, 0]} scale={[0.018, 0.08, 0.018]} />
        <mesh geometry={SPH} material={neonMat} position={[-0.21, 0.128, 0]} scale={0.036} />
        {/* buttons */}
        {buttonMats.map((m, i) => (
          <mesh
            key={i}
            geometry={CYL}
            material={m}
            position={[-0.04 + i * 0.083, 0.05, 0.008 - (i % 2) * 0.05]}
            scale={[0.027, 0.02, 0.027]}
          />
        ))}
      </group>

      {/* coin door + placard */}
      <mesh geometry={BOX} material={trimMat} position={[0, 0.5, 0.42]} scale={[0.36, 0.24, 0.03]} />
      <mesh geometry={BOX} material={placardMat} position={[0, 0.5, 0.437]} scale={[0.3, 0.09, 0.01]} />

      {/* neon: front edges of the lower body … */}
      <mesh geometry={CYL} material={neonMat} position={[-0.405, 0.58, 0.395]} scale={[0.016, 0.86, 0.016]} />
      <mesh geometry={CYL} material={neonMat} position={[0.405, 0.58, 0.395]} scale={[0.016, 0.86, 0.016]} />
      {/* … and of the monitor housing */}
      <mesh geometry={CYL} material={neonMat} position={[-0.405, 1.5, 0.175]} scale={[0.014, 0.9, 0.014]} />
      <mesh geometry={CYL} material={neonMat} position={[0.405, 1.5, 0.175]} scale={[0.014, 0.9, 0.014]} />
      {/* neon strip under the marquee */}
      <mesh
        geometry={CYL}
        material={neonMat2}
        position={[0, 1.95, 0.2]}
        rotation={[0, 0, Math.PI / 2]}
        scale={[0.014, 0.8, 0.014]}
      />
      {/* kick strip */}
      <mesh
        geometry={BOX}
        material={neonMat2}
        position={[0, 0.16, 0.417]}
        scale={[0.68, 0.02, 0.01]}
      />

      {glow && (
        <>
          <pointLight
            position={[0, 1.05, 0.75]}
            color={accent}
            intensity={2.2}
            distance={3.2}
            decay={2}
          />
          <pointLight
            position={[0, 1.5, 0.6]}
            color={ink}
            intensity={1.1}
            distance={2.2}
            decay={2}
          />
        </>
      )}
    </group>
  )
}
