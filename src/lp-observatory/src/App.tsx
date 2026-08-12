import { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { Scene } from './scene/Scene'
import { initReveal, initViewportTracking } from './lib/viewport'
import { clearNights, conditions, instruments, programmes, windows } from './content'

function Backdrop() {
  const [dpr, setDpr] = useState(1.5)

  return (
    <div className="backdrop" aria-hidden="true">
      <Canvas
        dpr={dpr}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 9.4], fov: 46, near: 0.1, far: 400 }}
        performance={{ min: 0.4 }}
      >
        <PerformanceMonitor
          onDecline={() => setDpr(1)}
          onIncline={() => setDpr(Math.min(2, window.devicePixelRatio))}
        />
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      <div className="backdrop-grade" />
    </div>
  )
}

function Nav() {
  return (
    <header className="nav">
      <a className="mark" href="#top">
        <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
          <circle cx="16" cy="15" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <ellipse
            cx="16"
            cy="15"
            rx="11.5"
            ry="3.8"
            fill="none"
            stroke="var(--gold)"
            strokeWidth="1.2"
            transform="rotate(-20 16 15)"
          />
        </svg>
        <span>
          <b>Vela Observatory</b>
          <em>32°47′ S · 70°16′ W · 2 940 m</em>
        </span>
      </a>
      <nav>
        <a href="#programme">Programme</a>
        <a href="#instruments">Instruments</a>
        <a href="#sky">Sky</a>
        <a href="#visit">Visit</a>
      </nav>
      <a className="btn btn-primary nav-cta" href="#visit">
        Reserve a night
      </a>
    </header>
  )
}

function Hero() {
  return (
    <section className="hero" id="top">
      <p className="eyebrow">
        <span className="pip" /> Bortle 1 · 312 photometric nights per year · above the inversion layer
      </p>
      <h1>
        Nights measured
        <br />
        in <span className="grad">magnitudes</span>.
      </h1>
      <p className="lede">
        Vela Observatory stands on the western shoulder of Cerro Vela, where the Pacific stratocumulus
        deck stops and the sky does not. Eight guest nights a month, twelve beds, one 0.7-metre
        Ritchey–Chrétien, and a horizon you can see all the way down to.
      </p>
      <div className="hero-actions">
        <a className="btn btn-primary" href="#programme">
          See the observation nights
        </a>
        <a className="btn btn-ghost" href="#sky">
          Tonight&rsquo;s conditions
        </a>
      </div>
      <dl className="hero-stats">
        {[
          ['21.94', 'mag / arcsec² zenithal'],
          ['0.82″', 'median seeing, FWHM'],
          ['312', 'clear nights per year'],
          ['2 940 m', 'above sea level'],
        ].map(([v, k]) => (
          <div key={k}>
            <dt>{v}</dt>
            <dd>{k}</dd>
          </div>
        ))}
      </dl>
      <div className="scroll-hint">
        <span>Scroll</span>
        <i />
      </div>
    </section>
  )
}

function Programme() {
  return (
    <section className="section" id="programme">
      <div className="section-head" data-reveal>
        <p className="label">01 — Observation nights</p>
        <h2>Three ways to spend the dark hours.</h2>
        <p className="section-lede">
          Every night runs on the same principle: the sky decides. We publish a target plan at dinner,
          re-cut it against the all-sky camera at twilight, and refund in full whenever cloud wins.
        </p>
      </div>

      <div className="cards">
        {programmes.map((p, i) => (
          <article
            key={p.code}
            className={p.featured ? 'card card-featured' : 'card'}
            data-reveal
            style={{ transitionDelay: `${i * 90}ms` }}
          >
            <header>
              <span className="code">{p.code}</span>
              {p.featured && <span className="tag">Most booked</span>}
            </header>
            <h3>{p.name}</h3>
            <p className="duration">{p.duration}</p>
            <p className="price">
              {p.price} <span>/ person</span>
            </p>
            <p className="blurb">{p.blurb}</p>
            <ul>
              {p.includes.map((inc) => (
                <li key={inc}>{inc}</li>
              ))}
            </ul>
            <a className={p.featured ? 'btn btn-primary' : 'btn btn-ghost'} href="#visit">
              Check availability
            </a>
          </article>
        ))}
      </div>

      <p className="footnote" data-reveal>
        New-moon windows are released ninety days ahead. Nights lost to cloud, wind above 90 km/h or
        humidity above 85 % are refunded in full — we do not reschedule you into a worse sky.
      </p>
    </section>
  )
}

function Instruments() {
  return (
    <section className="section" id="instruments">
      <div className="section-head" data-reveal>
        <p className="label">02 — Instrumentation</p>
        <h2>One good telescope, kept in collimation.</h2>
        <p className="section-lede">
          The optical train is deliberately small and deliberately maintained. Collimation is checked
          on a Ronchi screen every fortnight; the primary was recoated in March 2025 and holds 96 %
          reflectivity at 550 nm.
        </p>
      </div>

      <div className="specs">
        {instruments.map((block, i) => (
          <div className="spec-block" key={block.group} data-reveal style={{ transitionDelay: `${i * 80}ms` }}>
            <h3>{block.group}</h3>
            <dl>
              {block.rows.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  )
}

function Sky() {
  const max = Math.max(...clearNights.map(([, n]) => n))
  return (
    <section className="section" id="sky">
      <div className="section-head" data-reveal>
        <p className="label">03 — Sky conditions</p>
        <h2>Tonight at Cerro Vela.</h2>
        <p className="section-lede">
          Sampled every sixty seconds from the site all-sky camera, a Boltwood Cloud Sensor III and the
          differential image-motion monitor on the north pier.
        </p>
      </div>

      <div className="sky-grid">
        <div className="panel readouts" data-reveal>
          <div className="panel-head">
            <span className="live">
              <i /> Live
            </span>
            <span className="stamp">Last sample 21:47 CLT</span>
          </div>
          <ul>
            {conditions.map((c) => (
              <li key={c.label}>
                <span className="rl">{c.label}</span>
                <span className="rv">{c.value}</span>
                <span className="rmeter">
                  <i style={{ width: `${Math.round(c.fill * 100)}%` }} />
                </span>
                <span className="rn">{c.note}</span>
              </li>
            ))}
          </ul>
          <p className="verdict">
            <b>Verdict — photometric.</b> Narrowband and broadband both viable; the 0.7 m is queued on
            NGC 3372 until meridian flip at 01:12.
          </p>
        </div>

        <div className="panel chart" data-reveal style={{ transitionDelay: '90ms' }}>
          <h3>Clear nights by month</h3>
          <p className="chart-note">Ten-year mean, nights with &gt; 6 h of usable sky</p>
          <div className="bars">
            {clearNights.map(([m, n], i) => (
              <div className="bar" key={`${m}-${i}`}>
                <i style={{ height: `${Math.round((n / max) * 100)}%` }} />
                <span className="bv">{n}</span>
                <span className="bm">{m}</span>
              </div>
            ))}
          </div>
          <div className="chart-foot">
            <span>Driest run: Sep — Dec</span>
            <span>312 nights / yr</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function Visit() {
  return (
    <section className="section" id="visit">
      <div className="cta panel" data-reveal>
        <div className="cta-copy">
          <p className="label">04 — Visit</p>
          <h2>Book a dark window.</h2>
          <p className="section-lede">
            The road from Los Andes takes two hours and forty minutes; the last forty are gravel. We
            collect guests at 15:00 so everyone is on the mountain, fed and dark-adapted before the sun
            goes down.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#visit">
              Request a night
            </a>
            <a className="btn btn-ghost" href="#programme">
              Compare programmes
            </a>
          </div>
        </div>
        <ul className="windows">
          {windows.map((w) => (
            <li key={w.dates}>
              <div>
                <strong>{w.dates}</strong>
                <em>{w.moon}</em>
              </div>
              <span className={w.status === 'Open' ? 'pill open' : 'pill'}>{w.status}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <p className="mark-sm">Vela Observatory</p>
          <p className="dim">
            Ruta G-21, km 38
            <br />
            Región de Valparaíso, Chile
            <br />
            32°47′14″ S · 70°16′03″ W · 2 940 m
          </p>
        </div>
        <div>
          <p className="label">Programme</p>
          <a href="#programme">First Light</a>
          <a href="#programme">Deep Field</a>
          <a href="#programme">Residency</a>
          <a href="#visit">School &amp; group nights</a>
        </div>
        <div>
          <p className="label">Site</p>
          <a href="#instruments">Instrumentation</a>
          <a href="#sky">Sky conditions</a>
          <a href="#sky">All-sky camera</a>
          <a href="#visit">Getting here</a>
        </div>
        <div>
          <p className="label">Contact</p>
          <a href="#visit">nights@vela-observatory.cl</a>
          <a href="#visit">+56 34 000 0000</a>
          <p className="dim">Office hours 10:00 – 17:00 CLT</p>
        </div>
      </div>
      <div className="footer-bar">
        <span>© 2026 Vela Observatory · A fictional site, built for demonstration</span>
        <span className="mono">Dark-sky ordinance compliant · 3 000 K, fully shielded</span>
      </div>
    </footer>
  )
}

export default function App() {
  useEffect(() => {
    const stopViewport = initViewportTracking()
    const stopReveal = initReveal()
    return () => {
      stopViewport()
      stopReveal()
    }
  }, [])

  return (
    <>
      <Backdrop />
      <div className="page">
        <Nav />
        <main>
          <Hero />
          <Programme />
          <Instruments />
          <Sky />
          <Visit />
        </main>
        <Footer />
      </div>
    </>
  )
}
