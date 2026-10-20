import { add, bezel, box, context, rect, solid, style, text, vector, type Ink } from '../draw'
import type { IconBuild } from '../icons'
import { iconInstance } from './button'
import { ref, type SetSpec, type VariantSpec } from './set'

/* Meters and data marks: Gauge, SegmentedMeter, LimitMeter, ShareBar,
 * Treemap, HistogramRange and FilterChips, each from its file in
 * packages/ui/src/components/ui. The data ones are static examples (a fixed
 * dataset, drawn at rest); motion lives in code. In Bezel their labels are
 * the mono capital eyebrow and their figures are set in mono (bezel.css,
 * "Meters and ranges"). */

export const SOURCES = [
  {
    file: 'packages/ui/src/components/ui/gauge.tsx',
    // The gauge was redrawn as a thin scale (2026-10-09); the Figma drawing below still follows the old ring and needs
    // redrawing to match. These fragments track the new source so the next change is caught.
    classes: [
      "sm: { root: 'w-36', value: 'text-xl', label: 'text-ui-xs', scale: 'invisible overflow-hidden' }",
      "default: { root: 'w-52', value: 'text-[length:--spacing(7)]', label: 'text-ui-sm', scale: 'text-ui-xs' }",
      "lg: { root: 'w-64', value: 'text-[length:--spacing(9)]', label: 'text-ui', scale: 'text-ui-xs' }",
      'const MID = 92',
      'const THICK = 6',
      "neutral: 'text-fg-muted'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/segmented-meter.tsx',
    classes: [
      "className={cn('flex w-full flex-col gap-2.5', className)}",
      'className="flex items-baseline justify-between gap-3"',
      'text-ui-sm text-fg-muted',
      "className=\"ms-auto shrink-0 text-ui-lg font-medium text-fg tabular-nums\"",
      'className="flex h-2.5 gap-0.75"',
      "'min-w-0 flex-1 rounded-[2px]",
      "neutral: 'bg-fg'",
      'segments = 40',
    ],
  },
  {
    file: 'packages/ui/src/components/ui/limit-meter.tsx',
    classes: [
      "className={cn('flex w-full flex-col gap-5', className)}",
      "'font-mono text-[2.5rem] leading-none font-medium tracking-[-0.03em] tabular-nums'",
      'className="flex flex-wrap gap-x-4 gap-y-1 text-ui-sm"',
      'className="font-mono text-fg tabular-nums"',
      'className="relative mx-1.5 h-4"',
      'className="relative h-6 rounded-[3px]',
      "major ? 'h-4.5 w-0.5' : 'h-2.5'",
      "idle ? (major ? 'opacity-45' : 'opacity-25') : major ? 'opacity-100' : 'opacity-55'",
      'absolute start-0 inset-y-0.5 w-px -translate-x-1/2 rounded-full bg-fg',
      'absolute start-0 top-[calc(100%+2px)] h-1.5 w-2.5 -translate-x-1/2 bg-fg [clip-path:polygon(50%_0,100%_100%,0_100%)]',
      'className="mx-0.5 mt-2 grid grid-cols-3 font-mono text-ui-sm text-fg-muted tabular-nums"',
      'ticks = 50',
      'majorEvery = 10',
      "tone = 'success'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/share-bar.tsx',
    classes: [
      "cells ? 'h-3' : 'h-1.5'",
      "'rounded-[1px] bg-current'",
      'className="flex-1 rounded-xs bg-current"',
      'text-well',
      "'--share-bar-gap': cells && !ticks ? '2px' : '0px'",
      "'--share-bar-fill': toneColor(tone)",
    ],
  },
  {
    // The share bar's neutral fill lives in the shared tone helper now.
    file: 'packages/ui/src/lib/utils.ts',
    classes: ["export function toneColor(tone: string, neutral = 'var(--color-fg-subtle)')"],
  },
  {
    file: 'packages/ui/src/components/ui/treemap.tsx',
    classes: [
      'const CELL_PADDING = 22',
      'const CHAR_WIDTH = 7.4',
      'gap = 4',
      "'absolute flex min-w-0 flex-col items-start gap-0.5 overflow-hidden rounded-[min(var(--radius-xs),2px)] border px-2.5 py-2 text-start outline-none'",
      "'border-(--color-chart-quiet) bg-hover hover:bg-hover'",
      "'border-[color-mix(in_oklab,var(--treemap-tone)_30%,var(--color-chart-quiet))] bg-[color-mix(in_oklab,var(--treemap-tone)_9%,transparent)]'",
      "'bg-[color-mix(in_oklab,var(--treemap-tone)_calc(14%_+_14%_*_var(--yj-dark)),transparent)]'",
      'className="truncate font-mono text-ui-sm"',
      "'truncate font-mono text-ui-sm tabular-nums', on ? 'text-current' : 'text-fg-muted'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/histogram-range.tsx',
    classes: [
      "!selected ? 'bg-well' : tone === 'accent' ? 'bg-accent' : 'bg-line-strong'",
      'const FLOOR = 0.05',
      'className="ms-auto shrink-0 font-mono text-ui-sm whitespace-nowrap text-accent tabular-nums',
      'className="relative h-10',
      '[&_[data-slot=slider-track]]:bg-canvas [&_[data-slot=slider-track]]:inset-ring [&_[data-slot=slider-track]]:inset-ring-line-subtle',
      '[&_[data-slot=slider-thumb]]:h-4.5 [&_[data-slot=slider-thumb]]:w-1.5',
      '[&_[data-slot=slider-thumb]>span]:border-0 [&_[data-slot=slider-thumb]>span]:bg-action',
      'className="relative mt-1 h-4 font-mono text-ui-xs text-fg-muted tabular-nums',
    ],
  },
  {
    file: 'packages/ui/src/components/ui/filter-chips.tsx',
    classes: [
      'className="h-auto min-h-control rounded-field-area cursor-text p-1.5 data-invalid:border-danger"',
      'className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5"',
      "'inline-flex h-7 max-w-full min-w-0 items-center gap-1 rounded-chip border border-accent-line bg-accent-subtle ps-2.5 pe-1.5 font-mono text-ui-sm text-accent focus-ring-within'",
      'className="h-7 px-1.5 font-mono text-ui-sm"',
      'className="pt-1.5 text-ui-sm font-medium text-danger"',
    ],
  },
]

type Tone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral'

const TONE: Record<Tone, Ink> = {
  accent: 'role/accent',
  success: 'role/success',
  warning: 'role/warning',
  danger: 'role/danger',
  neutral: ['role/fg', 0.7],
}

/** A figure in mono: Bezel sets gauge and meter values in the mono family, at the size the style gives them. */
function mono(t: TextNode, weight: 400 | 500 = 500): TextNode {
  t.fontName = context().fonts.font('mono', weight)
  return t
}

/** A label in the component's voice: Bezel's mono capital eyebrow, or the ui-sm muted label in Classic. */
const label = (chars: string, name = 'Label') => text(chars, bezel() ? 'Bezel/Eyebrow' : 'UI/sm/Regular', 'role/fg-muted', { name })

const f = (n: number) => Math.round(n * 100) / 100

/* ── Gauge ─────────────────────────────────────────────────────────────── */

const G = { R: 100, THICK: 24, CORNER: 5, NOTCH: 5, CARET: { gap: 2.5, depth: 9, half: 3.5 }, BOX: { x: -114, y: -114, w: 228, h: 122 } }
const GAUGE_SIZES = { sm: { w: 144, value: 'Heading/xl', label: 'UI/xs/Regular', gap: 0 }, md: { w: 208, value: 'Heading/3xl', label: 'UI/base/Regular', gap: 2 }, lg: { w: 256, value: 'Heading/4xl', label: 'UI/lg/Regular', gap: 4 } } as const
const GAUGE_TONES: [Tone, number, string][] = [
  ['accent', 72, 'On track'],
  ['success', 86, 'Nominal'],
  ['warning', 64, 'Strained'],
  ['danger', 28, 'Critical'],
]

/** The gauge's shapes in the component's box: the dial's viewBox scaled to its width, hub on the baseline. */
function gaugePaths(scale: number, t: number) {
  const { R, THICK, CORNER } = G
  const r = R - THICK
  const mid = (R + r) / 2
  const P = (x: number, y: number) => `${f((x - G.BOX.x) * scale)},${f((y - G.BOX.y) * scale)}`
  /** A point `radius` from the hub at angle `a` (0 at the minimum, π at the maximum). */
  const at = (radius: number, a: number) => P(-radius * Math.cos(a), -radius * Math.sin(a))
  const ao = CORNER / R
  const ai = CORNER / r
  const Ro = f(R * scale)
  const ri = f(r * scale)
  // The notch: a gap as wide as NOTCH at the ring's middle, centred on the value.
  const a = t * Math.PI
  const g = G.NOTCH / 2 / mid
  const until = a - g
  const from = a + g
  // The fill: the ring from its softened start to the notch, cut flat along the radius there.
  const fill =
    until > ao
      ? [
          `M${P(-r - CORNER, 0)}`,
          `L${P(-R + CORNER, 0)}`,
          `Q${P(-R, 0)} ${at(R, ao)}`,
          `A${Ro},${Ro} 0 0 1 ${at(R, until)}`,
          `L${at(r, until)}`,
          `A${ri},${ri} 0 0 0 ${at(r, ai)}`,
          `Q${P(-r, 0)} ${P(-r - CORNER, 0)}`,
          'Z',
        ].join(' ')
      : ''
  // The track: the rest of the ring, from the notch to its softened end.
  const track =
    from < Math.PI - ao
      ? [
          `M${at(R, from)}`,
          `A${Ro},${Ro} 0 0 1 ${at(R, Math.PI - ao)}`,
          `Q${P(R, 0)} ${P(R - CORNER, 0)}`,
          `L${P(r + CORNER, 0)}`,
          `Q${P(r, 0)} ${at(r, Math.PI - ai)}`,
          `A${ri},${ri} 0 0 0 ${at(r, from)}`,
          'Z',
        ].join(' ')
      : ''
  // The caret: on the rim at the value, its tip pointing into the notch.
  const { gap, depth, half } = G.CARET
  const u = [-Math.cos(a), -Math.sin(a)]
  const n = [Math.sin(a), -Math.cos(a)]
  const pt = (along: number, across: number) => P(u[0]! * along + n[0]! * across, u[1]! * along + n[1]! * across)
  const caret = `M${pt(R + gap, 0)} L${pt(R + gap + depth, half)} L${pt(R + gap + depth, -half)} Z`
  return { track, fill, caret }
}

async function drawGauge(c: ComponentNode, size: keyof typeof GAUGE_SIZES, tone: Tone, value: number, word: string) {
  const s = GAUGE_SIZES[size]
  const scale = s.w / G.BOX.w
  const h = Math.round(G.BOX.h * scale)
  await style(c, { dir: 'none', w: s.w, h })
  const paths = gaugePaths(scale, value / 100)
  if (paths.track) vector(c, paths.track, { fill: solid(['role/fg', 0.12]) }, 'Track')
  if (paths.fill) vector(c, paths.fill, { fill: solid(TONE[tone]) }, 'Indicator')
  vector(c, paths.caret, { fill: solid('role/fg') }, 'Index')
  const valueText = await text(String(value), s.value, 'role/fg', { name: 'Value' })
  if (bezel()) mono(valueText)
  const word_ = await text(word, bezel() ? 'Bezel/Eyebrow' : s.label, 'role/fg', { name: 'Band' })
  const center = await box({ name: 'Center', dir: 'col', align: 'center', gap: s.gap, w: s.w }, valueText, ref(word_, 'Show band'))
  add(c, center)
  center.x = 0
  center.y = Math.round(h * 0.97 - center.height)
}

function gaugeSpec(): SetSpec {
  const variants: VariantSpec[] = []
  for (const [tone, value, word] of GAUGE_TONES)
    for (const size of ['md', 'sm', 'lg'] as const) variants.push({ props: { Size: size, Tone: tone }, build: (c) => drawGauge(c, size, tone, value, word) })
  return {
    key: 'component:gauge',
    name: 'Gauge',
    description:
      'Gauge in packages/ui: a thick half-ring read left to right, the value large in its bowl and the band’s word under it. An index marks the value: a notch through the ring and a caret on the rim. Thresholds pick the fill’s tone; here each Tone shows a band. The depth shading, the zoned scale (`gradient`) and the sweep on the smooth spring live in code; the index rides the fill.',
    variants,
    properties: [
      { name: 'Show band', type: 'BOOLEAN', default: true, field: 'visible' },
    ],
    columns: 'Size',
    gap: [32, 24],
  }
}

/* ── SegmentedMeter ────────────────────────────────────────────────────── */

const METER_W = 320
const CELLS = 40
const CELL_GAP = 3

async function drawSegmentedMeter(c: ComponentNode, tone: Tone, value: number) {
  await style(c, { dir: 'col', gap: 'space/2-5', w: METER_W })
  const v = await text(`${value}%`, 'UI/lg/Medium', 'role/fg', { name: 'Value' })
  if (bezel()) mono(v)
  const head = await box({ name: 'Header', dir: 'row', align: 'baseline', justify: 'between', gap: 'space/3', w: 'fill' }, ref(await label('Threads'), 'Label'), ref(v, 'Value'))
  const track = await box({ name: 'Track', dir: 'row', gap: CELL_GAP, w: 'fill', h: 10 })
  const lit = Math.round((value / 100) * CELLS)
  const cw = (METER_W - CELL_GAP * (CELLS - 1)) / CELLS
  // Off cells sit in the well: the canvas in dark, a faint ink in light (role/well is the kit's variable for that step).
  for (let i = 0; i < CELLS; i++) add(track, rect(i < lit ? 'Cell on' : 'Cell off', cw, 10, i < lit ? (tone === 'neutral' ? ['role/fg', 0.75] : TONE[tone]) : 'role/well', 2))
  add(c, head, track)
}

function segmentedMeterSpec(): SetSpec {
  return {
    key: 'component:segmented-meter',
    name: 'Segmented meter',
    description:
      'SegmentedMeter in packages/ui: a label and its value over 40 countable cells, lit from the inline start. Cells past a threshold take that band’s tone. In code the cells light one after another over the deliberate token; reduced motion lights them at once.',
    variants: (['neutral', 'accent', 'success', 'warning', 'danger'] as Tone[]).map((tone) => ({ props: { Tone: tone }, build: (c) => drawSegmentedMeter(c, tone, 47) })),
    properties: [
      { name: 'Label', type: 'TEXT', default: 'Threads', field: 'characters' },
      { name: 'Value', type: 'TEXT', default: '47%', field: 'characters' },
    ],
    columns: 'Tone',
    gap: [32, 16],
  }
}

/* ── LimitMeter ────────────────────────────────────────────────────── */

const ALLOWANCE = { w: 480, limit: 2000, spent: 715.5, marker: { value: 1600, label: 'freeze', tone: 'warning' as Tone }, ticks: 50, major: 10 }
const money = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

async function drawAllowance(c: ComponentNode, tone: Tone) {
  const A = ALLOWANCE
  await style(c, { dir: 'col', gap: 'space/5', w: A.w })
  const remaining = money(A.limit - A.spent)
  const [whole, cents] = remaining.split('.')
  const big = await box(
    { name: 'Remaining', dir: 'row', align: 'baseline' },
    mono(await text(whole!, 'Heading/4xl', 'role/fg', { name: 'Whole' })),
    mono(await text(`.${cents}`, 'Heading/4xl', 'role/fg-muted', { name: 'Fraction' })),
  )
  const stat = async (term: string, amount: number) =>
    box({ name: term, dir: 'row', gap: 'space/1-5', align: 'baseline' }, await label(term, 'Term'), await text(money(amount), 'Mono/sm', ['role/fg', 0.8], { name: 'Amount' }))
  // The figures sit under the headline, as a quiet readout.
  const head = await box(
    { name: 'Header', dir: 'col', gap: 'space/2-5', w: 'fill' },
    await label('Remaining'),
    big,
    await box({ name: 'Summary', dir: 'row', gap: 16 }, await stat('Spent', A.spent), await stat('Limit', A.limit)),
  )

  const inner = A.w - 12
  const spentAt = A.spent / A.limit
  const markAt = A.marker.value / A.limit
  // Only the markers are named over the ruler; the spend has its caret under it.
  const flags = await box({ name: 'Flags', dir: 'none', w: inner, h: 16 })
  for (const [at, chars, ink] of [[markAt, A.marker.label, `role/${A.marker.tone}-text`]] as const) {
    const t = await text(chars, 'UI/base/Regular', ink, { name: 'Flag' })
    add(flags, t)
    t.x = Math.round(at * inner - t.width / 2)
    t.y = 16 - t.height
  }
  const flagRow = await box({ name: 'Flags', dir: 'row', pad: [0, 6], w: 'fill' }, flags)

  const ruler = await box({ name: 'Ruler', dir: 'none', w: A.w, h: 24, radius: 3, fill: 'role/well' })
  for (let i = 0; i <= A.ticks; i++) {
    const pos = i / A.ticks
    const major = i % A.major === 0 || i === A.ticks
    const spent = pos <= spentAt + 1e-9
    const runway = !spent && pos <= markAt
    const ink: Ink = spent ? TONE[tone] : runway ? TONE[A.marker.tone] : 'role/fg'
    const opacity = !spent && !runway ? (major ? 0.45 : 0.25) : major ? 1 : 0.55
    const w = major ? 2 : 1
    const tick = rect(major ? 'Major tick' : 'Tick', w, major ? 18 : 10, ink, 'radius/full')
    tick.opacity = opacity
    add(ruler, tick)
    tick.x = f(6 + pos * inner - w / 2)
    tick.y = 4
  }
  const marker = rect('Marker', 2, 24, TONE[A.marker.tone], 'radius/full')
  const line = rect('Spent line', 1, 20, 'role/fg', 'radius/full')
  add(ruler, marker, line)
  marker.x = f(6 + markAt * inner - 1)
  marker.y = 0
  line.x = f(6 + spentAt * inner - 0.5)
  line.y = 2
  // The index caret under the ruler, pointing up at the spend.
  const caretRow = await box({ name: 'Caret', dir: 'none', w: A.w, h: 6 })
  const cx = 6 + spentAt * inner
  vector(caretRow, `M${f(cx - 5)},6 L${f(cx)},0 L${f(cx + 5)},6 Z`, { fill: solid('role/fg') }, 'Caret')
  const axis = await box(
    { name: 'Axis', dir: 'row', justify: 'between', pad: [4, 2, 0, 2], w: 'fill' },
    await text('$0', 'Mono/sm', 'role/fg-muted'),
    await text('$1,000', 'Mono/sm', 'role/fg-muted'),
    await text('$2,000', 'Mono/sm', 'role/fg-muted'),
  )
  add(c, head, await box({ name: 'Scale', dir: 'col', gap: 2, w: 'fill' }, flagRow, ruler, caretRow, axis))
}

function allowanceSpec(): SetSpec {
  return {
    key: 'component:limit-meter',
    name: 'Limit meter',
    description:
      'LimitMeter in packages/ui: what is left of a budget, large, with spent and limit as a quiet readout under it, over a ruler from zero to the limit. An index caret under the ruler points up at the spend; markers are named over it. Spent ticks take the tone, the runway to a marker takes the marker’s, and the rest is dim. In code the spend sweeps up at a constant rate.',
    variants: (['success', 'accent'] as Tone[]).map((tone) => ({ props: { Tone: tone }, build: (c) => drawAllowance(c, tone) })),
    properties: [],
    columns: 'Tone',
    gap: [48, 16],
  }
}

/* ── ShareBar ──────────────────────────────────────────────────────────── */

const SHARE_W = 240
const SHARE_TONES = ['accent', 'neutral', 'success', 'chart-1', 'chart-2'] as const

const shareInk = (tone: (typeof SHARE_TONES)[number]): Ink => (tone.startsWith('chart') ? `role/${tone}` : tone === 'neutral' ? 'role/fg-subtle' : `role/${tone}`)

async function drawShareBar(c: ComponentNode, variant: 'solid' | 'segmented', tone: (typeof SHARE_TONES)[number], value: number) {
  const ink = shareInk(tone)
  const track: Ink = ['role/fg', 0.1]
  if (variant === 'solid') {
    await style(c, { dir: 'none', w: SHARE_W, h: 6 })
    add(c, rect('Track', SHARE_W, 6, track, 'radius/xs'), rect('Fill', Math.round(SHARE_W * value), 6, ink, 'radius/xs'))
    return
  }
  const cells = 20
  const lit = Math.min(cells - 1, Math.max(1, Math.round(value * cells)))
  await style(c, { dir: 'row', gap: 2, w: SHARE_W, h: 12 })
  const w = (SHARE_W - 2 * (cells - 1)) / cells
  for (let i = 0; i < cells; i++) add(c, rect(i < lit ? 'Segment on' : 'Segment off', w, 12, i < lit ? ink : track, 1))
}

function shareBarSpec(): SetSpec {
  const variants: VariantSpec[] = []
  for (const tone of SHARE_TONES) for (const variant of ['solid', 'segmented'] as const) variants.push({ props: { Variant: variant, Tone: tone }, build: (c) => drawShareBar(c, variant, tone, 0.62) })
  return {
    key: 'component:share-bar',
    name: 'Share bar',
    description:
      'ShareBar in packages/ui: a word-sized share of a whole for a table cell or list row, a solid bar or a run of cells (`segments`, 20 here). The fill is the tone over a foreground/10 track; any share above zero keeps a cell lit. In code the edge travels on the smooth spring.',
    variants,
    properties: [],
    columns: 'Variant',
    gap: [32, 20],
  }
}

/* ── Treemap ───────────────────────────────────────────────────────────── */

const TREEMAP = { w: 700, h: 200, gap: 4 }
const STORAGE = [
  ['video', 164],
  ['photos', 96],
  ['audio', 41],
  ['fonts', 22],
  ['archives', 19],
  ['documents', 14],
  ['icons', 9],
  ['other', 6],
] as const

type Box = { x: number; y: number; w: number; h: number }

function worst(row: number[], sum: number, side: number) {
  const s2 = side * side
  const sum2 = sum * sum
  return Math.max((s2 * Math.max(...row)) / sum2, sum2 / (s2 * Math.min(...row)))
}

/** The ui's squarified layout (Bruls, Huizing & van Wijk), as treemap.tsx runs it. */
function squarify(areas: number[], box: Box): Box[] {
  const out: Box[] = []
  let { x, y, w, h } = box
  let i = 0
  while (i < areas.length) {
    const side = Math.min(w, h)
    const row = [areas[i]!]
    let sum = areas[i]!
    let j = i + 1
    while (j < areas.length && worst([...row, areas[j]!], sum + areas[j]!, side) <= worst(row, sum, side)) {
      row.push(areas[j]!)
      sum += areas[j]!
      j++
    }
    const thickness = side > 0 ? sum / side : 0
    let offset = 0
    for (const area of row) {
      const length = thickness > 0 ? area / thickness : 0
      out.push(w >= h ? { x, y: y + offset, w: thickness, h: length } : { x: x + offset, y, w: length, h: thickness })
      offset += length
    }
    if (w >= h) {
      x += thickness
      w -= thickness
    } else {
      y += thickness
      h -= thickness
    }
    i = j
  }
  return out
}

async function drawTreemap(c: ComponentNode, highlight: string) {
  const { w, h, gap } = TREEMAP
  await style(c, { dir: 'none', w, h })
  const sum = STORAGE.reduce((a, [, v]) => a + v, 0)
  const outer = { x: 0, y: 0, w: w + gap, h: h + gap }
  const rects = squarify(
    STORAGE.map(([, v]) => (v / sum) * outer.w * outer.h),
    outer,
  )
  for (let i = 0; i < STORAGE.length; i++) {
    const [name, value] = STORAGE[i]!
    const r = rects[i]!
    const cw = Math.max(1, r.w - gap)
    const ch = Math.max(1, r.h - gap)
    const on = name === highlight
    const fits = (chars: string, least = chars.length) => 22 + Math.min(chars.length, least) * 7.4 <= cw
    const shown = `${value} GB`
    const room = fits(name, 10) && ch >= 26 ? (fits(shown) && ch >= 44 ? 'full' : 'name') : 'none'
    // Highlighted: the tone at 14% (light) to 28% (dark) behind its ink; 20% draws both.
    const cell = await box({
      name: `Cell ${name}`,
      dir: 'col',
      gap: 'space/0-5',
      pad: [8, 10],
      w: f(cw),
      h: f(ch),
      radius: 2,
      clip: true,
      fill: on ? 'role/accent-subtle' : 'role/hover',
      // The ui edges a cell with --ui-mark-quiet (the foreground at 48% over the surface), so tiles read at 3:1.
      stroke: on ? 'role/accent' : ['role/fg', 0.48],
    })
    if (room !== 'none') add(cell, await text(name, 'Mono/sm', on ? 'role/accent-text' : 'role/fg', { name: 'Name', truncate: true, w: 'fill' }))
    if (room === 'full') add(cell, await text(shown, 'Mono/sm', on ? 'role/accent-text' : 'role/fg-muted', { name: 'Value', truncate: true, w: 'fill' }))
    add(c, cell)
    cell.x = f(r.x)
    cell.y = f(r.y)
  }
}

function treemapSpec(): SetSpec {
  return {
    key: 'component:treemap',
    name: 'Treemap',
    description:
      'Treemap in packages/ui, as a static example (a media library by type, 700 × 200): squarified cells a step above the surface, edged with the border, name and value in mono where they fit. `highlight` tints and outlines a cell in its tone. In code cells fade in largest first and new data re-lays the map on the smooth spring.',
    variants: ['none', 'photos'].map((highlight) => ({ props: { Highlight: highlight }, build: (c) => drawTreemap(c, highlight) })),
    properties: [],
    columns: 'Highlight',
    gap: [32, 16],
  }
}

/* ── HistogramRange ────────────────────────────────────────────────────── */

const HIST = { w: 480, max: 64, lo: 12, hi: 40 }
const BINS = Array.from({ length: 40 }, (_, i) => Math.round(40 * Math.exp(-(((i - 11) / 6) ** 2)) + 18 * Math.exp(-(((i - 27) / 5) ** 2)) + 3))

async function drawHistogram(c: ComponentNode, tone: 'neutral' | 'accent') {
  const { w, max, lo, hi } = HIST
  await style(c, { dir: 'col', w })
  const readout = await text(`${lo} MB — ${hi} MB`, 'Mono/sm', 'role/accent', { name: 'Readout' })
  const head = await box({ name: 'Header', dir: 'row', align: 'baseline', justify: 'between', gap: 'space/3', w: 'fill' }, ref(await label('File size'), 'Label'), readout)

  const bars = await box({ name: 'Bars', dir: 'none', w, h: 40 })
  const peak = Math.max(...BINS)
  const n = BINS.length
  BINS.forEach((count, i) => {
    const middle = ((i + 0.5) / n) * max
    const inRange = middle >= lo && middle <= hi
    const bh = Math.max(0.05, count / peak) * 40
    const bar = rect(inRange ? 'Bar in range' : 'Bar', f(w / n - 2), f(bh), inRange ? (tone === 'accent' ? 'role/accent' : ['role/fg', 0.45]) : ['role/fg', 0.15], 1)
    add(bars, bar)
    bar.x = f((i / n) * w + 1)
    bar.y = f(40 - bh)
  })

  // The kit's Slider, restyled: a thin recessed track, the range in the primary, and slim upright tabs in the
  // action's ink, each with a hairline guide rising through the bars.
  const trackH = bezel() ? 6 : 4
  const slider = await box({ name: 'Slider', dir: 'none', w, h: 22 })
  const track = rect('Track', w, trackH, bezel() ? 'role/well' : 'role/canvas', 'radius/full')
  track.strokes = [solid(bezel() ? 'bezel/rail-edge' : ['role/fg', 0.08])]
  track.strokeWeight = 1
  track.strokeAlign = 'INSIDE'
  const x0 = (lo / max) * w
  const x1 = (hi / max) * w
  const range = rect('Range', f(x1 - x0), trackH, 'role/accent', 'radius/full')
  add(slider, track, range)
  track.y = 7 + (4 - trackH) / 2
  range.x = f(x0)
  range.y = track.y
  for (const x of [x0, x1]) {
    const guide = rect('Guide', 1, 40, ['role/action', 0.5], 0)
    add(bars, guide)
    guide.x = f(x - 0.5)
    guide.y = 0
    const tab = rect('Thumb', 6, 18, 'role/action', 'radius/full')
    add(slider, tab)
    tab.x = f(x - 3)
    tab.y = 0
  }
  const axis = await box({ name: 'Axis', dir: 'none', w, h: 16 })
  for (const tick of [0, 16, 32, 48, 64]) {
    const t = await text(tick ? `${tick} MB` : '0', 'Mono/xs', 'role/fg-muted', { name: 'Tick' })
    add(axis, t)
    t.x = f(tick >= max ? w - t.width : tick > 0 ? (tick / max) * w - t.width / 2 : 0)
    t.y = 0
  }
  const plot = await box({ name: 'Plot', dir: 'col', pad: [14, 0, 0, 0], w: 'fill' }, bars, slider)
  add(c, head, plot, await box({ name: 'Axis row', dir: 'col', pad: [4, 0, 0, 0], w: 'fill' }, axis))
}

function histogramSpec(): SetSpec {
  return {
    key: 'component:histogram-range',
    name: 'Histogram range',
    description:
      'HistogramRange in packages/ui, as a static example (file sizes in 40 bins, 12–40 MB selected): a two-thumb range over the distribution it filters, bars faint outside and stronger inside, the accent on the track and the readout (`tone="accent"` puts it on the bars too). The thumbs are slim upright tabs, each with a hairline guide through the bars. In code the bars glide to new counts on the slow token and a thumb cuts a bar where it stands.',
    variants: (['neutral', 'accent'] as const).map((tone) => ({ props: { Tone: tone }, build: (c) => drawHistogram(c, tone) })),
    properties: [{ name: 'Label', type: 'TEXT', default: 'File size', field: 'characters' }],
    columns: 'Tone',
    gap: [48, 16],
  }
}

/* ── FilterChips ────────────────────────────────────────────────────────── */

const CHIPS = ['label:bug', 'priority:in(p1,p2)', 'repo:web']
const clear = (): SolidPaint => ({ type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 0 })

async function drawQueryChips(c: ComponentNode, state: 'rest' | 'focus' | 'invalid', remove: ComponentNode | null) {
  await style(c, { dir: 'col', w: 420 })
  const well = bezel()
  const border: Ink | null = state === 'focus' ? 'role/focus' : state === 'invalid' ? 'role/danger' : well ? null : 'role/line-control'
  const group = await box({
    name: 'Input group',
    dir: 'row',
    align: 'center',
    pad: 6,
    w: 'fill',
    radius: 'bezel/field-area-radius',
    fill: well ? 'role/field' : 'role/canvas',
    stroke: border ?? clear(),
    effect: state === 'focus' ? 'Focus/field' : undefined,
  })
  const list = await box({ name: 'Chips', dir: 'row', align: 'center', gap: 'space/1-5', wrap: 6, w: 'fill' })
  for (const token of CHIPS) {
    const chip = await box({ name: 'Chip', dir: 'row', align: 'center', gap: 'space/1', pad: [0, 6, 0, 10], h: 28, radius: 'bezel/badge-radius', fill: 'role/accent-subtle', stroke: ['role/accent', 0.35] })
    add(chip, await text(token, 'Mono/sm', 'role/accent', { name: 'Token' }))
    if (remove) {
      const x = await box({ name: 'Remove', dir: 'row', align: 'center', justify: 'center', w: 16, h: 16, radius: 'radius/full', opacity: 0.6 })
      add(x, iconInstance(remove, 12, 'role/accent'))
      add(chip, x)
    }
    add(list, chip)
  }
  const field = await box({ name: 'Field', dir: 'row', align: 'center', pad: [0, 6], h: 28, w: 120 })
  add(field, ref(await text('Add a filter…', 'Mono/sm', 'role/fg-muted', { name: 'Placeholder' }), 'Placeholder'))
  add(list, field)
  add(group, list)
  add(c, group)
  if (state === 'invalid') add(c, await box({ name: 'Error', dir: 'row', pad: [6, 0, 0, 0] }, await text('Already filtering on repo', 'UI/sm/Medium', 'role/danger', { name: 'Error' })))
}

function filterChipsSpec(icons: Map<string, IconBuild>): SetSpec {
  const remove = (icons.get('x') ?? icons.get('close'))?.rest ?? null
  return {
    key: 'component:filter-chips',
    name: 'Filter chips',
    description:
      'FilterChips in packages/ui: a filter query as mono chips (`priority:in(p1,p2)`) with an "Add a filter…" field after them, in the field control (a filled well in Bezel). A rejected token shakes the frame, turns the border destructive and grows the reason in under it; chips enter and leave through PresenceList. Motion lives in code.',
    variants: (['rest', 'focus', 'invalid'] as const).map((state) => ({ props: { State: state }, build: (c) => drawQueryChips(c, state, remove) })),
    properties: [{ name: 'Placeholder', type: 'TEXT', default: 'Add a filter…', field: 'characters' }],
    columns: 'State',
    gap: [32, 16],
  }
}

/* ── The sets, in page order ───────────────────────────────────────────── */

export interface MeterDoc {
  key: string
  title: string
  usage: string
  tokens: string
  file: string
}

export const METERS: { doc: MeterDoc; spec: (deps: { icons: Map<string, IconBuild>; get: (key: string) => ComponentSetNode }) => SetSpec }[] = [
  {
    doc: {
      key: 'component:gauge',
      title: 'Gauge',
      usage: '<Gauge value={72} thresholds={[{ value: 0, tone: "danger", label: "Critical" }, { value: 60, tone: "success", label: "Nominal" }]} />',
      tokens: 'Track role/fg at 12%  ·  Fill palette/<tone> (neutral role/fg at 70%)  ·  Index: a notch 5 wide through the ring, caret role/fg on the rim  ·  Value Heading/xl–4xl (Bezel: mono 500)  ·  Band UI/xs–lg (Bezel: Bezel/Eyebrow)  ·  144, 208, 256 wide',
      file: SOURCES[0]!.file,
    },
    spec: () => gaugeSpec(),
  },
  {
    doc: {
      key: 'component:segmented-meter',
      title: 'Segmented meter',
      usage: '<SegmentedMeter label="Threads" value={47} thresholds={[{ value: 80, tone: "warning" }]} />',
      tokens: 'Cells palette/<tone> (neutral role/fg at 75%), off role/well  ·  40 cells, 10 high, 3px apart, 2px radius  ·  Label UI/sm muted (Bezel: Bezel/Eyebrow)  ·  Value UI/lg/Medium (Bezel: mono)  ·  Gap space/2-5',
      file: SOURCES[1]!.file,
    },
    spec: () => segmentedMeterSpec(),
  },
  {
    doc: {
      key: 'component:limit-meter',
      title: 'Limit meter',
      usage: '<LimitMeter spent={715.5} limit={2000} markers={[{ value: 1600, label: "freeze" }]} format={{ style: "currency", currency: "USD" }} />',
      tokens: 'Remaining mono 36–40 role/fg, cents role/fg-muted  ·  Ruler role/well, 24 high  ·  Ticks palette/<tone>, runway role/warning, idle role/fg at 25–45%  ·  Spend: a 1px role/fg hairline and a 10 × 6 caret under the ruler  ·  Axis Mono/sm muted',
      file: SOURCES[2]!.file,
    },
    spec: () => allowanceSpec(),
  },
  {
    doc: {
      key: 'component:share-bar',
      title: 'Share bar',
      usage: '<ShareBar value={0.62} segments={20} tone="accent" label="Share of spend" />',
      tokens: 'Track role/fg at 10%  ·  Fill palette/<tone>, ui/chart-*, neutral role/fg-subtle  ·  Solid 6 high, radius/xs  ·  Segmented 12 high, 2px gaps, 1px radius',
      file: SOURCES[3]!.file,
    },
    spec: () => shareBarSpec(),
  },
  {
    doc: {
      key: 'component:treemap',
      title: 'Treemap',
      usage: '<Treemap items={library} highlight="photos" formatValue={(v) => `${v} GB`} label="Library by type" />',
      tokens: 'Cells role/hover edged role/line, 2px radius, 4px gaps  ·  Highlight role/accent at 14–28% edged role/accent, text role/accent-text  ·  Name Mono/sm, value Mono/sm muted  ·  Squarified, largest first',
      file: SOURCES[5]!.file,
    },
    spec: () => treemapSpec(),
  },
  {
    doc: {
      key: 'component:histogram-range',
      title: 'Histogram range',
      usage: '<HistogramRange bins={sizes} max={64} label="File size" format={(v) => `${v} MB`} defaultValue={[12, 40]} />',
      tokens: 'Bars role/fg at 15%, in range at 45% (accent: role/accent)  ·  Track role/canvas edged role/fg at 8% (Bezel: role/well, bezel/rail-edge)  ·  Range role/accent  ·  Thumbs role/action tabs 6 × 18, guides role/action at 50%  ·  Readout Mono/sm role/accent  ·  Axis Mono/xs muted',
      file: SOURCES[6]!.file,
    },
    spec: () => histogramSpec(),
  },
  {
    doc: {
      key: 'component:filter-chips',
      title: 'Filter chips',
      usage: '<FilterChips defaultValue={["priority:in(p1,p2)", "repo:web"]} validate={(t, all) => (all.includes(t) ? "Already there" : null)} />',
      tokens: 'Frame role/line-control on role/canvas, bezel/field-area-radius (Bezel: role/field)  ·  Focus role/focus with Focus/field  ·  Chips role/accent at 12% edged at 35%, Mono/sm role/accent, 28 high  ·  Error UI/sm/Medium role/danger',
      file: SOURCES[7]!.file,
    },
    spec: ({ icons }) => filterChipsSpec(icons),
  },
]
