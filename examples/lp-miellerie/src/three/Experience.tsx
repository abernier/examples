import { useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'

import Comb from './Comb'
import HoneyCell from './HoneyCell'
import Motes from './Motes'
import ScrollGroup from './ScrollGroup'
import Section from './Section'
import Spots from './Spots'

export const SECTIONS = 3

export default function Experience({ scroll }: { scroll: React.RefObject<number> }) {
  const viewport = useThree((state) => state.viewport)
  const h = viewport.height

  return (
    <>
      <color attach="background" args={['#0c0703']} />
      <fog attach="fog" args={['#0c0703', 12, 30]} />
      <ambientLight intensity={0.8} />

      {/* The wall drifts slower than the cells — cheap parallax */}
      <ScrollGroup scroll={scroll} sections={SECTIONS} factor={0.25}>
        <Comb />
      </ScrollGroup>

      <Spots />
      <Motes />

      <ScrollGroup scroll={scroll} sections={SECTIONS}>
        {/* 1 — the hero cell */}
        <Section index={0} scroll={scroll} sections={SECTIONS}>
          <HoneyCell position={[2.05, -0.15, 0]} radius={1.25} depth={0.55} />
        </Section>
        {/* 2 — the four floraisons */}
        <Section index={1} scroll={scroll} sections={SECTIONS}>
          <group position={[0, -h, 0]}>
            {/* One cell per honey, in the colour of the jar: acacia, châtaignier,
                lavande, sapin */}
            {(
              [
                [-2.6, 1.15, 1.6, -0.16, '#ffeaa8', 0.5],
                [-0.9, 1.4, 1.4, 0.19, '#c25c12', 1.1],
                [0.9, 1.15, 1.7, -0.11, '#f6ddb6', 0.7],
                [2.6, 1.4, 1.3, 0.14, '#6b4a16', 1.3],
              ] as const
            ).map(([x, y, z, spin, color, thickness], i) => (
              <group key={i}>
                {/* A lit plate behind each cell: a lens over a dark comb has no
                    silhouette, over a glowing disc it reads as a jar of honey */}
                <mesh position={[x, y, z - 0.75]} rotation={[Math.PI / 2, Math.PI / 6, 0]}>
                  <cylinderGeometry args={[0.54, 0.54, 0.02, 6]} />
                  <meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.75} />
                </mesh>
                <HoneyCell
                  position={[x, y, z]}
                  radius={0.74}
                  depth={0.8}
                  spin={spin}
                  color={color}
                  thickness={thickness}
                  samples={2}
                  resolution={192}
                />
              </group>
            ))}
          </group>
        </Section>
        {/* 3 — the crate */}
        <Section index={2} scroll={scroll} sections={SECTIONS}>
          <group position={[0, -h * 2, 0]}>
            <HoneyCell position={[-1.7, 0, 0.2]} radius={1.05} depth={0.5} spin={-0.1} />
          </group>
        </Section>
      </ScrollGroup>

      {/* Declarative environment — no HDR to download, ported from `inter-epoxy-resin` */}
      <Environment resolution={32}>
        <group rotation={[-Math.PI / 4, -0.3, 0]}>
          <Lightformer intensity={14} color="#ffc46b" rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
          <Lightformer intensity={3} color="#ff9a2e" rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={[10, 2, 1]} />
          <Lightformer intensity={2} color="#ffdcae" rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={[20, 2, 1]} />
          <Lightformer form="ring" intensity={3} color="#ffb01f" rotation-y={Math.PI / 2} position={[-0.1, -1, -5]} scale={10} />
        </group>
      </Environment>

      <EffectComposer enableNormalPass={false}>
        <Bloom mipmapBlur intensity={0.85} luminanceThreshold={0.55} luminanceSmoothing={0.3} />
        <Vignette offset={0.28} darkness={0.75} />
      </EffectComposer>
    </>
  )
}
