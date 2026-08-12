import { useEffect, useRef } from 'react'

/**
 * Page scroll expressed in viewport heights (0 = hero, 1 = one screen down…).
 * Kept in a ref so scrolling never re-renders the React tree — the canvas reads
 * it inside useFrame instead.
 */
export function useScrollOffset() {
  const offset = useRef(0)

  useEffect(() => {
    const read = () => {
      offset.current = window.scrollY / Math.max(1, window.innerHeight)
    }
    read()
    window.addEventListener('scroll', read, { passive: true })
    window.addEventListener('resize', read)
    return () => {
      window.removeEventListener('scroll', read)
      window.removeEventListener('resize', read)
    }
  }, [])

  return offset
}
