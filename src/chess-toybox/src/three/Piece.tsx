import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, type ThreeElements } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { easing } from 'maath'
import type { Color, PieceSymbol } from 'chess.js'

import { squarePosition, type Toy } from '../game'

// The cast, and the joke it rests on: a knight is a horse, so the knight is
// Buttercup; a rook is a tower, so the rook is the tallest dinosaur in the box.
//
//   king    Woody      · the one everybody is playing for
//   queen   Jessie     · goes anywhere, and gets there first
//   bishop  Buzz       · the diagonal is the closest thing to flying
//   knight  Buttercup  · a cavalier, literally
//   rook    Trixie     · the tower on four legs
//   pawn    army man   · small, patient, and there are eight of him
//
// All five are CC-BY rips (see the README). Three carry a skeleton, which is what
// lets their arms come down out of the T-pose they were modelled in; Woody is the
// one that doesn't, because the rigged Woody's arms are welded to a broken bind
// matrix and come out as two long spikes.
const MODELS = {
  k: 'woody.glb',
  q: 'jessie_rig.glb',
  b: 'buzz_rig.glb',
  n: 'buttercup.glb',
  r: 'trixie.glb',
  p: 'armyman.glb',
} as const

// Whose front is where: a toy at yaw 0 looks down +z, towards the white side.
// Empty so far — the five files happen to agree — but a sixth won't.
const FACING: Partial<Record<PieceSymbol, number>> = {}

/** How tall each toy stands, in squares. A square is 1 unit. */
const HEIGHT: Record<PieceSymbol, number> = {
  k: 1.5,
  q: 1.4,
  b: 1.4,
  n: 0.95,
  r: 0.8,
  p: 0.68,
}

// Two armies of moulded plastic, which is the oldest way a toy box has of
// telling two sides apart: the green ones against the tan ones. The base under
// every toy is that colour, so the side is readable even where the toys aren't.
const SIDES: Record<Color, { base: string; men: string }> = {
  w: { base: '#c8a464', men: '#c2a173' },
  b: { base: '#3f6b34', men: '#41692f' },
}

const asset = (file: string) => `${import.meta.env.BASE_URL}models/${file}`
Object.values(MODELS).forEach((file) => useGLTF.preload(asset(file)))

/**
 * One toy, cloned out of its file, measured, and stood upright on the board.
 *
 * Measured rather than scaled by hand because the five files agree on nothing:
 * Buttercup arrives 0.37 units tall and Woody 30, and a table of magic numbers
 * would have to be redone the day one of them is swapped. Two things make the
 * measurement worth its own function:
 *
 * - the rips carry a stray part — 88 vertices of Jessie's, welded to a bone with
 *   a broken bind matrix — that sits 90 units under the floor. Left in, it drags
 *   the bounding box down and every toy shrinks to a speck. So the *body* is the
 *   mesh with the most vertices, and anything landing nowhere near it is hidden.
 * - the dark side is the same file in another colour, so its materials are
 *   cloned once per file here, not once per piece.
 */
const prepared = new Map<PieceSymbol, THREE.Object3D>()
const tinted = new Map<string, THREE.Object3D>()

/**
 * Drop the arms. The three humanoids are ripped in a T-pose — the pose you model
 * in, not one anyone stands in — and a T-posed toy is wider than it is tall, so
 * a rank of them is a row of scarecrows holding hands.
 *
 * The joints are named by hash, so there is no `mixamorig:LeftArm` to reach for.
 * But the three files come out of the same game and share a skeleton, hashes
 * included: `-872517566` and `2074315361` are the left and right upper arm in
 * all three, whatever suffix the exporter added. Two named bones and a fixed
 * turn beats anything cleverer here: inferring the shoulder from the geometry of
 * the pose, and the direction from what shrinks the toy, was tried first and it
 * folded Woody's arms into a cross.
 */
const SHOULDERS: [string, string] = ['-872517566', '2074315361']

const POSE: Partial<
  Record<PieceSymbol, { joints: [string, string]; angle: number; axis?: 'x' | 'y' | 'z' }[]>
> = {
  // Arms at their sides.
  q: [{ joints: SHOULDERS, angle: 1.15 }],
  b: [
    { joints: SHOULDERS, angle: 1.15 },
    // Buzz keeps his wings, folded back the way they ride when he isn't
    // falling with style.
    { joints: ['352968833', '110364936'], angle: 1.2 },
  ],
}

function poseArmsDown(root: THREE.Object3D, type: PieceSymbol) {
  root.traverse((bone) => {
    for (const { joints, angle, axis = 'z' } of POSE[type] ?? []) {
      const side = joints.findIndex((hash) => bone.name.startsWith(`${hash}_`))
      if (side < 0) continue
      // Mirrored between the two sides — the rig is symmetric, so one angle
      // does both.
      const turn = side === 0 ? angle : -angle
      if (axis === 'x') bone.rotateX(turn)
      else if (axis === 'y') bone.rotateY(turn)
      else bone.rotateZ(turn)
    }
  })
}

function useToy(type: keyof typeof MODELS, color: Color) {
  const { scene } = useGLTF(asset(MODELS[type]))

  // Posed and measured once per *model*, not once per side. Both are one-way
  // trips — the arms turn from wherever they are, so a model that goes through
  // here twice comes out with its arms rotated twice, which is exactly what the
  // white army looked like when this was keyed by side as well.
  const stood = useMemo(() => {
    const cached = prepared.get(type)
    if (cached) return cached

    const root = clone(scene)
    root.updateMatrixWorld(true)

    const meshes: THREE.Mesh[] = []
    root.traverse((object) => {
      if ((object as THREE.Mesh).isMesh) meshes.push(object as THREE.Mesh)
    })

    poseArmsDown(root, type)
    root.updateMatrixWorld(true)

    // `precise` walks the vertices instead of trusting the geometry's bounding
    // box — which for a skinned mesh is the box of the *bind* pose, and the two
    // lines above are what make the bind pose a lie.
    const box = (mesh: THREE.Mesh) => new THREE.Box3().setFromObject(mesh, true)
    const body = meshes.reduce((biggest, mesh) =>
      mesh.geometry.attributes.position.count > biggest.geometry.attributes.position.count
        ? mesh
        : biggest
    )

    // Generous on purpose. A toy can be built out of fifteen little meshes — a
    // collar, two boots, four for the eyes — and every one of them belongs, so
    // the test has to let anything within a couple of body-lengths through. What
    // it is there to catch is Jessie's stray part, which is *forty-five* body
    // lengths under the floor.
    const near = box(body).expandByVector(
      box(body).getSize(new THREE.Vector3()).multiplyScalar(2)
    )

    const bounds = new THREE.Box3()
    for (const mesh of meshes) {
      const own = box(mesh)
      if (mesh !== body && !near.containsPoint(own.getCenter(new THREE.Vector3()))) {
        mesh.visible = false
        continue
      }
      mesh.castShadow = mesh.receiveShadow = true
      // Out of the raycaster's way. R3F casts a ray on every pointer move, and
      // `SkinnedMesh.raycast` walks every triangle through its bones in JS to do
      // it — twenty of these is milliseconds a frame, spent to find out which
      // square the pointer is over. The `Hitbox` below answers that in one
      // ray/box test instead.
      mesh.raycast = () => null
      bounds.union(own)
    }

    const size = bounds.getSize(new THREE.Vector3())
    // Height first — but a dinosaur is longer than she is tall and Buzz still
    // has his wings, and a toy two squares wide reads as a mess from above.
    // Whichever of the two rules is tighter wins.
    const scale = Math.min(HEIGHT[type] / size.y, 1.5 / Math.max(size.x, size.z))

    // Feet on the plinth, centred over it.
    const group = new THREE.Group()
    group.add(root)
    root.scale.setScalar(scale)
    root.position.set(
      -((bounds.min.x + bounds.max.x) / 2) * scale,
      -bounds.min.y * scale,
      -((bounds.min.z + bounds.max.z) / 2) * scale
    )
    group.rotation.y = FACING[type] ?? 0
    prepared.set(type, group)
    return group
  }, [scene, type])

  // The two armies out of one model. The characters keep their own colours and
  // the dark side gets plastic that spent longer in the box; the soldier is
  // repainted outright, because a moulded army man is one colour from his helmet
  // to his base and that is the whole of why you can tell the two armies apart.
  // Per side rather than per piece, so eight toys share one material.
  const template = useMemo(() => {
    const key = `${type}:${color}`
    const cached = tinted.get(key)
    if (cached) return cached

    const army = clone(stood)
    if (type === 'p' || color === 'b')
      army.traverse((object) => {
        const mesh = object as THREE.Mesh
        if (!mesh.isMesh) return
        const material = (mesh.material as THREE.MeshStandardMaterial).clone()
        if (type === 'p') {
          material.color.set(SIDES[color].men)
          material.roughness = 0.55
          material.map = null
        } else {
          material.color.multiply(new THREE.Color('#8fae7e'))
        }
        mesh.material = material
      })
    tinted.set(key, army)
    return army
  }, [stood, type, color])

  // Cloned again per piece: sixteen of them share one template, and each still
  // needs its own skeleton to be posed on its own.
  return useMemo(() => clone(template), [template])
}

function Modelled({ type, color }: { type: keyof typeof MODELS; color: Color }) {
  return <primitive object={useToy(type, color)} />
}

/** The moulded base every toy soldier comes on, in its army's colour. */
const PLINTH = 0.09

function Plinth({ color }: { color: Color }) {
  return (
    <mesh castShadow receiveShadow position={[0, PLINTH / 2, 0]}>
      <cylinderGeometry args={[0.4, 0.43, PLINTH, 30]} />
      <meshStandardMaterial color={SIDES[color].base} roughness={0.5} />
    </mesh>
  )
}

/**
 * What the pointer actually hits: a box the size of the square, invisible but
 * still solid to the raycaster — `material.visible`, not `object.visible`, since
 * the second one would take it out of the raycast as well.
 */
function Hitbox(props: ThreeElements['mesh']) {
  return (
    <mesh position={[0, 0.7, 0]} {...props}>
      <boxGeometry args={[0.92, 1.4, 0.92]} />
      <meshBasicMaterial visible={false} />
    </mesh>
  )
}

// Where a toy goes once it's out: sat on the floor beside the board, on its own
// side of it, so who is winning is readable off the carpet.
function takenPosition(toy: Toy): [number, number, number] {
  const i = toy.takenAt ?? 0
  const row = Math.floor(i / 8)
  return [(toy.color === 'w' ? -1 : 1) * (5.6 + row * 0.9), 0.24, -2.7 + (i % 8) * 0.8]
}

const target = new THREE.Vector3()
const rotation = new THREE.Euler()

export function Piece({
  toy,
  selected,
  onSelect,
  onHover,
}: {
  toy: Toy
  selected: boolean
  onSelect: () => void
  onHover: (over: boolean) => void
}) {
  const ref = useRef<THREE.Group>(null!)
  const taken = toy.takenAt !== null
  const [x0, z0] = squarePosition(toy.square)

  useFrame((_, delta) => {
    if (taken) {
      target.set(...takenPosition(toy))
      // Knocked over, not set down.
      rotation.set(-Math.PI / 2, 0, ((toy.takenAt ?? 0) % 5) * 0.7)
    } else {
      const [x, z] = squarePosition(toy.square)
      // Nobody picks a toy up to move it. It gets *pushed*: it stays on the
      // board the whole way and leans into the shove, the way anything with a
      // wide base does when you slide it. The lean comes out of the distance
      // still to go, so it builds as the toy sets off, holds while it crosses,
      // and rights itself as it arrives — no keyframes, and the same easing that
      // carries it across does all of it.
      const dx = x - ref.current.position.x
      const dz = z - ref.current.position.z
      const travel = Math.hypot(dx, dz)
      const lean = Math.min(travel * 0.5, 1) * 0.3
      target.set(x, 0.3, z)
      // No yaw here: which way a toy faces is its own business, and it lives on
      // the group inside this one. Mixing the two on one Euler would put the
      // tilt half in world space and half in the toy's, and the black side would
      // lean the wrong way.
      rotation.set((dz / (travel || 1)) * lean, 0, (-dx / (travel || 1)) * lean)
      // A toy in hand is a toy tipped up on the near edge of its base.
      if (selected) rotation.x -= 0.12
    }
    easing.damp3(ref.current.position, target, taken ? 0.35 : 0.2, delta)
    easing.dampE(ref.current.rotation, rotation, 0.28, delta)
    easing.damp3(ref.current.scale, selected ? 1.1 : 1, 0.18, delta)
  })

  return (
    <group ref={ref} position={[x0, 5, z0]}>
      {!taken && (
        <Hitbox
          onClick={(event) => (event.stopPropagation(), onSelect())}
          onPointerOver={(event) => (event.stopPropagation(), onHover(true))}
          onPointerOut={() => onHover(false)}
        />
      )}
      <Plinth color={toy.color} />
      <group position={[0, PLINTH, 0]} rotation={[0, toy.color === 'w' ? Math.PI : 0, 0]}>
        <Modelled type={toy.type} color={toy.color} />
      </group>
    </group>
  )
}
