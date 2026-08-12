import * as THREE from 'three'

/**
 * Procedural, fully offline surface maps for the matte glaze.
 * Everything is painted into a <canvas> at runtime — no texture files, no CDN.
 */

function valueNoiseCanvas(size, octaves, seed, lo = 0, hi = 1) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const image = ctx.createImageData(size, size)
  const data = image.data

  // A handful of coarse lattices, bilinearly sampled and stacked.
  const lattices = []
  let s = seed
  const rand = () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
  for (let o = 0; o < octaves; o++) {
    const n = 4 << o
    const grid = new Float32Array(n * n)
    for (let i = 0; i < grid.length; i++) grid[i] = rand()
    lattices.push({ n, grid })
  }

  const sample = ({ n, grid }, u, v) => {
    const x = u * n
    const y = v * n
    const x0 = Math.floor(x)
    const y0 = Math.floor(y)
    const fx = x - x0
    const fy = y - y0
    const sx = fx * fx * (3 - 2 * fx)
    const sy = fy * fy * (3 - 2 * fy)
    const at = (i, j) => grid[(((j % n) + n) % n) * n + (((i % n) + n) % n)]
    const a = at(x0, y0)
    const b = at(x0 + 1, y0)
    const c = at(x0, y0 + 1)
    const d = at(x0 + 1, y0 + 1)
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size
      const v = y / size
      let amp = 0.5
      let sum = 0
      let norm = 0
      for (const l of lattices) {
        sum += sample(l, u, v) * amp
        norm += amp
        amp *= 0.55
      }
      const value = Math.round((lo + (hi - lo) * (sum / norm)) * 255)
      const i = (y * size + x) * 4
      data[i] = data[i + 1] = data[i + 2] = value
      data[i + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)
  return canvas
}

function makeTexture(canvas, repeat) {
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(repeat, repeat)
  texture.anisotropy = 4
  texture.needsUpdate = true
  return texture
}

let maps = null

/** Grog-speckled bump + a breathing roughness variation, shared by every pot. */
export function clayMaps() {
  if (maps) return maps
  // Grog speckle: full-range, drives the bump.
  const grain = valueNoiseCanvas(256, 5, 20110407)
  // Glaze breathing: deliberately biased bright so it only ever *softens*
  // roughness a little — matte clay should never read as satin.
  const blotch = valueNoiseCanvas(256, 3, 913371, 0.78, 1)
  maps = {
    bump: makeTexture(grain, 5),
    roughness: makeTexture(blotch, 2),
  }
  return maps
}

/** Warm, chalky bodies pulled from the studio's glaze book. */
export const GLAZES = {
  ochre: { color: '#c8763a', roughness: 0.86, bumpScale: 0.28 },
  sienna: { color: '#9a4526', roughness: 0.9, bumpScale: 0.32 },
  bone: { color: '#e6d7bf', roughness: 0.95, bumpScale: 0.24 },
  sand: { color: '#cdae86', roughness: 0.92, bumpScale: 0.26 },
  ash: { color: '#8a7358', roughness: 0.97, bumpScale: 0.3 },
}
