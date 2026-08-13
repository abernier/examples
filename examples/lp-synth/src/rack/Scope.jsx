import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'

const W = 320
const H = 128

/** A live CRT-ish oscilloscope drawn into a small canvas every frame. */
export function Scope({ x, y, w, h, z }) {
  const state = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter
    return { canvas, ctx, texture }
  }, [])

  const acc = useRef(0)

  useFrame((s, delta) => {
    acc.current += delta
    if (acc.current < 1 / 40) return
    acc.current = 0
    const t = s.clock.elapsedTime
    const { ctx, texture } = state

    ctx.fillStyle = '#05100b'
    ctx.fillRect(0, 0, W, H)

    // graticule
    ctx.strokeStyle = 'rgba(80,255,160,0.10)'
    ctx.lineWidth = 1
    for (let gx = 0; gx <= W; gx += W / 10) {
      ctx.beginPath()
      ctx.moveTo(gx + 0.5, 0)
      ctx.lineTo(gx + 0.5, H)
      ctx.stroke()
    }
    for (let gy = 0; gy <= H; gy += H / 4) {
      ctx.beginPath()
      ctx.moveTo(0, gy + 0.5)
      ctx.lineTo(W, gy + 0.5)
      ctx.stroke()
    }

    // waveform: vco saw through a wobbling filter + sub oscillator
    const drawWave = (color, width, fn) => {
      ctx.strokeStyle = color
      ctx.lineWidth = width
      ctx.beginPath()
      for (let i = 0; i <= W; i++) {
        const u = i / W
        const v = fn(u)
        const py = H / 2 - v * (H * 0.38)
        if (i === 0) ctx.moveTo(i, py)
        else ctx.lineTo(i, py)
      }
      ctx.stroke()
    }

    const scroll = t * 1.7
    const cut = 0.55 + 0.45 * Math.sin(t * 0.53)
    drawWave('rgba(60,255,150,0.25)', 3, (u) => Math.sin((u * 4 + scroll * 0.5) * Math.PI * 2) * 0.55)
    drawWave('#6bffa6', 2, (u) => {
      const ph = (u * 3 + scroll) % 1
      const saw = ph * 2 - 1
      const sub = Math.sin((u * 1.5 + scroll * 0.5) * Math.PI * 2) * 0.35
      return (saw * cut + sub) * 0.7
    })

    // readout
    ctx.fillStyle = 'rgba(120,255,180,0.75)'
    ctx.font = '600 13px ui-monospace, monospace'
    ctx.fillText('CH1  1V/DIV', 8, 18)
    ctx.textAlign = 'right'
    ctx.fillText(`${(cut * 8000 + 60).toFixed(0)}Hz`, W - 8, 18)
    ctx.textAlign = 'left'
    ctx.fillStyle = 'rgba(120,255,180,0.45)'
    ctx.fillText('124.0 BPM  //  16 STP', 8, H - 10)

    texture.needsUpdate = true
  })

  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0, -0.004]}>
        <planeGeometry args={[w * 1.08, h * 1.22]} />
        <meshStandardMaterial color="#07090a" roughness={0.5} metalness={0.6} />
      </mesh>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={state.texture} toneMapped={false} />
      </mesh>
    </group>
  )
}
