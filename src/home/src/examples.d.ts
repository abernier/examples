// Provided by the `gallery` plugin in vite.config.ts — one entry per dist/<name>/.
declare module 'virtual:examples' {
  const examples: { name: string; shot: boolean }[]
  export default examples
}
