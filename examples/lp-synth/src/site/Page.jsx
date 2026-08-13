import { CATALOGUE } from '../rack/layout'

// The DOM catalogue reads the same data the rack is built from — the panels on
// screen and the rows in the table are never out of sync.
const SHELF = ['VCO-3340', 'VCF-LADDER', 'SEQ-8', 'ADSR-2', 'FOLD-9', 'QNT-12']
const ROWS = SHELF.map((id) => CATALOGUE.find((m) => m.id === id)).filter(Boolean)

export default function Page({ scroll }) {
  return (
    <>
      <header className="topbar">
        <a className="brand" href="#top">
          <span className="brand-mark" aria-hidden="true" />
          RACKWERK
        </a>
        <nav>
          <a href="#catalogue">Modules</a>
          <a href="#catalogue">Cases</a>
          <a href="#bench">Workshop</a>
          <a className="pill" href="#bench">
            Configure
          </a>
        </nav>
      </header>

      <main
        className="scroll"
        onScroll={(e) => {
          const el = e.target
          scroll.current = el.scrollTop / (el.scrollHeight - el.clientHeight)
        }}
      >
        <section className="panel hero" id="top">
          <p className="eyebrow">Berlin · Ritterstraße 12 · since 2011</p>
          <h1>
            Modules that stay
            <br />
            in tune when the
            <br />
            room gets hot.
          </h1>
          <p className="lede">
            Analogue voice modules, built forty at a time on a bench, tempco-matched and burned in for
            seventy-two hours before they get a serial number.
          </p>
          <div className="actions">
            <a className="pill solid" href="#bench">
              Configure a case
            </a>
            <a className="ghost" href="#catalogue">
              See the catalogue ↓
            </a>
          </div>
          <dl className="stats">
            <div>
              <dt>104 HP</dt>
              <dd>two-row case</dd>
            </div>
            <div>
              <dt>±12 V</dt>
              <dd>4 A busboard</dd>
            </div>
            <div>
              <dt>72 h</dt>
              <dd>burn-in per unit</dd>
            </div>
            <div>
              <dt>5 yr</dt>
              <dd>bench warranty</dd>
            </div>
          </dl>
        </section>

        <section className="panel catalogue" id="catalogue">
          <h2>On the shelf this week</h2>
          <p className="section-lede">
            Every panel is 2 mm brushed aluminium, screened in two passes. Current draw is measured on the
            finished unit, not copied off the schematic.
          </p>
          <table>
            <thead>
              <tr>
                <th>Module</th>
                <th>Function</th>
                <th className="num">HP</th>
                <th className="num">mA</th>
                <th className="num">Depth</th>
                <th className="num">Price</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((m) => (
                <tr key={m.id}>
                  <td className="id">{m.id}</td>
                  <td>{m.sub}</td>
                  <td className="num">{m.hp}</td>
                  <td className="num">{m.ma}</td>
                  <td className="num">{m.mm} mm</td>
                  <td className="num price">{m.price} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="panel bench" id="bench">
          <div className="card">
            <h2>Build the case, not the wishlist</h2>
            <p>
              Tell us what you already own and what you keep patching around. We lay out the 104 HP, check the
              rail current, and ship the case wired, screwed and labelled.
            </p>
            <div className="cta-row">
              <a className="pill solid big" href="#bench">
                Configure · from 349 €
              </a>
              <span className="fine">
                Powered case, rails, busboard and screws · 6 week lead time · shipped from Berlin
              </span>
            </div>
          </div>
          <footer>
            <span>RACKWERK GmbH — Ritterstraße 12, 10969 Berlin</span>
            <span>Bench open Thu–Sat, 12:00–18:00</span>
          </footer>
        </section>
      </main>
    </>
  )
}
