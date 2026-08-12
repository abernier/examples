import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshTransmissionMaterial } from '@react-three/drei'

import { atrialKick, contraction, phaseAt } from '../lib/cardiac'
import { pulse } from '../lib/pulse'
import { createHeartGeometry } from './heartGeometry'

/**
 * The hero. The only transmissive object on the page — one is affordable, six
 * would not be, since each one re-renders the whole scene into its own buffer
 * every frame.
 *
 * Inside it sits a solid emissive copy of the same geometry. That is what makes
 * the glass read: a transmissive shell with nothing behind it is just a rim,
 * and the core gives it a lit heart to refract, brightening on every squeeze.
 */
export default function Heart({ scale = 1 }: { scale?: number }) {
  const group = useRef<THREE.Group>(null!)
  const core = useRef<THREE.MeshStandardMaterial>(null!)

  const shell = useMemo(() => createHeartGeometry('high'), [])
  const inner = useMemo(() => new THREE.SphereGeometry(0.2, 24, 16), [])
  useEffect(() => () => void (shell.dispose(), inner.dispose()), [shell, inner])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const phase = phaseAt(t)
    const c = contraction(phase)
    const kick = atrialKick(phase)

    // Systole: the ventricles shorten along the long axis and narrow across it,
    // and the whole muscle wrings slightly as it ejects. Non-uniform, because a
    // heart that pulses uniformly reads as a balloon.
    const s = scale * (1 + kick * 0.4)
    group.current.scale.set(s * (1 - 0.1 * c), s * (1 - 0.055 * c), s * (1 - 0.1 * c))
    group.current.rotation.z = -0.09 * c
    group.current.rotation.y = Math.sin(t * 0.35) * 0.28 + 0.075 * c

    // A slow drift, so it is never quite still between beats.
    group.current.position.y = Math.sin(t * 0.5) * 0.045

    core.current.emissiveIntensity = 1.1 + c * 3.4 + kick * 1.6

    // Hand the beat to the DOM readout, so it flashes on the same frame.
    pulse.phase = phase
    pulse.contraction = c
  })

  return (
    <group ref={group}>
      <mesh geometry={shell} castShadow>
        <MeshTransmissionMaterial
          // No backside pass: against a ruled backdrop the second render buys
          // less than spending the same budget on a sharper refraction buffer,
          // and it costs a whole extra scene render per frame.
          resolution={768}
          samples={8}
          // Thickness and attenuation together decide how dark the deep paths
          // go. Pushed too far the middle of the heart turns to a brown smear
          // instead of glass — this pair keeps it luminous all the way through.
          thickness={1.35}
          ior={1.46}
          chromaticAberration={0.26}
          anisotropicBlur={0.08}
          roughness={0.03}
          // Kept low deliberately. Heavy distortion smears the grid behind into
          // a wash, and a wash is exactly what stops the glass reading as
          // glass — the legible ruled lines bending through it are the tell.
          distortion={0.09}
          distortionScale={0.25}
          temporalDistortion={0.02}
          clearcoat={1}
          clearcoatRoughness={0.04}
          attenuationDistance={2.4}
          attenuationColor="#e01340"
          color="#fff4f5"
          envMapIntensity={2.2}
        />
      </mesh>

      {/* The sinoatrial node — where the beat actually starts, up in the right
          atrium. A sphere rather than a small copy of the heart on purpose: a
          scaled-down heart inside a heart just reads as a gradient, while a
          different shape reads unmistakably as something suspended in glass,
          and the refraction has an edge to bend. */}
      <mesh geometry={inner} position={[0.26, 0.29, -0.02]}>
        <meshStandardMaterial
          ref={core}
          toneMapped={false}
          color="#c41038"
          emissive="#ff2d52"
          roughness={0.35}
        />
      </mesh>
    </group>
  )
}
