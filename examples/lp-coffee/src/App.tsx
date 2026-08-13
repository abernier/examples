import { Suspense, lazy, useEffect, useState } from "react";
import { ORIGINS, PLANS, ROAST_LABELS, STEPS } from "./data";
import { useOnScreen } from "./useOnScreen";
import "./styles.css";

const HeroScene = lazy(() => import("./three/HeroScene"));
const RoastScene = lazy(() => import("./three/RoastScene"));

/* -------------------------------------------------------------------- nav */

function Nav() {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`nav${solid ? " nav--solid" : ""}`}>
      <a className="nav__brand" href="#top">
        <span className="nav__mark" aria-hidden="true" />
        <span>
          Ember <em>&amp;</em> Origin
        </span>
      </a>
      <nav className="nav__links">
        <a href="#origins">Origins</a>
        <a href="#roasting">Roasting</a>
        <a href="#subscribe">Subscribe</a>
        <a href="#visit">Visit</a>
      </nav>
      <a className="nav__cart" href="#subscribe">
        Bag <span>(0)</span>
      </a>
    </header>
  );
}

/* ------------------------------------------------------------------- hero */

function Hero() {
  const [ref, visible] = useOnScreen<HTMLElement>("120px");

  return (
    <section className="hero" id="top" ref={ref}>
      <div className="hero__canvas">
        <Suspense fallback={null}>
          <HeroScene active={visible} />
        </Suspense>
      </div>
      <div className="hero__veil" aria-hidden="true" />

      <div className="hero__copy">
        <p className="eyebrow">Est. 2016 · Hood River, Oregon</p>
        <h1>
          Every cup keeps
          <br />
          the <em>address</em> it
          <br />
          came from.
        </h1>
        <p className="hero__lede">
          We buy whole lots from fourteen producing partners, roast them twelve
          kilos at a time on a 1962 Probat, and ship within forty-eight hours of
          the cooling tray. Nothing sits. Nothing blends away.
        </p>
        <div className="hero__actions">
          <a className="btn btn--solid" href="#origins">
            Shop single origins
          </a>
          <a className="btn btn--ghost" href="#subscribe">
            Build a subscription
          </a>
        </div>
        <p className="hero__hint">
          <span className="dot" /> Move your cursor through the beans
        </p>
      </div>

      <ul className="hero__stats">
        <li>
          <strong>14</strong>producing partners
        </li>
        <li>
          <strong>12 kg</strong>batch size
        </li>
        <li>
          <strong>48 h</strong>roast to doorstep
        </li>
        <li>
          <strong>100%</strong>price transparency
        </li>
      </ul>
    </section>
  );
}

/* ---------------------------------------------------------------- origins */

function Origins() {
  return (
    <section className="origins" id="origins">
      <div className="section-head">
        <p className="eyebrow eyebrow--dark">The lineup · Autumn 2026</p>
        <h2>Four coffees on the shelf this week</h2>
        <p className="section-head__lede">
          Each one is a single farm or a single washing station, never a blend.
          When a lot runs out we take it down rather than substitute — which is
          why this list is short and why it changes.
        </p>
      </div>

      <div className="origin-grid">
        {ORIGINS.map((o) => (
          <article className="origin" key={o.id}>
            <div className="origin__top">
              <span className="origin__country">{o.country}</span>
              <span className="pill">{o.process}</span>
            </div>
            <h3>{o.farm}</h3>
            <p className="origin__region">{o.region}</p>
            <p className="origin__blurb">{o.blurb}</p>
            <ul className="origin__notes">
              {o.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            <dl className="origin__specs">
              <div>
                <dt>Altitude</dt>
                <dd>{o.altitude}</dd>
              </div>
              <div>
                <dt>Varietal</dt>
                <dd>{o.varietal}</dd>
              </div>
            </dl>
            <div className="origin__buy">
              <span className="origin__price">
                {o.price} <small>/ 340 g</small>
              </span>
              <button type="button" className="btn btn--small">
                Add to bag
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- roasting */

function Roasting() {
  const [roast, setRoast] = useState(0.55);
  const [ref, visible] = useOnScreen<HTMLDivElement>("160px");

  const index = Math.min(
    ROAST_LABELS.length - 1,
    Math.round(roast * (ROAST_LABELS.length - 1)),
  );
  const label = ROAST_LABELS[index];
  const development = (14 + roast * 12).toFixed(1);
  const drop = Math.round(196 + roast * 32);

  return (
    <section className="roasting" id="roasting">
      <div className="section-head section-head--light">
        <p className="eyebrow">Inside the roastery</p>
        <h2>The roast, in four moves</h2>
        <p className="section-head__lede">
          There is no proprietary anything here. The whole method is four
          decisions made slowly, by people who have to drink the result.
        </p>
      </div>

      <div className="roast-layout">
        <ol className="steps">
          {STEPS.map((s) => (
            <li key={s.n}>
              <span className="steps__n">{s.n}</span>
              <div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="roast-panel" ref={ref}>
          <div className="roast-panel__canvas">
            <Suspense fallback={null}>
              <RoastScene roast={roast} active={visible} />
            </Suspense>
          </div>
          <div className="roast-panel__ui">
            <div className="roast-panel__readout">
              <h3>{label.name}</h3>
              <p>{label.detail}</p>
            </div>
            <label className="slider">
              <span className="slider__label">Drag the roast</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={roast}
                onChange={(e) => setRoast(parseFloat(e.target.value))}
                aria-label="Roast level"
              />
            </label>
            <dl className="roast-panel__meta">
              <div>
                <dt>Development</dt>
                <dd>{development}%</dd>
              </div>
              <div>
                <dt>Drop temp</dt>
                <dd>{drop} °C</dd>
              </div>
              <div>
                <dt>Batch</dt>
                <dd>12 kg</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- subscribe */

function Subscribe() {
  return (
    <section className="subscribe" id="subscribe">
      <div className="section-head">
        <p className="eyebrow eyebrow--dark">Standing order</p>
        <h2>Coffee that arrives before you notice it is gone</h2>
        <p className="section-head__lede">
          Roasted the morning it ships. Skip, pause, swap the grind or change
          the address from one link in every email — no account required.
        </p>
      </div>

      <div className="plans">
        {PLANS.map((p) => (
          <article
            className={`plan${p.featured ? " plan--featured" : ""}`}
            key={p.name}
          >
            {p.featured && <span className="plan__flag">Most chosen</span>}
            <h3>{p.name}</h3>
            <p className="plan__price">
              {p.price} <small>{p.cadence}</small>
            </p>
            <p className="plan__detail">{p.detail}</p>
            <ul>
              {p.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <button
              type="button"
              className={`btn ${p.featured ? "btn--solid" : "btn--outline"}`}
            >
              Start this plan
            </button>
          </article>
        ))}
      </div>

      <p className="subscribe__note">
        Free shipping on orders over $35 · Cancel in one click · Roast date on
        every bag
      </p>
    </section>
  );
}

/* ----------------------------------------------------------------- footer */

function Footer() {
  return (
    <footer className="footer" id="visit">
      <div className="footer__top">
        <div className="footer__brand">
          <span className="nav__mark" aria-hidden="true" />
          <p className="footer__wordmark">
            Ember <em>&amp;</em> Origin
          </p>
          <p className="footer__pitch">
            A twelve-kilo roastery and a six-stool bar on Oak Street. Doors open
            at seven, cupping table open to anyone on Friday at ten.
          </p>
        </div>

        <div className="footer__cols">
          <div>
            <h4>Coffee</h4>
            <a href="#origins">Single origins</a>
            <a href="#subscribe">Subscriptions</a>
            <a href="#roasting">Roast profiles</a>
            <a href="#origins">Wholesale</a>
          </div>
          <div>
            <h4>Roastery</h4>
            <a href="#roasting">Our sourcing</a>
            <a href="#roasting">Price transparency</a>
            <a href="#visit">Journal</a>
            <a href="#visit">Careers</a>
          </div>
          <div>
            <h4>Visit</h4>
            <p>1204 Oak Street</p>
            <p>Hood River, OR 97031</p>
            <p>Mon–Fri 7–4 · Sat 8–3</p>
            <p>hello@emberandorigin.com</p>
          </div>
        </div>

        <form
          className="footer__signup"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <h4>The Friday cupping list</h4>
          <p>What we tasted, what scored, what is about to sell out.</p>
          <div className="footer__field">
            <input type="email" placeholder="you@example.com" aria-label="Email" />
            <button type="submit" className="btn btn--small btn--solid">
              Join
            </button>
          </div>
        </form>
      </div>

      <div className="footer__bar">
        <p>© 2026 Ember &amp; Origin Coffee Roasters</p>
        <p>Roasted on ancestral Wasco and Wishram land</p>
      </div>
    </footer>
  );
}

/* -------------------------------------------------------------------- app */

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Origins />
        <Roasting />
        <Subscribe />
      </main>
      <Footer />
    </>
  );
}
