import * as THREE from 'three'
import { Suspense, useLayoutEffect, useMemo, useRef } from 'react'
import { Canvas, extend, useFrame, useLoader } from '@react-three/fiber'

import fireImg from './fire.png'

/* ------------------------------------------------------------------ *
 * Volumetric fire — ray-marched turbulence sampling a fire gradient.
 * Shader taken from pmndrs/examples "shader-fire".
 * ------------------------------------------------------------------ */

class FireMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      defines: { ITERATIONS: '10', OCTIVES: '3' },
      uniforms: {
        fireTex: { value: null },
        color: { value: null },
        time: { value: 0.0 },
        seed: { value: 0.0 },
        invModelMatrix: { value: null },
        scale: { value: null },
        noiseScale: { value: new THREE.Vector4(1, 2, 1, 0.3) },
        magnitude: { value: 2.5 },
        lacunarity: { value: 3.0 },
        gain: { value: 0.6 },
      },
      vertexShader: /* glsl */ `
        varying vec3 vWorldPos;
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        }`,
      fragmentShader: /* glsl */ `
        // Simplex noise — Ian McEwan, Ashima Arts. MIT.
        // https://github.com/ashima/webgl-noise
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

        float snoise(vec3 v) {
          const vec2  C = vec2(1.0/6.0, 1.0/3.0);
          const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i  = floor(v + dot(v, C.yyy));
          vec3 x0 =   v - i + dot(i, C.xxx);
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          i = mod289(i);
          vec4 p = permute( permute( permute(
                     i.z + vec4(0.0, i1.z, i2.z, 1.0))
                   + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                   + i.x + vec4(0.0, i1.x, i2.x, 1.0));
          float n_ = 0.142857142857;
          vec3  ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);
          vec4 x = x_ * ns.x + ns.yyyy;
          vec4 y = y_ * ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
          p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }

        uniform vec3 color;
        uniform float time;
        uniform float seed;
        uniform mat4 invModelMatrix;
        uniform vec3 scale;
        uniform vec4 noiseScale;
        uniform float magnitude;
        uniform float lacunarity;
        uniform float gain;
        uniform sampler2D fireTex;
        varying vec3 vWorldPos;

        float turbulence(vec3 p) {
          float sum = 0.0;
          float freq = 1.0;
          float amp = 1.0;
          for(int i = 0; i < OCTIVES; i++) {
            sum += abs(snoise(p * freq)) * amp;
            freq *= lacunarity;
            amp *= gain;
          }
          return sum;
        }

        vec4 samplerFire (vec3 p, vec4 scale) {
          vec2 st = vec2(sqrt(dot(p.xz, p.xz)), p.y);
          if(st.x <= 0.0 || st.x >= 1.0 || st.y <= 0.0 || st.y >= 1.0) return vec4(0.0);
          p.y -= (seed + time) * scale.w;
          p *= scale.xyz;
          st.y += sqrt(st.y) * magnitude * turbulence(p);
          if(st.y <= 0.0 || st.y >= 1.0) return vec4(0.0);
          return texture2D(fireTex, st);
        }

        vec3 localize(vec3 p) { return (invModelMatrix * vec4(p, 1.0)).xyz; }

        void main() {
          vec3 rayPos = vWorldPos;
          vec3 rayDir = normalize(rayPos - cameraPosition);
          float rayLen = 0.0288 * length(scale.xyz);
          vec4 col = vec4(0.0);
          for(int i = 0; i < ITERATIONS; i++) {
            rayPos += rayDir * rayLen;
            vec3 lp = localize(rayPos);
            lp.y += 0.5;
            lp.xz *= 2.0;
            col += samplerFire(lp, noiseScale);
          }
          col.a = col.r;
          gl_FragColor = col;
        }`,
    })
  }
}

extend({ FireMaterial })

function Fire({ color, ...props }) {
  const ref = useRef()
  const texture = useLoader(THREE.TextureLoader, fireImg)
  useFrame((state) => {
    const invModelMatrix = ref.current.material.uniforms.invModelMatrix.value
    ref.current.updateMatrixWorld()
    invModelMatrix.copy(ref.current.matrixWorld).invert()
    ref.current.material.uniforms.time.value = state.clock.elapsedTime
    ref.current.material.uniforms.invModelMatrix.value = invModelMatrix
    ref.current.material.uniforms.scale.value = ref.current.scale
  })
  useLayoutEffect(() => {
    texture.magFilter = texture.minFilter = THREE.LinearFilter
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping
    const u = ref.current.material.uniforms
    u.fireTex.value = texture
    u.color.value = color || new THREE.Color(0xeeeeee)
    u.invModelMatrix.value = new THREE.Matrix4()
    u.scale.value = new THREE.Vector3(1, 1, 1)
    u.seed.value = Math.random() * 19.19
  }, [])
  return (
    <mesh ref={ref} {...props}>
      <boxGeometry />
      <fireMaterial transparent depthWrite={false} depthTest={false} />
    </mesh>
  )
}

/* Embers drifting up out of the coals. */
function Embers({ count = 260 }) {
  const ref = useRef()
  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12
      positions[i * 3 + 1] = Math.random() * 16 - 6
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6
      seeds[i * 3] = 0.4 + Math.random() * 1.4 // rise speed
      seeds[i * 3 + 1] = Math.random() * Math.PI * 2 // sway phase
      seeds[i * 3 + 2] = 0.3 + Math.random() * 0.9 // sway amount
    }
    return { positions, seeds }
  }, [count])

  useFrame((state, delta) => {
    const arr = ref.current.geometry.attributes.position.array
    const t = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      arr[i3 + 1] += seeds[i3] * delta * 1.6
      arr[i3] += Math.sin(t * 0.8 + seeds[i3 + 1]) * seeds[i3 + 2] * delta
      if (arr[i3 + 1] > 11) {
        arr[i3 + 1] = -6
        arr[i3] = (Math.random() - 0.5) * 8
        arr[i3 + 2] = (Math.random() - 0.5) * 6
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.09}
        color="#ff9d3c"
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}

function Rig() {
  useFrame((state, delta) => {
    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, state.pointer.x * 2.6, 1.4, delta)
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, -4 + state.pointer.y * 1.6, 1.4, delta)
    state.camera.lookAt(0, 0.5, 0)
  })
  return null
}

function Scene() {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, -4, 5], fov: 50 }}>
      <color attach="background" args={['#0a0604']} />
      <fog attach="fog" args={['#0a0604', 8, 30]} />
      <pointLight position={[0, -1, 2]} intensity={26} distance={22} color="#ff7a1c" />
      <ambientLight intensity={0.12} color="#ff8a3c" />

      <Suspense fallback={null}>
        <Fire scale={7} position={[0, 0, 0]} />
        <Fire scale={3.4} position={[-4.6, -1.6, -2.4]} />
        <Fire scale={2.6} position={[4.4, -2, -1.4]} />
        <Embers />
      </Suspense>

      {/* charred bed the flames sit on */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -3.5, 0]}>
        <circleGeometry args={[9, 48]} />
        <meshStandardMaterial color="#150c07" roughness={1} metalness={0} />
      </mesh>

      <Rig />
    </Canvas>
  )
}

/* ------------------------------------------------------------------ *
 * Page
 * ------------------------------------------------------------------ */

const BOARD = [
  { t: 'Brisket', h: '14 hrs', w: 'White oak', d: 'Point and flat, salt and pepper only. Sold by weight until it runs out — usually around 19:00.' },
  { t: 'Beef short rib', h: '9 hrs', w: 'Oak & cherry', d: 'One bone, roughly 700 g. The single best argument we know for eating with your hands.' },
  { t: 'Pork shoulder', h: '11 hrs', w: 'Apple', d: 'Pulled to order, never held. Bark stirred back through so every portion gets some.' },
  { t: 'Half chicken', h: '3 hrs', w: 'Cherry', d: 'Brined overnight, hot-smoked, finished skin-side down over the coals.' },
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
            Forge <em>&amp;</em> Flame
          </span>
          <nav>
            <a href="#board">The board</a>
            <a href="#fire">The fire</a>
            <a href="#find">Find us</a>
          </nav>
          <span className="status">
            <i /> Pit lit 04:12
          </span>
        </header>

        <section className="hero">
          <p className="eyebrow">Smokehouse · Bristol · wood only</p>
          <h1>
            Low.
            <br />
            <em>Slow.</em>
            <br />
            Sold out.
          </h1>
          <p className="lede">
            One pit, one fire, no gas assist. We light at four in the morning and we serve
            until it is gone — which on a Saturday means about ninety minutes.
          </p>
          <div className="cta">
            <a className="btn" href="#board">
              See today's board
            </a>
            <span className="hint">move your cursor — mind the sparks</span>
          </div>
        </section>

        <section className="panel" id="board">
          <div className="panel-head">
            <h2>Today's board</h2>
            <p>
              Everything is cooked once, in the morning, over splits. When a line is crossed
              off it stays crossed off — we do not put a second brisket on at four in the
              afternoon and neither should anyone else.
            </p>
          </div>
          <ul className="board">
            {BOARD.map((b) => (
              <li key={b.t}>
                <div className="bhead">
                  <h3>{b.t}</h3>
                  <span className="hrs">{b.h}</span>
                </div>
                <p>{b.d}</p>
                <span className="wood">{b.w}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel alt" id="fire">
          <div className="split">
            <div>
              <h2>The fire is the recipe.</h2>
              <p>
                An offset pit is a machine for turning clean smoke into time. We run thin
                blue — never white — which means small splits, a hot firebox and somebody
                awake next to it all night. There is no rub that fixes a badly managed fire,
                and no fire so good it needs one.
              </p>
            </div>
            <dl className="stats">
              <div><dt>Pit temperature</dt><dd>107 °C</dd></div>
              <div><dt>Wood split every</dt><dd>45 min</dd></div>
              <div><dt>Oak burned weekly</dt><dd>1.2 t</dd></div>
              <div><dt>Gas used</dt><dd>None</dd></div>
            </dl>
          </div>
        </section>

        <section className="panel closing" id="find">
          <h2>Come early. Genuinely.</h2>
          <p>
            Thursday to Sunday from noon. There is a queue by 11:30 and there is no booking,
            because a table held is a table not eating while the meat is at its best.
          </p>
          <a className="btn" href="#find">
            Get directions
          </a>
          <footer>
            <span>Arch 14, Stokes Croft, Bristol BS1</span>
            <span>@forgeandflame</span>
            <span>Built with react-three-fiber</span>
          </footer>
        </section>
      </main>
    </>
  )
}
