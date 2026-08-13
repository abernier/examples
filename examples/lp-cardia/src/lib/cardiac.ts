/**
 * The one waveform the whole page runs on.
 *
 * Everything that moves — the heart's squeeze, the trace on screen, the glow in
 * the core, the rings leaving the chest, the BPM in the DOM — reads from these
 * two functions, so nothing can drift out of sync with anything else.
 *
 * Both take a *phase*: where we are inside one cardiac cycle, 0..1.
 */

export const BPM = 72
/** Seconds per cycle at the resting rate. */
export const PERIOD = 60 / BPM

/** Phase of the cycle at time `t` (seconds), 0..1. */
export function phaseAt(t: number) {
  const p = (t / PERIOD) % 1
  return p < 0 ? p + 1 : p
}

const gaussian = (x: number, mu: number, sigma: number) =>
  Math.exp(-((x - mu) ** 2) / (2 * sigma * sigma))

/**
 * Lead-II PQRST morphology, roughly to scale: the R spike is 1, the P and T
 * waves are the small bumps either side of it. Summed gaussians rather than a
 * sampled table so it stays smooth at any sample rate the trace asks for.
 */
export function ecg(phase: number) {
  return (
    0.13 * gaussian(phase, 0.17, 0.028) - // P — atrial depolarisation
    0.08 * gaussian(phase, 0.292, 0.009) + // Q
    1.0 * gaussian(phase, 0.322, 0.0105) - // R — the spike
    0.24 * gaussian(phase, 0.357, 0.013) + // S
    0.27 * gaussian(phase, 0.58, 0.055) // T — ventricular repolarisation
  )
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/**
 * Ventricular contraction, 0 (filled, relaxed) .. 1 (squeezed, ejecting).
 *
 * It deliberately *lags* the R spike — the muscle moves after the electrical
 * signal, which is why the heart looks alive rather than looks like a
 * loudspeaker cone wired to the trace.
 */
export function contraction(phase: number) {
  const squeeze = smoothstep(0.3, 0.42, phase)
  const release = 1 - smoothstep(0.46, 0.82, phase)
  return squeeze * release
}

/** The small atrial kick just before the main beat. */
export function atrialKick(phase: number) {
  return 0.22 * gaussian(phase, 0.19, 0.035)
}
