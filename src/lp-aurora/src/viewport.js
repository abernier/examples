// A tiny mutable store shared between the DOM landing page and the r3f scene.
// Kept outside of React state on purpose: it is written on every scroll /
// pointer event and read inside useFrame, so it must never trigger a re-render.

export const view = {
  /** 0 → 1 across the whole document */
  progress: 0,
  /** 0 → 1 across the first viewport (hero exit) */
  hero: 0,
  /** normalised pointer, -1 → 1 */
  px: 0,
  py: 0,
  /** true while the tab / canvas is visible */
  active: true,
}

export function bindViewport() {
  const onScroll = () => {
    const max = Math.max(1, document.body.scrollHeight - window.innerHeight)
    view.progress = Math.min(1, Math.max(0, window.scrollY / max))
    view.hero = Math.min(1, Math.max(0, window.scrollY / Math.max(1, window.innerHeight)))
  }

  const onPointer = (e) => {
    view.px = (e.clientX / window.innerWidth) * 2 - 1
    view.py = -((e.clientY / window.innerHeight) * 2 - 1)
  }

  const onVisibility = () => {
    view.active = document.visibilityState === 'visible'
  }

  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  window.addEventListener('pointermove', onPointer, { passive: true })
  document.addEventListener('visibilitychange', onVisibility)

  return () => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
    window.removeEventListener('pointermove', onPointer)
    document.removeEventListener('visibilitychange', onVisibility)
  }
}
