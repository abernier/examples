import * as THREE from "three";

/**
 * A procedural coffee bean: a sphere squashed into an ellipsoid, tapered at the
 * ends, with the characteristic crease ploughed down the middle of the flat face.
 * No external model, so it works offline / from file://.
 */
export function createBeanGeometry(quality: "high" | "low" = "high") {
  const widthSeg = quality === "high" ? 48 : 24;
  const heightSeg = quality === "high" ? 32 : 16;

  const geo = new THREE.SphereGeometry(1, widthSeg, heightSeg);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const { x, y, z } = v;

    // ellipsoid — long on X, shallow on Z
    v.set(x, y * 0.68, z * 0.56);

    // round the two ends off
    const taper = 1 - 0.2 * x * x;
    v.y *= taper;
    v.z *= taper;

    // the crease, a groove running down the +Z face
    const face = Math.max(0, z);
    const groove = Math.exp(-(y * y) / 0.03) * face;
    v.z -= groove * 0.36;

    // flatten that face a touch
    v.z -= face * face * 0.07;

    pos.setXYZ(i, v.x, v.y, v.z);
  }

  pos.needsUpdate = true;
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

/** Roast colours, green through to a very dark French roast. */
export const ROAST_STOPS = [
  "#93a06a", // unroasted
  "#c08a4e", // cinnamon
  "#8d5326", // city
  "#5a3319", // full city
  "#301c11", // french
];

export function roastColor(t: number, target = new THREE.Color()) {
  const clamped = Math.min(1, Math.max(0, t));
  const span = (ROAST_STOPS.length - 1) * clamped;
  const i = Math.min(ROAST_STOPS.length - 2, Math.floor(span));
  const a = new THREE.Color(ROAST_STOPS[i]);
  const b = new THREE.Color(ROAST_STOPS[i + 1]);
  return target.copy(a).lerp(b, span - i);
}
