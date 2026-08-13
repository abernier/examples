import * as THREE from 'three'
import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

/**
 * One camera stop per page section. Scroll picks the stop, the pointer adds a
 * little parallax, and everything is damped rather than lerped so the motion is
 * framerate independent.
 */
const STOPS = [
  { pos: [0, 0.15, 9.6], look: [0, 0, 0] },
  { pos: [-2.4, 0.7, 4.3], look: [-2.4, 0.6, 0] },
  { pos: [2.4, -0.55, 6.0], look: [1.2, -0.4, 0] },
]

const pos = new THREE.Vector3()
const look = new THREE.Vector3()
const a = new THREE.Vector3()
const b = new THREE.Vector3()

export default function Rig({ scroll }) {
  const camera = useThree((state) => state.camera)
  const target = useRef(new THREE.Vector3(0, 0, 0))

  useFrame((state, delta) => {
    // Where we are between the stops
    const t = THREE.MathUtils.clamp(scroll.current, 0, 1) * (STOPS.length - 1)
    const i = Math.min(STOPS.length - 2, Math.floor(t))
    const k = t - i

    pos.fromArray(STOPS[i].pos).lerp(a.fromArray(STOPS[i + 1].pos), k)
    look.fromArray(STOPS[i].look).lerp(b.fromArray(STOPS[i + 1].look), k)

    pos.x += state.pointer.x * 0.35
    pos.y += state.pointer.y * 0.22

    camera.position.x = THREE.MathUtils.damp(camera.position.x, pos.x, 3, delta)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, pos.y, 3, delta)
    camera.position.z = THREE.MathUtils.damp(camera.position.z, pos.z, 3, delta)

    target.current.x = THREE.MathUtils.damp(target.current.x, look.x, 3, delta)
    target.current.y = THREE.MathUtils.damp(target.current.y, look.y, 3, delta)
    target.current.z = THREE.MathUtils.damp(target.current.z, look.z, 3, delta)
    camera.lookAt(target.current)
  })

  return null
}
