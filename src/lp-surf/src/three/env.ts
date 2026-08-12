import * as THREE from 'three'

/** Low golden sun sitting out on the Atlantic horizon. */
export const SUN = new THREE.Vector3(-190, 30, -430)
export const SUN_DIR = SUN.clone().normalize()

/** Haze just above the waterline — cool, blends the ocean into the sky. */
export const AIR_FOG = new THREE.Color('#7ba4b6')
/** Deep water — everything past ~40m dissolves into this. */
export const DEEP_FOG = new THREE.Color('#042430')

export const AIR_BG = new THREE.Color('#8fb9c9')
export const DEEP_BG = new THREE.Color('#03191f')

export const AIR_DENSITY = 0.0021
export const DEEP_DENSITY = 0.028

/**
 * Live scene tint, mutated once per frame by the camera rig and shared *by
 * reference* with every custom shader uniform, so the hand-written materials
 * fog out in step with the built-in three.js fog.
 */
export const fogTint = DEEP_FOG.clone()
export const fogDensity = { value: DEEP_DENSITY }
