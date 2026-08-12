import * as THREE from 'three'
import { CASE_W, CASE_H, HP } from './layout'

const MONO = '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace'

/**
 * Draws the ENTIRE rack silkscreen (panel legends, tick marks, HP stamps,
 * jack labels, division hairlines) into one transparent canvas. It is mapped
 * onto a single plane sitting a hair in front of the instanced faceplates, so
 * the whole legend layer costs exactly one draw call and zero network requests.
 */
export function makeSilkscreen(rack, width = 2048) {
  const ppu = width / CASE_W
  const height = Math.round(CASE_H * ppu)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  const toX = (x) => (x + CASE_W / 2) * ppu
  const toY = (y) => (CASE_H / 2 - y) * ppu

  const draw = () => {
    ctx.clearRect(0, 0, width, height)
    ctx.textBaseline = 'middle'
    ctx.lineCap = 'butt'

    for (const p of rack.panels) {
      const px = toX(p.x - p.w / 2)
      const py = toY(p.y + p.h / 2)
      const pw = p.w * ppu
      const ph = p.h * ppu
      const light = isLight(p.tone)
      const ink = light ? 'rgba(18,20,22,0.92)' : 'rgba(226,231,235,0.86)'
      const faint = light ? 'rgba(18,20,22,0.32)' : 'rgba(226,231,235,0.24)'

      if (p.blank) {
        // blank panels get a brushed hairline field only
        ctx.strokeStyle = 'rgba(255,255,255,0.05)'
        ctx.lineWidth = 1
        for (let i = 0; i < ph; i += 7) {
          ctx.beginPath()
          ctx.moveTo(px + 3, py + i)
          ctx.lineTo(px + pw - 3, py + i)
          ctx.stroke()
        }
        continue
      }

      // --- accent header bar -------------------------------------------------
      ctx.fillStyle = p.accent
      ctx.fillRect(px + 6, py + 8, pw - 12, Math.max(3, ph * 0.008))

      // --- module id ---------------------------------------------------------
      const titleSize = Math.min(pw * 0.135, ph * 0.05, 30)
      ctx.fillStyle = ink
      ctx.font = `700 ${titleSize}px ${MONO}`
      ctx.textAlign = 'center'
      const cx = px + pw / 2
      ctx.fillText(fitText(ctx, p.id, pw - 10), cx, py + ph * 0.045)

      ctx.font = `400 ${titleSize * 0.6}px ${MONO}`
      ctx.fillStyle = faint
      ctx.fillText(fitText(ctx, p.sub, pw - 8), cx, py + ph * 0.078)

      // --- knob tick arcs ----------------------------------------------------
      ctx.strokeStyle = faint
      ctx.lineWidth = Math.max(1, ppu * HP * 0.05)
      for (const k of rack.knobs) {
        if (Math.abs(k.p[0] - p.x) > p.w / 2 || Math.abs(k.p[1] - p.y) > p.h / 2) continue
        const kx = toX(k.p[0])
        const ky = toY(k.p[1])
        const kr = k.r * ppu * 1.42
        ctx.beginPath()
        ctx.arc(kx, ky, kr, Math.PI * 0.72, Math.PI * 2.28)
        ctx.stroke()
        for (let t = 0; t <= 10; t++) {
          const a = Math.PI * 0.72 + (Math.PI * 1.56 * t) / 10
          const r0 = kr * (t % 5 === 0 ? 0.86 : 0.93)
          ctx.beginPath()
          ctx.moveTo(kx + Math.cos(a) * r0, ky + Math.sin(a) * r0)
          ctx.lineTo(kx + Math.cos(a) * kr, ky + Math.sin(a) * kr)
          ctx.stroke()
        }
      }

      // --- jack legends ------------------------------------------------------
      const jSize = Math.max(7, Math.min(ppu * HP * 0.42, 14))
      ctx.font = `500 ${jSize}px ${MONO}`
      for (const j of rack.jacks) {
        if (Math.abs(j.p[0] - p.x) > p.w / 2 || Math.abs(j.p[1] - p.y) > p.h / 2) continue
        if (!j.label) continue
        const jx = toX(j.p[0])
        const jy = toY(j.p[1])
        const jr = j.r * ppu
        ctx.strokeStyle = faint
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(jx, jy, jr * 1.75, 0, Math.PI * 2)
        ctx.stroke()
        ctx.fillStyle = j.out ? p.accent : ink
        ctx.fillText(j.label, jx, jy + jr * 2.9)
      }

      // --- footer stamps -----------------------------------------------------
      const fSize = Math.max(7, Math.min(ppu * HP * 0.4, 13))
      ctx.font = `400 ${fSize}px ${MONO}`
      ctx.fillStyle = faint
      ctx.textAlign = 'left'
      ctx.fillText(`${p.hp}HP`, px + 7, py + ph - fSize * 1.1)
      ctx.textAlign = 'right'
      ctx.fillText(`${p.spec.ma}mA`, px + pw - 7, py + ph - fSize * 1.1)
      ctx.textAlign = 'center'

      // --- panel edge hairline ----------------------------------------------
      ctx.strokeStyle = 'rgba(0,0,0,0.55)'
      ctx.lineWidth = 2
      ctx.strokeRect(px + 1, py + 1, pw - 2, ph - 2)
    }
  }

  draw()

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8

  // Re-draw once the webfont lands so the legends are set in IBM Plex Mono.
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    document.fonts.ready
      .then(() => {
        draw()
        texture.needsUpdate = true
      })
      .catch(() => {})
  }

  return texture
}

function fitText(ctx, text, maxW) {
  let t = text
  while (t.length > 2 && ctx.measureText(t).width > maxW) t = t.slice(0, -1)
  return t
}

function isLight(hex) {
  const c = new THREE.Color(hex)
  return c.r * 0.299 + c.g * 0.587 + c.b * 0.114 > 0.45
}
