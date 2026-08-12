import { Reveal } from './Reveal'

const pieces = [
  {
    name: 'Solstice Solitaire',
    spec: '2.04 ct round brilliant · platinum 950',
    price: '€48,500',
    note: 'Seventy-nine facets cut to a 41.2° pavilion angle — half a degree shallower than the book asks for, which is what gives it that long flash across a dinner table.',
  },
  {
    name: 'Aurore Pendant',
    spec: '1.12 ct emerald cut · 18k yellow gold',
    price: '€21,800',
    note: 'Hung from a box chain drawn by hand at 0.6 mm, fine enough that at arm’s length the stone appears to be resting on the collarbone unaided.',
  },
  {
    name: 'Cordé Bracelet',
    spec: '0.86 ct total · braided white gold',
    price: '€16,400',
    note: 'Three strands twisted over a boxwood jig that has sat on the same bench since 1958. No two bracelets close the same way.',
  },
  {
    name: 'Éclat Studs',
    spec: '0.62 ct matched pair · platinum 950',
    price: '€9,750',
    note: 'Six claws rather than four, filed to a hair under a millimetre, so almost nothing stands between the stone and the light.',
  },
]

const steps = [
  {
    n: '01',
    title: 'Sourcing',
    body: 'Twice a year Camille Rousseau sits in Gaborone and then Antwerp with a loupe and a notebook. We buy rough, never certificates — a stone that photographs well and cuts badly is a stone we have already paid too much for.',
  },
  {
    n: '02',
    title: 'Cleaving',
    body: 'The rough is read for three days before anything touches it: grain, inclusions, the direction the crystal wants to break. The first cut takes four seconds and cannot be undone, which is why it is never rushed.',
  },
  {
    n: '03',
    title: 'Setting',
    body: 'Claws are drawn from wire rather than cast, then bent cold around the girdle. It is slower by a full day per piece and it is the reason our settings do not loosen in the tenth year.',
  },
  {
    n: '04',
    title: 'Finishing',
    body: 'Nine grades of polish, the last applied with rouge and a thumb. Every piece leaves the bench with the maker’s punch inside the shank — a small mark, but someone answers for it.',
  },
]

const stats = [
  { value: '1946', label: 'Founded, rue de la Paix' },
  { value: '79', label: 'Facets per brilliant' },
  { value: '11', label: 'Artisans at the bench' },
  { value: '6', label: 'Weeks per commission' },
]

export function Content() {
  return (
    <div className="site">
      <header className="nav">
        <a className="wordmark" href="#top">
          Lumière<span> Atelier</span>
        </a>
        <nav className="nav-links" aria-label="Main">
          <a href="#collection">Collections</a>
          <a href="#atelier">The Atelier</a>
          <a href="#bespoke">Bespoke</a>
          <a href="#visit">Journal</a>
        </nav>
        <a className="btn btn-ghost nav-cta" href="#visit">
          Book a viewing
        </a>
      </header>

      <section className="hero" id="top">
        <div className="hero-inner">
          <Reveal className="eyebrow">
            <span>Paris — since 1946</span>
          </Reveal>
          <Reveal delay={90}>
            <h1>
              Light, held
              <em> still.</em>
            </h1>
          </Reveal>
          <Reveal delay={180}>
            <p className="lede">
              Seventy-nine years of high jewellery from one first-floor atelier on the rue de la
              Paix. Every stone chosen at the rough, every facet cut by a single pair of hands.
            </p>
          </Reveal>
          <Reveal delay={260} className="hero-actions">
            <>
              <a className="btn btn-solid" href="#collection">
                View the Solstice collection
              </a>
              <a className="btn btn-ghost" href="#visit">
                Book a private viewing
              </a>
            </>
          </Reveal>
        </div>
        <div className="scroll-cue" aria-hidden="true">
          <span>Scroll</span>
          <i />
        </div>
      </section>

      <section className="panel panel-light" id="collection">
        <div className="wrap">
          <Reveal className="eyebrow dark">
            <span>The Solstice Collection · Autumn 2026</span>
          </Reveal>
          <Reveal delay={80}>
            <h2>Four pieces, one rough stone.</h2>
          </Reveal>
          <Reveal delay={140}>
            <p className="intro">
              In March we bought a single 14.6-carat rough from a cooperative outside Serowe. It
              was read, cleaved and cut over eleven weeks into four pieces that share a family
              resemblance you can see across a room — the same faint warmth, the same way of
              throwing light upward.
            </p>
          </Reveal>

          <ul className="pieces">
            {pieces.map((piece, i) => (
              <Reveal as="li" key={piece.name} delay={80 * i} className="piece">
                <article>
                  <h3>{piece.name}</h3>
                  <p className="spec">{piece.spec}</p>
                  <p className="note">{piece.note}</p>
                  <div className="piece-foot">
                    <span className="price">{piece.price}</span>
                    <span className="piece-link">Enquire —</span>
                  </div>
                </article>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="panel panel-atelier" id="atelier">
        <div className="wrap wrap-narrow">
          <Reveal className="eyebrow">
            <span>The Atelier</span>
          </Reveal>
          <Reveal delay={80}>
            <h2>Six weeks at the bench.</h2>
          </Reveal>
          <Reveal delay={140}>
            <p className="intro">
              Nothing here is quick, and very little has changed. The lathe is from 1961, the
              bench pins are older, and the only real concession to the century is better light.
            </p>
          </Reveal>

          <ol className="steps">
            {steps.map((step, i) => (
              <Reveal as="li" key={step.n} delay={70 * i}>
                <span className="step-n">{step.n}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="panel panel-stats" id="bespoke">
        <div className="wrap">
          <dl className="stats">
            {stats.map((stat, i) => (
              <Reveal key={stat.label} delay={60 * i} className="stat">
                <>
                  <dt>{stat.value}</dt>
                  <dd>{stat.label}</dd>
                </>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      <section className="panel panel-cta" id="visit">
        <div className="wrap wrap-narrow center">
          <Reveal className="eyebrow">
            <span>Bespoke &amp; private viewing</span>
          </Reveal>
          <Reveal delay={80}>
            <h2>
              The salon holds six.
              <em> Come slowly.</em>
            </h2>
          </Reveal>
          <Reveal delay={150}>
            <p className="intro">
              We open the first-floor salon one afternoon at a time: coffee, a loupe, a tray of
              stones, and as long as you need with them. Commissions begin with that conversation
              and nothing is drawn until you have held the rough.
            </p>
          </Reveal>
          <Reveal delay={220} className="cta-actions">
            <>
              <a className="btn btn-solid" href="#visit">
                Request an appointment
              </a>
              <span className="cta-meta">Tuesday–Saturday · 11h–18h · +33 1 42 61 08 14</span>
            </>
          </Reveal>
        </div>
      </section>

      <footer className="footer">
        <div className="wrap footer-grid">
          <div className="footer-brand">
            <span className="wordmark">
              Lumière<span> Atelier</span>
            </span>
            <p>
              14 rue de la Paix
              <br />
              75002 Paris, France
            </p>
          </div>
          <div>
            <h4>Maison</h4>
            <a href="#atelier">Our story</a>
            <a href="#atelier">The bench</a>
            <a href="#collection">Journal</a>
            <a href="#visit">Careers</a>
          </div>
          <div>
            <h4>Services</h4>
            <a href="#bespoke">Bespoke commissions</a>
            <a href="#bespoke">Resizing &amp; repair</a>
            <a href="#bespoke">Restoration</a>
            <a href="#bespoke">Valuation</a>
          </div>
          <div>
            <h4>Visit</h4>
            <a href="#visit">Book a viewing</a>
            <a href="#visit">Tue–Sat, 11h–18h</a>
            <a href="#visit">+33 1 42 61 08 14</a>
            <a href="#visit">salon@lumiere-atelier.fr</a>
          </div>
        </div>
        <div className="wrap footer-legal">
          <span>© 1946–2026 Lumière Atelier SARL</span>
          <span>Responsible sourcing · Kimberley Process · RJC member</span>
        </div>
      </footer>
    </div>
  )
}
