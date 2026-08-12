import { useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { ThreeElements } from '@react-three/fiber'

/**
 * A procedural CRT: the "attract mode" of four different cabinets rendered
 * entirely in a fragment shader (pong / invaders / racer / breakout) with
 * barrel distortion, scanlines, aperture grille and mains flicker.
 *
 * Colours are pushed above 1.0 and the material is `toneMapped={false}` so the
 * bloom pass picks the phosphor up — the HDR-glow trick from the pmndrs
 * "bloom-hdr-workflow-gltf" demo.
 */

const vert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const frag = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uVariant;
  uniform vec3 uInk;
  uniform vec3 uInk2;
  uniform vec3 uPaper;
  varying vec2 vUv;

  float rect(vec2 p, vec2 c, vec2 h) {
    vec2 d = abs(p - c) - h;
    return 1.0 - step(0.0, max(d.x, d.y));
  }
  float disc(vec2 p, vec2 c, float r) {
    return 1.0 - smoothstep(r * 0.7, r, length(p - c));
  }
  float tri(float x) { return abs(fract(x) * 2.0 - 1.0); }
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  void main() {
    float t = uTime;

    // barrel distortion
    vec2 c = vUv * 2.0 - 1.0;
    c *= 1.0 + 0.08 * vec2(c.y * c.y, c.x * c.x);
    vec2 p = c * 0.5 + 0.5;
    float inside = rect(p, vec2(0.5), vec2(0.5));

    float m = 0.0;   // primary ink
    float m2 = 0.0;  // accent ink
    int v = int(uVariant + 0.5);

    if (v == 0) {
      // ---- PONG ----
      m += rect(p, vec2(0.07, 0.5 + 0.3 * sin(t * 1.6)), vec2(0.02, 0.11));
      m += rect(p, vec2(0.93, 0.5 + 0.3 * sin(t * 1.6 + 0.9)), vec2(0.02, 0.11));
      m += rect(p, vec2(0.5, p.y), vec2(0.005, 0.5)) * step(0.5, fract(p.y * 14.0));
      m += rect(p, vec2(0.34, 0.93), vec2(0.028, 0.03));
      m += rect(p, vec2(0.66, 0.93), vec2(0.028, 0.03));
      m2 += rect(p, vec2(0.1 + 0.8 * tri(t * 0.42), 0.15 + 0.7 * tri(t * 0.61)), vec2(0.021, 0.027));
    } else if (v == 1) {
      // ---- INVADERS ----
      float sx = 0.11 * sin(t * 0.9);
      vec2 q = vec2((p.x - 0.14 - sx) / 0.12, (p.y - 0.5) / 0.115);
      vec2 id = floor(q);
      vec2 f = fract(q);
      float ing = step(0.0, id.x) * step(id.x, 5.0) * step(0.0, id.y) * step(id.y, 3.0);
      float legs = step(0.5, fract(t * 1.7));
      float alien = rect(f, vec2(0.5, 0.55), vec2(0.3, 0.15));
      alien += rect(f, vec2(0.5, 0.55), vec2(0.15, 0.28));
      alien += rect(f, vec2(0.25, 0.3), vec2(0.07, mix(0.05, 0.1, legs)));
      alien += rect(f, vec2(0.75, 0.3), vec2(0.07, mix(0.1, 0.05, legs)));
      m += ing * clamp(alien, 0.0, 1.0);

      float px = 0.5 + 0.3 * sin(t * 0.7);
      m2 += rect(p, vec2(px, 0.09), vec2(0.075, 0.028));
      m2 += rect(p, vec2(px, 0.135), vec2(0.02, 0.03));
      m2 += rect(p, vec2(px, 0.19 + fract(t * 1.05) * 0.66), vec2(0.008, 0.035));
      m += rect(p, vec2(p.x, 0.025), vec2(0.5, 0.006));
    } else if (v == 2) {
      // ---- OUTRUN RACER ----
      float hy = 0.52;
      if (p.y < hy) {
        float k = max(hy - p.y, 0.0005);
        float z = 0.055 / (k + 0.012);
        float cx = 0.5 + 0.17 * sin(t * 0.55) * (1.0 - clamp(k * 2.4, 0.0, 1.0));
        float w = clamp(0.05 * z, 0.02, 0.95);
        float dx = abs(p.x - cx);
        float ew = clamp(0.018 * z, 0.005, 0.06);
        m += 1.0 - step(ew, abs(dx - w));
        m += 0.3 * step(0.5, fract(z * 0.42 - t * 1.1)) * step(w + 0.02, dx);
        m2 += step(0.5, fract(z * 0.85 - t * 2.1)) * (1.0 - step(clamp(0.011 * z, 0.004, 0.03), dx));
        float carx = 0.5 + 0.05 * sin(t * 0.85);
        m2 += rect(p, vec2(carx, 0.1), vec2(0.075, 0.03));
        m += rect(p, vec2(carx, 0.145), vec2(0.045, 0.02));
      } else {
        float s = disc(p, vec2(0.5, hy + 0.17), 0.15);
        m2 += s * step(0.42, fract((p.y - hy) * 34.0));
        m += step(0.992, hash(floor(p * 70.0))) * step(hy + 0.3, p.y);
      }
    } else {
      // ---- BREAKOUT ----
      vec2 q = vec2(p.x * 8.0, (p.y - 0.58) * 13.0);
      vec2 id = floor(q);
      vec2 f = fract(q);
      float ing = step(0.0, id.y) * step(id.y, 3.0) * step(0.0, id.x) * step(id.x, 7.0);
      float gone = step(0.6, hash(id + floor(t * 0.3)));
      float brick = ing * (1.0 - gone) * rect(f, vec2(0.5), vec2(0.42, 0.32));
      m += brick * step(id.y, 1.5);
      m2 += brick * step(1.5, id.y);
      float px = 0.5 + 0.32 * sin(t * 1.25);
      m += rect(p, vec2(px, 0.07), vec2(0.09, 0.022));
      m2 += rect(p, vec2(0.12 + 0.76 * tri(t * 0.5), 0.13 + 0.4 * tri(t * 0.83)), vec2(0.016, 0.021));
    }

    vec3 col = uPaper;
    col = mix(col, uInk, clamp(m, 0.0, 1.0));
    col = mix(col, uInk2, clamp(m2, 0.0, 1.0));
    col += uInk * 0.08 * clamp(m, 0.0, 1.0);

    // CRT artefacts
    col *= 0.78 + 0.22 * sin(vUv.y * 300.0);
    col *= 1.0 + 0.05 * sin(vUv.y * 6.2831 - t * 1.3);
    col *= 0.97 + 0.03 * sin(t * 41.0);
    col *= 0.9 + 0.1 * sin(vUv.x * 420.0);

    float vig = smoothstep(0.0, 0.4, 1.0 - abs(c.x)) * smoothstep(0.0, 0.4, 1.0 - abs(c.y));
    col *= mix(0.22, 1.0, vig) * inside;

    gl_FragColor = vec4(col * 1.7, 1.0);
  }
`

export type CrtScreenProps = {
  variant: number
  ink: string
  ink2: string
  paper?: string
  width?: number
  height?: number
} & Omit<ThreeElements['mesh'], 'children'>

export function CrtScreen({
  variant,
  ink,
  ink2,
  paper = '#0a0616',
  width = 0.62,
  height = 0.46,
  ...props
}: CrtScreenProps) {
  const uniforms = useMemo(
    () => ({
      uTime: { value: Math.random() * 60 },
      uVariant: { value: variant },
      uInk: { value: new THREE.Color(ink).multiplyScalar(1.35) },
      uInk2: { value: new THREE.Color(ink2).multiplyScalar(1.8) },
      uPaper: { value: new THREE.Color(paper) },
    }),
    [variant, ink, ink2, paper],
  )

  useFrame((_, delta) => {
    uniforms.uTime.value += delta
  })

  return (
    <mesh {...props}>
      <planeGeometry args={[width, height]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vert}
        fragmentShader={frag}
        toneMapped={false}
      />
    </mesh>
  )
}
