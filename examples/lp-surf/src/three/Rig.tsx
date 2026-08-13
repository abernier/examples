import { useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'

import {
  AIR_BG,
  AIR_DENSITY,
  AIR_FOG,
  DEEP_BG,
  DEEP_DENSITY,
  DEEP_FOG,
  fogDensity,
  fogTint,
} from './env'

type Key = { at: number; p: [number, number, number]; l: [number, number, number] }

/**
 * The whole page is one dive: dawn on the horizon, through the surface at
 * roughly a third of the way down, along the seabed, then back up into the
 * light for the closing call to action.
 */
const PATH: Key[] = [
  { at: 0.0, p: [0, 6.2, 46], l: [0, 4.0, -30] },
  { at: 0.14, p: [5, 3.4, 30], l: [0, 1.6, -22] },
  { at: 0.28, p: [2, 0.8, 15], l: [0, -3.5, -14] },
  { at: 0.42, p: [-1, -9, 3], l: [0, -15, -20] },
  { at: 0.57, p: [-7, -21, -15], l: [3, -27, -38] },
  { at: 0.72, p: [5, -31, -36], l: [-3, -20, -54] },
  { at: 0.87, p: [0, -13, -56], l: [0, 1, -76] },
  { at: 1.0, p: [0, 5.4, -70], l: [0, 7, -100] },
]

const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)

function sample(offset: number, pos: THREE.Vector3, look: THREE.Vector3) {
  const o = THREE.MathUtils.clamp(offset, 0, 1)
  let i = 0
  while (i < PATH.length - 2 && o > PATH[i + 1].at) i++
  const a = PATH[i]
  const b = PATH[i + 1]
  const t = smootherstep(THREE.MathUtils.clamp((o - a.at) / (b.at - a.at), 0, 1))
  pos.set(
    THREE.MathUtils.lerp(a.p[0], b.p[0], t),
    THREE.MathUtils.lerp(a.p[1], b.p[1], t),
    THREE.MathUtils.lerp(a.p[2], b.p[2], t)
  )
  look.set(
    THREE.MathUtils.lerp(a.l[0], b.l[0], t),
    THREE.MathUtils.lerp(a.l[1], b.l[1], t),
    THREE.MathUtils.lerp(a.l[2], b.l[2], t)
  )
}

export function Rig({
  sky,
  water,
}: {
  sky: RefObject<THREE.Object3D | null>
  water: THREE.Object3D
}) {
  const scroll = useScroll()
  const targetPos = useRef(new THREE.Vector3())
  const targetLook = useRef(new THREE.Vector3())
  const look = useRef(new THREE.Vector3(0, 4, -30))
  const background = useMemo(() => AIR_BG.clone(), [])
  const fog = useMemo(() => new THREE.FogExp2(AIR_FOG.getHex(), AIR_DENSITY), [])

  useFrame((state, delta) => {
    const d = Math.min(delta, 0.05)
    sample(scroll.offset, targetPos.current, targetLook.current)

    // a little parallax off the pointer, damped like everything else
    targetPos.current.x += state.pointer.x * 1.6
    targetPos.current.y += state.pointer.y * 0.9

    const k = 1 - Math.pow(0.0016, d)
    state.camera.position.lerp(targetPos.current, k)
    look.current.lerp(targetLook.current, k)
    state.camera.lookAt(look.current)

    // --- atmosphere follows depth ---------------------------------------
    const depth = THREE.MathUtils.clamp(-state.camera.position.y / 22, 0, 1)
    const eased = depth * depth * (3 - 2 * depth)

    fogTint.copy(AIR_FOG).lerp(DEEP_FOG, eased)
    fogDensity.value = THREE.MathUtils.lerp(AIR_DENSITY, DEEP_DENSITY, eased)
    fog.color.copy(fogTint)
    fog.density = fogDensity.value
    background.copy(AIR_BG).lerp(DEEP_BG, eased)

    if (state.scene.fog !== fog) state.scene.fog = fog
    if (state.scene.background !== background) state.scene.background = background

    // Above the waterline the sky and the reflective surface carry the frame;
    // below it they are invisible anyway, so skip the reflection pass.
    const above = state.camera.position.y > -0.6
    if (sky.current) sky.current.visible = above
    water.visible = above
  })

  return null
}
