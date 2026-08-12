import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line, Instances, Instance } from '@react-three/drei'

/**
 * Three inclined orbital planes.
 *  - the plane itself is a drei <Line> (THREE.Line2), dashed, hairline
 *  - the spacecraft flying it are one drei <Instances> / <Instance> pool
 *    (the declarative InstancedMesh from the drei docs) — 42 birds, 1 draw call
 */

const PLANES = [
  { r: 12.6, tilt: [0.34, 0, 0.12], count: 16, speed: 0.055, color: '#5c7fd6' },
  { r: 15.2, tilt: [-0.62, 0.4, 0], count: 14, speed: -0.04, color: '#4a6ab8' },
  { r: 18.4, tilt: [1.14, 0, -0.3], count: 12, speed: 0.028, color: '#3f5a9c' },
]

function ringPoints(r, segments = 180) {
  const pts = []
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2
    pts.push([Math.cos(t) * r, 0, Math.sin(t) * r])
  }
  return pts
}

function Ring({ r, tilt, color }) {
  const pts = useMemo(() => ringPoints(r), [r])
  return (
    <group rotation={tilt}>
      <Line
        points={pts}
        color={color}
        lineWidth={0.75}
        transparent
        opacity={0.42}
        dashed
        dashSize={0.9}
        gapSize={0.55}
        depthWrite={false}
      />
    </group>
  )
}

function Flight({ r, tilt, count, speed }) {
  const spin = useRef(null)
  useFrame((_, delta) => {
    spin.current.rotation.y += delta * speed
  })
  return (
    <group rotation={tilt}>
      <group ref={spin}>
        {Array.from({ length: count }, (_, i) => {
          const t = (i / count) * Math.PI * 2
          return (
            <Instance
              key={i}
              position={[Math.cos(t) * r, 0, Math.sin(t) * r]}
              rotation={[t, t * 1.7, 0]}
              scale={i % 5 === 0 ? 1.9 : 1}
            />
          )
        })}
      </group>
    </group>
  )
}

export default function OrbitSystem() {
  return (
    <group position={[0, -11.6, -3]}>
      {PLANES.map((p, i) => (
        <Ring key={i} {...p} />
      ))}

      <Instances limit={64} range={64} frustumCulled={false}>
        <octahedronGeometry args={[0.115, 0]} />
        <meshStandardMaterial
          color="#ffb27a"
          emissive="#ff5b1f"
          emissiveIntensity={2.6}
          roughness={0.35}
          metalness={0.5}
          toneMapped={false}
        />
        {PLANES.map((p, i) => (
          <Flight key={i} {...p} />
        ))}
      </Instances>
    </group>
  )
}
