import * as THREE from 'three'

/**
 * A procedural, fully offline HDR environment.
 *
 * drei's `<Environment preset="…" />` pulls an .hdr off a CDN, which would break
 * the page offline / under file://. Instead we synthesise an equirectangular
 * float texture here: a graded studio "sky" plus a handful of soft light discs
 * — the same idea as stacking `<Lightformer>`s, but bakeable and dependency-free.
 *
 * Values go above 1.0 on purpose: the gem's refraction shader and the bloom pass
 * both want real highlights to chew on.
 */

type Softbox = {
  /** direction the light sits in, world space (normalised internally) */
  dir: [number, number, number]
  /** angular tightness — higher is a smaller, harder source */
  sharpness: number
  intensity: number
  color: [number, number, number]
}

const SOFTBOXES: Softbox[] = [
  // key light, high and slightly camera-left — the one that lights the table facet
  { dir: [-0.55, 0.85, 0.5], sharpness: 90, intensity: 22, color: [1, 0.97, 0.9] },
  // warm champagne rim, behind and to the right
  { dir: [0.9, 0.35, -0.6], sharpness: 55, intensity: 12, color: [1, 0.82, 0.5] },
  // cool fill, low and camera-right, keeps the pavilion from going muddy
  { dir: [0.7, -0.25, 0.75], sharpness: 40, intensity: 5, color: [0.72, 0.82, 1] },
  // long horizontal strip light, reads as a window in the facets
  { dir: [-0.85, 0.1, -0.5], sharpness: 26, intensity: 6, color: [1, 0.93, 0.85] },
  // faint bounce from below, so the culet isn't a black hole
  { dir: [0, -1, 0], sharpness: 6, intensity: 0.6, color: [0.55, 0.5, 0.62] },
  // broad ambient wash from camera-side, keeps the smaller stones legible
  { dir: [-0.2, 0.45, 1], sharpness: 5, intensity: 1.5, color: [0.86, 0.89, 1] },
  { dir: [0.35, 0.8, -0.2], sharpness: 7, intensity: 1.2, color: [1, 0.95, 0.86] },
]

const WIDTH = 512
const HEIGHT = 256

let cached: THREE.DataTexture | null = null

export function getEnvironmentTexture(): THREE.DataTexture {
  if (cached) return cached

  const data = new Float32Array(WIDTH * HEIGHT * 4)

  // pre-normalise the softbox directions once
  const boxes = SOFTBOXES.map((s) => {
    const [x, y, z] = s.dir
    const len = Math.hypot(x, y, z) || 1
    return { ...s, dir: [x / len, y / len, z / len] as [number, number, number] }
  })

  for (let j = 0; j < HEIGHT; j++) {
    // v goes top (0) -> bottom (1); phi is the polar angle
    const v = (j + 0.5) / HEIGHT
    const phi = v * Math.PI
    const sinPhi = Math.sin(phi)
    const dy = Math.cos(phi)

    // graded backdrop: near-black floor, deep warm grey horizon, cool dark ceiling
    const h = (dy + 1) * 0.5
    const grade = 0.03 + 0.12 * Math.pow(1 - Math.abs(dy), 3) + 0.14 * Math.pow(h, 2.5)

    for (let i = 0; i < WIDTH; i++) {
      const u = (i + 0.5) / WIDTH
      const theta = u * Math.PI * 2
      const dx = sinPhi * Math.cos(theta)
      const dz = sinPhi * Math.sin(theta)

      let r = grade * 1.0
      let g = grade * 0.96
      let b = grade * 1.12

      for (let k = 0; k < boxes.length; k++) {
        const s = boxes[k]
        const d = dx * s.dir[0] + dy * s.dir[1] + dz * s.dir[2]
        if (d <= 0) continue
        const falloff = Math.pow(d, s.sharpness) * s.intensity
        if (falloff < 0.001) continue
        r += falloff * s.color[0]
        g += falloff * s.color[1]
        b += falloff * s.color[2]
      }

      const o = (j * WIDTH + i) * 4
      data[o] = r
      data[o + 1] = g
      data[o + 2] = b
      data[o + 3] = 1
    }
  }

  const texture = new THREE.DataTexture(data, WIDTH, HEIGHT, THREE.RGBAFormat, THREE.FloatType)
  texture.mapping = THREE.EquirectangularReflectionMapping
  texture.colorSpace = THREE.LinearSRGBColorSpace
  texture.magFilter = THREE.LinearFilter
  texture.minFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true

  cached = texture
  return texture
}
