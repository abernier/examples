import { Suspense } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sky, Cloud, Clouds } from '@react-three/drei'
import Grass from './Grass'

/* ------------------------------------------------------------------ *
 * Scene — 42k instanced grass blades bending through simplex noise,
 * from pmndrs/examples "grass-shader", staged at low sun.
 * ------------------------------------------------------------------ */

function Rig() {
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const r = 21
    state.camera.position.x = THREE.MathUtils.damp(
      state.camera.position.x,
      Math.sin(t * 0.06) * r + state.pointer.x * 4,
      1.2,
      delta
    )
    state.camera.position.z = THREE.MathUtils.damp(
      state.camera.position.z,
      Math.cos(t * 0.06) * r,
      1.2,
      delta
    )
    state.camera.position.y = THREE.MathUtils.damp(
      state.camera.position.y,
      4.2 - state.pointer.y * 1.6,
      1.2,
      delta
    )
    state.camera.lookAt(0, 3.5, 0)
  })
  return null
}

function Scene() {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [18, 4.2, 12], fov: 46, far: 400 }}>
      <Sky azimuth={0.22} inclination={0.505} distance={2000} turbidity={9} rayleigh={3} />
      <ambientLight intensity={1.1} color="#ffd7a8" />
      <directionalLight position={[-30, 8, -40]} intensity={2.2} color="#ffbb77" />
      <fog attach="fog" args={['#c9a07a', 40, 130]} />

      <Suspense fallback={null}>
        <Grass />
        <Clouds material={THREE.MeshBasicMaterial} limit={120}>
          <Cloud seed={3} segments={26} bounds={[70, 6, 20]} volume={16} color="#e8bd96" opacity={0.35} position={[-30, 26, -70]} />
          <Cloud seed={9} segments={22} bounds={[60, 5, 18]} volume={14} color="#d8a894" opacity={0.28} position={[40, 30, -85]} />
        </Clouds>
      </Suspense>

      <Rig />
    </Canvas>
  )
}

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */

const WORK = [
  {
    n: 'I',
    t: 'Meadow conversion',
    c: 'Lawn out, seed mix in. Twelve to eighteen species chosen for your soil, cut twice a year and never watered after the first summer.',
  },
  {
    n: 'II',
    t: 'Dry gardens',
    c: 'Gravel beds and Mediterranean planting for south walls and thin chalk. Designed to look best in the month everything else gives up.',
  },
  {
    n: 'III',
    t: 'Woodland edge',
    c: 'The layered boundary between canopy and open ground — the most biodiverse ten metres you can build, and the least maintained.',
  },
]

export default function App() {
  return (
    <>
      <div className="stage">
        <Scene />
      </div>

      <main>
        <header className="nav">
          <span className="mark">Jardin&nbsp;Noir</span>
          <nav>
            <a href="#work">Work</a>
            <a href="#method">Method</a>
            <a href="#contact">Contact</a>
          </nav>
        </header>

        <section className="hero">
          <p className="eyebrow">Landscape atelier · Kent &amp; the Weald</p>
          <h1>
            We plant
            <br />
            for the <em>wind.</em>
          </h1>
          <p className="lede">
            Gardens that move. We design for the way a planting behaves in a gust, at dusk,
            in its fourth year — not for the way it photographs on the day we leave.
          </p>
          <div className="cta">
            <a className="btn" href="#work">
              See the work
            </a>
            <span className="hint">move your cursor to walk the field</span>
          </div>
        </section>

        <section className="panel" id="work">
          <div className="panel-head">
            <h2>Three things we are good at</h2>
            <p>
              We take on roughly nine projects a year, from a 40 m² courtyard to a 6 hectare
              parkland restoration. Anything smaller we will happily talk you through for free.
            </p>
          </div>
          <div className="rows">
            {WORK.map((w) => (
              <article key={w.n}>
                <span className="num">{w.n}</span>
                <div>
                  <h3>{w.t}</h3>
                  <p>{w.c}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel alt" id="method">
          <div className="split">
            <div>
              <h2>A garden is a fifteen-year argument with a site.</h2>
              <p>
                We start with a soil pit and a year of watching. Where the frost sits, where
                the water goes in February, which corner the wind rips through. Then we
                plant things that want to be there anyway — which is why our gardens get
                better after we stop coming.
              </p>
            </div>
            <dl className="stats">
              <div><dt>Projects since 2009</dt><dd>142</dd></div>
              <div><dt>Species in our seed mix</dt><dd>34</dd></div>
              <div><dt>Irrigation installed</dt><dd>None</dd></div>
              <div><dt>Peat used</dt><dd>0 L</dd></div>
            </dl>
          </div>
        </section>

        <section className="panel closing" id="contact">
          <h2>Send us a photograph of the worst corner.</h2>
          <p>
            That is genuinely how most of our projects start. Tell us which way it faces and
            what already grows there, and we will tell you honestly whether you need us.
          </p>
          <a className="btn light" href="#contact">
            Start a conversation
          </a>
          <footer>
            <span>The Old Hop Store, Cranbrook, Kent</span>
            <span>+44 1580 714 902</span>
            <span>Built with react-three-fiber</span>
          </footer>
        </section>
      </main>
    </>
  )
}
