import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Noise,
  Vignette,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { view } from '../store.js'

/**
 * Stacked composer, in the spirit of the pmndrs `sparks-and-effects` Effects
 * component (two bloom passes at different radii/levels) plus the mipmapBlur
 * bloom settings from `floating-diamonds`. Chromatic aberration is driven off
 * scroll velocity so the lens only smears while the page is actually moving.
 */
export default function Effects() {
  const ca = useRef(null)
  const offset = useMemo(() => new THREE.Vector2(0.0006, 0.0006), [])
  const last = useRef(0)
  const smoothed = useRef(0)

  useFrame((_, delta) => {
    const v = Math.min(1, Math.abs(view.scroll - last.current) / Math.max(delta, 0.001) / 2.2)
    last.current = view.scroll
    smoothed.current = THREE.MathUtils.damp(smoothed.current, v, 6, delta)
    const amt = 0.0005 + smoothed.current * 0.0055
    offset.set(amt, amt * 0.6)
    if (ca.current) ca.current.offset = offset
  })

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        mipmapBlur
        intensity={1.5}
        luminanceThreshold={0.22}
        luminanceSmoothing={0.04}
        radius={0.86}
        levels={7}
      />
      <Bloom
        mipmapBlur
        intensity={0.55}
        luminanceThreshold={0.55}
        luminanceSmoothing={0.02}
        radius={0.98}
        levels={9}
      />
      <ChromaticAberration ref={ca} offset={offset} radialModulation modulationOffset={0.35} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.42} />
      <Vignette eskil={false} offset={0.16} darkness={0.95} />
    </EffectComposer>
  )
}
