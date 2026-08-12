import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Instances, Instance } from '@react-three/drei'
import { CASE_W, CASE_H, HP, ROWS, ROW_H, RAIL, PANEL_D, PANEL_Z, buildRack, buildPatches } from './layout'
import { makeSilkscreen } from './silkscreen'
import { Cables } from './Cables'
import { Scope } from './Scope'

/** cylinder whose axis points down +Z, so instance scale reads [rx, ry, depth] */
function zCylinder(segments) {
  const g = new THREE.CylinderGeometry(1, 1, 1, segments)
  g.rotateX(Math.PI / 2)
  return g
}
/** box growing upward from its origin, for knob pointers */
function pointerBox() {
  const g = new THREE.BoxGeometry(1, 1, 1)
  g.translate(0, 0.5, 0)
  return g
}

const BPM = 124
const STEP = 60 / BPM / 4 // 16th notes

export function Rack(props) {
  const rack = useMemo(() => buildRack(), [])
  const patches = useMemo(() => buildPatches(rack.jacks, 12), [rack])
  const silkscreen = useMemo(() => makeSilkscreen(rack), [rack])

  const knobGeo = useMemo(() => zCylinder(24), [])
  const capGeo = useMemo(() => zCylinder(20), [])
  const nutGeo = useMemo(() => zCylinder(6), [])
  const holeGeo = useMemo(() => zCylinder(12), [])
  const ledGeo = useMemo(() => zCylinder(12), [])
  const screwGeo = useMemo(() => zCylinder(6), [])
  const ptrGeo = useMemo(() => pointerBox(), [])

  const ledsRef = useRef(null)
  const ledBase = useMemo(() => rack.leds.map((l) => new THREE.Color(l.color)), [rack])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const step = Math.floor(t / STEP) % 16
    const frac = (t % STEP) / STEP
    const group = ledsRef.current
    if (!group) return
    const kids = group.children
    for (let i = 0; i < kids.length; i++) {
      const led = rack.leds[i]
      const c = ledBase[i]
      let k
      if (led.mode === 'seq') {
        k = led.step % 8 === step % 8 ? 2.6 * (1 - frac * 0.65) : 0.06
      } else if (led.mode === 'pulse') {
        k = 0.1 + 1.7 * Math.pow(Math.max(0, Math.sin(t * 1.7 + led.phase)), 3)
      } else {
        k = (step + led.step) % 4 === 0 ? 1.9 * (1 - frac) + 0.08 : 0.08
      }
      kids[i].color.setRGB(c.r * k, c.g * k, c.b * k)
    }
  })

  return (
    <group {...props}>
      {/* ---- case shell --------------------------------------------------- */}
      <mesh position={[0, 0, -0.31]} castShadow receiveShadow>
        <boxGeometry args={[CASE_W + HP * 2.4, CASE_H + HP * 1.2, 0.62]} />
        <meshStandardMaterial color="#0b0d0f" roughness={0.62} metalness={0.35} />
      </mesh>
      {/* side cheeks */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (CASE_W / 2 + HP * 1.15), 0, -0.05]} castShadow receiveShadow>
          <boxGeometry args={[HP * 1.1, CASE_H + HP * 1.2, 0.54]} />
          <meshStandardMaterial color="#2b2620" roughness={0.55} metalness={0.15} />
        </mesh>
      ))}
      {/* rails */}
      {Array.from({ length: ROWS * 2 }, (_, i) => {
        const row = Math.floor(i / 2)
        const top = CASE_H / 2 - RAIL - row * (ROW_H + RAIL)
        const y = i % 2 === 0 ? top + RAIL * 0.5 : top - ROW_H - RAIL * 0.5
        return (
          <mesh key={i} position={[0, y, -0.012]} receiveShadow>
            <boxGeometry args={[CASE_W, RAIL * 0.92, 0.05]} />
            <meshStandardMaterial color="#5a6066" roughness={0.34} metalness={0.92} />
          </mesh>
        )
      })}

      {/* ---- instanced faceplates ---------------------------------------- */}
      <Instances limit={rack.panels.length} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.44} metalness={0.72} envMapIntensity={0.9} />
        {rack.panels.map((p, i) => (
          <Instance
            key={i}
            position={[p.x, p.y, PANEL_Z]}
            scale={[p.w - HP * 0.06, p.h, PANEL_D]}
            color={p.tone}
          />
        ))}
      </Instances>

      {/* ---- silkscreen legend layer (single draw call) ------------------- */}
      <mesh position={[0, 0, PANEL_Z + PANEL_D / 2 + 0.0016]} renderOrder={2}>
        <planeGeometry args={[CASE_W, CASE_H]} />
        <meshStandardMaterial
          map={silkscreen}
          transparent
          depthWrite={false}
          roughness={0.85}
          metalness={0}
          polygonOffset
          polygonOffsetFactor={-2}
        />
      </mesh>

      {/* ---- knobs -------------------------------------------------------- */}
      <Instances limit={rack.knobs.length} geometry={knobGeo} castShadow>
        <meshStandardMaterial color="#15181a" roughness={0.42} metalness={0.28} />
        {rack.knobs.map((k, i) => (
          <Instance key={i} position={[k.p[0], k.p[1], k.p[2] + k.d / 2]} scale={[k.r, k.r, k.d]} />
        ))}
      </Instances>
      <Instances limit={rack.knobs.length} geometry={capGeo}>
        <meshStandardMaterial color="#3a4046" roughness={0.3} metalness={0.75} />
        {rack.knobs.map((k, i) => (
          <Instance
            key={i}
            position={[k.p[0], k.p[1], k.p[2] + k.d + 0.002]}
            scale={[k.r * 0.52, k.r * 0.52, 0.012]}
          />
        ))}
      </Instances>
      <Instances limit={rack.knobs.length} geometry={ptrGeo}>
        <meshStandardMaterial roughness={0.5} metalness={0.1} toneMapped={false} />
        {rack.knobs.map((k, i) => (
          <Instance
            key={i}
            position={[k.p[0], k.p[1], k.p[2] + k.d + 0.006]}
            rotation={[0, 0, k.angle]}
            scale={[HP * 0.1, k.r * 0.82, 0.01]}
            color={k.cap}
          />
        ))}
      </Instances>

      {/* ---- jacks -------------------------------------------------------- */}
      <Instances limit={rack.jacks.length} geometry={nutGeo}>
        <meshStandardMaterial color="#9aa1a6" roughness={0.26} metalness={1} envMapIntensity={1.4} />
        {rack.jacks.map((j, i) => (
          <Instance key={i} position={[j.p[0], j.p[1], j.p[2] + 0.012]} scale={[j.r, j.r, 0.026]} />
        ))}
      </Instances>
      <Instances limit={rack.jacks.length} geometry={holeGeo}>
        <meshStandardMaterial color="#05070a" roughness={0.9} metalness={0} />
        {rack.jacks.map((j, i) => (
          <Instance key={i} position={[j.p[0], j.p[1], j.p[2] + 0.024]} scale={[j.r * 0.52, j.r * 0.52, 0.014]} />
        ))}
      </Instances>

      {/* ---- LEDs (driven by the fake sequencer clock) -------------------- */}
      <Instances limit={Math.max(1, rack.leds.length)} geometry={ledGeo}>
        <meshBasicMaterial toneMapped={false} />
        <group ref={ledsRef}>
          {rack.leds.map((l, i) => (
            <Instance key={i} position={[l.p[0], l.p[1], l.p[2] + 0.008]} scale={[l.r, l.r, 0.016]} />
          ))}
        </group>
      </Instances>

      {/* ---- panel screws -------------------------------------------------- */}
      <Instances limit={rack.screws.length} geometry={screwGeo}>
        <meshStandardMaterial color="#7d848a" roughness={0.3} metalness={1} />
        {rack.screws.map((s, i) => (
          <Instance key={i} position={[s.p[0], s.p[1], s.p[2] + 0.006]} scale={[HP * 0.3, HP * 0.3, 0.014]} />
        ))}
      </Instances>

      {/* ---- oscilloscope screen ------------------------------------------ */}
      {rack.scope && <Scope {...rack.scope} z={PANEL_Z + PANEL_D / 2 + 0.004} />}

      {/* ---- patch cables -------------------------------------------------- */}
      <Cables patches={patches} />
    </group>
  )
}

export { CASE_W, CASE_H }
