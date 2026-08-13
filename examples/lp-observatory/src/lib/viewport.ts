/**
 * Tiny shared "input state" the WebGL scene reads every frame.
 *
 * The canvas is a fixed, pointer-events:none backdrop behind the document, so
 * the 3D scene cannot use r3f's own pointer/scroll plumbing — it reads these
 * mutable refs instead. Same trick as pmndrs' "tying-canvas-to-scroll-offset",
 * with window scroll standing in for the demo's scroll container.
 */

export const scroll = {
  /** 0 → 1 across the whole document */
  progress: 0,
  /** 0 → 1 across the first viewport height (the hero) */
  hero: 0,
}

export const pointer = {
  x: 0,
  y: 0,
}

export function initViewportTracking() {
  const onScroll = () => {
    const doc = document.documentElement
    const max = Math.max(1, doc.scrollHeight - window.innerHeight)
    const y = window.scrollY || doc.scrollTop || 0
    scroll.progress = Math.min(1, Math.max(0, y / max))
    scroll.hero = Math.min(1, Math.max(0, y / Math.max(1, window.innerHeight)))
  }

  const onPointerMove = (e: PointerEvent) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1
  }

  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  window.addEventListener('pointermove', onPointerMove, { passive: true })

  return () => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
    window.removeEventListener('pointermove', onPointerMove)
  }
}

/** Reveal-on-scroll for `[data-reveal]` elements. */
export function initReveal() {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.setAttribute('data-revealed', ''))
    return () => {}
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.setAttribute('data-revealed', '')
          io.unobserve(entry.target)
        }
      }
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
  )
  els.forEach((el) => io.observe(el))
  return () => io.disconnect()
}
