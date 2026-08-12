import { useEffect, useRef, useState } from 'react'
import { NAV, HERO_STATS, CAPABILITIES, MANIFEST, TELEMETRY } from './content.js'
import { useReveal } from './useReveal.js'

/* ------------------------------------------------------------------ marks */

function Mark({ size = 22 }) {
  return (
    <svg className="mark" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" fill="currentColor" />
      <ellipse
        cx="12"
        cy="12"
        rx="10.6"
        ry="5.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        transform="rotate(-28 12 12)"
        opacity="0.75"
      />
    </svg>
  )
}

/* -------------------------------------------------------------- countdown */

const pad = (n) => String(n).padStart(2, '0')

function Countdown() {
  const target = useRef(Date.now() + (11 * 3600 + 42 * 60 + 7) * 1000)
  const [left, setLeft] = useState(target.current - Date.now())
  useEffect(() => {
    const id = setInterval(() => setLeft(Math.max(0, target.current - Date.now())), 1000)
    return () => clearInterval(id)
  }, [])
  const s = Math.floor(left / 1000)
  return (
    <span className="num">
      T−{pad(Math.floor(s / 3600))}:{pad(Math.floor((s % 3600) / 60))}:{pad(s % 60)}
    </span>
  )
}

/* -------------------------------------------------------------------- nav */

function Nav() {
  const [stuck, setStuck] = useState(false)
  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <header className={`nav${stuck ? ' is-stuck' : ''}`}>
      <div className="nav__in">
        <a className="brand" href="#top">
          <Mark />
          <span className="brand__word">ORBITAL</span>
          <span className="brand__sub num">LC-4E</span>
        </a>
        <nav className="nav__links" aria-label="Primary">
          {NAV.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="nav__end">
          <span className="nav__clock num" aria-hidden="true">
            <Countdown />
          </span>
          <a className="btn btn--ghost" href="#contact">
            Reserve a slot
          </a>
        </div>
      </div>
    </header>
  )
}

/* ------------------------------------------------------------------- hero */

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="wrap">
        <p className="eyebrow" data-reveal>
          <span className="dot" /> Pad LC-4E · Kodiak, Alaska · window opens <Countdown />
        </p>

        <h1 className="display" data-reveal>
          <span>Your own eyes,</span>
          <span>
            550 km up, <em>every</em>
          </span>
          <span>ninety-two minutes.</span>
        </h1>

        <div className="hero__grid">
          <p className="lede" data-reveal>
            ORBITAL integrates, launches and flies smallsats for teams who can’t wait in line for
            somebody else’s rideshare. Payload in on Tuesday, on station by Friday, first frames on
            your desk Monday morning.
          </p>
          <div className="hero__cta" data-reveal>
            <a className="btn btn--solid" href="#contact">
              Reserve a launch slot
            </a>
            <a className="btn btn--ghost" href="#launch">
              Payload user guide
            </a>
          </div>
        </div>

        <dl className="stats" data-reveal>
          {HERO_STATS.map((s) => (
            <div className="stat" key={s.k + s.u}>
              <dt className="stat__k num">
                {s.k}
                <span className="stat__u">{s.u}</span>
              </dt>
              <dd className="stat__l">{s.l}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="scrollcue num" aria-hidden="true">
        <span>Scroll</span>
        <i />
      </div>
    </section>
  )
}

/* ----------------------------------------------------------------- ticker */

function Ticker() {
  const items = [...TELEMETRY, ...TELEMETRY]
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker__track num">
        {items.map((t, i) => (
          <span key={i} className="ticker__item">
            {t}
            <i />
          </span>
        ))}
      </div>
    </div>
  )
}

/* ----------------------------------------------------------- capabilities */

function Capability({ n, kicker, title, body, specs, id }) {
  return (
    <section className="cap" id={id}>
      <div className="wrap cap__in">
        <div className="cap__head" data-reveal>
          <span className="num cap__n">{n}</span>
          <span className="kicker">{kicker}</span>
        </div>
        <div className="cap__body">
          <h2 className="h2" data-reveal>
            {title}
          </h2>
          <p className="prose" data-reveal>
            {body}
          </p>
        </div>
        <dl className="specs" data-reveal>
          {specs.map(([k, v]) => (
            <div className="spec" key={k}>
              <dt>{k}</dt>
              <dd className="num">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

/* --------------------------------------------------------------- manifest */

function statusClass(s) {
  return 's-' + s.toLowerCase().replace(/\s+/g, '-')
}

function Manifest() {
  return (
    <section className="manifest" id="manifest">
      <div className="wrap">
        <div className="sec-head" data-reveal>
          <span className="num cap__n">04</span>
          <span className="kicker">Manifest</span>
          <h2 className="h2 h2--tight">Six windows left before 2027.</h2>
        </div>

        <div className="table-scroll" data-reveal>
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Mission</th>
                <th scope="col">Vehicle</th>
                <th scope="col">Target orbit</th>
                <th scope="col" className="ta-r">
                  Payload
                </th>
                <th scope="col">Window opens</th>
                <th scope="col" className="ta-r">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {MANIFEST.map((r) => (
                <tr key={r.mission}>
                  <th scope="row" className="num strong">
                    {r.mission}
                  </th>
                  <td className="num">{r.vehicle}</td>
                  <td className="num dim">{r.orbit}</td>
                  <td className="num ta-r">{r.payload}</td>
                  <td className="num dim">{r.window}</td>
                  <td className="ta-r">
                    <span className={`pill ${statusClass(r.status)}`}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="footnote" data-reveal>
          Manifest updated 12 Aug 2026, 09:41 UTC. Windows are the opening of a 40-minute
          instantaneous-launch band; slip probability is published nightly to contracted customers.
        </p>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------ testimonial */

function Testimonial() {
  return (
    <section className="quote-sec">
      <div className="wrap">
        <figure className="quote" data-reveal>
          <blockquote>
            “We were quoted twenty-two months for a rideshare into the wrong local time. ORBITAL flew
            us alone, into the orbit we actually asked for, nine months after signature — and the
            first usable frame came down inside the first revolution.”
          </blockquote>
          <figcaption>
            <span className="quote__who">Dr. Ines Kovář</span>
            <span className="quote__role num">
              Head of Geospatial · Meridian Agritech, Brno
            </span>
          </figcaption>
        </figure>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------- foot */

function Footer() {
  return (
    <footer className="foot" id="contact">
      <div className="wrap">
        <div className="foot__cta" data-reveal>
          <h2 className="h2 h2--tight">
            Tell us the orbit.
            <br />
            We’ll tell you the week.
          </h2>
          <a className="btn btn--solid btn--lg" href="#contact">
            Reserve a launch slot
          </a>
        </div>

        <div className="foot__cols">
          <div className="foot__col">
            <span className="kicker">Company</span>
            <a href="#top">About</a>
            <a href="#top">Careers — 34 open</a>
            <a href="#top">Newsroom</a>
          </div>
          <div className="foot__col">
            <span className="kicker">Programmes</span>
            <a href="#launch">HALO-3</a>
            <a href="#platform">MERIDIAN-60</a>
            <a href="#imagery">Firstlight archive</a>
          </div>
          <div className="foot__col">
            <span className="kicker">Sites</span>
            <span className="num dim">LC-4E · Kodiak, AK</span>
            <span className="num dim">LC-2 · Onenui, NZ</span>
            <span className="num dim">Integration · Tacoma, WA</span>
          </div>
          <div className="foot__col">
            <span className="kicker">Contact</span>
            <span className="num dim">manifest@orbital.example</span>
            <span className="num dim">+1 206 555 0148</span>
          </div>
        </div>

        <div className="foot__word" aria-hidden="true">
          ORBITAL
        </div>

        <div className="foot__legal num">
          <span>© 2026 Orbital Launch Systems, Inc. — a fictional company.</span>
          <span>FAA/AST licence LLO 26-142 · ITAR-controlled · Export CCL 9A004</span>
        </div>
      </div>
    </footer>
  )
}

/* ------------------------------------------------------------------- page */

export default function Page() {
  useReveal()
  return (
    <>
      <Nav />
      <main className="page">
        <Hero />
        <Ticker />
        {CAPABILITIES.map((c) => (
          <Capability key={c.id} {...c} />
        ))}
        <Manifest />
        <Testimonial />
      </main>
      <Footer />
    </>
  )
}
