import * as THREE from 'three'
import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'

import Choreography from './Choreography'
import Circulation from './Circulation'
import EcgTrace from './EcgTrace'
import Heart from './Heart'
import MonitorGrid from './MonitorGrid'
import PulseRings from './PulseRings'

/**
 * The trace belongs to the hero, not to the heart — it stays put across the
 * width of the screen while the heart moves, then slides out under the fold
 * once you leave the first section.
 */
function TraceRig({ scroll }: { scroll: React.RefObject<number> }) {
  const group = useRef<THREE.Group>(null!)
  const viewport = useThree((state) => state.viewport)

  useFrame((_state, delta) => {
    const gone = THREE.MathUtils.clamp(scroll.current / 0.18, 0, 1)
    // On a phone the copy fills the screen under the heart and there is simply
    // no band left for a trace this wide — it lands across the buttons. Park it
    // below the fold there; the grid and the heart still carry the page.
    const resting = viewport.aspect < 1.05 ? -0.72 : -0.4
    const y = viewport.height * (resting - gone * 0.7)
    group.current.position.y = THREE.MathUtils.damp(group.current.position.y, y, 5, delta)
    // Stop paying for it entirely once it is off screen.
    group.current.visible = gone < 0.995
  })

  return (
    <group ref={group} position={[0, -3, 0]}>
      <EcgTrace width={Math.min(11, viewport.width * 0.92)} />
    </group>
  )
}

export default function Experience({ scroll }: { scroll: React.RefObject<number> }) {
  return (
    <>
      <color attach="background" args={['#f1ece8']} />
      <fog attach="fog" args={['#f1ece8', 14, 26]} />

      <ambientLight intensity={0.75} />
      <directionalLight
        castShadow
        position={[4, 7, 5]}
        intensity={2.2}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-6, 2, -4]} intensity={0.7} color="#ffd9e0" />

      {/* A live env map built from lightformers rather than a preset — the
          transmission has something to refract, and the page still works with
          no network. */}
      <Environment resolution={256}>
        <Lightformer
          form="circle"
          intensity={4}
          position={[0, 6, 2]}
          scale={12}
          onUpdate={(self) => self.lookAt(0, 0, 0)}
        />
        <Lightformer
          intensity={1.6}
          color="#ffe6ea"
          position={[-6, 1, 2]}
          rotation-y={Math.PI / 2}
          scale={[16, 8, 1]}
        />
        <Lightformer
          intensity={1.2}
          color="#e8f0ff"
          position={[6, 0, 2]}
          rotation-y={-Math.PI / 2}
          scale={[16, 8, 1]}
        />
        <Lightformer
          intensity={0.8}
          position={[0, -4, 1]}
          rotation-x={-Math.PI / 2}
          scale={[16, 16, 1]}
        />
        {/* Small and hot — the glint that tells you the surface is glass. */}
        <Lightformer
          form="circle"
          intensity={14}
          position={[-3.5, 3.5, 4]}
          scale={1.6}
          onUpdate={(self) => self.lookAt(0, 0, 0)}
        />
      </Environment>

      <MonitorGrid />

      <Choreography scroll={scroll}>
        <PulseRings />
        <Circulation />
        <Heart />
      </Choreography>

      <TraceRig scroll={scroll} />

      <EffectComposer enableNormalPass={false}>
        <Bloom mipmapBlur luminanceThreshold={1} intensity={0.85} radius={0.7} />
        <Vignette offset={0.32} darkness={0.42} eskil={false} />
      </EffectComposer>
    </>
  )
}
