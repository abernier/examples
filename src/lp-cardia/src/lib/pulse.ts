/**
 * The bridge between the canvas and the DOM.
 *
 * The scene writes the live cardiac phase here inside useFrame; the readout in
 * the overlay reads it from its own rAF loop. Sharing the value rather than
 * letting each side run its own clock is what keeps the flashing dot on the
 * same beat as the spike in the trace — the two clocks otherwise start a few
 * hundred milliseconds apart, which is a quarter of a cycle and very visible.
 */
export const pulse = { phase: 0, contraction: 0 }
