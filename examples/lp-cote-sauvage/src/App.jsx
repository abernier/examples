import * as THREE from 'three'
import { Suspense, useRef, useMemo } from 'react'
import { Canvas, extend, useLoader, useFrame } from '@react-three/fiber'
import { Sky, Cloud, Clouds, Float } from '@react-three/drei'
import { Water } from 'three-stdlib'

import waterNormalsImg from './waternormals.jpeg'

/* ------------------------------------------------------------------ *
 * Ocean — three-stdlib Water, wired the way pmndrs/examples
 * "water-shader" does it, at a low golden-hour sun.
 * ------------------------------------------------------------------ */

extend({ Water })

const SUN = new THREE.Vector3(-320, 42, -520)

function Ocean() {
  const ref = useRef()
  const waterNormals = useLoader(THREE.TextureLoader, waterNormalsImg)
  waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping

  const geom = useMemo(() => new THREE.PlaneGeometry(10000, 10000), [])
  const config = useMemo(
    () => ({
      textureWidth: 512,
      textureHeight: 512,
      waterNormals,
      sunDirection: SUN.clone().normalize(),
      sunColor: 0xffd9a0,
      waterColor: 0x0a3049,
      distortionScale: 4.2,
      fog: false,
    }),
    [waterNormals]
  )

  useFrame((state, delta) => (ref.current.material.uniforms.time.value += delta * 0.55))
  return <water ref={ref} args={[geom, config]} rotation-x={-Math.PI / 2} />
}

/* A board bobbing on the swell — kept deliberately simple so the
 * water stays the subject. */
function Board({ position, rotation = [0, 0, 0], color, speed = 1, phase = 0 }) {
  const ref = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime * speed + phase
    ref.current.position.y = 1.5 + Math.sin(t) * 3.2
    ref.current.rotation.z = rotation[2] + Math.sin(t * 0.8) * 0.16
    ref.current.rotation.x = rotation[0] + Math.cos(t * 0.6) * 0.1
  })
  return (
    <group ref={ref} position={position} rotation={rotation}>
      <mesh castShadow scale={[3.2, 0.55, 14]}>
        <capsuleGeometry args={[1, 1.6, 8, 24]} />
        <meshStandardMaterial color={color} roughness={0.28} metalness={0.05} />
      </mesh>
      <mesh position={[0, -0.5, 4.4]} scale={[0.35, 1.6, 1.9]}>
        <coneGeometry args={[1, 1.6, 4]} />
        <meshStandardMaterial color="#0d2b3d" roughness={0.4} />
      </mesh>
    </group>
  )
}

function Rig() {
  useFrame((state, delta) => {
    state.camera.position.y = THREE.MathUtils.damp(
      state.camera.position.y,
      9 + state.pointer.y * 5,
      1.6,
      delta
    )
    state.camera.position.x = THREE.MathUtils.damp(
      state.camera.position.x,
      state.pointer.x * 22,
      1.6,
      delta
    )
    state.camera.lookAt(0, 4, -60)
  })
  return null
}

function Scene() {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 9, 90], fov: 52, near: 1, far: 20000 }}>
      <directionalLight position={SUN.toArray()} intensity={2.4} color="#ffd0a0" />
      <ambientLight intensity={0.55} color="#8fb8d8" />
      <hemisphereLight args={['#ffd6a5', '#08283c', 0.7]} />

      <Suspense fallback={null}>
        <Ocean />
        <Board position={[-34, 0, 12]} rotation={[0, 0.5, 0.05]} color="#f4f1e8" speed={0.8} />
        <Board position={[26, 0, -4]} rotation={[0, -0.35, -0.06]} color="#ff8b52" speed={0.95} phase={2.1} />
        <Board position={[4, 0, -46]} rotation={[0, 0.15, 0.03]} color="#ffd166" speed={0.72} phase={4.4} />

        <Clouds material={THREE.MeshBasicMaterial} limit={200}>
          <Float speed={0.4} floatIntensity={2} rotationIntensity={0}>
            <Cloud seed={1} segments={40} bounds={[220, 12, 60]} volume={40} color="#ffe0c2" opacity={0.5} position={[-90, 90, -420]} />
          </Float>
          <Float speed={0.3} floatIntensity={2} rotationIntensity={0}>
            <Cloud seed={7} segments={30} bounds={[180, 10, 50]} volume={34} color="#f0c9c0" opacity={0.42} position={[140, 110, -520]} />
          </Float>
        </Clouds>
      </Suspense>

      <Sky
        scale={12000}
        sunPosition={SUN.toArray()}
        turbidity={7}
        rayleigh={2.4}
        mieCoefficient={0.008}
        mieDirectionalG={0.82}
      />
      <Rig />
    </Canvas>
  )
}

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */

const COURSES = [
  {
    k: 'Découverte',
    d: '2 sessions',
    p: '€95',
    copy: 'Never stood up before. Whitewater only, on soft-tops, at waist depth. You will stand on day one — everybody does.',
  },
  {
    k: 'Green wave',
    d: '5 sessions',
    p: '€310',
    copy: 'You can pop up but the unbroken wave still gets away. Paddle timing, take-off angle, and the first real bottom turn.',
  },
  {
    k: 'Ocean sense',
    d: '1 day',
    p: '€120',
    copy: 'Rips, banks, tides and swell reading, in the water and on the sand. The lesson that keeps you safe for twenty years.',
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
          <span className="mark">
            Côte<em>Sauvage</em>
          </span>
          <nav>
            <a href="#courses">Courses</a>
            <a href="#forecast">Forecast</a>
            <a href="#book">Book</a>
          </nav>
        </header>

        <section className="hero">
          <p className="eyebrow">Presqu'île de Quiberon · école de surf</p>
          <h1>
            Learn the
            <br />
            <em>whole ocean.</em>
          </h1>
          <p className="lede">
            Not just how to stand up. Six instructors, maximum five students each, on a beach
            that has been teaching people to read water since 1974.
          </p>
          <div className="cta">
            <a className="btn" href="#courses">
              See the courses
            </a>
            <span className="hint">move your cursor — the swell follows</span>
          </div>
        </section>

        <section className="panel" id="courses">
          <div className="panel-head">
            <h2>Three ways in</h2>
            <p>
              All prices include board, wetsuit and insurance. Sessions run at the tide, so
              the timetable moves — we send you yours the evening before.
            </p>
          </div>
          <div className="cards">
            {COURSES.map((c) => (
              <article key={c.k}>
                <header>
                  <h3>{c.k}</h3>
                  <span className="dur">{c.d}</span>
                </header>
                <p>{c.copy}</p>
                <div className="foot">
                  <span className="price">{c.p}</span>
                  <a href="#book">Book →</a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel alt" id="forecast">
          <div className="split">
            <div>
              <h2>We only teach when the sea agrees.</h2>
              <p>
                If the forecast turns, we move you — no charge, no argument. A frustrated
                beginner in a 2-metre closeout learns nothing except that surfing is
                unpleasant, and that is the one thing we refuse to teach.
              </p>
            </div>
            <dl className="stats">
              <div><dt>Swell</dt><dd>1.4 m</dd></div>
              <div><dt>Period</dt><dd>11 s</dd></div>
              <div><dt>Wind</dt><dd>NE 8 kt</dd></div>
              <div><dt>Water</dt><dd>17 °C</dd></div>
              <div><dt>Next low tide</dt><dd>14:52</dd></div>
              <div><dt>Verdict</dt><dd className="good">Clean</dd></div>
            </dl>
          </div>
        </section>

        <section className="panel closing" id="book">
          <h2>The next session is at low tide.</h2>
          <p>
            April to October, seven days a week. Wetsuits down to a 4/3 in the shoulder
            months. Bring a towel and something warm for afterwards.
          </p>
          <a className="btn light" href="#book">
            Reserve a place
          </a>
          <footer>
            <span>Plage de Port Blanc, 56510 Saint-Pierre-Quiberon</span>
            <span>+33 2 97 00 74 12</span>
            <span>Built with react-three-fiber</span>
          </footer>
        </section>
      </main>
    </>
  )
}
