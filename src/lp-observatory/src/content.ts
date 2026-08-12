export type Programme = {
  code: string
  name: string
  duration: string
  price: string
  blurb: string
  includes: string[]
  featured?: boolean
}

export const programmes: Programme[] = [
  {
    code: 'VO-01',
    name: 'First Light',
    duration: '3 h 30 · from astronomical twilight',
    price: '€ 140',
    blurb:
      'A guided naked-eye tour of the southern sky, a binocular sweep through the Carina complex, then ninety minutes at the 20-inch Dobsonian. For anyone who has never watched the Milky Way cast a shadow on the ground.',
    includes: [
      'Dark-adaptation briefing, red torches issued',
      '508 mm f/3.6 Dobsonian, Ethos eyepiece set',
      'Hot mate, alpaca blankets, heated shelter',
      'Eight guests maximum, one guide',
    ],
  },
  {
    code: 'VO-02',
    name: 'Deep Field',
    duration: 'Full night · 21:00 – 05:30',
    price: '€ 390',
    blurb:
      'You choose the target list over dinner; we run the 0.7-metre Ritchey–Chrétien against it until nautical dawn. Calibrated masters and the full sub-frame set are on your drive before you leave the mountain.',
    includes: [
      '0.70 m RC + ASI6200MM Pro, −25 °C setpoint',
      'LRGB plus 3 nm Hα / OIII / SII narrowband',
      'Plate-solving and dither sequencing taught live',
      'Darks, flats and bias frames from the same night',
    ],
    featured: true,
  },
  {
    code: 'VO-03',
    name: 'Residency',
    duration: '3 nights · new-moon window',
    price: '€ 1 480',
    blurb:
      'For astrophotographers working on a project rather than a postcard. A dedicated pier, your own filter train if you bring one, and remote access to the mount for ninety days after you go home.',
    includes: [
      'Private pier, 60 kg instrument payload',
      'Remote desktop access for 90 days post-stay',
      'Processing suite, PixInsight and calibration library',
      'Half board, single room, transfers from Los Andes',
    ],
  },
]

export const instruments: { group: string; rows: [string, string][] }[] = [
  {
    group: 'Optics',
    rows: [
      ['Primary', '0.70 m Ritchey–Chrétien · f/8 · 5 600 mm · Zerodur, 18-point float cell'],
      ['Wide field', '130 mm f/5.4 apochromat on the same pier, dual-rig capable'],
      ['Visual', '508 mm f/3.6 Dobsonian · Paracorr II · 21 / 13 / 8 / 4.7 mm Ethos'],
      ['Solar', 'Lunt LS80MT double-stacked · 0.50 Å Hα · white-light wedge'],
    ],
  },
  {
    group: 'Mount & dome',
    rows: [
      ['Mount', 'Direct-drive alt-azimuth · 0.35″ RMS unguided over 300 s'],
      ['Pointing', '12″ RMS all-sky after a 40-star TPoint model'],
      ['Dome', '4.5 m rotating shell · 1.2 m slit · stable to 90 km/h gusts'],
      ['Pier', 'Isolated concrete to bedrock, 2.4 m below the observing floor'],
    ],
  },
  {
    group: 'Detectors',
    rows: [
      ['Main camera', 'ZWO ASI6200MM Pro · IMX455 · 62 MP · 3.76 µm · 1.5 e⁻ read'],
      ['Filters', 'Astrodon LRGB Gen2 · Hα 3 nm · OIII 3 nm · SII 3 nm'],
      ['Guiding', 'Off-axis, 174 mm mono, 0.6″/px'],
      ['Spectroscopy', 'Shelyak Alpy 600 · R ≈ 600 · 3 700 – 7 500 Å'],
    ],
  },
]

export const conditions: { label: string; value: string; note: string; fill: number }[] = [
  { label: 'Seeing (FWHM)', value: '0.79″', note: 'DIMM, 20-min median', fill: 0.88 },
  { label: 'Transparency', value: '8.4 / 10', note: 'All-sky extinction fit', fill: 0.84 },
  { label: 'Sky brightness', value: '21.94', note: 'mag / arcsec² at zenith', fill: 0.95 },
  { label: 'Relative humidity', value: '14 %', note: 'Dew point −11 °C', fill: 0.86 },
  { label: 'Wind', value: '11 km/h', note: 'NW, gusting 19', fill: 0.79 },
  { label: 'Jet stream', value: '18 m/s', note: '250 hPa, weakening', fill: 0.72 },
]

export const clearNights: [string, number][] = [
  ['J', 29],
  ['F', 26],
  ['M', 27],
  ['A', 25],
  ['M', 22],
  ['J', 20],
  ['J', 21],
  ['A', 24],
  ['S', 28],
  ['O', 30],
  ['N', 30],
  ['D', 30],
]

export const windows: { dates: string; moon: string; status: string }[] = [
  { dates: '10 – 14 September 2026', moon: 'New moon 11 Sep · 0 % illumination', status: '2 beds left' },
  { dates: '9 – 13 October 2026', moon: 'New moon 10 Oct · 1 % illumination', status: 'Open' },
  { dates: '8 – 12 November 2026', moon: 'New moon 9 Nov · 0 % illumination', status: 'Open' },
  { dates: '7 – 11 December 2026', moon: 'New moon 9 Dec · 2 % illumination', status: 'Waitlist' },
]
