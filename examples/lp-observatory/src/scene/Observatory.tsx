import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const beamVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

/** Sodium laser guide star: bright at the aperture, dissolving into the mesosphere. */
const beamFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  varying vec2 vUv;

  void main() {
    float fade = pow(1.0 - vUv.y, 1.7);
    float ramp = smoothstep(0.0, 0.05, vUv.y);
    float scintillation = 0.86 + 0.14 * sin(uTime * 5.0 - vUv.y * 26.0);
    float a = fade * ramp * scintillation;
    gl_FragColor = vec4(uColor * a * 1.25, a * 0.6);
  }
`

/** Angular width of the dome slit, in radians. */
const SLIT = 0.26

type Props = {
  position?: [number, number, number]
  scale?: number
}

/**
 * A 4.5 m dome, entirely procedural: a hemisphere for the shell, a drum and
 * apron below it, a narrow meridian strip standing in for the open slit, and
 * the laser guide star firing out of it. The metal reads off the Lightformer
 * environment rather than any HDR file.
 */
export function Observatory({ position = [0, 0, 0], scale = 1 }: Props) {
  const shutter = useRef<THREE.Group>(null!)
  const beamUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color('#ffb35c') },
    }),
    [],
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime
    beamUniforms.uTime.value = t
    // The dome tracks its target: a slow, continuous azimuth crawl.
    shutter.current.rotation.y = 0.45 + Math.sin(t * 0.05) * 0.22
  })

  return (
    <group position={position} scale={scale} rotation={[0, -0.5, -0.05]}>
      {/* Apron / pier */}
      <mesh position={[0, -0.62, 0]}>
        <cylinderGeometry args={[1.16, 1.28, 0.5, 56]} />
        <meshStandardMaterial color="#070b14" metalness={0.25} roughness={0.85} />
      </mesh>

      {/* Drum */}
      <mesh position={[0, -0.24, 0]}>
        <cylinderGeometry args={[1.02, 1.02, 0.34, 56]} />
        <meshStandardMaterial color="#0c1322" metalness={0.7} roughness={0.45} />
      </mesh>

      {/* Bearing ring */}
      <mesh position={[0, -0.07, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.03, 0.028, 10, 72]} />
        <meshStandardMaterial
          color="#243349"
          metalness={0.95}
          roughness={0.22}
          emissive="#0a1a2c"
          emissiveIntensity={0.5}
        />
      </mesh>

      <group ref={shutter}>
        {/* Shell, with a real wedge missing: that gap is the open slit. */}
        <mesh castShadow>
          <sphereGeometry args={[1, 64, 32, SLIT / 2, Math.PI * 2 - SLIT, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color="#1b2c47"
            metalness={0.88}
            roughness={0.3}
            envMapIntensity={3.2}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Dark interior, so the gap does not read straight through to the sky */}
        <mesh>
          <sphereGeometry args={[0.93, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshBasicMaterial color="#140407" side={THREE.BackSide} toneMapped={false} />
        </mesh>

        {/* Red observing light bleeding out through the slit */}
        <mesh>
          <sphereGeometry args={[0.985, 24, 26, -SLIT * 0.34, SLIT * 0.68, 0.05, Math.PI / 2 - 0.05]} />
          <meshBasicMaterial color="#ff3b26" toneMapped={false} side={THREE.DoubleSide} />
        </mesh>

        {/* Rim light so the shell reads against the sky */}
        <pointLight position={[-1.5, 1.3, 1.7]} intensity={5} distance={7} decay={2} color="#a9d4ff" />

        {/* Laser guide star */}
        <group position={[0, 0.35, 0]} rotation={[-0.1, 0, -0.1]}>
          <mesh position={[0, 22, 0]}>
            <cylinderGeometry args={[0.05, 0.018, 44, 12, 1, true]} />
            <shaderMaterial
              vertexShader={beamVertex}
              fragmentShader={beamFragment}
              uniforms={beamUniforms}
              transparent
              depthWrite={false}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <pointLight position={[0, 0.4, 0]} intensity={3} distance={4} color="#ffb35c" />
        </group>
      </group>
    </group>
  )
}
