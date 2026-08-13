import * as THREE from 'three'

/** Deterministic PRNG so the sky looks the same on every reload. */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeCanvas(size: number) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  return canvas
}

/** Soft radial falloff — used for the planet halo and the laser beam bloom. */
export function radialGlowTexture(size = 256) {
  const canvas = makeCanvas(size)
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0.0, 'rgba(190, 224, 255, 0.95)')
  g.addColorStop(0.12, 'rgba(120, 176, 255, 0.45)')
  g.addColorStop(0.34, 'rgba(70, 116, 200, 0.14)')
  g.addColorStop(0.62, 'rgba(40, 60, 130, 0.04)')
  g.addColorStop(1.0, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

type NebulaOptions = {
  seed: number
  /** [r, g, b] 0-255 core tint */
  tint: [number, number, number]
  blobs?: number
}

/**
 * Procedural emission-nebula sheet: a few dozen additive radial blobs, masked
 * by a soft circular falloff so the quad has no visible edges. Entirely
 * generated in a 2D canvas at runtime — nothing is fetched.
 */
export function nebulaTexture({ seed, tint, blobs = 46 }: NebulaOptions, size = 512) {
  const canvas = makeCanvas(size)
  const ctx = canvas.getContext('2d')!
  const rnd = mulberry32(seed)

  ctx.clearRect(0, 0, size, size)
  ctx.globalCompositeOperation = 'lighter'

  for (let i = 0; i < blobs; i++) {
    const cx = size * (0.5 + (rnd() - 0.5) * 0.86)
    const cy = size * (0.5 + (rnd() - 0.5) * 0.86)
    const r = size * (0.05 + rnd() * 0.26)
    const drift = 0.55 + rnd() * 0.85
    const [tr, tg, tb] = tint
    const cr = Math.min(255, Math.round(tr * drift))
    const cg = Math.min(255, Math.round(tg * drift))
    const cb = Math.min(255, Math.round(tb * drift))
    const alpha = 0.05 + rnd() * 0.11

    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    g.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${alpha})`)
    g.addColorStop(0.45, `rgba(${cr}, ${cg}, ${cb}, ${alpha * 0.36})`)
    g.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // A handful of bright knots — these are what the bloom pass latches onto.
  for (let i = 0; i < 8; i++) {
    const cx = size * (0.5 + (rnd() - 0.5) * 0.6)
    const cy = size * (0.5 + (rnd() - 0.5) * 0.6)
    const r = size * (0.012 + rnd() * 0.03)
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    g.addColorStop(0, 'rgba(255, 246, 232, 0.5)')
    g.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // Feather the quad edges away.
  ctx.globalCompositeOperation = 'destination-in'
  const mask = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  mask.addColorStop(0, 'rgba(0, 0, 0, 1)')
  mask.addColorStop(0.55, 'rgba(0, 0, 0, 0.85)')
  mask.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = mask
  ctx.fillRect(0, 0, size, size)
  ctx.globalCompositeOperation = 'source-over'

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  return tex
}
