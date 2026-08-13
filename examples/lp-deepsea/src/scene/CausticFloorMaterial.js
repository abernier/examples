import * as THREE from 'three'
import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'

// Declarative custom shader material, set up exactly the way the pmndrs
// "shadermaterials" example does it: shaderMaterial() -> extend() -> JSX tag,
// with every uniform available as a setter on the instance.
//
// The pattern here is the classic additive water-caustic interference loop,
// used as the sheet of floodlight that the submersible throws on the seabed.
export const CausticFloorMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color('#5ef3ff'),
    uWarm: new THREE.Color('#1d6f86'),
    uIntensity: 1,
    uScale: 3.2,
  },
  /* glsl */ `
    varying vec2 vUv;
    varying vec3 vWorld;
    void main() {
      vUv = uv;
      vec4 world = modelMatrix * vec4(position, 1.0);
      vWorld = world.xyz;
      gl_Position = projectionMatrix * viewMatrix * world;
    }
  `,
  /* glsl */ `
    uniform float uTime;
    uniform float uIntensity;
    uniform float uScale;
    uniform vec3 uColor;
    uniform vec3 uWarm;
    varying vec2 vUv;
    varying vec3 vWorld;

    float caustic(vec2 p, float t) {
      vec2 i = p;
      float c = 1.0;
      const float inten = 0.0045;
      for (int n = 0; n < 4; n++) {
        float tt = t * (1.0 - (3.5 / float(n + 1)));
        i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
        c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
      }
      c /= 4.0;
      c = 1.17 - pow(c, 1.4);
      return clamp(pow(abs(c), 8.0), 0.0, 1.6);
    }

    void main() {
      vec2 p = (vUv - 0.5) * uScale * 6.2831;
      float t = uTime * 0.35;

      float a = caustic(p, t);
      float b = caustic(p * 1.7 + 12.0, t * 0.62 + 4.0) * 0.45;
      float lum = a + b;

      // tight pool of light under the vessel, then a hard fall-off into black water
      float r = length(vUv - 0.5) * 2.0;
      float pool = smoothstep(0.62, 0.02, r);
      float haze = smoothstep(0.8, 0.2, r) * 0.025;

      vec3 col = mix(uWarm, uColor, clamp(lum * 0.9, 0.0, 1.0));
      float alpha = (lum * pool * uIntensity) + haze;

      // depth fade so the sheet dissolves into the fog instead of ending on a line
      float dist = length(vWorld - cameraPosition);
      alpha *= exp(-0.11 * max(dist - 3.0, 0.0));
      alpha = clamp(alpha, 0.0, 0.85);

      gl_FragColor = vec4(col * alpha, alpha);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `
)

extend({ CausticFloorMaterial })
