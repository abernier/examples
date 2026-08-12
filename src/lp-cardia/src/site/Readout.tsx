import { useEffect, useRef } from 'react'

import { BPM, ecg } from '../lib/cardiac'
import { pulse } from '../lib/pulse'

/**
 * The monitor strip under the hero. Driven straight off the shared beat in a
 * rAF loop and written to the DOM by hand — a React state update 60 times a
 * second to move one dot would re-render the whole overlay for nothing.
 */
export default function Readout() {
  const dot = useRef<HTMLSpanElement>(null!)
  const bpm = useRef<HTMLSpanElement>(null!)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const flash = Math.max(pulse.contraction, Math.max(0, ecg(pulse.phase)) ** 2)
      dot.current.style.opacity = String(0.3 + flash * 0.7)
      dot.current.style.transform = `scale(${1 + flash * 0.55})`
      // Resting rate wanders a beat or two the way a real one does.
      bpm.current.textContent = String(BPM + Math.round(Math.sin(pulse.phase * 0.4) * 1.4))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="readout">
      <span className="readout__dot" ref={dot} />
      <span className="readout__cell">
        <span ref={bpm}>{BPM}</span> BPM
      </span>
      <span className="readout__sep" />
      <span className="readout__cell">Sinus rhythm</span>
      <span className="readout__sep" />
      <span className="readout__cell">14d 06h remaining</span>
    </div>
  )
}
