import { useEffect, useRef, useState } from 'react'
import { Scene } from './scene/Scene'
import { trackPageScroll } from './scene/scroll'

const NAV = [
  ['Vessel', '#vessel'],
  ['Programme', '#programme'],
  ['Specifications', '#specifications'],
  ['Log', '#log'],
]

const SPECS = [
  ['Certified depth', '6,000 m', '19,685 ft — full ocean access to 98% of the seafloor'],
  ['Pressure hull', 'Ti-6Al-4V', 'Two forged hemispheres, 74 mm wall, electron-beam welded'],
  ['Viewport', '90 mm acrylic', 'Conical seat, 120° unobstructed field of view'],
  ['Crew', '1 pilot + 1 observer', 'Observer seat converts to a second instrument rack'],
  ['Life support', '96 h reserve', 'Scrubbed loop, redundant O₂, independent bail-out'],
  ['Bottom time', '8 h nominal', 'Extended to 10 h on reduced-lighting profiles'],
  ['Descent rate', '42 m · min⁻¹', 'Ninety minutes surface to seafloor at rated depth'],
  ['Payload', '68 kg external', 'Plus 11 kg internal, forward of the observer seat'],
  ['Lighting', '12,000 lm', 'Six DC-LED heads, individually aimable in-dive'],
  ['Manipulator', '7-function', 'Hydraulic, 45 kg reach load, interchangeable end effectors'],
  ['Navigation', 'USBL · DVL · INS', 'Sub-metre positioning, logged at 4 Hz'],
  ['Support vessel', 'RV MERIDIAN', '68 m, DP2, A-frame launch, 240 m² wet lab'],
]

const FEATURES = [
  {
    tag: '01 — Hull',
    title: 'A pressure sphere that was forged, not fabricated.',
    body:
      'Two titanium hemispheres, machined from a single billet and joined under vacuum. No penetrations forward of the equator. Every hull is proof-tested to 660 bar — ten percent past its certified depth — then instrumented and cycled two hundred times before it ever carries a person.',
    points: ['660 bar proof test, witnessed', 'Acoustic emission monitoring on every dive', 'Recertified at 500-dive intervals'],
  },
  {
    tag: '02 — Optics',
    title: 'Twelve thousand lumens, aimed by hand.',
    body:
      'Below 1,000 metres there is no ambient light to work with — you bring all of it. Six independently gimballed DC-LED heads let the pilot rake a wall, backlight a plume, or drop to a single 400-lumen head so bioluminescence reads on sensor. Camera package is a 8K global-shutter body on a stabilised pan-tilt.',
    points: ['6 × gimballed heads, in-dive aiming', '8K global shutter, 15-stop capture', 'Raw + proxy delivered on deck'],
  },
  {
    tag: '03 — Science',
    title: 'A working platform, not a ride.',
    body:
      'The observer seat faces a rack you specify: CTD, eDNA sampler, sediment corer, acoustic doppler, or your own instrument on our standard rail. A seven-function manipulator and a twelve-drawer sample carousel mean a dive comes back with material, not just footage. Data is on your drive before the sub is back on the cradle.',
    points: ['Standard 19″ rail for third-party kit', '12-drawer sample carousel, pressure-retaining', 'Telemetry handed over at surface'],
  },
]

function Nav() {
  const [solid, setSolid] = useState(false)
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`nav ${solid ? 'is-solid' : ''}`}>
      <div className="nav__inner">
        <a className="brand" href="#top">
          <span className="brand__mark" aria-hidden="true" />
          <span className="brand__word">ABYSS</span>
        </a>
        <nav className="nav__links" aria-label="Primary">
          {NAV.map(([label, href]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>
        <a className="btn btn--sm" href="#charter">
          Request a descent
        </a>
      </div>
    </header>
  )
}

function Reveal({ children, as: Tag = 'div', className = '', delay = 0 }) {
  const ref = useRef(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) return setSeen(true)
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setSeen(true)
            io.unobserve(e.target)
          }
        })
      },
      { rootMargin: '0px 0px -3% 0px', threshold: 0 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <Tag ref={ref} className={`reveal ${seen ? 'is-in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  )
}

export default function App() {
  useEffect(() => trackPageScroll(), [])

  return (
    <>
      <div className="canvas-layer" aria-hidden="true">
        <Scene />
      </div>
      <div className="grain" aria-hidden="true" />

      <Nav />

      <main id="top">
        {/* ───────────────────────── hero ───────────────────────── */}
        <section className="hero">
          <div className="shell">
            <Reveal className="hero__eyebrow" as="p">
              <span className="dot" /> 47°14′N 27°38′W — Mid-Atlantic Ridge · Dive 0412 · Live
            </Reveal>

            <Reveal as="h1" className="hero__title" delay={80}>
              Where the light
              <br />
              gives up, <em>we keep</em>
              <br />
              working.
            </Reveal>

            <Reveal as="p" className="hero__sub" delay={160}>
              ABYSS operates a two-person titanium submersible and its support vessel for research charters, survey
              work and cinematography below six thousand metres. Ninety minutes down. Eight hours on the bottom.
              Everything you record comes home with you.
            </Reveal>

            <Reveal className="hero__cta" delay={240}>
              <a className="btn btn--primary" href="#charter">
                Request a descent
              </a>
              <a className="btn btn--ghost" href="#log">
                Read dive log 0412
              </a>
            </Reveal>
          </div>

          <div className="hero__stats">
            <div className="shell stats">
              {[
                ['6,000', 'm certified depth'],
                ['8', 'h on the bottom'],
                ['412', 'crewed descents'],
                ['0', 'aborts since 2021'],
              ].map(([n, l], i) => (
                <Reveal key={l} className="stat" delay={i * 70}>
                  <span className="stat__n">{n}</span>
                  <span className="stat__l">{l}</span>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ───────────────────────── manifesto ───────────────────────── */}
        <section className="band" id="vessel">
          <div className="shell">
            <Reveal as="p" className="lede">
              Three quarters of the planet is a place almost nobody has been. Not because it is far — because it is{' '}
              <em>heavy</em>. At six kilometres down, the water pushes on every square centimetre with the weight of a
              small car. We built a vessel that ignores this, and a programme that puts working scientists inside it.
            </Reveal>
          </div>
        </section>

        {/* ───────────────────────── features ───────────────────────── */}
        <section className="features" id="programme">
          {FEATURES.map((f, i) => (
            <article className="feature" key={f.tag}>
              <div className="shell feature__inner">
                <Reveal className="feature__aside">
                  <span className="tag">{f.tag}</span>
                </Reveal>
                <div className="feature__body">
                  <Reveal as="h2" delay={60}>
                    {f.title}
                  </Reveal>
                  <Reveal as="p" className="prose" delay={120}>
                    {f.body}
                  </Reveal>
                  <Reveal as="ul" className="ticks" delay={180}>
                    {f.points.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </Reveal>
                </div>
              </div>
              {i < FEATURES.length - 1 && <div className="shell"><hr className="rule" /></div>}
            </article>
          ))}
        </section>

        {/* ───────────────────────── specs ───────────────────────── */}
        <section className="specs" id="specifications">
          <div className="shell">
            <Reveal className="section-head">
              <span className="tag">Specification</span>
              <h2>ABYSS-II — hull 03, certified 6,000 m</h2>
              <p className="prose">
                Current-fleet figures, as flown. Anything marked nominal is what we plan a dive against, not a
                best-case number from a test tank.
              </p>
            </Reveal>

            <Reveal className="table" delay={80}>
              <div className="table__head" aria-hidden="true">
                <span>System</span>
                <span>Figure</span>
                <span>Notes</span>
              </div>
              <dl>
                {SPECS.map(([k, v, n]) => (
                  <div className="row" key={k}>
                    <dt>{k}</dt>
                    <dd className="row__v">{v}</dd>
                    <dd className="row__n">{n}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </section>

        {/* ───────────────────────── testimonial ───────────────────────── */}
        <section className="quote" id="log">
          <div className="shell">
            <Reveal as="blockquote" className="quote__body">
              <p>
                “We had budgeted three seasons of ROV time for the vent field. We got better data in nine crewed dives,
                because somebody was <em>there</em> — deciding what mattered while the plume was still in front of the
                glass. I have never handed a dataset to a journal that fast.”
              </p>
              <footer>
                <span className="quote__name">Dr. Ines Kalvø</span>
                <span className="quote__role">Benthic ecology · Norwegian Institute of Marine Research</span>
              </footer>
            </Reveal>
          </div>
        </section>

        {/* ───────────────────────── charter cta ───────────────────────── */}
        <section className="charter" id="charter">
          <div className="shell charter__inner">
            <Reveal>
              <span className="tag">Charter</span>
              <h2>
                Two windows a year.
                <br />
                Both fill early.
              </h2>
              <p className="prose">
                Spring runs the Mid-Atlantic Ridge out of Horta; autumn works the Iberian margin out of Vigo. A charter
                is a minimum of twelve dive days including weather. Tell us the depth, the target and the instrument
                and we will tell you whether it is a dive or a wish.
              </p>
              <div className="hero__cta">
                <a className="btn btn--primary" href="#top">
                  Start a charter enquiry
                </a>
                <a className="btn btn--ghost" href="#specifications">
                  See the full specification
                </a>
              </div>
            </Reveal>
            <Reveal className="windows" delay={100}>
              {[
                ['Spring window', 'Apr — Jun', 'Horta, Faial · Azores', '2 berths left'],
                ['Autumn window', 'Sep — Nov', 'Vigo · Galicia', 'Waitlist'],
              ].map(([t, d, p, s]) => (
                <div className="window" key={t}>
                  <span className="window__t">{t}</span>
                  <span className="window__d">{d}</span>
                  <span className="window__p">{p}</span>
                  <span className={`window__s ${s === 'Waitlist' ? 'is-full' : ''}`}>{s}</span>
                </div>
              ))}
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="shell foot__inner">
          <div className="foot__brand">
            <span className="brand__mark" aria-hidden="true" />
            <span className="brand__word">ABYSS</span>
            <p>
              Deep submergence charter.
              <br />
              Horta, Faial, Azores · Vigo, Galicia
            </p>
          </div>
          <div className="foot__cols">
            <div>
              <h3>Vessel</h3>
              <a href="#specifications">ABYSS-II</a>
              <a href="#specifications">RV Meridian</a>
              <a href="#programme">Instrument rail</a>
            </div>
            <div>
              <h3>Programme</h3>
              <a href="#charter">Charter windows</a>
              <a href="#programme">Science support</a>
              <a href="#programme">Film &amp; broadcast</a>
            </div>
            <div>
              <h3>Company</h3>
              <a href="#top">Safety record</a>
              <a href="#log">Dive log</a>
              <a href="#charter">Contact</a>
            </div>
          </div>
        </div>
        <div className="shell foot__legal">
          <span>© 2026 Abyss Deep Submergence Lda. A fictional brand, built for a demo.</span>
          <span className="mono">DNV-GL class · ISO 45001 · IMCA D-023</span>
        </div>
      </footer>
    </>
  )
}
