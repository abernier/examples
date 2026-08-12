export const NAV = [
  { href: '#launch', label: 'Launch' },
  { href: '#platform', label: 'Platform' },
  { href: '#imagery', label: 'Imagery' },
  { href: '#manifest', label: 'Manifest' },
]

export const HERO_STATS = [
  { k: '47', u: 'flights', l: 'Flown since 2019' },
  { k: '31', u: 'consecutive', l: 'Clean insertions' },
  { k: '480', u: 'kg → 550 km', l: 'To sun-synchronous' },
  { k: '30', u: 'cm GSD', l: 'Panchromatic' },
]

export const CAPABILITIES = [
  {
    id: 'launch',
    n: '01',
    kicker: 'Launch',
    title: 'Dedicated rides. No rideshare compromise.',
    body: 'A rideshare puts your spacecraft in someone else’s orbit, on someone else’s calendar. HALO-3 is small enough to fly for one customer and cheap enough to fly often — you pick the plane, the local time of the ascending node, and the week.',
    specs: [
      ['Vehicle', 'HALO-3'],
      ['Payload to 550 km SSO', '480 kg'],
      ['Fairing envelope', 'Ø 1.90 m × 3.40 m'],
      ['Insertion accuracy', '± 4.0 km / ± 0.02°'],
      ['Contracted cadence', '26 flights / year'],
    ],
  },
  {
    id: 'platform',
    n: '02',
    kicker: 'Platform',
    title: 'A sixty-kilo bus that flies itself.',
    body: 'MERIDIAN-60 handles the parts nobody wants to build twice: attitude, power, thermal, comms, collision avoidance, end-of-life disposal. You get a 34-litre volume, a power budget and an API. Integration takes eleven days, not eleven months.',
    specs: [
      ['Bus', 'MERIDIAN-60'],
      ['Payload volume / mass', '34 L / 22 kg'],
      ['Orbit-average power', '340 W (EOL)'],
      ['Pointing knowledge', '0.02° (3σ)'],
      ['Propulsion', 'Xe Hall thruster, 1.1 km/s Δv'],
    ],
  },
  {
    id: 'imagery',
    n: '03',
    kicker: 'Imagery',
    title: 'Tasked at 06:14. On your desk at 07:02.',
    body: 'Twelve ground stations, three of them polar, mean a frame is rarely more than one orbit from a downlink. Ortho-rectification, cloud masking and change detection run in the pipeline, so what lands in your bucket is already analysis-ready.',
    specs: [
      ['Ground sample distance', '30 cm pan / 1.2 m MS'],
      ['Spectral bands', '8 VNIR + 2 SWIR'],
      ['Swath at nadir', '14.6 km'],
      ['Revisit, mid-latitude', '4× daily'],
      ['Downlink', '2.4 Gbps Ka-band'],
    ],
  },
]

export const MANIFEST = [
  {
    mission: 'AURORA-9',
    vehicle: 'HALO-3',
    orbit: '550 km SSO / 10:30 LTDN',
    payload: '412 kg',
    window: '2026-03-14 06:11 UTC',
    status: 'Flown',
  },
  {
    mission: 'KESTREL-2',
    vehicle: 'HALO-3',
    orbit: '505 km SSO / 13:45 LTDN',
    payload: '388 kg',
    window: '2026-05-02 22:40 UTC',
    status: 'Flown',
  },
  {
    mission: 'LONGSHORE',
    vehicle: 'HALO-3',
    orbit: '620 km polar / 97.9°',
    payload: '451 kg',
    window: '2026-08-19 04:52 UTC',
    status: 'Integration',
  },
  {
    mission: 'TIDEWATER',
    vehicle: 'HALO-3',
    orbit: '550 km SSO / 06:00 LTDN',
    payload: '480 kg',
    window: '2026-10-07 11:26 UTC',
    status: 'Sold out',
  },
  {
    mission: 'BLACKWATER',
    vehicle: 'HALO-3H',
    orbit: '780 km SSO / 09:15 LTDN',
    payload: '336 kg',
    window: '2027-01-23 19:03 UTC',
    status: 'Open',
  },
  {
    mission: 'FIRSTLIGHT',
    vehicle: 'HALO-3H',
    orbit: '550 km SSO / 10:30 LTDN',
    payload: '480 kg',
    window: '2027-04-11 07:48 UTC',
    status: 'Open',
  },
]

export const TELEMETRY = [
  'LC-4E KODIAK',
  'GO FOR PROP LOAD',
  'RANGE GREEN',
  'LOX 98.2%',
  'RP-1 97.6%',
  'WIND 11 KT / 244°',
  'T-00:11:42',
  'FTS ARMED',
  'S-BAND LOCK',
  'DOWNRANGE 0.0 KM',
]
