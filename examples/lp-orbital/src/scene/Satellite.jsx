import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, Trail, Edges } from '@react-three/drei'

/**
 * HALO-3 on station.
 * <Trail> + a parented `object3D` tip is the exact rig from the pmndrs
 * `trails` demo (Cursor component); <Edges> outlining a basic-material body
 * comes from the same file. <Float> adds the slow attitude wobble.
 */
export default function Satellite() {
  const rig = useRef(null)
  const tip = useRef(null)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 0.19
    rig.current.position.set(
      Math.cos(t) * 15.4,
      -11.6 + Math.sin(t * 0.63) * 5.4,
      -3 + Math.sin(t) * 15.4
    )
    rig.current.rotation.set(0, -t, Math.sin(t * 0.5) * 0.2)
  })

  return (
    <>
      <Trail
        target={tip}
        color="#ff5b1f"
        width={1.1}
        length={8}
        decay={1.15}
        attenuation={(w) => w * w}
      />
      <group ref={rig}>
        <object3D ref={tip} />
        <Float speed={1.6} rotationIntensity={0.7} floatIntensity={0.5} floatingRange={[-0.18, 0.18]}>
          <group scale={0.62}>
            {/* bus */}
            <mesh>
              <boxGeometry args={[0.9, 0.62, 0.62]} />
              <meshStandardMaterial color="#1b202b" roughness={0.4} metalness={0.8} />
              <Edges scale={1.02} color="#8fb4ff" />
            </mesh>
            {/* solar wings */}
            {[-1, 1].map((s) => (
              <mesh key={s} position={[0, 0, s * 1.35]} rotation={[0, 0, 0.12 * s]}>
                <boxGeometry args={[1.5, 0.03, 1.9]} />
                <meshStandardMaterial color="#0d1220" roughness={0.25} metalness={0.9} />
                <Edges scale={1.01} color="#4d76d6" />
              </mesh>
            ))}
            {/* payload aperture */}
            <mesh position={[0.62, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.2, 0.26, 0.4, 16]} />
              <meshStandardMaterial
                color="#ff7a3c"
                emissive="#ff5b1f"
                emissiveIntensity={3}
                toneMapped={false}
              />
            </mesh>
          </group>
        </Float>
      </group>
    </>
  )
}
