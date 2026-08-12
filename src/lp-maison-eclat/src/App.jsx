import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  Environment,
  Lightformer,
  Float,
  Backdrop,
  ContactShadows,
  MeshTransmissionMaterial,
  Preload,
} from '@react-three/drei'
import * as THREE from 'three'

/* ------------------------------------------------------------------ *
 * Scene — transmission gems, lit by a hand-built lightformer studio.
 * Material config follows pmndrs/examples "aquarium".
 * ------------------------------------------------------------------ */

function Gem({ position, scale = 1, color, speed = 1.2, children }) {
  return (
    <Float speed={speed} rotationIntensity={1.6} floatIntensity={1.8}>
      <mesh position={position} scale={scale} castShadow>
        {children}
        <MeshTransmissionMaterial
          samples={6}
          resolution={512}
          thickness={1.4}
          chromaticAberration={0.4}
          anisotropy={0.3}
          distortion={0.2}
          distortionScale={0.3}
          temporalDistortion={0.1}
          iridescence={1}
          iridescenceIOR={1.3}
          iridescenceThicknessRange={[0, 1400]}
          roughness={0}
          ior={2.2}
          color={color}
        />
      </mesh>
    </Float>
  )
}

function Rig({ children }) {
  const group = useRef()
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    group.current.rotation.y = THREE.MathUtils.damp(
      group.current.rotation.y,
      state.pointer.x * 0.4 + t * 0.08,
      2,
      delta
    )
    group.current.rotation.x = THREE.MathUtils.damp(
      group.current.rotation.x,
      -state.pointer.y * 0.2,
      2,
      delta
    )
  })
  // offset to the upper right so the headline keeps the left third clear
  return (
    <group position={[2.9, 1.5, 0]} scale={0.95}>
      <group ref={group}>{children}</group>
    </group>
  )
}

function Studio() {
  return (
    <Environment resolution={512}>
      <group rotation={[-Math.PI / 3, 0, 0]}>
        <Lightformer intensity={5} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
        {[2, 0, 2, 0, 2, 0, 2, 0].map((x, i) => (
          <Lightformer
            key={i}
            form="circle"
            intensity={4}
            rotation={[Math.PI / 2, 0, 0]}
            position={[x, 4, i * 4]}
            scale={[4, 1, 1]}
          />
        ))}
        <Lightformer intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={[50, 2, 1]} />
        <Lightformer intensity={2} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={[50, 2, 1]} />
        <Lightformer form="ring" color="#d9a7b0" intensity={6} scale={4} position={[-6, 3, 6]} target={[0, 0, 0]} />
      </group>
    </Environment>
  )
}

/* Opaque gold accents — the gems need something with colour and edges
 * behind them, otherwise the refraction has nothing to bend. */
function GoldAccents() {
  return (
    <group>
      {[
        [-4.6, 1.9, -5, 1.1],
        [4.9, -1.4, -5.6, 0.85],
        [1.4, 2.9, -6.4, 0.6],
        [-2.4, -2.4, -5.2, 0.7],
      ].map(([x, y, z, s], i) => (
        <Float key={i} speed={0.7} rotationIntensity={1.2} floatIntensity={1.4}>
          <mesh position={[x, y, z]} scale={s} rotation={[i, i * 1.3, 0]} castShadow>
            <torusGeometry args={[1, 0.11, 20, 80]} />
            <meshStandardMaterial color="#c39a5c" metalness={1} roughness={0.18} />
          </mesh>
        </Float>
      ))}
    </group>
  )
}

function Scene() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [0, 1.6, 15.5], fov: 30 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#efe9e1']} />

      <ambientLight intensity={0.6} />
      <spotLight
        position={[6, 11, 8]}
        angle={0.42}
        penumbra={1}
        decay={0}
        intensity={2.4}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-7, 5, 4]} intensity={0.5} color="#ffd9c2" />

      <Suspense fallback={null}>
        {/* curved studio sweep — gives the stones a horizon to refract */}
        <Backdrop
          floor={0.3}
          segments={24}
          receiveShadow
          scale={[52, 16, 9]}
          position={[0, -3.1, -7]}
        >
          <meshStandardMaterial color="#e0d4c3" roughness={0.85} />
        </Backdrop>

        <GoldAccents />

        <Rig>
          <Gem position={[0, 0.2, 0]} scale={1.45} color="#ffffff" speed={0.9}>
            <dodecahedronGeometry args={[1, 0]} />
          </Gem>
          <Gem position={[-2.9, 1.1, -1.2]} scale={0.62} color="#f6c9d2" speed={1.4}>
            <octahedronGeometry args={[1, 0]} />
          </Gem>
          <Gem position={[2.8, -0.7, -0.6]} scale={0.72} color="#cfe0f2" speed={1.1}>
            <icosahedronGeometry args={[1, 0]} />
          </Gem>
          <Gem position={[2.2, 1.5, -2.4]} scale={0.5} color="#f4e3bd" speed={1.7}>
            <torusGeometry args={[0.8, 0.3, 24, 64]} />
          </Gem>
          <Gem position={[-2.2, -1.4, -2]} scale={0.55} color="#e6d9f2" speed={1.5}>
            <coneGeometry args={[0.9, 1.6, 6]} />
          </Gem>
        </Rig>

        <ContactShadows
          position={[0, -3.05, 0]}
          opacity={0.5}
          scale={30}
          blur={2.4}
          far={6}
          color="#4a3b2a"
        />
        <Studio />
        <Preload all />
      </Suspense>
    </Canvas>
  )
}

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */

const COLLECTIONS = [
  { n: '01', name: 'Solstice', copy: 'Brilliant cuts set in brushed rose gold. Built to catch a low winter sun.' },
  { n: '02', name: 'Marée', copy: 'Baguette sapphires laid like a tide line. Nine stones, one continuous edge.' },
  { n: '03', name: 'Nocturne', copy: 'Black rhodium, white diamond. The quietest thing in any room.' },
]

export default function App() {
  return (
    <>
      <div className="stage">
        <Scene />
      </div>

      <main>
        <header className="nav">
          <span className="mark">Maison&nbsp;Éclat</span>
          <nav>
            <a href="#collections">Collections</a>
            <a href="#atelier">Atelier</a>
            <a href="#visit">Visit</a>
          </nav>
        </header>

        <section className="hero">
          <p className="eyebrow">Paris · since 1946</p>
          <h1>
            Light,
            <br />
            <em>cut to keep.</em>
          </h1>
          <p className="lede">
            Four generations of lapidaries, one bench, and a stubborn belief that a stone
            should be judged by what it does at dusk.
          </p>
          <div className="cta">
            <a className="btn" href="#collections">
              See the collections
            </a>
            <span className="hint">drag to turn the stones</span>
          </div>
        </section>

        <section className="panel" id="collections">
          <h2>Three collections, cut in-house</h2>
          <div className="grid">
            {COLLECTIONS.map((c) => (
              <article key={c.n}>
                <span className="num">{c.n}</span>
                <h3>{c.name}</h3>
                <p>{c.copy}</p>
                <a href="#visit">Enquire →</a>
              </article>
            ))}
          </div>
        </section>

        <section className="panel alt" id="atelier">
          <div className="split">
            <div>
              <h2>The bench has not moved since 1946.</h2>
              <p>
                Every stone is cut, set and finished at rue de Sévigné. No outsourcing, no
                white-label casting, no stone we cannot name the origin of. If a piece takes
                eleven weeks, it takes eleven weeks.
              </p>
            </div>
            <dl className="stats">
              <div><dt>Stones cut in 2025</dt><dd>418</dd></div>
              <div><dt>Lapidaries at the bench</dt><dd>6</dd></div>
              <div><dt>Average commission</dt><dd>11 wks</dd></div>
              <div><dt>Traceable to mine</dt><dd>100%</dd></div>
            </dl>
          </div>
        </section>

        <section className="panel closing" id="visit">
          <h2>Come and hold one.</h2>
          <p>
            The showroom is open Tuesday to Saturday, by appointment. Bring the light you
            live in — we will match a stone to it.
          </p>
          <a className="btn light" href="#visit">Book an appointment</a>
          <footer>
            <span>12 rue de Sévigné, 75004 Paris</span>
            <span>+33 1 42 00 19 46</span>
            <span>Built with react-three-fiber</span>
          </footer>
        </section>
      </main>
    </>
  )
}
