import * as THREE from 'three'
import { useEffect, useMemo } from 'react'

/**
 * ECG paper, as the backdrop of the whole page.
 *
 * It is here for two reasons. It sets the room — this is a monitor, not a
 * studio — and, more usefully, it gives the transmissive heart in front of it
 * something with *structure* to refract. Against a flat wash the glass had no
 * signal to bend and read as red plastic; against a ruled grid the refraction
 * finally shows.
 *
 * Drawn once into a canvas and repeated, with a radial alpha fade baked into a
 * second texture so the grid never fights the copy at the edges of the frame.
 */
function paperTexture() {
  const size = 96
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#f4efeb'
  ctx.fillRect(0, 0, size, size)
  ctx.strokeStyle = 'rgba(186, 72, 92, 0.30)'
  ctx.lineWidth = 1
  for (let i = 0; i <= size; i += size / 5) {
    ctx.beginPath()
    ctx.moveTo(i + 0.5, 0)
    ctx.lineTo(i + 0.5, size)
    ctx.moveTo(0, i + 0.5)
    ctx.lineTo(size, i + 0.5)
    ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(186, 72, 92, 0.55)'
  ctx.lineWidth = 1.6
  ctx.strokeRect(0.8, 0.8, size - 1.6, size - 1.6)

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  // Real ECG paper is ruled in 5mm blocks of 1mm lines — small. One canvas
  // tile is one block, so the repeat is what sets the physical scale.
  texture.repeat.set(45, 27)
  texture.anisotropy = 8
  return texture
}

/** Radial falloff, so the paper dissolves into the page background. */
function fadeTexture() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!

  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.06,
    size / 2,
    size / 2,
    size * 0.5,
  )
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.55, 'rgba(255,255,255,0.55)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  return new THREE.CanvasTexture(canvas)
}

// Sized to roughly the frustum at its depth: any bigger and the radial fade
// falls off outside the frame, leaving the grid running hard to the edges.
export default function MonitorGrid({ width = 19, height = 12 }) {
  const map = useMemo(paperTexture, [])
  const alphaMap = useMemo(fadeTexture, [])
  useEffect(() => () => void (map.dispose(), alphaMap.dispose()), [map, alphaMap])

  return (
    <mesh position={[0, 0, -3.4]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={map}
        alphaMap={alphaMap}
        transparent
        opacity={0.62}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  )
}
