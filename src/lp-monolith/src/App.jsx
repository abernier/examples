import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Scene } from './scene/Scene'
import { subscribeScroll } from './scroll'

const PROJECTS = [
  {
    no: '01',
    name: 'Kapelle XII',
    place: 'Vals, Graubünden',
    year: '2023',
    kind: 'Chapel',
    copy: 'A nine-metre board-formed shell poured in a single continuous night. One oculus, one bench, one moving rectangle of sun. The ornament is the weather.',
    specs: ['1 pour', '9.0 m clear height', '480 t in place'],
  },
  {
    no: '02',
    name: 'Bloc Noir',
    place: 'Produced in Marseille',
    year: '2024',
    kind: 'Furniture system',
    copy: 'Twelve pieces cast from one mould family. Mirror-polished 316L joints, no visible fixings, no applied colour. A seat that weighs more than the person on it.',
    specs: ['12 pieces', '0 visible fixings', '188 kg / seat'],
  },
  {
    no: '03',
    name: 'Silo Atelier',
    place: 'Port de Marseille',
    year: '2025',
    kind: 'Adaptive reuse',
    copy: 'A grain silo cut open on its north face. Twenty-two studios strung along one continuous stair, the original 1948 shuttering left exactly as found.',
    specs: ['22 studios', '1 stair', '0 new finishes'],
  },
]

const MATERIALS = [
  ['01', 'Board-formed concrete', 'C40/50, Douglas fir shuttering', '25 mm boards, no release agent', '± 2 mm'],
  ['02', 'Mirror chrome', '316L stainless, 12-stage hand polish', 'Ra ≤ 0.05 µm', '± 0.1 mm'],
  ['03', 'Blasted aluminium', '6082-T6, glass-bead blast', '120 µm anodic layer', '± 0.3 mm'],
  ['04', 'Cast glass', 'Low-iron, kiln-formed', '32 mm, ground edge', '± 1 mm'],
  ['05', 'Waxed steel', 'S355, hot-rolled, mill scale kept', 'Microcrystalline wax, matte', '± 1.5 mm'],
]

function ScrollMeter() {
  const [p, setP] = useState(0)
  useEffect(() => subscribeScroll((s) => setP(s.progress)), [])
  return (
    <div className="meter" aria-hidden="true">
      <span className="meter__label">{String(Math.round(p * 100)).padStart(3, '0')}</span>
      <span className="meter__track">
        <span className="meter__fill" style={{ transform: `scaleY(${p})` }} />
      </span>
      <span className="meter__label meter__label--muted">100</span>
    </div>
  )
}

function Nav() {
  const [solid, setSolid] = useState(false)
  useEffect(() => subscribeScroll((s) => setSolid(s.y > 40)), [])
  return (
    <header className={`nav${solid ? ' is-solid' : ''}`}>
      <a className="nav__brand" href="#top">
        <span className="nav__mark" aria-hidden="true" />
        MONOLITH
      </a>
      <nav className="nav__links" aria-label="Primary">
        <a href="#work">Work</a>
        <a href="#material">Material</a>
        <a href="#studio">Studio</a>
        <a href="#contact">Index</a>
      </nav>
      <a className="nav__cta" href="#contact">
        Enquire
        <span aria-hidden="true">↗</span>
      </a>
    </header>
  )
}

function Hero() {
  return (
    <section className="hero" id="top">
      <p className="eyebrow hero__eyebrow">
        <span>Architecture &amp; Objects</span>
        <span className="rule" aria-hidden="true" />
        <span>Zürich · Marseille · Est. 2011</span>
      </p>

      <h1 className="hero__title">
        <span>Raw mass,</span>
        <span>polished</span>
        <span>
          <em>silence</em>
        </span>
      </h1>

      <div className="hero__body">
        <p className="lede">
          MONOLITH works between building and furniture. We cast in place, polish by hand, and let daylight
          do the ornament — no cladding, no coatings, nothing that hides how a thing was made.
        </p>
        <div className="hero__actions">
          <a className="btn btn--acid" href="#contact">
            Request the 2026 catalogue
          </a>
          <a className="btn btn--ghost" href="#work">
            Selected work <span aria-hidden="true">↓</span>
          </a>
        </div>
      </div>

      <dl className="stats">
        {[
          ['14', 'Years in practice'],
          ['38', 'Buildings completed'],
          ['09', 'Objects in production'],
          ['02', 'Casting workshops'],
        ].map(([n, label]) => (
          <div className="stats__item" key={label}>
            <dt>{n}</dt>
            <dd>{label}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function Ticker() {
  const words = ['Concrete', 'Chrome', 'Daylight', 'Mass', 'Silence', 'Formwork', 'Tolerance']
  const run = [...words, ...words, ...words]
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker__run">
        {run.map((w, i) => (
          <span key={i}>
            {w}
            <i>◾</i>
          </span>
        ))}
      </div>
    </div>
  )
}

function Work() {
  return (
    <section className="section work" id="work">
      <header className="section__head">
        <p className="eyebrow">
          <span>Selected work</span>
          <span className="rule" aria-hidden="true" />
          <span>2023 — 2025</span>
        </p>
        <h2 className="section__title">
          Three things we
          <br />
          made out of weight
        </h2>
      </header>

      <ol className="projects">
        {PROJECTS.map((p) => (
          <li className="project" key={p.no}>
            <span className="project__no">{p.no}</span>
            <div className="project__main">
              <h3 className="project__name">{p.name}</h3>
              <p className="project__meta">
                {p.kind} · {p.place} · {p.year}
              </p>
            </div>
            <p className="project__copy">{p.copy}</p>
            <ul className="project__specs">
              {p.specs.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <span className="project__go" aria-hidden="true">
              ↗
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Material() {
  return (
    <section className="section material" id="material">
      <header className="section__head">
        <p className="eyebrow">
          <span>Material register</span>
          <span className="rule" aria-hidden="true" />
          <span>Rev. 09 / 2026</span>
        </p>
        <h2 className="section__title">Five materials. No finishes.</h2>
        <p className="lede lede--narrow">
          Every project draws from the same short register. We publish the tolerances because they are the
          design — a 2 mm shadow gap is the only detail a board-formed wall gets.
        </p>
      </header>

      <div className="table" role="table" aria-label="Material register">
        <div className="table__head" role="row">
          <span role="columnheader">Ref</span>
          <span role="columnheader">Material</span>
          <span role="columnheader">Specification</span>
          <span role="columnheader">Finish</span>
          <span role="columnheader">Tolerance</span>
        </div>
        {MATERIALS.map((row) => (
          <div className="table__row" role="row" key={row[0]}>
            {row.map((cell, i) => (
              <span role="cell" key={i}>
                {cell}
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

function Studio() {
  return (
    <section className="section studio" id="studio">
      <figure className="quote">
        <blockquote>
          “They delivered a building that refuses to be photographed and has to be visited. That was, word
          for word, the brief.”
        </blockquote>
        <figcaption>
          <span className="quote__name">Dr. Ines Halbritter</span>
          <span className="quote__role">Director, Kunsthalle Vals</span>
        </figcaption>
      </figure>

      <div className="studio__grid">
        <div>
          <p className="eyebrow">
            <span>The practice</span>
          </p>
          <p>
            Fourteen people across two workshops. We keep the formwork carpenters and the polishers in
            house, because the joint between them is where the work either happens or doesn’t.
          </p>
        </div>
        <div>
          <p className="eyebrow">
            <span>How we work</span>
          </p>
          <p>
            One study model at 1:20, one full-scale mock-up of the worst corner, then the pour. We do not
            render. If it cannot be shown in plaster and steel, it is not resolved.
          </p>
        </div>
        <div>
          <p className="eyebrow">
            <span>Availability</span>
          </p>
          <p>
            Two building commissions per year, opening Q3 2026. Object editions ship from Marseille with a
            twelve-week lead time and a signed casting record.
          </p>
        </div>
      </div>
    </section>
  )
}

function Contact() {
  return (
    <section className="section cta" id="contact">
      <h2 className="cta__title">
        Bring us
        <br />
        something heavy
      </h2>
      <p className="lede lede--narrow">
        Send a site, a brief, or a single photograph of the light you want. We answer every enquiry within
        five working days.
      </p>
      <div className="hero__actions">
        <a className="btn btn--acid" href="#contact">
          studio@monolith.arch
        </a>
        <a className="btn btn--ghost" href="#contact">
          +41 81 000 12 00
        </a>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__cols">
        <div>
          <p className="eyebrow">
            <span>Zürich</span>
          </p>
          <p>
            Werkhof 4, Halle B<br />
            8005 Zürich, CH
          </p>
        </div>
        <div>
          <p className="eyebrow">
            <span>Marseille</span>
          </p>
          <p>
            12 quai du Lazaret
            <br />
            13002 Marseille, FR
          </p>
        </div>
        <div>
          <p className="eyebrow">
            <span>Index</span>
          </p>
          <p>
            <a href="#work">Work</a>
            <br />
            <a href="#material">Material</a>
            <br />
            <a href="#studio">Studio</a>
          </p>
        </div>
        <div>
          <p className="eyebrow">
            <span>Colophon</span>
          </p>
          <p>
            Cast in place.
            <br />
            Photographed in daylight only.
          </p>
        </div>
      </div>
      <div className="footer__base">
        <span>© 2026 MONOLITH SA</span>
        <span className="footer__word" aria-hidden="true">
          MONOLITH
        </span>
        <span>Concrete &amp; Chrome</span>
      </div>
    </footer>
  )
}

export default function App() {
  const eventSource = useRef(null)

  return (
    <div className="page" ref={eventSource}>
      <div className="stage">
        <Canvas
          shadows
          dpr={[1, 1.75]}
          gl={{ antialias: false }}
          camera={{ position: [0, 0.85, 7.4], fov: 38, near: 0.5, far: 90 }}
          eventSource={eventSource}
          eventPrefix="client"
        >
          <Scene />
        </Canvas>
      </div>

      <div className="grain" aria-hidden="true" />

      <Nav />
      <ScrollMeter />

      <main>
        <Hero />
        <Ticker />
        <Work />
        <Material />
        <Studio />
        <Contact />
      </main>

      <Footer />
    </div>
  )
}
