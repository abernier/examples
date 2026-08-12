// Page-scroll state shared between the DOM and the fixed background canvas.
// The canvas is a fixed backdrop rather than a <ScrollControls> container, so
// the rig reads normal document scroll instead of drei's scroll offset.
export const pageScroll = { offset: 0, velocity: 0 }

export function trackPageScroll() {
  let last = 0
  const read = () => {
    const doc = document.documentElement
    const max = Math.max(1, doc.scrollHeight - window.innerHeight)
    const y = window.scrollY || doc.scrollTop || 0
    pageScroll.offset = Math.min(1, Math.max(0, y / max))
    pageScroll.velocity = y - last
    last = y
  }
  read()
  window.addEventListener('scroll', read, { passive: true })
  window.addEventListener('resize', read)
  return () => {
    window.removeEventListener('scroll', read)
    window.removeEventListener('resize', read)
  }
}
