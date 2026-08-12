import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Instances, Instance } from '@react-three/drei'
import { scroll } from '../scroll'

/** deterministic prng so the composition is identical on every load */
function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * A colonnade of cast slabs, drawn as one instanced mesh.
 * Declarative <Instances>/<Instance> usage per drei docs; the "many boxes in a
 * single draw call, laid out from a seeded loop" idea is the pmndrs "instances"
 * example, swapped from a coloured cube field to a receding concrete corridor.
 */
export function Colonnade() {
  const group = useRef(null)

  const { slabs, marks } = useMemo(() => {
    const rand = mulberry32(0x4d4f4e4f) // "MONO"
    const slabs = []
    const marks = []
    let z = -2.5
    let i = 0
    while (z > -34) {
      for (const side of [-1, 1]) {
        const h = 2.6 + rand() * 5.4
        const w = 0.7 + rand() * 0.75
        const d = 0.7 + rand() * 0.7
        const x = side * (3.1 + rand() * 2.6 + (-z) * 0.11)
        const y = -0.75 + h / 2 - rand() * 0.4
        slabs.push({
          key: `s${i++}`,
          position: [x, y, z + (rand() - 0.5) * 1.2],
          scale: [w, h, d],
          rotation: [0, (rand() - 0.5) * 0.35, 0],
          color: new THREE.Color().setHSL(0.62, 0.03, 0.1 + rand() * 0.16).getStyle(),
        })
        // one slab in eight gets a machined acid inlay
        if (rand() > 0.86) {
          const last = slabs[slabs.length - 1]
          marks.push({
            key: `m${i}`,
            position: [
              last.position[0] + (side > 0 ? -w / 2 - 0.012 : w / 2 + 0.012),
              last.position[1] - h * 0.12,
              last.position[2],
            ],
            scale: [0.02, h * 0.42, 0.045],
          })
        }
      }
      z -= 2.4 + rand() * 1.6
    }
    return { slabs, marks }
  }, [])

  useFrame((state, delta) => {
    if (!group.current) return
    // the corridor drifts open as the page advances
    const p = scroll.progress
    group.current.rotation.y += (p * 0.22 - group.current.rotation.y) * Math.min(1, delta * 2)
    group.current.position.z += (p * 6 - group.current.position.z) * Math.min(1, delta * 2)
  })

  return (
    <group ref={group}>
      <Instances limit={slabs.length} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.94} metalness={0.06} />
        {slabs.map(({ key, ...rest }) => (
          <Instance key={key} {...rest} />
        ))}
      </Instances>

      <Instances limit={Math.max(1, marks.length)}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#c8ff00" toneMapped={false} />
        {marks.map(({ key, ...rest }) => (
          <Instance key={key} {...rest} />
        ))}
      </Instances>
    </group>
  )
}
