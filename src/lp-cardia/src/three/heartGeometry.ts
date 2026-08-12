import * as THREE from 'three'

/**
 * The ❤ silhouette as a bezier `Shape`, extruded.
 *
 * The bevel is deliberately much larger than the depth: that turns the
 * cookie-cutter slab an ExtrudeGeometry normally gives you into something
 * pillowy, with a rounded back the transmission material can actually refract
 * through. Curve segments are high because the cleft and the tip are where a
 * low-poly heart gives itself away.
 */
function heartShape() {
  const s = new THREE.Shape()
  s.moveTo(0.5, 0.5)
  s.bezierCurveTo(0.5, 0.5, 0.4, 0, 0, 0)
  s.bezierCurveTo(-0.6, 0, -0.6, 0.7, -0.6, 0.7)
  s.bezierCurveTo(-0.6, 1.1, -0.3, 1.54, 0.5, 1.9)
  s.bezierCurveTo(1.2, 1.54, 1.6, 1.1, 1.6, 0.7)
  s.bezierCurveTo(1.6, 0.7, 1.6, 0, 1.0, 0)
  s.bezierCurveTo(0.7, 0, 0.5, 0.5, 0.5, 0.5)
  return s
}

export function createHeartGeometry(detail: 'high' | 'low' = 'high') {
  const geometry = new THREE.ExtrudeGeometry(heartShape(), {
    depth: 0.55,
    bevelEnabled: true,
    bevelSegments: detail === 'high' ? 14 : 5,
    // The shape is only ~1.9 units tall, so the bevel has to stay well under
    // that: much past this it eats the tip and the heart ends up blunt.
    bevelSize: 0.24,
    bevelThickness: 0.3,
    curveSegments: detail === 'high' ? 44 : 14,
  })

  // The shape is drawn tip-up in shape space, and off-origin — flip it and
  // recentre so the mesh rotates about the middle of the heart, not its corner.
  geometry.rotateZ(Math.PI)
  geometry.center()
  geometry.scale(0.62, 0.62, 0.62)
  geometry.computeVertexNormals()

  return geometry
}
