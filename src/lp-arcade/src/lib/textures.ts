import * as THREE from 'three'

const DISPLAY_FONT = '"Arial Black", "Arial Bold", Impact, sans-serif'

function canvas(w: number, h: number) {
  const el = document.createElement('canvas')
  el.width = w
  el.height = h
  return el
}

function fit(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  start: number,
  font = DISPLAY_FONT,
) {
  let size = start
  ctx.font = `${size}px ${font}`
  while (ctx.measureText(text).width > maxWidth && size > 10) {
    size -= 2
    ctx.font = `${size}px ${font}`
  }
  return size
}

/**
 * Backlit marquee sitting on top of each cabinet: a dark plexi panel with the
 * game title screen-printed on it plus two accent bars.
 */
export function makeMarqueeTexture(title: string, accent: string, accent2: string) {
  const w = 512
  const h = 128
  const el = canvas(w, h)
  const ctx = el.getContext('2d')!

  const bg = ctx.createLinearGradient(0, 0, 0, h)
  bg.addColorStop(0, '#1a0b33')
  bg.addColorStop(0.5, '#0d0620')
  bg.addColorStop(1, '#200d3d')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)

  // chevron pattern in the background
  ctx.globalAlpha = 0.18
  ctx.strokeStyle = accent2
  ctx.lineWidth = 6
  for (let x = -h; x < w + h; x += 26) {
    ctx.beginPath()
    ctx.moveTo(x, h)
    ctx.lineTo(x + h * 0.6, 0)
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  // accent rails
  ctx.fillStyle = accent
  ctx.fillRect(0, 0, w, 7)
  ctx.fillStyle = accent2
  ctx.fillRect(0, h - 7, w, 7)

  const size = fit(ctx, title.toUpperCase(), w - 56, 62)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = accent
  ctx.shadowBlur = 26
  ctx.fillStyle = '#ffffff'
  ctx.fillText(title.toUpperCase(), w / 2, h / 2 + 2)
  ctx.shadowBlur = 0
  ctx.lineWidth = 2
  ctx.strokeStyle = accent2
  ctx.font = `${size}px ${DISPLAY_FONT}`
  ctx.strokeText(title.toUpperCase(), w / 2, h / 2 + 2)

  const tex = new THREE.CanvasTexture(el)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

/** Big neon shop sign hanging over the row of cabinets. */
export function makeSignTexture() {
  const w = 1024
  const h = 320
  const el = canvas(w, h)
  const ctx = el.getContext('2d')!

  ctx.clearRect(0, 0, w, h)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const line1 = 'NEON CABINET'
  const line2 = 'C O.'

  fit(ctx, line1, w - 150, 124)
  ctx.shadowColor = '#ff2d95'
  ctx.shadowBlur = 44
  ctx.fillStyle = '#ffd9ef'
  ctx.fillText(line1, w / 2, 118)
  ctx.shadowColor = '#00f0ff'
  ctx.font = `88px ${DISPLAY_FONT}`
  ctx.fillStyle = '#d9fbff'
  ctx.fillText(line2, w / 2, 232)

  // neon tube outline
  ctx.shadowBlur = 26
  ctx.shadowColor = '#ff2d95'
  ctx.strokeStyle = 'rgba(255,45,149,0.85)'
  ctx.lineWidth = 5
  ctx.strokeRect(26, 22, w - 52, h - 44)

  const tex = new THREE.CanvasTexture(el)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

/** Small "INSERT COIN / EST. 1994" placards stuck on the cabinet sides. */
export function makePlacardTexture(text: string, accent: string) {
  const w = 256
  const h = 64
  const el = canvas(w, h)
  const ctx = el.getContext('2d')!
  ctx.fillStyle = '#07040f'
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = accent
  ctx.lineWidth = 4
  ctx.strokeRect(2, 2, w - 4, h - 4)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const size = fit(ctx, text, w - 30, 30, 'ui-monospace, Menlo, monospace')
  ctx.font = `${size}px ui-monospace, Menlo, monospace`
  ctx.fillStyle = accent
  ctx.shadowColor = accent
  ctx.shadowBlur = 14
  ctx.fillText(text, w / 2, h / 2 + 1)

  const tex = new THREE.CanvasTexture(el)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}
