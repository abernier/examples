import * as THREE from 'three'
import { forwardRef, useEffect, useImperativeHandle, useRef, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, RoundedBox, Environment, Lightformer } from '@react-three/drei'
import { Physics, useSphere, useBox, usePlane } from '@react-three/cannon'

/* ------------------------------------------------------------------ *
 * Playable pinball hero.
 * Physics rig adapted from pmndrs/examples "pinball-in-70-lines",
 * relit with a neon lightformer environment instead of an HDRI preset.
 * ------------------------------------------------------------------ */

function BallAndCollisions({ v = new THREE.Vector3() }) {
  const cam = useRef()
  const [ref, api] = useSphere(() => ({
    args: [1.2],
    mass: 1,
    material: { restitution: 0.95 },
  }))
  // floor — drops reset the ball
  usePlane(() => ({
    position: [0, -15, 0],
    rotation: [-Math.PI / 2, 0, 0],
    onCollide: () => (api.position.set(0, 0, 0), api.velocity.set(0, 0, 0)),
  }))
  usePlane(() => ({ position: [-15, 0, 0], rotation: [-Math.PI / 2, Math.PI / 2, 0] }))
  usePlane(() => ({ position: [15, 0, 0], rotation: [Math.PI / 2, -Math.PI / 2, 0] }))

  useEffect(
    () =>
      api.position.subscribe(
        (p) => (
          cam.current.position.lerp(v.set(p[0], p[1], 18 + Math.max(0, p[1]) / 2), 0.05),
          cam.current.lookAt(0, 0, 0)
        )
      ),
    []
  )

  return (
    <>
      <PerspectiveCamera ref={cam} makeDefault position={[0, 0, 12]} fov={50} />
      <mesh ref={ref}>
        <sphereGeometry args={[1.2, 48, 48]} />
        <meshPhysicalMaterial
          transmission={1}
          roughness={0}
          thickness={4}
          envMapIntensity={3}
          color="#ffffff"
        />
      </mesh>
    </>
  )
}

const Block = forwardRef(
  ({ shake = 0, args = [1, 1.5, 4], vec = new THREE.Vector3(), tint = '#ffffff', ...props }, ref) => {
    const group = useRef()
    const [block, api] = useBox(() => ({
      args,
      ...props,
      onCollide: (e) => (shake += e.contact.impactVelocity / 12.5),
    }))
    useFrame(() =>
      group.current.position.lerp(vec.set(0, (shake = THREE.MathUtils.lerp(shake, 0, 0.1)), 0), 0.2)
    )
    useImperativeHandle(ref, () => api, [api])
    return (
      <group ref={group}>
        <RoundedBox ref={block} args={args} radius={0.4} smoothness={8}>
          <meshPhysicalMaterial
            transmission={1}
            roughness={0}
            thickness={3}
            envMapIntensity={5}
            color={tint}
          />
        </RoundedBox>
      </group>
    )
  }
)

function Paddle({ args = [5, 1.5, 4] }) {
  const api = useRef()
  useFrame(
    (state) => (
      api.current.position.set(state.pointer.x * 10, -5, 0),
      api.current.rotation.set(0, 0, (state.pointer.x * Math.PI) / 4)
    )
  )
  return <Block ref={api} args={args} tint="#8affff" material={{ restitution: 1.3 }} />
}

function MovingBlock({ offset = 0, position: [x, y, z], tint, ...props }) {
  const api = useRef()
  useFrame((state) =>
    api.current.position.set(
      x + (Math.sin(offset + state.clock.elapsedTime) * state.viewport.width) / 4,
      y,
      z
    )
  )
  return <Block ref={api} args={[3, 1.5, 4]} tint={tint} material={{ restitution: 1.1 }} {...props} />
}

function NeonRoom() {
  return (
    <Environment resolution={256}>
      <color attach="background" args={['#05050c']} />
      <Lightformer form="rect" intensity={6} color="#ff2fd0" scale={[14, 3, 1]} position={[-9, 4, -6]} rotation-y={Math.PI / 5} />
      <Lightformer form="rect" intensity={6} color="#22e6ff" scale={[14, 3, 1]} position={[9, -2, -6]} rotation-y={-Math.PI / 5} />
      <Lightformer form="rect" intensity={4} color="#ffe45e" scale={[10, 2, 1]} position={[0, 9, -4]} rotation-x={Math.PI / 2} />
      <Lightformer form="circle" intensity={8} color="#ffffff" scale={3} position={[0, 0, 9]} />
      <Lightformer form="rect" intensity={3} color="#7c3cff" scale={[20, 20, 1]} position={[0, -10, 0]} rotation-x={-Math.PI / 2} />
    </Environment>
  )
}

const TINTS = ['#ff5ad4', '#5ae8ff', '#ffe45e', '#a86bff', '#5affa0', '#ff8a3c']

function Scene() {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 2, 12], fov: 50 }}>
      <color attach="background" args={['#07060f']} />
      <Suspense fallback={null}>
        <Physics iterations={5} gravity={[0, -30, 0]}>
          <BallAndCollisions />
          <Paddle />
          {Array.from({ length: 6 }, (_, i) => (
            <MovingBlock key={i} position={[0, 1 + i * 4.5, 0]} offset={10000 * i} tint={TINTS[i]} />
          ))}
          <Block args={[10, 1.5, 4]} position={[-11, -7, 0]} rotation={[0, 0, -0.7]} tint="#ff2fd0" material={{ restitution: 1.2 }} />
          <Block args={[10, 1.5, 4]} position={[11, -7, 0]} rotation={[0, 0, 0.7]} tint="#22e6ff" material={{ restitution: 1.2 }} />
          <NeonRoom />
        </Physics>
      </Suspense>
    </Canvas>
  )
}

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */

const STOCK = [
  { name: 'Bally — Eight Ball Deluxe', year: '1981', tag: 'Fully shopped', price: '€4,200' },
  { name: 'Sega — After Burner II', year: '1987', tag: 'Sit-down, new belts', price: '€6,800' },
  { name: 'Atari — Tempest', year: '1981', tag: 'Recapped XY monitor', price: '€5,400' },
  { name: 'Williams — Defender', year: '1980', tag: 'NOS control panel', price: '€3,900' },
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
            NEON<span>ALLEY</span>
          </span>
          <nav>
            <a href="#stock">Stock</a>
            <a href="#workshop">Workshop</a>
            <a href="#visit">Visit</a>
          </nav>
          <span className="status">
            <i /> 34 cabs on the floor
          </span>
        </header>

        <section className="hero">
          <div className="hero-inner">
            <p className="eyebrow">Rotterdam · arcade emporium &amp; repair bench</p>
            <h1>
              Insert
              <br />
              coin.
            </h1>
            <p className="lede">
              We buy, restore and sell the machines you grew up feeding guilders into. Every
              cabinet leaves the bench recapped, re-belted and burn-in tested for 72 hours.
            </p>
            <div className="cta">
              <a className="btn" href="#stock">
                Browse the floor
              </a>
              <span className="hint">↑ move your mouse — the paddle is yours</span>
            </div>
          </div>
        </section>

        <section className="panel" id="stock">
          <div className="panel-head">
            <h2>On the floor this week</h2>
            <p>Prices include a twelve-month bench warranty and delivery inside the Benelux.</p>
          </div>
          <ul className="stock">
            {STOCK.map((m) => (
              <li key={m.name}>
                <span className="yr">{m.year}</span>
                <span className="nm">{m.name}</span>
                <span className="tg">{m.tag}</span>
                <span className="pr">{m.price}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel alt" id="workshop">
          <div className="panel-head">
            <h2>The bench</h2>
            <p>
              Monitor chassis, ROM boards, flipper coils, sun-bleached sideart. If it was
              built between 1978 and 1994 and it has a coin door, we will take a look at it.
            </p>
          </div>
          <div className="cards">
            <article>
              <h3>CRT service</h3>
              <p>Full recap, flyback swap, convergence and geometry set up on a scope. Tubes rejuvenated where they will take it.</p>
              <span className="from">from €180</span>
            </article>
            <article>
              <h3>Board repair</h3>
              <p>Component-level diagnosis on JAMMA and pre-JAMMA hardware. Logic probe, not a parts cannon.</p>
              <span className="from">from €95</span>
            </article>
            <article>
              <h3>Cabinet restoration</h3>
              <p>Sideart reproduction, T-molding, laminate, coin door replate. Six to fourteen weeks depending on the shell.</p>
              <span className="from">quoted</span>
            </article>
          </div>
        </section>

        <section className="panel closing" id="visit">
          <h2>
            Open late.
            <br />
            Bring coins.
          </h2>
          <p>
            Thursday to Sunday, 16:00 until 01:00. Free play on the back wall, cash on the
            front row. Under-16s welcome until 20:00.
          </p>
          <a className="btn" href="#visit">
            Get directions
          </a>
          <footer>
            <span>Katendrechtse Lagedijk 4, Rotterdam</span>
            <span>+31 10 555 0198</span>
            <span>Built with react-three-fiber + cannon</span>
          </footer>
        </section>
      </main>
    </>
  )
}
