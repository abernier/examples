import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { noiseGLSL, worldVertexGLSL } from './glsl'
import { radialGlowTexture } from './textures'

/** Direction the (off-screen) primary star lights everything from. */
export const LIGHT_DIR = new THREE.Vector3(-0.62, 0.34, 0.7).normalize()

const bodyFragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uLightDir;
  uniform vec3 uDeep;
  uniform vec3 uMid;
  uniform vec3 uHot;

  varying vec3 vNormalW;
  varying vec3 vPosW;
  varying vec3 vPosL;

  ${noiseGLSL}

  void main() {
    vec3 n = normalize(vNormalW);
    vec3 p = normalize(vPosL);
    float t = uTime * 0.025;

    // Latitudinal banding, warped by a slow large-scale flow.
    float warp = fbm(p * 2.1 + vec3(0.0, t * 0.6, 0.0));
    float bands = fbm(vec3(p.x * 1.4, p.y * 6.5 + warp * 2.6, p.z * 1.4) + vec3(t, 0.0, -t));
    float storms = fbm(p * 5.5 + warp * 1.8 + vec3(-t * 1.4, 0.0, t));

    vec3 albedo = mix(uDeep, uMid, smoothstep(0.24, 0.76, bands));
    albedo = mix(albedo, uHot, smoothstep(0.56, 0.98, storms) * 0.6);

    vec3 L = normalize(uLightDir);
    float lambert = smoothstep(-0.14, 0.5, dot(n, L));

    vec3 viewDir = normalize(cameraPosition - vPosW);
    float rim = pow(1.0 - max(dot(n, viewDir), 0.0), 3.2);

    vec3 lit = albedo * (0.045 + lambert * 1.25);
    lit += uHot * rim * 0.55 * smoothstep(-0.55, 0.65, dot(n, L));

    gl_FragColor = vec4(lit, 1.0);
  }
`

const atmosphereFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uLightDir;
  uniform float uIntensity;

  varying vec3 vNormalW;
  varying vec3 vPosW;
  varying vec3 vPosL;

  void main() {
    vec3 n = normalize(vNormalW);
    vec3 viewDir = normalize(cameraPosition - vPosW);
    float fres = pow(1.0 - max(dot(n, viewDir), 0.0), 2.6);
    float day = smoothstep(-0.45, 0.7, dot(n, normalize(uLightDir)));
    gl_FragColor = vec4(uColor * fres * uIntensity * (0.15 + day), 1.0);
  }
`

const ringFragment = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uLightDir;
  uniform vec3 uPlanetPos;
  uniform float uPlanetR;
  uniform float uInner;
  uniform float uOuter;

  varying vec3 vNormalW;
  varying vec3 vPosW;
  varying vec3 vPosL;

  ${noiseGLSL}

  void main() {
    float r = length(vPosL.xy);
    float t = clamp((r - uInner) / (uOuter - uInner), 0.0, 1.0);

    // Ringlets at two scales, plus two Cassini-style divisions.
    float fine = vnoise(vec3(t * 260.0, 3.1, 8.7));
    float coarse = vnoise(vec3(t * 44.0, 1.7, 2.3));
    float grain = coarse * 0.62 + fine * 0.38;

    float gapA = smoothstep(0.012, 0.055, abs(t - 0.41));
    float gapB = smoothstep(0.006, 0.032, abs(t - 0.72));
    float edges = smoothstep(0.0, 0.09, t) * (1.0 - smoothstep(0.82, 1.0, t));

    float alpha = grain * gapA * gapB * edges;

    // Cheap analytic planet shadow cast across the ring plane.
    vec3 L = normalize(uLightDir);
    vec3 rel = vPosW - uPlanetPos;
    float along = dot(rel, L);
    float perp = length(rel - along * L);
    float umbra = smoothstep(uPlanetR * 0.82, uPlanetR * 1.3, perp);
    float shade = mix(1.0, umbra, step(along, 0.0));

    vec3 col = mix(uColorA, uColorB, t) * (0.18 + 1.05 * shade);

    if (alpha < 0.012) discard;
    gl_FragColor = vec4(col, alpha * 0.9);
  }
`

type PlanetProps = {
  position?: [number, number, number]
  radius?: number
}

export function Planet({ position = [0, 0, 0], radius = 1.65 }: PlanetProps) {
  const body = useRef<THREE.Mesh>(null!)
  const group = useRef<THREE.Group>(null!)

  const [px, py, pz] = position
  const planetPos = useMemo(() => new THREE.Vector3(px, py, pz), [px, py, pz])
  const glowMap = useMemo(() => radialGlowTexture(), [])

  const inner = radius * 1.45
  const outer = radius * 2.55

  const bodyUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uLightDir: { value: LIGHT_DIR },
      uDeep: { value: new THREE.Color('#0b1c3a') },
      uMid: { value: new THREE.Color('#3a6ea8') },
      uHot: { value: new THREE.Color('#ffb473') },
    }),
    [],
  )

  const atmosphereUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color('#7fd0ff') },
      uLightDir: { value: LIGHT_DIR },
      uIntensity: { value: 1.5 },
    }),
    [],
  )

  const ringUniforms = useMemo(
    () => ({
      uColorA: { value: new THREE.Color('#e6d3b3') },
      uColorB: { value: new THREE.Color('#6f93c9') },
      uLightDir: { value: LIGHT_DIR },
      uPlanetPos: { value: planetPos },
      uPlanetR: { value: radius },
      uInner: { value: inner },
      uOuter: { value: outer },
    }),
    [planetPos, radius, inner, outer],
  )

  useFrame((state, delta) => {
    bodyUniforms.uTime.value = state.clock.elapsedTime
    body.current.rotation.y += delta * 0.028
    group.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.06) * 0.012
  })

  return (
    <group ref={group} position={position}>
      {/* Broad, soft halo — a procedural canvas gradient, always camera-facing. */}
      <Billboard>
        <mesh renderOrder={-1}>
          <planeGeometry args={[radius * 9, radius * 9]} />
          <meshBasicMaterial
            map={glowMap}
            transparent
            opacity={0.5}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      </Billboard>

      <mesh ref={body} rotation={[0.16, 0, 0.09]}>
        <sphereGeometry args={[radius, 96, 64]} />
        <shaderMaterial
          vertexShader={worldVertexGLSL}
          fragmentShader={bodyFragment}
          uniforms={bodyUniforms}
        />
      </mesh>

      <mesh rotation={[0.16, 0, 0.09]}>
        <sphereGeometry args={[radius * 1.055, 64, 48]} />
        <shaderMaterial
          vertexShader={worldVertexGLSL}
          fragmentShader={atmosphereFragment}
          uniforms={atmosphereUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2 + 0.36, 0, 0.24]}>
        <ringGeometry args={[inner, outer, 220, 1]} />
        <shaderMaterial
          vertexShader={worldVertexGLSL}
          fragmentShader={ringFragment}
          uniforms={ringUniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
