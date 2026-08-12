import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Instance, Instances } from '@react-three/drei'

const rand = (a, b) => a + Math.random() * (b - a)

/**
 * Marine snow: one draw call of drifting detritus via drei <Instances>/<Instance>,
 * animated from a single useFrame that writes straight into the instance objects.
 */
export function MarineSnow({ count = 340, area = 13, height = 11 }) {
  const refs = useRef([])

  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: rand(-area, area),
        y: rand(-3, height - 3),
        z: rand(-area * 0.7, area * 0.35),
        s: rand(0.4, 1.9),
        fall: rand(0.055, 0.28),
        sway: rand(0.12, 0.5),
        phase: Math.random() * Math.PI * 2,
      })),
    [count, area, height]
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime
    for (let i = 0; i < seeds.length; i++) {
      const o = refs.current[i]
      if (!o) continue
      const s = seeds[i]
      let y = s.y - ((t * s.fall) % height)
      if (y < -3) y += height
      o.position.set(
        s.x + Math.sin(t * s.sway + s.phase) * 0.32,
        y,
        s.z + Math.cos(t * s.sway * 0.8 + s.phase) * 0.24
      )
    }
  })

  return (
    <Instances limit={count} range={count} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 5]} />
      <meshBasicMaterial color="#9fe4f5" toneMapped={false} transparent opacity={0.42} depthWrite={false} />
      {seeds.map((s, i) => (
        <Instance
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          scale={s.s * 0.016}
        />
      ))}
    </Instances>
  )
}

/** Bioluminescent plankton: a few larger, slower, brighter motes. */
export function Bioluminescence({ count = 26 }) {
  const refs = useRef([])

  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: rand(-7, 7),
        y: rand(-1.8, 3.6),
        z: rand(-6, 2.5),
        r: rand(0.35, 1.25),
        sp: rand(0.1, 0.42),
        phase: Math.random() * Math.PI * 2,
        s: rand(0.9, 2.4),
      })),
    [count]
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime
    for (let i = 0; i < seeds.length; i++) {
      const o = refs.current[i]
      if (!o) continue
      const s = seeds[i]
      const a = t * s.sp + s.phase
      o.position.set(s.x + Math.cos(a) * s.r, s.y + Math.sin(a * 0.7) * s.r * 0.6, s.z + Math.sin(a) * s.r)
      const pulse = 0.55 + 0.45 * Math.sin(t * 1.6 + s.phase)
      o.scale.setScalar(s.s * 0.028 * (0.6 + pulse * 0.7))
    }
  })

  return (
    <Instances limit={count} range={count} frustumCulled={false}>
      <sphereGeometry args={[1, 10, 8]} />
      <meshBasicMaterial color="#63f0ff" toneMapped={false} transparent opacity={0.9} depthWrite={false} />
      {seeds.map((s, i) => (
        <Instance
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
        />
      ))}
    </Instances>
  )
}
