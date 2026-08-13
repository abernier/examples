import * as THREE from 'three'

// The room is painted, not loaded: two canvas textures made at startup, so the
// only thing this page fetches is the toys themselves.

function canvas(size: number, paint: (ctx: CanvasRenderingContext2D) => void) {
  const el = document.createElement('canvas')
  el.width = el.height = size
  const ctx = el.getContext('2d')!
  paint(ctx)
  const texture = new THREE.CanvasTexture(el)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

// A seeded shuffle, so the floor and the wall look the same on every reload —
// a thumbnail that changes on every deploy is a thumbnail nobody trusts.
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

/** Bedroom floorboards: warm planks, dark seams, a bit of grain along each one. */
export const wood = () =>
  canvas(512, (ctx) => {
    const random = rng(7)
    ctx.fillStyle = '#c08a4e'
    ctx.fillRect(0, 0, 512, 512)
    for (let plank = 0; plank < 8; plank++) {
      const y = plank * 64
      ctx.fillStyle = `hsl(31 46% ${44 + random() * 12}%)`
      ctx.fillRect(0, y, 512, 63)
      // The seam between two boards, and the butt joint inside this one.
      ctx.fillStyle = 'rgba(60, 34, 12, 0.55)'
      ctx.fillRect(0, y + 62, 512, 2)
      ctx.fillRect(Math.floor(random() * 400) + 50, y, 2, 63)
      ctx.strokeStyle = 'rgba(84, 50, 20, 0.22)'
      ctx.lineWidth = 1
      for (let grain = 0; grain < 9; grain++) {
        const gy = y + 6 + random() * 50
        ctx.beginPath()
        ctx.moveTo(0, gy)
        ctx.bezierCurveTo(170, gy + random() * 8 - 4, 340, gy + random() * 8 - 4, 512, gy)
        ctx.stroke()
      }
    }
  })

/**
 * The sixty-four checks, as one image printed on the top of the board.
 *
 * Sixty-four meshes laid over the tray is the arrangement that z-fights: two
 * flat surfaces a hair apart, and on a phone — where the depth buffer is often
 * half the width a desktop gives you — a hair is under what the hardware can
 * tell apart. Printed instead, there is one surface where there were two.
 *
 * Painted big rather than eight pixels wide and filtered up, so the edges
 * between the checks are antialiased by the mipmaps like anything else, instead
 * of stepping.
 *
 * `a1` is dark, the way it is on any board. Canvas rows run down and ranks run
 * up, so row `j` is rank `7 - j` — which flips the parity, and is why this reads
 * as even-is-light where `squarePosition` has odd-is-light.
 */
export const checks = (light: string, dark: string) =>
  canvas(512, (ctx) => {
    for (let j = 0; j < 8; j++)
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = (i + j) % 2 === 0 ? light : dark
        ctx.fillRect(i * 64, j * 64, 64, 64)
      }
  })

/** The wallpaper every kid's bedroom in a Pixar film has: flat clouds, flat sky. */
export const wallpaper = () =>
  canvas(512, (ctx) => {
    const random = rng(23)
    const sky = ctx.createLinearGradient(0, 0, 0, 512)
    sky.addColorStop(0, '#6fb7ee')
    sky.addColorStop(1, '#a8d8f5')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, 512, 512)
    // Each cloud is a handful of overlapping discs — painted twice, once offset
    // to the left, so the texture still reads as clouds where it wraps.
    const puff = (x: number, y: number, scale: number, alpha: number) => {
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
      for (let disc = 0; disc < 7; disc++) {
        const dx = (disc - 3) * 15 * scale
        const dy = Math.cos(disc * 1.1) * 7 * scale
        const r = (20 + Math.sin(disc * 2.3) * 9) * scale
        ctx.beginPath()
        ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    for (let cloud = 0; cloud < 7; cloud++) {
      const x = random() * 512
      const y = 40 + random() * 430
      const scale = 0.7 + random() * 0.7
      puff(x, y + 6 * scale, scale * 1.02, 0.35) // its own soft shadow
      puff(x, y, scale, 0.95)
      puff(x - 512, y, scale, 0.95)
    }
  })
