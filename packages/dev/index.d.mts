/** `examples/<slug>/manifest.json` — how the page came to exist. */
export type Manifest = {
  title?: string
  /** The prompt it was built from, verbatim. */
  prompt?: string
  /** What that prompt turned into for this one page (a batch prompt built five). */
  brief?: string
  date?: string
  model?: string
  /** What the page is — `landing`, `game`. One per example; the filter groups by it. */
  kind?: string
  /** Techniques on screen — what the sidebar filter offers. */
  tags?: string[]
  /** pmndrs demos it borrows from. */
  demos?: string[]
}

export type Example = {
  /** Slug: the folder under `examples/`, and the URL it ships at. */
  name: string
  manifest?: Manifest
  /** Where `pnpm --filter <name> dev` serves it. */
  port: number
}

export declare const ROOT: string
export declare const EXAMPLES: string
export declare const DIST: string

export declare function generatePort(name: string, minPort?: number, maxPort?: number): number
export declare function listExamples(): Example[]
