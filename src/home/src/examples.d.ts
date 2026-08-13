// Provided by the `gallery` plugin in vite.config.ts — one entry per dist/<name>/.
declare module 'virtual:examples' {
  /** dist/<name>/manifest.json — how the page came to exist. */
  type Manifest = {
    title?: string
    /** The prompt it was built from, verbatim. */
    prompt?: string
    /** What that prompt turned into for this one page (a batch prompt built five). */
    brief?: string
    date?: string
    model?: string
    /** What the page is — `landing`. One per example; the filter groups by it. */
    kind?: string
    /** Techniques on screen — what the sidebar filter offers. */
    tags?: string[]
    /** pmndrs demos it borrows from. */
    demos?: string[]
  }
  const examples: { name: string; shot: boolean; manifest?: Manifest }[]
  export default examples
}
