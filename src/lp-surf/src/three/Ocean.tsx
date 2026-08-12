import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Water } from 'three-stdlib'

import { createWaterNormals } from './waterNormals'
import { fogDensity, fogTint, SUN_DIR } from './env'

/**
 * Adapted from the pmndrs `water-shader` example (three-stdlib `Water` +
 * drei `Sky`), with the shipped `waternormals.jpeg` swapped for a normal map
 * baked at runtime so nothing is fetched.
 */
export function useOceanWater() {
  const water = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(12000, 12000)
    const w = new Water(geometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: createWaterNormals(256),
      sunDirection: SUN_DIR.clone(),
      sunColor: 0xffe6bd,
      waterColor: 0x0a3944,
      distortionScale: 2.4,
      fog: true,
    })
    w.rotation.x = -Math.PI / 2
    return w
  }, [])

  useEffect(() => {
    return () => {
      water.geometry.dispose()
      water.material.dispose()
    }
  }, [water])

  useFrame((_, delta) => {
    water.material.uniforms.time.value += Math.min(delta, 0.05) * 0.6
  })

  return water
}

/**
 * The `Water` mesh is front-facing only, so from below the surface would be a
 * hole straight through to the sky. This is the view from underneath: a
 * shimmering ceiling that fogs out into the deep exactly like everything else.
 */
export function OceanUnderside() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uFog: { value: fogTint },
          uDensity: fogDensity,
          uTint: { value: new THREE.Color('#63d6dd') },
          uSun: { value: new THREE.Color('#ffe3b0') },
        },
        vertexShader: /* glsl */ `
          varying vec3 vW;
          void main() {
            vec4 w = modelMatrix * vec4(position, 1.0);
            vW = w.xyz;
            gl_Position = projectionMatrix * viewMatrix * w;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          uniform vec3 uFog;
          uniform float uDensity;
          uniform vec3 uTint;
          uniform vec3 uSun;
          varying vec3 vW;

          void main() {
            vec2 p = vW.xz * 0.075;
            float r =
                sin(p.x * 1.30 + uTime * 0.70) * sin(p.y * 1.10 - uTime * 0.50)
              + 0.55 * sin(p.x * 2.70 - uTime * 1.10) * sin(p.y * 3.10 + uTime * 0.90)
              + 0.30 * sin((p.x + p.y) * 5.30 + uTime * 1.60);

            float shimmer = smoothstep(-0.35, 1.30, r);
            vec3 col = mix(uTint * 0.16, uTint * 0.72, shimmer);
            col += uSun * pow(shimmer, 7.0) * 0.28;

            float dist = length(vW - cameraPosition);
            float f = 1.0 - exp(-pow(uDensity * dist, 2.0));
            gl_FragColor = vec4(mix(col, uFog, clamp(f, 0.0, 1.0)), 1.0);
          }
        `,
      }),
    []
  )

  useEffect(() => () => mat.dispose(), [mat])
  useFrame((_, delta) => {
    mat.uniforms.uTime.value += Math.min(delta, 0.05)
  })

  return (
    <mesh rotation-x={Math.PI / 2} position-y={-0.08} renderOrder={-1}>
      <planeGeometry args={[4000, 4000]} />
      <primitive object={mat} attach="material" />
    </mesh>
  )
}

/** Sand and runtime caustics, borrowing the ripple trick from drei's Caustics demo. */
export function Seafloor() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uFog: { value: fogTint },
          uDensity: fogDensity,
          uSand: { value: new THREE.Color('#1d4a52') },
        },
        vertexShader: /* glsl */ `
          varying vec3 vW;
          void main() {
            vec4 w = modelMatrix * vec4(position, 1.0);
            vW = w.xyz;
            gl_Position = projectionMatrix * viewMatrix * w;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          uniform vec3 uFog;
          uniform float uDensity;
          uniform vec3 uSand;
          varying vec3 vW;

          float caustic(vec2 p, float t) {
            vec2 i = p;
            float c = 1.0;
            const float inten = 0.0055;
            for (int n = 0; n < 4; n++) {
              float ti = t * (1.0 - (3.5 / float(n + 1)));
              i = p + vec2(cos(ti - i.x) + sin(ti + i.y), sin(ti - i.y) + cos(ti + i.x));
              c += 1.0 / length(vec2(
                p.x / (sin(i.x + ti) / inten),
                p.y / (cos(i.y + ti) / inten)
              ));
            }
            c /= 4.0;
            c = 1.17 - pow(c, 1.4);
            return clamp(pow(abs(c), 7.0), 0.0, 1.6);
          }

          void main() {
            vec2 p = vW.xz * 0.055;
            float c = caustic(p, uTime * 0.32);

            // rippled sand
            float ridges = 0.5 + 0.5 * sin(vW.x * 0.35 + sin(vW.z * 0.12) * 2.0);
            vec3 col = uSand * (0.82 + 0.18 * ridges);
            col += vec3(0.42, 0.78, 0.80) * c;

            float dist = length(vW - cameraPosition);
            float f = 1.0 - exp(-pow(uDensity * dist, 2.0));
            gl_FragColor = vec4(mix(col, uFog, clamp(f, 0.0, 1.0)), 1.0);
          }
        `,
      }),
    []
  )

  useEffect(() => () => mat.dispose(), [mat])
  useFrame((_, delta) => {
    mat.uniforms.uTime.value += Math.min(delta, 0.05)
  })

  return (
    <mesh rotation-x={-Math.PI / 2} position-y={-62}>
      <planeGeometry args={[3000, 3000]} />
      <primitive object={mat} attach="material" />
    </mesh>
  )
}

/** Sunlight raked into shafts by the surface chop. */
export function Godrays() {
  const group = useRef<THREE.Group>(null!)

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color('#bdf1ea') },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          uniform vec3 uColor;
          varying vec2 vUv;

          float hash(float n) { return fract(sin(n) * 43758.5453123); }
          float noise(float x) {
            float i = floor(x), f = fract(x);
            f = f * f * (3.0 - 2.0 * f);
            return mix(hash(i), hash(i + 1.0), f);
          }

          void main() {
            float shafts = 0.0;
            for (int n = 0; n < 5; n++) {
              float fi = float(n);
              float c = 0.10 + 0.20 * fi + 0.035 * sin(uTime * 0.18 + fi * 2.1);
              float w = 0.016 + 0.028 * noise(fi * 7.3);
              float pulse = 0.45 + 0.55 * noise(uTime * 0.25 + fi * 3.7);
              shafts += smoothstep(w, 0.0, abs(vUv.x - c)) * pulse;
            }
            float fromSurface = pow(vUv.y, 1.7);
            float edge = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);
            gl_FragColor = vec4(uColor, shafts * fromSurface * edge * 0.14);
          }
        `,
      }),
    []
  )

  useEffect(() => () => mat.dispose(), [mat])
  useFrame((_, delta) => {
    mat.uniforms.uTime.value += Math.min(delta, 0.05)
  })

  const shafts = useMemo(
    () =>
      // y is chosen so the top edge of every shaft sits just under the surface
      [
        [-26, -49, -6, 0.18],
        [10, -49, -26, -0.12],
        [-8, -49, -44, 0.22],
        [30, -49, -58, -0.2],
        [-34, -49, -70, 0.1],
        [4, -49, -86, -0.16],
      ] as Array<[number, number, number, number]>,
    []
  )

  return (
    <group ref={group}>
      {shafts.map(([x, y, z, tilt], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[0, tilt, tilt * 0.6]} renderOrder={2}>
          <planeGeometry args={[52, 94]} />
          <primitive object={mat} attach="material" />
        </mesh>
      ))}
    </group>
  )
}

/** Plankton and bubble haze drifting up through the column. */
export function Motes({ count = 900 }: { count?: number }) {
  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    const sizes = new Float32Array(count)
    const rnd = (() => {
      let a = 7717
      return () => {
        a = (a * 1664525 + 1013904223) >>> 0
        return a / 4294967296
      }
    })()

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (rnd() - 0.5) * 130
      positions[i * 3 + 1] = -46 + rnd() * 52
      positions[i * 3 + 2] = -110 + rnd() * 160
      seeds[i] = rnd()
      sizes[i] = 1.2 + rnd() * 3.6
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#cdf3ee') },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        uniform float uTime;
        attribute float aSeed;
        attribute float aSize;
        varying float vAlpha;

        void main() {
          vec3 p = position;
          float rise = uTime * (0.35 + aSeed * 0.75);
          p.y = mod(p.y + rise + 46.0, 52.0) - 46.0;
          p.x += sin(uTime * 0.28 + aSeed * 21.0) * 1.4;
          p.z += cos(uTime * 0.21 + aSeed * 13.0) * 1.1;

          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = aSize * (46.0 / max(-mv.z, 0.001));
          gl_Position = projectionMatrix * mv;
          vAlpha = (0.25 + 0.75 * fract(aSeed * 7.13)) * smoothstep(140.0, 20.0, -mv.z);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.06, d) * vAlpha;
          if (a < 0.01) discard;
          gl_FragColor = vec4(uColor, a * 0.55);
        }
      `,
    })

    return { geometry, material }
  }, [count])

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material]
  )

  useFrame((_, delta) => {
    material.uniforms.uTime.value += Math.min(delta, 0.05)
  })

  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={3} />
}
