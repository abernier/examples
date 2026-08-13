import * as THREE from 'three'
import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'

/**
 * Curtain-of-light material for the aurora ribbons.
 *
 * Built with drei's `shaderMaterial` + fiber's `extend` — the same authoring
 * pattern as the pmndrs "instances" example (MeshEdgesMaterial), so every
 * uniform below is also a JSX prop and a setter on the instance.
 *
 * The plane is bent in the vertex stage (two out-of-phase sine waves in z + y)
 * and the visible band is carved out of fbm value-noise in the fragment stage,
 * so the ribbon never repeats and needs no texture — nothing is fetched.
 */
export const AuroraMaterial = shaderMaterial(
  {
    uTime: 0,
    uSeed: 0,
    uOpacity: 1,
    uIntensity: 1,
    uBend: 1,
    uColorLow: new THREE.Color('#0e7c8f'),
    uColorHigh: new THREE.Color('#8affd2'),
  },
  /* glsl */ `
    uniform float uTime;
    uniform float uSeed;
    uniform float uBend;
    varying vec2 vUv;

    void main() {
      vUv = uv;
      vec3 p = position;
      float t = uTime * 0.16 + uSeed * 12.0;
      float sway = sin(p.x * 0.22 + t) * 2.4 + sin(p.x * 0.09 - t * 0.63) * 3.1;
      p.z += sway * uBend;
      p.y += sin(p.x * 0.15 + t * 0.8) * 1.1 * uBend;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
  `,
  /* glsl */ `
    uniform float uTime;
    uniform float uSeed;
    uniform float uOpacity;
    uniform float uIntensity;
    uniform vec3 uColorLow;
    uniform vec3 uColorHigh;
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float vnoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      for (int i = 0; i < 5; i++) {
        v += a * vnoise(p);
        p *= 2.03;
        a *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 uv = vUv;
      float t = uTime * 0.055 + uSeed * 7.0;

      // slow drifting curtain + fast vertical striations (the "rays")
      float curtain = fbm(vec2(uv.x * 3.4 + t, uv.y * 1.15 - t * 0.55));
      float rays = fbm(vec2(uv.x * 17.0 - t * 2.3, uv.y * 1.6 + t * 0.9));

      float band = smoothstep(0.24, 0.86, curtain) * (0.5 + 0.5 * rays);

      // bright along the lower hem, dissolving towards the top of the sky
      float vert = smoothstep(0.0, 0.30, uv.y) * (1.0 - smoothstep(0.34, 1.0, uv.y));
      float hem = pow(1.0 - uv.y, 2.0) * 0.55;
      float edge = smoothstep(0.0, 0.16, uv.x) * (1.0 - smoothstep(0.84, 1.0, uv.x));

      float a = (band * vert + band * hem) * edge * uOpacity;

      vec3 col = mix(uColorLow, uColorHigh, clamp(pow(uv.y, 0.7) + rays * 0.35, 0.0, 1.0));
      col += vec3(0.06, 0.02, 0.12) * (1.0 - uv.y);

      gl_FragColor = vec4(col * (0.45 + a * 2.2) * uIntensity, a);
    }
  `
)

extend({ AuroraMaterial })
