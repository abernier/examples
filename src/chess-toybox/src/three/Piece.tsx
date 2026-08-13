import { forwardRef, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { easing } from 'maath'
import type { Color, PieceSymbol } from 'chess.js'

import { pointer, squarePosition, type Toy } from '../game'

// Two Pixar films across a board from each other, cast by what each piece does.
//
//                white — the toy box            black — the kitchen
//   king      Woody       the one you play for   Linguini    the commis
//   queen     Bo Peep     goes anywhere          Colette     the chef
//   bishop    Buzz        the diagonal is        Anton Ego   the critic, who
//                         the closest thing                  only ever comes at
//                         to flying                          you sideways
//   knight    Buttercup   a cavalier, literally  Émile       Rémy's brother
//   rook      Trixie      the tower on legs      Mabel       and her shotgun
//   pawn      army man    ×8, patient            Rémy        ×8, the colony
//
// Every one of them is CC-BY off Sketchfab — see the README for who made which.
const CAST: Record<Color, Record<PieceSymbol, string>> = {
  w: {
    k: 'woody_dmk.glb',
    q: 'bopeep.glb',
    b: 'buzz.glb',
    n: 'buttercup.glb',
    r: 'trixie.glb',
    p: 'armyman.glb',
  },
  b: {
    k: 'linguini.glb',
    q: 'colette.glb',
    b: 'ego.glb',
    n: 'emile.glb',
    r: 'mabel.glb',
    p: 'remy.glb',
  },
}

/** How tall each piece stands, in squares. A square is 1 unit. */
const HEIGHT: Record<PieceSymbol, number> = {
  k: 1.5,
  q: 1.4,
  b: 1.4,
  n: 0.95,
  r: 0.85,
  p: 0.7,
}

// The base under every piece, and the only thing that says which side it is on
// now that the two armies are two different films. Plastic tan for the toy box,
// copper for the kitchen.
const SIDES: Record<Color, { base: string; men: string }> = {
  w: { base: '#c8a464', men: '#4e7c3f' },
  b: { base: '#b4562f', men: '#b4562f' },
}

const asset = (file: string) => `${import.meta.env.BASE_URL}models/${file}`
Object.values(CAST).forEach((side) =>
  Object.values(side).forEach((file) => useGLTF.preload(asset(file)))
)

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
const prepared = new Map<string, THREE.Object3D>()
const tinted = new Map<string, THREE.Object3D>()

/**
 * Drop the arms. Most of these are ripped in a T-pose — the pose you model in,
 * not one anyone stands in — and a T-posed toy is wider than it is tall, so a
 * rank of them is a row of scarecrows holding hands.
 *
 * All of it comes off the skeleton's own names, which is what makes it thirty
 * lines instead of a table of magic numbers. Two conventions turn up in this
 * cast — 3ds Max Biped (`Bip001_L_UpperArm`) for the ones ripped off a Max
 * pipeline, and a lowercase one (`bip_upperArm_L`) for Buzz, who also has wings
 * that stick out further than his arms do.
 *
 * Nothing here assumes which way a model was exported: down is wherever that
 * model's own spine says it is, measured pelvis to neck in whatever space its
 * bones happen to live in. A rig turned around comes out like one that isn't.
 *
 * Each limb keeps a little of the way it already points, which is why this can
 * run over the whole cast rather than only the T-posed half: an arm already at
 * its side barely moves, one held straight out drops.
 */
const RIGS = [
  { pelvis: 'bip001_pelvis', neck: 'bip001_neck', spine: 'bip001_spine1' },
  { pelvis: 'bip_pelvis', neck: 'bip_neck', spine: 'bip_spine_1' },
]

const LIMBS = [
  { from: (s: string) => `bip001_${s}_upperarm`, to: (s: string) => `bip001_${s}_forearm`, keep: 0.32 },
  { from: (s: string) => `bip_upperarm_${s}`, to: (s: string) => `bip_lowerarm_${s}`, keep: 0.32 },
  // Folded back along his shell rather than out to the sides.
  { from: (s: string) => `${s}_wing1`, to: (s: string) => `${s}_wing2`, keep: 0.05 },
]

/**
 * Where the bulk of a mesh is, on the floor plan — the median x and z of its
 * vertices, in the space it is drawn in. `getVertexPosition` is what makes it
 * work on these: it puts a skinned vertex through its bones, so this reads the
 * pose the toy is actually standing in and not the T it was modelled in.
 */
function median(mesh: THREE.Mesh) {
  const position = mesh.geometry.attributes.position
  const vertex = new THREE.Vector3()
  const xs = new Float64Array(position.count)
  const zs = new Float64Array(position.count)
  for (let i = 0; i < position.count; i++) {
    mesh.getVertexPosition(i, vertex).applyMatrix4(mesh.matrixWorld)
    xs[i] = vertex.x
    zs[i] = vertex.z
  }
  xs.sort()
  zs.sort()
  const half = position.count >> 1
  return new THREE.Vector2(xs[half], zs[half])
}

function poseArmsDown(root: THREE.Object3D) {
  const named = new Map<string, THREE.Object3D>()
  root.traverse((node) => {
    // The exporter numbers every joint, and three turns the spaces in a name
    // into underscores on the way in; the name underneath is what carries the
    // meaning.
    named.set(node.name.replace(/_\d+$/, '').replace(/\s/g, '_').toLowerCase(), node)
  })

  const at = (node?: THREE.Object3D) => node?.getWorldPosition(new THREE.Vector3())
  const rig = RIGS.find((r) => named.has(r.pelvis) && (named.has(r.neck) || named.has(r.spine)))
  if (!rig) return
  const pelvis = at(named.get(rig.pelvis))!
  const neck = at(named.get(rig.neck) ?? named.get(rig.spine))!
  const up = neck.clone().sub(pelvis).normalize()

  for (const limb of LIMBS) {
    for (const side of ['l', 'r']) {
      const shoulder = named.get(limb.from(side))
      const elbow = named.get(limb.to(side))
      if (!shoulder || !elbow) continue

      const from = at(elbow)!.sub(at(shoulder)!).normalize()
      // Down, keeping a little of the way the limb already points — arms flat
      // against the sides read as a soldier at attention, which none of these
      // are.
      const to = from.clone().multiplyScalar(limb.keep).addScaledVector(up, -1).normalize()

      // The turn is in the skeleton's space; a bone stores its rotation in its
      // parent's, so it has to be carried across.
      const parent = shoulder.parent!.getWorldQuaternion(new THREE.Quaternion())
      shoulder.quaternion.premultiply(
        parent
          .clone()
          .invert()
          .multiply(new THREE.Quaternion().setFromUnitVectors(from, to))
          .multiply(parent)
      )
      root.updateMatrixWorld(true)
    }
  }
}

function useToy(type: PieceSymbol, color: Color) {
  const { scene } = useGLTF(asset(CAST[color][type]))

  // Posed and measured once per *model*, not once per side. Both are one-way
  // trips — the arms turn from wherever they are, so a model that goes through
  // here twice comes out with its arms rotated twice, which is exactly what the
  // white army looked like when this was keyed by side as well.
  const key = `${color}${type}`
  const stood = useMemo(() => {
    const cached = prepared.get(key)
    if (cached) return cached

    const root = clone(scene)
    root.updateMatrixWorld(true)

    const meshes: THREE.Mesh[] = []
    root.traverse((object) => {
      if ((object as THREE.Mesh).isMesh) meshes.push(object as THREE.Mesh)
    })

    poseArmsDown(root)
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

    // Feet on the plinth, and the *body* over the middle of it — which is not
    // the middle of the bounding box. Bo Peep carries a crook and Rémy drags a
    // tail: a few dozen vertices, sticking a long way out to one side, and they
    // shove the box's centre far enough that the piece visibly sits off its
    // square. The median vertex doesn't care — half the toy is on either side of
    // it however long the tail is — so that is what gets centred, and the tail
    // trails off the square the way a tail should.
    const middle = median(body)
    const group = new THREE.Group()
    group.add(root)
    root.scale.setScalar(scale)
    root.position.set(
      -middle.x * scale,
      -bounds.min.y * scale,
      -middle.y * scale
    )
    prepared.set(key, group)
    return group
  }, [scene, key, type])

  // The two armies out of one model. The characters keep their own colours and
  // the dark side gets plastic that spent longer in the box; the soldier is
  // repainted outright, because a moulded army man is one colour from his helmet
  // to his base and that is the whole of why you can tell the two armies apart.
  // Per side rather than per piece, so eight toys share one material.
  const template = useMemo(() => {
    const cached = tinted.get(key)
    if (cached) return cached

    const army = clone(stood)
    // The one repaint left: an army man is moulded in a single colour from his
    // helmet to his boots, and the model arrives grey.
    if (type === 'p' && color === 'w')
      army.traverse((object) => {
        const mesh = object as THREE.Mesh
        if (!mesh.isMesh) return
        const material = (mesh.material as THREE.MeshStandardMaterial).clone()
        material.color.set(SIDES[color].men)
        material.roughness = 0.55
        material.map = null
        mesh.material = material
      })
    tinted.set(key, army)
    return army
  }, [stood, key, type, color])

  // Cloned again per piece: eight of them share one template, and each still
  // needs its own skeleton.
  return useMemo(() => clone(template), [template])
}

function Modelled({ type, color }: { type: PieceSymbol; color: Color }) {
  return <primitive object={useToy(type, color)} />
}

/** The moulded base every toy soldier comes on, in its army's colour. */
const PLINTH = 0.09

const Plinth = forwardRef<THREE.MeshStandardMaterial, { color: Color }>(function Plinth(
  { color },
  glow
) {
  return (
    <mesh castShadow receiveShadow position={[0, PLINTH / 2, 0]}>
      <cylinderGeometry args={[0.4, 0.43, PLINTH, 30]} />
      {/* Under the pointer the base lights up rather than the toy: it is the one
          part every piece has, the same shape and the same size, so the
          highlight reads identically under a dinosaur and under a pawn. The
          material is handed up rather than driven by a prop — see `Piece`. */}
      <meshStandardMaterial
        ref={glow}
        color={SIDES[color].base}
        roughness={0.5}
        emissive="#ffe14d"
        emissiveIntensity={0}
      />
    </mesh>
  )
})

// Where a toy goes once it's out: sat on the floor beside the board, on its own
// side of it, so who is winning is readable off the carpet.
function takenPosition(toy: Toy): [number, number, number] {
  const i = toy.takenAt ?? 0
  const row = Math.floor(i / 8)
  return [(toy.color === 'w' ? -1 : 1) * (5.6 + row * 0.9), 0.24, -2.7 + (i % 8) * 0.8]
}

const target = new THREE.Vector3()
const rotation = new THREE.Euler()

export function Piece({ toy, selected }: { toy: Toy; selected: boolean }) {
  const ref = useRef<THREE.Group>(null!)
  const taken = toy.takenAt !== null
  const [x0, z0] = squarePosition(toy.square)
  // Nothing here listens for the pointer. The board knows which square it is
  // over — one ray against one plane — and a piece only has to ask whether that
  // square is its own, in the frame loop, where asking is free. No hover state,
  // no handler, no render.
  const glow = useRef<THREE.MeshStandardMaterial>(null!)

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

      // The knight is the one piece that goes *over* things, so she is the one
      // that leaves the board: a hop that grows with how far she still has to
      // go, so it swells on the way out and settles on the way in. Measured flat
      // on purpose — fold her own height into the distance and the lift feeds
      // itself, leaving her hovering a finger above her square for good.
      const hop = toy.type === 'n' ? Math.min(travel * 0.5, 1) * 0.55 : 0
      // Everyone else is pushed, and leans into the shove the way anything with
      // a wide base does when you slide it. Same measure, same easing: no
      // keyframes anywhere in here.
      const lean = hop ? 0 : Math.min(travel * 0.5, 1) * 0.3

      target.set(x, 0.3 + hop, z)
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
    const lit = !taken && pointer.square === toy.square
    easing.damp3(ref.current.scale, selected ? 1.12 : lit ? 1.06 : 1, 0.18, delta)
    easing.damp(glow.current, 'emissiveIntensity', selected ? 0.7 : lit ? 0.4 : 0, 0.12, delta)
  })

  return (
    // Set out on the board, not dropped onto it from the ceiling: the game
    // starts with the toys already where they belong.
    <group ref={ref} position={[x0, 0.3, z0]}>
      <Plinth ref={glow} color={toy.color} />
      <group position={[0, PLINTH, 0]} rotation={[0, toy.color === 'w' ? Math.PI : 0, 0]}>
        <Modelled type={toy.type} color={toy.color} />
      </group>
    </group>
  )
}
