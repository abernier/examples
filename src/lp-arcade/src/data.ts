export type Status = 'in stock' | 'on hold' | 'just sold'

export type Machine = {
  name: string
  year: string
  kind: string
  blurb: string
  price: string
  status: Status
  accent: string
  accent2: string
  specs: [string, string][]
}

export const machines: Machine[] = [
  {
    name: 'Nebula Strike',
    year: '1981',
    kind: 'Upright · 1P/2P alternating',
    blurb:
      'The cabinet that put our workshop on the map. Pulled out of a Eugene bowling alley in 2019, stripped to bare wood and rebuilt over eleven weeks.',
    price: '$3,450',
    status: 'in stock',
    accent: '#00f0ff',
    accent2: '#6bff8f',
    specs: [
      ['Monitor', '19" Wells-Gardner K4600, recapped'],
      ['Controls', 'Leaf-switch 4-way, new harness'],
      ['Art', 'Reproduction side art + NOS bezel'],
      ['Warranty', '12 months, parts & labour'],
    ],
  },
  {
    name: 'Turbo Circuit',
    year: '1986',
    kind: 'Sit-down racer · force-feedback wheel',
    blurb:
      'A full sit-down with the original moulded seat, rebuilt wheel motor and a gearbox that finally clunks the way it should. Loud, in the best way.',
    price: '$5,900',
    status: 'in stock',
    accent: '#ff2d95',
    accent2: '#ffc700',
    specs: [
      ['Monitor', '25" horizontal, new flyback'],
      ['Controls', 'Rebuilt FFB wheel + 2-pedal set'],
      ['Audio', '2×20W amp, refoamed 6.5" drivers'],
      ['Warranty', '12 months, parts & labour'],
    ],
  },
  {
    name: 'Kraken Cove',
    year: '1983',
    kind: 'Cocktail table · 2P head-to-head',
    blurb:
      'Low-slung cocktail cabinet with a fresh tempered glass top and a flip-screen board that actually flips. Fits under a low ceiling and a low budget.',
    price: '$2,800',
    status: 'on hold',
    accent: '#6bff8f',
    accent2: '#00f0ff',
    specs: [
      ['Monitor', '19" vertical, re-yoked'],
      ['Controls', '8-way + 2 buttons per side'],
      ['Cabinet', 'New laminate, original trim'],
      ['Warranty', '12 months, parts & labour'],
    ],
  },
  {
    name: 'Pixel Punch II',
    year: '1991',
    kind: 'Upright · 4-player',
    blurb:
      'Four sets of controls, four sets of opinions. New Sanwa sticks and a control panel overlay printed from a scan of an unfaded original.',
    price: '$4,200',
    status: 'in stock',
    accent: '#ffc700',
    accent2: '#ff2d95',
    specs: [
      ['Monitor', '25" horizontal, converged'],
      ['Controls', '4× 8-way Sanwa, 24 buttons'],
      ['Board', 'Reflowed, battery-free conversion'],
      ['Warranty', '12 months, parts & labour'],
    ],
  },
  {
    name: 'Vector Runner',
    year: '1980',
    kind: 'Upright · true vector monitor',
    blurb:
      'A genuine XY monitor with rebuilt deflection board — no scanlines, just glass-sharp glowing lines. Rare, fussy, and worth every hour we put into it.',
    price: '$6,100',
    status: 'in stock',
    accent: '#b45cff',
    accent2: '#00f0ff',
    specs: [
      ['Monitor', 'Amplifone XY, rebuilt deflection'],
      ['Controls', 'Original 2-way + 5 buttons'],
      ['Extras', 'Spare deflection board included'],
      ['Warranty', '6 months (vector monitor terms)'],
    ],
  },
  {
    name: 'Midnight Motel',
    year: '1989',
    kind: 'Pinball · solid state',
    blurb:
      'Full shop job: new rubbers, rebuilt flippers, polished playfield, LED-converted GI. Plays fast and the multiball still ruins friendships.',
    price: '$7,400',
    status: 'just sold',
    accent: '#ff2d95',
    accent2: '#b45cff',
    specs: [
      ['Playfield', 'Stripped, cleaned, waxed'],
      ['Mechs', 'All coils & flippers rebuilt'],
      ['Display', 'New plasma-style DMD'],
      ['Warranty', '12 months, parts & labour'],
    ],
  },
]

export const tickerItems = [
  'Now on the floor — Vector Runner, 1980',
  'Free delivery inside the Portland metro',
  'Bench slots open week of the 24th',
  'We buy dead cabinets — any condition',
  'Open Tue–Sun, noon till 10pm',
  'Trade-ins welcome',
]

export const steps = [
  {
    title: 'Intake & diagnosis',
    body: 'You drop it off or we collect it. We photograph everything, meter the PSU, and send you a written condition report inside three business days.',
  },
  {
    title: 'Board & monitor work',
    body: 'Full recap, socketed ROMs, battery removal, and CRT rejuvenation on the bench. We repair at component level — no swapping boards and hoping.',
  },
  {
    title: 'Cabinet & art',
    body: 'Water damage cut out and scarfed in, T-molding replaced, side art reprinted from high-resolution scans, control panel overlays cut in-house.',
  },
  {
    title: 'Burn-in & handover',
    body: 'Seventy-two hours of continuous burn-in before anything leaves the shop, then delivery, levelling and a walkthrough of the service menu.',
  },
]

export const rates: [string, string][] = [
  ['Diagnostic + written report', '$85'],
  ['Board recap & repair (per board)', 'from $180'],
  ['CRT rejuvenation & convergence', 'from $240'],
  ['Cap kit + flyback replacement', 'from $310'],
  ['Side art reproduction (pair)', 'from $420'],
  ['Full restoration', 'from $1,900'],
]
