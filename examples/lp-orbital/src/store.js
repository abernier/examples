// A tiny mutable store shared between the DOM page and the WebGL scene.
// The canvas is `pointer-events: none` (the real page scrolls above it), so
// scroll offset and pointer position are captured on `window` and read inside
// useFrame — no React state, no re-renders, no jank.
export const view = {
  /** normalized document scroll, 0 → 1 */
  scroll: 0,
  /** normalized pointer, -1 → 1 on both axes */
  px: 0,
  py: 0,
}

export function bindViewListeners() {
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    view.scroll = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
  }
  const onPointer = (e) => {
    view.px = (e.clientX / window.innerWidth) * 2 - 1
    view.py = -((e.clientY / window.innerHeight) * 2 - 1)
  }
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  window.addEventListener('pointermove', onPointer, { passive: true })
  return () => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
    window.removeEventListener('pointermove', onPointer)
  }
}
