/**
 * drei's ScrollControls owns its own scroll container inside the canvas
 * wrapper, so the fixed nav — which lives outside the <Canvas> — needs a way
 * to reach it. One module-level handle, registered from inside the rig.
 */
let el: HTMLElement | null = null

export function setScrollEl(next: HTMLElement | null) {
  el = next
}

export function jumpToPage(page: number) {
  if (!el) return
  el.scrollTo({ top: page * el.clientHeight, behavior: 'smooth' })
}
