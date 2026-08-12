import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { view } from '../store.js'

/**
 * Ignition debris / ejecta swarm.
 * Straight port of the trigonometric InstancedMesh swarm from the pmndrs
 * `instanced-particles-effects` demo (the `Swarm` component), retuned: fewer,
 * larger, colder shards, and the mouse term drives a much softer drift so it
 * reads as tumbling debris rather than a cloud of confetti.
 */
export default function Debris({ count = 900, dummy = new THREE.Object3D() }) {
  const mesh = useRef(null)

  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100
      const factor = 20 + Math.random() * 100
      const speed = 0.005 + Math.random() / 400
      const xFactor = -34 + Math.random() * 68
      const yFactor = -26 + Math.random() * 52
      const zFactor = -34 + Math.random() * 40
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 })
    }
    return temp
  }, [count])

  useFrame(() => {
    const mouseX = view.px * 600
    const mouseY = view.py * 600
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i]
      let { t, factor, speed, xFactor, yFactor, zFactor } = particle
      t = particle.t += speed / 2
      const a = Math.cos(t) + Math.sin(t * 1) / 10
      const b = Math.sin(t) + Math.cos(t * 2) / 10
      const s = Math.max(0.25, Math.abs(Math.cos(t)))
      particle.mx += (mouseX - particle.mx) * 0.008
      particle.my += (mouseY - 1 - particle.my) * 0.008
      dummy.position.set(
        (particle.mx / 60) * a + xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 12,
        (particle.my / 60) * b + yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 12,
        (particle.my / 60) * b + zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 12
      )
      dummy.scale.setScalar(s * 0.55)
      dummy.rotation.set(s * 5, s * 5, s * 5)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false}>
      <tetrahedronGeometry args={[0.12, 0]} />
      <meshStandardMaterial color="#141821" roughness={0.55} metalness={0.65} envMapIntensity={1.6} />
    </instancedMesh>
  )
}
