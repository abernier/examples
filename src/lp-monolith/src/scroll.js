/**
 * A single shared scroll signal.
 *
 * The page scrolls natively (so the DOM copy stays fully responsive and never
 * gets clipped) and the 3D camera rig reads `scroll.progress` inside useFrame.
 * Same idea as drei's <ScrollControls> offset, without owning the scroll
 * container.
 */
export const scroll = { progress: 0, y: 0, max: 1 }

function measure() {
  const max = document.documentElement.scrollHeight - window.innerHeight
  scroll.max = max
  scroll.y = window.scrollY
  scroll.progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
}

if (typeof window !== 'undefined') {
  measure()
  window.addEventListener('scroll', measure, { passive: true })
  window.addEventListener('resize', measure)
  // layout settles after fonts / images
  window.setTimeout(measure, 250)
}

export function subscribeScroll(fn) {
  let raf = 0
  const tick = () => {
    raf = 0
    fn(scroll)
  }
  const onScroll = () => {
    measure()
    if (!raf) raf = window.requestAnimationFrame(tick)
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  onScroll()
  return () => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
    if (raf) window.cancelAnimationFrame(raf)
  }
}
