import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'

import { PERIOD, ecg, phaseAt } from '../lib/cardiac'

const SAMPLES = 460
const CYCLES = 3.4 // how many beats fit across the trace
const AMPLITUDE = 0.6

/** drei's `Line` renders a Line2; this is the bit of it we mutate per frame. */
type MutableLine = THREE.Object3D & {
  geometry: { setPositions(array: number[] | Float32Array): void }
}

export default function EcgTrace({
  width = 9.4,
  ...props
}: { width?: number } & React.ComponentProps<'group'>) {
  const line = useRef<MutableLine>(null!)
  const glow = useRef<MutableLine>(null!)
  const cursor = useRef<THREE.Mesh>(null!)

  // Allocated once and mutated in place — the `points` prop is never changed,
  // so drei never rebuilds the geometry and React never re-renders.
  const { initial, buffer, dt } = useMemo(() => {
    const buffer = new Float32Array(SAMPLES * 3)
    const initial: [number, number, number][] = []
    for (let i = 0; i < SAMPLES; i++) {
      const x = (i / (SAMPLES - 1) - 0.5) * width
      buffer[i * 3] = x
      initial.push([x, 0, 0])
    }
    return { initial, buffer, dt: (CYCLES * PERIOD) / (SAMPLES - 1) }
  }, [width])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    for (let i = 0; i < SAMPLES; i++) {
      // Rightmost sample is "now"; everything to its left is older, so the
      // trace scrolls right to left the way a monitor does.
      buffer[i * 3 + 1] = ecg(phaseAt(t - (SAMPLES - 1 - i) * dt)) * AMPLITUDE
    }
    line.current.geometry.setPositions(buffer)
    glow.current.geometry.setPositions(buffer)
    cursor.current.position.y = buffer[(SAMPLES - 1) * 3 + 1]
  })

  return (
    <group {...props}>
      {/* A wide, faint pass under the hairline — a cheap bloom stand-in that
          survives on a bright background, where real bloom has nothing to do. */}
      <Line
        ref={glow as never}
        points={initial}
        color="#e04a68"
        lineWidth={8}
        transparent
        opacity={0.14}
        frustumCulled={false}
        toneMapped={false}
      />
      <Line
        ref={line as never}
        points={initial}
        color="#c2113b"
        lineWidth={2.2}
        frustumCulled={false}
        toneMapped={false}
      />

      <mesh ref={cursor} position={[width / 2, 0, 0.01]}>
        <circleGeometry args={[0.05, 20]} />
        <meshBasicMaterial color="#ff3355" toneMapped={false} />
      </mesh>
    </group>
  )
}
