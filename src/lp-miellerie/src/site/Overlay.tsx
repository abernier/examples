const FLORAISONS = [
  {
    name: 'Acacia',
    when: 'Récolte de mai',
    note: 'Limpide, presque incolore. Fleur blanche et sucre de canne. Ne cristallise pas.',
  },
  {
    name: 'Châtaignier',
    when: 'Récolte de juin',
    note: 'Ambre foncé, tannique, une amertume franche en fin de bouche. Le plus typé des quatre.',
  },
  {
    name: 'Lavande',
    when: 'Récolte de juillet',
    note: 'Prend en crème au bout de six semaines. Fin, floral, texture de beurre froid.',
  },
  {
    name: 'Sapin',
    when: 'Récolte d’août',
    note: 'Miellat des hauteurs, sombre et balsamique. Une année sur trois, quand la manne tombe.',
  },
]

export default function Overlay({ scroll }: { scroll: React.RefObject<number> }) {
  return (
    <>
      <header className="topbar">
        <a className="brand" href="#hero">
          <span className="brand-mark" aria-hidden="true" />
          Miellerie du Val Perdu
        </a>
        <nav>
          <a href="#floraisons">Nos miels</a>
          <a href="#floraisons">Le rucher</a>
          <a href="#commander">L’atelier</a>
          <a className="pill" href="#commander">
            Commander
          </a>
        </nav>
      </header>

      <main
        className="scroll"
        onScroll={(e) => {
          const el = e.target as HTMLDivElement
          scroll.current = el.scrollTop / (el.scrollHeight - el.clientHeight)
        }}
      >
        <section className="panel hero" id="hero">
          <p className="eyebrow">Vercors · 1 040 m · depuis 1978</p>
          <h1>
            Le miel, tel que
            <br />
            la ruche l’a écrit.
          </h1>
          <p className="lede">
            Cent quatre-vingts colonies sur les contreforts du Vercors. Récolte à la brosse, extraction à froid,
            jamais chauffé au-delà de 35°. Ce qui sort du pot est ce qui était dans le cadre.
          </p>
          <div className="hero-actions">
            <a className="pill solid" href="#commander">
              Commander la caisse
            </a>
            <a className="ghost" href="#floraisons">
              Les quatre floraisons ↓
            </a>
          </div>
          <dl className="stats">
            <div>
              <dt>180</dt>
              <dd>ruches Dadant</dd>
            </div>
            <div>
              <dt>4</dt>
              <dd>récoltes par an</dd>
            </div>
            <div>
              <dt>35°</dt>
              <dd>jamais dépassés</dd>
            </div>
            <div>
              <dt>0</dt>
              <dd>sirop, jamais</dd>
            </div>
          </dl>
        </section>

        <section className="panel floraisons" id="floraisons">
          <h2>Quatre floraisons, quatre miels</h2>
          <p className="section-lede">
            On ne mélange pas. Chaque hausse est extraite le jour de sa dépose, étiquetée par rucher et par
            semaine — ce qui explique qu’un lot puisse manquer une année entière.
          </p>
          <ul className="cards">
            {FLORAISONS.map((f) => (
              <li key={f.name}>
                <span className="when">{f.when}</span>
                <h3>{f.name}</h3>
                <p>{f.note}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel commander" id="commander">
          <div className="card-cta">
            <h2>La caisse des quatre saisons</h2>
            <p>
              Les quatre miels de l’année, en pots de 500 g, dans une caisse en peuplier du Diois. Expédiée sous
              48 h, ou à retirer à la miellerie le samedi matin.
            </p>
            <div className="cta-row">
              <a className="pill solid big" href="#commander">
                Commander · 62 €
              </a>
              <span className="fine">Port offert dès deux caisses · Récolte 2025, 214 caisses restantes</span>
            </div>
          </div>
          <footer>
            <span>Miellerie du Val Perdu — 26410 Glandage</span>
            <span>SIRET 402 118 774 · Apiculteur récoltant</span>
          </footer>
        </section>
      </main>
    </>
  )
}
