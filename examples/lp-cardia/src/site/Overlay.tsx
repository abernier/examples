import Readout from './Readout'

const CATCHES = [
  { name: 'Atrial fibrillation', note: 'Irregularly irregular R–R, no discernible P wave.' },
  { name: 'Bradycardia', note: 'Sustained under 50 bpm while awake.' },
  { name: 'Tachycardia', note: 'Over 120 bpm at rest for more than five minutes.' },
  { name: 'Pauses', note: 'Any gap longer than three seconds, day or night.' },
]

const STATS = [
  { value: '250 Hz', label: 'Sampling rate, continuous' },
  { value: '14 days', label: 'One patch, one charge' },
  { value: '4.1 g', label: 'What you feel on the skin' },
]

/**
 * The DOM half of the page. It owns the scrollbar and writes 0..1 into the
 * shared ref the canvas reads — the canvas never re-renders on scroll.
 */
export default function Overlay({ scroll }: { scroll: React.RefObject<number> }) {
  return (
    <div
      className="scroller"
      onScroll={(event) => {
        const el = event.currentTarget
        scroll.current = el.scrollTop / (el.scrollHeight - el.clientHeight || 1)
      }}
    >
      <header className="nav">
        <a className="wordmark" href="#top">
          Cardia
        </a>
        <nav className="nav__links">
          <a href="#never">Technology</a>
          <a href="#catches">Clinical</a>
          <a href="#order">Support</a>
        </nav>
        <a className="btn btn--sm" href="#order">
          Order
        </a>
      </header>

      <section className="section section--hero" id="top">
        <div className="col">
          <p className="eyebrow">Continuous single-lead ECG</p>
          <h1>
            Your heart,
            <br />
            every beat.
          </h1>
          <p className="lede">
            Most heart trouble does not wait for your annual check-up. Cardia is a four-gram patch
            that sits under the collarbone and reads your rhythm without pause for fourteen days —
            not for thirty seconds, when you happen to remember.
          </p>
          <div className="actions">
            <a className="btn" href="#order">
              Order Cardia — €189
            </a>
            <a className="btn btn--ghost" href="#catches">
              Read the clinical brief
            </a>
          </div>
          <Readout />
        </div>
      </section>

      <section className="section section--right" id="never">
        <div className="col">
          <p className="eyebrow">Why continuous</p>
          <h2>It never looks away.</h2>
          <p className="lede">
            A watch samples when you ask it to, and an arrhythmia has no reason to appear while you
            are holding your finger on a crown. Cardia samples two hundred and fifty times a second
            — asleep, on the bike, in the shower — and keeps every beat of it.
          </p>
          <ul className="stats">
            {STATS.map((stat) => (
              <li key={stat.value}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" id="catches">
        <div className="col">
          <p className="eyebrow">Clinical</p>
          <h2>What it catches.</h2>
          <ul className="catches">
            {CATCHES.map((item) => (
              <li key={item.name}>
                <strong>{item.name}</strong>
                <span>{item.note}</span>
              </li>
            ))}
          </ul>
          <p className="lede lede--tight">
            The classifier runs on the patch. A flagged episode reaches your cardiologist as an
            annotated strip with thirty seconds either side of it — not as forty gigabytes of raw
            signal for somebody to trawl.
          </p>
        </div>
      </section>

      <section className="section section--center" id="order">
        <div className="col col--center">
          <p className="eyebrow">Get started</p>
          <h2>One heart. Start with yours.</h2>
          <p className="lede">
            €189, including the fourteen-day report read by a cardiologist. It ships in a padded
            envelope and goes on in under a minute.
          </p>
          <div className="actions actions--center">
            <a className="btn" href="#order">
              Order Cardia
            </a>
            <a className="btn btn--ghost" href="#order">
              Talk to a clinician
            </a>
          </div>
          <footer className="footer">
            <span>Cardia — Rotterdam</span>
            <span>
              A fictional brand, built as a react-three-fiber demo. Not a medical device, and
              nothing here is medical advice.
            </span>
          </footer>
        </div>
      </section>
    </div>
  )
}
