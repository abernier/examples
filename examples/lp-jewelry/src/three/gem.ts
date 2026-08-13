import * as THREE from 'three'

/**
 * Procedural round-brilliant-ish gem geometry.
 *
 * The pmndrs `diamond-refraction` demo loads `dflat.glb`; we can't ship an
 * external model, so the cut is lathed here instead. The profile below is a
 * real brilliant's proportions (table 55%, crown 15%, pavilion 43% of girdle
 * diameter) revolved into facets, then de-indexed so every facet gets its own
 * flat normal — MeshRefractionMaterial ray-casts against those facets, and
 * smooth normals would turn the stone into a blob.
 */
function finalise(lathe: THREE.LatheGeometry): THREE.BufferGeometry {
  // flat facets, not a smooth solid of revolution
  const geometry = lathe.toNonIndexed()
  geometry.computeVertexNormals()
  geometry.center()

  // MeshRefractionMaterial builds a BVH over the geometry; give it a trivial
  // index so the split (flat-shaded) vertices survive intact.
  const count = geometry.getAttribute('position').count
  const index = new Uint32Array(count)
  for (let i = 0; i < count; i++) index[i] = i
  geometry.setIndex(new THREE.BufferAttribute(index, 1))

  geometry.computeBoundingSphere()
  geometry.computeBoundingBox()

  lathe.dispose()
  return geometry
}

export function createBrilliantGeometry(facets = 16): THREE.BufferGeometry {
  // profile points, (radius, height), from the table centre down to the culet
  const profile: [number, number][] = [
    [0.0, 0.42],
    [0.55, 0.42], // table
    [0.99, 0.1], // crown
    [1.0, 0.04], // girdle top
    [1.0, -0.02], // girdle bottom
    [0.62, -0.5], // pavilion break
    [0.0, -0.95], // culet
  ]

  const lathe = new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(r, y)),
    facets,
    0,
    Math.PI * 2,
  )

  return finalise(lathe)
}

/**
 * An emerald/step cut — flatter, longer, fewer but bigger facets. Used for the
 * satellite stones so the trio doesn't read as three copies of one object.
 */
export function createStepCutGeometry(): THREE.BufferGeometry {
  const profile: [number, number][] = [
    [0.0, 0.36],
    [0.62, 0.36],
    [0.86, 0.2],
    [1.0, 0.02],
    [1.0, -0.06],
    [0.8, -0.44],
    [0.34, -0.72],
    [0.0, -0.78],
  ]

  const lathe = new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(r, y)),
    8,
    0,
    Math.PI * 2,
  )

  return finalise(lathe)
}
