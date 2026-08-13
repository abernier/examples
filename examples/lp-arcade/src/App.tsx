import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Scene } from './scene/Scene'
import { machines, rates, steps, tickerItems } from './data'

const tagClass: Record<string, string> = {
  'in stock': 'tag',
  'on hold': 'tag tag--hold',
  'just sold': 'tag tag--sold',
}

export default function App() {
  const hero = useRef<HTMLDivElement>(null)
  const [running, setRunning] = useState(true)

  // Stop rendering the hero entirely once it scrolls out of view.
  useEffect(() => {
    const el = hero.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setRunning(entry.isIntersecting), {
      threshold: 0,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Cheap scroll reveals.
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.reveal'))
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in')
            io.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.12 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <>
      <header className="nav">
        <div className="shell nav__inner">
          <a className="brand" href="#top">
            <span className="brand__mark" aria-hidden="true" />
            Neon Cabinet Co.
          </a>
          <nav className="nav__links">
            <a href="#stock">In stock</a>
            <a href="#restoration">Restoration</a>
            <a href="#rates">Rates</a>
            <a href="#visit">Visit</a>
          </nav>
          <a className="btn" href="#visit">
            Book a bench slot
          </a>
        </div>
      </header>

      <main id="top">
        {/* ------------------------------ hero ------------------------------ */}
        <section className="hero" ref={hero}>
          <Canvas
            className="hero__canvas"
            style={{ position: 'absolute', inset: 0 }}
            shadows
            frameloop={running ? 'always' : 'never'}
            dpr={[1, 1.75]}
            gl={{ antialias: false, powerPreference: 'high-performance' }}
            camera={{ position: [0, 1.5, 8], fov: 38, near: 0.5, far: 140 }}
          >
            <Suspense fallback={null}>
              <Scene />
            </Suspense>
          </Canvas>

          <div className="hero__scrim" />

          <div className="hero__overlay">
            <div className="shell">
              <div className="hero__copy">
                <p className="eyebrow">Est. 1994 · SE Portland, Oregon</p>
                <h1>
                  <span className="neon">Press start</span>
                  <span className="neon--cyan neon">on a real cabinet</span>
                </h1>
                <p className="hero__lead">
                  We buy tired arcade machines, take them apart down to the last leaf switch, and
                  send them back out glowing. Every cabinet on our floor has been recapped,
                  reconverged, burned in for seventy-two hours and warrantied for a year.
                </p>
                <div className="hero__cta">
                  <a className="btn" href="#stock">
                    See what's on the floor
                  </a>
                  <a className="btn btn--ghost" href="#restoration">
                    Restore my machine
                  </a>
                </div>
                <div className="hero__stats">
                  <div>
                    <b>612</b>
                    cabinets restored
                  </div>
                  <div>
                    <b>31 yrs</b>
                    on the same block
                  </div>
                  <div>
                    <b>72 hr</b>
                    burn-in, every unit
                  </div>
                  <div>
                    <b>12 mo</b>
                    parts &amp; labour
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="hero__hint">Move your mouse · scroll for stock</p>
        </section>

        {/* ------------------------------ ticker ------------------------------ */}
        <div className="ticker" aria-hidden="true">
          <div className="ticker__track">
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <span key={i}>
                <i>◆</i>
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* ------------------------------ stock ------------------------------ */}
        <section className="band" id="stock">
          <div className="shell">
            <div className="head reveal">
              <div>
                <p className="eyebrow">Currently on the floor</p>
                <h2>
                  Six machines,
                  <br />
                  all plugged in
                </h2>
              </div>
              <p>
                Everything listed here is standing in the showroom right now, powered on and
                playable. Come lean on it for an hour before you decide — we'll bring you a coffee.
              </p>
            </div>

            <div className="grid">
              {machines.map((m) => (
                <article
                  className="card reveal"
                  key={m.name}
                  style={
                    {
                      '--accent': m.accent,
                      '--accent2': m.accent2,
                    } as React.CSSProperties
                  }
                >
                  <span className={tagClass[m.status]}>{m.status}</span>
                  <div className="card__screen">
                    <b>{m.name}</b>
                  </div>
                  <div className="card__body">
                    <p className="card__meta">
                      {m.year} · {m.kind}
                    </p>
                    <h3>{m.name}</h3>
                    <p>{m.blurb}</p>
                    <ul className="spec">
                      {m.specs.map(([k, v]) => (
                        <li key={k}>
                          <span>{k}</span>
                          <span>{v}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="card__foot">
                      <div className="price">
                        {m.price}
                        <small>delivered &amp; levelled</small>
                      </div>
                      <a className="btn btn--ghost" href="#visit">
                        {m.status === 'just sold' ? 'Find me one' : 'Reserve'}
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------ restoration ------------------------------ */}
        <section className="band band--alt" id="restoration">
          <div className="shell split">
            <div className="prose reveal">
              <p className="eyebrow eyebrow--magenta">The workshop</p>
              <h2 style={{ fontSize: 'clamp(32px,4.4vw,54px)', marginBottom: 22 }}>
                Your machine,
                <br />
                back from the dead
              </h2>
              <p>
                Two benches, four techs, an oscilloscope older than most of the staff. We do
                component-level board repair, CRT work and cabinet carpentry under one roof, which
                means nothing gets shipped off to a third party and nothing gets lost for six months.
              </p>
              <p>
                If it powers up we'll tell you what it needs. If it doesn't, we'll tell you that too
                — honestly, and in writing, before you spend a dollar.
              </p>
              <ol className="steps">
                {steps.map((s) => (
                  <li key={s.title}>
                    <h3>{s.title}</h3>
                    <p>{s.body}</p>
                  </li>
                ))}
              </ol>
            </div>

            <aside className="panel reveal" id="rates">
              <p className="eyebrow">Bench rates</p>
              <h3>What things cost</h3>
              <ul className="rate">
                {rates.map(([label, price]) => (
                  <li key={label}>
                    <span>{label}</span>
                    <b>{price}</b>
                  </li>
                ))}
              </ul>
              <p className="note">
                Quotes are fixed once the condition report is signed off — if we're wrong about the
                hours, that's our problem, not yours. Rush turnaround (5 working days) adds 30%.
                Pickup inside the Portland metro is free for jobs over $400.
              </p>
              <div style={{ marginTop: 26 }}>
                <a className="btn" href="#visit">
                  Book a bench slot
                </a>
              </div>
            </aside>
          </div>
        </section>

        {/* ------------------------------ quote ------------------------------ */}
        <section className="band">
          <div className="shell quote reveal">
            <p className="neon--cyan neon">
              “They found a cracked trace on a board three other shops had written off. It's been
              running in my bar every night since.”
            </p>
            <cite>Dana Whitlock · The Long Play, Southeast Belmont</cite>
          </div>
        </section>

        {/* ------------------------------ CTA ------------------------------ */}
        <section className="cta" id="visit">
          <div className="shell">
            <h2 className="neon">Come play before you pay</h2>
            <p>
              The showroom is open Tuesday to Sunday, noon till ten. No appointment needed to play —
              book ahead only if you're dropping a machine off.
            </p>
            <div className="cta__row">
              <a className="btn" href="tel:+15035550142">
                Call (503) 555-0142
              </a>
              <a className="btn btn--ghost" href="mailto:bench@neoncabinet.co">
                bench@neoncabinet.co
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="shell">
          <div className="foot">
            <div className="foot__about">
              <a className="brand" href="#top">
                <span className="brand__mark" aria-hidden="true" />
                Neon Cabinet Co.
              </a>
              <p>
                Restored arcade cabinets, pinball machines and board-level repair. Same corner since
                1994.
              </p>
            </div>
            <div>
              <h4>Showroom</h4>
              <ul>
                <li>118 SE Dunbar St, Unit 4</li>
                <li>Portland, OR 97214</li>
                <li>Tue–Sun · 12:00–22:00</li>
                <li>Mon · bench only</li>
              </ul>
            </div>
            <div>
              <h4>Shop</h4>
              <ul>
                <li>
                  <a href="#stock">In stock</a>
                </li>
                <li>
                  <a href="#restoration">Restoration</a>
                </li>
                <li>
                  <a href="#rates">Bench rates</a>
                </li>
                <li>
                  <a href="#visit">Sell us a cabinet</a>
                </li>
              </ul>
            </div>
            <div>
              <h4>Contact</h4>
              <ul>
                <li>
                  <a href="tel:+15035550142">(503) 555-0142</a>
                </li>
                <li>
                  <a href="mailto:bench@neoncabinet.co">bench@neoncabinet.co</a>
                </li>
                <li>Parts counter ext. 2</li>
              </ul>
            </div>
          </div>
          <div className="legal">
            <span>© {new Date().getFullYear()} Neon Cabinet Co. · CCB #204118</span>
            <span>Insert coin to continue</span>
          </div>
        </div>
      </footer>
    </>
  )
}
