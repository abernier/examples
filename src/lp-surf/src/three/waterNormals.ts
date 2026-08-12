import * as THREE from 'three'

/**
 * three-stdlib's `Water` wants a tiling normal map. The pmndrs water-shader
 * example ships a `waternormals.jpeg`; we bake an equivalent one at runtime so
 * the page has zero external assets and still works from file://.
 */

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const fade = (t: number) => t * t * (3 - 2 * t)
const mix = (a: number, b: number, t: number) => a + (b - a) * t

/** Periodic value noise summed over octaves — tiles seamlessly at `size`. */
function tileableFbm(size: number, seed: number) {
  const rnd = mulberry32(seed)
  const height = new Float32Array(size * size)
  const octaves: Array<[number, number]> = [
    [4, 1],
    [8, 0.55],
    [16, 0.3],
    [32, 0.16],
    [64, 0.08],
  ]
  let total = 0

  for (const [freq, amp] of octaves) {
    total += amp
    const grid = new Float32Array(freq * freq)
    for (let i = 0; i < grid.length; i++) grid[i] = rnd()

    for (let y = 0; y < size; y++) {
      const fy = (y / size) * freq
      const yi = Math.floor(fy)
      const y0 = yi % freq
      const y1 = (y0 + 1) % freq
      const ty = fade(fy - yi)

      for (let x = 0; x < size; x++) {
        const fx = (x / size) * freq
        const xi = Math.floor(fx)
        const x0 = xi % freq
        const x1 = (x0 + 1) % freq
        const tx = fade(fx - xi)

        const top = mix(grid[y0 * freq + x0], grid[y0 * freq + x1], tx)
        const bottom = mix(grid[y1 * freq + x0], grid[y1 * freq + x1], tx)
        height[y * size + x] += mix(top, bottom, ty) * amp
      }
    }
  }

  for (let i = 0; i < height.length; i++) height[i] /= total
  return height
}

export function createWaterNormals(size = 256, strength = 3.2): THREE.DataTexture {
  const height = tileableFbm(size, 9241)
  const data = new Uint8Array(size * size * 4)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const l = height[y * size + ((x - 1 + size) % size)]
      const r = height[y * size + ((x + 1) % size)]
      const d = height[((y + 1) % size) * size + x]
      const u = height[((y - 1 + size) % size) * size + x]

      let nx = (l - r) * strength
      let ny = (u - d) * strength
      let nz = 1
      const len = Math.hypot(nx, ny, nz)
      nx /= len
      ny /= len
      nz /= len

      const i = (y * size + x) * 4
      data[i] = (nx * 0.5 + 0.5) * 255
      data[i + 1] = (ny * 0.5 + 0.5) * 255
      data[i + 2] = (nz * 0.5 + 0.5) * 255
      data[i + 3] = 255
    }
  }

  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.magFilter = THREE.LinearFilter
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.generateMipmaps = true
  tex.anisotropy = 4
  tex.needsUpdate = true
  return tex
}
