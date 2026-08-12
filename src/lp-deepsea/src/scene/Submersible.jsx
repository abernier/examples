import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Caustics, Float, MeshTransmissionMaterial } from '@react-three/drei'

// Cheap fake back-face reflections for the acrylic sphere — the trick the
// pmndrs "caustics" example uses so glass does not read as flat.
const innerMaterial = new THREE.MeshStandardMaterial({
  transparent: true,
  opacity: 1,
  color: '#03080c',
  roughness: 0,
  side: THREE.FrontSide,
  blending: THREE.AdditiveBlending,
  polygonOffset: true,
  polygonOffsetFactor: 1,
  envMapIntensity: 1.6,
})

function Titanium(props) {
  return <meshStandardMaterial color="#8d979e" metalness={1} roughness={0.42} envMapIntensity={1.1} {...props} />
}

function Anodised(props) {
  return <meshStandardMaterial color="#151c22" metalness={0.85} roughness={0.55} envMapIntensity={0.8} {...props} />
}

function Floodlight({ position, rotation }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <cylinderGeometry args={[0.085, 0.105, 0.2, 20]} />
        <Anodised />
      </mesh>
      <mesh position={[0, 0.105, 0]}>
        <cylinderGeometry args={[0.078, 0.078, 0.02, 20]} />
        <meshBasicMaterial color="#c8fbff" toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0.4, 0]} distance={5} decay={2} intensity={6} color="#9fe9ff" />
    </group>
  )
}

function Strut({ position, rotation, length = 1 }) {
  return (
    <mesh position={position} rotation={rotation} castShadow>
      <cylinderGeometry args={[0.032, 0.032, length, 12]} />
      <Titanium roughness={0.55} color="#6f7a82" />
    </mesh>
  )
}

/**
 * The vessel: a titanium exoframe around an acrylic pressure sphere.
 * The sphere is wrapped in <Caustics> so its refracted floodlight is
 * raymarched onto a catcher plane just above the seabed.
 */
export function Submersible({ causticsY = -2.365, ...props }) {
  const spin = useRef(null)
  const beacon = useRef(null)

  const ringRotations = useMemo(
    () => [
      [Math.PI / 2, 0, 0],
      [Math.PI / 2, 0, Math.PI / 2],
      [0, 0, 0],
    ],
    []
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (spin.current) spin.current.rotation.y = Math.sin(t * 0.12) * 0.35 + 0.4
    if (beacon.current) beacon.current.intensity = 3 + Math.sin(t * 2.4) * 2.2
  })

  return (
    <group {...props}>
      {/*
        Runtime caustics. drei's <Caustics> drops its catcher plane at the LOCAL
        y=0 of its own group, so the group is pushed down to seabed height and
        the (stand-in) refractor pushed back up by the same amount. `causticsOnly`
        means the stand-in is never drawn — only its refracted light is — while
        the real acrylic sphere below stays inside the <Float>.
      */}
      <Caustics
        causticsOnly
        backside={false}
        frames={Infinity}
        resolution={256}
        color={[0.45, 0.94, 1]}
        lightSource={[-1.6, 4.2, -1.2]}
        intensity={0.02}
        worldRadius={0.06}
        ior={1.14}
        position={[0, causticsY, 0]}
      >
        <mesh position={[0, -causticsY, 0]}>
          <sphereGeometry args={[0.72, 32, 32]} />
          <meshBasicMaterial />
        </mesh>
      </Caustics>

      <Float speed={1.1} rotationIntensity={0.35} floatIntensity={0.8} floatingRange={[-0.08, 0.12]}>
        <group ref={spin}>
          {/* Acrylic pressure sphere */}
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[0.72, 48, 48]} />
            <MeshTransmissionMaterial
              backside
              backsideThickness={0.2}
              samples={4}
              thickness={0.45}
              chromaticAberration={0.09}
              anisotropicBlur={0.6}
              distortion={0.15}
              distortionScale={0.25}
              temporalDistortion={0.08}
              roughness={0.02}
              clearcoat={1}
              clearcoatRoughness={0.15}
              attenuationDistance={1.4}
              attenuationColor="#7fe6ff"
              color="#dff8ff"
              envMapIntensity={1.4}
            />
          </mesh>

          {/* dark core, additive — fakes internal reflections */}
          <mesh scale={0.965} material={innerMaterial}>
            <sphereGeometry args={[0.72, 32, 32]} />
          </mesh>

          {/* equatorial collars */}
          {ringRotations.map((r, i) => (
            <mesh key={i} rotation={r} castShadow>
              <torusGeometry args={[0.78, 0.028, 10, 72]} />
              <Titanium color={i === 2 ? '#9fa9b0' : '#78838b'} />
            </mesh>
          ))}

          {/* forward instrument collar */}
          <mesh position={[0, 0, 0.62]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.42, 0.05, 12, 48]} />
            <Titanium color="#a7b1b8" roughness={0.3} />
          </mesh>

          {/* thruster pods */}
          {[
            [0.98, 0.16, -0.2],
            [-0.98, 0.16, -0.2],
          ].map((p, i) => (
            <group key={i} position={p} rotation={[0, 0, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.15, 0.15, 0.34, 24]} />
                <Anodised />
              </mesh>
              <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <torusGeometry args={[0.155, 0.018, 8, 32]} />
                <Titanium />
              </mesh>
              <Strut position={[p[0] > 0 ? -0.4 : 0.4, 0, 0.1]} rotation={[0, 0, Math.PI / 2]} length={0.8} />
            </group>
          ))}

          {/* skid / ballast frame */}
          <group position={[0, -0.92, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[1.65, 0.09, 1.05]} />
              <Titanium color="#697178" roughness={0.6} />
            </mesh>
          </group>

          {/* floodlight bar */}
          <Floodlight position={[0.55, -0.42, 0.72]} rotation={[Math.PI * 0.62, 0, 0.35]} />
          <Floodlight position={[-0.55, -0.42, 0.72]} rotation={[Math.PI * 0.62, 0, -0.35]} />

          {/* beacon */}
          <mesh position={[0, 0.92, 0]}>
            <sphereGeometry args={[0.055, 16, 16]} />
            <meshBasicMaterial color="#b7f6ff" toneMapped={false} />
          </mesh>
          <pointLight ref={beacon} position={[0, 0.95, 0]} distance={6} decay={2} intensity={4} color="#7be3ff" />

          {/* manipulator arm */}
          <group position={[0.42, -0.62, 0.55]} rotation={[0.4, -0.3, -0.5]}>
            <Strut position={[0, 0.22, 0]} length={0.55} />
            <group position={[0, 0.48, 0]} rotation={[0, 0, 0.9]}>
              <Strut position={[0, 0.2, 0]} length={0.5} />
              <mesh position={[0, 0.46, 0]} castShadow>
                <boxGeometry args={[0.1, 0.14, 0.1]} />
                <Anodised />
              </mesh>
            </group>
          </group>
        </group>
      </Float>
    </group>
  )
}
