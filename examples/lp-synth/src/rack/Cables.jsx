import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Instances, Instance } from '@react-three/drei'

const TUBULAR = 56
const RADIAL = 7

/**
 * Patch cables: CatmullRom curves swept into TubeGeometry with a rope sag,
 * all merged into one vertex-coloured buffer (single draw call) and swayed
 * every frame by displacing vertices along a precomputed sin(pi*t) envelope.
 */
export function Cables({ patches }) {
  const meshRef = useRef(null)

  const { geometry, base, env, cableOf, meta, plugs } = useMemo(() => {
    const positions = []
    const normals = []
    const colors = []
    const indices = []
    const env = []
    const cableOf = []
    const plugs = []
    const meta = []
    let vOffset = 0

    const tmpColor = new THREE.Color()

    patches.forEach((p, ci) => {
      const A = new THREE.Vector3(...p.a)
      const B = new THREE.Vector3(...p.b)
      const plugLen = 0.085
      const a0 = A.clone().setZ(A.z + plugLen)
      const b0 = B.clone().setZ(B.z + plugLen)
      const dist = a0.distanceTo(b0)
      const sag = p.sag * (0.22 + dist * 0.42)
      const bow = p.bow * (0.24 + dist * 0.3)
      const a1 = a0.clone().setZ(a0.z + p.lift)
      const b1 = b0.clone().setZ(b0.z + p.lift)
      const c1 = a1.clone().lerp(b1, 0.3)
      c1.y -= sag
      c1.z += bow
      const c2 = a1.clone().lerp(b1, 0.7)
      c2.y -= sag * 0.94
      c2.z += bow * 0.96

      const curve = new THREE.CatmullRomCurve3([a0, a1, c1, c2, b1, b0], false, 'catmullrom', 0.5)
      const g = new THREE.TubeGeometry(curve, TUBULAR, p.radius, RADIAL, false)
      const gp = g.attributes.position.array
      const gn = g.attributes.normal.array
      const gi = g.index.array
      const count = g.attributes.position.count

      tmpColor.set(p.color)
      for (let i = 0; i < count; i++) {
        positions.push(gp[i * 3], gp[i * 3 + 1], gp[i * 3 + 2])
        normals.push(gn[i * 3], gn[i * 3 + 1], gn[i * 3 + 2])
        colors.push(tmpColor.r, tmpColor.g, tmpColor.b)
        const ring = Math.floor(i / (RADIAL + 1))
        const t = ring / TUBULAR
        env.push(Math.sin(Math.PI * t))
        cableOf.push(ci)
      }
      for (let i = 0; i < gi.length; i++) indices.push(gi[i] + vOffset)
      vOffset += count
      g.dispose()

      meta.push({ phase: p.phase, speed: p.speed, amp: 0.014 + dist * 0.02 })
      plugs.push({ p: [A.x, A.y, A.z], color: p.color }, { p: [B.x, B.y, B.z], color: p.color })
    })

    const geometry = new THREE.BufferGeometry()
    const posArr = new Float32Array(positions)
    geometry.setAttribute('position', new THREE.BufferAttribute(posArr, 3))
    geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3))
    geometry.setIndex(indices)
    geometry.computeBoundingSphere()

    return {
      geometry,
      base: posArr.slice(),
      env: new Float32Array(env),
      cableOf: new Uint16Array(cableOf),
      meta,
      plugs,
    }
  }, [patches])

  const barrelGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(1, 1, 1, 14)
    g.rotateX(Math.PI / 2)
    return g
  }, [])

  const offsets = useMemo(() => new Float32Array(meta.length * 3), [meta])

  useFrame((state) => {
    const mesh = meshRef.current
    if (!mesh) return
    const t = state.clock.elapsedTime
    for (let c = 0; c < meta.length; c++) {
      const m = meta[c]
      offsets[c * 3] = Math.sin(t * m.speed + m.phase) * m.amp * 0.55
      offsets[c * 3 + 1] = Math.sin(t * m.speed * 0.83 + m.phase * 1.7) * m.amp
      offsets[c * 3 + 2] = Math.cos(t * m.speed * 0.61 + m.phase * 0.6) * m.amp * 0.7
    }
    const attr = mesh.geometry.attributes.position
    const arr = attr.array
    for (let i = 0, n = env.length; i < n; i++) {
      const c = cableOf[i] * 3
      const s = env[i]
      const i3 = i * 3
      arr[i3] = base[i3] + s * offsets[c]
      arr[i3 + 1] = base[i3 + 1] + s * offsets[c + 1]
      arr[i3 + 2] = base[i3 + 2] + s * offsets[c + 2]
    }
    attr.needsUpdate = true
  })

  return (
    <group>
      <mesh ref={meshRef} geometry={geometry} castShadow>
        <meshStandardMaterial vertexColors roughness={0.42} metalness={0.05} envMapIntensity={0.8} />
      </mesh>
      {/* plug barrels */}
      <Instances limit={Math.max(1, plugs.length)} geometry={barrelGeo}>
        <meshStandardMaterial color="#101315" roughness={0.35} metalness={0.5} />
        {plugs.map((pl, i) => (
          <Instance key={i} position={[pl.p[0], pl.p[1], pl.p[2] + 0.043]} scale={[0.03, 0.03, 0.086]} />
        ))}
      </Instances>
      {/* coloured strain-relief collars */}
      <Instances limit={Math.max(1, plugs.length)} geometry={barrelGeo}>
        <meshStandardMaterial roughness={0.5} metalness={0.05} />
        {plugs.map((pl, i) => (
          <Instance
            key={i}
            position={[pl.p[0], pl.p[1], pl.p[2] + 0.082]}
            scale={[0.026, 0.026, 0.03]}
            color={pl.color}
          />
        ))}
      </Instances>
    </group>
  )
}
