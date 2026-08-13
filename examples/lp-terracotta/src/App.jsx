import { useEffect, useRef, useState } from 'react'
import Experience from './three/Experience.jsx'
import { bindViewport } from './lib/viewport.js'

/* ------------------------------------------------------------------ *
 * Content
 * ------------------------------------------------------------------ */

const NAV = [
  ['Collections', '#collections'],
  ['The wheel', '#wheel'],
  ['Materials', '#materials'],
  ['Studio', '#studio'],
]

const TICKER = [
  'Thrown in Bonnieux',
  '1 240 °C oxidation',
  'Signed and numbered',
  'Eight-week lead time',
  'Packed in wool felt',
  'Wood-ash matte glaze',
]

const COLLECTIONS = [
  {
    no: '01',
    name: 'Ochre Table',
    lede: 'Six forms for eating together.',
    body:
      'The everyday service: a coupe plate that stacks without chipping, two bowl depths, and a beaker sized for the hand of whoever is doing the washing up. Glazed in the studio ochre — the colour of the hillside behind the kiln at four in the afternoon.',
    specs: [
      ['Pieces', 'Six'],
      ['Glaze', 'Studio ochre, matte'],
      ['Plate ⌀', '265 mm'],
      ['From', '€ 48'],
    ],
  },
  {
    no: '02',
    name: 'Sienna Reserve',
    lede: 'Carafes, cruets, and the long pour.',
    body:
      'Tall shouldered vessels thrown in one piece, then collared down to a lip narrow enough to pour a clean line of oil. The burnt-sienna slip is brushed on wet and breaks to bare clay on the throwing rings, so no two shoulders ever read the same.',
    specs: [
      ['Pieces', 'Four'],
      ['Glaze', 'Burnt sienna slip'],
      ['Capacity', '0.5 / 1.1 L'],
      ['From', '€ 96'],
    ],
  },
  {
    no: '03',
    name: 'Crown Glass',
    lede: 'One glossy note against all that chalk.',
    body:
      'Blown for us by a single furnace in Biot, in a batch of ninety a year. We make it because a matte table needs one thing that answers the window — a beaker that holds the light rather than absorbing it, and puts a coin of it back on the linen.',
    specs: [
      ['Pieces', 'One'],
      ['Material', 'Hand-blown soda glass'],
      ['Capacity', '280 ml'],
      ['From', '€ 62'],
    ],
  },
]

const STEPS = [
  {
    no: '01',
    title: 'Wedging',
    body: 'Twenty minutes on the plaster bat, folding the air out. Clay that remembers a bubble will remember it again at 1 240 °C.',
  },
  {
    no: '02',
    title: 'Throwing',
    body: 'One pull for the floor, three for the wall. The spiral you can feel under a thumb is the record of the last one.',
  },
  {
    no: '03',
    title: 'Trimming & bisque',
    body: 'Leather-hard, inverted, footed with a loop tool. Then eleven hours to 980 °C and a full day to come back down.',
  },
  {
    no: '04',
    title: 'Glaze & gloss',
    body: 'Dipped, wiped at the foot, fired again in oxidation. What comes out is either right or it goes into the shard wall.',
  },
]

const MATERIALS = [
  ['Body', 'Grogged stoneware, 25 % Provençal red clay'],
  ['Glaze', 'Wood-ash and tin matte — food-safe, lead-free'],
  ['Bisque', '980 °C, 11 h ramp'],
  ['Glost', '1 240 °C, oxidation, 14 h cycle'],
  ['Foot', 'Unglazed, sanded by hand on wet carborundum'],
  ['Shrinkage', '12.4 % wet to fired'],
  ['Dishwasher', 'Yes — lower rack, no rinse aid'],
  ['Microwave', 'Yes'],
  ['Oven', 'To 220 °C, from cold'],
  ['Not for', 'Direct flame, freezer-to-oven, abrasive pads'],
]

/* ------------------------------------------------------------------ *
 * Reveal on scroll
 * ------------------------------------------------------------------ */

function useReveal() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('[data-reveal]'))
    if (!('IntersectionObserver' in window)) {
      nodes.forEach((n) => n.classList.add('is-in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in')
            io.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.15 }
    )
    nodes.forEach((n) => io.observe(n))
    return () => io.disconnect()
  }, [])
}

/* ------------------------------------------------------------------ *
 * Chrome
 * ------------------------------------------------------------------ */

function Nav() {
  const barRef = useRef(null)
  const [solid, setSolid] = useState(false)

  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      const p = max > 0 ? window.scrollY / max : 0
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`
      setSolid(window.scrollY > 40)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <header className={`nav${solid ? ' nav--solid' : ''}`}>
      <div className="nav__inner">
        <a className="wordmark" href="#top" aria-label="Terracotta, home">
          <span className="wordmark__mark" aria-hidden="true" />
          Terracotta
        </a>
        <nav className="nav__links" aria-label="Primary">
          {NAV.map(([label, href]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>
        <a className="btn btn--ghost nav__cta" href="#studio">
          Enquire
        </a>
      </div>
      <span className="nav__progress" ref={barRef} aria-hidden="true" />
    </header>
  )
}

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero__grid">
        <div className="hero__copy">
          <p className="eyebrow" data-reveal>
            <span className="eyebrow__rule" aria-hidden="true" />
            Atelier no. 4 · Bonnieux, Vaucluse · since 2011
          </p>
          <h1 className="display" data-reveal>
            Clay that keeps the
            <br />
            shape of the hand
            <br />
            <em>that turned it.</em>
          </h1>
          <p className="lede" data-reveal>
            Terracotta is a two-wheel studio making stoneware for the slow table. Every piece is
            thrown, trimmed, glazed and twice-fired here, in daylight, by four pairs of hands.
          </p>
          <div className="hero__actions" data-reveal>
            <a className="btn btn--solid" href="#collections">
              See the Ochre Table
            </a>
            <a className="btn btn--link" href="#studio">
              Visit the studio
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>
      <div className="hero__foot">
        <span className="mono">01 — The still life</span>
        <span className="mono scroll-hint">
          Scroll <span className="scroll-hint__line" aria-hidden="true" />
        </span>
        <span className="mono">44°02′N 5°18′E</span>
      </div>
    </section>
  )
}

function Ticker() {
  const items = [...TICKER, ...TICKER]
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker__track">
        {items.map((t, i) => (
          <span key={i} className="ticker__item">
            {t}
            <span className="ticker__dot" />
          </span>
        ))}
      </div>
    </div>
  )
}

function Collections() {
  return (
    <section className="section" id="collections">
      <div className="section__head" data-reveal>
        <span className="mono kicker">02 — Collections</span>
        <h2 className="h2">
          Three tables, fired
          <br />
          four times a year.
        </h2>
      </div>

      <div className="collections">
        {COLLECTIONS.map((c, i) => (
          <article
            className={`collection${i % 2 ? ' collection--alt' : ''}`}
            key={c.no}
            data-reveal
          >
            <div className="collection__meta">
              <span className="mono">{c.no}</span>
              <span className="mono">Édition {2020 + i}</span>
            </div>
            <div className="collection__body">
              <h3 className="h3">{c.name}</h3>
              <p className="collection__lede">{c.lede}</p>
              <p className="prose">{c.body}</p>
              <dl className="specs specs--inline">
                {c.specs.map(([k, v]) => (
                  <div className="specs__row" key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <a className="btn btn--link" href="#studio">
                Enquire about {c.name}
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function Wheel() {
  return (
    <section className="section section--tight" id="wheel">
      <div className="section__head" data-reveal>
        <span className="mono kicker">03 — The wheel</span>
        <h2 className="h2">
          Twelve days from
          <br />
          wedge to shelf.
        </h2>
        <p className="prose prose--wide">
          Nothing here is quick, and none of it is precious about it. A pot that survives the
          trimming tool, the bisque and the glost has earned the studio stamp on its foot — and
          roughly one in nine does not.
        </p>
      </div>
      <ol className="steps">
        {STEPS.map((s) => (
          <li className="step" key={s.no} data-reveal>
            <span className="mono step__no">{s.no}</span>
            <h3 className="step__title">{s.title}</h3>
            <p className="step__body">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Materials() {
  return (
    <section className="section" id="materials">
      <div className="materials">
        <div className="materials__intro" data-reveal>
          <span className="mono kicker">04 — Materials &amp; care</span>
          <h2 className="h2">
            What it is,
            <br />
            and how to keep it.
          </h2>
          <p className="prose">
            Stoneware is generous: it will take the dishwasher, the oven and a decade of Sunday
            lunches. What it will not forgive is thermal shock. Let a hot dish come down to room
            temperature before it meets cold water, and the glaze will stay closed.
          </p>
          <p className="note mono">
            Every order ships with a card carrying the batch number, the kiln date and the name of
            whoever threw it.
          </p>
        </div>
        <dl className="specs specs--table" data-reveal>
          {MATERIALS.map(([k, v]) => (
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
    <section className="section section--quote">
      <figure className="quote" data-reveal>
        <blockquote>
          <p>
            “We plated a tasting menu on these for two seasons. Not one chipped rim, and every
            single guest turned the bowl over to look at the foot.”
          </p>
        </blockquote>
        <figcaption>
          <span className="quote__name">Camille Rousset</span>
          <span className="mono quote__role">Chef · Maison Sault, Apt</span>
        </figcaption>
      </figure>
    </section>
  )
}

function Studio() {
  return (
    <section className="section" id="studio">
      <div className="cta" data-reveal>
        <div className="cta__copy">
          <span className="mono kicker">05 — The list</span>
          <h2 className="h2">The kiln opens four times a year.</h2>
          <p className="prose">
            We tell the list first. No campaigns, no discounts — one letter per firing with the
            forms, the glaze notes and what came out of the shard wall.
          </p>
        </div>
        <form className="signup" onSubmit={(e) => e.preventDefault()}>
          <label className="signup__label mono" htmlFor="email">
            Email address
          </label>
          <div className="signup__row">
            <input
              id="email"
              className="signup__input"
              type="email"
              name="email"
              placeholder="you@studio.fr"
              autoComplete="email"
            />
            <button className="btn btn--solid" type="submit">
              Join the list
            </button>
          </div>
          <p className="signup__fine mono">Four letters a year. Nothing else, ever.</p>
        </form>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__top">
        <a className="wordmark wordmark--lg" href="#top">
          <span className="wordmark__mark" aria-hidden="true" />
          Terracotta
        </a>
        <p className="footer__line">
          Hand-thrown stoneware for the slow table.
          <br />
          Atelier no. 4, chemin des Poteries, 84480 Bonnieux.
        </p>
      </div>
      <div className="footer__cols">
        <div>
          <h4 className="mono">Shop</h4>
          <ul>
            <li>
              <a href="#collections">Ochre Table</a>
            </li>
            <li>
              <a href="#collections">Sienna Reserve</a>
            </li>
            <li>
              <a href="#collections">Crown Glass</a>
            </li>
            <li>
              <a href="#collections">Seconds &amp; shards</a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mono">Studio</h4>
          <ul>
            <li>
              <a href="#wheel">The wheel</a>
            </li>
            <li>
              <a href="#materials">Glaze book</a>
            </li>
            <li>
              <a href="#studio">Workshops</a>
            </li>
            <li>
              <a href="#studio">Stockists</a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mono">Contact</h4>
          <ul>
            <li>
              <a href="#studio">bonjour@terracotta.studio</a>
            </li>
            <li>
              <a href="#studio">+33 4 90 00 00 00</a>
            </li>
            <li>
              <a href="#studio">Thu–Sat, 10h–17h</a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="mono">Elsewhere</h4>
          <ul>
            <li>
              <a href="#top">Instagram</a>
            </li>
            <li>
              <a href="#top">Journal</a>
            </li>
            <li>
              <a href="#top">Trade enquiries</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="footer__base mono">
        <span>© {new Date().getFullYear()} Terracotta — a fictional ceramics house.</span>
        <span>Made of clay, water and daylight.</span>
      </div>
    </footer>
  )
}

/* ------------------------------------------------------------------ *
 * App
 * ------------------------------------------------------------------ */

export default function App() {
  useReveal()
  useEffect(() => bindViewport(), [])

  return (
    <>
      <div className="canvas-layer" aria-hidden="true">
        <Experience />
      </div>
      <div className="grain" aria-hidden="true" />

      <Nav />
      <main className="content">
        <Hero />
        <Ticker />
        <Collections />
        <Wheel />
        <Materials />
        <Testimonial />
        <Studio />
      </main>
      <Footer />
    </>
  )
}
