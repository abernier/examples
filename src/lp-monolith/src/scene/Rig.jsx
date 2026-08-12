import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { easing } from 'maath'
import { scroll } from '../scroll'

/**
 * Scroll-driven camera rig.
 * The lerp-camera-then-lookAt pattern is the CameraRig from the pmndrs
 * "building-live-envmaps" example; the pointer parallax + maath `easing.damp3`
 * smoothing is the same trick "the-three-graces" uses on its group. Here the
 * driver is page scroll instead of a clock, walked along a Catmull-Rom path.
 */
export function Rig() {
  const size = useThree((state) => state.size)

  const [path, look] = useMemo(
    () => [
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.35, 0.9, 7.6),
        new THREE.Vector3(4.1, 0.35, 5.0),
        new THREE.Vector3(-3.6, 1.65, 4.6),
        new THREE.Vector3(1.2, 3.1, 7.2),
        new THREE.Vector3(-2.6, 4.6, 11.6),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.95, 0.6, 0.0),
        new THREE.Vector3(1.1, 0.5, -1.5),
        new THREE.Vector3(0.2, 1.0, -3.2),
        new THREE.Vector3(0.3, 0.5, -5.0),
        new THREE.Vector3(0.5, 1.0, -4.6),
      ]),
    ],
    [],
  )

  const pos = useRef(new THREE.Vector3())
  const target = useRef(new THREE.Vector3(0, 0.55, 0))
  const tmp = useRef(new THREE.Vector3())

  useFrame((state, delta) => {
    const p = THREE.MathUtils.clamp(scroll.progress, 0, 1)

    // pull the camera back on narrow viewports so the composition still reads
    const back = size.width < 720 ? 1.9 : size.width < 1100 ? 1.25 : 1

    path.getPoint(p, pos.current)
    pos.current.x = pos.current.x * back + state.pointer.x * 0.55
    pos.current.z = pos.current.z * back + 0.4
    pos.current.y += state.pointer.y * 0.28

    easing.damp3(state.camera.position, pos.current, 0.45, delta)

    look.getPoint(p, tmp.current)
    easing.damp3(target.current, tmp.current, 0.5, delta)
    state.camera.lookAt(target.current)
  })

  return null
}
