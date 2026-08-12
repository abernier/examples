import * as THREE from 'three'
import { useMemo, useRef, useLayoutEffect } from 'react'

const o = new THREE.Object3D()
const c = new THREE.Color()

// Flat-top hexagons tile at 1.5·r horizontally and √3·r vertically, with every
// other column pushed half a row down. CylinderGeometry starts its first vertex
// at the top, so the prisms need a 30° roll to actually be flat-top (see below).
const R = 0.42
const STEP_X = R * 1.5
const STEP_Y = R * Math.sqrt(3)

const COLS = 30
const ROWS = 20

// A few cells are "capped" — full of honey, catching the spotlights.
const FILLED = '#d8901f'
const WAX = '#4a2f14'

/**
 * The honeycomb wall. One instanced draw call for ~400 hexagonal prisms with
 * per-instance colors — the technique comes straight from the `instances`
 * example (instancedBufferAttribute attached as `attributes-color`).
 */
export default function Comb() {
  const ref = useRef<THREE.InstancedMesh>(null!)
  const count = COLS * ROWS

  const colors = useMemo(() => {
    const array = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const filled = Math.random() < 0.22
      c.set(filled ? FILLED : WAX)
      // Vary the wax so the wall does not read as one flat sheet
      c.multiplyScalar(filled ? 0.75 + Math.random() * 0.5 : 0.6 + Math.random() * 0.8)
      c.toArray(array, i * 3)
    }
    return array
  }, [count])

  useLayoutEffect(() => {
    let i = 0
    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        o.position.set(
          (x - COLS / 2) * STEP_X,
          (y - ROWS / 2) * STEP_Y + (x % 2 ? STEP_Y / 2 : 0),
          // Cells sit at slightly different depths — the spotlights then rake
          // across the wall instead of washing it flat.
          -0.35 * Math.random(),
        )
        // Y spins around the prism's own axis (applied first in XYZ order): 30°
        // turns the pointy-top cross-section into a flat-top one. X then lays it
        // down to face the camera.
        o.rotation.set(Math.PI / 2, Math.PI / 6, 0)
        o.scale.setScalar(0.93)
        o.updateMatrix()
        ref.current.setMatrixAt(i++, o.matrix)
      }
    }
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [count])

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} position={[0, 0, -6]}>
      <cylinderGeometry args={[R, R, 0.42, 6, 1]}>
        <instancedBufferAttribute attach="attributes-color" args={[colors, 3]} />
      </cylinderGeometry>
      <meshStandardMaterial vertexColors roughness={0.55} metalness={0.15} />
    </instancedMesh>
  )
}
