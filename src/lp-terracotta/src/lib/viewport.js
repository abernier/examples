/**
 * A tiny, allocation-free bridge between the DOM (native page scroll, pointer)
 * and the r3f render loop. Mutated by listeners, read inside useFrame — never
 * stored in React state, so scrolling never re-renders the page.
 */
export const viewport = {
  /** 0 → 1 across the whole document */
  progress: 0,
  /** -1 → 1 normalized pointer */
  pointer: { x: 0, y: 0 },
  /** true once the user has moved past the hero */
  scrolled: false,
}

let raf = 0

function measure() {
  raf = 0
  const doc = document.documentElement
  const max = doc.scrollHeight - window.innerHeight
  viewport.progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
  viewport.scrolled = window.scrollY > window.innerHeight * 0.35
}

function onScroll() {
  if (!raf) raf = requestAnimationFrame(measure)
}

function onPointerMove(e) {
  viewport.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
  viewport.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
}

export function bindViewport() {
  measure()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  return () => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
    window.removeEventListener('pointermove', onPointerMove)
    if (raf) cancelAnimationFrame(raf)
    raf = 0
  }
}
