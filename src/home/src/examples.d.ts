// Provided by the `gallery` plugin in vite.config.ts — one entry per
// src/<name>/manifest.json, plus whether the deploy has a thumbnail for it.
declare module 'virtual:examples' {
  import type { Example } from '@examples/dev'

  const examples: (Example & { shot: boolean })[]
  export default examples
}
