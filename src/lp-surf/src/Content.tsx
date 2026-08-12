import type { ReactNode } from 'react'
import { jumpToPage } from './scrollBus'

const PACKAGES = [
  {
    name: 'Première Vague',
    tag: 'Discovery',
    price: '€55',
    unit: '2h session',
    copy: 'Your first standing wave, on a soft-top in waist-deep water at Marbella. Everything is provided — you turn up with a towel.',
    points: ['6 students per coach', 'Board + 4/3 wetsuit', 'Ages 8 and up'],
  },
  {
    name: 'Le Stage',
    tag: 'Five days',
    price: '€245',
    unit: '5 × 2h',
    copy: 'Monday to Friday, timed to the tide rather than the clock. By Friday most people are riding the green face and paddling out unassisted.',
    points: ['Same coach all week', 'Ocean-safety morning', 'Video review on day 4'],
    featured: true,
  },
  {
    name: 'Progression',
    tag: 'Intermediate',
    price: '€90',
    unit: '2h coaching',
    copy: 'For surfers already up and riding who want the bottom turn, the duck dive, and a line-up read that saves them twenty minutes a session.',
    points: ['3 students maximum', 'Water and land video', 'Board demo included'],
  },
  {
    name: 'Carte Blanche',
    tag: 'Season pass',
    price: '€430',
    unit: '10 sessions',
    copy: 'Ten sessions to use across the year, any spot, any format. We text you the night before when the forecast is worth getting up for.',
    points: ['Valid 12 months', 'Transferable once', 'Storage for your board'],
  },
]

const COACHES = [
  {
    name: 'Maialen Etcheverry',
    role: 'Head coach · BEESAN',
    bio: 'Grew up on Côte des Basques and spent six seasons on the WQS. Reads a shifting peak faster than anyone we know, and teaches paddling before she teaches standing.',
    years: '18 yrs',
  },
  {
    name: 'Tom Lafourcade',
    role: 'Longboard & shaper',
    bio: 'Shapes single-fins in a workshop behind the school and logs Grande Plage on the small days. If you want to learn to walk the board, he is your man.',
    years: '12 yrs',
  },
  {
    name: 'Iñaki Sarasola',
    role: 'Water safety · kids',
    bio: 'Former SNSM lifeguard. Runs our junior groups and every ocean-safety briefing — rip currents, the Biarritz shore break, and how to get out of both.',
    years: '15 yrs',
  },
]

const SPOTS = [
  {
    name: 'Côte des Basques',
    detail: 'Low tide only',
    copy: 'The birthplace of European surfing, and still the gentlest wave in town. Long, soft, forgiving walls over sand — our beginner classroom for two hours either side of low.',
  },
  {
    name: 'Grande Plage',
    detail: 'All tides',
    copy: 'Right in front of the casino. Punchier and more consistent, with a shifting beach break that rewards a proper paddle. Where the five-day stage usually ends up.',
  },
  {
    name: 'Marbella',
    detail: 'Mid to high',
    copy: 'Ten minutes south, wide open and far quieter. Our fallback when the north swell lights up town, and the calmest water for first-timers.',
  },
  {
    name: 'Ilbarritz',
    detail: 'Small swell',
    copy: 'A mellow point-ish left in front of the golf course. Ideal on the knee-high summer days when everything else has gone flat.',
  },
]

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>
}

export function Content() {
  return (
    <div className="content">
      {/* 1 — hero */}
      <section className="panel panel--hero">
        <div className="hero">
          <Eyebrow>Biarritz · Pays Basque · est. 2004</Eyebrow>
          <h1 className="display">
            Côte Sauvage
            <span className="display__line">Surf</span>
          </h1>
          <p className="lede">
            A surf school on the Basque coast, six students to a coach. We teach the ocean first and
            the pop-up second — because the wave you catch depends on the twenty minutes before it.
          </p>
          <div className="actions">
            <button className="btn btn--primary" type="button" onClick={() => jumpToPage(6)}>
              Book a session
            </button>
            <button className="btn" type="button" onClick={() => jumpToPage(2)}>
              See the packages
            </button>
          </div>
        </div>
        <div className="hero__foot">
          <span className="hint">Scroll to dive</span>
          <span className="hint hint--right">Water 19 °C · SW 1.4 m · Offshore</span>
        </div>
      </section>

      {/* 2 — manifesto */}
      <section className="panel panel--center">
        <div className="col col--narrow">
          <Eyebrow>What we actually teach</Eyebrow>
          <h2>
            Anyone can push you into a wave. We would rather you never needed the push again.
          </h2>
          <p>
            Every session starts on the sand with the forecast, the tide table and where the rip is
            running today. Then two hours in the water, in a group small enough that your coach is
            still watching when your wave arrives. We keep groups at six because seven is the number
            at which people start waiting instead of surfing.
          </p>
          <ul className="stats">
            <li>
              <strong>2004</strong>
              <span>Teaching on this beach since</span>
            </li>
            <li>
              <strong>6</strong>
              <span>Students per coach, hard limit</span>
            </li>
            <li>
              <strong>4</strong>
              <span>Spots within ten minutes</span>
            </li>
            <li>
              <strong>100%</strong>
              <span>State-certified instructors</span>
            </li>
          </ul>
        </div>
      </section>

      {/* 3 — packages */}
      <section className="panel" id="packages">
        <header className="panel__head">
          <Eyebrow>Lessons & packages</Eyebrow>
          <h2>Four ways in. All of them include the board and the wetsuit.</h2>
        </header>
        <div className="grid grid--4">
          {PACKAGES.map((p) => (
            <article key={p.name} className={p.featured ? 'card card--featured' : 'card'}>
              <p className="card__tag">{p.tag}</p>
              <h3>{p.name}</h3>
              <p className="card__price">
                {p.price} <span>{p.unit}</span>
              </p>
              <p className="card__copy">{p.copy}</p>
              <ul className="ticks">
                {p.points.map((pt) => (
                  <li key={pt}>{pt}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* 4 — coaches */}
      <section className="panel" id="coaches">
        <header className="panel__head">
          <Eyebrow>The coaches</Eyebrow>
          <h2>Three people, forty-five winters of this coast between them.</h2>
        </header>
        <div className="grid grid--3">
          {COACHES.map((c) => (
            <article key={c.name} className="card card--coach">
              <div className="avatar" aria-hidden="true">
                <span>{c.name.charAt(0)}</span>
              </div>
              <h3>{c.name}</h3>
              <p className="card__tag">{c.role}</p>
              <p className="card__copy">{c.bio}</p>
              <p className="card__meta">{c.years} coaching</p>
            </article>
          ))}
        </div>
      </section>

      {/* 5 — the spot */}
      <section className="panel" id="spot">
        <header className="panel__head">
          <Eyebrow>The spots</Eyebrow>
          <h2>We move with the tide. You get a text the night before with the meeting point.</h2>
        </header>
        <div className="grid grid--4">
          {SPOTS.map((s) => (
            <article key={s.name} className="card card--spot">
              <h3>{s.name}</h3>
              <p className="card__tag">{s.detail}</p>
              <p className="card__copy">{s.copy}</p>
            </article>
          ))}
        </div>
        <p className="note">
          Best season for beginners: May to October, water 17–22 °C. Winter sessions run in 5/4
          suits for intermediates only, and we are honest with you when the day is not worth it.
        </p>
      </section>

      {/* 6 — included + voices */}
      <section className="panel panel--split">
        <div className="col">
          <Eyebrow>In the price</Eyebrow>
          <h2>Turn up with a towel.</h2>
          <ul className="ticks ticks--lg">
            <li>Board matched to your weight, from 8&apos;0 soft-top to 6&apos;2 shortboard</li>
            <li>Wetsuit, boots and hood through the cold months</li>
            <li>Hot outdoor shower and a locked changing cabin</li>
            <li>Insurance and FFS licence for the week of your stage</li>
            <li>Free re-book if we call the session off for conditions</li>
          </ul>
        </div>
        <div className="col col--quotes">
          <blockquote>
            <p>
              “Third summer in a row. Maialen put me on a proper board this year and I finally
              understood what everyone means by trimming.”
            </p>
            <cite>Clémence R. — Bordeaux</cite>
          </blockquote>
          <blockquote>
            <p>
              “They cancelled our Tuesday because it was a mess out there and moved us to Thursday
              at dawn. Best call anyone made all week.”
            </p>
            <cite>Jon &amp; Aoife M. — Dublin</cite>
          </blockquote>
        </div>
      </section>

      {/* 7 — CTA + footer */}
      <section className="panel panel--cta" id="book">
        <div className="cta">
          <Eyebrow>Ready when the tide is</Eyebrow>
          <h2 className="cta__title">Get in the water this week.</h2>
          <p className="lede">
            Sessions run every day from April to November, 07:30 to 19:00. Tell us your level and
            your dates — we will come back with the two tides that suit you best.
          </p>
          <div className="actions">
            <a className="btn btn--primary" href="mailto:bonjour@cotesauvagesurf.fr">
              bonjour@cotesauvagesurf.fr
            </a>
            <a className="btn" href="tel:+33559000000">
              +33 5 59 00 00 00
            </a>
          </div>
        </div>
        <footer className="footer">
          <div>
            <strong>Côte Sauvage Surf</strong>
            <span>12 rue du Port Vieux, 64200 Biarritz</span>
          </div>
          <div>
            <span>Open daily 07:30 — 19:00, April to November</span>
            <span>École labellisée FFS · SIRET 452 118 903</span>
          </div>
          <div>
            <span>© {new Date().getFullYear()} Côte Sauvage Surf</span>
            <span>Made on the Basque coast</span>
          </div>
        </footer>
      </section>
    </div>
  )
}
