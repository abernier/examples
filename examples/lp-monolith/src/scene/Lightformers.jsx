import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Lightformer, Float } from '@react-three/drei'

/**
 * Declarative studio rig rendered live into scene.environment.
 * Structure lifted from the pmndrs example "building-live-envmaps"
 * (ceiling strip + travelling circle bank + side softboxes + one floating
 * accent ring), retuned here for a harsh monochrome cyclorama with a single
 * acid highlight.
 */
export function Lightformers({ positions = [2, 0, 2, 0, 2, 0, 2, 0] }) {
  const group = useRef(null)

  useFrame((state, delta) => {
    if (!group.current) return
    group.current.position.z += delta * 6
    if (group.current.position.z > 20) group.current.position.z = -60
  })

  return (
    <>
      {/* hard ceiling bank — the key light */}
      <Lightformer intensity={2.2} rotation-x={Math.PI / 2} position={[0, 6, -6]} scale={[14, 14, 1]} />

      {/* travelling strip lights, they smear across the chrome */}
      <group rotation={[0, 0.5, 0]}>
        <group ref={group}>
          {positions.map((x, i) => (
            <Lightformer
              key={i}
              form="circle"
              intensity={2.6}
              rotation={[Math.PI / 2, 0, 0]}
              position={[x, 4, i * 4]}
              scale={[3, 1, 1]}
            />
          ))}
        </group>
      </group>

      {/* side softboxes — the chrome edge highlights */}
      <Lightformer intensity={5} rotation-y={Math.PI / 2} position={[-6, 1, -1]} scale={[20, 0.4, 1]} />
      <Lightformer intensity={1.2} rotation-y={Math.PI / 2} position={[-6, -1.5, -1]} scale={[20, 1, 1]} />
      <Lightformer intensity={4} rotation-y={-Math.PI / 2} position={[10, 1.5, 0]} scale={[20, 1.2, 1]} />

      {/* the one acid accent in the whole rig */}
      <Float speed={3} floatIntensity={2} rotationIntensity={1.5}>
        <Lightformer
          form="ring"
          color="#c8ff00"
          intensity={1.4}
          scale={9}
          position={[-14, 5, -16]}
          target={[0, 0, 0]}
        />
      </Float>

      {/* graded cyclorama behind everything */}
      <mesh scale={90}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#141416" side={1} />
      </mesh>
    </>
  )
}
