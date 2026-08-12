/**
 * Procedural eurorack layout.
 *
 * Everything here is pure data — no three.js, no react. The scene components
 * read this once and build instanced geometry out of it.
 *
 * Real eurorack dimensions:
 *   1 HP  = 5.08 mm
 *   3U    = 128.5 mm  ->  ~25.3 HP tall
 * We keep that ratio and pick HP as the world unit scale.
 */

export const HP = 0.088
export const ROW_H = HP * 25.3 // a 3U panel
export const RAIL = HP * 1.35 // rail + gap between rows
export const ROWS = 2
export const ROW_HP = 104 // wide 2-row boutique case
export const CASE_W = ROW_HP * HP
export const CASE_H = ROWS * ROW_H + (ROWS + 1) * RAIL
export const PANEL_D = 0.055 // faceplate thickness
export const PANEL_Z = 0.0

export const ACCENTS = {
  amber: '#ff8a1f',
  cyan: '#2ff0d0',
  magenta: '#ff3d7f',
  lime: '#b7ff3d',
  ice: '#7fb6ff',
  red: '#ff3b30',
}

const PANEL_TONES = ['#1b1e21', '#24282c', '#121517', '#2e3237', '#b9bcbd', '#8d9296', '#171a1d']

/** deterministic PRNG so the rack looks the same on every reload */
function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * The catalogue. `hp` is panel width, `knobs`/`jacks`/`leds` drive the
 * procedural control layout, `kind` drives a few special panels.
 */
export const CATALOGUE = [
  { id: 'VCO-3340', sub: 'ANALOG OSC', hp: 12, knobs: 6, kcols: 3, jacks: 8, jcols: 4, leds: 2, accent: 'amber', ma: 95, mm: 25, price: 289, jlabels: ['1V/O', 'FM', 'PWM', 'SYNC', 'SAW', 'PLS', 'TRI', 'SUB'] },
  { id: 'VCO-DIGI', sub: 'WAVETABLE', hp: 10, knobs: 5, kcols: 3, jacks: 6, jcols: 3, leds: 3, accent: 'ice', ma: 130, mm: 28, price: 349, jlabels: ['1V/O', 'WAV', 'FM', 'SYN', 'OUT', 'AUX'] },
  { id: 'VCF-LADDER', sub: '24DB LOWPASS', hp: 8, knobs: 4, kcols: 2, jacks: 6, jcols: 3, leds: 1, accent: 'amber', ma: 45, mm: 24, price: 219, jlabels: ['IN', 'CUT', 'RES', 'FM', 'LP', 'BP'] },
  { id: 'VCF-SVF', sub: 'STATE VARIABLE', hp: 10, knobs: 5, kcols: 3, jacks: 6, jcols: 3, leds: 1, accent: 'cyan', ma: 52, mm: 24, price: 245, jlabels: ['IN', 'CV1', 'CV2', 'LP', 'BP', 'HP'] },
  { id: 'LFO-DUAL', sub: 'THRU-ZERO', hp: 8, knobs: 4, kcols: 2, jacks: 6, jcols: 3, leds: 4, accent: 'lime', ma: 30, mm: 22, price: 179, jlabels: ['RST', 'RATE', 'SYN', 'TRI', 'SQR', 'RND'] },
  { id: 'ADSR-2', sub: 'DUAL ENVELOPE', hp: 10, knobs: 8, kcols: 4, jacks: 6, jcols: 3, leds: 2, accent: 'magenta', ma: 28, mm: 20, price: 189, jlabels: ['GT1', 'GT2', 'RT1', 'ENV1', 'ENV2', 'EOC'] },
  { id: 'QNT-12', sub: 'QUANTIZER', hp: 6, knobs: 2, kcols: 2, jacks: 6, jcols: 2, leds: 6, accent: 'cyan', ma: 60, mm: 26, price: 199, jlabels: ['IN', 'OUT', 'TRG', 'TRN', 'SCL', 'GT'] },
  { id: 'SEQ-8', sub: '8 STEP CV', hp: 20, knobs: 8, kcols: 8, jacks: 8, jcols: 8, leds: 8, accent: 'amber', ma: 110, mm: 26, price: 419, jlabels: ['CLK', 'RST', 'DIR', 'CV', 'GT', 'EOC', 'A', 'B'] },
  { id: 'MIX-6', sub: 'DC MIXER', hp: 8, knobs: 6, kcols: 2, jacks: 8, jcols: 2, leds: 1, accent: 'ice', ma: 22, mm: 20, price: 149, jlabels: ['1', '2', '3', '4', '5', '6', 'SUM', 'INV'] },
  { id: 'VCA-2', sub: 'LIN / EXP', hp: 6, knobs: 3, kcols: 1, jacks: 6, jcols: 2, leds: 2, accent: 'lime', ma: 24, mm: 20, price: 139, jlabels: ['IN1', 'CV1', 'O1', 'IN2', 'CV2', 'O2'] },
  { id: 'FOLD-9', sub: 'WAVEFOLDER', hp: 8, knobs: 4, kcols: 2, jacks: 5, jcols: 3, leds: 1, accent: 'red', ma: 40, mm: 22, price: 209, jlabels: ['IN', 'FLD', 'SYM', 'CV', 'OUT'] },
  { id: 'CLK-DIV', sub: 'CLOCK / DIV', hp: 6, knobs: 2, kcols: 1, jacks: 8, jcols: 2, leds: 8, accent: 'lime', ma: 35, mm: 18, price: 159, jlabels: ['CLK', 'RST', '/2', '/3', '/4', '/8', '/16', 'OR'] },
  { id: 'SH-NOISE', sub: 'S&H + NOISE', hp: 6, knobs: 2, kcols: 2, jacks: 6, jcols: 2, leds: 2, accent: 'magenta', ma: 26, mm: 20, price: 145, jlabels: ['IN', 'TRG', 'S&H', 'WHT', 'PNK', 'RND'] },
  { id: 'BBD-880', sub: 'ANALOG DELAY', hp: 12, knobs: 5, kcols: 3, jacks: 6, jcols: 3, leds: 2, accent: 'amber', ma: 88, mm: 30, price: 329, jlabels: ['IN', 'TIME', 'FBK', 'MIX', 'OUT', 'WET'] },
  { id: 'RVB-TANK', sub: 'SPRING TANK', hp: 10, knobs: 4, kcols: 2, jacks: 4, jcols: 2, leds: 1, accent: 'ice', ma: 70, mm: 42, price: 279, jlabels: ['IN', 'DWL', 'MIX', 'OUT'] },
  { id: 'ATN-4', sub: 'ATTENUVERTER', hp: 4, knobs: 4, kcols: 1, jacks: 8, jcols: 2, leds: 0, accent: 'cyan', ma: 12, mm: 18, price: 89, jlabels: ['A', 'A', 'B', 'B', 'C', 'C', 'D', 'D'] },
  { id: 'MULT-6', sub: 'BUFFERED MULT', hp: 4, knobs: 0, kcols: 1, jacks: 8, jcols: 2, leds: 0, accent: 'ice', ma: 18, mm: 16, price: 79, jlabels: ['IN', 'A', 'B', 'C', 'IN', 'D', 'E', 'F'] },
  { id: 'MIDI-CV', sub: '4 VOICE IFACE', hp: 6, knobs: 1, kcols: 1, jacks: 8, jcols: 2, leds: 4, accent: 'magenta', ma: 65, mm: 22, price: 229, jlabels: ['CV1', 'GT1', 'CV2', 'GT2', 'CV3', 'GT3', 'MOD', 'CLK'] },
  { id: 'RND-SRC', sub: 'STOCHASTIC', hp: 8, knobs: 4, kcols: 2, jacks: 6, jcols: 3, leds: 3, accent: 'red', ma: 44, mm: 24, price: 235, jlabels: ['CLK', 'DIST', 'SPR', 'CV', 'GT', 'INV'] },
  { id: 'OUT-HP', sub: 'OUTPUT / CUE', hp: 6, knobs: 3, kcols: 1, jacks: 6, jcols: 2, leds: 2, accent: 'amber', ma: 55, mm: 22, price: 165, jlabels: ['L', 'R', 'CUE', 'L', 'R', 'TRS'] },
]

const BY_ID = Object.fromEntries(CATALOGUE.map((m) => [m.id, m]))

/** grid of local positions inside a panel */
function grid(count, cols, w, h, cy) {
  const pts = []
  if (count <= 0) return pts
  const c = Math.max(1, Math.min(cols, count))
  const rows = Math.ceil(count / c)
  for (let i = 0; i < count; i++) {
    const r = Math.floor(i / c)
    const col = i % c
    const x = -w / 2 + (w * (col + 0.5)) / c
    const y = cy + h / 2 - (h * (r + 0.5)) / rows
    pts.push([x, y])
  }
  return pts
}

/**
 * Builds the whole rack: modules, and flat arrays of every knob / jack / led /
 * screw so the renderer can push them into instanced meshes.
 */
export function buildRack(seed = 20260812) {
  const rnd = mulberry32(seed)
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)]

  // one forced module per row so the layout always reads well
  const forced = [['SEQ-8', 'VCO-3340'], ['VCF-LADDER', 'BBD-880']]
  const modules = []

  for (let r = 0; r < ROWS; r++) {
    let cursor = 0
    const queue = [...forced[r]]
    let guard = 0
    while (cursor < ROW_HP && guard++ < 60) {
      const left = ROW_HP - cursor
      let spec = null
      if (queue.length) {
        const cand = BY_ID[queue.shift()]
        if (cand.hp <= left) spec = cand
      }
      if (!spec) {
        const fits = CATALOGUE.filter((m) => m.hp <= left)
        if (!fits.length) break
        spec = pick(fits)
      }
      modules.push({ spec, row: r, hpStart: cursor })
      cursor += spec.hp
    }
    if (cursor < ROW_HP) modules.push({ spec: null, row: r, hpStart: cursor, blankHp: ROW_HP - cursor })
  }

  const knobs = []
  const jacks = []
  const leds = []
  const screws = []
  const panels = []
  let scope = null

  const top = CASE_H / 2

  modules.forEach((m, mi) => {
    const hpW = m.spec ? m.spec.hp : m.blankHp
    const w = hpW * HP
    const h = ROW_H
    const x = -CASE_W / 2 + (m.hpStart + hpW / 2) * HP
    const y = top - RAIL - m.row * (ROW_H + RAIL) - ROW_H / 2

    const tone = m.spec ? PANEL_TONES[Math.floor(rnd() * PANEL_TONES.length)] : '#0d0f11'
    const panel = {
      id: m.spec ? m.spec.id : 'BLANK',
      sub: m.spec ? m.spec.sub : '',
      hp: hpW,
      x,
      y,
      w,
      h,
      tone,
      accent: m.spec ? ACCENTS[m.spec.accent] : '#4a5157',
      blank: !m.spec,
      spec: m.spec,
    }
    panels.push(panel)

    // rack screws — 2 per panel for narrow, 4 for wide
    const sx = w / 2 - HP * 0.75
    const sy = h / 2 - HP * 0.6
    const screwPts = hpW >= 8 ? [[-sx, sy], [sx, sy], [-sx, -sy], [sx, -sy]] : [[-sx, sy], [sx, -sy]]
    screwPts.forEach(([ox, oy]) => screws.push({ p: [x + ox, y + oy, PANEL_Z + PANEL_D / 2] }))

    if (!m.spec) return

    const s = m.spec
    if (s.id === 'SEQ-8' && !scope) {
      // the sequencer panel carries the scope screen
      scope = { x, y: y + h * 0.22, w: w * 0.86, h: h * 0.3 }
    }

    // knobs live in the upper half, jacks in the bottom third
    const knobArea = { w: w - HP * 1.6, h: h * 0.44, cy: h * 0.12 }
    grid(s.knobs, s.kcols, knobArea.w, knobArea.h, knobArea.cy).forEach(([ox, oy], i) => {
      const big = s.knobs <= 4 || i === 0
      const r = (big ? HP * 1.05 : HP * 0.78) * (0.9 + rnd() * 0.2)
      knobs.push({
        p: [x + ox, y + oy, PANEL_Z + PANEL_D / 2],
        r,
        d: r * 0.85,
        angle: -2.3 + rnd() * 4.6,
        cap: rnd() > 0.65 ? panel.accent : '#dfe3e6',
      })
    })

    const jackArea = { w: w - HP * 1.4, h: h * 0.3, cy: -h * 0.26 }
    grid(s.jacks, s.jcols, jackArea.w, jackArea.h, jackArea.cy).forEach(([ox, oy], i) => {
      jacks.push({
        p: [x + ox, y + oy, PANEL_Z + PANEL_D / 2],
        r: HP * 0.5,
        module: mi,
        label: (s.jlabels && s.jlabels[i]) || '',
        // rough guess at signal direction, used to bias cable pairing
        out: /OUT|SUM|SAW|PLS|TRI|SUB|ENV|GT|LP|BP|HP|WHT|PNK|RND|EOC|CV|A|B|C|D|E|F/i.test(
          (s.jlabels && s.jlabels[i]) || ''
        ),
      })
    })

    const ledArea = { w: w - HP * 2.2, h: h * 0.06, cy: h * 0.38 }
    grid(s.leds, Math.min(8, Math.max(1, s.leds)), ledArea.w, ledArea.h, ledArea.cy).forEach(([ox, oy], i) => {
      leds.push({
        p: [x + ox, y + oy, PANEL_Z + PANEL_D / 2],
        r: HP * 0.24,
        color: panel.accent,
        step: (mi * 3 + i) % 16,
        mode: s.leds >= 8 ? 'seq' : rnd() > 0.5 ? 'pulse' : 'blink',
        phase: rnd() * 6.283,
      })
    })
  })

  return { panels, knobs, jacks, leds, screws, scope }
}

/** picks nice jack pairs and returns catmull-rom control points with rope sag */
export function buildPatches(jacks, count = 15, seed = 7) {
  const rnd = mulberry32(seed)
  const cableColors = ['#ff8a1f', '#2ff0d0', '#ff3d7f', '#b7ff3d', '#7fb6ff', '#ff3b30', '#f2f2f2']
  const used = new Set()
  const patches = []
  let guard = 0
  while (patches.length < count && guard++ < 900) {
    const a = Math.floor(rnd() * jacks.length)
    const b = Math.floor(rnd() * jacks.length)
    if (a === b) continue
    if (used.has(a) || used.has(b)) continue
    const ja = jacks[a]
    const jb = jacks[b]
    if (ja.module === jb.module) continue
    const dx = Math.abs(ja.p[0] - jb.p[0])
    const dy = Math.abs(ja.p[1] - jb.p[1])
    const dist = Math.hypot(dx, dy)
    if (dist < ROW_H * 0.5 || dist > CASE_W * 0.42) continue
    used.add(a)
    used.add(b)
    patches.push({
      a: ja.p,
      b: jb.p,
      color: cableColors[Math.floor(rnd() * cableColors.length)],
      // Kept short on purpose: at the original values a long patch sagged two
      // world units, i.e. half the case height, and hung out of frame.
      sag: 0.12 + rnd() * 0.16,
      bow: 0.18 + rnd() * 0.26,
      lift: 0.16 + rnd() * 0.12,
      phase: rnd() * 6.283,
      speed: 0.45 + rnd() * 0.5,
      radius: rnd() > 0.75 ? 0.017 : 0.0225,
    })
  }
  return patches
}
