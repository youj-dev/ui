import { add, bezel, box, rect, solid, style, text, vector, type Ink } from '../draw'
import { button, eyebrow, figure, icon, pick, themeVar, type Deps, type Entry, type Source } from './parts'
import { ref, type SetSpec } from './set'

/* Catalog batch: instruments. Meters, dials, time and media, each from its
 * file in packages/ui/src/components/ui, drawn as a static example (a fixed
 * dataset, at rest); motion, sound and live clocks live in code. In Bezel
 * their labels are the mono capital eyebrow and their figures are mono
 * (bezel.css, "Meters and ranges"), which parts.ts's eyebrow() and figure()
 * draw. */

export const SOURCES: Source[] = [
  {
    file: 'packages/ui/src/components/ui/refill-meter.tsx',
    classes: [
      "className=\"relative flex h-7 gap-(--bucket-gap)\"",
      "const FILL: Record<BucketState, string> = { ok: 'bg-fg', low: 'bg-warning', empty: 'bg-danger' }",
      "'bg-[color-mix(in_oklab,var(--color-danger)_16%,transparent)]'",
      'className="shrink-0 font-mono text-ui-lg font-medium tabular-nums"',
    ],
  },
  {
    file: 'packages/ui/src/components/ui/allocation-meter.tsx',
    classes: [
      "const TONES: EnvelopeTone[] = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5']",
      'className="relative flex h-36 flex-col-reverse gap-[3px] sm:h-40"',
      "'min-h-0 flex-1 rounded-[2px] transition-[background-color,opacity,box-shadow] yj-duration-fast ease-standard'",
      "over ? 'bg-danger' : 'bg-well'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/segmented-ring.tsx',
    classes: [
      'const RULER = { outer: 123, minor: 119.5, major: 115.5 }',
      'const BAND = { r: 102, width: 15 }',
      "const KIND_TONE: Record<IntervalKind, IntervalTone> = { work: 'chart-1', rest: 'chart-5', warmup: 'chart-3'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/share-ring.tsx',
    classes: [
      "sm: { root: 'size-32', value: 'text-xl', unit: 'text-ui-xs', cells: 48, thick: 18, width: 0.56, hub: 72 }",
      "default: { root: 'size-48', value: 'text-[1.875rem]', unit: 'text-ui-xs', cells: 60, thick: 16, width: 0.56, hub: 76 }",
      'className="h-3.5 w-1.5 shrink-0 rounded-[2px] bg-(--macro-tone)"',
    ],
  },
  {
    file: 'packages/ui/src/components/ui/lane-meter.tsx',
    classes: ['const GAP = 3', "'relative col-span-full row-start-2 flex h-2.5 min-w-0 gap-0.75'", "const cellClass = 'min-w-0 flex-1 rounded-[2px]'"],
  },
  {
    file: 'packages/ui/src/components/ui/progress-path.tsx',
    classes: ['const RING = { r: 27, width: 3.5 }', 'const PITCH = 92', "'bg-fg text-canvas shadow-[inset_0_1px_0_color-mix(in_oklab,var(--color-canvas)_18%,transparent)]'"],
  },
  {
    file: 'packages/ui/src/components/ui/day-rail.tsx',
    classes: [
      'const SKY = 84',
      'className="absolute top-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-fg bg-surface rtl:translate-x-1/2"',
      "className={past ? 'stroke-fg-muted' : 'stroke-accent'}",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/day-ring.tsx',
    classes: ['const RULER = { outer: 114, minor: 110.5, hour: 107.5, major: 104.5, label: 96.5, band: 109.25 }', 'const TRACK = { outer: 86, inner: 50, gap: 10 }', 'className="fill-warning stroke-warning"'],
  },
  {
    file: 'packages/ui/src/components/ui/time-lanes.tsx',
    classes: [
      "'bg-[color-mix(in_oklab,var(--rota-tone)_26%,transparent)] shadow-[inset_2px_0_0_var(--rota-tone)]",
      "state === 'current' && !s.override && 'bg-[color-mix(in_oklab,var(--rota-tone)_38%,transparent)] ring-1 ring-(--rota-tone)'",
      "state === 'ended' && 'opacity-70 hover:opacity-100'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/rollout-ruler.tsx',
    classes: [
      "small ? (gate ? 'top-0.5 h-2 w-px' : 'top-1 h-1 w-px') : gate ? 'top-1 h-5 w-0.5' : 'top-2 h-3 w-px'",
      "lit ? (gate ? 'opacity-100' : 'opacity-60') : runway ? (gate ? 'opacity-45' : 'opacity-30') : gate ? 'opacity-35' : 'opacity-20'",
      "'absolute start-0 top-1/2 h-9 w-3 -translate-x-1/2 -translate-y-1/2 rounded-[min(var(--radius-sm),5px)] bg-action shadow-sm-soft rtl:translate-x-1/2'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/stage-rail.tsx',
    classes: ["passed: 'bg-fg'", "running: 'bg-accent'", 'className="flex h-2 gap-0.5"', "'relative isolate grid w-full gap-0.5 rounded-xl p-0.5'"],
  },
  {
    file: 'packages/ui/src/components/ui/severity-timeline.tsx',
    classes: [
      "const SEVERITY_TONE: Record<Severity, Tone> = { 1: 'danger', 2: 'warning', 3: 'accent', 4: 'neutral' }",
      "'size-2 rounded-full bg-(--tone) shadow-[0_0_0_3px_color-mix(in_oklab,var(--tone)_22%,transparent)]'",
      'inline-flex h-5 shrink-0 items-center rounded-full bg-[color-mix(in_oklab,var(--tone)_calc(12%+6%*var(--yj-dark)),transparent)] px-1.5 font-mono text-ui-xs font-medium text-(--ink)',
    ],
  },
  {
    file: 'packages/ui/src/components/ui/slot-grid.tsx',
    classes: [
      'const PIPS = 8',
      "const PIP_ON: Record<SlotState, string> = { open: 'bg-fg', few: 'bg-warning', full: '', closed: '', mine: 'bg-success' }",
      "? 'bg-fg text-canvas shadow-sm-soft'",
      "wide ? 'h-12 items-center gap-3 px-3.5' : 'h-14 flex-col justify-between px-2.5 py-2'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/dial.tsx',
    classes: ['const START = -135', 'const BAND = { r: 90, width: 12 }', 'const RULER = { inner: 104, minor: 109, major: 113 }'],
  },
  {
    file: 'packages/ui/src/components/ui/hours-dial.tsx',
    classes: ['const RULER = { inner: 96, minor: 102, hour: 106, quarter: 110, lit: 90 }', 'const BAND = 18', 'const HANDLE = 101'],
  },
  {
    file: 'packages/ui/src/components/ui/activity-rings.tsx',
    classes: [
      "const TONES: ActivityRingTone[] = ['chart-1', 'chart-2', 'chart-3', 'chart-4']",
      'const GEOMETRY: Record<number, { thick: number; gap: number }> = { 2: { thick: 22, gap: 5 }, 3: { thick: 17, gap: 4 }, 4: { thick: 14, gap: 3.5 } }',
    ],
  },
  {
    file: 'packages/ui/src/components/ui/world-clock.tsx',
    classes: ["work: 'bg-accent-subtle text-accent-text'", "evening: 'bg-band text-fg-muted'", "night: 'bg-well text-fg-subtle'"],
  },
  {
    file: 'packages/ui/src/components/ui/track-timeline.tsx',
    classes: ['const ROW = 56', 'const RULER = 28', "level * 10 > cell + 0.25 ? (cell >= 8 ? 'bg-warning' : 'bg-(--track)') : 'bg-well'"],
  },
  {
    file: 'packages/ui/src/components/ui/waveform-scrubber.tsx',
    classes: ['const PITCH = 5', "layer(clipping ? 'stroke-line' : 'stroke-line-strong', 'none')", 'className="absolute -top-1 size-2.5 rounded-full bg-accent ring-2 ring-surface'],
  },
  {
    file: 'packages/ui/src/components/ui/audio-recorder/audio-recorder.tsx',
    classes: [
      "'flex w-full max-w-md flex-col rounded-xl border border-line bg-surface text-fg'",
      '<span aria-hidden className="size-3 rounded-xs bg-danger" />',
      "className={maxDuration - elapsed <= 10 ? 'stroke-danger' : 'stroke-accent'}",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/voice-orb/voice-orb.tsx',
    classes: ["const SIZES = { sm: 'size-16', default: 'size-28', lg: 'size-44', xl: 'size-64' } as const", 'const RADIUS = 0.62'],
  },
  {
    file: 'packages/ui/src/components/ui/image-compare.tsx',
    classes: [
      "'relative isolate overflow-hidden rounded-xl bg-well select-none'",
      "'pointer-events-auto relative grid size-control shrink-0 place-items-center rounded-full border border-line bg-key text-fg shadow-md-soft focus-ring'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/image-accordion.tsx',
    classes: [
      "'group/panel focus-ring relative basis-0 cursor-pointer overflow-hidden rounded-lg bg-well text-start'",
      "'pointer-events-none absolute bottom-3 start-3 flex w-max flex-col gap-0.5 rounded-md border border-line bg-surface px-3 py-2 text-fg shadow-sm-soft'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/annotated-image.tsx',
    classes: ["lit ? 'bg-accent text-on-accent' : 'bg-fg text-canvas'", "lit ? 'stroke-accent' : active ? 'stroke-line-strong' : 'stroke-fg-subtle'"],
  },
  {
    file: 'packages/ui/src/components/ui/live-cursors.tsx',
    classes: ['d="M1 1 L15 8.6 L8.6 10.2 L5.4 16.4 Z"', 'const PALETTE = 5'],
  },
  {
    file: 'packages/ui/src/components/ui/whiteboard/whiteboard-toolbar.tsx',
    classes: ["{ tool: 'select', key: 'V', icon: <MousePointerIcon />, label: 'whiteboardSelect', group: 0 }", "{ tool: 'rectangle', key: 'R', icon: <SquareIcon />, label: 'whiteboardRectangle', group: 1 }"],
  },
]

const f = (n: number) => Math.round(n * 100) / 100

/** A point `r` from (cx, cy), at `deg` clockwise from twelve o'clock. */
function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180
  return [f(cx + r * Math.sin(a)), f(cy - r * Math.cos(a))]
}

/** An open arc's path, clockwise from `from` to `to` degrees. */
function arcPath(cx: number, cy: number, r: number, from: number, to: number) {
  const sweep = Math.min(359.99, Math.max(0.01, to - from))
  const [ax, ay] = polar(cx, cy, r, from)
  const [bx, by] = polar(cx, cy, r, from + sweep)
  return `M${ax},${ay} A${f(r)},${f(r)} 0 ${sweep > 180 ? 1 : 0} 1 ${bx},${by}`
}

/** A stroked arc with flat ends, in an ink. */
function arc(parent: FrameNode | ComponentNode, cx: number, cy: number, r: number, from: number, to: number, width: number, ink: Ink, name = 'Arc', round = false) {
  const v = vector(parent, arcPath(cx, cy, r, from, to), { stroke: solid(ink), strokeWidth: width }, name) as VectorNode
  if (!round) v.strokeCap = 'NONE'
  return v
}

/** A full circle as a stroked path (a hairline rule, a ring). */
function circle(parent: FrameNode | ComponentNode, cx: number, cy: number, r: number, width: number, ink: Ink, name = 'Rule') {
  const d = `M${f(cx - r)},${f(cy)} A${f(r)},${f(r)} 0 1 1 ${f(cx + r)},${f(cy)} A${f(r)},${f(r)} 0 1 1 ${f(cx - r)},${f(cy)} Z`
  return vector(parent, d, { stroke: solid(ink), strokeWidth: width }, name)
}

/** A filled disc. */
function disc(parent: FrameNode | ComponentNode, cx: number, cy: number, r: number, ink: Ink, name = 'Dot') {
  const d = `M${f(cx - r)},${f(cy)} A${f(r)},${f(r)} 0 1 1 ${f(cx + r)},${f(cy)} A${f(r)},${f(r)} 0 1 1 ${f(cx - r)},${f(cy)} Z`
  return vector(parent, d, { fill: solid(ink) }, name)
}

/** A rectangle `w` wide and `h` long, its top-centre `r` from the hub, turned to `deg` (a dial's cell or tick). */
function spoke(parent: FrameNode | ComponentNode, cx: number, cy: number, r: number, w: number, h: number, deg: number, ink: Ink, name = 'Cell') {
  const a = (deg * Math.PI) / 180
  const out: [number, number] = [Math.sin(a), -Math.cos(a)]
  const across: [number, number] = [Math.cos(a), Math.sin(a)]
  const pt = (along: number, side: number) => `${f(cx + out[0] * along + across[0] * side)},${f(cy + out[1] * along + across[1] * side)}`
  const d = `M${pt(r, -w / 2)} L${pt(r, w / 2)} L${pt(r - h, w / 2)} L${pt(r - h, -w / 2)} Z`
  return vector(parent, d, { fill: solid(ink) }, name)
}

/** A diamond (a milestone's mark) centred on (cx, cy), `r` from its centre to a point. */
function diamond(parent: FrameNode | ComponentNode, cx: number, cy: number, r: number, ink: Ink) {
  return vector(parent, `M${f(cx)},${f(cy - r)} L${f(cx + r)},${f(cy)} L${f(cx)},${f(cy + r)} L${f(cx - r)},${f(cy)} Z`, { fill: solid(ink) }, 'Diamond')
}

/** Places a node absolutely in a frame without auto layout. */
function at<T extends SceneNode>(parent: FrameNode | ComponentNode, node: T, x: number, y: number): T {
  add(parent, node)
  node.x = Math.round(x)
  node.y = Math.round(y)
  return node
}

/** A mono figure (Bezel) in a text style. */
const fig = async (chars: string, styleName: string, ink: Ink = 'role/fg', name = 'Value') => figure(await text(chars, styleName, ink, { name }))

/** A legend swatch: a small bar in a tone. */
const swatch = (ink: Ink, w = 6, h = 14) => rect('Swatch', w, h, ink, 2)

const CHART: string[] = ['role/chart-1', 'role/chart-2', 'role/chart-3', 'role/chart-4', 'role/chart-5']

/* ── RefillMeter ────────────────────────────────────────────────────────── */

const BUCKET = { w: 360, cells: 30, capacity: 60, burst: 20, gap: 2 }

async function drawRefill(c: ComponentNode, state: 'ok' | 'low' | 'empty') {
  const B = BUCKET
  const tokens = state === 'ok' ? 42 : state === 'low' ? 14 : 0
  await style(c, { dir: 'col', gap: 'space/2-5', w: B.w })
  const value = await box(
    { name: 'Value', dir: 'row', align: 'baseline' },
    await fig(String(tokens), 'UI/lg/Medium', state === 'empty' ? 'role/danger-text' : 'role/fg', 'Tokens'),
    await fig(` / ${B.capacity}`, 'UI/lg/Medium', 'role/fg-muted', 'Capacity'),
  )
  const head = await box({ name: 'Header', dir: 'row', align: 'baseline', justify: 'between', gap: 'space/3', w: 'fill' }, ref(await eyebrow('Tokens'), 'Label'), value)
  // The burst flag over the cells, at the marker.
  const flagAt = (B.burst / B.capacity) * B.w
  const flags = await box({ name: 'Flags', dir: 'none', w: B.w, h: 16 })
  const flag = await box({ name: 'Burst flag', dir: 'row', gap: 'space/1-5', align: 'baseline' }, await eyebrow('Burst', 'Term', 'role/warning-text'), await fig(String(B.burst), 'UI/xs/Regular', 'role/warning-text'))
  at(flags, flag, flagAt + 8, 0)
  const track = await box({ name: 'Track', dir: 'none', w: B.w, h: 28 })
  const lit = Math.floor(tokens / (B.capacity / B.cells))
  const cw = (B.w - B.gap * (B.cells - 1)) / B.cells
  const fill: Ink = state === 'ok' ? 'role/fg' : state === 'low' ? 'role/warning' : 'role/danger'
  // Off cells sit in the well (empty: a danger wash); a cell's corner is min(radius-xs, 2px).
  for (let i = 0; i < B.cells; i++) at(track, rect(i < lit ? 'Cell on' : 'Cell off', f(cw), 28, i < lit ? fill : state === 'empty' ? ['role/danger', 0.16] : 'role/well', 2), f(i * (cw + B.gap)), 0)
  // The burst marker: a 2px warning bar ringed in the surface, from above the flag to under the cells.
  at(track, rect('Burst', 2, 28, 'role/warning', 'radius/full'), flagAt - 1, 0)
  const reserve = rect('Reserve', Math.round(flagAt - B.gap), 2, ['role/warning', 0.45], 'radius/full')
  const gauge = await box({ name: 'Gauge', dir: 'col', gap: 'space/1-5', w: 'fill' }, flags, track, reserve)
  const term = async (word: string, figureChars?: string) =>
    box({ name: word, dir: 'row', gap: 'space/2', align: 'baseline' }, await eyebrow(word, 'Term'), figureChars ? await fig(figureChars, 'UI/sm/Regular', 'role/fg', 'Figure') : null)
  const foot = await box(
    { name: 'Footer', dir: 'row', align: 'baseline', justify: 'between', gap: 'space/3', w: 'fill' },
    await term('Refill', '+10/s'),
    state === 'empty' ? await eyebrow('Empty', 'Empty', 'role/danger-text') : await term('Full in', state === 'ok' ? '1.8s' : '4.6s'),
  )
  add(c, head, gauge, foot)
}

function refillSpec(): SetSpec {
  return {
    key: 'component:refill-meter',
    name: 'Refill meter',
    description:
      'RefillMeter in packages/ui: a rate limit’s token bucket as cells you can count (here 60 tokens in 30 cells), lit in the ink while they’re in the bucket. A burst marker names the room to keep; under it the lit cells turn to the warning tone, and empty the track tints danger. In code the edge cell charges from its foot at the refill rate, a spend drains the cells from the edge inward, and the clock catches up in hidden tabs.',
    variants: (['ok', 'low', 'empty'] as const).map((state) => ({ props: { State: state }, build: (c) => drawRefill(c, state) })),
    properties: [{ name: 'Label', type: 'TEXT', default: 'Tokens', field: 'characters' }],
    columns: 'State',
    gap: [40, 16],
  }
}

/* ── AllocationMeter ────────────────────────────────────────────────────── */

const ENVELOPES = [
  { name: 'Groceries', left: '$212', lit: 11, rollover: 0, state: 'ok' },
  { name: 'Dining', left: '$36', lit: 2, rollover: 0, state: 'low' },
  { name: 'Transport', left: '$140', lit: 13, rollover: 3, state: 'ok' },
  { name: 'Fun', left: '−$24', lit: 0, rollover: 0, state: 'over' },
] as const

async function drawAllocation(c: ComponentNode, legend: boolean) {
  const segments = 16
  const colW = 96
  await style(c, { dir: 'col', gap: 'space/3', w: 4 * colW + 3 * 12 })
  const rack = await box({ name: 'Rack', dir: 'row', gap: 'space/3', w: 'fill' })
  for (const [i, e] of ENVELOPES.entries()) {
    const tone = CHART[i]!
    const over = e.state === 'over'
    const col = await box({ name: e.name, dir: 'col', gap: 'space/2', pad: [8, 6, 10, 6], w: 'fill', radius: 'radius/xl' })
    const v = figure(await text(e.left, 'UI/sm/Medium', over ? 'role/danger-text' : e.state === 'low' ? 'role/warning-text' : 'role/fg', { name: 'Value', w: 'fill', align: 'CENTER' }))
    const track = await box({ name: 'Track', dir: 'col', gap: 3, w: 'fill', h: 144 })
    const ch = (144 - 3 * (segments - 1)) / segments
    // The column fills from its foot: the top cells are off, then the lit ones; rollover sits on top of the lit run.
    for (let k = segments - 1; k >= 0; k--) {
      const on = k < e.lit
      const rolled = on && k >= e.lit - e.rollover
      const ink: Ink = over ? ['role/danger', 0.12] : !on ? ['role/fg', 0.07] : rolled ? [tone, 0.16] : e.state === 'low' ? 'role/warning' : [tone, 0.9]
      const cell = rect(on ? (rolled ? 'Rollover cell' : 'Cell on') : 'Cell off', 10, f(ch), ink, 2)
      add(track, cell)
      cell.layoutSizingHorizontal = 'FILL'
    }
    const base = rect('Base', 10, 2, over ? 'role/danger' : 'role/well', 'radius/full')
    const spill = await box({ name: 'Spill', dir: 'col', gap: 3, align: 'center', w: 'fill', h: 16 })
    if (over) for (const [j, w] of [70, 48].entries()) {
      const drip = rect('Drip', Math.round((colW - 12) * (w / 100)), 3, 'role/danger', 'radius/full')
      drip.opacity = 1 - j * 0.25
      add(spill, drip)
    }
    const name = await text(e.name, bezel() ? 'Bezel/Eyebrow' : 'UI/xs/Regular', 'role/fg-muted', { name: 'Label', w: 'fill', align: 'CENTER', truncate: true })
    add(col, v, track, base, spill, name)
    base.layoutSizingHorizontal = 'FILL'
    add(rack, col)
  }
  add(c, rack)
  if (!legend) return
  const readout = await box(
    { name: 'Readout', dir: 'row', gap: 'space/2', align: 'baseline' },
    await text('Groceries', 'Mono/sm', 'role/fg'),
    await text('·', 'Mono/sm', 'role/fg-subtle'),
    await text('$212 left', 'Mono/sm', 'role/fg-muted'),
  )
  const tag = async (mark: SceneNode, word: string) => box({ name: word, dir: 'row', gap: 'space/1-5', align: 'center' }, mark, await eyebrow(word, 'Tag'))
  const keys = await box(
    { name: 'Legend', dir: 'row', gap: 'space/3', align: 'center' },
    await tag(rect('Rollover', 16, 10, ['role/fg-muted', 0.16], 2), 'Rollover'),
    await tag(rect('Overspent', 16, 2, 'role/danger', 'radius/full'), 'Overspent'),
  )
  add(c, await box({ name: 'Footer', dir: 'row', align: 'center', justify: 'between', gap: 'space/4', w: 'fill' }, readout, keys))
}

function allocationSpec(): SetSpec {
  return {
    key: 'component:allocation-meter',
    name: 'Allocation meter',
    description:
      'AllocationMeter in packages/ui: budget envelopes as a rack of cell columns in the chart tones, holding what’s left and draining from the top. Rollover sits on top as a tinted run (hatched in code); low turns warning; an envelope spent past empty washes danger and drips under its base. In code you drag money between envelopes (or move it from the keyboard): the cells it would take dim, the ones it would add ghost in, and a chip carries the amount across.',
    variants: (['true', 'false'] as const).map((legend) => ({ props: { Legend: legend }, build: (c) => drawAllocation(c, legend === 'true') })),
    properties: [],
    columns: 'Legend',
    gap: [48, 16],
  }
}

/* ── SegmentedRing ──────────────────────────────────────────────────────── */

const WORKOUT: { kind: 'work' | 'rest' | 'warmup' | 'cooldown'; s: number }[] = [
  { kind: 'warmup', s: 60 },
  ...[1, 2, 3, 4].flatMap(() => [
    { kind: 'work' as const, s: 40 },
    { kind: 'rest' as const, s: 20 },
  ]),
  { kind: 'cooldown', s: 60 },
]
const KIND_INK: Record<string, string> = { work: 'role/chart-1', rest: 'role/chart-5', warmup: 'role/chart-3', cooldown: 'role/chart-3' }

async function drawSegmentedRing(c: ComponentNode, phase: 'work' | 'rest') {
  const W = 256
  const s = W / 256
  const cx = W / 2
  await style(c, { dir: 'none', w: W, h: W })
  const total = WORKOUT.reduce((n, i) => n + i.s, 0)
  const elapsed = phase === 'work' ? 145 : 170
  // The ruler: a tick every ten seconds, majors every minute; passed ticks a step brighter.
  const ticks = total / 10
  for (let i = 0; i < ticks; i++) {
    const major = i % 6 === 0
    const deg = (i / ticks) * 360
    const [x1, y1] = polar(cx, cx, (major ? 115.5 : 119.5) * s, deg)
    const [x2, y2] = polar(cx, cx, 123 * s, deg)
    const tick = vector(c, `M${x1},${y1} L${x2},${y2}`, { stroke: solid(['role/fg', major ? 0.6 : (i * 10) / total <= elapsed / total ? 0.38 : 0.18]), strokeWidth: major ? 1.5 : 1 }, major ? 'Major tick' : 'Tick')
    tick.name = major ? 'Major tick' : 'Tick'
  }
  circle(c, cx, cx, (102 - 7.5 - 7) * s, 1, 'role/line')
  const gap = 1.4
  let start = 0
  let head: [number, number] = [cx, cx]
  let current: (typeof WORKOUT)[number] = WORKOUT[0]!
  let left = 0
  for (const interval of WORKOUT) {
    const from = (start / total) * 360 + gap / 2
    const to = ((start + interval.s) / total) * 360 - gap / 2
    const ink = KIND_INK[interval.kind]!
    const done = start + interval.s <= elapsed
    const now = start <= elapsed && elapsed < start + interval.s
    arc(c, cx, cx, 102 * s, from, to, 15 * s, [ink, done ? 0.78 : 0.16], done ? 'Interval done' : 'Interval ahead')
    if (now) {
      const p = (elapsed - start) / interval.s
      const end = from + (to - from) * p
      arc(c, cx, cx, 102 * s, from, end, 15 * s, ink, 'Progress')
      head = polar(cx, cx, 102 * s, end)
      current = interval
      left = start + interval.s - elapsed
    }
    start += interval.s
  }
  const tone = KIND_INK[current.kind]!
  disc(c, head[0], head[1], 15 * 0.72 * s, [tone, 0.3], 'Head halo')
  circle(c, head[0], head[1], (15 / 2 - 1.5) * s, 2.5, 'role/surface', 'Head ring')
  disc(c, head[0], head[1], (15 / 2 - 1.5) * s, 'role/fg', 'Head')
  const works = WORKOUT.filter((i) => i.kind === 'work').length
  const round = 2
  const value = await box(
    { name: 'Value', dir: 'row', align: 'baseline' },
    await fig(String(round), 'Heading/5xl', 'role/fg', 'Round'),
    await fig(`/${works}`, 'Heading/xl', 'role/fg-muted', 'Of'),
  )
  const chip = await box(
    { name: 'Phase', dir: 'row', gap: 'space/1-5', align: 'center', pad: [3, 8], radius: 'radius/full', fill: [tone, 0.16] },
    rect('Dot', 6, 6, tone, 'radius/full'),
    await eyebrow(current.kind === 'work' ? 'Work' : 'Rest', 'Phase', 'role/fg'),
    await text(`0:${String(left).padStart(2, '0')}`, 'Mono/sm', 'role/fg-muted', { name: 'Left' }),
  )
  const center = await box({ name: 'Center', dir: 'col', gap: 'space/1-5', align: 'center' }, await eyebrow('Round', 'Label'), value, chip)
  at(c, center, cx - center.width / 2, cx - center.height / 2)
}

function segmentedRingSpec(): SetSpec {
  return {
    key: 'component:segmented-ring',
    name: 'Segmented ring',
    description:
      'SegmentedRing in packages/ui: an interval workout on one dial, every interval an arc as long as it lasts (work chart-1, rest chart-5, warm-up and cool-down chart-3), clockwise from the top inside a ruler of ten-second ticks. Behind you lit, the current one filling with a bright head, the rest a dim wash. The centre holds the round in big mono, the phase and the time left. It shows `elapsed`; the app runs the clock, and the cues and speech live in code.',
    variants: (['work', 'rest'] as const).map((phase) => ({ props: { Phase: phase }, build: (c) => drawSegmentedRing(c, phase) })),
    properties: [],
    columns: 'Phase',
    gap: [48, 16],
  }
}

/* ── ShareRing ──────────────────────────────────────────────────────────── */

const RING_SIZES = {
  default: { px: 192, value: 'Heading/3xl', cells: 60, thick: 16, hub: 76 },
  xs: { px: 28, value: '', cells: 12, thick: 34, hub: 0 },
  sm: { px: 128, value: 'Heading/xl', cells: 48, thick: 18, hub: 72 },
  lg: { px: 240, value: 'Heading/4xl', cells: 60, thick: 15, hub: 78 },
} as const
const MACROS = [
  { label: 'Protein', amount: '96 g', share: '31%', value: 384 },
  { label: 'Carbs', amount: '128 g', share: '41%', value: 512 },
  { label: 'Fat', amount: '38 g', share: '28%', value: 344 },
]

async function drawShareRing(c: ComponentNode, size: keyof typeof RING_SIZES) {
  const S = RING_SIZES[size]
  const W = S.px
  const k = W / 208
  const cx = W / 2
  const dial = await box({ name: 'Dial', dir: 'none', w: W, h: W })
  if (S.hub) circle(dial, cx, cx, S.hub * k, 1, 'role/line')
  // 1,240 of a 2,000 kcal day: the parts take whole cells by the largest remainder; the rest stays dark.
  const total = MACROS.reduce((n, m) => n + m.value, 0)
  const lit = Math.round((total / 2000) * S.cells)
  const owner: number[] = []
  let used = 0
  MACROS.forEach((m, i) => {
    const n = i === MACROS.length - 1 ? lit - used : Math.round((m.value / total) * lit)
    used += n
    for (let j = 0; j < n; j++) owner.push(i)
  })
  const mid = 100 - S.thick / 2
  const width = ((2 * Math.PI * mid) / S.cells) * (size === 'xs' ? 0.74 : 0.56)
  for (let i = 0; i < S.cells; i++) {
    const o = owner[i]
    spoke(dial, cx, cx, 100 * k, width * k, S.thick * k, ((i + 0.5) / S.cells) * 360, o === undefined ? 'role/well' : CHART[o]!, o === undefined ? 'Cell off' : 'Cell on')
  }
  if (size !== 'xs') {
    const center = await box(
      { name: 'Center', dir: 'col', gap: 'space/2-5', align: 'center' },
      ref(await fig('1,240', S.value, 'role/fg'), 'Value'),
      ref(await eyebrow('kcal', 'Unit'), 'Unit'),
    )
    at(dial, center, cx - center.width / 2, cx - center.height / 2)
  }
  await style(c, { dir: 'col', gap: 'space/5', align: 'center', w: size === 'xs' ? 'hug' : 280 })
  add(c, dial)
  if (size === 'xs') return
  const legend = await box({ name: 'Legend', dir: 'col', w: 'fill' })
  for (const [i, m] of MACROS.entries()) {
    const row = await box(
      { name: m.label, dir: 'row', gap: 'space/3', align: 'center', pad: [8, 0], w: 'fill', stroke: i ? 'role/line' : undefined, sides: i ? { top: 1 } : undefined },
      swatch(CHART[i]!),
      await box({ name: 'Label', dir: 'row', w: 'fill' }, await eyebrow(m.label)),
      await fig(m.amount, 'UI/lg/Medium', 'role/fg', 'Amount'),
      await box({ name: 'Share', dir: 'row', justify: 'end', w: 40 }, await fig(m.share, 'UI/sm/Regular', 'role/fg-muted', 'Share')),
    )
    row.minHeight = 40
    add(legend, row)
  }
  add(c, legend)
}

function shareRingSpec(): SetSpec {
  return {
    key: 'component:share-ring',
    name: 'Share ring',
    description:
      'ShareRing in packages/ui: a whole split into its parts as a dial of cells (here protein, carbs and fat of 1,240 of a 2,000 kcal day), clockwise from twelve, each lit in its part’s tone; the parts take whole cells by the largest remainder and the rest of the ring stays dark. The total sits in the bowl with its unit; the legend gives each part its amount and share. xs is an inline glyph with no bowl. In code the cells light round the dial on first view, and pointing at a part dims the others.',
    variants: (['default', 'xs', 'sm', 'lg'] as const).map((size) => ({ props: { Size: size }, build: (c) => drawShareRing(c, size) })),
    properties: [
      { name: 'Value', type: 'TEXT', default: '1,240', field: 'characters' },
      { name: 'Unit', type: 'TEXT', default: 'kcal', field: 'characters' },
    ],
    columns: 'Size',
    gap: [40, 16],
  }
}

/* ── LaneMeter ──────────────────────────────────────────────────────────── */

const LANES: { label: string; value: number; max?: number; tone: Ink }[] = [
  { label: 'Queued', value: 128, tone: 'role/fg-subtle' },
  { label: 'Running', value: 24, max: 32, tone: 'role/accent' },
  { label: 'Failed', value: 6, tone: 'role/danger' },
  { label: 'Done', value: 412, tone: 'role/success' },
]

async function drawLaneMeter(c: ComponentNode, layout: 'wide' | 'narrow') {
  const cells = 24
  const wide = layout === 'wide'
  const W = wide ? 520 : 300
  await style(c, { dir: 'col', gap: wide ? 'space/3' : 'space/4', w: W })
  const scale = Math.max(...LANES.filter((l) => l.max === undefined).map((l) => l.value))
  const trackW = wide ? 300 : W
  for (const lane of LANES) {
    const share = lane.value / (lane.max ?? scale)
    const lit = share >= 1 ? cells : Math.max(1, Math.min(cells - 1, Math.round(share * cells)))
    const track = await box({ name: 'Track', dir: 'row', gap: 3, w: trackW, h: 10 })
    const cw = f((trackW - 3 * (cells - 1)) / cells)
    // Unlit cells are a tint of the ink (9% light, 7% dark), so they read on a card and on the page.
    for (let i = 0; i < cells; i++) add(track, rect(i < lit ? 'Cell on' : 'Cell off', cw, 10, i < lit ? lane.tone : ['role/fg', 0.08], 2))
    const value = await box(
      { name: 'Value', dir: 'row', align: 'baseline' },
      await fig(lane.value.toLocaleString('en-US'), 'UI/lg/Regular', 'role/fg', 'Figure'),
      lane.max !== undefined ? await fig(` / ${lane.max}`, 'UI/lg/Regular', 'role/fg-muted', 'Max') : null,
    )
    const label = await box({ name: 'Label', dir: 'row', w: wide ? 96 : 'fill' }, await eyebrow(lane.label))
    if (wide) {
      const end = await box({ name: 'End', dir: 'row', justify: 'end', w: 'fill' }, value)
      add(c, await box({ name: lane.label, dir: 'row', gap: 'space/4', align: 'center', w: 'fill' }, label, track, end))
    } else {
      const head = await box({ name: 'Header', dir: 'row', gap: 'space/3', align: 'baseline', w: 'fill' }, label, value)
      add(c, await box({ name: lane.label, dir: 'col', gap: 'space/2', w: 'fill' }, head, track))
    }
  }
}

function laneMeterSpec(): SetSpec {
  return {
    key: 'component:lane-meter',
    name: 'Lane meter',
    description:
      'LaneMeter in packages/ui: load across the lanes of a queue (queued, running, failed, done) as stacked rows of countable cells, every lane the same number of cells so the rows form one ruled grid: the label, the cells in the lane’s tone, the value with its own capacity muted. Any value above zero keeps one cell lit. On a narrow container each lane stacks. In code the cells light in order on first view, an active lane carries a light across, and items can be buttons with tooltips.',
    variants: (['wide', 'narrow'] as const).map((layout) => ({ props: { Layout: layout }, build: (c) => drawLaneMeter(c, layout) })),
    properties: [],
    columns: 'Layout',
    gap: [48, 16],
  }
}

/* ── ProgressPath ───────────────────────────────────────────────────────── */

async function drawProgressPath(c: ComponentNode, icons: Deps['icons']) {
  const W = 360
  const tone = 'role/chart-2'
  await style(c, { dir: 'col', gap: 'space/4', w: W })
  // The section head: a tone dot and the eyebrow, the title, and its progress as a figure over a thin bar.
  const bar = await box({ name: 'Bar', dir: 'none', w: 96, h: 6, radius: 'radius/full', fill: 'role/well', clip: true })
  at(bar, rect('Fill', 48, 6, tone, 'radius/full'), 0, 0)
  const head = await box(
    { name: 'Section', dir: 'row', gap: 'space/4', align: 'end', pad: [0, 4], w: 'fill' },
    await box(
      { name: 'Title', dir: 'col', gap: 'space/1', w: 'fill' },
      await box({ name: 'Eyebrow', dir: 'row', gap: 'space/2', align: 'center' }, rect('Dot', 6, 6, tone, 'radius/full'), await eyebrow('Section 1')),
      ref(await text('Greetings', 'UI/lg/Medium', 'role/fg', { name: 'Title' }), 'Title'),
    ),
    await box(
      { name: 'Progress', dir: 'col', gap: 'space/1-5', align: 'end', w: 96 },
      await box({ name: 'Value', dir: 'row', align: 'baseline' }, await fig('3', 'UI/base/Regular'), await fig('/6', 'UI/base/Regular', 'role/fg-muted', 'Of')),
      bar,
    ),
  )
  const H = 6 * 92 + 20
  const trail = await box({ name: 'Trail', dir: 'none', w: W, h: H })
  const cx = W / 2
  const nodes = [0, 1, 2, 3, 4, 5].map((i) => [f(cx + Math.sin((i / 5) * Math.PI * 1.5) * 70), 46 + i * 92] as [number, number])
  // The trail: solid where it's walked, dotted ahead (a Catmull–Rom curve through the nodes).
  const seg = (i: number) => {
    const p0 = nodes[Math.max(0, i - 1)]!
    const p1 = nodes[i]!
    const p2 = nodes[i + 1]!
    const p3 = nodes[Math.min(nodes.length - 1, i + 2)]!
    const c1 = [f(p1[0] + (p2[0] - p0[0]) / 6), f(p1[1] + (p2[1] - p0[1]) / 6)]
    const c2 = [f(p2[0] - (p3[0] - p1[0]) / 6), f(p2[1] - (p3[1] - p1[1]) / 6)]
    return `M${p1[0]},${p1[1]} C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`
  }
  for (let i = 0; i < nodes.length - 1; i++) {
    const walked = i < 3
    const v = vector(trail, seg(i), { stroke: solid(walked ? tone : ['role/fg', 0.24]), strokeWidth: walked ? 4 : 3 }, walked ? 'Walked' : 'Ahead') as VectorNode
    if (!walked) v.dashPattern = [0.1, 9]
  }
  const levels = 3
  const statuses = ['done', 'done', 'done', 'current', 'locked', 'milestone'] as const
  const titles = ['Hello', 'Introductions', 'At the café', 'Directions', 'Small talk', 'Section review']
  for (const [i, [x, y]] of nodes.entries()) {
    const status = statuses[i]!
    const locked = status === 'locked' || status === 'milestone'
    const mastery = i === 0 ? 3 : i < 3 ? 2 : 0
    if (status === 'current') disc(trail, x, y, 37, [tone, 0.16], 'Glow')
    for (let l = 0; l < levels; l++) {
      const gap = 360 / levels
      const lit = !locked && l < mastery
      arc(trail, x, y, 27, l * gap + 9, (l + 1) * gap - 9, 3.5, lit ? tone : ['role/fg', locked ? 0.09 : 0.16], lit ? 'Level on' : 'Level off', true)
    }
    const fill: Ink = status === 'current' ? 'role/fg' : locked ? ['role/fg', 0.06] : [tone, 0.22]
    const ink = status === 'current' ? 'role/canvas' : locked ? 'role/fg-subtle' : tone
    const glyph = status === 'milestone' ? 'trophy' : status === 'locked' ? 'lock' : status === 'current' ? 'star' : mastery === 3 ? 'crown' : 'check'
    const node = await box(
      { name: 'Node', dir: 'row', align: 'center', justify: 'center', w: 42, h: 42, radius: status === 'milestone' ? 'radius/lg' : 'radius/full', fill, stroke: status === 'done' ? [tone, 0.3] : undefined },
      icon(icons, glyph, status === 'milestone' ? 20 : 18, ink),
    )
    at(trail, node, x - 21, y - 21)
    const label = await box(
      { name: 'Label', dir: 'col', gap: 'space/0-5' },
      await text(titles[i]!, 'UI/base/Regular', locked ? 'role/fg-muted' : 'role/fg', { name: 'Lesson' }),
      await text(`${mastery}/${levels} levels`, 'Mono/xs', 'role/fg-muted', { name: 'Detail' }),
    )
    at(trail, label, x < cx ? x + 44 : x - 44 - label.width, y - label.height / 2)
    if (status === 'current') {
      const callout = await box({ name: 'Callout', dir: 'row', pad: [6, 10], radius: 'radius/full', fill: 'role/overlay', stroke: 'role/line', effect: 'Shadow/md' }, await eyebrow('Start', 'Start', 'role/fg'))
      at(trail, callout, x - callout.width / 2, y - 38 - callout.height)
    }
  }
  add(c, head, trail)
}

function progressPathSpec(deps: Deps): SetSpec {
  return {
    key: 'component:progress-path',
    name: 'Progress path',
    description:
      'ProgressPath in packages/ui: a course as a trail, lessons as nodes along a winding path in their section’s chart tone, a trophy milestone closing the section. Every node wears a ring of mastery levels; done lessons are a tinted disc with a check (a crown when mastered), the current one an ink disc glowing in the tone with a “Start” callout, the rest locked. The trail is solid where walked and dotted ahead. In code the trail draws itself, the callout glides on and the glow pings.',
    variants: [{ props: { State: 'rest' }, build: (c) => drawProgressPath(c, deps.icons) }],
    properties: [{ name: 'Title', type: 'TEXT', default: 'Greetings', field: 'characters' }],
    columns: 'State',
  }
}

/* ── DayRail ────────────────────────────────────────────────────────────── */

async function drawDayRail(c: ComponentNode) {
  const days = 5
  const W = 600
  const col = W / days
  await style(c, { dir: 'col', gap: 'space/2', w: W })
  const tabs = await box({ name: 'Days', dir: 'row', w: 'fill' })
  const dates = [['12', 'Mon'], ['13', 'Tue'], ['14', 'Wed'], ['15', 'Thu'], ['16', 'Fri']]
  for (let d = 0; d < days; d++) {
    const active = d === 1
    const tab = await box({ name: 'Day', dir: 'col', gap: 'space/0-5', pad: [6, 8], w: 'fill', radius: 'radius/lg', fill: active ? 'role/selected' : undefined })
    add(
      tab,
      await box({ name: 'Label', dir: 'row', gap: 'space/1-5', align: 'center' }, await eyebrow(`Day ${d + 1}`, 'Label', active ? 'role/fg' : 'role/fg-muted'), active ? rect('Today', 6, 6, 'role/accent', 'radius/full') : null),
      await box({ name: 'Value', dir: 'row', gap: 'space/1-5', align: 'baseline' }, await fig(dates[d]![0]!, 'UI/base/Regular'), await fig(dates[d]![1]!, 'UI/sm/Regular', active ? 'role/fg' : 'role/fg-muted', 'Weekday')),
    )
    add(tabs, tab)
  }
  const SKY = 84
  const BASE = SKY - 6
  const H = SKY + 36 + 48
  const track = await box({ name: 'Track', dir: 'none', w: W, h: H })
  for (let d = 0; d < days; d++) at(track, rect('Day rule', 1, H, 'role/line-subtle'), d * col, 0)
  const legs = [
    { x1: 0.06, x2: 0.22, code: 'LH 455', past: true },
    { x1: 0.7, x2: 0.86, code: 'TP 579', past: false },
  ]
  for (const leg of legs) {
    const lift = 34
    const a = leg.x1 * W
    const b = leg.x2 * W
    const v = vector(track, `M${f(a)},${BASE} Q${f((a + b) / 2)},${BASE - lift * 2} ${f(b)},${BASE}`, { stroke: solid(leg.past ? 'role/fg-muted' : 'role/fg'), strokeWidth: 1.5 }, 'Arc') as VectorNode
    if (!leg.past) v.dashPattern = [2, 4]
    const code = await box({ name: 'Code', dir: 'row', pad: [0, 4], radius: 'radius/sm', fill: 'role/surface' }, await text(leg.code, 'Mono/xs', 'role/fg-muted'))
    at(track, code, (a + b) / 2 - code.width / 2, BASE - lift - 24)
  }
  at(track, rect('Rail', W, 1, 'role/line'), 0, SKY)
  const stops = [
    { x: 0.06, code: 'SFO', shift: '' },
    { x: 0.22, code: 'FRA', shift: '+9 h' },
    { x: 0.7, code: '', shift: '' },
    { x: 0.86, code: 'LIS', shift: '−1 h' },
  ]
  for (const s of stops) {
    at(track, await box({ name: 'Node', w: 8, h: 8, radius: 'radius/full', fill: 'role/surface', stroke: 'role/fg', strokeWidth: 1.5 }), s.x * W - 4, SKY - 4)
    if (!s.code) continue
    const mark = await box(
      { name: 'Stop', dir: 'row', gap: 'space/1', align: 'center' },
      await text(s.code, 'Mono/xs', 'role/fg', { name: 'Code' }),
      s.shift ? await box({ name: 'Shift', dir: 'row', pad: [0, 6], radius: 'radius/full', fill: 'role/band' }, await text(s.shift, 'Mono/xs', 'role/fg-muted')) : null,
    )
    at(track, mark, s.x * W - 8, SKY + 10)
  }
  const stays = [
    { from: 0.22, to: 0.7, name: 'Hotel Frankfurter Hof', nights: '2 nights', tone: 'role/chart-1' },
    { from: 0.86, to: 1, name: 'Casa do Largo', nights: '1 night', tone: 'role/chart-2' },
  ]
  for (const s of stays) {
    const span = await box(
      // The stay's inline-start edge in its tone, then its name and nights.
      { name: 'Stay', dir: 'row', gap: 'space/2', align: 'center', pad: [0, 8, 0, 0], w: f((s.to - s.from) * W - 2), h: 32, radius: 'radius/md', fill: [s.tone, 0.2], clip: true },
      rect('Edge', 2, 32, s.tone),
      await text(s.name, 'UI/sm/Regular', 'role/fg', { name: 'Name', w: 'fill', truncate: true }),
      await text(s.nights, 'Mono/xs', 'role/fg-muted', { name: 'Nights' }),
    )
    at(track, span, s.from * W + 1, SKY + 40)
  }
  // Now: an accent line in an accent halo, with its chip at the foot.
  const nowX = 0.31 * W
  at(track, rect('Now halo', 8, H - 28, ['role/accent', 0.18], 'radius/full'), nowX - 4, 8)
  at(track, rect('Now', 2, H - 28, 'role/accent', 'radius/full'), nowX - 1, 8)
  const chip = await box({ name: 'Now chip', dir: 'row', pad: [0, 6], radius: 'radius/full', fill: 'role/accent' }, await eyebrow('Now', 'Now', 'role/on-accent'))
  at(track, chip, nowX - chip.width / 2, H - chip.height)
  add(c, tabs, track)
}

function dayRailSpec(): SetSpec {
  return {
    key: 'component:day-rail',
    name: 'Day rail',
    description:
      'DayRail in packages/ui: a trip on one rail, a column per day. Flights arc over the rail from departure to arrival with their code at the top (past ones solid and quiet, the next dashed); a clock change marks the landing (+9 h). Stays sit under the rail as spans in the stop’s tone with their nights; now is an accent line. Days are tabs whose ItineraryDay panel shows under it. In code arcs draw in, and the plane rides its arc in flight.',
    variants: [{ props: { State: 'rest' }, build: (c) => drawDayRail(c) }],
    properties: [],
    columns: 'State',
  }
}

/* ── DayRing ────────────────────────────────────────────────────────────── */

const JOBS = [
  { name: 'backup', tone: 'role/chart-1', runs: [[60, 90], [780, 810]] },
  { name: 'sync', tone: 'role/chart-2', runs: [[0, 20], [240, 260], [480, 500], [720, 740], [960, 980], [1200, 1220]] },
  { name: 'report', tone: 'role/chart-3', runs: [[465, 520], [1080, 1110]] },
]

async function drawDayRing(c: ComponentNode) {
  const W = 288
  const k = W / 256
  const cx = W / 2
  await style(c, { dir: 'none', w: W, h: W })
  const now = 14 * 60 + 20
  circle(c, cx, cx, 114 * k, 1, 'role/line')
  // The part of the day gone, shaded along the ruler.
  arc(c, cx, cx, ((114 + 104.5) / 2) * k, 0, (now / 1440) * 360, (114 - 104.5) * k, ['role/fg', 0.06], 'Elapsed')
  for (let i = 0; i < 96; i++) {
    const major = i % 24 === 0
    const hour = i % 4 === 0
    const deg = (i / 96) * 360
    const [x1, y1] = polar(cx, cx, (major ? 104.5 : hour ? 107.5 : 110.5) * k, deg)
    const [x2, y2] = polar(cx, cx, 114 * k, deg)
    vector(c, `M${x1},${y1} L${x2},${y2}`, { stroke: solid(['role/fg', major ? 0.72 : hour ? 0.42 : 0.2]), strokeWidth: major ? 1.75 : hour ? 1.25 : 1 }, 'Tick')
  }
  for (const h of [0, 6, 12, 18]) {
    const t = await text(String(h).padStart(2, '0'), 'Mono/xs', 'role/fg-muted', { name: 'Hour' })
    const [x, y] = polar(cx, cx, 94 * k, (h / 24) * 360)
    at(c, t, x - t.width / 2, y - t.height / 2)
  }
  const gap = 4 * k
  const width = ((86 - 50) * k - gap * (JOBS.length - 1)) / JOBS.length
  for (const [j, job] of JOBS.entries()) {
    const r = 86 * k - width / 2 - j * (width + gap)
    circle(c, cx, cx, r, width, 'role/well', 'Track')
    for (const [a, b] of job.runs) arc(c, cx, cx, r, (a! / 1440) * 360, (b! / 1440) * 360, width, job.tone, 'Run', true)
  }
  // A collision (sync and report at 8:00): a warning wedge across the tracks, and its marker outside the ruler.
  const mid = (490 / 1440) * 360
  arc(c, cx, cx, 68 * k, mid - 4, mid + 4, 36 * k + 5, ['role/warning', 0.16], 'Overlap')
  const [mx, my] = polar(cx, cx, 116.5 * k, mid)
  const [lx, ly] = polar(cx, cx, 123.5 * k, mid - 1.6)
  const [rx, ry] = polar(cx, cx, 123.5 * k, mid + 1.6)
  vector(c, `M${mx},${my} L${lx},${ly} L${rx},${ry} Z`, { fill: solid('role/warning') }, 'Collision')
  // The hand at now.
  const deg = (now / 1440) * 360
  const [hx1, hy1] = polar(cx, cx, 48 * k, deg)
  const [hx2, hy2] = polar(cx, cx, 117 * k, deg)
  vector(c, `M${hx1},${hy1} L${hx2},${hy2}`, { stroke: solid('role/fg'), strokeWidth: 1.5 }, 'Hand')
  disc(c, hx2, hy2, 3, 'role/fg', 'Hand tip')
  const value = await box(
    { name: 'Countdown', dir: 'row', gap: 'space/1', align: 'baseline' },
    await text('in', 'Mono/xs', 'role/fg-muted'),
    figure(await text('1h 40m', 'UI/lg/Medium', 'role/fg', { name: 'Value' })),
  )
  const center = await box({ name: 'Center', dir: 'col', gap: 'space/1', align: 'center' }, await eyebrow('Next run'), await text('sync', 'Mono/sm', 'role/fg', { name: 'Job' }), value)
  at(c, center, cx - center.width / 2, cx - center.height / 2)
}

function dayRingSpec(): SetSpec {
  return {
    key: 'component:day-ring',
    name: 'Day ring',
    description:
      'DayRing in packages/ui: a day of scheduled runs on a 24-hour dial, midnight at the top, inside a ruler of quarter-hour ticks with the part of the day gone shaded along it. Each job has its own thin track (role/well) with its runs as arcs in its tone; where runs collide a warning wedge crosses the tracks and a marker points at it. A hand points at now and the centre counts down to the next run. In code the runs appear as a radar pass and the hand turns to now.',
    variants: [{ props: { State: 'rest' }, build: (c) => drawDayRing(c) }],
    properties: [],
    columns: 'State',
  }
}

/* ── TimeLanes ──────────────────────────────────────────────────────────── */

async function drawTimeLanes(c: ComponentNode) {
  const days = 7
  const W = 560
  const lane = 44
  await style(c, { dir: 'row', gap: 'space/4', w: 'hug' })
  const people = [
    { initials: 'AK', name: 'Ada K.', detail: 'Platform' },
    { initials: 'MS', name: 'Mo S.', detail: 'Platform' },
    { initials: 'JR', name: 'Jun R.', detail: 'Payments' },
  ]
  const heads = await box({ name: 'Heads', dir: 'col', pad: [28, 0, 0, 0], w: 144 })
  for (const [i, p] of people.entries()) {
    const avatar = await box({ name: 'Avatar', dir: 'row', align: 'center', justify: 'center', w: 28, h: 28, radius: 'radius/full', fill: [CHART[i]!, 0.22] }, await text(p.initials, 'Mono/xs', 'role/fg', { name: 'Initials' }))
    add(
      heads,
      await box(
        { name: p.name, dir: 'row', gap: 'space/2-5', align: 'center', w: 'fill', h: lane },
        avatar,
        await box({ name: 'Name', dir: 'col' }, await text(p.name, 'UI/base/Regular', 'role/fg'), await text(p.detail, 'UI/sm/Regular', 'role/fg-muted')),
      ),
    )
  }
  const body = await box({ name: 'Body', dir: 'none', w: W, h: 28 + lane * people.length })
  const col = W / days
  const names = ['Mon 6', 'Tue 7', 'Wed 8', 'Thu 9', 'Fri 10', 'Sat 11', 'Sun 12']
  for (let d = 0; d < days; d++) {
    at(body, rect('Day rule', 1, 28 + lane * people.length, 'role/line-subtle'), d * col, 0)
    at(body, await text(names[d]!, 'Mono/xs', d === 2 ? 'role/fg' : 'role/fg-muted', { name: 'Day' }), d * col + 6, 4)
  }
  // Shifts: [lane, from day, to day, kind]. The first lane's shift has ended, the second is on call now.
  const shifts: [number, number, number, 'ended' | 'current' | 'upcoming' | 'override'][] = [
    [0, 0, 2.375, 'ended'],
    [1, 2.375, 4.375, 'current'],
    [2, 4.375, 7, 'upcoming'],
    [0, 3.2, 3.7, 'override'],
  ]
  for (const [l, a, b, kind] of shifts) {
    const tone = CHART[l]!
    const bar = await box({
      name: kind === 'override' ? 'Override' : 'Shift',
      dir: 'row',
      align: 'center',
      pad: [0, 8],
      w: f((b - a) * col),
      h: lane - 16,
      radius: 'radius/sm',
      fill: [tone, kind === 'override' ? 0.12 : kind === 'current' ? 0.38 : 0.26],
      stroke: kind === 'current' ? tone : kind === 'override' ? [tone, 0.75] : undefined,
      opacity: kind === 'ended' ? 0.7 : undefined,
    })
    if (kind === 'override') bar.dashPattern = [3, 3]
    if (kind !== 'override') add(bar, await text('09:00', 'Mono/xs', 'role/fg', { name: 'Start' }))
    at(body, bar, a * col, 28 + l * lane + 8)
    if (kind !== 'override') at(body, rect('Edge', 2, lane - 16, tone), a * col, 28 + l * lane + 8)
  }
  // Hand-offs: a dashed rule where one lane passes to the next.
  for (const x of [2.375, 4.375]) {
    const v = vector(body, `M${f(x * col)},28 L${f(x * col)},${28 + lane * people.length}`, { stroke: solid('role/line-strong'), strokeWidth: 1 }, 'Hand-off') as VectorNode
    v.dashPattern = [3, 3]
  }
  // Now: an accent line with a diamond on the axis.
  const nowX = 2.9 * col
  at(body, rect('Now', 2, lane * people.length + 6, 'role/accent', 'radius/full'), nowX - 1, 22)
  add(c, heads, body)
}

function timeLanesSpec(): SetSpec {
  return {
    key: 'component:time-lanes',
    name: 'Time lanes',
    description:
      'TimeLanes in packages/ui: who is on call when, as a week of lanes, one per person or team in the chart tones. Each shift is a bar from start to end with an inline-start edge in its tone; the one on call now is lit and ringed, ended ones fade, an override is a dashed (hatched in code) block over the lane, and a dashed rule marks each hand-off. Now is an accent line. In code the shifts are one tab stop, each opens its detail in a popover, and `hours` turns the week into a day.',
    variants: [{ props: { State: 'rest' }, build: (c) => drawTimeLanes(c) }],
    properties: [],
    columns: 'State',
  }
}

/* ── RolloutRuler ───────────────────────────────────────────────────────── */

const STAGES = ['Internal', 'Beta', '10%', '50%', 'GA']

async function drawRollout(c: ComponentNode, size: 'default' | 'sm') {
  const small = size === 'sm'
  const W = small ? 240 : 440
  const inset = small ? 4 : 8
  const inner = W - inset * 2
  const at_ = 0.5
  const ticksPer = 10
  const total = STAGES.length * ticksPer
  await style(c, { dir: 'col', w: W })
  const ruler = await box({ name: 'Track', dir: 'none', w: W, h: small ? 12 : 28, radius: 3, fill: 'role/well' })
  for (let i = 0; i <= total; i++) {
    const pos = i / total
    const gate = i % ticksPer === 0
    const lit = pos <= at_ + 1e-9
    const runway = !small && !lit && pos <= 0.6 + 1e-9
    const h = small ? (gate ? 8 : 4) : gate ? 20 : 12
    const w = small ? 1 : gate ? 2 : 1
    const tick = rect(gate ? 'Gate' : 'Tick', w, h, lit || runway ? 'role/accent' : 'role/fg', 'radius/full')
    tick.opacity = lit ? (gate ? 1 : 0.6) : runway ? (gate ? 0.45 : 0.3) : gate ? 0.35 : 0.2
    at(ruler, tick, inset + pos * inner - w / 2, small ? (gate ? 2 : 4) : gate ? 4 : 8)
  }
  // The needle at the value, ringed in the surface; the knob is the slider's thumb.
  const nx = inset + at_ * inner
  at(ruler, rect('Needle', 2, small ? 16 : 40, 'role/fg', 'radius/full'), nx - 1, small ? -2 : -6)
  if (small) {
    add(c, ruler)
    return
  }
  const knob = await box({ name: 'Knob', dir: 'row', justify: 'center', align: 'center', w: 12, h: 36, radius: 'radius/sm', fill: 'role/action', effect: 'Shadow/xs' }, rect('Grip', 1, 16, ['role/on-action', 0.7], 'radius/full'))
  at(ruler, knob, nx - 6, -4)
  const header = await box(
    { name: 'Header', dir: 'row', align: 'baseline', justify: 'between', gap: 'space/3', pad: [0, 0, 12, 0], w: 'fill' },
    ref(await eyebrow('Rollout'), 'Label'),
    await box({ name: 'Value', dir: 'row', gap: 'space/2', align: 'baseline' }, await fig('50%', 'Heading/xl', 'role/fg', 'Percent')),
  )
  const stages = await box({ name: 'Stages', dir: 'none', w: W, h: 16 })
  for (const [i, s] of STAGES.entries()) {
    const pos = (i + 1) / STAGES.length
    const here = i === 3
    const t = await text(s.toUpperCase(), 'Mono/xs', here ? 'role/accent-text' : pos <= at_ ? 'role/fg-muted' : 'role/fg-subtle', { name: 'Stage' })
    at(stages, t, inset + pos * inner - (pos >= 1 ? t.width : t.width / 2), 16 - t.height)
  }
  const axis = await box({ name: 'Axis', dir: 'none', w: W, h: 16 })
  for (const [i, v] of ['0%', '1%', '5%'].entries()) {
    const t = await text(v, 'Mono/xs', 'role/fg-muted', { name: 'Stop' })
    at(axis, t, inset + (i / STAGES.length) * inner - (i ? t.width / 2 : 0), 0)
  }
  add(c, header, stages, await box({ name: 'Gap', w: 1, h: 6 }), ruler, await box({ name: 'Gap', w: 1, h: 6 }), axis)
}

function rolloutSpec(): SetSpec {
  return {
    key: 'component:rollout-ruler',
    name: 'Rollout ruler',
    description:
      'RolloutRuler in packages/ui: how far a feature has rolled out, read off a ruled track cut into its stages (internal, beta, 10%, 50%, GA), each an equal stretch. Ticks rolled out are lit in the accent, the runway to the next gate at a third of it, the rest dim; the gate the value sits on names itself in the tone. A playhead rides the value with the action-coloured knob; `sm` is the bare track for a list row. In code the playhead snaps to the gates on the snappy spring and outside changes sweep.',
    variants: (['default', 'sm'] as const).map((size) => ({ props: { Size: size }, build: (c) => drawRollout(c, size) })),
    properties: [{ name: 'Label', type: 'TEXT', default: 'Rollout', field: 'characters' }],
    columns: 'Size',
    gap: [48, 16],
  }
}

/* ── StageRail ──────────────────────────────────────────────────────────── */

const PIPELINE = [
  { name: 'Build', status: 'passed', word: 'Passed', time: '1m 12s', progress: 1 },
  { name: 'Test', status: 'passed', word: 'Passed', time: '3m 40s', progress: 1 },
  { name: 'Deploy', status: 'running', word: 'Running', time: '0m 48s', progress: 0.45 },
  { name: 'Verify', status: 'queued', word: 'Queued', time: '—', progress: 0 },
] as const
const STAGE_INK = { passed: 'role/fg', running: 'role/accent', failed: 'role/danger', queued: 'role/fg-subtle' } as const
const STAGE_WORD = { passed: 'role/success-text', running: 'role/accent-text', failed: 'role/danger-text', queued: 'role/fg-muted' } as const
const STAGE_DOT = { passed: 'role/success', running: 'role/accent', failed: 'role/danger', queued: 'role/fg-subtle' } as const

async function drawStageRail(c: ComponentNode, failed: boolean) {
  const bz = bezel()
  const segments = 8
  await style(c, { dir: 'row', gap: 2, pad: 2, w: 560, radius: 'radius/xl', fill: bz ? 'role/well' : ['role/fg', 0.04] })
  const stages = PIPELINE.map((s) => (failed && s.name === 'Deploy' ? { ...s, status: 'failed' as const, word: 'Failed' as const, progress: 0.6 } : s))
  for (const s of stages) {
    const picked = s.name === 'Deploy'
    const key = await box({
      name: s.name,
      dir: 'col',
      gap: 'space/2',
      pad: [10, 10, 8, 10],
      w: 'fill',
      radius: 'radius/lg',
      fill: picked ? 'role/key' : undefined,
      effect: picked ? (bz ? 'Bezel/key' : 'Shadow/xs') : undefined,
    })
    const dot = s.status === 'queued' ? await box({ name: 'Dot', w: 8, h: 8, radius: 'radius/full', stroke: 'role/fg-subtle' }) : rect('Dot', 8, 8, STAGE_DOT[s.status], 'radius/full')
    const head = await box({ name: 'Header', dir: 'row', gap: 'space/2', align: 'center', w: 'fill' }, dot, await text(bz ? s.name.toUpperCase() : s.name, bz ? 'Bezel/Eyebrow' : 'UI/sm/Regular', 'role/fg', { name: 'Label', w: 'fill', truncate: true }))
    const track = await box({ name: 'Track', dir: 'row', gap: 2, w: 'fill', h: 8 })
    const lit = s.status === 'running' ? Math.max(1, Math.floor(s.progress * segments)) : Math.round(s.progress * segments)
    for (let i = 0; i < segments; i++) {
      const next = s.status === 'running' && i === lit
      const cell = rect(i < lit ? 'Cell on' : 'Cell off', 10, 8, i < lit ? STAGE_INK[s.status] : next ? ['role/accent', 0.45] : 'role/well', 2)
      add(track, cell)
      cell.layoutSizingHorizontal = 'FILL'
    }
    const foot = await box(
      { name: 'Footer', dir: 'row', gap: 'space/2', align: 'baseline', w: 'fill' },
      await text(s.word, 'UI/sm/Regular', STAGE_WORD[s.status], { name: 'Status' }),
      await spacerBox(),
      await fig(s.time, 'UI/sm/Regular', s.status === 'queued' ? 'role/fg-subtle' : 'role/fg', 'Elapsed'),
    )
    add(key, head, track, foot)
    add(c, key)
  }
}

const spacerBox = () => box({ name: 'Spacer', w: 'fill', h: 1 })

function stageRailSpec(): SetSpec {
  return {
    key: 'component:stage-rail',
    name: 'Stage rail',
    description:
      'StageRail in packages/ui: a pipeline run as one segmented rail, each stage a key in a recessed track holding its name, a run of cells that fill as it progresses, its state in words and its live duration in mono. Cells are ink where work is done, the accent where it’s under way (its next cell breathing), danger where it broke, hatched where skipped. The picked stage is the raised key. In code the cells light from the start on first view, durations tick and the key glides between stages.',
    variants: (['running', 'failed'] as const).map((run) => ({ props: { Run: run }, build: (c) => drawStageRail(c, run === 'failed') })),
    properties: [],
    columns: 'Run',
    gap: [48, 24],
  }
}

/* ── SeverityTimeline ───────────────────────────────────────────────────── */

const INCIDENT = [
  { time: '14:02', offset: '+0m', sev: 1, title: 'Checkout error rate above 5%', detail: 'Alert from payments-api; on-call paged.', at: 0, len: 0.85, tone: 'role/danger', ink: 'role/danger-text' },
  { time: '14:06', offset: '+4m', milestone: 'Acknowledged', title: 'Ada K. is investigating', at: 0.1, tone: 'role/fg', ink: 'role/fg' },
  { time: '14:19', offset: '+17m', sev: 2, title: 'Card retries backing up', detail: 'Queue depth 12k and climbing.', at: 0.42, len: 0.35, tone: 'role/warning', ink: 'role/warning-text' },
  { time: '14:31', offset: '+29m', milestone: 'Mitigated', title: 'Rolled back release 4.18', at: 0.72, tone: 'role/fg', ink: 'role/fg' },
  { time: '14:42', offset: '+40m', milestone: 'Resolved', title: 'Error rate back under 0.1%', at: 1, tone: 'role/success', ink: 'role/success-text' },
] as const

async function drawSeverity(c: ComponentNode) {
  const ribbonW = 200
  await style(c, { dir: 'col', w: 640 })
  const milestones = INCIDENT.filter((e) => 'milestone' in e)
  const ribbonRules = async (frame: FrameNode, h: number) => {
    for (const m of milestones) {
      const x = f(m.at * (ribbonW - 1))
      const v = vector(frame, `M${x},0 L${x},${h}`, { stroke: solid(m.milestone === 'Resolved' ? 'role/success-line' : 'role/line-strong'), strokeWidth: 1 }, 'Milestone') as VectorNode
      v.dashPattern = [3, 3]
    }
  }
  // The axis over the ribbon: start and end times, a diamond at each milestone.
  const axis = await box({ name: 'Axis', dir: 'row', gap: 'space/3', w: 'fill' })
  const axisRibbon = await box({ name: 'Ribbon axis', dir: 'none', w: ribbonW, h: 32 })
  at(axisRibbon, await text('14:00', 'Mono/xs', 'role/fg-subtle'), 0, 0)
  const end = await text('14:45', 'Mono/xs', 'role/fg-subtle')
  at(axisRibbon, end, ribbonW - end.width, 0)
  for (const m of milestones) diamond(axisRibbon, f(m.at * (ribbonW - 1)), 23, 4, m.milestone === 'Resolved' ? 'role/success' : 'role/fg')
  add(axis, await box({ name: 'Spacer', w: 'fill', h: 1 }), axisRibbon)
  add(c, axis)
  for (const [i, e] of INCIDENT.entries()) {
    const milestone = 'milestone' in e
    const timeCol = await box(
      { name: 'Time', dir: 'col', gap: 'space/0-5', align: 'end', pad: [11, 0, 10, 0], w: 52 },
      await text(e.time, 'Mono/sm', 'role/fg-muted', { name: 'Clock' }),
      await fig(e.offset, 'UI/xs/Regular', 'role/fg-subtle', 'Offset'),
    )
    const node = await box({ name: 'Node', dir: 'none', w: 12, h: 1 })
    const body = await box({ name: 'Body', dir: 'col', gap: 'space/0-5', pad: [10, 0], w: 'fill' })
    const title = await box({ name: 'Title', dir: 'row', gap: 'space/2', align: 'center', w: 'fill' })
    if ('sev' in e) add(title, await box({ name: 'Severity', dir: 'row', align: 'center', pad: [0, 6], h: 20, radius: 'radius/full', fill: [e.tone, 0.15] }, await text(`SEV${e.sev}`, 'Mono/xs', e.ink, { name: 'SEV' })))
    if (milestone) add(title, await eyebrow(e.milestone, 'Milestone', e.ink))
    add(title, await text(e.title, 'UI/lg/Regular', 'role/fg', { name: 'Title', w: 'fill' }))
    add(body, title)
    if ('detail' in e) add(body, await text(e.detail, 'UI/base/Regular', 'role/fg-muted', { name: 'Detail', w: 'fill' }))
    const ribbon = await box({ name: 'Ribbon', dir: 'none', w: ribbonW, h: 1 })
    const row = await box({ name: 'Event', dir: 'row', gap: 'space/3', align: 'start', w: 'fill', radius: 'radius/md' }, timeCol, node, body, ribbon)
    add(c, row)
    // The rail through the nodes, the node itself, and the ribbon's track, bar and milestone rules, at the row's height.
    const h = Math.round(row.height)
    node.resize(12, h)
    ribbon.resize(ribbonW, h)
    if (i > 0) at(node, rect('Rail', 1, 12, 'role/line'), 5.5, 0)
    if (i < INCIDENT.length - 1) at(node, rect('Rail', 1, h - 28, 'role/line'), 5.5, 28)
    if (milestone) diamond(node, 6, 20, 5, e.tone)
    else {
      at(node, rect('Halo', 14, 14, [e.tone, 0.22], 'radius/full'), -1, 13)
      at(node, rect('Dot', 8, 8, e.tone, 'radius/full'), 2, 16)
    }
    at(ribbon, rect('Track', ribbonW, 4, 'role/well', 'radius/full'), 0, 18)
    if ('len' in e) at(ribbon, rect('Bar', f(e.len * ribbonW), 4, e.tone, 'radius/full'), f(e.at * ribbonW), 18)
    await ribbonRules(ribbon, h)
  }
}

function severitySpec(): SetSpec {
  return {
    key: 'component:severity-timeline',
    name: 'Severity timeline',
    description:
      'SeverityTimeline in packages/ui: an incident event by event. Each row has its clock time and how long after the start it came, a node on a rail (a dot in its severity’s tone, a diamond for a milestone), a soft SEV chip, the title and the detail; beside it the ribbon spans the incident on every row, with the event’s bar at its offset and every milestone as a dashed rule, so the phases line up like a gantt. In code events arrive through PresenceList, the window auto-ranges while open and ongoing bars breathe at now.',
    variants: [{ props: { State: 'resolved' }, build: (c) => drawSeverity(c) }],
    properties: [],
    columns: 'State',
  }
}

/* ── SlotGrid ───────────────────────────────────────────────────────────── */

type SlotState = 'open' | 'few' | 'full' | 'closed' | 'mine'

async function drawSlotGrid(c: ComponentNode, icons: Deps['icons']) {
  const days = [['Mon', '6'], ['Tue', '7'], ['Wed', '8'], ['Thu', '9'], ['Fri', '10']]
  const times = ['09:00', '10:30', '12:00', '14:00']
  const grid: [SlotState, number][][] = [
    [['open', 6], ['few', 2], ['open', 8], ['full', 0], ['closed', 0]],
    [['mine', 0], ['open', 5], ['open', 7], ['few', 1], ['open', 4]],
    [['open', 3], ['full', 0], ['open', 6], ['open', 8], ['few', 2]],
    [['closed', 0], ['open', 8], ['few', 1], ['open', 5], ['open', 6]],
  ]
  const picked = [2, 2]
  const colW = 88
  await style(c, { dir: 'col', gap: 'space/1-5', w: 'hug' })
  // The week's days as keys in a well: the picked day raised.
  const week = await box({ name: 'Days', dir: 'row', gap: 2, pad: 2, radius: 'radius/xl', fill: 'role/well' })
  for (const [d, [day, date]] of days.entries()) {
    const on = d === picked[1]
    add(
      week,
      await box(
        { name: day!, dir: 'col', gap: 'space/1', align: 'center', pad: [8, 4, 10, 4], w: colW, radius: 'radius/lg', fill: on ? 'role/key' : undefined, effect: on ? (bezel() ? 'Bezel/key' : 'Shadow/xs') : undefined },
        await eyebrow(day!, 'Day'),
        await fig(date!, 'UI/lg/Medium', 'role/fg', 'Date'),
      ),
    )
  }
  add(c, await box({ name: 'Head', dir: 'row', gap: 'space/1-5', align: 'end' }, await box({ name: 'Corner', w: 56, h: 1 }), week))
  for (const [r, time] of times.entries()) {
    const row = await box({ name: time, dir: 'row', gap: 'space/1-5', align: 'center' }, await box({ name: 'Time', dir: 'row', w: 56 }, await fig(time, 'UI/sm/Regular', 'role/fg-muted', 'Time')))
    for (const [d, [state, free]] of grid[r]!.entries()) {
      const isPicked = r === picked[0] && d === picked[1]
      const cell = await box({
        name: 'Slot',
        dir: 'col',
        justify: state === 'closed' ? 'center' : 'between',
        align: state === 'closed' ? 'center' : 'start',
        pad: [8, 10],
        w: colW,
        h: 56,
        radius: 'radius/lg',
        fill: isPicked ? 'role/fg' : state === 'mine' ? 'role/success-subtle' : state === 'closed' ? undefined : state === 'full' ? ['role/fg', 0.09] : 'role/well',
        effect: isPicked ? 'Shadow/xs' : undefined,
      })
      if (state === 'closed') add(cell, rect('Dash', 12, 1, 'role/fg-subtle'))
      else if (state === 'mine') add(cell, icon(icons, 'check', 14, 'role/success-text'), await text('Yours', 'UI/sm/Regular', 'role/success-text', { name: 'Count' }))
      else {
        const pips = await box({ name: 'Pips', dir: 'row', gap: 3, h: 10 })
        for (let i = 0; i < 8; i++) {
          const on = i < free
          add(pips, rect(on ? 'Pip on' : 'Pip off', 4, 10, on ? (isPicked ? 'role/canvas' : state === 'few' ? 'role/warning' : 'role/fg') : isPicked ? 'role/band' : 'role/well', 1.5))
        }
        const words = state === 'full' ? 'Full' : state === 'few' ? `${free} left` : `${free} free`
        add(cell, pips, figure(await text(words, 'UI/sm/Regular', isPicked ? 'role/canvas' : state === 'few' ? 'role/warning-text' : state === 'full' ? 'role/fg-subtle' : 'role/fg-muted', { name: 'Count' })))
      }
      add(row, cell)
    }
    add(c, row)
  }
}

function slotGridSpec(deps: Deps): SetSpec {
  return {
    key: 'component:slot-grid',
    name: 'Slot grid',
    description:
      'SlotGrid in packages/ui: a week of bookable times, a column per day and a row per start time, each cell a run of pips (one per place, up to eight) lit for the places still free. A slot with few left lights them in the warning tone, a full one is hatched and dark, a time the day doesn’t offer is a dash; the picked slot is the lit key in ink, and your own booking carries a check. Under 36rem it shows one day at a time. In code the cells come in as a wave and the keyboard walks the grid.',
    variants: [{ props: { Layout: 'week' }, build: (c) => drawSlotGrid(c, deps.icons) }],
    properties: [],
    columns: 'Layout',
  }
}

/** Loudness samples for the waves: a fixed, speech-like run of heights in 0…1. */
const LOUDNESS = (n: number, seed = 1) => Array.from({ length: n }, (_, i) => Math.max(0.06, Math.min(1, 0.45 + 0.35 * Math.sin(i * 0.61 * seed) * Math.cos(i * 0.17 + seed) + 0.2 * Math.sin(i * 2.3))))

/** A wave of round-capped bars, one per sample, centred on a midline, as one stroked path. */
function wave(parent: FrameNode | ComponentNode, x: number, y: number, w: number, h: number, heights: number[], ink: Ink, width: number, name = 'Wave') {
  const pitch = w / heights.length
  const d = heights.map((v, i) => `M${f(x + (i + 0.5) * pitch)},${f(y + h / 2 - (0.04 + v * 0.42) * h)} L${f(x + (i + 0.5) * pitch)},${f(y + h / 2 + (0.04 + v * 0.42) * h)}`).join(' ')
  return vector(parent, d, { stroke: solid(ink), strokeWidth: width }, name)
}

/* ── Dial ───────────────────────────────────────────────────────────────── */

async function drawDial(c: ComponentNode, current: boolean) {
  const W = 256
  const k = W / 256
  const cx = W / 2
  await style(c, { dir: 'none', w: W, h: W })
  const min = 10
  const max = 30
  const value = 21.5
  const now = 19.8
  const angle = (v: number) => -135 + ((v - min) / (max - min)) * 270
  const lo = current ? Math.min(now, value) : min
  const hi = value
  // The ruler: a tick every half degree, majors every 5; the stretch that's lit takes the tone.
  for (let v = min; v <= max + 1e-9; v += 0.5) {
    const major = Math.abs(v % 5) < 1e-9
    const on = v >= lo - 1e-9 && v <= hi + 1e-9
    const [x1, y1] = polar(cx, cx, 104 * k, angle(v))
    const [x2, y2] = polar(cx, cx, (major ? 113 : 109) * k, angle(v))
    vector(c, `M${x1},${y1} L${x2},${y2}`, { stroke: solid(on ? ['role/accent', 0.85] : ['role/fg', major ? 0.46 : 0.2]), strokeWidth: major ? 1.5 : 1 }, 'Tick')
  }
  arc(c, cx, cx, 90 * k, -135, 135, 12 * k, ['role/fg', 0.1], 'Track', true)
  arc(c, cx, cx, 90 * k, angle(lo), angle(hi), 12 * k, 'role/accent', 'Range', true)
  if (current) {
    const a = angle(now)
    const [tx, ty] = polar(cx, cx, 80 * k, a)
    const [lx, ly] = polar(cx, cx, 72 * k, a - 3.5)
    const [rx, ry] = polar(cx, cx, 72 * k, a + 3.5)
    vector(c, `M${tx},${ty} L${lx},${ly} L${rx},${ry} Z`, { fill: solid('role/fg') }, 'Current')
  }
  const [kx, ky] = polar(cx, cx, 90 * k, angle(value))
  disc(c, kx, ky, 12.25 * k, 'role/surface', 'Knob ring')
  disc(c, kx, ky, 10.5 * k, 'role/fg', 'Knob')
  const figureRow = await box(
    { name: 'Value', dir: 'row', align: 'baseline' },
    ref(await fig('21.5', 'Heading/5xl', 'role/fg', 'Figure'), 'Value'),
    await fig('°C', 'UI/lg/Regular', 'role/fg-muted', 'Unit'),
  )
  const center = await box({ name: 'Center', dir: 'col', gap: 'space/1-5', align: 'center' }, ref(await eyebrow('Target', 'Label'), 'Label'), figureRow)
  if (current) add(center, await box({ name: 'Now', dir: 'row', gap: 'space/1', align: 'baseline' }, await eyebrow('Now', 'Now'), await text(`${now}°`, 'Mono/sm', 'role/fg', { name: 'Reading' })))
  at(c, center, cx - center.width / 2, cx - center.height / 2)
  const ends = await box({ name: 'Ends', dir: 'row', justify: 'between', w: Math.round(W * 0.68) }, await text(String(min), 'Mono/xs', 'role/fg-muted'), await text(String(max), 'Mono/xs', 'role/fg-muted'))
  at(c, ends, W * 0.16, W * 0.91 - 16)
}

function dialSpec(): SetSpec {
  return {
    key: 'component:dial',
    name: 'Dial',
    description:
      'Dial in packages/ui: a bounded value on a ruled three-quarter ring from the lower left round to the lower right, ticked at every step, the value an ink knob on the band and large in mono in the middle (a thermostat, a volume). `current` adds a measured value: a marker inside the band, “Now 19.8°” under the figure, and the stretch between it and the value lit in the tone. In code it’s a slider under the arc: arrows and drags step it, each step plays the tick cue, and the knob glides.',
    variants: (['false', 'true'] as const).map((cur) => ({ props: { Current: cur }, build: (c) => drawDial(c, cur === 'true') })),
    properties: [
      { name: 'Label', type: 'TEXT', default: 'Target', field: 'characters' },
      { name: 'Value', type: 'TEXT', default: '21.5', field: 'characters' },
    ],
    columns: 'Current',
    gap: [48, 16],
  }
}

/* ── HoursDial ──────────────────────────────────────────────────────────── */

async function drawHoursDial(c: ComponentNode) {
  const W = 256
  const k = W / 256
  const cx = W / 2
  await style(c, { dir: 'none', w: W, h: W })
  // 22:30 to 06:45: a window across midnight.
  const start = 22.5 * 15
  const end = 360 + 6.75 * 15
  arc(c, cx, cx, ((96 + 110) / 2) * k, start, end, 18 * k, ['role/accent', 0.18], 'Band', true)
  for (let i = 0; i < 96; i++) {
    const deg = i * 3.75
    const kind = i % 24 === 0 ? 'quarter' : i % 4 === 0 ? 'hour' : 'minor'
    const len = { quarter: 110, hour: 106, minor: 102 }[kind]
    const lit = (deg >= start - 1e-9 && deg <= 360) || deg <= end - 360 + 1e-9
    const [x1, y1] = polar(cx, cx, (lit ? 90 : 96) * k, deg)
    const [x2, y2] = polar(cx, cx, len * k, deg)
    vector(c, `M${x1},${y1} L${x2},${y2}`, { stroke: solid(lit ? 'role/accent' : ['role/fg', kind === 'minor' ? 0.18 : kind === 'hour' ? 0.34 : 0.52]), strokeWidth: kind === 'minor' ? 1 : 1.5 }, lit ? 'Tick lit' : 'Tick')
  }
  for (const h of [0, 12]) {
    const t = await text(String(h).padStart(2, '0'), 'Mono/xs', 'role/fg-muted', { name: 'Numeral' })
    const [x, y] = polar(cx, cx, 80 * k, h * 15)
    at(c, t, x - t.width / 2, y - t.height / 2)
  }
  // The handles: the start hollow, the end solid, on the ruler.
  const [sx, sy] = polar(cx, cx, 101 * k, start)
  const [ex, ey] = polar(cx, cx, 101 * k, end)
  disc(c, sx, sy, 10, 'role/surface', 'Start')
  circle(c, sx, sy, 8.5, 3, 'role/fg', 'Start ring')
  disc(c, ex, ey, 10, 'role/surface', 'End ring')
  disc(c, ex, ey, 8.5, 'role/fg', 'End')
  const value = await box({ name: 'Value', dir: 'row', align: 'baseline' }, await fig('8', 'Heading/4xl'), await fig('h', 'UI/lg/Regular', 'role/fg-muted', 'Unit'), await fig(' 15', 'Heading/4xl', 'role/fg', 'Minutes'), await fig('m', 'UI/lg/Regular', 'role/fg-muted', 'Unit'))
  const center = await box({ name: 'Center', dir: 'col', gap: 'space/2', align: 'center' }, ref(await eyebrow('Sleep', 'Label'), 'Label'), value, await text('22:30 – 06:45', 'Mono/sm', 'role/fg-muted', { name: 'Times' }))
  at(c, center, cx - center.width / 2, cx - center.height / 2)
}

function hoursDialSpec(): SetSpec {
  return {
    key: 'component:hours-dial',
    name: 'Hours dial',
    description:
      'HoursDial in packages/ui: a stretch of the day on a 24-hour face, midnight at the top, clockwise, inside a ruler of quarter-hour ticks, with two handles on it: a start (hollow) and an end (solid). The ticks between them light in the tone over a soft band, and the centre reads the span large in mono with its two times under it (a sleep schedule, quiet hours, a shift; it may run past midnight). In code each handle is a slider of minutes: arrows step 15 minutes, a press on the band drags the whole window.',
    variants: [{ props: { State: 'rest' }, build: (c) => drawHoursDial(c) }],
    properties: [{ name: 'Label', type: 'TEXT', default: 'Sleep', field: 'characters' }],
    columns: 'State',
  }
}

/* ── ActivityRings ──────────────────────────────────────────────────────── */

const RINGS_SIZES = { default: { px: 160, value: 'Heading/2xl', caption: 'UI/xs/Regular' }, sm: { px: 96, value: '', caption: '' }, lg: { px: 224, value: 'Heading/4xl', caption: 'UI/sm/Regular' }, xl: { px: 288, value: 'Heading/5xl', caption: 'UI/base/Regular' } } as const
const GOALS = [
  { label: 'Move', value: 420, goal: 500, share: 0.84 },
  { label: 'Exercise', value: 38, goal: 30, share: 1.27 },
  { label: 'Stand', value: 9, goal: 12, share: 0.75 },
]

async function drawActivityRings(c: ComponentNode, size: keyof typeof RINGS_SIZES) {
  const S = RINGS_SIZES[size]
  const W = S.px
  const k = W / 200
  const cx = W / 2
  const dial = await box({ name: 'Rings', dir: 'none', w: W, h: W })
  const thick = 17
  const gap = 4
  for (const [i, g] of GOALS.entries()) {
    const r = (100 - thick / 2 - i * (thick + gap)) * k
    const tone = CHART[i]!
    circle(dial, cx, cx, r, thick * k, [tone, 0.2], 'Track')
    const first = Math.min(g.share, 1) * 360
    arc(dial, cx, cx, r, 0, first, thick * k, tone, 'Lap', true)
    // Past its goal a ring runs a second lap, its head casting a shadow back onto the first.
    if (g.share > 1) {
      const over = (g.share - 1) * 360
      const [hx, hy] = polar(cx, cx, r, over)
      disc(dial, hx + 1, hy + 2, (thick / 2) * k, ['role/shadow', 0.5], 'Head shadow')
      arc(dial, cx, cx, r, 0, over, thick * k, tone, 'Second lap', true)
    }
  }
  await style(c, { dir: 'col', gap: 'space/5', align: 'center', w: size === 'sm' ? 'hug' : 300 })
  if (S.value) {
    const center = await box({ name: 'Center', dir: 'col', gap: 'space/1-5', align: 'center' }, ref(await text('84%', S.value, 'role/fg', { name: 'Value' }), 'Value'), await eyebrow('Move', 'Caption'))
    at(dial, center, cx - center.width / 2, cx - center.height / 2)
  }
  add(c, dial)
  if (size === 'sm') return
  const legend = await box({ name: 'Legend', dir: 'col', w: 'fill' })
  for (const [i, g] of GOALS.entries()) {
    const row = await box(
      { name: g.label, dir: 'row', gap: 'space/3', align: 'center', pad: [8, 0], w: 'fill', stroke: i ? 'role/line' : undefined, sides: i ? { top: 1 } : undefined },
      rect('Swatch', 10, 10, CHART[i]!, 'radius/full'),
      await box({ name: 'Label', dir: 'row', w: 'fill' }, await eyebrow(g.label)),
      await box({ name: 'Amount', dir: 'row', align: 'baseline' }, await text(String(g.value), 'UI/base/Medium', 'role/fg'), await text(` / ${g.goal}`, 'UI/base/Regular', 'role/fg-muted')),
      await box({ name: 'Share', dir: 'row', justify: 'end', w: 48 }, await fig(`${Math.round(g.share * 100)}%`, 'UI/sm/Regular', 'role/fg-muted', 'Share')),
    )
    row.minHeight = 40
    add(legend, row)
  }
  add(c, legend)
}

function activityRingsSpec(): SetSpec {
  return {
    key: 'component:activity-rings',
    name: 'Activity rings',
    description:
      'ActivityRings in packages/ui: goals side by side as concentric rings (a day’s move, exercise and stand), each a round-capped arc over a faint track of its chart tone, clockwise from twelve. Past its goal a ring runs a second lap over the first, its head casting a small shadow back so the overlap reads. The bowl holds the first ring’s share; the legend gives each ring its value, goal and share. `sm` is the bare rings. In code the rings fill on view and a ring that closes glows and plays the success cue.',
    variants: (['default', 'sm', 'lg', 'xl'] as const).map((size) => ({ props: { Size: size }, build: (c) => drawActivityRings(c, size) })),
    properties: [{ name: 'Value', type: 'TEXT', default: '84%', field: 'characters' }],
    columns: 'Size',
    gap: [40, 16],
  }
}

/* ── WorldClock ─────────────────────────────────────────────────────────── */

const ZONES = [
  { name: 'San Francisco', offset: 'UTC−7', diff: '', time: '08:30', date: 'Tue 14', shift: 0, day: true },
  { name: 'London', offset: 'UTC+1', diff: '+8 h', time: '16:30', date: 'Tue 14', shift: 8, day: true },
  { name: 'Tokyo', offset: 'UTC+9', diff: '+16 h', time: '00:30', date: 'Wed 15', shift: 16, day: false },
]

async function drawWorldClock(c: ComponentNode, icons: Deps['icons']) {
  const stripW = 480
  const cell = (stripW - 23) / 24
  await style(c, { dir: 'col', gap: 'space/3', w: 'hug' })
  const header = await box(
    { name: 'Header', dir: 'row', gap: 'space/2', align: 'center' },
    rect('Overlap', 8, 8, 'role/success', 'radius/full'),
    await text('Everyone works 08:00 – 09:00 in San Francisco', 'UI/sm/Regular', 'role/fg-muted', { name: 'Summary' }),
  )
  add(c, header)
  const grid = await box({ name: 'Grid', dir: 'none', w: 220 + stripW, h: 32 + ZONES.length * 48 })
  // The ruler: the first zone's hours.
  for (const h of [0, 6, 12, 18]) at(grid, await text(String(h).padStart(2, '0'), 'Mono/xs', 'role/fg-muted', { name: 'Hour' }), 220 + h * (cell + 1), 8)
  for (const [i, z] of ZONES.entries()) {
    const y = 32 + i * 48
    if (i) at(grid, rect('Rule', 220 + stripW, 1, 'role/line-subtle'), 0, y)
    const badge = await box({ name: 'Daylight', dir: 'row', align: 'center', justify: 'center', w: 28, h: 28, radius: 'radius/full', fill: z.day ? 'role/warning-subtle' : 'role/well' }, icon(icons, z.day ? 'sun' : 'moon', 14, z.day ? 'role/warning-text' : 'role/fg-muted'))
    const info = await box(
      { name: z.name, dir: 'row', gap: 'space/3', align: 'center', w: 204 },
      badge,
      await box(
        { name: 'Text', dir: 'col', w: 'fill' },
        await box({ name: 'Top', dir: 'row', justify: 'between', align: 'baseline', w: 'fill' }, await text(z.name, 'UI/base/Medium', 'role/fg', { name: 'Label' }), await text(z.time, 'Mono/base', 'role/fg', { name: 'Time' })),
        await box(
          { name: 'Bottom', dir: 'row', justify: 'between', align: 'baseline', w: 'fill' },
          await text(z.diff ? `${z.offset} · ${z.diff}` : z.offset, 'Mono/xs', 'role/fg-muted', { name: 'Offset' }),
          z.shift === 16 ? await box({ name: 'Date', dir: 'row', pad: [0, 6], radius: 'radius/full', fill: 'role/band' }, await eyebrow(z.date, 'Date', 'role/fg')) : await text(z.date, 'UI/xs/Regular', 'role/fg-muted', { name: 'Date' }),
        ),
      ),
    )
    at(grid, info, 0, y + 8)
    for (let h = 0; h < 24; h++) {
      const local = (h + z.shift) % 24
      const period = local >= 9 && local < 17 ? 'work' : local >= 7 && local < 22 ? 'evening' : 'night'
      const turn = local === 0 && z.shift > 0
      const fill: Ink = period === 'work' ? 'role/accent-subtle' : period === 'evening' ? 'role/band' : 'role/well'
      const hourCell = await box({ name: 'Hour', dir: 'row', align: 'center', justify: 'center', w: f(cell), h: 32, fill, radius: h === 0 || h === 23 ? 'radius/md' : undefined })
      if (h % 3 === 0 || turn) add(hourCell, await text(turn ? 'Wed' : String(local), 'Mono/xs', turn ? 'role/fg' : period === 'work' ? 'role/accent-text' : period === 'evening' ? 'role/fg-muted' : 'role/fg-subtle', { name: 'Hour' }))
      at(grid, hourCell, 220 + h * (cell + 1), y + 8)
    }
  }
  // Where everyone works at once: a success ring over those hours; the cursor runs down every row.
  const overlap = await box({ name: 'Overlap', w: f(cell + 2), h: ZONES.length * 48 - 12, radius: 'radius/md', stroke: 'role/success', strokeWidth: 2 })
  at(grid, overlap, 220 + 8 * (cell + 1) - 1, 32 + 6)
  at(grid, rect('Cursor', 2, ZONES.length * 48 + 4, 'role/fg', 'radius/full'), 220 + 8.5 * (cell + 1) - 1, 28)
  add(c, grid)
  const legend = await box({ name: 'Legend', dir: 'row', gap: 'space/4', align: 'center' })
  for (const [word, fill] of [['Working', 'role/accent-subtle'], ['Awake', 'role/band'], ['Night', 'role/well']] as const)
    add(legend, await box({ name: word, dir: 'row', gap: 'space/1-5', align: 'center' }, rect('Swatch', 10, 10, fill, 'radius/xs'), await text(word, 'UI/xs/Regular', 'role/fg-muted')))
  add(c, legend)
}

function worldClockSpec(deps: Deps): SetSpec {
  return {
    key: 'component:world-clock',
    name: 'World clock',
    description:
      'WorldClock in packages/ui: several time zones side by side, to find a time that works for everyone. A row per zone (its name, its offset from UTC and from the first row, the time there with a sun or a moon) beside a strip of the first row’s day, an hour per cell, coloured by what that hour is there: working, awake or night; where a zone’s date turns over the cell names the new day. Where everyone works at once a success ring holds those hours, and a cursor runs down every row. In code the cursor drags and snaps, and Now returns it to the clock.',
    variants: [{ props: { State: 'rest' }, build: (c) => drawWorldClock(c, deps.icons) }],
    properties: [],
    columns: 'State',
  }
}

/* ── TrackTimeline ──────────────────────────────────────────────────────── */

async function drawTrackTimeline(c: ComponentNode, icons: Deps['icons']) {
  const ROW = 56
  const RULER = 28
  const laneW = 520
  const zoom = 12
  const tracks = [
    { name: 'Dialogue', caption: 'Mono · 0 dB', clips: [[1, 14, 'Interview A'], [17, 38, 'Interview B']], solo: false, mute: false, level: 7 },
    { name: 'Music', caption: 'Stereo · −6 dB', clips: [[0, 24, 'Theme'], [26, 42, 'Outro']], solo: false, mute: false, level: 5 },
    { name: 'Ambience', caption: 'Stereo · −12 dB', clips: [[4, 30, 'Room tone']], solo: false, mute: true, level: 0 },
  ] as const
  await style(c, { dir: 'row', w: 'hug', radius: 'radius/xl', fill: 'role/surface', stroke: 'role/line', clip: true })
  const heads = await box({ name: 'Heads', dir: 'col', w: 176, stroke: 'role/line', sides: { right: 1 } })
  heads.strokesIncludedInLayout = true
  const zoomRow = await box({ name: 'Zoom', dir: 'row', gap: 'space/0-5', align: 'center', pad: [0, 6], w: 'fill', h: RULER, stroke: 'role/line', sides: { bottom: 1 } })
  add(zoomRow, icon(icons, 'zoom-out', 14, 'role/fg-muted'), await text('100%', 'Mono/xs', 'role/fg-muted', { name: 'Zoom' }), icon(icons, 'zoom-in', 14, 'role/fg-muted'))
  add(heads, zoomRow)
  const lane = await box({ name: 'Lane', dir: 'none', w: laneW, h: RULER + ROW * tracks.length })
  for (let t = 0; t <= 42; t += 2) {
    const big = t % 10 === 0
    at(lane, rect('Tick', 1, big ? 10 : 4, 'role/fg-subtle'), t * zoom + 8, RULER - (big ? 10 : 4))
    if (big) at(lane, await text(`0:${String(t).padStart(2, '0')}`, 'Mono/xs', 'role/fg-muted', { name: 'Time' }), t * zoom + 12, 4)
  }
  at(lane, rect('Rule', laneW, 1, 'role/line'), 0, RULER - 1)
  for (const [i, tr] of tracks.entries()) {
    const tone = CHART[i]!
    const on = !tr.mute
    const head = await box({ name: tr.name, dir: 'row', gap: 'space/2', align: 'center', pad: [0, 6, 0, 0], w: 'fill', h: ROW, stroke: i < tracks.length - 1 ? 'role/line' : undefined, sides: i < tracks.length - 1 ? { bottom: 1 } : undefined, opacity: on ? undefined : 0.6 })
    const toggle = async (letter: string, pressed: boolean, kind: 'mute' | 'solo') =>
      box({ name: kind === 'mute' ? 'Mute' : 'Solo', dir: 'row', align: 'center', justify: 'center', w: 24, h: 24, radius: 'radius/md', fill: pressed ? (kind === 'mute' ? 'role/warning-subtle' : 'role/accent-subtle') : undefined }, await text(letter, 'Mono/xs', pressed ? (kind === 'mute' ? 'role/warning-text' : 'role/accent-text') : 'role/fg-muted'))
    const meter = await box({ name: 'Meter', dir: 'col', gap: 1, w: 4, h: 28 })
    for (let cell = 9; cell >= 0; cell--) {
      const lit = tr.level > cell
      const r = rect('Level', 4, 1.9, lit ? (cell >= 8 ? 'role/warning' : tone) : 'role/well', 1)
      add(meter, r)
      r.layoutSizingVertical = 'FILL'
    }
    add(
      head,
      // The track's edge in its tone, at the inline start.
      rect('Track edge', 3, ROW - 16, tone, 'radius/full'),
      await box({ name: 'Name', dir: 'col', gap: 'space/1', w: 'fill' }, await text(tr.name, 'UI/sm/Medium', 'role/fg', { name: 'Track' }), await eyebrow(tr.caption, 'Caption')),
      await toggle('M', tr.mute, 'mute'),
      await toggle('S', tr.solo, 'solo'),
      meter,
    )
    add(heads, head)
    const y = RULER + i * ROW
    if (i < tracks.length - 1) at(lane, rect('Rule', laneW, 1, 'role/line'), 0, y + ROW - 1)
    for (const [ci, [a, b, name]] of tr.clips.entries()) {
      const selected = i === 0 && ci === 1
      const w = (b - a) * zoom
      const clip = await box({ name: 'Clip', dir: 'col', w: f(w), h: ROW - 12, radius: 'radius/md', fill: on ? [tone, selected ? 0.3 : 0.18] : 'role/band', stroke: on ? [tone, 0.45] : 'role/line-subtle', clip: true })
      add(clip, await box({ name: 'Head', dir: 'row', pad: [4, 8, 0, 8], w: 'fill' }, await text(name, 'Mono/xs', on ? 'role/fg' : 'role/fg-muted', { name: 'Clip name', truncate: true, w: 'fill' })))
      const waveBox = await box({ name: 'Wave', dir: 'none', w: f(w - 12), h: ROW - 12 - 24 })
      wave(waveBox, 0, 0, w - 12, ROW - 12 - 24, LOUDNESS(Math.floor((w - 12) / 3), i + 1 + ci), on ? tone : 'role/line-strong', 1.5)
      add(clip, await box({ name: 'Body', dir: 'row', pad: [0, 6, 4, 6], w: 'fill' }, waveBox))
      at(lane, clip, a * zoom + 8, y + 6)
      if (selected) {
        const ring = await box({ name: 'Selected', w: f(w + 4), h: ROW - 8, radius: 'radius/md', stroke: tone, strokeWidth: 2 })
        at(lane, ring, a * zoom + 6, y + 4)
      }
    }
  }
  // The playhead: an accent line from the ruler down, its grip on the ruler.
  const px = 21 * zoom + 8
  at(lane, rect('Playhead', 1, ROW * tracks.length + 4, 'role/accent'), px, RULER - 4)
  at(lane, rect('Grip', 10, 14, 'role/accent', 3), px - 4.5, RULER - 14)
  add(c, heads, lane)
}

function trackTimelineSpec(deps: Deps): SetSpec {
  return {
    key: 'component:track-timeline',
    name: 'Track timeline',
    description:
      'TrackTimeline in packages/ui: tracks of clips along a time ruler, for an edit. Each track a lane in its chart tone, each clip a rounded bar holding the slice of the track’s sound it plays (bars from the loudness samples you pass); mute and solo sit on each track’s head beside a level meter. The selected clip is ringed in its tone; the playhead is an accent line with its grip on the ruler. In code clips drag and trim with snapping, − and + zoom about the playhead, and the meters read the track while it plays.',
    variants: [{ props: { State: 'rest' }, build: (c) => drawTrackTimeline(c, deps.icons) }],
    properties: [],
    columns: 'State',
  }
}

/* ── WaveformScrubber ───────────────────────────────────────────────────── */

async function drawWaveform(c: ComponentNode, clip: boolean) {
  const W = 560
  const H = 64
  const n = Math.floor(W / 5)
  const heights = LOUDNESS(n, 2)
  await style(c, { dir: 'col', gap: 'space/2', w: W })
  const chapters = [
    [0, 'Cold open'],
    [0.22, 'The interview'],
    [0.68, 'Listener mail'],
  ] as const
  const playhead = 0.41
  const chapterRow = await box({ name: 'Chapters', dir: 'none', w: W, h: 16 })
  for (const [i, [at_, title]] of chapters.entries()) {
    const current = i === 1
    at(chapterRow, await eyebrow(title, 'Chapter', current ? 'role/fg' : 'role/fg-muted'), at_ * W + 6, 0)
  }
  const track = await box({ name: 'Track', dir: 'none', w: W, h: H })
  if (clip) at(track, rect('Clip', f(0.3 * W), H, 'role/accent-subtle', 'radius/sm'), 0.3 * W, 0)
  // Played bars in ink and the rest dim (a clip brackets the part to share in the accent).
  const split = Math.round(playhead * n)
  const from = Math.round(0.3 * n)
  const to = Math.round(0.6 * n)
  if (clip) {
    wave(track, 0, 0, (from / n) * W, H, heights.slice(0, from), 'role/line', 3, 'Wave')
    wave(track, (from / n) * W, 0, ((to - from) / n) * W, H, heights.slice(from, to), 'role/accent', 3, 'Clip wave')
    wave(track, (to / n) * W, 0, ((n - to) / n) * W, H, heights.slice(to), 'role/line', 3, 'Wave')
  } else {
    wave(track, 0, 0, (split / n) * W, H, heights.slice(0, split), 'role/fg', 3, 'Played')
    wave(track, (split / n) * W, 0, ((n - split) / n) * W, H, heights.slice(split), 'role/line-strong', 3, 'Ahead')
  }
  for (const [at_] of chapters.slice(1)) at(track, rect('Chapter tick', 1, H + 12, 'role/fg-subtle'), at_ * W, -6)
  if (clip) {
    for (const x of [0.3, 0.6]) {
      const handle = await box({ name: 'Handle', dir: 'row', justify: 'center', align: 'center', w: 10, h: H + 12, radius: 'radius/sm', fill: 'role/accent' }, rect('Grip', 1, (H + 12) / 3, ['role/on-accent', 0.7]))
      at(track, handle, x * W - 5, -6)
    }
  } else {
    const px = playhead * W
    at(track, rect('Playhead', 2, H + 12, 'role/accent', 'radius/full'), px - 1, -6)
    at(track, rect('Playhead dot ring', 14, 14, 'role/surface', 'radius/full'), px - 7, -11)
    at(track, rect('Playhead dot', 10, 10, 'role/accent', 'radius/full'), px - 5, -9)
  }
  const ruler = await box({ name: 'Ruler', dir: 'none', w: W, h: 20 })
  for (let m = 0; m <= 48; m += 2) {
    const big = m % 10 === 0
    at(ruler, rect('Tick', 1, big ? 8 : 4, 'role/fg-subtle'), (m / 48) * W - 0.5, 0)
  }
  at(ruler, figure(await text('0:00', 'UI/xs/Regular', 'role/fg-muted', { name: 'Start' })), 0, 10)
  const end = figure(await text('48:00', 'UI/xs/Regular', 'role/fg-muted', { name: 'End' }))
  at(ruler, end, W - end.width, 10)
  add(c, chapterRow, track, ruler)
}

function waveformSpec(): SetSpec {
  return {
    key: 'component:waveform-scrubber',
    name: 'Waveform scrubber',
    description:
      'WaveformScrubber in packages/ui: where you are in a recording, drawn as its sound, a bar per slice of the loudness samples you pass: played bars in ink and the rest dim, chapter starts as ticks with their titles above, a ruler of minutes underneath and the playhead in the accent. With `clip` it becomes a range: two accent handles bracket the part to share and the rest dims. In code the bars rise on first view, hovering shows the time and chapter, and crossing a chapter while scrubbing plays a tick.',
    variants: (['false', 'true'] as const).map((clip) => ({ props: { Clip: clip }, build: (c) => drawWaveform(c, clip === 'true') })),
    properties: [],
    columns: 'Clip',
    gap: [48, 24],
  }
}

/** Swaps an instance's icon through its Icon property. */
function swapIcon(instance: InstanceNode, component: ComponentNode, property = 'Icon') {
  const key = Object.keys(instance.componentProperties).find((k) => k.split('#')[0] === property)
  if (key) instance.setProperties({ [key]: component.id })
}

/** A state icon's other pose (play's pause, say), or the icon at rest. */
function otherState(icons: Deps['icons'], name: string): ComponentNode {
  const build = pick(icons, name)
  if (build.node.type !== 'COMPONENT_SET') return build.rest
  return (build.node.children.find((c) => c !== build.rest) as ComponentNode | undefined) ?? build.rest
}

/** A Button instance holding only an icon (a square size), with that icon swapped in and inked as the variant inks it. */
function iconButton(deps: Deps, name: string | ComponentNode, variant: string, size = 'icon', ink?: string) {
  const b = button(deps.get, '', { Variant: variant, Size: size })
  swapIcon(b, typeof name === 'string' ? pick(deps.icons, name).rest : name)
  const paint = solid(ink ?? (variant === 'default' ? (bezel() ? 'role/canvas' : 'role/on-action') : variant === 'ghost' ? 'role/fg-muted' : 'role/fg'))
  for (const node of b.findAll((n) => n.type === 'VECTOR')) {
    const v = node as VectorNode
    if (Array.isArray(v.strokes) && v.strokes.length) v.strokes = [paint]
    if (Array.isArray(v.fills) && v.fills.length) v.fills = [paint]
  }
  return b
}

/** An image placeholder: a token-filled plate with a picture glyph, standing in for a photo. */
async function picture(name: string, w: number | 'fill', h: number | 'fill', fill: Ink, icons: Deps['icons'], glyph: Ink = ['role/fg', 0.35]) {
  return box({ name, dir: 'row', align: 'center', justify: 'center', w, h, fill }, icon(icons, 'image', 24, typeof glyph === 'string' ? glyph : 'role/fg-subtle'))
}

/* ── AudioRecorder ──────────────────────────────────────────────────────── */

async function drawAudioRecorder(c: ComponentNode, state: 'idle' | 'recording' | 'recorded', deps: Deps) {
  await style(c, { dir: 'col', gap: 'space/2', pad: 12, w: 420, radius: 'radius/xl', fill: 'role/surface', stroke: 'role/line' })
  const stage = await box({ name: 'Stage', dir: 'none', w: 'fill', h: 92 })
  add(c, stage)
  const W = 420 - 24 - 8
  if (state === 'recorded') {
    const heights = LOUDNESS(78, 3)
    const split = 30
    wave(stage, 4, 14, (split / 78) * W, 64, heights.slice(0, split), 'role/fg', 3, 'Played')
    wave(stage, 4 + (split / 78) * W, 14, ((78 - split) / 78) * W, 64, heights.slice(split), 'role/line-strong', 3, 'Ahead')
    at(stage, rect('Playhead', 2, 76, 'role/accent', 'radius/full'), 4 + (split / 78) * W - 1, 8)
  } else {
    const heights = state === 'recording' ? LOUDNESS(78, 5) : Array.from({ length: 78 }, () => 0)
    wave(stage, 4, 14, W, 64, heights, state === 'recording' ? 'role/fg' : 'role/line-strong', 3, 'Live wave')
  }
  const controls = await box({ name: 'Controls', dir: 'row', gap: 'space/2', align: 'center', w: 'fill' })
  controlHeightOf(controls)
  if (state === 'idle') {
    const mic = iconButton(deps, 'mic', 'default')
    add(controls, mic, await text('Press to record · up to 2:00', 'UI/base/Regular', 'role/fg-muted', { name: 'Caption', w: 'fill' }))
  } else if (state === 'recording') {
    // Stop: an outline round key holding a danger square, ringed by the limit's countdown.
    const stop = iconButton(deps, 'square', 'outline', 'icon', 'role/danger')
    const holder = await box({ name: 'Primary', dir: 'none', w: 40, h: 40 })
    circle(holder, 20, 20, 19, 1.5, 'role/line', 'Limit track')
    arc(holder, 20, 20, 19, 0, 130, 1.5, 'role/accent', 'Limit', true)
    at(holder, stop, 20 - 16, 20 - 16)
    add(
      controls,
      holder,
      rect('Recording', 8, 8, 'role/danger', 'radius/full'),
      figure(await text('0:43', 'UI/base/Medium', 'role/fg', { name: 'Timer' })),
      await text('1:17 left', 'UI/base/Regular', 'role/fg-muted', { name: 'Remaining' }),
      await spacerBox(),
      iconButton(deps, otherState(deps.icons, 'play'), 'ghost'),
    )
  } else {
    add(
      controls,
      iconButton(deps, 'play', 'outline'),
      await box({ name: 'Time', dir: 'row', align: 'baseline' }, figure(await text('0:16', 'UI/base/Regular', 'role/fg')), figure(await text(' / 0:43', 'UI/base/Regular', 'role/fg-muted'))),
      await spacerBox(),
      iconButton(deps, 'trash', 'ghost'),
      button(deps.get, 'Save'),
    )
  }
  add(c, controls)
}

function controlHeightOf(frame: FrameNode) {
  frame.layoutSizingVertical = 'FIXED'
  frame.setBoundVariable('height', themeVar('control/default'))
}

function audioRecorderSpec(deps: Deps): SetSpec {
  return {
    key: 'component:audio-recorder',
    name: 'Audio recorder',
    description:
      'AudioRecorder in packages/ui: record a voice note, listen back, then keep it or not, in one card that never changes height. Idle: the record key and a caption with the limit. Recording: the sound as bars, a timer with what’s left, a ring around stop running down, pause. Recorded: the take on a WaveformScrubber, play, its length, discard and Save (an AsyncButton). In code the microphone, MediaRecorder, the scrolling bars and the breathing dot live; the cues play around a take.',
    variants: (['idle', 'recording', 'recorded'] as const).map((state) => ({ props: { State: state }, build: (c) => drawAudioRecorder(c, state, deps) })),
    properties: [],
    columns: 'State',
    gap: [32, 16],
  }
}

/* ── VoiceOrb ───────────────────────────────────────────────────────────── */

const ORB_SIZES = { default: 112, sm: 64, lg: 176, xl: 256 } as const

async function drawVoiceOrb(c: ComponentNode, size: keyof typeof ORB_SIZES, state: 'idle' | 'listening' | 'muted') {
  const W = ORB_SIZES[size]
  const cx = W / 2
  const r = cx * 0.62
  await style(c, { dir: 'none', w: W, h: W })
  const tone: Ink = state === 'muted' ? 'role/fg-subtle' : 'role/accent'
  // The halo, then (listening) rings drawn in from the edge, then the sphere lit from its upper left.
  disc(c, cx, cx, r * 1.35, [tone as string, 0.1], 'Halo')
  if (state === 'listening') for (const [i, k] of [1.5, 1.28].entries()) circle(c, cx, cx, Math.min(cx - 1, r * k), 1.5, [tone as string, 0.35 - i * 0.1], 'Ring')
  disc(c, cx, cx, r, tone, 'Sphere')
  disc(c, cx - r * 0.28, cx - r * 0.3, r * 0.36, ['role/on-accent', 0.2], 'Light')
}

function voiceOrbSpec(): SetSpec {
  const variants: { props: Record<string, string>; build: (c: ComponentNode) => Promise<void> }[] = []
  for (const state of ['idle', 'listening', 'muted'] as const)
    for (const size of ['default', 'sm', 'lg', 'xl'] as const) variants.push({ props: { Size: size, State: state }, build: (c) => drawVoiceOrb(c, size, state) })
  return {
    key: 'component:voice-orb',
    name: 'Voice orb',
    description:
      'VoiceOrb in packages/ui: a voice agent’s presence, a softly lit sphere in the theme’s accent (chart-2 as a hint) at 62% of its box inside a faint halo, its rest pose drawn here; muted grays it. In code it’s WebGL2 (Canvas2D, else a CSS disc) and its motion says what the agent is doing: idle breathes, listening draws rings in from the edge, thinking swirls inside, speaking sends pulses out, the sphere swelling with the level. Reduced motion: a still sphere that only scales gently.',
    variants,
    properties: [],
    columns: 'Size',
    gap: [32, 24],
  }
}

/* ── ImageCompare ───────────────────────────────────────────────────────── */

async function drawImageCompare(c: ComponentNode, orientation: 'horizontal' | 'vertical', icons: Deps['icons']) {
  const W = orientation === 'horizontal' ? 480 : 320
  const H = orientation === 'horizontal' ? 300 : 360
  const shown = 0.5
  await style(c, { dir: 'none', w: W, h: H, radius: 'radius/xl', fill: 'role/well', clip: true })
  // After fills the box; before shows up to the divider. Token plates stand in for the two pictures.
  at(c, await picture('After', W, H, ['role/chart-2', 0.3], icons), 0, 0)
  const before = orientation === 'horizontal' ? await picture('Before', Math.round(W * shown), H, ['role/chart-1', 0.3], icons) : await picture('Before', W, Math.round(H * shown), ['role/chart-1', 0.3], icons)
  at(c, before, 0, 0)
  const tag = async (word: string) => box({ name: 'Label', dir: 'row', pad: [2, 8], radius: 'radius/md', fill: 'role/chrome-float', effect: 'Shadow/xs' }, await text(word, 'UI/sm/Medium', 'role/fg'))
  at(c, ref(await tag('Before'), 'Before'), 12, 12)
  const after = ref(await tag('After'), 'After')
  if (orientation === 'horizontal') at(c, after, W - 12 - 64, 12)
  else at(c, after, 12, H - 12 - 24)
  if (orientation === 'horizontal') after.x = Math.round(W - 12 - after.width)
  else after.y = Math.round(H - 12 - after.height)
  // The divider: a 2px key-coloured line, its handle a round key with the chevrons.
  const line = orientation === 'horizontal' ? rect('Divider', 2, H, 'role/key') : rect('Divider', W, 2, 'role/key')
  at(c, line, orientation === 'horizontal' ? W * shown - 1 : 0, orientation === 'horizontal' ? 0 : H * shown - 1)
  const handle = await box({ name: 'Handle', dir: 'row', align: 'center', justify: 'center', radius: 'radius/full', fill: 'role/key', stroke: 'role/line', effect: 'Shadow/md' }, icon(icons, orientation === 'horizontal' ? ['chevrons-left-right', 'move'] : ['chevrons-up-down', 'move'], 18, 'role/fg'))
  handle.layoutSizingHorizontal = 'FIXED'
  handle.layoutSizingVertical = 'FIXED'
  handle.setBoundVariable('width', themeVar('control/default'))
  handle.setBoundVariable('height', themeVar('control/default'))
  at(c, handle, (orientation === 'horizontal' ? W * shown : W / 2) - handle.width / 2, (orientation === 'horizontal' ? H / 2 : H * shown) - handle.height / 2)
}

function imageCompareSpec(deps: Deps): SetSpec {
  return {
    key: 'component:image-compare',
    name: 'Image compare',
    description:
      'ImageCompare in packages/ui: two pictures stacked with a divider between them, `before` up to the divider and `after` past it, each tagged on a chrome plate. The divider is a 2px key-coloured line with a round key handle (a slider, 0–100). Token plates stand in for the photos: swap in your images. In code dragging follows the pointer 1:1, a press springs the divider there and keys step it; `hover` follows a mouse without a press.',
    variants: (['horizontal', 'vertical'] as const).map((o) => ({ props: { Orientation: o }, build: (c) => drawImageCompare(c, o, deps.icons) })),
    properties: [
      { name: 'Before', type: 'BOOLEAN', default: true, field: 'visible' },
      { name: 'After', type: 'BOOLEAN', default: true, field: 'visible' },
    ],
    columns: 'Orientation',
    gap: [48, 16],
  }
}

/* ── ImageAccordion ─────────────────────────────────────────────────────── */

async function drawImageAccordion(c: ComponentNode, orientation: 'horizontal' | 'vertical', icons: Deps['icons']) {
  const horizontal = orientation === 'horizontal'
  await style(c, { dir: horizontal ? 'row' : 'col', gap: 'space/1-5' })
  const items = ['Harbour at dawn', 'Old town', 'The market', 'Hills', 'Night ferry']
  // The open panel takes about three fifths of the box; the strips split the rest.
  const along = (horizontal ? 640 : 480) - 6 * (items.length - 1)
  const across = horizontal ? 320 : 360
  const wide = Math.round(along * 0.6)
  const slim = f((along - wide) / (items.length - 1))
  for (const [i, title] of items.entries()) {
    const open = i === 1
    const size = open ? wide : slim
    const [w, h] = horizontal ? [size, across] : [across, size]
    const panel = await box({ name: open ? 'Panel open' : 'Panel', dir: 'none', w, h, radius: 'radius/lg', fill: 'role/well', clip: true })
    add(c, panel)
    at(panel, await picture('Media', w, h, [CHART[i % 5]!, open ? 0.35 : 0.22], icons), 0, 0)
    if (open) {
      const caption = await box(
        { name: 'Caption', dir: 'col', gap: 'space/0-5', pad: [8, 12], radius: 'radius/md', fill: 'role/surface', stroke: 'role/line', effect: 'Shadow/xs' },
        ref(await text(title, 'UI/sm/Medium', 'role/fg', { name: 'Title' }), 'Title'),
        await text('Fishing boats coming in', 'UI/xs/Regular', 'role/fg-muted', { name: 'Description' }),
      )
      at(panel, caption, 12, h - 12 - caption.height)
    }
  }
}

function imageAccordionSpec(deps: Deps): SetSpec {
  return {
    key: 'component:image-accordion',
    name: 'Image accordion',
    description:
      'ImageAccordion in packages/ui: a row (or column) of pictures, one open wide (about three fifths) and the rest slim strips in the well, the open one captioned on a surface plate. The component never changes size: only the split moves. Token plates stand in for the photos. In code a strip opens on hover, focus or press, the split glides on the smooth spring and the caption fades up.',
    variants: (['horizontal', 'vertical'] as const).map((o) => ({ props: { Orientation: o }, build: (c) => drawImageAccordion(c, o, deps.icons) })),
    properties: [{ name: 'Title', type: 'TEXT', default: 'Old town', field: 'characters' }],
    columns: 'Orientation',
    gap: [48, 16],
  }
}

/* ── AnnotatedImage ─────────────────────────────────────────────────────── */

async function drawAnnotatedImage(c: ComponentNode, icons: Deps['icons']) {
  const gutter = 176
  const mediaW = 360
  const H = 260
  const W = gutter * 2 + 48 + mediaW
  await style(c, { dir: 'col', gap: 'space/3', w: W })
  const stage = await box({ name: 'Stage', dir: 'none', w: W, h: H })
  const mx = gutter + 24
  at(stage, await box({ name: 'Media', dir: 'row', align: 'center', justify: 'center', w: mediaW, h: H, radius: 'radius/xl', fill: 'role/band', clip: true }, icon(icons, 'image', 32, 'role/fg-subtle')), mx, 0)
  const notes = [
    { x: 0.22, y: 0.3, title: 'Power button', detail: 'Hold for 3 s to restart', left: true },
    { x: 0.3, y: 0.72, title: 'USB-C port', detail: 'Charges at 30 W', left: true },
    { x: 0.7, y: 0.22, title: 'Status light', detail: 'Green when synced', left: false },
    { x: 0.78, y: 0.64, title: 'Speaker grille', left: false },
  ]
  const lit = 2
  for (const [i, n] of notes.entries()) {
    const px = mx + n.x * mediaW
    const py = n.y * H
    // A label on the start gutter reads toward the media: its number last, its words set to the right.
    const number = await box({ name: 'Number', dir: 'row', align: 'center', justify: 'center', w: 22, h: 22, radius: 'radius/full', fill: i === lit ? 'role/accent' : 'role/band' }, figure(await text(String(i + 1), 'UI/xs/Medium', i === lit ? 'role/on-accent' : 'role/fg')))
    const words = await box(
      { name: 'Text', dir: 'col', w: 'fill' },
      await text(n.title, 'UI/base/Medium', 'role/fg', { name: 'Title', w: 'fill', align: n.left ? 'RIGHT' : 'LEFT' }),
      n.detail ? await text(n.detail, 'UI/sm/Regular', 'role/fg-muted', { name: 'Detail', w: 'fill', align: n.left ? 'RIGHT' : 'LEFT' }) : null,
    )
    const label = await box({ name: 'Label', dir: 'row', gap: 'space/2-5', align: 'start', w: gutter }, ...(n.left ? [words, number] : [number, words]))
    const ly = Math.round(py - 11)
    const lx = n.left ? 0 : mx + mediaW + 24
    const ax = n.left ? gutter : lx
    // The leader: from the point to the label's number side, in the accent when lit.
    vector(stage, `M${f(px)},${f(py)} L${f(ax + (n.left ? 0 : -1))},${f(ly + 11)}`, { stroke: solid(i === lit ? 'role/accent' : 'role/fg-subtle'), strokeWidth: i === lit ? 1.5 : 1 }, 'Leader')
    at(stage, label, lx, ly)
    const point = await box({ name: 'Point', dir: 'row', align: 'center', justify: 'center', w: 24, h: 24, radius: 'radius/full', fill: i === lit ? 'role/accent' : 'role/fg', stroke: 'role/surface', strokeWidth: 2, strokeAlign: 'OUTSIDE', effect: 'Shadow/sm' }, figure(await text(String(i + 1), 'UI/xs/Medium', i === lit ? 'role/on-accent' : 'role/canvas')))
    at(stage, point, px - 12, py - 12)
  }
  add(c, stage, await box({ name: 'Caption', dir: 'row', pad: [0, mx], w: 'fill' }, await text('The hub, from the back.', 'UI/sm/Regular', 'role/fg-muted', { name: 'Caption' })))
}

function annotatedImageSpec(deps: Deps): SetSpec {
  return {
    key: 'component:annotated-image',
    name: 'Annotated image',
    description:
      'AnnotatedImage in packages/ui: a picture with numbered callouts, each point carrying its number and a leader line running to its label in the gutter beside the media, labels stacked in order on their point’s side. The lit pair (hovered or pinned) takes the accent. A token plate stands in for the photo. Under 40rem the gutters fold into a numbered list under the media. In code the callouts pop in one after another and each line draws to its label.',
    variants: [{ props: { State: 'rest' }, build: (c) => drawAnnotatedImage(c, deps.icons) }],
    properties: [],
    columns: 'State',
  }
}

/* ── LiveCursors ────────────────────────────────────────────────────────── */

async function cursor(name: string, tone: string, chat?: string) {
  const holder = await box({ name: `Cursor ${name}`, dir: 'none', w: 1, h: 1 })
  holder.clipsContent = false
  vector(holder, 'M1,1 L15,8.6 L8.6,10.2 L5.4,16.4 Z', { fill: solid(tone), stroke: solid('role/canvas'), strokeWidth: 1.5 }, 'Arrow')
  const tags = await box(
    { name: 'Tags', dir: 'col', gap: 'space/1', align: 'start' },
    await box({ name: 'Name', dir: 'row', pad: [2, 8], radius: 'radius/full', fill: tone, effect: 'Shadow/sm' }, await text(name, 'UI/xs/Medium', 'role/canvas')),
    chat ? await box({ name: 'Chat', dir: 'row', pad: [6, 10], radius: 'radius/lg', fill: tone, effect: 'Shadow/md' }, await text(chat, 'UI/sm/Regular', 'role/canvas', { name: 'Message' })) : null,
  )
  at(holder, tags, 12, 16)
  return holder
}

async function drawLiveCursors(c: ComponentNode) {
  await style(c, { dir: 'col', gap: 'space/3', w: 520 })
  // Presence: everyone here, ringed in their colour.
  const people = [['AK', 'role/chart-1'], ['MS', 'role/chart-2'], ['JR', 'role/chart-3']] as const
  const stack = await box({ name: 'Presence', dir: 'row', gap: -6, align: 'center' })
  for (const [initials, tone] of people)
    add(stack, await box({ name: 'Avatar', dir: 'row', align: 'center', justify: 'center', w: 32, h: 32, radius: 'radius/full', fill: 'role/canvas', stroke: tone, strokeWidth: 2 }, await text(initials, 'UI/sm/Medium', 'role/fg-muted')))
  add(c, await box({ name: 'Header', dir: 'row', gap: 'space/3', align: 'center' }, stack, await text('3 people here', 'UI/sm/Regular', 'role/fg-muted')))
  const surface = await box({ name: 'Surface', dir: 'none', w: 520, h: 280, radius: 'radius/xl', fill: 'role/surface', stroke: 'role/line', clip: true })
  // Someone's selection: tinted rectangles in their colour.
  at(surface, await box({ name: 'Card', dir: 'col', gap: 'space/2', pad: 14, w: 200, h: 96, radius: 'radius/lg', fill: 'role/band' }, await text('Q3 roadmap', 'UI/base/Medium', 'role/fg'), rect('Line', 150, 6, 'role/well', 'radius/full'), rect('Line', 110, 6, 'role/well', 'radius/full')), 40, 40)
  at(surface, await box({ name: 'Selection', w: 208, h: 104, radius: 'radius/xs', fill: ['role/chart-2', 0.14], stroke: 'role/chart-2' }), 36, 36)
  at(surface, await box({ name: 'Card', dir: 'col', gap: 'space/2', pad: 14, w: 180, h: 80, radius: 'radius/lg', fill: 'role/band' }, await text('Launch notes', 'UI/base/Medium', 'role/fg'), rect('Line', 120, 6, 'role/well', 'radius/full')), 300, 150)
  at(surface, await cursor('Ada', 'role/chart-1', 'Moving this to Thursday?'), 320, 60)
  at(surface, await cursor('Mo', 'role/chart-2'), 200, 120)
  at(surface, await cursor('Jun', 'role/chart-3'), 120, 200)
  add(c, surface)
}

function liveCursorsSpec(): SetSpec {
  return {
    key: 'component:live-cursors',
    name: 'Live cursors',
    description:
      'LiveCursors in packages/ui: multiplayer presence over a collaborative surface. Each remote cursor is an arrow and a name tag in the person’s colour (the chart palette, picked by id so everyone agrees), with an optional chat bubble under the name; their selection shows as tinted rectangles; LivePresence stacks everyone’s avatars ringed in their colour. Transport-agnostic. In code cursors glide on the snappy spring between sparse updates, idle ones fade out and leavers shrink away.',
    variants: [{ props: { State: 'rest' }, build: (c) => drawLiveCursors(c) }],
    properties: [],
    columns: 'State',
  }
}

/* ── Whiteboard ─────────────────────────────────────────────────────────── */

async function drawWhiteboard(c: ComponentNode, deps: Deps) {
  const W = 720
  const H = 440
  await style(c, { dir: 'none', w: W, h: H, radius: 'radius/xl', fill: 'role/canvas', stroke: 'role/line', clip: true })
  // The dot grid: one path of dots.
  const dots: string[] = []
  for (let x = 24; x < W; x += 24) for (let y = 24; y < H; y += 24) dots.push(`M${x},${y} L${x + 0.01},${y}`)
  vector(c, dots.join(' '), { stroke: solid('role/line-strong'), strokeWidth: 1.5 }, 'Grid')
  // Shapes: a sticky note, a box, an ellipse, a connector and text.
  at(c, await box({ name: 'Sticky note', dir: 'col', pad: 12, w: 150, h: 130, fill: 'role/warning-subtle', effect: 'Shadow/sm', radius: 'radius/xs' }, await text('Ask design about the empty state', 'UI/base/Regular', 'role/fg', { w: 'fill' })), 80, 120)
  at(c, await box({ name: 'Rectangle', dir: 'row', align: 'center', justify: 'center', w: 170, h: 90, radius: 'radius/md', stroke: 'role/fg', strokeWidth: 2 }, await text('Checkout', 'UI/base/Medium', 'role/fg')), 320, 110)
  vector(c, 'M380,320 A70,40 0 1 1 520,320 A70,40 0 1 1 380,320 Z', { stroke: solid('role/chart-3'), strokeWidth: 2 }, 'Ellipse')
  vector(c, 'M490,155 C580,155 580,250 470,282', { stroke: solid('role/fg'), strokeWidth: 2 }, 'Connector')
  vector(c, 'M480,272 L469,283 L484,288', { stroke: solid('role/fg'), strokeWidth: 2 }, 'Arrowhead')
  vector(c, 'M230,180 C270,140 290,160 318,155', { stroke: solid('role/chart-1'), strokeWidth: 3 }, 'Pen stroke')
  at(c, await text('Flow v2', 'Heading/xl', 'role/fg', { name: 'Text' }), 80, 72)
  // The rectangle is selected: an accent outline with corner handles.
  at(c, await box({ name: 'Selection', w: 178, h: 98, stroke: 'role/accent', strokeWidth: 1.5 }), 316, 106)
  for (const [x, y] of [[316, 106], [494, 106], [316, 204], [494, 204]]) at(c, await box({ name: 'Handle', w: 8, h: 8, radius: 'radius/xs', fill: 'role/surface', stroke: 'role/accent', strokeWidth: 1.5 }), x! - 4, y! - 4)
  // A comment pin.
  at(c, await box({ name: 'Pin', dir: 'row', align: 'center', justify: 'center', w: 28, h: 28, radius: 'radius/full', fill: 'role/accent', effect: 'Shadow/md' }, await text('2', 'UI/sm/Medium', 'role/on-accent')), 600, 330)
  // A remote cursor.
  at(c, await cursor('Mo', 'role/chart-2'), 250, 300)
  // The floating toolbar: tools as keys, the picked one raised.
  const tools = ['mouse-pointer', 'hand', 'pencil', 'minus', 'arrow-up-right', 'square', 'circle', 'type', 'sticky-note', 'message']
  const bar = await box({ name: 'Toolbar', dir: 'row', gap: 2, align: 'center', pad: 4, radius: 'radius/xl', fill: bezel() ? 'bezel/popover' : 'role/overlay', stroke: 'role/line', effect: 'Shadow/md' })
  for (const [i, t] of tools.entries()) {
    const on = i === 5
    const key = await box({ name: 'Tool', dir: 'row', align: 'center', justify: 'center', radius: 'radius/md', fill: on ? 'role/key' : undefined, effect: on ? (bezel() ? 'Bezel/key' : 'Shadow/xs') : undefined }, icon(deps.icons, [t, 'square'], 16, on ? 'role/fg' : 'role/fg-muted'))
    key.layoutSizingHorizontal = 'FIXED'
    key.layoutSizingVertical = 'FIXED'
    key.setBoundVariable('width', themeVar('control/sm'))
    key.setBoundVariable('height', themeVar('control/sm'))
    add(bar, key)
    if (i === 1) add(bar, rect('Separator', 1, 16, 'role/line'))
  }
  at(c, bar, W / 2 - bar.width / 2, 16)
  // The zoom control and undo, bottom corners.
  const zoom = await box({ name: 'Zoom', dir: 'row', gap: 2, align: 'center', pad: 4, radius: 'radius/xl', fill: bezel() ? 'bezel/popover' : 'role/overlay', stroke: 'role/line', effect: 'Shadow/md' }, iconButton(deps, 'zoom-out', 'ghost', 'icon-sm'), figure(await text('100%', 'UI/sm/Regular', 'role/fg', { name: 'Zoom' })), iconButton(deps, 'zoom-in', 'ghost', 'icon-sm'))
  at(c, zoom, W - 16 - zoom.width, H - 16 - zoom.height)
  const history = await box({ name: 'History', dir: 'row', gap: 2, align: 'center', pad: 4, radius: 'radius/xl', fill: bezel() ? 'bezel/popover' : 'role/overlay', stroke: 'role/line', effect: 'Shadow/md' }, iconButton(deps, 'undo', 'ghost', 'icon-sm'), iconButton(deps, 'redo', 'ghost', 'icon-sm'))
  at(c, history, 16, H - 16 - history.height)
}

function whiteboardSpec(deps: Deps): SetSpec {
  return {
    key: 'component:whiteboard',
    name: 'Whiteboard',
    description:
      'Whiteboard in packages/ui, as a static board: a dot grid on the canvas, a sticky note on its colour’s soft fill, a box, an ellipse, a pen stroke, a connector with its arrow, text, a selected shape with corner handles in the accent, a comment pin and a remote cursor. The floating toolbar holds the tools as keys (the picked one raised); zoom and undo sit in the corners. In code it pans and zooms, snaps with guides, arranges, keeps undo history and shows other people through LiveCursors.',
    variants: [{ props: { State: 'rest' }, build: (c) => drawWhiteboard(c, deps) }],
    properties: [],
    columns: 'State',
  }
}

const file = (name: string) => `packages/ui/src/components/ui/${name}.tsx`

export const ENTRIES: Entry[] = [
  {
    doc: {
      key: 'component:refill-meter',
      title: 'Refill meter',
      usage: '<RefillMeter value={42} capacity={60} refillRate={10} burst={20} segments={30} />',
      tokens: 'Cells role/fg (low role/warning, empty a role/danger wash), off role/well, 28 high, 2px apart  ·  Burst marker role/warning, reserve rail at 45%  ·  Label and terms Bezel/Eyebrow  ·  Figures mono UI/lg/Medium',
      file: file('refill-meter'),
    },
    spec: () => refillSpec(),
  },
  {
    doc: {
      key: 'component:allocation-meter',
      title: 'Allocation meter',
      usage: '<AllocationMeter envelopes={budgets} onMove={move} format={{ style: "currency", currency: "USD" }} />',
      tokens: 'Columns role/chart-1…5 at 90%, off role/fg at 7%, 16 cells, 144 high, 3px apart, 2px corners  ·  Low role/warning  ·  Over role/danger wash, base and drips  ·  Base role/well  ·  Value mono UI/sm/Medium  ·  Label Bezel/Eyebrow',
      file: file('allocation-meter'),
    },
    spec: () => allocationSpec(),
  },
  {
    doc: {
      key: 'component:segmented-ring',
      title: 'Segmented ring',
      usage: '<SegmentedRing intervals={[{ kind: "warmup", seconds: 60 }, { kind: "work", seconds: 40 }, …]} elapsed={elapsed} />',
      tokens: 'Band 15 at r 102: work role/chart-1, rest role/chart-5, warm-up role/chart-3; done at 78%, ahead at 16%  ·  Ruler role/fg at 18–60%  ·  Rule role/line  ·  Head role/fg ringed role/surface  ·  Round mono Heading/5xl  ·  Phase chip the tone at 16%',
      file: file('segmented-ring'),
    },
    spec: () => segmentedRingSpec(),
  },
  {
    doc: {
      key: 'component:share-ring',
      title: 'Share ring',
      usage: '<ShareRing segments={macros} max={2000} unit="kcal" />',
      tokens: 'Cells role/chart-1…5, off role/well  ·  Bowl rule role/line  ·  Value Heading/xl–4xl (Bezel: mono)  ·  Unit and labels Bezel/Eyebrow  ·  Legend rows 40, role/line hairlines, swatch 6 × 14  ·  28, 128, 192, 240',
      file: file('share-ring'),
    },
    spec: () => shareRingSpec(),
  },
  {
    doc: {
      key: 'component:lane-meter',
      title: 'Lane meter',
      usage: '<LaneMeter lanes={[{ label: "Queued", value: 128 }, { label: "Running", value: 24, max: 32, tone: "accent" }, …]} />',
      tokens: 'Cells in the lane’s tone (role/accent, success, danger, neutral role/fg-subtle), off role/fg at 8%, 10 high, 3px apart, 2px corners  ·  Label Bezel/Eyebrow  ·  Value mono UI/lg, capacity role/fg-muted',
      file: file('lane-meter'),
    },
    spec: () => laneMeterSpec(),
  },
  {
    doc: {
      key: 'component:progress-path',
      title: 'Progress path',
      usage: '<ProgressPath sections={course} current="directions" onSelect={open} />',
      tokens: 'Trail the section’s role/chart-1…5 walked, role/fg at 24% dotted ahead  ·  Rings 3.5 wide at r 27, off role/fg at 9–16%  ·  Discs 42: done the tone at 22%, current role/fg with role/canvas, locked role/fg at 6%  ·  Callout role/overlay, Shadow/md  ·  Eyebrow Bezel/Eyebrow  ·  Value mono',
      file: file('progress-path'),
    },
    spec: (deps) => progressPathSpec(deps),
  },
  {
    doc: {
      key: 'component:day-rail',
      title: 'Day rail',
      usage: '<DayRail stops={stops} legs={flights} stays={hotels} now={Date.now()} />',
      tokens: 'Day tabs: active role/selected, label Bezel/Eyebrow, value mono  ·  Arcs 1.5: past role/fg-muted, next role/fg dashed  ·  Rail role/line, nodes role/surface ringed role/fg  ·  Stays the tone at 20% with a 2px edge, radius/md  ·  Now role/accent with an 18% halo  ·  Shift chip role/band',
      file: file('day-rail'),
    },
    spec: () => dayRailSpec(),
  },
  {
    doc: {
      key: 'component:day-ring',
      title: 'Day ring',
      usage: '<DayRing jobs={[{ id: "backup", runs: […] }, …]} now={new Date()} />',
      tokens: 'Ruler role/line, ticks role/fg at 20–72%, elapsed role/fg at 6%  ·  Tracks role/well, runs role/chart-1…5  ·  Collision role/warning  ·  Hand role/fg  ·  Label Bezel/Eyebrow  ·  Countdown mono',
      file: file('day-ring'),
    },
    spec: () => dayRingSpec(),
  },
  {
    doc: {
      key: 'component:time-lanes',
      title: 'Time lanes',
      usage: '<TimeLanes lanes={team} shifts={rota} start={monday} now={Date.now()} />',
      tokens: 'Lanes role/chart-1…5: shifts the tone at 26% with a 2px edge, on call at 38% ringed in the tone, ended at 45% opacity, override dashed at 12%  ·  Hand-offs role/line-strong dashed  ·  Day rules role/line-subtle  ·  Now role/accent  ·  Axis Mono/xs  ·  Corner radius/sm',
      file: file('time-lanes'),
    },
    spec: () => timeLanesSpec(),
  },
  {
    doc: {
      key: 'component:rollout-ruler',
      title: 'Rollout ruler',
      usage: '<RolloutRuler defaultValue={50} label="Rollout" />  ·  <RolloutRuler value={10} size="sm" readOnly />',
      tokens: 'Track role/well, 28 (sm 12), 3px corners  ·  Ticks role/accent rolled out (gates 100%, ticks 60%), runway at 30–45%, idle role/fg at 20–35%  ·  Needle role/fg  ·  Knob role/action 12 × 36 with Shadow/xs  ·  Stages and axis Mono/xs  ·  Value mono Heading/xl',
      file: file('rollout-ruler'),
    },
    spec: () => rolloutSpec(),
  },
  {
    doc: {
      key: 'component:stage-rail',
      title: 'Stage rail',
      usage: '<StageRail stages={[{ id: "build", name: "Build", status: "passed", startedAt, endedAt }, …]} />',
      tokens: 'Track role/well (Classic role/fg at 4%), radius/xl, 2px in  ·  Picked key role/key with Bezel/key  ·  Cells: passed role/fg, running role/accent, failed role/danger, off role/well, 8 high  ·  Dots role/success, accent, danger  ·  Name Bezel/Eyebrow  ·  Duration mono',
      file: file('stage-rail'),
    },
    spec: () => stageRailSpec(),
  },
  {
    doc: {
      key: 'component:severity-timeline',
      title: 'Severity timeline',
      usage: '<SeverityTimeline events={incident} start={openedAt} end={resolvedAt} />',
      tokens: 'SEV1 role/danger, SEV2 role/warning, SEV3 role/accent; resolved role/success  ·  Chips the tone at 15%, Mono/xs  ·  Rail role/line  ·  Ribbon track role/well, bars in the tone, milestone rules role/line-strong dashed  ·  Times Mono/sm  ·  Title UI/lg',
      file: file('severity-timeline'),
    },
    spec: () => severitySpec(),
  },
  {
    doc: {
      key: 'component:slot-grid',
      title: 'Slot grid',
      usage: '<SlotGrid slots={week} value={picked} onValueChange={setPicked} />',
      tokens: 'Cells role/well, radius/lg, 56 high  ·  Pips 4 × 10: free role/fg, few role/warning, off role/well  ·  Full role/fg at 9% (hatched in code)  ·  Picked role/fg with role/canvas  ·  Yours role/success-subtle  ·  Day keys role/key in a role/well track  ·  Times and counts mono',
      file: file('slot-grid'),
    },
    spec: (deps) => slotGridSpec(deps),
  },
  {
    doc: {
      key: 'component:dial',
      title: 'Dial',
      usage: '<Dial label="Target" min={10} max={30} step={0.5} defaultValue={21.5} current={19.8} unit="°C" />',
      tokens: 'Band role/fg at 10%, 12 wide at r 90, round caps  ·  Lit stretch and ticks role/accent  ·  Ruler role/fg at 20–46%  ·  Knob role/fg ringed role/surface  ·  Now marker role/fg  ·  Value mono Heading/5xl, unit role/fg-muted  ·  Label Bezel/Eyebrow',
      file: file('dial'),
    },
    spec: () => dialSpec(),
  },
  {
    doc: {
      key: 'component:hours-dial',
      title: 'Hours dial',
      usage: '<HoursDial label="Sleep" defaultValue={{ start: 22 * 60 + 30, end: 6 * 60 + 45 }} />',
      tokens: 'Band role/accent at 18%, 18 wide  ·  Lit ticks role/accent, ruler role/fg at 18–52%  ·  Handles: start hollow, end solid, role/fg on role/surface  ·  Span mono Heading/4xl, units role/fg-muted  ·  Times Mono/sm  ·  Label Bezel/Eyebrow',
      file: file('hours-dial'),
    },
    spec: () => hoursDialSpec(),
  },
  {
    doc: {
      key: 'component:activity-rings',
      title: 'Activity rings',
      usage: '<ActivityRings rings={[{ label: "Move", value: 420, max: 500 }, …]} />',
      tokens: 'Rings role/chart-1…4, round caps over the tone at 20%, 17 wide 4 apart (3 rings)  ·  Second-lap head shadow role/shadow  ·  Bowl figure Heading/2xl–5xl, caption Bezel/Eyebrow  ·  Legend rows 40 on role/line hairlines, share mono  ·  96, 160, 224, 288',
      file: file('activity-rings'),
    },
    spec: () => activityRingsSpec(),
  },
  {
    doc: {
      key: 'component:world-clock',
      title: 'World clock',
      usage: '<WorldClock zones={[{ label: "San Francisco", timeZone: "America/Los_Angeles" }, …]} />',
      tokens: 'Hours: working role/accent-subtle, awake role/band, night role/well, Mono/xs  ·  Overlap ring role/success  ·  Cursor role/fg  ·  Daylight badge role/warning-subtle, night role/well  ·  Rows role/line-subtle  ·  Times Mono/base',
      file: file('world-clock'),
    },
    spec: (deps) => worldClockSpec(deps),
  },
  {
    doc: {
      key: 'component:track-timeline',
      title: 'Track timeline',
      usage: '<TrackTimeline tracks={tracks} clips={clips} duration={42} playhead={21} onClipsChange={setClips} />',
      tokens: 'Frame role/surface, role/line, radius/xl  ·  Tracks role/chart-1…5: clips the tone at 18% edged at 45%, wave in the tone, radius/md  ·  Muted role/band  ·  Selected ring 2px in the tone  ·  Mute role/warning-subtle, solo role/accent-subtle  ·  Meter role/well, peaks role/warning  ·  Playhead role/accent  ·  Times Mono/xs',
      file: file('track-timeline'),
    },
    spec: (deps) => trackTimelineSpec(deps),
  },
  {
    doc: {
      key: 'component:waveform-scrubber',
      title: 'Waveform scrubber',
      usage: '<WaveformScrubber samples={loudness} duration={2880} chapters={chapters} value={t} onValueChange={seek} />',
      tokens: 'Bars 3 wide on a 5px pitch: played role/fg, ahead role/line-strong  ·  Clip role/accent over role/accent-subtle, handles role/accent  ·  Playhead role/accent ringed role/surface  ·  Chapter ticks role/fg-subtle, titles Bezel/Eyebrow  ·  Ruler role/fg-subtle, times mono',
      file: file('waveform-scrubber'),
    },
    spec: () => waveformSpec(),
  },
  {
    doc: {
      key: 'component:audio-recorder',
      title: 'Audio recorder',
      usage: '<AudioRecorder maxDuration={120} onRecordingComplete={upload} />',
      tokens: 'Card role/surface, role/line, radius/xl, space/3 in  ·  Bars 3 wide: live role/fg, idle role/line-strong, played role/fg  ·  Record a default icon Button; stop an outline one with a role/danger square, limit ring role/accent on role/line  ·  Dot role/danger  ·  Timer mono  ·  Save a default Button',
      file: 'packages/ui/src/components/ui/audio-recorder/',
    },
    spec: (deps) => audioRecorderSpec(deps),
  },
  {
    doc: {
      key: 'component:voice-orb',
      title: 'Voice orb',
      usage: '<VoiceOrb state="listening" audio={micStream} size="lg" />',
      tokens: 'Sphere role/accent at 62% of the box, shade role/chart-2, light role/on-accent  ·  Halo and rings role/accent at 10–35%  ·  Muted role/fg-subtle  ·  64, 112, 176, 256',
      file: 'packages/ui/src/components/ui/voice-orb/',
    },
    spec: () => voiceOrbSpec(),
  },
  {
    doc: {
      key: 'component:image-compare',
      title: 'Image compare',
      usage: '<ImageCompare before={{ src: "/before.jpg", alt: "…" }} after={{ src: "/after.jpg", alt: "…" }} beforeLabel="Before" afterLabel="After" />',
      tokens: 'Frame role/well, radius/xl  ·  Divider role/key, 2px  ·  Handle role/key edged role/line, Shadow/md, control/default round  ·  Tags role/chrome-float, UI/sm/Medium, Shadow/xs  ·  Photos: token placeholders',
      file: file('image-compare'),
    },
    spec: (deps) => imageCompareSpec(deps),
  },
  {
    doc: {
      key: 'component:image-accordion',
      title: 'Image accordion',
      usage: '<ImageAccordion items={[{ id: "harbour", media: { src, alt }, title: "Harbour at dawn" }, …]} />',
      tokens: 'Panels role/well, radius/lg, 6px apart, open about 60%  ·  Caption role/surface edged role/line, radius/md, Shadow/xs, title UI/sm/Medium, line UI/xs muted  ·  Photos: token placeholders',
      file: file('image-accordion'),
    },
    spec: (deps) => imageAccordionSpec(deps),
  },
  {
    doc: {
      key: 'component:annotated-image',
      title: 'Annotated image',
      usage: '<AnnotatedImage src="/hub.jpg" alt="The hub" annotations={[{ id: "power", x: 22, y: 30, title: "Power button" }, …]} />',
      tokens: 'Media role/band, radius/xl  ·  Points 24 role/fg with role/canvas figures, ringed role/surface, Shadow/sm; lit role/accent  ·  Leaders role/fg-subtle, lit role/accent  ·  Label numbers role/band  ·  Title UI/base/Medium, detail UI/sm muted',
      file: file('annotated-image'),
    },
    spec: (deps) => annotatedImageSpec(deps),
  },
  {
    doc: {
      key: 'component:live-cursors',
      title: 'Live cursors',
      usage: '<LiveCursors users={others}><Canvas /></LiveCursors>  ·  <LivePresence users={everyone} />',
      tokens: 'Cursors role/chart-1…5 edged role/canvas  ·  Name tags the colour with role/canvas text, UI/xs/Medium, Shadow/sm  ·  Chat bubbles radius/lg, Shadow/md  ·  Selection the colour at 14%  ·  Presence avatars ringed in the colour',
      file: file('live-cursors'),
    },
    spec: () => liveCursorsSpec(),
  },
  {
    doc: {
      key: 'component:whiteboard',
      title: 'Whiteboard',
      usage: '<Whiteboard defaultValue={board} onChange={save} cursors={others} />',
      tokens: 'Board role/canvas, dot grid role/line-strong  ·  Notes role/warning-subtle with Shadow/sm  ·  Strokes role/fg and the chart tones  ·  Selection and handles role/accent  ·  Toolbar bezel/popover (Classic role/overlay), keys control/sm, picked role/key with Bezel/key  ·  Pins role/accent',
      file: 'packages/ui/src/components/ui/whiteboard/',
    },
    spec: (deps) => whiteboardSpec(deps),
  },
]

