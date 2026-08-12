import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as random from 'maath/random'

/**
 * Cold starlight.
 * Technique lifted from the pmndrs `gatsby-stars` example: a maath/random
 * point cloud fed straight into drei's <Points> + <PointMaterial>.
 * Two shells at different radii/sizes give the field some depth.
 */
function Shell({ count, radius, size, color, opacity, speed }) {
  const ref = useRef(null)
  const [positions] = useState(() =>
    random.inSphere(new Float32Array(count * 3), { radius })
  )
  useFrame((_, delta) => {
    ref.current.rotation.x -= (delta * speed) / 12
    ref.current.rotation.y -= (delta * speed) / 18
  })
  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={color}
        size={size}
        opacity={opacity}
        sizeAttenuation
        depthWrite={false}
      />
    </Points>
  )
}

export default function Starfield() {
  return (
    <group rotation={[0, 0, Math.PI / 5]}>
      <Shell count={2600} radius={60} size={0.12} color="#c9dcff" opacity={0.9} speed={1} />
      <Shell count={1400} radius={38} size={0.075} color="#8fa6cf" opacity={0.55} speed={1.6} />
    </group>
  )
}
