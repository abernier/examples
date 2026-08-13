import * as THREE from 'three'

/**
 * Hand-thrown silhouettes.
 *
 * Every vessel here is a real lathe: a 2D profile is drawn as a spline in the
 * XY plane and revolved around Y by THREE.LatheGeometry — the digital echo of a
 * potter's wheel. Control points are [radius, height] in metres.
 */
const PROFILES = {
  // Wide, shallow serving bowl — the "Ochre" pattern
  bowl: [
    [0.001, 0.0],
    [0.075, 0.0],
    [0.14, 0.008],
    [0.2, 0.035],
    [0.246, 0.09],
    [0.268, 0.155],
    [0.272, 0.175],
    [0.258, 0.176],
    [0.25, 0.152],
    [0.228, 0.096],
    [0.186, 0.05],
    [0.13, 0.026],
    [0.07, 0.019],
    [0.001, 0.018],
  ],
  // Tall shouldered amphora — the studio's signature form
  amphora: [
    [0.001, 0.0],
    [0.085, 0.0],
    [0.112, 0.012],
    [0.152, 0.075],
    [0.185, 0.19],
    [0.192, 0.3],
    [0.166, 0.398],
    [0.116, 0.46],
    [0.09, 0.5],
    [0.086, 0.552],
    [0.104, 0.588],
    [0.113, 0.604],
    [0.1, 0.606],
    [0.092, 0.588],
    [0.075, 0.552],
    [0.078, 0.5],
    [0.1, 0.452],
    [0.148, 0.392],
    [0.174, 0.3],
    [0.166, 0.19],
    [0.13, 0.078],
    [0.094, 0.02],
    [0.06, 0.014],
    [0.001, 0.013],
  ],
  // Straight-sided carafe with a flared lip — thrown for the glaze test bench
  carafe: [
    [0.001, 0.0],
    [0.068, 0.0],
    [0.086, 0.01],
    [0.106, 0.05],
    [0.116, 0.14],
    [0.112, 0.24],
    [0.094, 0.3],
    [0.088, 0.33],
    [0.108, 0.372],
    [0.126, 0.392],
    [0.113, 0.396],
    [0.096, 0.376],
    [0.077, 0.336],
    [0.077, 0.3],
    [0.094, 0.244],
    [0.098, 0.14],
    [0.09, 0.055],
    [0.07, 0.018],
    [0.048, 0.012],
    [0.001, 0.011],
  ],
  // Everyday beaker — instanced across the drying shelf
  cup: [
    [0.001, 0.0],
    [0.042, 0.0],
    [0.055, 0.008],
    [0.062, 0.045],
    [0.066, 0.1],
    [0.07, 0.132],
    [0.062, 0.133],
    [0.058, 0.1],
    [0.054, 0.045],
    [0.046, 0.012],
    [0.001, 0.011],
  ],
  // The counterpoint: a blown-glass beaker, all shoulder and no foot
  glass: [
    [0.001, 0.0],
    [0.052, 0.0],
    [0.07, 0.014],
    [0.084, 0.06],
    [0.092, 0.13],
    [0.086, 0.204],
    [0.078, 0.246],
    [0.075, 0.252],
    [0.066, 0.246],
    [0.072, 0.204],
    [0.078, 0.13],
    [0.07, 0.062],
    [0.056, 0.024],
    [0.038, 0.014],
    [0.001, 0.012],
  ],
}

const cache = new Map()

/**
 * Build (and memoize) a revolved vessel.
 *
 * @param {keyof typeof PROFILES} name
 * @param {object} [opts]
 * @param {number} [opts.segments] radial segments
 * @param {number} [opts.throwRings] amplitude of the spiral ridges a hand leaves
 *   on the wall of a pot as it rises off the wheel. 0 = machine-perfect.
 */
export function vesselGeometry(name, { segments = 128, throwRings = 0.0022 } = {}) {
  const key = `${name}|${segments}|${throwRings}`
  if (cache.has(key)) return cache.get(key)

  const control = PROFILES[name].map(([x, y]) => new THREE.Vector2(x, y))
  const curve = new THREE.SplineCurve(control)
  const points = curve.getPoints(140)

  for (const p of points) {
    if (p.x > 0.006) {
      // Throwing rings: a slow spiral up the wall, fading out at the foot.
      p.x += Math.sin(p.y * 108) * throwRings * Math.min(1, p.y * 12 + 0.15)
    }
    p.x = Math.max(p.x, 0.0008)
  }

  const geometry = new THREE.LatheGeometry(points, segments)
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  cache.set(key, geometry)
  return geometry
}

export const VESSEL_NAMES = Object.keys(PROFILES)
