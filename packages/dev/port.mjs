import { createHash } from 'node:crypto'

/**
 * The dev-server port of an example, derived from its slug.
 *
 * Two sides need to agree on it without talking to each other: the example's
 * own `vite.config` binds it, and the gallery (`src/home/`) points its iframe
 * at it — before the example is even running, so it can tell you to start it.
 * Hashing the slug is what makes that possible; nothing has to be registered
 * anywhere, and `pnpm --filter <slug> dev` always lands on the same URL.
 *
 * The range starts above 5173 so the gallery, which takes vite's default, is
 * never the one an example collides with.
 *
 * @param {string} name slug of the example — its folder under `src/`
 * @param {number} [minPort]
 * @param {number} [maxPort]
 * @returns {number}
 */
export function generatePort(name, minPort = 5174, maxPort = 6000) {
  const digest = createHash('sha256').update(name).digest('hex')
  const range = BigInt(maxPort - minPort + 1)
  return minPort + Number(BigInt(`0x${digest}`) % range)
}
