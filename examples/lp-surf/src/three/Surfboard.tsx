import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

/** A shortboard outline swept into a bevelled slab — no model file needed. */
function boardGeometry(): THREE.BufferGeometry {
  const outline = new THREE.Shape()
  outline.moveTo(0, 1.15)
  outline.bezierCurveTo(0.3, 0.72, 0.4, -0.1, 0.19, -0.96)
  outline.bezierCurveTo(0.16, -1.08, 0.09, -1.14, 0, -1.14)
  outline.bezierCurveTo(-0.09, -1.14, -0.16, -1.08, -0.19, -0.96)
  outline.bezierCurveTo(-0.4, -0.1, -0.3, 0.72, 0, 1.15)

  const geo = new THREE.ExtrudeGeometry(outline, {
    depth: 0.045,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 4,
    curveSegments: 26,
  })
  geo.center()
  geo.rotateX(-Math.PI / 2)
  geo.computeVertexNormals()
  return geo
}

type BoardProps = {
  position?: [number, number, number]
  rotation?: number
  scale?: number
  color?: string
  deck?: string
  phase?: number
}

export function Surfboard({
  position = [0, 0, 0],
  rotation = 0,
  scale = 2.4,
  color = '#f7f2e6',
  deck = '#0f6f7a',
  phase = 0,
}: BoardProps) {
  const group = useRef<THREE.Group>(null!)
  const geo = useMemo(boardGeometry, [])
  useEffect(() => () => geo.dispose(), [geo])

  useFrame((state) => {
    const t = state.clock.elapsedTime + phase
    const g = group.current
    g.position.y = position[1] + Math.sin(t * 0.85) * 0.22
    g.rotation.z = Math.sin(t * 0.62) * 0.13
    g.rotation.x = Math.sin(t * 0.47 + 1.2) * 0.09
    g.rotation.y = rotation + Math.sin(t * 0.21) * 0.06
  })

  return (
    <group ref={group} position={position} scale={scale}>
      <mesh geometry={geo} castShadow>
        <meshStandardMaterial color={color} roughness={0.28} metalness={0.04} envMapIntensity={1.1} />
      </mesh>
      {/* deck stripe, a hair proud of the surface so it never z-fights */}
      <mesh position={[0, 0.078, 0]} rotation-x={-Math.PI / 2} scale={[0.09, 1.55, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial color={deck} roughness={0.4} metalness={0.02} />
      </mesh>
    </group>
  )
}
