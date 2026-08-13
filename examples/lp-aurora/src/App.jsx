import { Suspense, useEffect, useRef, useState } from 'react'
import Scene from './Scene'
import { bindViewport } from './viewport'

const NAV = [
  { id: 'technology', label: 'Technology' },
  { id: 'ritual', label: 'Ritual' },
  { id: 'specs', label: 'Specs' },
  { id: 'field-notes', label: 'Field notes' },
]

const FEATURES = [
  {
    index: '01',
    kicker: 'Dusk Engine',
    title: 'Forty minutes of engineered sunset, every night.',
    body: 'Ninety-six independently driven diodes walk from 4,000 K daylight down to a 1,650 K ember, dimming on a logarithmic curve tuned to the way the retina actually surrenders light. No steps, no flicker, no blue spill above the horizon line. By the time the room reaches candle temperature your melatonin has had a twenty-minute head start.',
    stats: [
      ['Sweep', '4000 K → 1650 K'],
      ['Resolution', '14-bit, flicker-free'],
    ],
  },
  {
    index: '02',
    kicker: 'Northern Field',
    title: 'Sixteen sensors read the room before it reads you.',
    body: 'Spectral, lux, thermal and barometric sensing runs on-device at 40 Hz. AURORA knows when a streetlight leaks through the blind, when the radiator kicks in, when the season has quietly moved your dusk forty minutes earlier — and corrects for all of it without ever asking you to open an app.',
    stats: [
      ['Sensing', '16 channels · 40 Hz'],
      ['Processing', 'Fully on-device'],
    ],
  },
  {
    index: '03',
    kicker: 'Borealis Wake',
    title: 'A sunrise that starts before the alarm does.',
    body: 'Twenty-three minutes before you asked to be awake, a cold ribbon of green-blue light begins to move across the ceiling — slow enough that you will never catch it starting. Cortisol rises on its own schedule. The alarm, if it sounds at all, arrives to find you already surfaced.',
    stats: [
      ['Lead time', '23 min, adaptive'],
      ['Peak', '4,000 lm melanopic'],
    ],
  },
]

const SPECS = [
  ['Light engine', '96 × binned COB diodes, 6-primary mix'],
  ['Colour range', '1,650 K – 6,500 K · Duv ±0.0008'],
  ['Peak output', '4,000 lm · 890 melanopic EDI at 1 m'],
  ['Rendering', 'CRI Ra 97 · R9 95 · TM-30 Rf 94'],
  ['Sensing', 'Spectral, lux, IR presence, thermal, barometric'],
  ['Acoustics', '0 dB — passive aluminium heat path, fanless'],
  ['Materials', 'Borosilicate halo · cold-forged 6082 aluminium'],
  ['Dimensions', '412 × 412 × 118 mm · 3.1 kg'],
  ['Power', '48 V DC · 62 W peak · 0.4 W standby'],
  ['Connectivity', 'Thread, Matter, BLE 5.3 — local-only mode'],
  ['Warranty', '10 years, diodes included'],
]

function useReveal() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('[data-reveal]'))
    if (!('IntersectionObserver' in window)) {
      nodes.forEach((n) => n.classList.add('is-in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        })
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.15 }
    )
    nodes.forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [])
}

function Nav() {
  const [stuck, setStuck] = useState(false)
  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <header className={`nav ${stuck ? 'nav--stuck' : ''}`}>
      <div className="nav__inner">
        <a className="wordmark" href="#top" aria-label="AURORA, back to top">
          <span className="wordmark__dot" aria-hidden="true" />
          AURORA
        </a>
        <nav className="nav__links" aria-label="Primary">
          {NAV.map((l) => (
            <a key={l.id} href={`#${l.id}`}>
              {l.label}
            </a>
          ))}
        </nav>
        <a className="btn btn--ghost nav__cta" href="#reserve">
          Reserve
        </a>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="shell">
        <p className="eyebrow" data-reveal>
          <span className="eyebrow__rule" aria-hidden="true" />
          Circadian light system — Model 01
        </p>
        <h1 className="display" data-reveal>
          Sleep is not a switch.
          <br />
          <em>It is a sunrise,</em> played backwards.
        </h1>
        <p className="lede" data-reveal>
          AURORA reads the room, the season and the rhythm you have drifted into, then paints forty
          minutes of engineered dusk across your ceiling — so your body remembers how to fall asleep
          without being told.
        </p>
        <div className="hero__actions" data-reveal>
          <a className="btn btn--solid" href="#reserve">
            Reserve unit no. 01
            <span aria-hidden="true">→</span>
          </a>
          <a className="btn btn--quiet" href="#ritual">
            See the nightly ritual
          </a>
        </div>
        <dl className="hero__stats" data-reveal>
          <div>
            <dt>Time to sleep</dt>
            <dd>
              −38<span>min median</span>
            </dd>
          </div>
          <div>
            <dt>Dusk sweep</dt>
            <dd>
              4000<span>→ 1650 K</span>
            </dd>
          </div>
          <div>
            <dt>Operating noise</dt>
            <dd>
              0<span>dB, fanless</span>
            </dd>
          </div>
        </dl>
      </div>
      <div className="hero__scroll" aria-hidden="true">
        <span>Scroll</span>
        <i />
      </div>
    </section>
  )
}

function Manifesto() {
  return (
    <section className="manifesto" id="technology">
      <div className="shell">
        <p className="manifesto__text" data-reveal>
          For two hundred thousand years the sky told us when to stop. Then we built a ceiling and
          put a small blue sun in it. <span>AURORA gives the sky back</span> — measured in kelvin,
          held to a thousandth of a Duv, and quiet enough that you will forget it is working.
        </p>
      </div>
    </section>
  )
}

function Features() {
  return (
    <section className="features" id="ritual">
      <div className="shell">
        {FEATURES.map((f) => (
          <article className="feature" key={f.index} data-reveal>
            <div className="feature__meta">
              <span className="feature__index">{f.index}</span>
              <span className="feature__kicker">{f.kicker}</span>
            </div>
            <div className="feature__body">
              <h2>{f.title}</h2>
              <p>{f.body}</p>
              <ul className="feature__stats">
                {f.stats.map(([k, v]) => (
                  <li key={k}>
                    <span>{k}</span>
                    <strong>{v}</strong>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function Specs() {
  return (
    <section className="specs" id="specs">
      <div className="shell">
        <div className="specs__head" data-reveal>
          <p className="eyebrow">
            <span className="eyebrow__rule" aria-hidden="true" />
            Technical
          </p>
          <h2 className="section-title">
            Every number we could
            <br />
            defend in a lab.
          </h2>
          <p className="section-sub">
            Measured at 1 m, 23 °C, after a 30-minute thermal soak. Full photometric report ships
            with the unit and is reproducible on request.
          </p>
        </div>
        <dl className="specs__table" data-reveal>
          {SPECS.map(([k, v]) => (
            <div className="specs__row" key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

function Testimonial() {
  return (
    <section className="quote" id="field-notes">
      <div className="shell">
        <figure data-reveal>
          <blockquote>
            “We put it in a cabin ninety kilometres inside the Arctic Circle, in a February with no
            usable daylight at all. After three weeks the group's sleep onset had moved back toward
            a normal phase. The device is doing the boring, difficult thing properly.”
          </blockquote>
          <figcaption>
            <span className="quote__name">Dr. Ingrid Sølvberg</span>
            <span className="quote__role">
              Chronobiology field study, Kvaløya — 24 participants, winter cohort
            </span>
          </figcaption>
        </figure>
      </div>
    </section>
  )
}

function Reserve() {
  return (
    <section className="reserve" id="reserve">
      <div className="shell">
        <div className="reserve__card" data-reveal>
          <p className="eyebrow">
            <span className="eyebrow__rule" aria-hidden="true" />
            First run — 500 units
          </p>
          <h2 className="section-title">
            The first winter batch
            <br />
            ships in October.
          </h2>
          <p className="section-sub">
            Each unit is numbered, photometrically calibrated by hand and paired to the latitude you
            give us. Reservation is refundable until the plate is engraved.
          </p>
          <div className="reserve__actions">
            <a className="btn btn--solid" href="#reserve">
              Reserve — €1,890
              <span aria-hidden="true">→</span>
            </a>
            <span className="reserve__note">Refundable · 412 of 500 remaining</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="shell">
        <div className="footer__grid">
          <div className="footer__brand">
            <a className="wordmark" href="#top">
              <span className="wordmark__dot" aria-hidden="true" />
              AURORA
            </a>
            <p>
              Light that keeps time.
              <br />
              Designed in Tromsø, built in Porto.
            </p>
          </div>
          <div>
            <h3>Product</h3>
            <ul>
              <li>
                <a href="#technology">Technology</a>
              </li>
              <li>
                <a href="#specs">Specifications</a>
              </li>
              <li>
                <a href="#ritual">Nightly ritual</a>
              </li>
              <li>
                <a href="#reserve">Reserve</a>
              </li>
            </ul>
          </div>
          <div>
            <h3>Research</h3>
            <ul>
              <li>
                <a href="#field-notes">Field notes</a>
              </li>
              <li>
                <a href="#field-notes">Photometric report</a>
              </li>
              <li>
                <a href="#field-notes">Winter cohort data</a>
              </li>
            </ul>
          </div>
          <div>
            <h3>Company</h3>
            <ul>
              <li>
                <a href="#top">Studio</a>
              </li>
              <li>
                <a href="#top">Press</a>
              </li>
              <li>
                <a href="#top">Contact</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer__base">
          <span>© {new Date().getFullYear()} Aurora Instruments AS — a fictional brand.</span>
          <span>69.6°N · 18.9°E</span>
        </div>
      </div>
    </footer>
  )
}

export default function App() {
  const canvasRef = useRef(null)
  useReveal()
  useEffect(() => bindViewport(), [])

  return (
    <>
      <div className="stage" ref={canvasRef} aria-hidden="true">
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
        <div className="stage__grain" />
        <div className="stage__fade" />
      </div>

      <Nav />

      <main className="page">
        <Hero />
        <Manifesto />
        <Features />
        <Specs />
        <Testimonial />
        <Reserve />
      </main>

      <Footer />
    </>
  )
}
