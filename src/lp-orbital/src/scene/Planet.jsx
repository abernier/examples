import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'

const R = 9.4

/* --- Fresnel limb-glow shader ------------------------------------------- *
 * A back-side shell around the planet. The rim intensity is a fresnel term;
 * its hue is driven by the sun direction so the terminator burns ignition
 * orange while the night side stays cold starlight blue.                     */
const vert = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vPosW = wp.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`

const frag = /* glsl */ `
  uniform vec3 uCold;
  uniform vec3 uWarm;
  uniform vec3 uSun;
  uniform float uPower;
  uniform float uIntensity;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    vec3 V = normalize(cameraPosition - vPosW);
    vec3 N = normalize(vNormalW);
    float f = pow(clamp(1.0 - abs(dot(N, V)), 0.0, 1.0), uPower);
    float sun = clamp(dot(N, normalize(uSun)) * 0.5 + 0.5, 0.0, 1.0);
    vec3 col = mix(uCold, uWarm, pow(sun, 2.2));
    float a = f * uIntensity;
    gl_FragColor = vec4(col * a, a);
  }
`

/** Latitude graticule — hairline HUD rings drawn straight onto the limb. */
function Graticule() {
  const rings = useMemo(() => {
    const out = []
    for (let i = -3; i <= 3; i++) {
      const lat = (i / 7) * Math.PI
      const r = Math.cos(lat) * R * 1.002
      const y = Math.sin(lat) * R * 1.002
      const pts = []
      for (let a = 0; a <= 96; a++) {
        const t = (a / 96) * Math.PI * 2
        pts.push([Math.cos(t) * r, y, Math.sin(t) * r])
      }
      out.push({ pts, key: i })
    }
    return out
  }, [])

  return (
    <group>
      {rings.map(({ pts, key }) => (
        <Line
          key={key}
          points={pts}
          color="#7fa8ff"
          lineWidth={0.6}
          transparent
          opacity={key === 0 ? 0.3 : 0.12}
          dashed
          dashSize={0.55}
          gapSize={0.75}
          depthWrite={false}
        />
      ))}
    </group>
  )
}

export default function Planet() {
  const spin = useRef(null)

  const atmosphere = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: {
          uCold: { value: new THREE.Color('#3f6fd8') },
          uWarm: { value: new THREE.Color('#ff5b1f') },
          uSun: { value: new THREE.Vector3(-0.55, 0.35, 0.72) },
          uPower: { value: 2.6 },
          uIntensity: { value: 1.55 },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
        toneMapped: false,
      }),
    []
  )

  useFrame((_, delta) => {
    spin.current.rotation.y += delta * 0.018
  })

  return (
    <group position={[0, -11.6, -3]} rotation={[0, 0, 0.19]}>
      {/* dark, near-matte ground truth */}
      <mesh>
        <sphereGeometry args={[R, 96, 96]} />
        <meshStandardMaterial
          color="#080a10"
          roughness={0.92}
          metalness={0.14}
          envMapIntensity={0.75}
        />
      </mesh>

      {/* rotating hairline graticule */}
      <group ref={spin}>
        <Graticule />
      </group>

      {/* limb glow */}
      <mesh scale={1.045}>
        <sphereGeometry args={[R, 96, 96]} />
        <primitive object={atmosphere} attach="material" />
      </mesh>
    </group>
  )
}
