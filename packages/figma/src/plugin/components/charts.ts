import { add, bezel, box, context, rect, solid, style, text, vector, type Ink } from '../draw'
import { badge, button, controlHeight, controlSquare, eyebrow, fieldLook as fieldLookOf, figure, icon, initials, instance, padInline, pick, surfaceLook, value, type Deps, type Entry, type Source } from './parts'
import { iconInstance } from './button'
import { ref, type SetSpec, type VariantSpec } from './set'

/* Catalog batch: charts. Data display and charts, each from its file in
 * packages/ui/src/components/ui, drawn as static examples (a fixed dataset,
 * at rest) the way meters.ts draws the meters. Motion lives in code. In
 * Bezel labels are the mono capital eyebrow and figures are mono. */

export const SOURCES: Source[] = [
  {
    file: 'packages/ui/src/components/ui/dot-map.tsx',
    classes: [
      'const REACH = [1.6, 5.5] as const',
      'const level = (1 - distance / p.reach) ** 1.25 * (0.35 + 0.65 * Math.sqrt(p.share))',
      'className="text-line-strong transition-[clip-path]',
      "'absolute top-0 left-0 flex items-baseline gap-1.5 rounded-[min(var(--radius-sm),6px)] bg-fg px-1.5 py-0.5 font-mono text-ui-xs whitespace-nowrap text-canvas shadow-sm',",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/sparkline.tsx',
    classes: [
      "className={cn('relative h-8 w-full min-w-12', className)}",
      'stopOpacity={0.22}',
      'strokeWidth={1.5}',
      'className="absolute -end-[3px] -top-[3px] size-1.5 rounded-full bg-(--spark) ring-2 ring-surface"',
    ],
  },
  {
    file: 'packages/ui/src/components/ui/stat-pill.tsx',
    classes: [
      'className="grid aspect-square h-full shrink-0 place-items-center rounded-xl bg-band text-fg-muted [&_svg]:size-4"',
      'className="inline-flex items-baseline gap-1 text-ui-lg font-medium text-fg tabular-nums"',
      "'ms-2.5 inline-flex shrink-0 items-center gap-1 font-mono text-ui-sm tabular-nums'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/capsule.tsx',
    classes: ["'inline-flex max-w-full shrink-0 items-center gap-1 rounded-2xl border border-line bg-chrome-float p-1 text-fg shadow-xs'"],
  },
  {
    file: 'packages/ui/src/components/ui/stat-card.tsx',
    classes: [
      "const VALUE_SIZE = { sm: 'text-xl', default: 'text-2xl', lg: 'text-4xl' }",
      "className={cn('relative mt-3 flex h-9 w-full items-end justify-between gap-[2px] border-b border-line pb-px', className)}",
      'className="relative h-1.5 rtl:-scale-x-100"',
      "<ul data-slot=\"stat-breakdown-legend\" className=\"flex flex-wrap gap-x-3.5 gap-y-1 text-ui-sm\">",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/hatched-bar.tsx',
    classes: [
      "'[background-color:color-mix(in_oklab,var(--hatch-color)_10%,transparent)]'",
      "'[background-image:repeating-linear-gradient(-45deg,color-mix(in_oklab,var(--hatch-color)_72%,transparent)_0_1.5px,transparent_1.5px_5px)]'",
      "vertical ? 'h-24 w-3' : 'h-2 w-full min-w-12'",
      "fill === 'hatched' ? HATCH : tone === 'neutral' ? 'bg-well' : 'bg-(--hatch-color)'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/diff-bar.tsx',
    classes: [
      "const OFF = 'bg-[color-mix(in_oklab,var(--color-canvas)_calc(100%*var(--yj-dark)),color-mix(in_oklab,var(--color-fg)_9%,transparent))]'",
      'className="h-5 w-0.5 rounded-full bg-fg-subtle"',
      "'w-(--diff-bar-value) truncate font-mono text-ui tabular-nums'",
      "className={cn('flex h-3 min-w-0 gap-0.5', which === 'a' && 'flex-row-reverse')}",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/avatar-stack.tsx',
    classes: ["const overlap = { sm: '-space-x-1', default: '-space-x-1.5', lg: '-space-x-2' } as const", "'group/count rounded-full bg-canvas focus-ring'"],
  },
  {
    file: 'packages/ui/src/components/ui/code-block/code-block.tsx',
    classes: [
      "'min-w-0 overflow-hidden rounded-lg border border-line bg-band'",
      'className="flex h-8 items-center justify-between gap-2 border-b border-line ps-3 pe-1"',
      "keyword: 'text-accent-text'",
      "string: 'text-success-text'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/distribution-strip.tsx',
    classes: [
      'const DOT = 4',
      'const PITCH = 5',
      'className="absolute inset-y-0 w-0 -translate-x-px border-s border-dashed border-warning rtl:translate-x-px"',
      "t.major ? 'h-2 bg-fg-subtle' : 'h-1 bg-line-strong'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/chart.tsx',
    classes: [
      "'flex aspect-video w-full min-w-0 justify-center text-ui-xs'",
      "'grid min-w-36 items-start gap-1.5 rounded-lg border border-line bg-overlay px-2.5 py-2 text-ui-xs text-fg shadow-md'",
      "'flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-ui-xs text-fg-muted'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/timeline.tsx',
    classes: [
      "neutral: 'bg-surface text-fg-muted border-line'",
      "success: 'bg-success-subtle text-success-text border-success-line'",
      'className="absolute start-[13.5px] top-8 -bottom-0.5 w-px bg-line"',
    ],
  },
  {
    file: 'packages/ui/src/components/ui/progress-list.tsx',
    classes: [
      "const WELL = 'bg-[color-mix(in_oklab,var(--color-canvas)_calc(45%*var(--yj-dark)),color-mix(in_oklab,var(--color-fg)_3%,transparent))]'",
      "failed: 'bg-danger-subtle text-danger-text'",
      'className="flex h-2 gap-0.5"',
    ],
  },
  {
    file: 'packages/ui/src/components/ui/breakdown-list.tsx',
    classes: [
      "? 'rounded-lg bg-band p-2 pe-3 data-[state=active]:bg-selected'",
      'className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface"',
      'className="w-12 shrink-0 text-end font-mono text-ui-sm text-fg-muted tabular-nums"',
    ],
  },
  {
    file: 'packages/ui/src/components/ui/contribution-list.tsx',
    classes: [
      'className="relative h-1.5 w-24 shrink-0 rounded-full bg-band @max-md:hidden"',
      'className="mt-1 flex min-w-0 items-center gap-3 rounded-lg bg-accent-subtle px-3 py-3 text-accent-text ring-1 ring-accent-line"',
      "good ? 'bg-success' : 'bg-danger'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/unit-chart.tsx',
    classes: ['const PITCH = 10', 'const RADIUS = 3.3', "on ? (inRange(c) ? 'fill-(--unit-chart-tone)' : 'fill-(--color-chart-quiet)') : 'fill-(--unit-chart-off)'"],
  },
  {
    file: 'packages/ui/src/components/ui/waffle-chart.tsx',
    classes: ['const PITCH = 10', 'const SQUARE = 8.4', 'rx={1.4}'],
  },
  {
    file: 'packages/ui/src/components/ui/radar-chart.tsx',
    classes: ["className={i === ringCount - 1 ? 'stroke-line' : 'stroke-line-subtle'}", 'fillOpacity={highlighted === s.id ? 0.2 : 0.1}', "'inline-flex h-control-sm items-center gap-2 rounded-control-sm px-2.5 text-ui-sm outline-none focus-ring'"],
  },
  {
    file: 'packages/ui/src/components/ui/radial-graph.tsx',
    classes: ['const OUTER = 134', 'const DOT = [DISC, 6, 4.75, 4]', 'strokeDasharray="2 4"', "strokeDasharray={node.ring === 'dashed' ? '2 2' : undefined}"],
  },
  {
    file: 'packages/ui/src/components/ui/density-lanes.tsx',
    classes: ['const PITCH = 10', 'const RADIUS = 3.1', "lit ? 'fill-(--density-lanes-tone)' : 'fill-(--color-chart-quiet)'"],
  },
  {
    file: 'packages/ui/src/components/ui/coverage-matrix.tsx',
    classes: ['const FLOOR = 0.18', "isSelected ? 'border-danger-line' : 'border-line-strong'", "<Hatch tone={isSelected ? 'danger' : 'neutral'} className=\"size-full rounded-none\" />"],
  },
  {
    file: 'packages/ui/src/components/ui/score-ring.tsx',
    classes: ["const TICK: Record<'rest' | 'lit' | 'head', [number, number]> = { rest: [40.5, 46], lit: [39, 47], head: [36.5, 49] }", "on ? 'stroke-(--score-ring-tone)' : 'stroke-line-strong'"],
  },
  {
    file: 'packages/ui/src/components/ui/milestone-ruler.tsx',
    classes: ['const STACK_GAP = 10', "const stem = pin.major ? 'h-14' : 'h-9'", "tick.major ? 'h-3.5' : 'h-2'", "past ? 'bg-fg-subtle' : 'bg-line-strong'"],
  },
  {
    file: 'packages/ui/src/components/ui/calendar-heatmap.tsx',
    classes: ['const HEAT = [0, 30, 52, 76, 100]', "'block size-full rounded-full transition-[background-color,box-shadow,scale] yj-duration-fast ease-standard'", 'className="size-2.5 rounded-full shadow-[0_0_0_1.5px_var(--color-accent)]"'],
  },
  {
    file: 'packages/ui/src/components/ui/forecast-band.tsx',
    classes: ['className="h-0.5 w-3.5 rounded-full bg-fg"', 'strokeDasharray="4 3"', 'className="w-3.5 border-t border-dashed border-line-strong"'],
  },
  {
    file: 'packages/ui/src/components/ui/level-matrix.tsx',
    classes: ["state === 'loss' && 'bg-transparent shadow-[inset_0_0_0_1.5px_var(--color-danger)]'", "size === 'xs' ? 'h-2 w-1.5' : 'h-2.5 w-2.5'", "state === 'gain' && 'bg-success'"],
  },
  {
    file: 'packages/ui/src/components/ui/history-strip.tsx',
    classes: ["sm ? 'h-3.5 gap-px' : 'h-10 gap-0.5'", 'className="size-1 shrink-0 rounded-full bg-(--uptime-color)"', 'className="h-px min-w-4 flex-1 bg-line"'],
  },
  {
    file: 'packages/ui/src/components/ui/route-map.tsx',
    classes: ["done: 'stroke-line-strong'", "delayed: 'stroke-danger'", "proposed: 'stroke-accent'", 'strokeDasharray="0.01 6"'],
  },
  {
    file: 'packages/ui/src/components/ui/seat-map.tsx',
    classes: [
      "'cursor-pointer bg-[color-mix(in_oklab,var(--tier)_26%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--tier)_55%,transparent)] hover:scale-110 hover:bg-[color-mix(in_oklab,var(--tier)_44%,transparent)]'",
      "'group/seat focus-ring relative grid size-(--seat) shrink-0 place-items-center rounded-t-[42%] rounded-b-[22%] outline-none scroll-mx-10'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/proposal-card.tsx',
    classes: ["'flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 text-fg shadow-xs'", "'border-dashed border-accent-line bg-accent-subtle'", "muted ? 'text-fg-muted' : 'text-fg'"],
  },
  {
    file: 'packages/ui/src/components/ui/data-table/data-table-toolbar.tsx',
    classes: ["className={cn('flex flex-wrap items-center gap-2', className)}"],
  },
  {
    file: 'packages/ui/src/components/ui/data-table/data-table-pagination.tsx',
    classes: ["'flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-3 py-2 text-ui-sm text-fg-muted'"],
  },
  {
    file: 'packages/ui/src/components/ui/hierarchy-chart/hierarchy-chart.tsx',
    classes: ['const NODE = { width: 224, height: 64 }', "lit ? 'stroke-accent' : 'stroke-line-strong'", "state.selected ? 'border-accent ring-1 ring-accent' : state.onPath ? 'border-accent-line' : 'border-line'"],
  },
  {
    file: 'packages/ui/src/components/ui/flow-graph.tsx',
    classes: [
      "horizontal: { h: 56, min: 152, max: 264, main: 48, cross: 14 },",
      "node.status === 'skipped' ? 'border-dashed border-line-strong bg-transparent opacity-75 shadow-none' : 'border-line'",
      "node.status === 'queued' && 'border-[1.5px] border-fg-subtle'",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/cell-bar.tsx',
    classes: ["'relative min-w-0.5 rounded-[2px] outline-none focus-ring'", 'className="relative h-3.5"', 'border-s border-dashed border-fg-muted'],
  },
  {
    file: 'packages/ui/src/components/ui/lollipop-chart.tsx',
    classes: ['absolute start-1/2 w-0 border-s border-dashed border-fg-subtle', "isPicked ? 'size-3 shadow-[0_0_0_3px_var(--color-surface),0_0_0_4.5px_var(--lollipop-ink)]' : 'size-2'"],
  },
  {
    file: 'packages/ui/src/components/ui/flow-lanes.tsx',
    classes: ['const PARTICLES = 36', 'const SOURCE_R = 4.5', 'const END_R = 3.5', 'strokeWidth={1 + share * 2}', 'className="absolute top-0 left-0 size-1.5 rounded-full"'],
  },
  {
    file: 'packages/ui/src/components/ui/diff-viewer/diff-viewer.tsx',
    classes: [
      "const tint = tone === 'add' ? 'bg-success-subtle' : tone === 'del' ? 'bg-danger-subtle' : undefined",
      "className={cn('min-w-0 overflow-clip rounded-lg border border-line bg-surface text-fg', className)}",
      "className={cn('size-2 rounded-[1px]', tone === 'add' ? 'bg-success' : tone === 'del' ? 'bg-danger' : 'bg-line')}",
    ],
  },
  {
    file: 'packages/ui/src/components/ui/chat/chat-message.tsx',
    classes: ["'max-w-[min(85%,var(--spacing)*144)] min-w-0 rounded-2xl bg-hover px-3.5 py-2 text-ui-lg leading-6 whitespace-pre-wrap text-fg [overflow-wrap:anywhere]'", '<AvatarFallback className="bg-fg text-canvas">'],
  },
  {
    file: 'packages/ui/src/components/ui/filter-builder/filter-builder-token.tsx',
    classes: ["'relative inline-flex h-control-sm min-w-0 shrink-0 items-center gap-1 bg-band px-2.5 text-ui whitespace-nowrap select-none'", "'rounded-xs first:rounded-s-control-sm last:rounded-e-control-sm'"],
  },
  {
    file: 'packages/ui/src/components/ui/filter-builder/filter-builder-group.tsx',
    classes: ["const connectorClass = 'flex w-16 shrink-0'", "className={cn('flex min-w-0 flex-col gap-2', nested && 'border-s border-line ps-3')}"],
  },
  {
    file: 'packages/ui/src/components/ui/import-mapper/import-mapper-columns.tsx',
    classes: ["'flex shrink-0 items-center gap-3 bg-well px-3 py-2 outline-none focus-visible:outline-2 focus-visible:outline-focus'", '<Badge variant="warning" title={copy.importMapperCheckWhy}>'],
  },
]

/* ── Shared marks ──────────────────────────────────────────────────────── */

/** Swaps an instance's icon through its instance-swap property. */
function swapIcon(instance: InstanceNode, component: ComponentNode, property = 'Icon') {
  const key = Object.keys(instance.componentProperties).find((k) => k.split('#')[0] === property)
  if (key) instance.setProperties({ [key]: component.id })
}

const r2 = (n: number) => Math.round(n * 100) / 100

/** The chart palette, in order. */
const CHART = ['role/chart-1', 'role/chart-2', 'role/chart-3', 'role/chart-4', 'role/chart-5']

/** A positioned rectangle inside an absolute frame. */
function place<T extends SceneNode>(parent: FrameNode | ComponentNode, node: T, x: number, y: number): T {
  add(parent, node)
  node.x = r2(x)
  node.y = r2(y)
  return node
}

/** A fixed canvas for marks placed by coordinate. */
const plot = (name: string, w: number, h: number, p: Partial<Parameters<typeof box>[0]> = {}) => box({ name, dir: 'none', w, h, ...p })

/** A deterministic sequence in [0, 1), so the static examples are the same on every build. */
function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

/** Fritsch–Carlson monotone cubic through the points (sparkline.tsx's curve), as path data. */
function monotone(points: [number, number][]) {
  const n = points.length
  const dx: number[] = []
  const slope: number[] = []
  for (let i = 0; i < n - 1; i++) {
    dx.push(points[i + 1]![0] - points[i]![0])
    slope.push((points[i + 1]![1] - points[i]![1]) / (dx[i] || 1))
  }
  const t: number[] = [slope[0]!]
  for (let i = 1; i < n - 1; i++) {
    const a = slope[i - 1]!
    const b = slope[i]!
    t.push(a * b <= 0 ? 0 : (3 * (dx[i - 1]! + dx[i]!)) / ((2 * dx[i]! + dx[i - 1]!) / a + (dx[i]! + 2 * dx[i - 1]!) / b))
  }
  t.push(slope[n - 2]!)
  let d = `M${r2(points[0]![0])},${r2(points[0]![1])}`
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i]!
    const [x1, y1] = points[i + 1]!
    const h = dx[i]! / 3
    d += ` C${r2(x0 + h)},${r2(y0 + t[i]! * h)} ${r2(x1 - h)},${r2(y1 - t[i + 1]! * h)} ${r2(x1)},${r2(y1)}`
  }
  return d
}

/** Points of a series scaled into a box, with headroom. */
function scaled(data: number[], w: number, h: number, pad = 3, domain?: [number, number]): [number, number][] {
  const [lo, hi] = domain ?? [Math.min(...data), Math.max(...data)]
  const span = hi - lo || 1
  const step = data.length > 1 ? w / (data.length - 1) : 0
  return data.map((v, i) => [i * step, pad + (1 - (v - lo) / span) * (h - pad * 2)])
}

/**
 * The hatch (hatched-bar.tsx's HATCH): "/" stripes of the ink at 72%,
 * 1.5px every 5px, over a 10% wash of it, clipped to its box.
 */
async function hatch(name: string, w: number, h: number, ink: string, radius: string | number = 0) {
  const f = await box({ name, dir: 'none', w, h, fill: [ink, 0.1], radius, clip: true })
  const lines: string[] = []
  for (let x = -h; x < w + h; x += 5) lines.push(`M${r2(x)},${r2(h + 1)} L${r2(x + h + 2)},-1`)
  vector(f, lines.join(' '), { stroke: solid([ink, 0.72]), strokeWidth: 1.5 }, 'Stripes')
  return f
}

/** A dot: a small disc in an ink. */
const disc = (px: number, ink: Ink, name = 'Dot') => rect(name, px, px, ink, 'radius/full')

/** A small triangle pointing up (or down), as the deltas draw it. */
function triangle(parent: FrameNode, size: number, ink: Ink, down = false) {
  const d = down ? `M0,0 L${size},0 L${size / 2},${size * 0.85} Z` : `M${size / 2},0 L${size},${size * 0.85} L0,${size * 0.85} Z`
  vector(parent, d, { fill: solid(ink) }, 'Triangle')
}

/* ── Sparkline ─────────────────────────────────────────────────────────── */

const SPARK = [12, 14, 13, 17, 16, 19, 18, 22, 21, 25, 24, 28]
const SPARK_TONES: Record<string, Ink> = { 'chart-1': 'role/chart-1', success: 'role/success', danger: 'role/danger' }

async function drawSparkline(c: ComponentNode, tone: string, area: boolean, w = 120, h = 32) {
  await style(c, { dir: 'none', w, h })
  const ink = SPARK_TONES[tone]!
  const points = scaled(tone === 'danger' ? [...SPARK].reverse() : SPARK, w, h)
  const line = monotone(points)
  // The wash is a 22% → 0 gradient in code; Figma can't bind a gradient stop to a variable, so it is a flat 10% wash.
  if (area) vector(c, `${line} L${w},${h} L0,${h} Z`, { fill: solid([typeof ink === 'string' ? ink : ink[0], 0.1]) }, 'Area')
  vector(c, line, { stroke: solid(ink), strokeWidth: 1.5 }, 'Line')
  const last = points[points.length - 1]!
  const dot = disc(6, ink)
  dot.strokes = [solid('role/surface')]
  dot.strokeWeight = 2
  dot.strokeAlign = 'OUTSIDE'
  place(c, dot, last[0] - 3, last[1] - 3)
}

function sparklineSpec(): SetSpec {
  const variants: VariantSpec[] = []
  for (const area of [true, false])
    for (const tone of Object.keys(SPARK_TONES)) variants.push({ props: { Tone: tone, Area: String(area) }, build: (c) => drawSparkline(c, tone, area) })
  return {
    key: 'component:sparkline',
    name: 'Sparkline',
    description:
      'Sparkline in packages/ui: a word-sized trend for a KPI or a table cell, a monotone curve (it never overshoots a point) with a wash under it and a dot on the latest value, ringed in the surface. It stretches to its box (h-8 by default): resize the instance. In code it draws in left to right and morphs to new data.',
    variants,
    properties: [],
    columns: 'Tone',
    gap: [32, 16],
  }
}

/* ── Stat pill (on a capsule) ──────────────────────────────────────────── */

/** The capsule (capsule.tsx): floating chrome on a hairline, p-1; Bezel's is bezel/capsule on the pill radius with Shadow/sm. */
async function capsule(c: FrameNode | ComponentNode) {
  const bz = bezel()
  await style(c, {
    dir: 'row',
    align: 'center',
    gap: 'space/1',
    pad: 4,
    fill: bz ? 'bezel/capsule' : 'role/chrome-float',
    stroke: bz ? ['role/fg', 0.07] : 'role/line',
    effect: bz ? 'Shadow/sm' : 'Shadow/xs',
    radius: bz ? 'bezel/pill' : 'radius/2xl',
  })
  c.strokesIncludedInLayout = true
}

async function drawStatPill(c: ComponentNode, content: 'delta' | 'trend' | 'both', deps: Deps) {
  await capsule(c)
  padInline(c, 'space/1', 'space/3')
  const disc_ = await box({ name: 'Icon', dir: 'row', align: 'center', justify: 'center', w: 32, h: 32, radius: bezel() ? 'bezel/pill' : 'radius/xl', fill: bezel() ? 'role/well' : 'role/band' })
  add(disc_, icon(deps.icons, ['cpu', 'activity', 'gauge'], 16, 'role/fg-muted'))
  const label = await box({ name: 'Label', dir: 'row', pad: [0, 8] }, ref(await eyebrow('CPU'), 'Label'))
  const v = await box({ name: 'Value', dir: 'row', align: 'baseline', gap: 'space/1' }, ref(await value('42', 'UI/lg/Medium'), 'Value'), await text('%', 'UI/sm/Regular', 'role/fg-muted', { name: 'Unit' }))
  add(c, disc_, label, v)
  if (content !== 'delta') {
    const spark = await plot('Trend', 40, 16)
    const pts = scaled([30, 34, 31, 38, 36, 42], 40, 16, 2)
    vector(spark, monotone(pts), { stroke: solid('role/chart-1'), strokeWidth: 1.5 }, 'Line')
    place(spark, disc(4, 'role/chart-1'), 38, pts[pts.length - 1]![1] - 2)
    add(c, await box({ name: 'Trend gap', dir: 'row', pad: [0, 0, 0, 12] }, spark))
  }
  if (content !== 'trend') {
    const tri = await plot('Arrow', 8, 8)
    triangle(tri, 8, 'role/success')
    add(c, await box({ name: 'Delta', dir: 'row', align: 'center', gap: 'space/1', pad: [0, 0, 0, 10] }, tri, await text('4.2', 'Mono/sm', 'role/success', { name: 'Delta' })))
  }
}

function statPillSpec(deps: Deps): SetSpec {
  return {
    key: 'component:stat-pill',
    name: 'Stat pill',
    description:
      'StatPill in packages/ui: one live figure on a capsule, sized for a toolbar or over a canvas. An icon in a recessed disc, the name as a mono eyebrow, the value in mono with its unit small and muted, then how it moves: a delta (tinted good or bad by `better`), a word-sized trend, or both. In code the value counts to each new reading.',
    variants: (['delta', 'trend', 'both'] as const).map((content) => ({ props: { Content: content }, build: (c) => drawStatPill(c, content, deps) })),
    properties: [
      { name: 'Label', type: 'TEXT', default: 'CPU', field: 'characters' },
      { name: 'Value', type: 'TEXT', default: '42', field: 'characters' },
    ],
    columns: 'Content',
    gap: [32, 16],
  }
}

/* ── Stat card ─────────────────────────────────────────────────────────── */

const BARS = [42, 48, 39, 55, 51, 60, 58, 64, 61, 70, 67, 76]
const TICKS = [40, 44, 41, 49, 50, 52, 55, 57, 60, 62, 64, 68]

async function drawStatCard(c: ComponentNode, chart: 'bars' | 'meter' | 'breakdown') {
  await style(c, { dir: 'col', gap: 'space/2', pad: 16, w: 280, ...surfaceLook() })
  const head = await box({ name: 'Head', dir: 'row', align: 'center', justify: 'between', w: 'fill', h: 20 }, ref(await eyebrow(chart === 'breakdown' ? 'Storage' : 'Revenue'), 'Label'))
  const big = await box(
    { name: 'Value', dir: 'row', align: 'baseline', gap: 'space/0-5' },
    ref(await value(chart === 'breakdown' ? '1.8' : '48.2', 'Heading/2xl'), 'Value'),
    await text(chart === 'breakdown' ? 'TB' : 'k', 'UI/sm/Regular', 'role/fg-muted', { name: 'Unit' }),
  )
  const arrow = await plot('Arrow', 8, 8)
  triangle(arrow, 8, 'role/success-text')
  const delta = await box(
    { name: 'Delta', dir: 'row', align: 'center', gap: 'space/2' },
    await box({ name: 'Change', dir: 'row', align: 'center', gap: 'space/1' }, arrow, figure(await text('12.4%', 'UI/sm/Medium', 'role/success-text', { name: 'Change' }))),
    await text('vs last month', 'UI/sm/Regular', 'role/fg-muted', { name: 'Comparison' }),
  )
  add(c, head, await box({ name: 'Body', dir: 'col', gap: 'space/1', w: 'fill' }, big, delta))
  const W = 248
  if (chart === 'bars') {
    // Last period's values as ticks on this period's bars; the latest bar lit in the tone.
    const H = 36
    const bars = await plot('Bars', W, H + 1, { stroke: 'role/line', sides: { bottom: 1 } })
    const max = Math.max(...BARS)
    const bw = (W - 2 * (BARS.length - 1)) / BARS.length
    BARS.forEach((v, i) => {
      const h = (v / max) * (H - 1)
      const bar = rect(i === BARS.length - 1 ? 'Bar (latest)' : 'Bar', bw, h, null)
      bar.fills = i === BARS.length - 1 ? [solid('role/accent')] : [solid('role/chart-quiet'), solid(['role/accent', 0.3])]
      place(bars, bar, i * (bw + 2), H - h)
      place(bars, rect('Tick', bw, 1.5, 'role/fg-muted'), i * (bw + 2), H - (TICKS[i]! / max) * (H - 1))
    })
    add(c, await box({ name: 'Chart', dir: 'col', pad: [12, 0, 0, 0] }, bars))
  } else if (chart === 'meter') {
    const track = await plot('Meter', W, 6, { fill: 'role/well', radius: 'radius/xs' })
    place(track, rect('Fill', W * 0.62, 6, 'role/warning', 'radius/xs'), 0, 0)
    place(track, rect('Pace', 1.5, 14, 'role/fg', 'radius/full'), W * 0.7, -4)
    track.clipsContent = false
    const row = await box(
      { name: 'Reading', dir: 'row', align: 'baseline', justify: 'between', w: 'fill' },
      await box({ name: 'Share', dir: 'row', gap: 'space/1' }, figure(await text('62%', 'UI/sm/Medium', 'role/fg', { name: 'Share' })), await text('of target', 'UI/sm/Regular', 'role/fg-muted')),
      await text('$60k', 'UI/sm/Regular', 'role/fg-muted', { name: 'Detail' }),
    )
    add(c, await box({ name: 'Chart', dir: 'col', gap: 'space/2', pad: [16, 0, 0, 0], w: 'fill' }, track, row))
  } else {
    const parts: [string, number, Ink][] = [
      ['Video', 0.46, 'role/chart-1'],
      ['Photos', 0.28, 'role/chart-2'],
      ['Audio', 0.14, 'role/chart-3'],
    ]
    const bar = await plot('Bar', W, 6, { fill: 'role/band', radius: 2, clip: true })
    let x = 0
    for (const [name, share, ink] of parts) {
      place(bar, rect(name, W * share - 2, 6, ink), x, 0)
      x += W * share
    }
    const legend = await box({ name: 'Legend', dir: 'row', gap: 14, wrap: 4, w: 'fill' })
    for (const [name, share, ink] of parts)
      add(
        legend,
        await box(
          { name, dir: 'row', align: 'center', gap: 'space/1-5' },
          rect('Swatch', 8, 8, ink, 2),
          await text(name, 'UI/sm/Regular', 'role/fg-muted'),
          figure(await text(`${Math.round(share * 100)}%`, 'UI/sm/Medium', 'role/fg', { name: 'Share' })),
        ),
      )
    add(c, await box({ name: 'Chart', dir: 'col', gap: 'space/2-5', pad: [12, 0, 0, 0], w: 'fill' }, bar, legend))
  }
}

function statCardSpec(): SetSpec {
  return {
    key: 'component:stat-card',
    name: 'Stat card',
    description:
      'StatCard in packages/ui: an analytics tile on a small Card, built like an instrument readout. A label, one big figure with its unit small and muted, how it moved (a triangle and the change in the good or bad ink, then what it’s compared against), and at most one picture: recent bars with last period as ticks, a meter to a target with a pace notch, or a breakdown of a total. In code the figure rolls like an odometer.',
    variants: (['bars', 'meter', 'breakdown'] as const).map((chart) => ({ props: { Chart: chart }, build: (c) => drawStatCard(c, chart) })),
    properties: [
      { name: 'Label', type: 'TEXT', default: 'Revenue', field: 'characters' },
      { name: 'Value', type: 'TEXT', default: '48.2', field: 'characters' },
    ],
    columns: 'Chart',
    gap: [32, 16],
  }
}

/* ── Hatched bar ───────────────────────────────────────────────────────── */

const HATCH_TONES: Record<string, string> = { neutral: 'role/fg-subtle', accent: 'role/accent' }

async function drawHatchedBar(c: ComponentNode, fill: 'hatched' | 'solid', orientation: 'vertical' | 'horizontal', tone: string) {
  const vertical = orientation === 'vertical'
  const [w, h] = vertical ? [12, 96] : [200, 8]
  await style(c, { dir: 'none', w, h })
  const v = 0.62
  const [fw, fh] = vertical ? [w, h * v] : [w * v, h]
  // A data mark: the theme's smallest radius, never a pill (min(radius-xs, 3px) in code).
  const mark =
    fill === 'hatched' ? await hatch('Fill', fw, fh, HATCH_TONES[tone]!, 'radius/xs') : rect('Fill', fw, fh, tone === 'neutral' ? 'role/well' : HATCH_TONES[tone]!, 'radius/xs')
  place(c, mark, 0, vertical ? h - fh : 0)
}

function hatchedBarSpec(): SetSpec {
  const variants: VariantSpec[] = []
  for (const tone of Object.keys(HATCH_TONES))
    for (const orientation of ['vertical', 'horizontal'] as const)
      for (const fill of ['hatched', 'solid'] as const) variants.push({ props: { Fill: fill, Orientation: orientation, Tone: tone }, build: (c) => drawHatchedBar(c, fill, orientation, tone) })
  return {
    key: 'component:hatched-bar',
    name: 'Hatched bar',
    description:
      'HatchedBar in packages/ui: solid for what is settled, hatched for what isn’t (a baseline, a pending or projected amount). The hatch is "/" stripes of the tone at 72%, 1.5px every 5px, over a 10% wash of it; solid neutral is the well. Vertical is 12 × 96 and grows from the bottom; horizontal 8 high from the inline start. Drawn at 62%. In code it grows on the smooth spring.',
    variants,
    properties: [],
    columns: 'Fill',
    gap: [32, 16],
  }
}

/* ── Cell bar ──────────────────────────────────────────────────────────── */

/** Bars on one scale: name, ink, plan (a year), and twelve months (the last three forecast). */
const CELL_ROWS: [string, string, number, number[]][] = [
  ['Flour', 'role/warning', 4800, [310, 320, 340, 360, 390, 420, 460, 500, 540, 560, 590, 620]],
  ['Butter', 'role/success', 4400, [420, 410, 390, 360, 330, 300, 280, 270, 260, 255, 250, 245]],
  ['Sugar', 'role/fg-subtle', 1500, [120, 125, 118, 122, 130, 126, 124, 128, 125, 125, 125, 125]],
]
const QUARTERS: [string, number][] = [
  ['Q1', 4180],
  ['Q2', 4620],
  ['Q3', 5240],
  ['Q4', 5710],
]

/** One bar: cells as wide as their amounts with a 2px gap, the forecast ones hatched, and the target as a dashed tick. */
async function cellBar(name: string, ink: string, values: number[], forecastFrom: number, scale: number, W: number, target?: number) {
  const H = 14
  const p = await plot(name, W, H + 8)
  const total = values.reduce((a, b) => a + b, 0)
  const span = (total / scale) * W - 2 * (values.length - 1)
  let x = 0
  for (const [i, v] of values.entries()) {
    const w = Math.max(2, (v / total) * span)
    if (i >= forecastFrom) place(p, await hatch('Projected', r2(w), H, ink, 2), x, 4)
    else place(p, rect('Cell', r2(w), H, ink, 2), x, 4)
    x += w + 2
  }
  if (target !== undefined) {
    const t = vector(p, `M0,0 L0,${H + 8}`, { stroke: solid('role/fg-muted'), strokeWidth: 1 }, 'Target') as VectorNode
    t.dashPattern = [2, 2]
    t.x = r2((target / scale) * W)
    t.y = 0
  }
  return p
}

async function drawCellBar(c: ComponentNode, captions: boolean) {
  const W = 360
  await style(c, { dir: 'col', gap: 'space/3', w: 'hug' })
  if (!captions) {
    for (const [name, ink, plan, values] of CELL_ROWS) {
      add(c, await box({ name, dir: 'row', align: 'center', gap: 'space/3' }, await text(name, 'UI/base/Regular', 'role/fg-muted', { name: 'Name', w: 64 }), await cellBar('Bar', ink, values, 9, 6000, W, plan)))
    }
    return
  }
  const total = QUARTERS.reduce((a, [, v]) => a + v, 0)
  const scale = Math.max(total, 18400)
  const plan = await text('Plan', 'Mono/xs', 'role/fg-muted', { name: 'Target label' })
  const head = await plot('Target', W, plan.height)
  place(head, plan, (18400 / scale) * W - plan.width / 2, 0)
  add(c, head, await cellBar('Bar', 'role/chart-2', QUARTERS.map(([, v]) => v), 3, scale, W, 18400))
  const caps = await plot('Captions', W, 32)
  let x = 0
  const span = (total / scale) * W - 6
  for (const [label, v] of QUARTERS) {
    place(caps, await box({ name: label, dir: 'col' }, await text(label, 'Mono/xs', 'role/fg-muted'), await text(`$${v.toLocaleString('en-US')}`, 'Mono/xs', 'role/fg')), x, 0)
    x += (v / total) * span + 2
  }
  add(c, caps)
}

function cellBarSpec(): SetSpec {
  return {
    key: 'component:cell-bar',
    name: 'Cell bar',
    description:
      'CellBar in packages/ui, as a static example (a bakery\'s ingredients by month): a cell per period, each as wide as its amount on a 2px gap, settled solid in the tone and projected hatched in it, the bar as long as its total on a scale bars share, and the target a dashed role/fg-muted tick. Captions=true is a year by quarter with each cell\'s label and amount under it and the plan named over its tick. In code the cells open from the start and walk with the arrow keys.',
    variants: [false, true].map((captions) => ({ props: { Captions: String(captions) }, build: (c: ComponentNode) => drawCellBar(c, captions) })),
    properties: [],
    columns: 'Captions',
    gap: [40, 16],
  }
}

/* ── Lollipop chart ────────────────────────────────────────────────────── */

/** Budget left by SLO, sorted from the most spent, in the status inks. */
const LOLLIPOP = [-0.82, -0.57, -0.37, -0.16, -0.09, 0.08, 0.15, 0.21, 0.36, 0.42, 0.51, 0.58, 0.63, 0.71, 0.75, 0.82, 0.9, 0.94]
const lollipopInk = (v: number) => (v < 0 ? 'role/danger' : v < 0.25 ? 'role/warning' : 'role/success')

async function drawLollipop(c: ComponentNode, picked: boolean) {
  const W = 360
  const H = 240
  const AXIS = 40
  await style(c, { dir: 'col', gap: 'space/1', w: 'hug' })
  const y = (v: number) => ((1 - v) / 2) * H
  const step = (W - AXIS) / LOLLIPOP.length
  const x = (i: number) => AXIS + (i + 0.5) * step
  const pick = 8
  const flag = await plot('Flag', W, 28)
  if (picked) {
    const pill = await box(
      { name: 'Pill', dir: 'row', align: 'center', gap: 6, pad: [4, 10, 4, 10], radius: 'radius/full', fill: 'role/inverse' },
      await text('+36.3%', 'Mono/sm', 'role/canvas', { name: 'Value' }),
      await text('Callback delivery success', 'UI/sm/Regular', 'role/canvas', { name: 'Label' }),
    )
    add(flag, pill)
    pill.x = r2(x(pick) - pill.width / 2)
  }
  add(c, flag)
  const p = await plot('Plot', W, H)
  for (const t of [-1, -0.5, 0, 0.5, 1]) {
    const label = await text(`${t > 0 ? '+' : ''}${Math.round(t * 100)}%`, 'Mono/xs', 'role/fg-muted')
    place(p, label, AXIS - 8 - label.width, y(t) - label.height / 2)
    const line = vector(p, `M${AXIS},${r2(y(t))} L${W},${r2(y(t))}`, { stroke: solid(t === 0 ? 'role/line-strong' : 'role/line-subtle'), strokeWidth: 1 }, t === 0 ? 'Baseline' : 'Grid') as VectorNode
    if (t !== 0) line.dashPattern = [3, 3]
  }
  if (picked) place(p, rect('Band', 20, H, 'role/band', 'radius/full'), x(pick) - 10, 0)
  for (const [i, v] of LOLLIPOP.entries()) {
    const stem = vector(p, `M${r2(x(i))},${r2(y(0))} L${r2(x(i))},${r2(y(v))}`, { stroke: solid('role/fg-subtle'), strokeWidth: 1 }, 'Stem') as VectorNode
    stem.dashPattern = [2, 2]
    const size = picked && i === pick ? 12 : 8
    const dot = disc(size, lollipopInk(v))
    if (picked && i === pick) {
      dot.strokes = [solid('role/surface')]
      dot.strokeWeight = 3
      dot.strokeAlign = 'OUTSIDE'
      const ring = vector(p, `M${r2(x(i) - 10.5)},${r2(y(v))} a10.5,10.5 0 1,0 21,0 a10.5,10.5 0 1,0 -21,0`, { stroke: solid(lollipopInk(v)), strokeWidth: 1.5 }, 'Ring')
      ring.name = 'Ring'
    }
    place(p, dot, x(i) - size / 2, y(v) - size / 2)
  }
  add(c, p)
}

function lollipopSpec(): SetSpec {
  return {
    key: 'component:lollipop-chart',
    name: 'Lollipop chart',
    description:
      'LollipopChart in packages/ui, as a static example (error budget left by SLO, sorted from the most spent): a dot on a dashed role/fg-subtle stem from the baseline (role/line-strong) per item, in its status ink, over dashed role/line-subtle gridlines with Mono/xs ticks. Picked=true marks one item with a role/band column, a ringed dot and an inverse pill naming it with its value. In code the stems grow from the baseline and the arrows walk the items.',
    variants: [false, true].map((picked) => ({ props: { Picked: String(picked) }, build: (c: ComponentNode) => drawLollipop(c, picked) })),
    properties: [],
    columns: 'Picked',
    gap: [40, 16],
  }
}

/* ── Diff bar ──────────────────────────────────────────────────────────── */

async function diffCells(side: 'a' | 'b', lit: number, on: Ink, cells = 14, w = 140) {
  const track = await box({ name: `Track ${side.toUpperCase()}`, dir: 'row', gap: 'space/0-5', w, h: 12 })
  const cw = (w - 2 * (cells - 1)) / cells
  // A's cells light outward from the centre: toward the inline start.
  for (let i = 0; i < cells; i++) {
    const n = side === 'a' ? cells - 1 - i : i
    add(track, rect(n < lit ? 'Cell on' : 'Cell off', cw, 12, n < lit ? on : 'role/well', 2))
  }
  return track
}

async function drawDiffBar(c: ComponentNode, layout: 'diverging' | 'stacked') {
  await style(c, { dir: 'col', gap: 'space/2', w: 480 })
  add(c, ref(await eyebrow('Accuracy'), 'Label'))
  const val = async (chars: string, win: boolean, end: boolean) => figure(await text(chars, 'Mono/base', win ? 'role/fg' : 'role/fg-muted', { name: 'Value', w: 72, align: end ? 'RIGHT' : 'LEFT' }), 400)
  if (layout === 'diverging') {
    add(
      c,
      await box(
        { name: 'Row', dir: 'row', align: 'center', gap: 'space/2', w: 'fill' },
        await val('71.4%', false, false),
        await diffCells('a', 9, 'role/line-strong'),
        rect('Center', 2, 20, 'role/fg-subtle', 'radius/full'),
        await diffCells('b', 12, 'role/accent'),
        await val('87.0%', true, true),
      ),
    )
    return
  }
  // Stacked: two rows on one scale, named; both lit to the smaller value, the worse side's excess in danger.
  for (const [name, lit, extra, win, chars] of [
    ['Quote', 10, 0, true, '$4,200'],
    ['Spend', 10, 3, false, '$5,460'],
  ] as const) {
    const track = await box({ name: 'Track', dir: 'row', gap: 'space/0-5', w: 300, h: 12 })
    const cw = (300 - 2 * 13) / 14
    for (let i = 0; i < 14; i++) add(track, rect('Cell', cw, 12, i < lit ? (win ? 'role/accent' : 'role/line-strong') : i < lit + extra ? 'role/danger' : 'role/well', 2))
    add(c, await box({ name, dir: 'row', align: 'center', gap: 'space/3', w: 'fill' }, await text(name, 'UI/sm/Regular', 'role/fg-muted', { name: 'Name', w: 48 }), track, await val(chars, win, true)))
  }
}

function diffBarSpec(): SetSpec {
  return {
    key: 'component:diff-bar',
    name: 'Diff bar',
    description:
      'DiffBar in packages/ui: two values of one measure as a diverging bar, each side growing out from a shared centre in 14 countable cells, the values in mono at the outer ends. The better side is lit in the tone with its value in ink; the other stays neutral. Stacked draws the two as rows on one scale, the worse side’s excess in danger. In code both sides light outward at one rate.',
    variants: (['diverging', 'stacked'] as const).map((layout) => ({ props: { Layout: layout }, build: (c) => drawDiffBar(c, layout) })),
    properties: [{ name: 'Label', type: 'TEXT', default: 'Accuracy', field: 'characters' }],
    columns: 'Layout',
    gap: [40, 16],
  }
}

/* ── Avatar stack ──────────────────────────────────────────────────────── */

const STACK = { sm: { px: 24, overlap: 4, text: 'UI/xs/Medium' }, default: { px: 32, overlap: 6, text: 'UI/sm/Medium' }, lg: { px: 40, overlap: 8, text: 'UI/base/Medium' } } as const

async function drawAvatarStack(c: ComponentNode, size: keyof typeof STACK, overflow: boolean) {
  const s = STACK[size]
  await style(c, { dir: 'row', align: 'center', gap: -s.overlap })
  const people = ['MC', 'JW', 'AR', 'LH']
  for (const who of people) {
    const a = await initials(who, s.px, s.text)
    // Each face is ringed in the page colour where it overlaps the next.
    a.strokes = [solid('role/canvas')]
    a.strokeWeight = 2
    a.strokeAlign = 'OUTSIDE'
    add(c, a)
  }
  if (overflow) {
    const more = await box({ name: 'More', dir: 'row', align: 'center', justify: 'center', w: s.px, h: s.px, radius: 'radius/full', fill: 'role/canvas' })
    add(more, await box({ name: 'Count', dir: 'row', align: 'center', justify: 'center', w: s.px, h: s.px, radius: 'radius/full', fill: 'role/band', stroke: 'role/line-subtle' }, await text('+3', s.text, 'role/fg-muted', { name: 'Count' })))
    add(c, more)
  }
}

function avatarStackSpec(): SetSpec {
  const variants: VariantSpec[] = []
  for (const overflow of [true, false]) for (const size of ['default', 'sm', 'lg'] as const) variants.push({ props: { Size: size, Overflow: String(overflow) }, build: (c) => drawAvatarStack(c, size, overflow) })
  return {
    key: 'component:avatar-stack',
    name: 'Avatar stack',
    description:
      'AvatarStack in packages/ui: who is here, overlapping avatars (the first `max`, 4 by default) and the rest behind a "+N" that opens the full list in a Popover. Overlap 4, 6 and 8px by size, each face ringed in the page colour. In code hovering fans the stack and lifts the face under the pointer.',
    variants,
    properties: [],
    columns: 'Size',
    gap: [32, 16],
  }
}

/* ── Code block ────────────────────────────────────────────────────────── */

type Tok = [string, Ink]
const CODE: Tok[][] = [
  [['import', 'role/accent-text'], [' { Button } ', 'role/fg'], ['from', 'role/accent-text'], [" '@youj/react'", 'role/success-text']],
  [['', 'role/fg']],
  [['export function', 'role/accent-text'], [' Deploy', 'role/fg'], ['() {', 'role/fg-muted']],
  [['  // Ship the preview', 'role/fg-subtle']],
  [['  return', 'role/accent-text'], [' <Button size=', 'role/fg'], ['"sm"', 'role/success-text'], ['>Deploy</Button>', 'role/fg']],
  [['}', 'role/fg-muted']],
]

async function drawCodeBlock(c: ComponentNode, numbers: boolean, deps: Deps) {
  await style(c, { dir: 'col', w: 440, radius: 'radius/lg', fill: 'role/band', stroke: 'role/line', clip: true })
  const head = await box({ name: 'Header', dir: 'row', align: 'center', justify: 'between', gap: 'space/2', pad: [0, 4, 0, 12], w: 'fill', h: 32, stroke: 'role/line', sides: { bottom: 1 } })
  add(
    head,
    await box({ name: 'Title', dir: 'row', align: 'center', gap: 'space/2' }, ref(await text('deploy.tsx', 'Mono/xs', 'role/fg', { name: 'Filename' }), 'Filename'), await text('tsx', 'Mono/xs', 'role/fg-muted', { name: 'Language' })),
    await box({ name: 'Copy', dir: 'row', align: 'center', justify: 'center', w: 24, h: 24, radius: 'bezel/pill' }, icon(deps.icons, 'copy', 14, 'role/fg-muted')),
  )
  const body = await box({ name: 'Body', dir: 'row', w: 'fill' })
  if (numbers) {
    const gutter = await box({ name: 'Line numbers', dir: 'col', pad: [12, 10, 12, 12], stroke: 'role/line', sides: { right: 1 } })
    for (let i = 1; i <= CODE.length; i++) add(gutter, await text(String(i), 'Mono/base', 'role/fg-subtle', { name: 'Number' }))
    add(body, gutter)
  }
  const code = await box({ name: 'Code', dir: 'col', pad: [12, 14], w: 'fill' })
  for (const line of CODE) {
    const row = await box({ name: 'Line', dir: 'row', w: 'fill', h: 20 })
    add(code, row)
    for (const [chars, ink] of line) if (chars) add(row, await text(chars.replace(/ /g, '\u00a0'), 'Mono/base', ink, { name: 'Token' }))
  }
  add(body, code)
  add(c, head, body)
}

function codeBlockSpec(deps: Deps): SetSpec {
  return {
    key: 'component:code-block',
    name: 'Code block',
    description:
      'CodeBlock in packages/ui: code on a recessed band panel, a 32px header with the file name and language in mono and a copy button, then the highlighted code in mono, scrolling sideways rather than wrapping. Keywords and properties in accent ink, strings in success, numbers in warning, comments subtle. In code the copy icon tucks its back sheet and writes a check.',
    variants: [true, false].map((numbers) => ({ props: { 'Line numbers': String(numbers) }, build: (c: ComponentNode) => drawCodeBlock(c, numbers, deps) })),
    properties: [{ name: 'Filename', type: 'TEXT', default: 'deploy.tsx', field: 'characters' }],
    columns: 'Line numbers',
    gap: [40, 16],
  }
}

/* ── Distribution strip ────────────────────────────────────────────────── */

async function drawDistribution(c: ComponentNode, slo: boolean) {
  const W = 520
  await style(c, { dir: 'col', w: W })
  const header = await box({ name: 'Header', dir: 'row', align: 'baseline', justify: 'between', gap: 'space/3', w: 'fill' }, ref(await eyebrow('Latency'), 'Label'))
  if (slo) add(header, await box({ name: 'Within', dir: 'row', align: 'baseline', gap: 'space/2-5' }, await eyebrow('Within 400 ms'), await value('94.2%', 'UI/lg/Medium')))
  add(c, header)
  // Samples on a log scale from 10 ms to 2 s, stacked where they crowd (4px dots, 5px pitch).
  const rnd = seeded(7)
  const samples = Array.from({ length: 160 }, () => Math.min(1800, Math.exp(Math.log(110) + (rnd() + rnd() + rnd() - 1.5) * 1.5 + (rnd() > 0.93 ? 1.4 : 0))))
  const lo = Math.log(10)
  const hi = Math.log(2000)
  const xOf = (ms: number) => (Math.log(ms) - lo) / (hi - lo)
  const inner = W - 16
  const slots = new Map<number, number>()
  const dots = samples.map((ms) => {
    const x = xOf(ms)
    const col = Math.round(x * inner / 5)
    const row = slots.get(col) ?? 0
    slots.set(col, row + 1)
    return { x, row, ms }
  })
  const rows = Math.max(...dots.map((d) => d.row)) + 1
  const plotH = 6 * 2 + rows * 5
  const flags = await plot('Flags', W, 20)
  const strip = await plot('Plot', W, plotH)
  const sloX = 8 + xOf(400) * inner
  if (slo) {
    const over = await hatch('Over', W - sloX, plotH, 'role/warning', 0)
    over.opacity = 0.4
    place(strip, over, sloX, 0)
  }
  for (const d of dots) place(strip, disc(4, d.ms > 400 && slo ? 'role/warning' : slo ? 'role/success-text' : 'role/fg-muted'), 8 + d.x * inner - 2, plotH - 6 - (d.row + 1) * 5)
  if (slo) {
    const line = vector(strip, `M${r2(sloX)},0 L${r2(sloX)},${plotH}`, { stroke: solid('role/warning'), strokeWidth: 1 }, 'Objective') as VectorNode
    line.dashPattern = [3, 3]
    line.strokeCap = 'NONE'
  }
  const sorted = [...samples].sort((a, b) => a - b)
  // Flags that would collide are spread apart and kept inside the strip.
  let nextFree = 0
  for (const [i, p] of [50, 90, 99].entries()) {
    const ms = sorted[Math.round(((sorted.length - 1) * p) / 100)]!
    const x = 8 + xOf(ms) * inner
    const strongest = i === 2
    const over = slo && ms > 400
    place(strip, rect('Percentile', 1, plotH, strongest ? 'role/fg' : 'role/line-strong'), x, 0)
    const flag = await box(
      { name: `p${p}`, dir: 'row', align: 'baseline', gap: 4 },
      await text(`p${p}`, 'Mono/xs', 'role/fg-muted'),
      await text(`${Math.round(ms)} ms`, 'Mono/xs', over ? 'role/warning-text' : 'role/fg'),
    )
    const at = Math.min(Math.max(x, nextFree), W - flag.width)
    place(flags, flag, at, 2)
    nextFree = at + flag.width + 10
  }
  const axis = await plot('Axis', W, 28)
  place(axis, rect('Rule', W, 1, 'role/line'), 0, 0)
  for (const [ms, chars] of [[10, '10 ms'], [100, '100 ms'], [1000, '1 s']] as const) {
    const x = 8 + xOf(ms) * inner
    place(axis, rect('Major tick', 1, 8, 'role/fg-subtle'), x, 0)
    place(axis, await text(chars, 'Mono/xs', 'role/fg-muted'), x - 12, 12)
  }
  add(c, await box({ name: 'Chart', dir: 'col', pad: [8, 0, 0, 0] }, flags, strip), axis)
}

function distributionSpec(): SetSpec {
  return {
    key: 'component:distribution-strip',
    name: 'Distribution strip',
    description:
      'DistributionStrip in packages/ui, as a static example (160 latency samples): every sample a 4px dot on a log-scaled strip, stacked where they crowd, the chosen percentiles (p50, p90, p99) as hairlines flagged above it, the strongest in ink. With an objective (`slo`) the header gives the share within it, a dashed warning line marks it, and past it the strip is hatched and the dots turn warning. In code the dots rise in a wave.',
    variants: [true, false].map((slo) => ({ props: { Objective: String(slo) }, build: (c: ComponentNode) => drawDistribution(c, slo) })),
    properties: [{ name: 'Label', type: 'TEXT', default: 'Latency', field: 'characters' }],
    columns: 'Objective',
    gap: [40, 16],
  }
}

/* ── Chart (Recharts, re-skinned) ──────────────────────────────────────── */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
const SERIES: [string, string, number[]][] = [
  ['Desktop', 'role/chart-1', [186, 305, 237, 273, 209, 314]],
  ['Mobile', 'role/chart-2', [80, 200, 120, 190, 130, 240]],
]

async function drawChart(c: ComponentNode, kind: 'area' | 'bar' | 'line', tooltip: boolean) {
  const W = 480
  await style(c, { dir: 'col', w: W })
  const plotH = 214
  const left = 36
  const pw = W - left - 8
  const ph = plotH - 24
  const p = await plot('Plot', W, plotH)
  const max = 400
  const yOf = (v: number) => 8 + ph - (v / max) * ph
  // The grid on the ink ramp: role/line hairlines, ticks in muted ink.
  for (const v of [0, 100, 200, 300, 400]) {
    place(p, rect('Grid', pw, 1, v === 0 ? 'role/line' : 'role/line-subtle'), left, yOf(v))
    place(p, await text(String(v), 'UI/xs/Regular', 'role/fg-muted', { name: 'Tick' }), 4, yOf(v) - 8)
  }
  const step = pw / MONTHS.length
  for (const [i, m] of MONTHS.entries()) place(p, await text(m, 'UI/xs/Regular', 'role/fg-muted', { name: 'Tick' }), left + i * step + step / 2 - 10, 8 + ph + 6)
  if (kind === 'bar') {
    const bw = (step - 16) / SERIES.length
    for (const [s, [, ink, data]] of SERIES.entries())
      for (const [i, v] of data.entries()) {
        const h = (v / max) * ph
        place(p, rect('Bar', bw - 2, h, ink, 'radius/xs'), left + i * step + 8 + s * bw, 8 + ph - h)
      }
  } else {
    for (const [, ink, data] of [...SERIES].reverse()) {
      const pts: [number, number][] = data.map((v, i) => [left + i * step + step / 2, yOf(v)])
      const d = monotone(pts)
      if (kind === 'area') vector(p, `${d} L${r2(pts[pts.length - 1]![0])},${r2(8 + ph)} L${r2(pts[0]![0])},${r2(8 + ph)} Z`, { fill: solid([ink, 0.2]) }, 'Area')
      vector(p, d, { stroke: solid(ink), strokeWidth: 2 }, 'Line')
    }
  }
  if (tooltip) {
    const x = left + 3 * step + step / 2
    place(p, rect('Cursor', 1, ph, 'role/line'), x, 8)
    const tip = await box({ name: 'Tooltip', dir: 'col', gap: 'space/1-5', pad: [8, 10], w: 144, radius: 'radius/lg', fill: 'role/overlay', stroke: 'role/line', effect: 'Shadow/md' })
    add(tip, await text('April', 'UI/xs/Medium', 'role/fg', { name: 'Heading' }))
    for (const [name, ink, data] of SERIES)
      add(
        tip,
        await box(
          { name, dir: 'row', align: 'center', gap: 'space/2', w: 'fill' },
          rect('Swatch', 10, 10, ink, 2),
          await text(name, 'UI/xs/Regular', 'role/fg-muted', { name: 'Name', w: 'fill' }),
          figure(await text(String(data[3]), 'UI/xs/Medium', 'role/fg', { name: 'Value' })),
        ),
      )
    place(p, tip, x + 12, 24)
  }
  const legend = await box({ name: 'Legend', dir: 'row', justify: 'center', gap: 'space/4', pad: [12, 0, 0, 0], w: 'fill' })
  for (const [name, ink] of SERIES) add(legend, await box({ name, dir: 'row', align: 'center', gap: 'space/1-5' }, rect('Swatch', 8, 8, ink, 2), await text(name, 'UI/xs/Regular', 'role/fg-muted')))
  add(c, p, legend)
}

function chartSpec(): SetSpec {
  const variants: VariantSpec[] = []
  for (const tooltip of [false, true]) for (const kind of ['area', 'bar', 'line'] as const) variants.push({ props: { Kind: kind, Tooltip: String(tooltip) }, build: (c) => drawChart(c, kind, tooltip) })
  return {
    key: 'component:chart',
    name: 'Chart',
    description:
      'ChartContainer in packages/ui (shadcn’s chart on Recharts, re-skinned), as a static example: two series over six months, each a chart colour from the ChartConfig. Axes and grid on the ink ramp, the legend under the plot, the tooltip (ChartTooltipContent) on the overlay surface. In code lines and areas draw in on the deliberate token and bars grow on slow.',
    variants,
    properties: [],
    columns: 'Kind',
    gap: [32, 24],
  }
}

/* ── Timeline ──────────────────────────────────────────────────────────── */

const TIMELINE_TONES: Record<string, [string, string, string]> = {
  neutral: ['role/surface', 'role/fg-muted', 'role/line'],
  accent: ['role/accent-subtle', 'role/accent', 'role/accent-line'],
  success: ['role/success-subtle', 'role/success-text', 'role/success-line'],
  warning: ['role/warning-subtle', 'role/warning-text', 'role/warning-line'],
  danger: ['role/danger-subtle', 'role/danger-text', 'role/danger-line'],
}

const EVENTS: [string, string, string, string, string][] = [
  ['success', 'check', 'Mira', 'deployed youj-docs to production', '5 min ago'],
  ['accent', 'git-commit', 'Jonas', 'pushed 3 commits to main', '12 min ago'],
  ['neutral', 'message', 'Ava', 'commented on #482', '1 hr ago'],
  ['danger', 'alert-triangle', 'Monitor', 'reported a failed check', '09:41'],
]

async function drawTimeline(c: ComponentNode, deps: Deps, details: boolean) {
  await style(c, { dir: 'col', gap: 'space/2', w: 460 })
  add(c, await text('Today', 'UI/sm/Medium', 'role/fg-muted', { name: 'Day' }))
  const list = await box({ name: 'Events', dir: 'col', w: 'fill' })
  add(c, list)
  for (const [i, [tone, glyph, who, what, when]] of EVENTS.entries()) {
    const last = i === EVENTS.length - 1
    const [fill, ink, edge] = TIMELINE_TONES[tone]!
    const event = await box({ name: 'Event', dir: 'row', gap: 'space/3', pad: [0, 0, last ? 4 : 16, 0], w: 'fill' })
    add(list, event)
    const rail = await box({ name: 'Rail', dir: 'col', align: 'center', w: 28 })
    add(rail, await box({ name: 'Mark', dir: 'row', align: 'center', justify: 'center', w: 28, h: 28, radius: 'radius/full', fill, stroke: edge }, icon(deps.icons, glyph, 14, ink)))
    const body = await box({ name: 'Body', dir: 'col', gap: 'space/1', pad: [4, 0, 0, 0], w: 'fill' })
    add(
      body,
      await box(
        { name: 'Line', dir: 'row', align: 'center', gap: 'space/2', w: 'fill' },
        await initials(who.slice(0, 1), 20, 'UI/xs/Medium'),
        await text(who, 'UI/base/Medium', 'role/fg', { name: 'Actor' }),
        await text(what, 'UI/base/Regular', 'role/fg-muted', { name: 'Summary', w: 'fill', truncate: true }),
        await text(when, 'UI/sm/Regular', 'role/fg-muted', { name: 'Time' }),
      ),
    )
    if (details && i === 0) add(body, await text('Build 4f2a · 42s · 18 routes', 'UI/sm/Regular', 'role/fg-muted', { name: 'Details' }))
    add(event, rail, body)
    // The rail runs from under the mark to the next one.
    rail.layoutSizingVertical = 'FILL'
    if (!last) {
      const line = rect('Line', 1, 8, 'role/line')
      add(rail, line)
      line.layoutGrow = 1
    }
  }
}

function timelineSpec(deps: Deps): SetSpec {
  return {
    key: 'component:timeline',
    name: 'Timeline',
    description:
      'Timeline in packages/ui: an activity feed by day, each event a 28px mark on a hairline rail in its tone (neutral, accent, success, warning, danger), who did it with a 20px avatar, what happened and a relative time; details open in place. In code arrivals slide in at the top and the mark plays once.',
    variants: [false, true].map((details) => ({ props: { Details: String(details) }, build: (c: ComponentNode) => drawTimeline(c, deps, details) })),
    properties: [],
    columns: 'Details',
    gap: [40, 16],
  }
}

/* ── Progress list (transfers) ─────────────────────────────────────────── */

type Transfer = 'active' | 'paused' | 'failed' | 'done'
const DISC: Record<Transfer, [string, string]> = {
  active: ['role/band', 'role/fg'],
  paused: ['role/hover', 'role/fg-muted'],
  failed: ['role/danger-subtle', 'role/danger-text'],
  done: ['role/success-subtle', 'role/success-text'],
}
const LIT: Record<Transfer, string> = { active: 'role/fg', paused: 'role/line-strong', failed: 'role/danger', done: 'role/success' }

async function drawTransfer(c: ComponentNode, status: Transfer, deps: Deps) {
  const done = status === 'done'
  await style(c, {
    dir: 'row',
    align: 'center',
    gap: 'space/3',
    pad: done ? [6, 12, 6, 10] : [12, 12, 12, 10],
    w: 460,
    radius: 'radius/xl',
    // The row's well: the canvas at 45% in dark, a 3% ink in light (role/well, lighter).
    fill: done ? undefined : ['role/well', 0.45],
    stroke: status === 'failed' ? ['role/danger', 0.28] : undefined,
  })
  const [fill, ink] = DISC[status]
  const glyph = status === 'done' ? 'check' : status === 'failed' ? 'alert-triangle' : 'file'
  add(c, await box({ name: 'Icon', dir: 'row', align: 'center', justify: 'center', w: done ? 24 : 32, h: done ? 24 : 32, radius: 'radius/full', fill }, icon(deps.icons, glyph, done ? 14 : 16, ink)))
  const percent = status === 'failed' ? 38 : status === 'paused' ? 54 : 72
  const body = await box({ name: 'Body', dir: 'col', gap: 'space/2-5', w: 'fill' })
  add(
    body,
    await box(
      { name: 'Head', dir: 'row', align: 'baseline', gap: 'space/3', w: 'fill' },
      ref(await text('brand-film-final.mov', 'Mono/base', done ? 'role/fg-muted' : 'role/fg', { name: 'Name', w: 'fill', truncate: true }), 'Name'),
      await text(done ? '1.2 GB' : `${percent}%`, 'Mono/sm', status === 'failed' ? 'role/danger-text' : 'role/fg', { name: 'Value' }),
    ),
  )
  if (!done) {
    const cells = 32
    const track = await box({ name: 'Track', dir: 'row', gap: 'space/0-5', w: 'fill', h: 8 })
    add(body, track)
    for (let i = 0; i < cells; i++) {
      const on = i < Math.round((percent / 100) * cells)
      const cell = rect(on ? 'Cell on' : 'Cell off', 8, 8, on ? LIT[status] : 'role/well', 2)
      add(track, cell)
      cell.layoutGrow = 1
    }
    const meta = await box({ name: 'Meta', dir: 'row', justify: 'between', gap: 'space/3', w: 'fill' })
    add(meta, await text(`${((percent / 100) * 1.2).toFixed(2)} of 1.2 GB`, 'Mono/sm', 'role/fg-muted', { name: 'Moved' }))
    add(
      meta,
      status === 'failed'
        ? await text('Connection lost', 'Mono/sm', 'role/danger-text', { name: 'Error' })
        : status === 'paused'
          ? await text('Paused', 'Mono/sm', 'role/fg-muted', { name: 'Status' })
          : await box({ name: 'Status', dir: 'row', gap: 'space/1-5' }, await text('24 MB/s', 'Mono/sm', 'role/fg'), await text('·', 'Mono/sm', 'role/fg-subtle'), await text('0:14 left', 'Mono/sm', 'role/fg-muted')),
    )
    add(body, meta)
  }
  add(c, body)
  // Every row holds the action's slot, so the cells end on one line.
  if (done) add(c, await box({ name: 'Slot', w: 28, h: 28 }))
  else {
    const action = button(deps.get, '', { Variant: 'secondary', Size: 'icon-sm' })
    swapIcon(action, pick(deps.icons, status === 'failed' ? 'rotate-ccw' : 'play').rest)
    add(c, action)
  }
}

function progressListSpec(deps: Deps): SetSpec {
  return {
    key: 'component:progress-list',
    name: 'Progress list/Row',
    description:
      'ProgressList in packages/ui, one row per Status: a file on a faint well, its name in mono and the share moved, then cells that light as bytes arrive, what’s moved, the live rate and time left in mono, and pause, resume or retry. A failed row lights its cells in danger to where it broke and says why; a done row lets go of its well and its glyph turns into a check. Stack rows 6px apart for the list.',
    variants: (['active', 'paused', 'failed', 'done'] as const).map((status) => ({ props: { Status: status }, build: (c: ComponentNode) => drawTransfer(c, status, deps) })),
    properties: [{ name: 'Name', type: 'TEXT', default: 'brand-film-final.mov', field: 'characters' }],
    columns: 'Status',
    gap: [24, 16],
  }
}

/* ── Breakdown list ────────────────────────────────────────────────────── */

const PARTS: [string, string, string, number][] = [
  ['Compute', 'Edge and serverless', '$4,820', 0.46],
  ['Storage', 'Blobs and backups', '$2,950', 0.28],
  ['Bandwidth', 'Egress', '$1,470', 0.14],
  ['Other', 'Logs and builds', '$1,260', 0.12],
]

async function drawBreakdownList(c: ComponentNode, variant: 'rows' | 'tiles') {
  const tiles = variant === 'tiles'
  await style(c, { dir: 'col', gap: tiles ? 'space/1-5' : 0, w: 360 })
  for (const [i, [name, detail, amount, share]] of PARTS.entries()) {
    const ink = CHART[i % CHART.length]!
    const rule = !tiles && i < PARTS.length - 1
    const row = await box({
      name: 'Item',
      dir: 'row',
      align: 'center',
      gap: 'space/3',
      pad: tiles ? [8, 12, 8, 8] : [10, 0],
      w: 'fill',
      radius: tiles ? 'radius/lg' : undefined,
      fill: tiles ? 'role/band' : undefined,
      stroke: rule ? 'role/line' : undefined,
      sides: rule ? { bottom: 1 } : undefined,
    })
    if (tiles) {
      add(
        row,
        await box({ name: 'Marker', dir: 'row', align: 'center', justify: 'center', w: 32, h: 32, radius: 'radius/md', fill: 'role/surface' }, rect('Dot', 10, 10, ink, 'radius/full')),
        await box({ name: 'Text', dir: 'row', align: 'baseline', gap: 'space/2', w: 'fill' }, figure(await text(amount, 'UI/lg/Medium', 'role/fg', { name: 'Value' })), await text(name, 'UI/base/Regular', 'role/fg-muted', { name: 'Label', truncate: true })),
      )
    } else {
      add(
        row,
        rect('Marker', 10, 10, ink, 2),
        await box({ name: 'Text', dir: 'col', w: 'fill' }, await text(name, 'UI/base/Regular', 'role/fg', { name: 'Label' }), await text(detail, 'UI/sm/Regular', 'role/fg-muted', { name: 'Detail' })),
        await text(amount, 'Mono/base/Medium', 'role/fg', { name: 'Value' }),
      )
    }
    add(row, await text(`${Math.round(share * 100)}%`, 'Mono/sm', 'role/fg-muted', { name: 'Share', w: 48, align: 'RIGHT' }))
    add(c, row)
  }
}

function breakdownListSpec(): SetSpec {
  return {
    key: 'component:breakdown-list',
    name: 'Breakdown list',
    description:
      'BreakdownList in packages/ui: how a total splits, as rows (a colour marker, the name and a line of detail, the value in mono, the share) on hairlines, or tiles that lead with the value. It is the key to a ShareBar with the same parts: both take the chart colours in order. Hovering a row lights it (role/hover; tiles role/selected).',
    variants: (['rows', 'tiles'] as const).map((variant) => ({ props: { Variant: variant }, build: (c: ComponentNode) => drawBreakdownList(c, variant) })),
    properties: [],
    columns: 'Variant',
    gap: [40, 16],
  }
}

/* ── Contribution list ─────────────────────────────────────────────────── */

const STEPS: [string, string, string, number][] = [
  ['trending-up', 'New customers', '38 accounts this month', 4200],
  ['refresh', 'Expansion', 'Seat upgrades', 1850],
  ['trending-down', 'Churn', '6 accounts left', -1300],
  ['percent', 'Discounts', 'Annual plans', -650],
]

async function drawContributionList(c: ComponentNode, deps: Deps, marks: boolean) {
  await style(c, { dir: 'col', w: marks ? 520 : 400 })
  const base = 24000
  const totals = STEPS.reduce<number[]>((acc, s) => [...acc, acc[acc.length - 1]! + s[3]], [base])
  const lo = Math.min(...totals)
  const hi = Math.max(...totals)
  const at = (v: number) => (v - lo) / (hi - lo || 1)
  const money = (n: number) => `$${Math.abs(n).toLocaleString('en-US')}`
  const track = async (from: number | null, to: number, good: boolean) => {
    const t = await plot('Mark', 96, 6, { fill: 'role/band', radius: 'radius/full' })
    if (from === null) place(t, rect('Tick', 2, 14, 'role/fg-muted', 'radius/full'), at(to) * 96 - 1, -4)
    else place(t, rect('Step', Math.max(2, Math.abs(at(to) - at(from)) * 96), 6, good ? 'role/success' : 'role/danger', 'radius/full'), at(Math.min(from, to)) * 96, 0)
    return t
  }
  const row = async (p: { label: string; detail: string; value: string; glyph?: string; mark: () => Promise<FrameNode>; total?: boolean; rule?: boolean }) => {
    const r = await box({
      name: p.total ? 'Total' : p.glyph ? 'Step' : 'Baseline',
      dir: 'row',
      align: 'center',
      gap: 'space/3',
      pad: p.total ? [12, 12] : [10, 12],
      w: 'fill',
      radius: p.total ? 'radius/lg' : undefined,
      fill: p.total ? 'role/accent-subtle' : undefined,
      stroke: p.total ? 'role/accent-line' : p.rule ? 'role/line' : undefined,
      sides: !p.total && p.rule ? { top: 1 } : undefined,
    })
    if (p.glyph) add(r, await box({ name: 'Icon', dir: 'row', align: 'center', justify: 'center', w: 32, h: 32, radius: 'radius/md', fill: 'role/surface', stroke: 'role/line' }, icon(deps.icons, p.glyph, 16, 'role/fg-muted')))
    const ink = p.total ? 'role/accent-text' : p.glyph ? 'role/fg' : 'role/fg-muted'
    add(
      r,
      await box(
        { name: 'Text', dir: 'col', w: 'fill' },
        await text(p.label, p.glyph || p.total ? 'UI/base/Medium' : 'UI/base/Regular', ink, { name: 'Label' }),
        await text(p.detail, 'UI/sm/Regular', p.total ? 'role/accent-text' : p.glyph ? 'role/fg-muted' : 'role/fg-subtle', { name: 'Detail' }),
      ),
    )
    if (marks) add(r, await p.mark())
    add(r, await text(p.value, 'Mono/base/Medium', p.total ? 'role/accent-text' : 'role/fg', { name: 'Value', w: 72, align: 'RIGHT' }))
    return r
  }
  add(c, await row({ label: 'Starting MRR', detail: 'September', value: money(base), mark: () => track(null, base, true) }))
  for (const [i, [glyph, label, detail, v]] of STEPS.entries())
    add(c, await row({ label, detail, glyph, value: `${v > 0 ? '+' : '−'}${money(v)}`, mark: () => track(totals[i]!, totals[i + 1]!, v > 0), rule: true }))
  add(c, await box({ name: 'Gap', w: 1, h: 4 }), await row({ label: 'Ending MRR', detail: 'October', value: money(totals[totals.length - 1]!), mark: () => track(null, totals[totals.length - 1]!, true), total: true }))
}

function contributionListSpec(deps: Deps): SetSpec {
  return {
    key: 'component:contribution-list',
    name: 'Contribution list',
    description:
      'ContributionList in packages/ui: a waterfall told as a list. Where a figure starts, each thing that moved it as a signed step (an icon, what it is, a line of why, +n or −n), and where it lands, highlighted in the accent. Beside each value a thin track on one scale: the baseline and total a tick, each step a bar in the good or bad ink. Below 28rem the marks hide (Marks=false). In code the bars grow one after another.',
    variants: [true, false].map((marks) => ({ props: { Marks: String(marks) }, build: (c: ComponentNode) => drawContributionList(c, deps, marks) })),
    properties: [],
    columns: 'Marks',
    gap: [40, 16],
  }
}

/* ── Unit chart ────────────────────────────────────────────────────────── */

const COVERS = [2, 3, 5, 9, 12, 8, 4, 3, 6, 10, 14, 15, 11, 7, 3]

async function drawUnitChart(c: ComponentNode, highlight: boolean) {
  // The code's 10px pitch and 3.3 radius, drawn at 2× (it scales to its width).
  const PITCH = 20
  const rows = 16
  const W = COVERS.length * PITCH
  await style(c, { dir: 'col', gap: 'space/1', w: W })
  const p = await plot('Plot', W, rows * PITCH)
  for (const [col, count] of COVERS.entries())
    for (let r = 0; r < rows; r++) {
      const on = r < count
      const lit = !highlight || (col >= 9 && col <= 12)
      place(p, disc(13.2, on ? (lit ? 'role/accent' : 'role/chart-quiet') : 'role/well'), col * PITCH + 3.4, (rows - 1 - r) * PITCH + 3.4)
    }
  const axis = await plot('Axis', W, 16)
  for (const [i, chars] of ['11:00', '14:00', '17:00', '20:00', '23:00'].entries()) place(axis, await text(chars, 'Mono/xs', 'role/fg-muted'), i * 3 * PITCH + 2, 0)
  add(c, p, axis)
}

function unitChartSpec(): SetSpec {
  return {
    key: 'component:unit-chart',
    name: 'Unit chart',
    description:
      'UnitChart in packages/ui, as a static example (covers per half hour): each column a bucket and each dot one unit, stacked from the baseline over a faint grid of every dot the chart could hold, labels under every few columns. A highlighted range stays in the tone and the rest go quiet (role/chart-quiet). In code the dots light column by column.',
    variants: [true, false].map((highlight) => ({ props: { Highlight: String(highlight) }, build: (c: ComponentNode) => drawUnitChart(c, highlight) })),
    properties: [],
    columns: 'Highlight',
    gap: [40, 16],
  }
}

/* ── Waffle chart ──────────────────────────────────────────────────────── */

const WAFFLE: [string, number, string][] = [
  ['Video', 38, 'role/chart-1'],
  ['Photos', 24, 'role/chart-2'],
  ['Audio', 14, 'role/chart-3'],
  ['Documents', 9, 'role/chart-4'],
]

async function drawWaffle(c: ComponentNode, layout: 'rows' | 'cluster') {
  const cols = 20
  const rows = 10
  // The code's 10px pitch and 8.4 squares (1.4 corners), drawn larger.
  const PITCH = 18
  const S = 15
  await style(c, { dir: 'col', gap: 'space/3', w: cols * PITCH })
  const p = await plot('Cells', cols * PITCH, rows * PITCH)
  const owner: (string | null)[] = Array(cols * rows).fill(null)
  if (layout === 'rows') {
    let k = 0
    for (const [, n, ink] of WAFFLE) for (let i = 0; i < n * 2; i++) owner[k++] = ink
  } else {
    // A round patch at the centre, each part a wedge of it.
    const total = WAFFLE.reduce((s, w) => s + w[1] * 2, 0)
    const cells = Array.from({ length: cols * rows }, (_, i) => {
      const x = (i % cols) - (cols - 1) / 2
      const y = Math.floor(i / cols) - (rows - 1) / 2
      return { i, d: Math.hypot(x * 0.55, y), a: (Math.atan2(y, x) + Math.PI * 2.5) % (Math.PI * 2) }
    })
      .sort((a, b) => a.d - b.d)
      .slice(0, total)
      .sort((a, b) => a.a - b.a)
    let k = 0
    for (const [, n, ink] of WAFFLE) for (let j = 0; j < n * 2; j++) owner[cells[k++]!.i] = ink
  }
  owner.forEach((ink, i) => place(p, rect('Cell', S, S, ink ?? 'role/well', 2.5), (i % cols) * PITCH + 1.5, Math.floor(i / cols) * PITCH + 1.5))
  const legend = await box({ name: 'Legend', dir: 'row', gap: 'space/4', wrap: 8, w: 'fill' })
  for (const [name, n, ink] of WAFFLE)
    add(legend, await box({ name, dir: 'row', align: 'center', gap: 'space/1-5' }, rect('Swatch', 10, 10, ink, 'radius/xs'), await text(name, 'UI/base/Regular', 'role/fg'), await text(`${n}%`, 'Mono/base', 'role/fg-muted')))
  add(c, p, legend)
}

function waffleSpec(): SetSpec {
  return {
    key: 'component:waffle-chart',
    name: 'Waffle chart',
    description:
      'WaffleChart in packages/ui, as a static example (storage by type, 200 cells): a whole in countable cells, each coloured by its part over a faint grid of empty ones. `rows` fills from the top-start corner part after part; `cluster` gathers the filled cells into a round patch, each part a wedge. The legend names each part and its share. In code the cells fill in order.',
    variants: (['rows', 'cluster'] as const).map((layout) => ({ props: { Layout: layout }, build: (c: ComponentNode) => drawWaffle(c, layout) })),
    properties: [],
    columns: 'Layout',
    gap: [40, 16],
  }
}

/* ── Radar chart ───────────────────────────────────────────────────────── */

const AXES = ['Speed', 'Quality', 'Cost', 'Support', 'Docs', 'Uptime']
const RADAR: [string, string, number[]][] = [
  ['Youj', 'role/chart-1', [8, 9, 6, 7, 9, 8]],
  ['Other', 'role/chart-2', [6, 7, 8, 5, 5, 9]],
]

async function drawRadar(c: ComponentNode, series: number) {
  await style(c, { dir: 'col', align: 'center', gap: 'space/3', w: 360 })
  const p = await plot('Plot', 360, 300)
  const cx = 180
  const cy = 150
  const R = 110
  const pt = (i: number, v: number) => {
    const a = (i / AXES.length) * Math.PI * 2 - Math.PI / 2
    return [cx + Math.cos(a) * R * v, cy + Math.sin(a) * R * v] as const
  }
  const shape = (vs: number[]) => vs.map((v, i) => pt(i, v)).map(([x, y], i) => `${i ? 'L' : 'M'}${r2(x)},${r2(y)}`).join(' ') + ' Z'
  for (let k = 1; k <= 5; k++) vector(p, shape(AXES.map(() => k / 5)), { stroke: solid(k === 5 ? 'role/line' : 'role/line-subtle'), strokeWidth: 1 }, 'Ring')
  vector(p, AXES.map((_, i) => `M${cx},${cy} L${r2(pt(i, 1)[0])},${r2(pt(i, 1)[1])}`).join(' '), { stroke: solid('role/line-subtle'), strokeWidth: 1 }, 'Spokes')
  for (const [, ink, values] of RADAR.slice(0, series)) vector(p, shape(values.map((v) => v / 10)), { fill: solid([ink, 0.1]), stroke: solid(ink), strokeWidth: 1.5 }, 'Series')
  for (const [i, name] of AXES.entries()) {
    const [x, y] = pt(i, 1.16)
    const t = await text(name, 'UI/sm/Regular', 'role/fg-muted', { name: 'Axis' })
    place(p, t, x - t.width / 2, y - t.height / 2)
  }
  const legend = await box({ name: 'Legend', dir: 'row', justify: 'center', gap: 'space/1' })
  for (const [name, ink] of RADAR.slice(0, series)) {
    const b = await box({ name, dir: 'row', align: 'center', gap: 'space/2', pad: [0, 10], radius: 'bezel/pill' }, rect('Swatch', 10, 10, ink, 'radius/full'), await text(name, 'UI/sm/Regular', 'role/fg'))
    controlHeight(b, 'control/sm')
    add(legend, b)
  }
  add(c, p, legend)
}

function radarSpec(): SetSpec {
  return {
    key: 'component:radar-chart',
    name: 'Radar chart',
    description:
      'RadarChart in packages/ui, as a static example (six axes, out of 10): several things scored on the same axes, one filled shape each (the tone at 10%, a 1.5 stroke), over calm ring and spoke hairlines; axis names around the outer ring and a legend of series toggles under it. In code every shape opens from the centre.',
    variants: [2, 1].map((n) => ({ props: { Series: String(n) }, build: (c: ComponentNode) => drawRadar(c, n) })),
    properties: [],
    columns: 'Series',
    gap: [40, 16],
  }
}

/* ── Radial graph ──────────────────────────────────────────────────────── */

/** Ring 1 at evenly spaced angles (degrees from the top, clockwise), each with its tone, state and the angles of what hangs from it. */
const REACH: [number, string, 'solid' | 'dashed' | null, [number, 'solid' | 'dashed' | null][]][] = [
  [30, 'role/chart-3', 'solid', [[18, 'dashed'], [42, null]]],
  [90, 'role/chart-1', null, [[90, null]]],
  [150, 'role/chart-5', 'solid', [[134, 'dashed'], [150, null], [166, 'dashed']]],
  [210, 'role/chart-1', null, [[210, null]]],
  [270, 'role/chart-4', null, [[262, null], [278, null]]],
  [330, 'role/chart-2', 'solid', [[330, 'dashed']]],
]

async function drawRadialGraph(c: ComponentNode, hops: number) {
  // The code's 320 viewBox, its 134 outer ring and dot radii 17 / 6 / 4.75, at 1:1.
  const S = 320
  const M = S / 2
  await style(c, { dir: 'col', w: S })
  const p = await plot('Graph', S, S)
  const R = [0, 67, 134]
  const at = (deg: number, r: number) => [M + Math.cos(((deg - 90) * Math.PI) / 180) * r, M + Math.sin(((deg - 90) * Math.PI) / 180) * r] as const
  const circle = (cx: number, cy: number, r: number) => `M${r2(cx - r)},${r2(cy)} a${r},${r} 0 1,0 ${r * 2},0 a${r},${r} 0 1,0 ${-r * 2},0`
  for (let k = 1; k <= hops; k++) {
    const ring = vector(p, circle(M, M, R[k]!), { stroke: solid('role/line-strong'), strokeWidth: 1 }, `Ring ${k}`) as VectorNode
    ring.dashPattern = [2, 4]
  }
  const link = (a: readonly [number, number], b: readonly [number, number], state: 'solid' | 'dashed' | null) => {
    const v = vector(p, `M${r2(a[0])},${r2(a[1])} L${r2(b[0])},${r2(b[1])}`, { stroke: solid(state ? 'role/danger' : 'role/line-strong'), strokeWidth: state ? 1.5 : 1 }, 'Link') as VectorNode
    if (state === 'dashed') v.dashPattern = [3, 3]
  }
  const node = (xy: readonly [number, number], r: number, ink: string, state: 'solid' | 'dashed' | null) => {
    if (state) {
      const ring = vector(p, circle(xy[0], xy[1], r + 4), { fill: solid('role/surface'), stroke: solid('role/danger'), strokeWidth: 1.5 }, 'State') as VectorNode
      if (state === 'dashed') ring.dashPattern = [2, 2]
    }
    const dot = disc(r * 2, ink)
    if (!state) {
      dot.strokes = [solid('role/surface')]
      dot.strokeWeight = 2
      dot.strokeAlign = 'OUTSIDE'
    }
    place(p, dot, xy[0] - r, xy[1] - r)
  }
  for (const [deg, , state, kids] of REACH) {
    link([M, M], at(deg, R[1]!), state)
    if (hops > 1) for (const [kd, ks] of kids) link(at(deg, R[1]!), at(kd, R[2]!), ks)
  }
  for (const [deg, ink, state, kids] of REACH) {
    node(at(deg, R[1]!), 6, ink, state)
    if (hops > 1) for (const [kd, ks] of kids) node(at(kd, R[2]!), 4.75, ink, ks)
  }
  node([M, M], 17, 'role/accent', 'solid')
  const short = await text('SR', 'UI/sm/Medium', 'role/canvas', { name: 'Short' })
  place(p, short, M - short.width / 2, M - short.height / 2)
  for (let k = 1; k <= hops; k++) {
    const [x, y] = at(240, (R[k - 1]! + (k === 1 ? 23 : 0) + R[k]!) / 2)
    const t = await text(k === 1 ? '1 hop' : `${k} hops`, 'UI/xs/Regular', 'role/fg-subtle', { name: 'Caption' })
    place(p, t, x - t.width / 2, y - t.height / 2)
  }
  add(c, p)
}

function radialGraphSpec(): SetSpec {
  return {
    key: 'component:radial-graph',
    name: 'Radial graph',
    description:
      'RadialGraph in packages/ui, as a static example (a service account and what it reaches): a center disc, the nodes one hop out on the first dashed ring and what they lead to on the next, each branch a wedge; a dot takes the chart colour of its kind, a solid or dashed role/danger ring its state, and the link into it is drawn the same way. Rings are named in a quiet gap. Hops=1 folds the outer ring into its parents. In code the nodes travel out from the centre ring by ring.',
    variants: [2, 1].map((hops) => ({ props: { Hops: String(hops) }, build: (c: ComponentNode) => drawRadialGraph(c, hops) })),
    properties: [],
    columns: 'Hops',
    gap: [40, 16],
  }
}

/* ── Density lanes ─────────────────────────────────────────────────────── */

/** Lanes of a day by hour: each lane's peak (column), height (in dots of swell) and width. */
const LANES_DRAWN: [string, string, string, number, number, number][] = [
  ['Identity', '25%', 'role/chart-3', 11, 4, 3],
  ['Devices', '24%', 'role/chart-1', 13, 3, 4],
  ['Cloud', '13%', 'role/chart-5', 16, 3, 2],
  ['Network', '14%', 'role/chart-2', 2, 3, 2],
]

async function drawDensityLanes(c: ComponentNode, highlight: boolean) {
  // The code's 10px pitch and 3.1 radius, at 1.2 (24 columns in 288).
  const PITCH = 12
  const R = 3.7
  const cols = 24
  const depth = 4
  const W = cols * PITCH
  const H = (depth * 2 + 1) * PITCH
  await style(c, { dir: 'col', gap: 'space/2', w: 'hug' })
  const lit = (col: number) => !highlight || col < 7 || col > 18
  for (const [name, share, ink, peak, height, width] of LANES_DRAWN) {
    const lane = await box({ name, dir: 'row', align: 'center', gap: 'space/3' })
    add(lane, await box({ name: 'Label', dir: 'col', w: 64 }, await text(name, 'UI/base/Regular', 'role/fg-muted'), await text(share, 'Mono/base', 'role/fg')))
    const p = await plot('Plot', W, H)
    for (let col = 0; col < cols; col++) {
      const n = Math.round(height * Math.exp(-((col - peak) ** 2) / (2 * width * width)))
      for (let row = 0; row < depth * 2 + 1; row++) {
        const on = Math.abs(row - depth) <= n
        place(p, disc(on ? R * 2 : R * 1.6, on ? (lit(col) ? ink : 'role/chart-quiet') : 'role/well'), col * PITCH + PITCH / 2 - (on ? R : R * 0.8), row * PITCH + PITCH / 2 - (on ? R : R * 0.8))
      }
    }
    add(lane, p)
    add(c, lane)
  }
  const axis = await plot('Axis', W + 76, 16)
  for (const [i, chars] of ['00', '06', '12', '18', '24'].entries()) {
    const t = await text(chars, 'Mono/xs', 'role/fg-muted')
    place(axis, t, 76 + i * 6 * PITCH - (i === 0 ? 0 : i === 4 ? t.width : t.width / 2), 0)
  }
  add(c, axis)
}

function densityLanesSpec(): SetSpec {
  return {
    key: 'component:density-lanes',
    name: 'Density lanes',
    description:
      'DensityLanes in packages/ui, as a static example (alerts by hour, four sources): one lane per kind, each column swelling above and below the lane spine by its value on one scale, over a faint grid of role/well dots; the name and share at the start. Highlight=true keeps the off-hours in tone and quiets the rest to role/chart-quiet. In code the dots light column by column, and a marker flags one column through every lane.',
    variants: [false, true].map((highlight) => ({ props: { Highlight: String(highlight) }, build: (c: ComponentNode) => drawDensityLanes(c, highlight) })),
    properties: [],
    columns: 'Highlight',
    gap: [40, 16],
  }
}

/* ── Coverage matrix ───────────────────────────────────────────────────── */

const COVER_COLUMNS: [string, string][] = [
  ['Identity', 'role/chart-3'],
  ['Devices', 'role/chart-1'],
  ['Cloud', 'role/chart-5'],
  ['Mail', 'role/chart-4'],
  ['Network', 'role/chart-2'],
]
/** Rule depth per cell (0 is none), out of 4. */
const COVER_ROWS: [string, number[]][] = [
  ['Initial access', [3, 1, 1, 4, 2]],
  ['Execution', [1, 4, 2, 1, 0]],
  ['Credential access', [4, 2, 1, 1, 2]],
  ['Lateral movement', [1, 1, 0, 0, 2]],
  ['Exfiltration', [1, 1, 2, 1, 3]],
]

async function drawCoverageMatrix(c: ComponentNode, selected: boolean) {
  // The code's 32px cells on a 6px gap, the fill never under 18%.
  const CELL = 32
  const GAP = 6
  await style(c, { dir: 'col', gap: 'space/1', w: 'hug' })
  const head = await box({ name: 'Columns', dir: 'row', align: 'end', gap: GAP, pad: [0, 6, 0, 6] })
  add(head, await box({ name: 'Spacer', w: 132, h: 1 }))
  for (const [name, ink] of COVER_COLUMNS) {
    const t = await text(name, 'UI/sm/Regular', 'role/fg-muted', { name: 'Name' })
    t.rotation = 90
    add(head, await box({ name, dir: 'col', align: 'center', justify: 'end', gap: 6, w: CELL }, t, rect('Swatch', 8, 8, ink, 'radius/xs')))
  }
  add(c, head)
  for (const [name, values] of COVER_ROWS) {
    const lit = selected && name === 'Lateral movement'
    const row = await box({ name, dir: 'row', align: 'center', gap: GAP, pad: [4, 6, 4, 6], radius: 'radius/md', fill: lit ? 'role/selected' : undefined })
    add(row, await text(name, lit ? 'UI/base/Medium' : 'UI/base/Regular', lit ? 'role/fg' : 'role/fg-muted', { name: 'Label', w: 132 }))
    for (const [i, v] of values.entries()) {
      const ink = COVER_COLUMNS[i]![1]
      if (!v) {
        const h = await hatch('None', CELL, CELL, lit ? 'role/danger' : 'role/fg-subtle', 'radius/md')
        h.strokes = [solid(lit ? 'role/danger-line' : 'role/line-strong')]
        h.dashPattern = [3, 2]
        add(row, h)
        continue
      }
      const cell = await box({ name: 'Cell', dir: 'none', w: CELL, h: CELL, radius: 'radius/md', fill: [ink, 0.18], clip: true })
      const fh = Math.round(CELL * Math.max(0.18, v / 4))
      place(cell, rect('Fill', CELL, fh, ink, 'radius/md'), 0, CELL - fh)
      add(row, cell)
    }
    add(c, row)
  }
  const legend = await box({ name: 'Legend', dir: 'row', align: 'center', gap: 'space/4', pad: [8, 0, 0, 0] })
  add(legend, await box({ name: 'None', dir: 'row', align: 'center', gap: 6 }, await hatch('Swatch', 14, 14, 'role/fg-subtle', 'radius/xs'), await text('No rules', 'UI/sm/Regular', 'role/fg-muted')))
  add(legend, await box({ name: 'Depth', dir: 'row', align: 'center', gap: 6 }, rect('Swatch', 14, 14, 'role/band', 'radius/xs'), await text('Fill shows rule depth', 'UI/sm/Regular', 'role/fg-muted')))
  add(c, legend)
}

function coverageMatrixSpec(): SetSpec {
  return {
    key: 'component:coverage-matrix',
    name: 'Coverage matrix',
    description:
      'CoverageMatrix in packages/ui, as a static example (detection rules by tactic and source, out of 4): rows down the side, upright column names over a swatch, and in every cell a well in the column colour that fills from the bottom by depth (never under 18%); a cell with nothing is hatched with a dashed edge. Selected=true marks Lateral movement on role/selected with its gaps in role/danger. In code the fills rise row after row.',
    variants: [true, false].map((selected) => ({ props: { Selected: String(selected) }, build: (c: ComponentNode) => drawCoverageMatrix(c, selected) })),
    properties: [],
    columns: 'Selected',
    gap: [40, 16],
  }
}

/* ── Score ring ────────────────────────────────────────────────────────── */

async function drawScoreRing(c: ComponentNode, size: 'sm' | 'default' | 'lg') {
  // The code's 100-unit ring of 40 ticks (rest 40.5–46, lit 39–47, the head 36.5–49), at 64 / 96 / 128.
  const S = { sm: 64, default: 96, lg: 128 }[size]
  const k = S / 100
  const M = S / 2
  await style(c, { dir: 'col', w: S })
  const p = await plot('Ring', S, S)
  const n = 40
  const lit = 31
  for (let i = 0; i < n; i++) {
    const on = i < lit
    const [r0, r1] = i === lit - 1 ? [36.5, 49] : on ? [39, 47] : [40.5, 46]
    const a = (i / n) * 2 * Math.PI
    const x = (r: number) => r2(M + Math.sin(a) * r * k)
    const y = (r: number) => r2(M - Math.cos(a) * r * k)
    vector(p, `M${x(r0)},${y(r0)} L${x(r1)},${y(r1)}`, { stroke: solid(on ? 'role/success' : 'role/line-strong'), strokeWidth: (i === lit - 1 ? 2.6 : 2.2) * k }, on ? 'Lit tick' : 'Tick')
  }
  const grade = await text('B', { sm: 'Heading/xl', default: 'Heading/3xl', lg: 'Heading/4xl' }[size], 'role/fg', { name: 'Grade' })
  place(p, grade, M - grade.width / 2, M - grade.height / 2)
  add(c, p)
}

function scoreRingSpec(): SetSpec {
  return {
    key: 'component:score-ring',
    name: 'Score ring',
    description:
      'ScoreRing in packages/ui, as a static example (a security score of 77, grade B): a full ring of 40 radial ticks clockwise from the top, lit in the band tone (role/success for B) up to the score with the tick at the score reaching past the rest, the others role/line-strong, and the grade in the middle. Size sm, default and lg are 64, 96 and 128. In code the ticks light in turn as it scrolls into view, and busy turns a soft sweep inside the ring.',
    variants: (['sm', 'default', 'lg'] as const).map((size) => ({ props: { Size: size }, build: (c: ComponentNode) => drawScoreRing(c, size) })),
    properties: [],
    columns: 'Size',
    gap: [40, 16],
  }
}

/* ── Milestone ruler ───────────────────────────────────────────────────── */

/** A year's milestones: the day of the year, status, whether major, and how many share the pin. */
const MILESTONES_DRAWN: [number, 'done' | 'upcoming' | 'at-risk', boolean, number][] = [
  [39, 'done', false, 1],
  [90, 'done', false, 1],
  [154, 'done', true, 1],
  [242, 'done', false, 2],
  [300, 'at-risk', false, 1],
  [329, 'upcoming', true, 1],
]

async function drawMilestoneRuler(c: ComponentNode, callout: boolean) {
  // The code's 80px callout zone, 64px plot (stems 36 / 56, ticks 8 / 14, today 20) and month row, 416 wide.
  const W = 416
  const today = 285
  const xOf = (day: number) => Math.round(((day + 0.5) / 365) * W)
  await style(c, { dir: 'col', w: W })
  const zone = await plot('Callout zone', W, 80)
  if (callout) {
    const pin = xOf(300)
    const left = Math.max(0, Math.min(W - 224, pin - 112))
    const head = await box({ name: 'Date', dir: 'row', align: 'center', gap: 6 }, rect('Dot', 8, 8, 'role/warning', 'radius/full'), await eyebrow('Oct 28 · At risk', 'Date'))
    const card = await box(
      { name: 'Callout', dir: 'col', gap: 'space/0-5', pad: [8, 12], w: 224, radius: 'radius/lg', fill: 'role/overlay', stroke: 'role/line', effect: 'Shadow/md' },
      head,
      await text('SSO and audit log', 'UI/base/Medium', 'role/fg', { name: 'Title' }),
      await text('Waiting on the security review', 'UI/sm/Regular', 'role/fg-muted', { name: 'Description' }),
    )
    place(zone, card, left, 80 - 8 - card.height)
    const caret = rect('Caret', 8, 8, 'role/overlay')
    caret.rotation = 45
    place(zone, caret, pin, 80 - 8 - 2)
  }
  add(c, zone)
  const p = await plot('Plot', W, 64)
  for (let m = 0; m < 12; m++)
    for (let i = 0; i < 4; i++) {
      const x = Math.round(((m * 4 + i) / 48) * W)
      const h = i === 0 ? 14 : 8
      place(p, rect(i === 0 ? 'Month tick' : 'Tick', 1, h, x < xOf(today) ? 'role/fg-subtle' : 'role/line-strong'), x, 64 - h)
    }
  place(p, rect('Month tick', 1, 14, 'role/line-strong'), W - 1, 50)
  place(p, rect('Today', 2, 20, 'role/fg', 'radius/full'), xOf(today) - 1, 44)
  for (const [day, status, major, count] of MILESTONES_DRAWN) {
    const x = xOf(day)
    const shown = callout && day === 300
    const ink = status === 'at-risk' ? 'role/warning' : 'role/accent'
    const stem = major ? 56 : 36
    const d = major ? 12 : 10
    place(p, rect('Stem', 2, stem - d / 2, shown ? 'role/fg' : ink, 'radius/full'), x - 1, 64 - stem + d / 2)
    const dot = rect(status === 'upcoming' ? 'Upcoming' : 'Dot', d, d, status === 'upcoming' ? 'role/surface' : ink, 'radius/full')
    if (status === 'upcoming') {
      dot.strokes = [solid('role/accent')]
      dot.strokeWeight = 1.5
      dot.strokeAlign = 'INSIDE'
    }
    place(p, dot, x - d / 2, 64 - stem)
    if (count > 1) place(p, await text(String(count), 'Mono/xs', 'role/accent-text', { name: 'Count' }), x + d / 2 + 2, 64 - stem - 10)
  }
  add(c, p)
  const axis = await plot('Axis', W, 30)
  place(axis, rect('Today', 4, 4, 'role/fg', 'radius/full'), xOf(today) - 2, 6)
  for (const [m, name] of ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].entries()) {
    const t = await eyebrow(name, 'Month')
    place(axis, t, Math.round(((m + 0.5) / 12) * W - t.width / 2), 30 - t.height)
  }
  add(c, axis)
}

function milestoneRulerSpec(): SetSpec {
  return {
    key: 'component:milestone-ruler',
    name: 'Milestone ruler',
    description:
      'MilestoneRuler in packages/ui, as a static example (a product year seen on 13 October): each month cut in four by fine ticks, the first taller, role/fg-subtle before today and role/line-strong after it; a 2px role/fg tick and a dot under the ruler for today. Each milestone is a pin: a 2px stem and a dot, 56 tall when major and 36 otherwise, role/accent when done, a hollow role/accent ring when upcoming, role/warning when at risk; pins too close to tell apart share one with a Mono count. Callout=true shows the pointed callout (role/overlay, date and status as the eyebrow, title, one line) with its pin stem in role/fg. In code the pins rise left to right and the ticks near the pointer stretch.',
    variants: [true, false].map((callout) => ({ props: { Callout: String(callout) }, build: (c: ComponentNode) => drawMilestoneRuler(c, callout) })),
    properties: [],
    columns: 'Callout',
    gap: [40, 16],
  }
}

/* ── Calendar heatmap ──────────────────────────────────────────────────── */

const HEAT = [0, 0.3, 0.52, 0.76, 1]

async function drawHeatmap(c: ComponentNode, size: 'default' | 'sm') {
  const weeks = size === 'sm' ? 12 : 20
  const D = size === 'sm' ? 5 : 12
  const G = size === 'sm' ? 2 : 3
  const rnd = seeded(11)
  // Oldest week first; today is the third day of the last week, and the days after it are still to come.
  const state = (w: number, d: number) => {
    if (w === weeks - 1 && d > 2) return 'future'
    if (w === weeks - 1 && d === 2) return 'today'
    const x = rnd()
    if (x < 0.14) return 'missed'
    if (x < 0.18 && w > 4) return 'frozen'
    return 'done'
  }
  const grid = await plot('Grid', weeks * (D + G) - G, 7 * (D + G) - G)
  for (let w = 0; w < weeks; w++)
    for (let d = 0; d < 7; d++) {
      const s = state(w, d)
      const x = w * (D + G)
      const y = d * (D + G)
      if (s === 'frozen') {
        const h = await hatch('Frozen', D, D, 'role/chart-5', 'radius/full')
        place(grid, h, x, y)
        continue
      }
      const dot = rect(s === 'done' ? 'Done' : s === 'missed' ? 'Missed' : s === 'future' ? 'Future' : 'Today', D, D, null, 'radius/full')
      // A done day's heat: how much of the tone over the well.
      dot.fills = s === 'done' || s === 'today' ? [solid('role/well'), solid(['role/accent', HEAT[1 + Math.floor(rnd() * 4)]!])] : s === 'missed' ? [solid('role/well')] : []
      if (s === 'future') {
        dot.strokes = [solid(['role/fg', 0.09])]
        dot.strokeAlign = 'INSIDE'
      }
      if (s === 'today') {
        dot.strokes = [solid('role/accent')]
        dot.strokeWeight = 1.5
        dot.strokeAlign = 'OUTSIDE'
      }
      place(grid, dot, x, y)
    }
  if (size === 'sm') {
    await style(c, { dir: 'col', w: grid.width })
    add(c, grid)
    return
  }
  await style(c, { dir: 'col', gap: 'space/3', w: 'hug' })
  const months = await plot('Months', grid.width + 32, 16)
  for (const [w, m] of [[0, 'Jun'], [5, 'Jul'], [9, 'Aug'], [14, 'Sep'], [18, 'Oct']] as const) place(months, await eyebrow(m, 'Month'), 32 + w * (D + G), 0)
  const days = await plot('Weekdays', 28, grid.height)
  for (const [d, m] of [[1, 'Mon'], [3, 'Wed'], [5, 'Fri']] as const) place(days, await eyebrow(m, 'Weekday'), 0, d * (D + G) - 2)
  const body = await box({ name: 'Body', dir: 'row', gap: 4 }, days, grid)
  const legend = await box({ name: 'Legend', dir: 'row', align: 'center', gap: 'space/1-5' })
  add(legend, await eyebrow('Less', 'Less'))
  for (const [i, h] of HEAT.entries()) {
    const sw = rect('Heat', 10, 10, null, 'radius/full')
    sw.fills = i === 0 ? [solid('role/well')] : [solid('role/well'), solid(['role/accent', h])]
    add(legend, sw)
  }
  add(legend, await eyebrow('More', 'More'))
  const footer = await box(
    { name: 'Footer', dir: 'row', align: 'center', justify: 'between', gap: 'space/4', w: 'fill' },
    await box({ name: 'Readout', dir: 'row', gap: 'space/2' }, await text('Today', 'Mono/sm', 'role/fg'), await text('·', 'Mono/sm', 'role/fg-subtle'), await text('Not yet', 'Mono/sm', 'role/fg-muted')),
    legend,
  )
  add(c, months, body, footer)
}

function heatmapSpec(): SetSpec {
  return {
    key: 'component:calendar-heatmap',
    name: 'Calendar heatmap',
    description:
      'CalendarHeatmap in packages/ui, as a static example (20 weeks): a habit’s days as heat dots, a column per week and a row per weekday, months over the columns. A done day’s heat is the tone over the well by how much got done; a missed day is the well; a frozen day is hatched; days to come are empty rings and today is ringed in the accent. `size="sm"` is the dots-only mini grid for a list row. In code marking today pops the dot in with a ripple.',
    variants: (['default', 'sm'] as const).map((size) => ({ props: { Size: size }, build: (c: ComponentNode) => drawHeatmap(c, size) })),
    properties: [],
    columns: 'Size',
    gap: [48, 16],
  }
}

/* ── Forecast band ─────────────────────────────────────────────────────── */

async function drawForecast(c: ComponentNode, crosses: boolean) {
  const W = 560
  const H = 208
  await style(c, { dir: 'col', gap: 'space/4', w: W + 44 })
  const swatch = (name: string, node: SceneNode) => box({ name, dir: 'row', align: 'center', gap: 'space/2' }, node)
  const legend = await box({ name: 'Legend', dir: 'row', align: 'center', gap: 'space/4', wrap: 6, w: 'fill' })
  const items: [string, SceneNode][] = [
    ['Spent', rect('Swatch', 14, 2, 'role/fg', 'radius/full')],
    ['Forecast', await hatch('Swatch', 12, 12, 'role/accent', 2)],
    ['Likely range', rect('Swatch', 12, 12, ['role/accent', 0.3], 2)],
    ['Budget', rect('Swatch', 14, 1, 'role/line-strong')],
  ]
  for (const [name, node] of items) {
    const s = await swatch(name, node)
    add(s, await text(name, 'UI/sm/Regular', 'role/fg-muted'))
    add(legend, s)
  }
  const chart = await box({ name: 'Chart', dir: 'row', w: 'fill' })
  const yAxis = await plot('Y axis', 44, H)
  const p = await plot('Plot', W, H)
  const top = 24
  const ph = H - top
  const max = 12000
  const Y = (v: number) => top + ph - (v / max) * ph
  for (const v of [0, 4000, 8000, 12000]) {
    place(p, rect('Grid', W, 1, 'role/line-subtle'), 0, Y(v))
    place(yAxis, await text(v ? `$${v / 1000}k` : '$0', 'Mono/xs', 'role/fg-muted', { name: 'Tick' }), 4, Y(v) - 7)
  }
  const days = 30
  const today = 18
  const X = (d: number) => (d / days) * W
  const spent = Array.from({ length: today + 1 }, (_, d) => 320 * d + 140 * Math.sin(d / 2.4))
  const rate = crosses ? 420 : 300
  const fc = Array.from({ length: days - today + 1 }, (_, i) => spent[today]! + rate * i)
  const spentPts: [number, number][] = spent.map((v, d) => [X(d), Y(v)])
  const fcPts: [number, number][] = fc.map((v, i) => [X(today + i), Y(v)])
  const pathOf = (pts: [number, number][]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${r2(x)},${r2(y)}`).join(' ')
  // The faint wash under what's spent, the range and the projected area from today.
  vector(p, `${pathOf(spentPts)} L${r2(X(today))},${r2(Y(0))} L0,${r2(Y(0))} Z`, { fill: solid(['role/fg', 0.06]) }, 'Spent wash')
  vector(p, `${pathOf(fcPts)} L${r2(X(days))},${r2(Y(0))} L${r2(X(today))},${r2(Y(0))} Z`, { fill: solid(['role/accent', 0.08]) }, 'Projected')
  const hiPts = fc.map((v, i) => [X(today + i), Y(v * (1 + i * 0.012))] as [number, number])
  const loPts = fc.map((v, i) => [X(today + i), Y(v * (1 - i * 0.012))] as [number, number])
  vector(p, `${pathOf(hiPts)} ${loPts.reverse().map(([x, y]) => `L${r2(x)},${r2(y)}`).join(' ')} Z`, { fill: solid(['role/accent', 0.18]) }, 'Range')
  const budget = 10000
  const line = vector(p, `M0,${r2(Y(budget))} L${W},${r2(Y(budget))}`, { stroke: solid('role/line-strong'), strokeWidth: 1 }, 'Budget') as VectorNode
  line.dashPattern = [4, 3]
  line.strokeCap = 'NONE'
  vector(p, pathOf(spentPts), { stroke: solid('role/fg'), strokeWidth: 1.75 }, 'Spent')
  const f = vector(p, pathOf(fcPts), { stroke: solid('role/accent'), strokeWidth: 1.75 }, 'Forecast') as VectorNode
  f.dashPattern = [4, 3]
  place(p, rect('Today', 1, ph, 'role/line-strong'), X(today), top)
  const label = await eyebrow('Today', 'Today label')
  place(p, label, X(today) - label.width / 2, 4)
  if (crosses) {
    const d = today + (budget - spent[today]!) / rate
    const ring = disc(10, 'role/surface', 'Crossing')
    ring.strokes = [solid('role/danger')]
    ring.strokeWeight = 2
    place(p, ring, X(d) - 5, Y(budget) - 5)
    const flag = await box(
      { name: 'Flag', dir: 'row', align: 'baseline', gap: 'space/1-5', pad: [2, 6], radius: 'radius/xs', fill: 'role/danger-subtle' },
      await text('Over budget', 'UI/xs/Medium', 'role/danger-text', { name: 'Name' }),
      await text('Oct 26', 'Mono/xs', 'role/danger-text', { name: 'Value' }),
    )
    place(p, flag, X(d) - flag.width - 8, Y(budget) - 30)
  }
  add(chart, yAxis, p)
  const xAxis = await plot('X axis', W + 44, 16)
  for (const [d, chars] of [[0, 'Oct 1'], [10, 'Oct 11'], [20, 'Oct 21'], [30, 'Oct 31']] as const) place(xAxis, await text(chars, 'Mono/xs', 'role/fg-muted', { name: 'Tick' }), 44 + Math.min(X(d), W - 36), 0)
  add(c, legend, await box({ name: 'Plot area', dir: 'col', gap: 'space/2', w: 'fill' }, chart, xAxis))
}

function forecastSpec(): SetSpec {
  return {
    key: 'component:forecast-band',
    name: 'Forecast band',
    description:
      'ForecastBand in packages/ui, as a static example (a month’s spend): spend so far as a solid ink line over a faint wash, and from today the forecast as a dashed line in its tone inside its likely range over the projected area. The budget is a dashed line; where the forecast crosses it, a marker names the day. In code the actual line draws in to today, the forecast wipes on and the crossing ring pulses once. The projected hatch is a flat wash here.',
    variants: [true, false].map((crosses) => ({ props: { Crosses: String(crosses) }, build: (c: ComponentNode) => drawForecast(c, crosses) })),
    properties: [],
    columns: 'Crosses',
    gap: [48, 16],
  }
}

/* ── Level matrix ──────────────────────────────────────────────────────── */

const LEVELS = ['none', 'read', 'write', 'admin'] as const
type Level = (typeof LEVELS)[number]
const ROLES: [string, string, Level[], (Level | null)[]][] = [
  ['Owner', 'Everything', ['admin', 'admin', 'admin', 'admin'], [null, null, null, null]],
  ['Editor', 'Content team', ['write', 'write', 'read', 'none'], [null, 'admin', null, null]],
  ['Viewer', 'Everyone else', ['read', 'read', 'none', 'none'], [null, null, null, null]],
  ['Billing', 'Finance', ['none', 'read', 'read', 'write'], ['read', null, null, 'read']],
]

async function segments(level: Level, was: Level) {
  const now = LEVELS.indexOf(level)
  const before = LEVELS.indexOf(was)
  const s = await box({ name: 'Segments', dir: 'row', gap: 3 })
  for (let i = 1; i <= 3; i++) {
    const state = i <= Math.min(now, before) ? 'on' : i <= now ? 'gain' : i <= before ? 'loss' : 'off'
    const seg = rect(`Segment ${state}`, 10, 10, state === 'on' ? 'role/fg' : state === 'gain' ? 'role/success' : state === 'off' ? 'role/well' : null, 2)
    if (state === 'loss') {
      seg.strokes = [solid('role/danger')]
      seg.strokeWeight = 1.5
      seg.strokeAlign = 'INSIDE'
    }
    add(s, seg)
  }
  return s
}

async function drawLevelMatrix(c: ComponentNode, pending: boolean, deps: Deps) {
  const resources = ['Docs', 'Projects', 'Members', 'Billing']
  await style(c, { dir: 'col', w: 640, ...surfaceLook(), clip: true })
  if (pending) {
    const bar = await box({ name: 'Bulk bar', dir: 'row', align: 'center', gap: 'space/2', pad: [10, 20], w: 'fill', stroke: 'role/line', sides: { bottom: 1 } })
    add(bar, await text('3 selected', 'Mono/sm', 'role/fg-muted', { name: 'Selected', w: 'fill' }))
    for (const l of ['Read', 'Write', 'Admin']) add(bar, button(deps.get, l, { Variant: 'secondary', Size: 'xs' }))
    add(c, bar)
  }
  const head = await box({ name: 'Head', dir: 'row', w: 'fill', stroke: 'role/line', sides: { bottom: 1 } })
  add(head, await box({ name: 'Corner', dir: 'row', pad: [10, 12, 10, 20], w: 160 }))
  for (const r of resources) add(head, await box({ name: r, dir: 'row', pad: [10, 12], w: 'fill' }, await eyebrow(r, 'Resource')))
  add(c, head)
  for (const [ri, [role, detail, levels, was]] of ROLES.entries()) {
    const row = await box({ name: role, dir: 'row', align: 'center', w: 'fill', stroke: ri < ROLES.length - 1 ? 'role/line' : undefined, sides: ri < ROLES.length - 1 ? { bottom: 1 } : undefined })
    add(row, await box({ name: 'Role', dir: 'col', pad: [8, 12, 8, 20], w: 160 }, await text(role, 'UI/base/Regular', 'role/fg'), await text(detail, 'UI/sm/Regular', 'role/fg-muted')))
    for (const [i, level] of levels.entries()) {
      const before = (pending && was[i]) || level
      const change = before === level ? null : LEVELS.indexOf(level) > LEVELS.indexOf(before) ? 'gain' : 'loss'
      const words = await box({ name: 'Level', dir: 'col' })
      add(words, await text(level === 'none' ? '—' : level[0]!.toUpperCase() + level.slice(1), 'Mono/sm', change === 'gain' ? 'role/success-text' : change === 'loss' ? 'role/danger-text' : level === 'none' ? 'role/fg-muted' : 'role/fg', { name: 'Level' }))
      if (change) {
        const old = await text(before[0]!.toUpperCase() + before.slice(1), 'Mono/xs', 'role/fg-muted', { name: 'Was' })
        old.textDecoration = 'STRIKETHROUGH'
        add(words, old)
      }
      add(row, await box({ name: 'Cell', dir: 'row', align: 'center', gap: 'space/2-5', pad: [8, 12], w: 'fill' }, await segments(level, before), words))
    }
    add(c, row)
  }
}

function levelMatrixSpec(deps: Deps): SetSpec {
  return {
    key: 'component:level-matrix',
    name: 'Level matrix',
    description:
      'LevelMatrix in packages/ui: who can do what, roles down the side and resources across the top, and in every cell an access level (none, read, write, admin) as three segments lit to the level, its word in mono. Pending changes show in the cell until they’re applied: gained segments in success, lost ones a hollow danger outline, the old level struck through under the new; a bulk bar sets every selected cell. In code segments light one after another.',
    variants: [false, true].map((pending) => ({ props: { Pending: String(pending) }, build: (c: ComponentNode) => drawLevelMatrix(c, pending, deps) })),
    properties: [],
    columns: 'Pending',
    gap: [40, 16],
  }
}

/* ── History strip ─────────────────────────────────────────────────────── */

async function drawHistoryStrip(c: ComponentNode, size: 'default' | 'sm') {
  const sm = size === 'sm'
  const days = sm ? 30 : 90
  const W = sm ? 180 : 560
  const H = sm ? 14 : 40
  const gap = sm ? 1 : 2
  await style(c, { dir: 'col', w: W })
  const rnd = seeded(23)
  const strip = await box({ name: 'Strip', dir: 'row', gap, w: W, h: H + (sm ? 0 : 6) })
  const cw = (W - gap * (days - 1)) / days
  for (let i = 0; i < days; i++) {
    const x = rnd()
    // At or above target the success tone; below it warning, then danger; no data a dim well.
    const ink: Ink = i < (sm ? 0 : 6) ? 'role/well' : x < 0.04 ? 'role/danger' : x < 0.1 ? 'role/warning' : 'role/success'
    const cell = await box({ name: 'Day', dir: 'col', gap: sm ? 0 : 2, w: cw, h: 'fill' })
    if (!sm) {
      const pip = await box({ name: 'Pip slot', dir: 'row', justify: 'center', w: 'fill', h: 4 })
      if (ink === 'role/danger' || ink === 'role/warning') add(pip, disc(4, ink, 'Pip'))
      add(cell, pip)
    }
    const bar = rect('Bar', cw, H, ink, sm ? 1 : 2)
    add(cell, bar)
    bar.layoutGrow = 1
    bar.layoutAlign = 'STRETCH'
    add(strip, cell)
  }
  add(c, strip)
  if (sm) return
  const axis = await box({ name: 'Axis', dir: 'row', align: 'center', gap: 'space/3', pad: [10, 0, 0, 0], w: 'fill' })
  const rule = rect('Rule', 10, 1, 'role/line')
  add(axis, await text('90 days ago', 'Mono/xs', 'role/fg-muted', { name: 'Start' }), rule, await text('Today', 'Mono/xs', 'role/fg-muted', { name: 'End' }))
  rule.layoutGrow = 1
  add(c, axis)
}

function historyStripSpec(): SetSpec {
  return {
    key: 'component:history-strip',
    name: 'History strip',
    description:
      'HistoryStrip in packages/ui, as a static example (90 days of uptime): one slim cell per day, oldest at the inline start. At or above the target a day is the success tone; below it slides through warning toward danger; a day without data is a dim well, and a day with an incident carries a pip. `size="sm"` is the mini strip for a list row. In code the cells rise oldest to newest and a day under the pointer lifts with its tooltip.',
    variants: (['default', 'sm'] as const).map((size) => ({ props: { Size: size }, build: (c: ComponentNode) => drawHistoryStrip(c, size) })),
    properties: [],
    columns: 'Size',
    gap: [48, 16],
  }
}

/* ── Route map ─────────────────────────────────────────────────────────── */

async function drawRouteMap(c: ComponentNode, proposal: boolean) {
  const W = 560
  const H = 340
  // The map's ground: the canvas in dark, the surface in light (role/canvas reads as both here).
  await style(c, { dir: 'none', w: W, h: H, radius: 'radius/xl', fill: 'role/canvas', stroke: 'role/line', clip: true })
  const water = vector(c, `M0,250 C80,230 140,280 230,300 C300,315 330,${H} 360,${H} L0,${H} Z`, { fill: solid('role/surface') }, 'Water') as VectorNode
  water.fills = [solid('role/surface'), solid(['role/fg', 0.09]), solid(['role/accent', 0.06])]
  vector(c, 'M380,40 C430,30 500,50 520,90 C540,130 470,150 420,130 C380,115 360,70 380,40 Z', { fill: solid(['role/success', 0.09]) }, 'Park')
  for (const d of ['M0,120 L560,90', 'M200,0 L240,340', 'M0,200 C150,190 300,170 560,210', 'M420,0 C410,120 440,220 470,340']) {
    vector(c, d, { stroke: solid('role/line'), strokeWidth: 4 }, 'Road edge')
    vector(c, d, { stroke: solid('role/canvas'), strokeWidth: 1.5 }, 'Road')
  }
  const pts: [number, number][] = [
    [60, 280],
    [140, 196],
    [230, 170],
    [330, 180],
    [430, 150],
    [500, 70],
  ]
  const seg = (a: number, b: number) => monotone(pts.slice(a, b + 1))
  const route = (d: string, ink: string, width: number, name: string) => {
    vector(c, d, { stroke: solid('role/canvas'), strokeWidth: 7 }, `${name} halo`)
    return vector(c, d, { stroke: solid(ink), strokeWidth: width }, name) as VectorNode
  }
  route(seg(0, 2), 'role/line-strong', 2.5, 'Driven')
  route(seg(2, 3), 'role/fg', 3, 'On time')
  route(seg(3, 5), 'role/danger', 3, 'Delayed')
  if (proposal) {
    const alt = vector(c, monotone([[330, 180], [380, 250], [470, 230], [500, 70]]), { stroke: solid('role/accent'), strokeWidth: 2.5 }, 'Proposed') as VectorNode
    alt.dashPattern = [0.01, 6]
  }
  const marker = async (kind: 'origin' | 'stop' | 'destination' | 'current', [x, y]: [number, number]) => {
    const px = kind === 'current' ? 28 : 14
    const m = rect(kind, px, px, kind === 'origin' ? 'role/fg' : kind === 'current' ? 'role/accent' : 'role/surface', 'radius/full')
    m.strokes = [solid(kind === 'current' ? 'role/surface' : 'role/fg')]
    m.strokeWeight = kind === 'current' ? 3 : kind === 'destination' ? 2.5 : 2
    m.strokeAlign = kind === 'current' ? 'OUTSIDE' : 'INSIDE'
    if (kind === 'origin') m.strokes = []
    place(c, m, x - px / 2, y - px / 2)
    if (kind === 'destination') place(c, disc(5, 'role/fg', 'Centre'), x - 2.5, y - 2.5)
    if (kind === 'current') place(c, disc(10, 'role/on-accent', 'Centre'), x - 5, y - 5)
  }
  await marker('origin', pts[0]!)
  await marker('stop', pts[2]!)
  await marker('current', pts[3]!)
  await marker('destination', pts[5]!)
  const card = await box({ name: 'Card', dir: 'col', gap: 'space/0-5', pad: 10, radius: 'radius/lg', fill: 'role/overlay', stroke: 'role/line', effect: 'Shadow/md' })
  add(card, await text(proposal ? 'Reroute via Harbor St' : 'Arrives 14:32', 'UI/sm/Medium', 'role/fg', { name: 'Title' }), await text(proposal ? 'Saves 12 min' : '18 min late', 'UI/sm/Regular', proposal ? 'role/accent-text' : 'role/danger-text', { name: 'Detail' }))
  place(c, card, proposal ? 40 : 350, proposal ? 40 : 196)
  const legend = await box({ name: 'Legend', dir: 'row', align: 'center', gap: 'space/3', pad: [6, 12], radius: 'radius/full', fill: ['role/overlay', 0.9], stroke: 'role/line', effect: 'Shadow/xs' })
  for (const [name, ink] of [['Driven', 'role/line-strong'], ['On time', 'role/fg'], ['Delayed', 'role/danger'], ...(proposal ? [['Proposed', 'role/accent']] : [])] as const)
    add(legend, await box({ name, dir: 'row', align: 'center', gap: 'space/1-5' }, rect('Swatch', 16, 3, ink, 'radius/full'), await text(name, 'UI/xs/Regular', 'role/fg')))
  place(c, legend, 12, H - 12 - 30)
}

function routeMapSpec(): SetSpec {
  return {
    key: 'component:route-map',
    name: 'Route map',
    description:
      'RouteMap in packages/ui, as a static example: a route on a drawn map with no tiles (water, a park and roads as abstract shapes in the theme’s tones), the route a smooth line in its state (driven quiet, on time ink, delayed danger, proposed a dotted accent line), markers by kind (origin, stop, destination, and the current position in the accent) and a card anchored beside a stop. In code the lines draw from the origin and the current ring pulses.',
    variants: [false, true].map((proposal) => ({ props: { Proposal: String(proposal) }, build: (c: ComponentNode) => drawRouteMap(c, proposal) })),
    properties: [],
    columns: 'Proposal',
    gap: [40, 16],
  }
}

/* ── Seat map ──────────────────────────────────────────────────────────── */

const TIERS: [string, string, string][] = [
  ['Front', 'role/chart-1', '€68'],
  ['Middle', 'role/chart-2', '€48'],
  ['Back', 'role/chart-3', '€32'],
]

async function seatShape(px: number) {
  // rounded-t-[42%] rounded-b-[22%]: a seat back, a flatter front.
  const s = await box({ name: 'Seat', dir: 'row', align: 'center', justify: 'center', w: px, h: px })
  s.topLeftRadius = s.topRightRadius = Math.round(px * 0.42)
  s.bottomLeftRadius = s.bottomRightRadius = Math.round(px * 0.22)
  return s
}

async function drawSeatMap(c: ComponentNode, deps: Deps, picked: boolean) {
  const S = 22
  await style(c, { dir: 'col', align: 'center', gap: 'space/5', w: 'hug' })
  const stage = await plot('Stage', 300, 36)
  vector(stage, 'M0,4 Q150,30 300,4 L300,0 L0,0 Z', { fill: solid(['role/fg', 0.08]), stroke: solid(['role/fg', 0.16]) }, 'Stage shape')
  const stageLabel = await text('STAGE', 'Mono/xs', 'role/fg-muted', { name: 'Stage label' })
  stageLabel.letterSpacing = { unit: 'PERCENT', value: 30 }
  place(stage, stageLabel, 150 - stageLabel.width / 2, 2)
  add(c, stage)
  const rows = await box({ name: 'Rows', dir: 'col', align: 'center', gap: Math.round(S * 0.3) })
  const rnd = seeded(5)
  const check = pick(deps.icons, 'check').rest
  for (const [r, letter] of ['A', 'B', 'C', 'D', 'E', 'F'].entries()) {
    const [, ink] = TIERS[r < 2 ? 0 : r < 4 ? 1 : 2]!
    const row = await box({ name: `Row ${letter}`, dir: 'row', align: 'center', gap: 4 })
    add(row, await text(letter, 'Mono/xs', 'role/fg-muted', { name: 'Row label', w: 20, align: 'CENTER' }))
    for (let i = 0; i < 14; i++) {
      if (i === 3 || i === 11) add(row, await box({ name: 'Aisle', w: Math.round(S * 0.9), h: 1 }))
      const seat = await seatShape(S)
      const taken = rnd() < 0.22
      const on = picked && r === 2 && (i === 6 || i === 7)
      if (taken) {
        seat.fills = [solid(['role/fg', 0.07])]
      } else if (on) {
        seat.fills = [solid(ink)]
        add(seat, iconInstance(check, 14, 'role/on-accent'))
      } else {
        seat.fills = [solid([ink, 0.26])]
        seat.strokes = [solid([ink, 0.55])]
        seat.strokeAlign = 'INSIDE'
      }
      add(row, seat)
    }
    add(row, await text(letter, 'Mono/xs', 'role/fg-muted', { name: 'Row label', w: 20, align: 'CENTER' }))
    add(rows, row)
  }
  add(c, rows)
  const legend = await box({ name: 'Legend', dir: 'row', align: 'center', gap: 'space/5' })
  for (const [name, ink, price] of TIERS) {
    const sw = await seatShape(12)
    sw.fills = [solid([ink, 0.26])]
    sw.strokes = [solid([ink, 0.55])]
    add(legend, await box({ name, dir: 'row', align: 'center', gap: 'space/2' }, sw, await text(name, 'UI/sm/Regular', 'role/fg-muted'), await text(price, 'Mono/sm', 'role/fg')))
  }
  const sw = await seatShape(12)
  sw.fills = [solid(['role/fg', 0.07])]
  add(legend, await box({ name: 'Unavailable', dir: 'row', align: 'center', gap: 'space/2' }, sw, await text('Unavailable', 'UI/sm/Regular', 'role/fg-muted')))
  add(c, legend)
}

function seatMapSpec(deps: Deps): SetSpec {
  return {
    key: 'component:seat-map',
    name: 'Seat map',
    description:
      'SeatMap in packages/ui, as a static example: a venue from above, the stage at the top, rows of seats split by aisles with the row’s letter at both ends. Every seat takes its price tier’s colour (a 26% fill on a 55% edge); taken seats are dimmed; picked seats fill with their tier and carry a check. The legend names the tiers and prices. In code hovering raises a chip with the seat’s row, number and price.',
    variants: [false, true].map((picked) => ({ props: { Picked: String(picked) }, build: (c: ComponentNode) => drawSeatMap(c, deps, picked) })),
    properties: [],
    columns: 'Picked',
    gap: [48, 16],
  }
}

/* ── Proposal card ─────────────────────────────────────────────────────── */

async function drawProposal(c: ComponentNode, status: 'pending' | 'approved', deps: Deps) {
  await style(c, { dir: 'col', gap: 'space/3', pad: 16, w: 360, radius: 'radius/xl', fill: 'role/surface', stroke: 'role/line', effect: 'Shadow/xs' })
  const head = await box({ name: 'Header', dir: 'col', gap: 'space/1', w: 'fill' })
  const source = await text('ROUTING AGENT', 'Mono/xs', 'role/accent-text', { name: 'Source' })
  source.letterSpacing = { unit: 'PERCENT', value: 2.5 }
  add(head, source, ref(await text('Reroute truck 12 around the closure', 'UI/base/Semibold', 'role/fg', { name: 'Title', w: 'fill' }), 'Title'), await text('Harbor Bridge is closed until 18:00.', 'UI/sm/Regular', 'role/fg-muted', { name: 'Description', w: 'fill' }))
  const options = await box({ name: 'Options', dir: 'col', gap: 'space/1-5', w: 'fill' })
  const approved = status === 'approved'
  for (const [name, detail, value, proposed] of [
    ['Current route', '+47 min', '15:20', false],
    ['Via Harbor St', '−12 min of delay', '14:33', true],
  ] as const) {
    const muted = approved && !proposed
    const row = await box({
      name: proposed ? 'Proposed' : 'Option',
      dir: 'row',
      align: 'center',
      justify: 'between',
      gap: 'space/3',
      pad: [8, 12],
      w: 'fill',
      radius: 'radius/lg',
      fill: proposed ? 'role/accent-subtle' : undefined,
      stroke: proposed ? 'role/accent-line' : undefined,
    })
    if (proposed && !approved) row.dashPattern = [4, 3]
    const v = await text(value, 'Mono/base', muted ? 'role/fg-muted' : proposed ? 'role/accent-text' : 'role/danger-text', { name: 'Value' })
    if (muted) v.textDecoration = 'STRIKETHROUGH'
    add(row, await box({ name: 'Text', dir: 'col' }, await text(name, 'UI/sm/Regular', muted ? 'role/fg-muted' : 'role/fg'), await text(detail, 'Mono/xs', muted ? 'role/fg-muted' : proposed ? 'role/accent-text' : 'role/danger-text', { name: 'Detail' })), v)
    add(options, row)
  }
  const facts = await box({ name: 'Facts', dir: 'row', gap: 'space/3', pad: [10, 12], w: 'fill' })
  for (const [label, value, ink] of [['Time saved', '12 min', 'role/success-text'], ['Extra distance', '3.4 km', 'role/fg'], ['Window', 'Kept', 'role/fg']] as const)
    add(facts, await box({ name: label, dir: 'col', w: 'fill' }, await text(value, 'Mono/base', ink, { name: 'Value' }), await text(label, 'UI/xs/Regular', 'role/fg-muted', { name: 'Label' })))
  add(c, head, options, facts)
  if (approved) add(c, await text('Approved by Mira Chen · 14:02', 'UI/sm/Regular', 'role/fg-muted', { name: 'Resolution' }))
  else add(c, await box({ name: 'Actions', dir: 'row', gap: 'space/2' }, button(deps.get, 'Approve', { Size: 'sm' }), button(deps.get, 'Compare', { Variant: 'secondary', Size: 'sm' }), button(deps.get, 'Dismiss', { Variant: 'ghost', Size: 'sm' })))
}

function proposalSpec(deps: Deps): SetSpec {
  return {
    key: 'component:proposal-card',
    name: 'Proposal card',
    description:
      'ProposalCard in packages/ui: a change someone (or an agent) proposes and a person decides on. Where it came from in mono accent capitals, what it is, then the options side by side, each with a figure in mono and how it moves; the proposed one is a dashed accent outline. Facts add the impact; actions hold your buttons. Approved, the proposed row turns solid, the others step back and the actions fold away for the resolution.',
    variants: (['pending', 'approved'] as const).map((status) => ({ props: { Status: status }, build: (c: ComponentNode) => drawProposal(c, status, deps) })),
    properties: [{ name: 'Title', type: 'TEXT', default: 'Reroute truck 12 around the closure', field: 'characters' }],
    columns: 'Status',
    gap: [40, 16],
  }
}

/* ── Composites: shared bits ───────────────────────────────────────────── */

/** A Checkbox instance with its label hidden, as tables use it. */
function checkbox(deps: Deps, checked: 'true' | 'false' | 'indeterminate' = 'false') {
  const i = instance(deps.get, 'checkbox', { Checked: checked, State: 'rest' })
  const key = Object.keys(i.componentProperties).find((k) => k.split('#')[0] === 'Show label')
  if (key) i.setProperties({ [key]: false })
  return i
}

/** Sets a text property on an instance by name. */
function setText(i: InstanceNode, property: string, value: string) {
  const key = Object.keys(i.componentProperties).find((k) => k.split('#')[0] === property)
  if (key) i.setProperties({ [key]: value })
  return i
}

/** The zoom corner the canvases share: −, the percentage, +, a hairline, fit, on a floating overlay. */
async function zoomControls(deps: Deps) {
  const ctl = await box({ name: 'Controls', dir: 'row', align: 'center', gap: 'space/0-5', pad: 2, radius: 'radius/xl', fill: ['role/overlay', 0.9], stroke: 'role/line', effect: 'Shadow/xs' })
  const square = async (glyph: string) => box({ name: glyph, dir: 'row', align: 'center', justify: 'center', w: 28, h: 28, radius: 'radius/lg' }, icon(deps.icons, glyph, 14, 'role/fg-muted'))
  add(ctl, await square('minus'), await text('100%', 'Mono/xs', 'role/fg-muted', { name: 'Zoom', w: 40, align: 'CENTER' }), await square('plus'), rect('Rule', 1, 16, 'role/line'), await square('maximize'))
  return ctl
}

/** A dot grid as one vector: tiny discs every `pitch` px. */
function dotGrid(parent: FrameNode | ComponentNode, w: number, h: number, pitch: number, ink: Ink) {
  const d: string[] = []
  for (let y = pitch / 2; y < h; y += pitch) for (let x = pitch / 2; x < w; x += pitch) d.push(`M${r2(x - 0.75)},${r2(y)} a0.75,0.75 0 1,0 1.5,0 a0.75,0.75 0 1,0 -1.5,0`)
  vector(parent, d.join(' '), { fill: solid(ink) }, 'Dot grid')
}

/* ── Data table ────────────────────────────────────────────────────────── */

const TABLE_COLS = [
  { name: 'Customer', w: 200 },
  { name: 'Status', w: 120 },
  { name: 'Plan', w: 100 },
  { name: 'MRR', w: 100, end: true },
]
const TABLE_ROWS: [string, string, string, string, string, boolean][] = [
  ['Acme Inc', 'success', 'Active', 'Scale', '$4,200', false],
  ['Globex', 'warning', 'Past due', 'Pro', '$1,150', true],
  ['Initech', 'success', 'Active', 'Pro', '$980', true],
  ['Umbrella', 'secondary', 'Trial', 'Starter', '$0', false],
  ['Hooli', 'danger', 'Churned', 'Scale', '$0', false],
]

async function drawDataTable(c: ComponentNode, deps: Deps, selection: boolean) {
  const W = 44 + TABLE_COLS.reduce((n, col) => n + col.w, 0) + 48
  await style(c, { dir: 'col', gap: 'space/3', w: W })
  const search = instance(deps.get, 'input', { State: 'rest', Content: 'placeholder' })
  setText(search, 'Placeholder', 'Filter customers…')
  const toolbar = await box({ name: 'Toolbar', dir: 'row', align: 'center', gap: 'space/2', w: 'fill' })
  add(toolbar, search, button(deps.get, 'Status', { Variant: 'outline', Size: 'sm' }), button(deps.get, 'Plan', { Variant: 'outline', Size: 'sm' }), await spacerBox(), button(deps.get, 'View', { Variant: 'outline', Size: 'sm' }))
  search.resize(240, search.height)
  const table = await box({ name: 'Table', dir: 'col', w: 'fill', ...surfaceLook(), effect: undefined, radius: 'radius/lg', clip: true })
  const cell = async (w: number | 'fill', end = false, ...kids: SceneNode[]) => {
    const f = await box({ name: 'Cell', dir: 'row', align: 'center', justify: end ? 'end' : 'start', gap: 'space/1', pad: [0, 12], w: typeof w === 'number' ? w : 'fill', h: 'fill' })
    add(f, ...kids)
    return f
  }
  const head = await box({ name: 'Head', dir: 'row', w: 'fill', h: 36, stroke: 'role/line', sides: { bottom: 1 } })
  add(head, await cell(44, false, checkbox(deps, selection ? 'indeterminate' : 'false')))
  for (const [i, col] of TABLE_COLS.entries()) {
    const label = bezel() ? await eyebrow(col.name, 'Head') : await text(col.name, 'UI/sm/Medium', 'role/fg-muted', { name: 'Head' })
    add(head, await cell(col.w, col.end, label, ...(i === 3 ? [icon(deps.icons, 'arrow-down', 12, 'role/fg-muted')] : [])))
  }
  add(head, await cell('fill'))
  add(table, head)
  for (const [ri, [name, tone, word, plan, mrr, sel]] of TABLE_ROWS.entries()) {
    const on = selection && sel
    const row = await box({ name: on ? 'Row (selected)' : 'Row', dir: 'row', w: 'fill', h: 44, fill: on ? 'role/accent-subtle' : undefined, stroke: ri < TABLE_ROWS.length - 1 ? 'role/line' : undefined, sides: ri < TABLE_ROWS.length - 1 ? { bottom: 1 } : undefined })
    add(
      row,
      await cell(44, false, checkbox(deps, on ? 'true' : 'false')),
      await cell(200, false, await text(name, 'UI/base/Medium', 'role/fg')),
      await cell(120, false, badge(deps.get, word, tone)),
      await cell(100, false, await text(plan, 'UI/base/Regular', 'role/fg-muted')),
      await cell(100, true, await text(mrr, bezel() ? 'Mono/sm' : 'UI/base/Regular', 'role/fg')),
      await cell('fill', true, icon(deps.icons, 'more-horizontal', 16, 'role/fg-subtle')),
    )
    add(table, row)
  }
  add(c, toolbar, table)
  if (selection) {
    const bar = await box({ name: 'Selection bar', dir: 'row', align: 'center', gap: 'space/2', pad: [6, 6, 6, 14], radius: 'radius/xl', fill: 'role/overlay', stroke: 'role/line', effect: 'Shadow/md' })
    add(bar, await text('2 selected', 'UI/base/Medium', 'role/fg', { name: 'Count' }), rect('Rule', 1, 16, 'role/line'), button(deps.get, 'Export', { Variant: 'ghost', Size: 'sm' }), button(deps.get, 'Delete', { Variant: 'danger', Size: 'sm' }))
    add(c, await box({ name: 'Selection', dir: 'row', justify: 'center', w: 'fill' }, bar))
  }
  const pager = await box({ name: 'Pagination', dir: 'row', align: 'center', justify: 'between', pad: [8, 12], w: 'fill' })
  const nav = await box({ name: 'Pages', dir: 'row', align: 'center', gap: 'space/0-5' })
  for (const g of ['chevrons-left', 'chevron-left', 'chevron-right', 'chevrons-right']) {
    const b = button(deps.get, '', { Variant: 'ghost', Size: 'icon-sm' })
    swapIcon(b, pick(deps.icons, g).rest)
    add(nav, b)
  }
  add(
    pager,
    await box({ name: 'Range', dir: 'row', gap: 'space/1' }, await text('1–5', 'UI/sm/Regular', 'role/fg'), await text('of 128 rows', 'UI/sm/Regular', 'role/fg-muted')),
    await box({ name: 'Page', dir: 'row', align: 'center', gap: 'space/5' }, await box({ name: 'Page', dir: 'row', gap: 'space/1' }, await text('Page', 'UI/sm/Regular', 'role/fg-muted'), await text('1', 'UI/sm/Regular', 'role/fg'), await text('of 26', 'UI/sm/Regular', 'role/fg-muted')), nav),
  )
  add(c, pager)
}

const spacerBox = () => box({ name: 'Spacer', w: 'fill', h: 1 })

function dataTableSpec(deps: Deps): SetSpec {
  return {
    key: 'component:data-table',
    name: 'Data table',
    description:
      'The data table kit in packages/ui (TanStack Table), as a representative frame: a toolbar with a filter field and faceted filters, a table whose head row sorts (the arrow on the sorted column) with a select column, rows of Checkbox, Badge and figure cells, and the pagination footer. Selection lights the rows in the accent wash and floats the selection bar. The complete tables are blocks; build yours from these instances.',
    variants: [false, true].map((selection) => ({ props: { Selection: String(selection) }, build: (c: ComponentNode) => drawDataTable(c, deps, selection) })),
    properties: [],
    columns: 'Selection',
    gap: [40, 24],
  }
}

/* ── Hierarchy chart ───────────────────────────────────────────────────── */

async function hierarchyNode(name: string, role: string, state: 'rest' | 'path' | 'selected', toggle?: string) {
  const n = await box({
    name,
    dir: 'row',
    align: 'center',
    gap: 'space/3',
    pad: [0, 12],
    w: 224,
    h: 64,
    radius: 'radius/lg',
    fill: 'role/surface',
    stroke: state === 'selected' ? 'role/accent' : state === 'path' ? 'role/accent-line' : 'role/line',
    strokeWidth: state === 'selected' ? 2 : 1,
    effect: 'Shadow/xs',
  })
  add(n, await initials(name.split(' ').map((w) => w[0]).join(''), 32), await box({ name: 'Text', dir: 'col', gap: 'space/0-5', w: 'fill' }, await text(name, 'UI/base/Medium', 'role/fg', { name: 'Name', truncate: true, w: 'fill' }), await text(role, 'UI/sm/Regular', 'role/fg-muted', { name: 'Role', truncate: true, w: 'fill' })))
  if (!toggle) return n
  const wrap = await box({ name: `${name} node`, dir: 'none', w: 224, h: 74 })
  place(wrap, n, 0, 0)
  const chip = await box({ name: 'Toggle', dir: 'row', align: 'center', justify: 'center', pad: [0, 6], h: 20, radius: 'radius/full', fill: 'role/surface', stroke: state === 'path' ? 'role/accent-line' : 'role/line', effect: 'Shadow/xs' }, await text(toggle, 'UI/xs/Medium', 'role/fg-muted'))
  chip.minWidth = 20
  place(wrap, chip, 112 - chip.width / 2, 54)
  return wrap
}

async function drawHierarchy(c: ComponentNode, deps: Deps) {
  const W = 760
  const H = 380
  await style(c, { dir: 'none', w: W, h: H, radius: 'radius/xl', fill: 'role/well', stroke: 'role/line', clip: true })
  const levels: [number, string, string, 'rest' | 'path' | 'selected', string?][][] = [
    [[380, 'Mira Chen', 'CEO', 'path', '−']],
    [
      [150, 'Jonas Weber', 'VP Engineering', 'path', '−'],
      [380, 'Ava Ruiz', 'VP Design', 'rest', '+4'],
      [610, 'Leo Park', 'VP Sales', 'rest', '+12'],
    ],
    [
      [150, 'Sam Ortiz', 'Platform lead', 'selected'],
    ],
  ]
  const ys = [32, 152, 272]
  const edges: string[] = []
  const lit: string[] = []
  for (const [li, level] of levels.entries())
    for (const [x] of level) {
      if (!li) continue
      const px = li === 1 ? 380 : 150
      const fromY = ys[li - 1]! + 64
      const toY = ys[li]!
      const midY = (fromY + toY) / 2
      const d = `M${px},${fromY + 10} L${px},${midY} L${x},${midY} L${x},${toY}`
      ;(x === 150 ? lit : edges).push(d)
    }
  if (edges.length) vector(c, edges.join(' '), { stroke: solid('role/line-strong'), strokeWidth: 1.25 }, 'Edges')
  vector(c, lit.join(' '), { stroke: solid('role/accent'), strokeWidth: 2 }, 'Path')
  for (const [li, level] of levels.entries()) for (const [x, name, role, state, toggle] of level) place(c, await hierarchyNode(name, role, state, toggle), x - 112, ys[li]!)
  const ctl = await zoomControls(deps)
  place(c, ctl, W - ctl.width - 10, H - ctl.height - 10)
}

function hierarchySpec(deps: Deps): SetSpec {
  return {
    key: 'component:hierarchy-chart',
    name: 'Hierarchy chart',
    description:
      'HierarchyChart in packages/ui, as a representative frame (an org chart): node cards (an avatar, a name and a role, 224 × 64) on a recessed canvas, joined by elbow edges; a branch carries a chip to fold it (“−”) or open it (“+12”). The selected node and the path to it are in the accent. Pan and zoom with the corner controls. In code branches open and fold on the smooth spring and the view glides to a picked node.',
    variants: [{ props: { Layout: 'vertical' }, build: (c: ComponentNode) => drawHierarchy(c, deps) }],
    properties: [],
    columns: 'Layout',
    gap: [40, 24],
  }
}

/* ── Flow graph ────────────────────────────────────────────────────────── */

type Step = 'ok' | 'running' | 'error' | 'queued' | 'skipped' | 'retried'
const STEP_DOT: Record<Step, Ink | null> = { ok: 'role/success', running: 'role/accent', error: 'role/danger', queued: null, skipped: 'role/fg-subtle', retried: 'role/warning' }

async function flowNode(name: string, kind: string, meta: string, status: Step, attempts?: string) {
  const n = await box({
    name,
    dir: 'col',
    justify: 'center',
    gap: 'space/1',
    pad: [0, 12],
    w: 176,
    h: 56,
    radius: 'radius/lg',
    fill: status === 'skipped' ? undefined : 'role/surface',
    stroke: status === 'skipped' ? 'role/line-strong' : status === 'error' ? 'role/danger-line' : status === 'running' ? 'role/accent-line' : 'role/line',
    effect: status === 'skipped' ? undefined : 'Shadow/xs',
    opacity: status === 'skipped' ? 0.75 : undefined,
  })
  if (status === 'skipped') n.dashPattern = [4, 3]
  const dotInk = STEP_DOT[status]
  const dot = rect('Status', 8, status === 'skipped' ? 1.5 : 8, dotInk, status === 'skipped' ? 0 : 'radius/full')
  if (status === 'queued') {
    dot.strokes = [solid('role/fg-subtle')]
    dot.strokeWeight = 1.5
    dot.strokeAlign = 'INSIDE'
  }
  add(n, await box({ name: 'Head', dir: 'row', align: 'center', gap: 'space/2', w: 'fill' }, await box({ name: 'Dot', dir: 'row', align: 'center', justify: 'center', w: 8, h: 8 }, dot), await text(name, 'Mono/base', status === 'queued' || status === 'skipped' ? 'role/fg-muted' : 'role/fg', { name: 'Name', truncate: true, w: 'fill' })))
  const metaRow = await box({ name: 'Meta', dir: 'row', align: 'center', gap: 'space/1-5', pad: [0, 0, 0, 16], w: 'fill' })
  add(metaRow, await eyebrow(kind, 'Kind'), await text('·', 'UI/xs/Regular', 'role/fg-subtle'), await text(meta, 'Mono/xs', status === 'error' ? 'role/danger-text' : 'role/fg-muted', { name: 'Meta', w: 'fill', truncate: true }))
  if (attempts) add(metaRow, await text(attempts, 'Mono/xs', 'role/warning-text', { name: 'Attempts' }))
  add(n, metaRow)
  return n
}

async function drawFlowGraph(c: ComponentNode, deps: Deps, failed: boolean) {
  const W = 760
  const H = 300
  // The canvas: role/fg at 2.5% over the surface, under a dot grid in role/fg at 16%.
  await style(c, { dir: 'none', w: W, h: H, radius: 'radius/xl', stroke: 'role/line', clip: true })
  c.fills = [solid('role/surface'), solid(['role/fg', 0.025])]
  dotGrid(c, W, H, 20, ['role/fg', 0.16])
  const col = [32, 288, 544]
  const nodes: [number, number, string, string, string, Step, string?][] = [
    [col[0]!, 120, 'checkout', 'git', 'main · 4f2a', 'ok'],
    [col[1]!, 60, 'build', 'job', '1m 12s', 'ok'],
    [col[1]!, 180, 'test', 'job', failed ? 'exit 1' : '48s', failed ? 'error' : 'retried', failed ? undefined : '×2'],
    [col[2]!, 60, 'deploy-preview', 'job', failed ? 'skipped' : 'running', failed ? 'skipped' : 'running'],
    [col[2]!, 180, 'notify', 'hook', 'queued', 'queued'],
  ]
  const ports = (i: number) => ({ out: [nodes[i]![0] + 176, nodes[i]![1] + 28] as const, in: [nodes[i]![0], nodes[i]![1] + 28] as const })
  const curve = (a: number, b: number) => {
    const [x0, y0] = ports(a).out
    const [x1, y1] = ports(b).in
    const mx = (x0 + x1) / 2
    return `M${x0},${y0} C${mx},${y0} ${mx},${y1} ${x1},${y1}`
  }
  const quiet = [curve(0, 1), curve(0, 2), curve(2, 4)]
  vector(c, quiet.join(' '), { stroke: solid('role/line-strong'), strokeWidth: 1.5 }, 'Edges')
  const into = vector(c, curve(1, 3), { stroke: solid(failed ? 'role/line-strong' : 'role/accent'), strokeWidth: 1.5 }, failed ? 'Skipped edge' : 'Running edge') as VectorNode
  into.dashPattern = [4, 4]
  for (const [i, [x, y, name, kind, meta, status, attempts]] of nodes.entries()) {
    place(c, await flowNode(name, kind, meta, status, attempts), x, y)
    const p = ports(i)
    if (i > 0) {
      const inPort = disc(8, 'role/surface', 'Port in')
      inPort.strokes = [solid('role/line-strong')]
      place(c, inPort, p.in[0] - 4, p.in[1] - 4)
    }
    if (i < 3 || i === 2) place(c, disc(8, status === 'running' ? 'role/accent' : status === 'queued' ? 'role/well' : 'role/line-strong', 'Port out'), p.out[0] - 4, p.out[1] - 4)
  }
  const ctl = await zoomControls(deps)
  place(c, ctl, W - ctl.width - 10, H - ctl.height - 10)
}

function flowGraphSpec(deps: Deps): SetSpec {
  return {
    key: 'component:flow-graph',
    name: 'Flow graph',
    description:
      'FlowGraph in packages/ui, as a representative frame (a CI run): steps as mono cards on a dot grid, laid out in layers that read in the flow direction and joined port to port by curves. Each shows its state: queued (a hollow dot), running (accent edge and dashes flowing into it), succeeded, failed (danger), retried (warning, with its attempts) or skipped (dashed, like its edges). In code a running step pulses softly and the view pans and zooms.',
    variants: [false, true].map((failed) => ({ props: { Failed: String(failed) }, build: (c: ComponentNode) => drawFlowGraph(c, deps, failed) })),
    properties: [],
    columns: 'Failed',
    gap: [40, 24],
  }
}

/* ── Flow lanes ────────────────────────────────────────────────────────── */

/** A gateway's requests a second by model: name, rate, ink. */
const FLOW: [string, number, string][] = [
  ['Kestrel 3 Pro', 47, 'role/chart-1'],
  ['Orrery 2', 137, 'role/chart-2'],
  ['Kestrel 3 Swift', 90, 'role/chart-3'],
  ['Moth 8B', 37, 'role/chart-4'],
]

/** A point along a lane (flow-lanes.tsx's lanePath): the trunk, a cubic bend, then the straight run, by distance 0–1. */
function lanePoint(W: number, H: number, y: number, t: number): [number, number] {
  const x0 = 5.5
  const sy = H / 2
  const fork = Math.max(W * 0.2, 70)
  const bend = Math.max(24, W * 0.2)
  const end = W - 4.5
  const trunk = fork - x0
  const curve = Math.hypot(bend, y - sy)
  const run = end - fork - bend
  let d = t * (trunk + curve + run)
  if (d <= trunk) return [x0 + d, sy]
  d -= trunk
  if (d <= curve) {
    const u = d / curve
    // The bend's controls sit halfway along it, at the trunk's and the lane's heights.
    const bx = (1 - u) ** 3 * fork + 3 * (1 - u) ** 2 * u * (fork + bend / 2) + 3 * (1 - u) * u ** 2 * (fork + bend / 2) + u ** 3 * (fork + bend)
    const by = (1 - u) ** 3 * sy + 3 * (1 - u) ** 2 * u * sy + 3 * (1 - u) * u ** 2 * y + u ** 3 * y
    return [bx, by]
  }
  return [fork + bend + (d - curve), y]
}

async function drawFlowLanes(c: ComponentNode, active: boolean) {
  // The code's 32px lane pitch, a 300px plot, 36 particles split by share.
  const PITCH = 32
  const W = 300
  const H = PITCH * FLOW.length
  const total = FLOW.reduce((sum, [, v]) => sum + v, 0)
  const top = Math.max(...FLOW.map(([, v]) => v))
  await style(c, { dir: 'row', align: 'center', gap: 'space/3', w: 'hug' })
  const p = await plot('Plot', W, H)
  const label = await text('GATEWAY', 'Mono/xs', 'role/fg-muted', { name: 'Source' })
  place(p, label, 0, H / 2 - 10 - label.height)
  for (const [i, [name, v, ink]] of FLOW.entries()) {
    const quiet = active && i !== 1
    const y = (i + 0.5) * PITCH
    const steps = 48
    const pts = Array.from({ length: steps + 1 }, (_, k) => lanePoint(W, H, y, k / steps))
    const d = pts.map(([x, py], k) => `${k ? 'L' : 'M'}${r2(x)},${r2(py)}`).join(' ')
    const lane = await box({ name, dir: 'none', w: W, h: H, opacity: quiet ? 0.25 : undefined })
    vector(lane, d, { stroke: solid([ink, !active || quiet ? 0.38 : 0.7]), strokeWidth: 1 + (v / top) * 2 }, 'Line')
    const [ex, ey] = lanePoint(W, H, y, 1)
    place(lane, disc(7, ink, 'End'), ex - 3.5, ey - 3.5)
    const n = Math.max(1, Math.round((v / total) * 36))
    for (let k = 0; k < n; k++) {
      const [px, py] = lanePoint(W, H, y, (k + ((i * 0.37) % 1)) / n)
      place(lane, disc(6, ink, 'Particle'), px - 3, py - 3)
    }
    place(p, lane, 0, 0)
  }
  const node = disc(9, 'role/surface', 'Source node')
  node.strokes = [solid('role/fg-muted')]
  node.strokeWeight = 1.5
  place(p, node, 1, H / 2 - 4.5)
  add(c, p)
  const list = await box({ name: 'Lanes', dir: 'col', w: 'hug' })
  for (const [i, [name, v]] of FLOW.entries()) {
    const quiet = active && i !== 1
    add(
      list,
      await box(
        { name, dir: 'row', align: 'center', gap: 'space/3', h: PITCH, pad: [0, 6, 0, 6], radius: 'radius/md', fill: active && !quiet ? 'role/hover' : undefined, opacity: quiet ? 0.6 : undefined },
        await text(name, 'UI/base/Regular', 'role/fg', { name: 'Label', w: 112 }),
        await text(`${v}/s`, 'Mono/sm', 'role/fg-muted', { name: 'Value', w: 40, align: 'RIGHT' }),
      ),
    )
  }
  add(c, list)
}

function flowLanesSpec(): SetSpec {
  return {
    key: 'component:flow-lanes',
    name: 'Flow lanes',
    description:
      'FlowLanes in packages/ui, as a static example (a gateway\'s requests by model): a source ring on a trunk that fans out to a lane per destination, each line in its chart colour at 38% and weighted by its rate, ending in a dot beside its name and rate. Particles ride the lanes, as many as the rate\'s share. Active=true lights one lane (its line at 70%, its name on role/hover) and quiets the rest. In code the particles stream at one steady speed and the lanes draw out from the source.',
    variants: [false, true].map((active) => ({ props: { Active: String(active) }, build: (c: ComponentNode) => drawFlowLanes(c, active) })),
    properties: [],
    columns: 'Active',
    gap: [40, 16],
  }
}

/* ── Diff viewer ───────────────────────────────────────────────────────── */

type DiffRow = [number | null, number | null, ' ' | '+' | '-', Tok[]]
const DIFF: DiffRow[] = [
  [12, 12, ' ', [['export function', 'role/accent-text'], [' Deploy', 'role/fg'], ['() {', 'role/fg-muted']]],
  [13, null, '-', [['  const', 'role/accent-text'], [' size = ', 'role/fg'], ["'default'", 'role/success-text']]],
  [null, 13, '+', [['  const', 'role/accent-text'], [' size = ', 'role/fg'], ["'sm'", 'role/success-text']]],
  [null, 14, '+', [['  const', 'role/accent-text'], [' retries = ', 'role/fg'], ['3', 'role/warning-text']]],
  [14, 15, ' ', [['  return', 'role/accent-text'], [' <Button size={size}>Deploy</Button>', 'role/fg']]],
  [15, 16, ' ', [['}', 'role/fg-muted']]],
]

async function drawDiffViewer(c: ComponentNode, deps: Deps) {
  await style(c, { dir: 'col', w: 600, radius: 'radius/lg', fill: 'role/surface', stroke: 'role/line', clip: true })
  const head = await box({ name: 'Header', dir: 'row', align: 'center', gap: 'space/3', pad: [6, 6, 6, 12], w: 'fill', stroke: 'role/line', sides: { bottom: 1 } })
  head.minHeight = 44
  const stats = await box({ name: 'Stats', dir: 'row', align: 'center', gap: 'space/1-5' }, await text('+2', 'Mono/xs', 'role/success-text'), await text('−1', 'Mono/xs', 'role/danger-text'))
  const blocks = await box({ name: 'Blocks', dir: 'row', gap: 1 })
  for (const ink of ['role/success', 'role/success', 'role/danger', 'role/line', 'role/line']) add(blocks, rect('Block', 8, 8, ink, 1))
  add(stats, blocks)
  const nav = await box({ name: 'Nav', dir: 'row', align: 'center', gap: 'space/1' })
  for (const g of ['chevron-up', 'chevron-down']) {
    const b = button(deps.get, '', { Variant: 'ghost', Size: 'icon-sm' })
    swapIcon(b, pick(deps.icons, g).rest)
    add(nav, b)
  }
  add(
    head,
    await box({ name: 'File', dir: 'row', align: 'center', gap: 'space/2', w: 'fill' }, icon(deps.icons, 'file-code', 15, 'role/fg-muted'), ref(await text('src/deploy.tsx', 'Mono/sm', 'role/fg', { name: 'Filename' }), 'Filename'), stats),
    await text('Change 1 of 2', 'UI/xs/Regular', 'role/fg-muted', { name: 'Position' }),
    nav,
  )
  add(c, head)
  const body = await box({ name: 'Lines', dir: 'col', w: 'fill' })
  add(body, await box({ name: 'Hunk', dir: 'row', align: 'center', pad: [0, 12], w: 'fill', h: 28, fill: 'role/band' }, await text('@@ -12,4 +12,5 @@ export function Deploy', 'Mono/sm', 'role/fg-muted')))
  for (const [oldN, newN, sign, toks] of DIFF) {
    const tone = sign === '+' ? 'add' : sign === '-' ? 'del' : null
    const tint: Ink | undefined = tone === 'add' ? 'role/success-subtle' : tone === 'del' ? 'role/danger-subtle' : undefined
    const numInk = tone === 'add' ? 'role/success-text' : tone === 'del' ? 'role/danger-text' : 'role/fg-subtle'
    const row = await box({ name: 'Line', dir: 'row', w: 'fill', h: 20, fill: tint })
    add(
      row,
      await box({ name: 'Old', dir: 'row', justify: 'end', pad: [0, 10], w: 44, h: 20 }, oldN ? await text(String(oldN), 'Mono/base', numInk) : null),
      await box({ name: 'New', dir: 'row', justify: 'end', pad: [0, 10], w: 44, h: 20 }, newN ? await text(String(newN), 'Mono/base', numInk) : null),
      await box({ name: 'Sign', dir: 'row', justify: 'center', w: 24, h: 20 }, sign === ' ' ? null : await text(sign === '-' ? '−' : '+', 'Mono/base', numInk)),
    )
    const code = await box({ name: 'Code', dir: 'row', w: 'fill' })
    for (const [chars, ink] of toks) add(code, await text(chars.replace(/ /g, ' '), 'Mono/base', ink, { name: 'Token' }))
    add(row, code)
    add(body, row)
  }
  add(c, body)
}

function diffViewerSpec(deps: Deps): SetSpec {
  return {
    key: 'component:diff-viewer',
    name: 'Diff viewer',
    description:
      'DiffViewer in packages/ui, as a representative frame (unified view): the difference between two versions of a file as code review reads it. A header names the file, counts what was added and removed with five blocks, and steps through the changes; then hunks of numbered lines in mono, added lines on the success tint and removed ones on the danger tint, unchanged runs folded. In code the split view and word-level marks live behind the header’s toggle.',
    variants: [{ props: { View: 'unified' }, build: (c: ComponentNode) => drawDiffViewer(c, deps) }],
    properties: [{ name: 'Filename', type: 'TEXT', default: 'src/deploy.tsx', field: 'characters' }],
    columns: 'View',
    gap: [40, 24],
  }
}

/* ── Chat ──────────────────────────────────────────────────────────────── */

async function drawChat(c: ComponentNode, deps: Deps, tool: boolean) {
  await style(c, { dir: 'col', gap: 'space/6', w: 560 })
  // A user turn: a bubble on the hover tint, on the author's side.
  const user = await box({ name: 'User message', dir: 'col', align: 'end', gap: 'space/2', w: 'fill' })
  const bubble = await box({ name: 'Bubble', dir: 'row', pad: [8, 14], radius: 'radius/2xl', fill: 'role/hover' })
  add(bubble, ref(await text('Can you check why the preview deploy failed?', 'UI/lg/Regular', 'role/fg', { name: 'Message' }), 'Message'))
  add(user, bubble)
  const avatar = await box({ name: 'Avatar', dir: 'row', align: 'center', justify: 'center', w: 28, h: 28, radius: 'radius/full', fill: 'role/fg' }, icon(deps.icons, ['sparkles', 'bot'], 14, 'role/canvas'))
  const assistant = await box({ name: 'Assistant message', dir: 'row', gap: 'space/3', w: 'fill' })
  const body = await box({ name: 'Body', dir: 'col', gap: 'space/2', w: 'fill' })
  add(body, await box({ name: 'Header', dir: 'row', align: 'center', h: 28 }, await text('Assistant', 'UI/base/Medium', 'role/fg')))
  if (tool) {
    const call = await box({ name: 'Tool call', dir: 'row', align: 'center', gap: 'space/2', pad: [8, 12], w: 'fill', radius: 'radius/lg', fill: 'role/surface', stroke: 'role/line' })
    add(
      call,
      icon(deps.icons, 'check', 16, 'role/success-text'),
      await text('read_logs', 'Mono/base/Medium', 'role/fg'),
      await text('deploy=4f2a, lines=200', 'Mono/sm', 'role/fg-muted', { name: 'Args', w: 'fill', truncate: true }),
      badge(deps.get, 'Done', 'success'),
      icon(deps.icons, 'chevron-down', 14, 'role/fg-subtle'),
    )
    add(body, call)
  }
  add(body, await text('The build ran out of memory while bundling the docs. Raise the limit to 4 GB, or split the icon pages so each chunk stays under it.', 'UI/lg/Regular', 'role/fg', { name: 'Reply', w: 'fill' }))
  const actions = await box({ name: 'Actions', dir: 'row', gap: 'space/1' })
  for (const g of ['copy', 'refresh', 'thumbs-up']) {
    const b = button(deps.get, '', { Variant: 'ghost', Size: 'icon-sm' })
    swapIcon(b, pick(deps.icons, g, 'copy').rest)
    add(actions, b)
  }
  add(body, actions)
  add(assistant, avatar, body)
  // The prompt: an input group with the textarea on top and its actions under it.
  const prompt = await box({ name: 'Prompt input', dir: 'col', w: 'fill', ...fieldLookArea() })
  add(prompt, await box({ name: 'Textarea', dir: 'row', pad: [12, 14, 4, 14], w: 'fill', h: 48 }, await text('Ask anything…', 'UI/lg/Regular', 'role/fg-muted', { name: 'Placeholder' })))
  // Send: the primary as a round icon key.
  const send = await box({ name: 'Send', dir: 'row', align: 'center', justify: 'center', radius: 'bezel/pill', fill: 'role/action' }, icon(deps.icons, ['arrow-up', 'send'], 16, 'role/on-action'))
  controlSquare(send, 'control/sm')
  const attach = button(deps.get, '', { Variant: 'ghost', Size: 'icon-sm' })
  swapIcon(attach, pick(deps.icons, 'plus').rest)
  add(prompt, await box({ name: 'Actions', dir: 'row', align: 'center', gap: 'space/1', pad: [4, 8, 8, 8], w: 'fill' }, attach, await spacerBox(), send))
  add(c, user, assistant, prompt)
}

/** The chat prompt's field: the multi-line field control. */
const fieldLookArea = () => ({ ...fieldLookOf('rest', true) })

function chatSpec(deps: Deps): SetSpec {
  return {
    key: 'component:chat',
    name: 'Chat',
    description:
      'The chat kit in packages/ui, as a representative frame: a user turn as a bubble on the hover tint on the author’s side, an assistant turn with its avatar, a tool call (its name and arguments in mono, a status badge, a chevron to open the result), the reply in markdown at ui-lg, its actions (copy, regenerate, feedback), and the prompt input under it. In code replies stream in word by word and tool calls morph their badge as they settle.',
    variants: [false, true].map((tool) => ({ props: { 'Tool call': String(tool) }, build: (c: ComponentNode) => drawChat(c, deps, tool) })),
    properties: [{ name: 'Message', type: 'TEXT', default: 'Can you check why the preview deploy failed?', field: 'characters' }],
    columns: 'Tool call',
    gap: [40, 24],
  }
}

/* ── Filter builder ────────────────────────────────────────────────────── */

async function filterToken(parts: [string, Ink][], invalid = false) {
  const rule = await box({ name: 'Rule', dir: 'row', align: 'center', gap: 1 })
  for (const [i, [chars, ink]] of parts.entries()) {
    const t = await box({ name: 'Token', dir: 'row', align: 'center', gap: 'space/1', pad: [0, 10], fill: invalid && i === parts.length - 1 ? 'role/danger-subtle' : 'role/band' })
    controlHeight(t, 'control/sm')
    // Joined tokens: a small inner corner, the control's corner at the ends.
    t.cornerRadius = 2
    if (i === 0) t.topLeftRadius = t.bottomLeftRadius = 8
    if (i === parts.length - 1) t.topRightRadius = t.bottomRightRadius = 8
    add(t, await text(chars, i === 0 ? 'UI/base/Medium' : 'UI/base/Regular', invalid && i === parts.length - 1 ? 'role/danger-text' : ink))
    add(rule, t)
  }
  return rule
}

async function drawFilterBuilder(c: ComponentNode, deps: Deps, view: 'chips' | 'sentence') {
  await style(c, { dir: 'col', w: 560, radius: 'radius/lg', fill: 'role/surface', stroke: 'role/line-subtle' })
  const summary = await box({ name: 'Summary', dir: 'row', align: 'center', gap: 'space/3', pad: [8, 16], w: 'fill', stroke: 'role/line-subtle', sides: { bottom: 1 } })
  summary.minHeight = 36
  if (view === 'sentence') add(summary, await text('Status is Active and plan is Pro or Scale', 'UI/base/Regular', 'role/fg-muted', { name: 'Sentence', w: 'fill' }))
  else {
    const chips = await box({ name: 'Chips', dir: 'row', align: 'center', gap: 'space/1-5', w: 'fill' })
    for (const [i, chars] of ['Status is Active', 'Plan is Pro, Scale'].entries()) {
      if (i) add(chips, await text('and', 'UI/base/Regular', 'role/fg-muted'))
      const chip = await box({ name: 'Chip', dir: 'row', align: 'center', pad: [0, 10], radius: 'bezel/pill', fill: 'role/band' }, await text(chars, 'UI/base/Regular', 'role/fg'))
      controlHeight(chip, 'control/sm')
      add(chips, chip)
    }
    add(summary, chips)
  }
  add(summary, button(deps.get, view === 'chips' ? 'Sentence' : 'Chips', { Variant: 'ghost', Size: 'sm' }))
  const rules = await box({ name: 'Rules', dir: 'col', gap: 'space/2', pad: [12, 8], w: 'fill' })
  const ruleRow = async (word: string, tokens: [string, Ink][], invalid = false) => {
    const r = await box({ name: 'Rule row', dir: 'row', align: 'center', gap: 'space/1', w: 'fill' })
    const w = await box({ name: 'Connector', dir: 'row', align: 'center', pad: [0, 8], w: 64 }, await text(word, 'UI/base/Regular', 'role/fg-muted'))
    controlHeight(w, 'control/sm')
    add(r, w, await filterToken(tokens, invalid), await spacerBox())
    const x = button(deps.get, '', { Variant: 'ghost', Size: 'icon-xs' })
    swapIcon(x, pick(deps.icons, 'x').rest)
    add(r, x)
    return r
  }
  add(rules, await ruleRow('Where', [['Status', 'role/fg'], ['is', 'role/fg-muted'], ['Active', 'role/fg']]))
  add(rules, await ruleRow('and', [['Plan', 'role/fg'], ['is any of', 'role/fg-muted'], ['Pro, Scale', 'role/fg']]))
  const nested = await box({ name: 'Group', dir: 'col', gap: 'space/2', pad: [0, 0, 0, 12], w: 'fill', stroke: 'role/line', sides: { left: 1 } })
  add(nested, await ruleRow('Where', [['MRR', 'role/fg'], ['is above', 'role/fg-muted'], ['$1,000', 'role/fg']]), await ruleRow('or', [['Seats', 'role/fg'], ['is above', 'role/fg-muted'], ['abc', 'role/fg']], true))
  add(nested, await box({ name: 'Message', dir: 'row', pad: [0, 0, 0, 68] }, await text('Enter a number', 'UI/sm/Regular', 'role/danger-text')))
  add(rules, await box({ name: 'Nested', dir: 'row', gap: 'space/1', w: 'fill' }, await box({ name: 'Connector', dir: 'row', align: 'center', pad: [0, 8], w: 64 }, await text('and', 'UI/base/Regular', 'role/fg-muted')), nested))
  const foot = await box({ name: 'Footer', dir: 'row', align: 'center', gap: 'space/1', pad: [8, 16], w: 'fill', stroke: 'role/line-subtle', sides: { top: 1 } })
  add(foot, button(deps.get, 'Add filter', { Variant: 'ghost', Size: 'sm' }), button(deps.get, 'Add group', { Variant: 'ghost', Size: 'sm' }), await spacerBox(), button(deps.get, 'Clear', { Variant: 'ghost', Size: 'sm' }))
  add(c, summary, rules, foot)
}

function filterBuilderSpec(deps: Deps): SetSpec {
  return {
    key: 'component:filter-builder',
    name: 'Filter builder',
    description:
      'FilterBuilder in packages/ui, as a representative frame: rules read as a sentence (“Where Status is Active and Plan is any of Pro, Scale”), each a run of joined tokens on the band (field, operator, value) that open their pickers, the connector words in a column, nested groups indented on a hairline. A value that doesn’t parse turns its token danger and says why under it. The summary above shows the query as chips or as a sentence. In code rules enter and leave through PresenceList.',
    variants: (['chips', 'sentence'] as const).map((view) => ({ props: { Summary: view }, build: (c: ComponentNode) => drawFilterBuilder(c, deps, view) })),
    properties: [],
    columns: 'Summary',
    gap: [40, 24],
  }
}

/* ── Import mapper ─────────────────────────────────────────────────────── */

async function drawImportMapper(c: ComponentNode, deps: Deps) {
  await style(c, { dir: 'col', gap: 'space/3', pad: 20, w: 560, ...surfaceLook() })
  const file = await box({ name: 'File', dir: 'row', align: 'center', gap: 'space/3', pad: [8, 12], w: 'fill', radius: 'radius/md', fill: 'role/well' })
  add(
    file,
    icon(deps.icons, 'file-text', 20, 'role/fg-muted'),
    await box({ name: 'Text', dir: 'col', w: 'fill' }, await text('contacts-october.csv', 'UI/base/Medium', 'role/fg'), await text('46 rows · 5 columns · comma', 'UI/sm/Regular', 'role/fg-muted')),
    button(deps.get, 'Change', { Variant: 'ghost', Size: 'sm' }),
  )
  const head = await box({ name: 'Head', dir: 'row', gap: 'space/3', w: 'fill' }, await text('Column in your file', 'UI/sm/Medium', 'role/fg-muted', { w: 'fill' }), await text('Goes to', 'UI/sm/Medium', 'role/fg-muted', { w: 'fill' }))
  const cols = await box({ name: 'Columns', dir: 'col', gap: 'space/1', w: 'fill' })
  for (const [name, sample, target, check] of [
    ['Full name', 'Mira Chen', 'Name', false],
    ['E-mail', 'mira@acme.com', 'Email', false],
    ['Org', 'Acme Inc', 'Company', true],
    ['Notes', 'Met at summit', 'Skip this column', false],
  ] as const) {
    const sel = instance(deps.get, 'native-select', { Size: 'default', State: 'rest' })
    setText(sel, 'Value', target)
    const right = await box({ name: 'Target', dir: 'row', align: 'center', gap: 'space/2', w: 'fill' }, sel)
    sel.layoutSizingHorizontal = 'FILL'
    if (check) add(right, badge(deps.get, 'Check', 'warning'))
    add(cols, await box({ name: 'Column', dir: 'row', align: 'center', gap: 'space/3', pad: [2, 0], w: 'fill' }, await box({ name: 'Source', dir: 'col', w: 'fill' }, await text(name, 'UI/base/Medium', 'role/fg'), await text(sample, 'UI/sm/Regular', 'role/fg-muted')), right))
  }
  const issues = await box({ name: 'Issues', dir: 'row', align: 'center', gap: 'space/3', w: 'fill' })
  add(issues, await text('2 rows have an invalid email.', 'UI/sm/Regular', 'role/fg-muted', { w: 'fill' }), button(deps.get, 'Review', { Variant: 'outline', Size: 'sm' }), button(deps.get, 'Skip them', { Variant: 'ghost', Size: 'sm' }))
  const foot = await box({ name: 'Footer', dir: 'row', align: 'center', justify: 'between', gap: 'space/3', pad: [4, 0, 0, 0], w: 'fill' })
  add(foot, button(deps.get, 'Back', { Variant: 'ghost' }), button(deps.get, 'Import 44 contacts'))
  add(c, file, head, cols, issues, foot)
}

function importMapperSpec(deps: Deps): SetSpec {
  return {
    key: 'component:import-mapper',
    name: 'Import mapper',
    description:
      'ImportMapper in packages/ui, as a representative frame (the mapping step): the file on a recessed well, then each of its columns with a sample value and the field it goes to (a NativeSelect); a guess is marked “Check”. What needs attention sits above the button in plain words, each with a way out (Review, Skip them), and the button says what will happen. Choosing a file and the result are its other screens.',
    variants: [{ props: { Step: 'map' }, build: (c: ComponentNode) => drawImportMapper(c, deps) }],
    properties: [],
    columns: 'Step',
    gap: [40, 24],
  }
}

/* ── The entries ───────────────────────────────────────────────────────── */

const ui = (f: string) => `packages/ui/src/components/ui/${f}`

/* ── DotMap ─────────────────────────────────────────────────────────────── */

/** The story's regions (dot-map.stories.tsx): traffic by data centre. */
const DOT_REGIONS = [
  { id: 'iad', lon: -77.04, lat: 38.9, value: 12_400, tone: 'accent' },
  { id: 'fra', lon: 8.68, lat: 50.11, value: 9_800, tone: 'accent' },
  { id: 'sfo', lon: -122.42, lat: 37.77, value: 8_900, tone: 'accent' },
  { id: 'nrt', lon: 139.69, lat: 35.68, value: 6_100, tone: 'accent' },
  { id: 'sin', lon: 103.82, lat: 1.35, value: 4_300, tone: 'accent' },
  { id: 'gru', lon: -46.63, lat: -23.55, value: 2_700, tone: 'warning' },
  { id: 'syd', lon: 151.21, lat: -33.87, value: 1_900, tone: 'accent' },
] as const
const DOT_MAP_W = 600
const DOT_REACH = [1.6, 5.5] as const

const f2 = (n: number) => Math.round(n * 100) / 100
/** Discs as one path, each a pair of arcs: Figma drops the code's zero-length round-capped segments. */
const discs = (points: [number, number][], r: number) =>
  points.map(([x, y]) => `M${f2(x - r)},${f2(y)} a${f2(r)},${f2(r)} 0 1 0 ${f2(2 * r)},0 a${f2(r)},${f2(r)} 0 1 0 ${f2(-2 * r)},0`).join(' ')

async function drawDotMap(c: ComponentNode, state: 'rest' | 'active') {
  const land = context().kit.dotMap
  const cols = land.rows[0]!.length
  const cell = DOT_MAP_W / cols
  const h = Math.round(land.rows.length * cell)
  await style(c, { dir: 'none', w: DOT_MAP_W, h, clip: true })
  const dots = land.rows.flatMap((row, r) => [...row].flatMap((ch, col) => (ch === '#' ? [[col, r] as [number, number]] : [])))
  // Land: every cell a dot 0.46 of a cell across, in the strong line ink.
  vector(c, discs(dots.map(([x, y]) => [(x + 0.5) * cell, (y + 0.5) * cell]), 0.23 * cell), { fill: solid('role/line-strong') }, 'Land')
  const peak = Math.max(...DOT_REGIONS.map((r) => r.value))
  const placed = DOT_REGIONS.map((region) => {
    const share = region.value / peak
    return { region, x: (region.lon + 180) / land.step, y: (land.north - region.lat) / land.step, share, reach: DOT_REACH[0] + (DOT_REACH[1] - DOT_REACH[0]) * Math.sqrt(share) }
  })
  const active = state === 'active' ? placed[0]! : undefined
  // Lit dots as the code lights them (brightest at a region's centre, by its share), in four steps of opacity per tone.
  const buckets = new Map<string, [number, number][]>()
  for (const [col, r] of dots) {
    let best = { level: 0, tone: 'accent', id: '' }
    for (const p of placed) {
      const d = Math.hypot(col + 0.5 - p.x, r + 0.5 - p.y)
      if (d >= p.reach) continue
      const level = (1 - d / p.reach) ** 1.25 * (0.35 + 0.65 * Math.sqrt(p.share))
      if (level > best.level) best = { level, tone: p.region.tone, id: p.region.id }
    }
    if (best.level <= 0.05) continue
    const dim = active && active.region.id !== best.id ? 0.4 : 1
    const key = `${best.tone}:${Math.min(4, Math.max(1, Math.round(best.level * dim * 4)))}`
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key)!.push([(col + 0.5) * cell, (r + 0.5) * cell])
  }
  for (const [key, points] of buckets) {
    const [tone, step] = key.split(':')
    const v = vector(c, discs(points, 0.29 * cell), { fill: solid(`role/${tone}`) }, 'Lit') as VectorNode
    v.opacity = Number(step) / 4
  }
  // Each region: a ring and a centre dot in its tone (the radial glow lives in code).
  for (const p of placed) {
    const on = p === active
    const ring = (on ? 1.35 : 0.95) * cell
    vector(c, discs([[p.x * cell, p.y * cell]], ring), { stroke: solid([`role/${p.region.tone}`, on ? 1 : 0.55]), strokeWidth: 1 }, 'Ring')
    vector(c, discs([[p.x * cell, p.y * cell]], 0.42 * cell), { fill: solid(`role/${p.region.tone}`) }, 'Region')
  }
  if (!active) return
  // The dashed crosshair and the ink tag over the active region.
  const ax = Math.round(active.x * cell)
  const ay = Math.round(active.y * cell)
  for (const [name, w, hh, x, y] of [['Crosshair x', 1, h, ax, 0], ['Crosshair y', DOT_MAP_W, 1, 0, ay]] as const) {
    const line = rect(name, w, hh, null)
    line.strokes = [solid(['role/accent', 0.45])]
    line.strokeWeight = 1
    line.dashPattern = [3, 3]
    add(c, line)
    line.x = x
    line.y = y
  }
  const tag = await box({ name: 'Tag', dir: 'row', gap: 'space/1-5', align: 'baseline', pad: [2, 6], radius: 'radius/sm', fill: 'role/fg', effect: 'Shadow/sm' })
  add(tag, ref(await text('iad', 'Mono/xs', 'role/canvas', { name: 'Name' }), 'Region'), ref(await text('12.4K', 'Mono/xs', ['role/canvas', 0.65], { name: 'Value' }), 'Value'))
  add(c, tag)
  tag.x = Math.round(ax - tag.width / 2)
  tag.y = Math.round(ay - tag.height - 12)
}

function dotMapSpec(): SetSpec {
  return {
    key: 'component:dot-map',
    name: 'Dot map',
    description:
      'DotMap in packages/ui: the world as a grid of dots (the code’s own 3° land mask, carried in the kit’s data), lit around each region by its share of the largest value, with a ring and a centre dot on each region in its tone. Active runs a dashed crosshair through a region and names it on an ink tag; the rest dim. The soft radial glow, the scan from the west and the pulses on update live in code.',
    variants: (['rest', 'active'] as const).map((state) => ({ props: { State: state }, build: (c: ComponentNode) => drawDotMap(c, state) })),
    properties: [
      { name: 'Region', type: 'TEXT', default: 'iad', field: 'characters' },
      { name: 'Value', type: 'TEXT', default: '12.4K', field: 'characters' },
    ],
    columns: 'State',
    gap: [32, 16],
  }
}

export const ENTRIES: Entry[] = [
  {
    doc: {
      key: 'component:dot-map',
      title: 'Dot map',
      usage: '<DotMap regions={[{ id: "iad", name: "iad", lon: -77.04, lat: 38.9, value: 12400 }]} defaultActive="iad" />',
      tokens: 'Land role/line-strong dots, 0.46 of a 3° cell  ·  Lit dots palette/<tone> (accent by default) by share  ·  Region ring at 55% (active 100%), centre dot  ·  Crosshair dashed role/accent at 45%  ·  Tag role/fg, Mono/xs role/canvas, radius/sm, Shadow/sm',
      file: 'packages/ui/src/components/ui/dot-map.tsx',
    },
    spec: () => dotMapSpec(),
  },
  {
    doc: {
      key: 'component:sparkline',
      title: 'Sparkline',
      usage: '<Sparkline data={revenue} className="h-8 w-28" label="Revenue, last 30 days, rising" />',
      tokens: 'Line role/chart-1 (any colour), 1.5 stroke  ·  Wash the colour at 22% → 0  ·  End dot 6, ringed 2px role/surface  ·  h-8 by default',
      file: ui('sparkline.tsx'),
    },
    spec: () => sparklineSpec(),
  },
  {
    doc: {
      key: 'component:stat-pill',
      title: 'Stat pill',
      usage: '<StatPill icon={<CpuIcon />} label="CPU" value={42} unit="%" delta={4.2} trend={load} />',
      tokens: 'Capsule bezel/capsule on bezel/pill with Shadow/sm (Classic role/chrome-float, role/line, radius/2xl)  ·  Disc role/well  ·  Label Bezel/Eyebrow  ·  Value UI/lg/Medium mono, unit UI/sm muted  ·  Delta Mono/sm role/success · role/danger',
      file: ui('stat-pill.tsx'),
    },
    spec: (deps) => statPillSpec(deps),
  },
  {
    doc: {
      key: 'component:stat-card',
      title: 'Stat card',
      usage: '<StatCard label="Revenue" value={48.2} unit="k" delta={0.124} comparison="vs last month"><StatBars data={weeks} /></StatCard>',
      tokens: 'Card role/surface, role/line, radius/xl  ·  Label Bezel/Eyebrow  ·  Value Heading/2xl (Bezel: mono)  ·  Delta role/success-text · role/danger-text  ·  Bars role/accent over role/chart-quiet, ticks role/fg-muted  ·  Meter role/well, pace role/fg  ·  Breakdown role/chart-1…3',
      file: ui('stat-card.tsx'),
    },
    spec: () => statCardSpec(),
  },
  {
    doc: {
      key: 'component:hatched-bar',
      title: 'Hatched bar',
      usage: '<HatchedBar value={0.62} fill="hatched" tone="accent" label="Projected" />',
      tokens: 'Hatch: the tone at 72%, 1.5px every 5px, over the tone at 10%  ·  Solid neutral role/well  ·  Neutral ink role/fg-subtle  ·  Radius radius/xs  ·  12 × 96 vertical, 8 high horizontal',
      file: ui('hatched-bar.tsx'),
    },
    spec: () => hatchedBarSpec(),
  },
  {
    doc: {
      key: 'component:cell-bar',
      title: 'Cell bar',
      usage: '<CellBar cells={[{ label: "Sep", value: 1060 }, { label: "Oct", value: 1120, projected: true }]} max={10000} target={6240} tone="warning" />',
      tokens: 'Cells 14 high in the tone, 2px gap, radius 2  ·  Projected: the hatch in the tone  ·  Target a dashed role/fg-muted tick, its name Mono/xs role/fg-muted  ·  Captions Mono/xs, label role/fg-muted over the amount role/fg',
      file: ui('cell-bar.tsx'),
    },
    spec: () => cellBarSpec(),
  },
  {
    doc: {
      key: 'component:diff-bar',
      title: 'Diff bar',
      usage: '<DiffBar label="Accuracy" a={0.714} b={0.87} names={["v1", "v2"]} format={{ style: "percent" }} />',
      tokens: 'Cells role/well, the better side role/accent, the other role/line-strong, overage role/danger  ·  12 high, 2px apart, 2px radius  ·  Centre role/fg-subtle  ·  Values Mono/base, winner role/fg',
      file: ui('diff-bar.tsx'),
    },
    spec: () => diffBarSpec(),
  },
  {
    doc: {
      key: 'component:avatar-stack',
      title: 'Avatar stack',
      usage: '<AvatarStack users={team} max={4} label="Editing now" />',
      tokens: 'Avatars role/band, initials role/fg-muted, ringed role/canvas  ·  Overlap 4 / 6 / 8  ·  “+N” role/band on role/canvas  ·  24, 32, 40',
      file: ui('avatar-stack.tsx'),
    },
    spec: () => avatarStackSpec(),
  },
  {
    doc: {
      key: 'component:code-block',
      title: 'Code block',
      usage: '<CodeBlock code={source} language="tsx" filename="deploy.tsx" />',
      tokens: 'Panel role/band, role/line, radius/lg  ·  Header 32, Mono/xs  ·  Code Mono/base, 20 line height  ·  Tokens role/accent-text, role/success-text, role/warning-text, role/fg-subtle  ·  Gutter role/fg-subtle',
      file: ui('code-block/'),
    },
    spec: (deps) => codeBlockSpec(deps),
  },
  {
    doc: {
      key: 'component:distribution-strip',
      title: 'Distribution strip',
      usage: '<DistributionStrip label="Latency" samples={ms} slo={400} format={(v) => `${v} ms`} />',
      tokens: 'Dots 4px role/fg-muted (with an objective role/success-text, past it role/warning)  ·  Percentiles role/line-strong, the highest role/fg  ·  Objective dashed role/warning, hatched past it  ·  Flags Mono/xs  ·  Axis role/line, ticks role/fg-subtle',
      file: ui('distribution-strip.tsx'),
    },
    spec: () => distributionSpec(),
  },
  {
    doc: {
      key: 'component:chart',
      title: 'Chart',
      usage: '<ChartContainer config={{ desktop: { label: "Desktop", color: "var(--color-chart-1)" } }}><AreaChart data={data}>…</AreaChart></ChartContainer>',
      tokens: 'Series role/chart-1…5  ·  Grid role/line-subtle, axis role/line  ·  Ticks UI/xs role/fg-muted  ·  Area the series at 20%  ·  Tooltip role/overlay, role/line, radius/lg, Shadow/md  ·  Legend UI/xs, 8px swatches',
      file: ui('chart.tsx'),
    },
    spec: () => chartSpec(),
  },
  {
    doc: {
      key: 'component:timeline',
      title: 'Timeline',
      usage: '<Timeline events={activity} now={now} onLoadMore={loadOlder} />',
      tokens: 'Marks 28, role/*-subtle on role/*-line (neutral role/surface, role/line)  ·  Rail role/line  ·  Actor UI/base/Medium, summary role/fg-muted  ·  Time UI/sm role/fg-muted  ·  Day UI/sm/Medium',
      file: ui('timeline.tsx'),
    },
    spec: (deps) => timelineSpec(deps),
  },
  {
    doc: {
      key: 'component:progress-list',
      title: 'Progress list',
      usage: '<ProgressList items={uploads} onPause={pause} onResume={resume} onRetry={retry} />',
      tokens: 'Row well role/well at 45%, radius/xl  ·  Disc role/band (failed role/danger-subtle, done role/success-subtle)  ·  Cells role/fg, paused role/line-strong, failed role/danger, off role/well  ·  Name Mono/base  ·  Meta Mono/sm  ·  Action Button secondary icon-sm',
      file: ui('progress-list.tsx'),
    },
    spec: (deps) => progressListSpec(deps),
  },
  {
    doc: {
      key: 'component:breakdown-list',
      title: 'Breakdown list',
      usage: '<BreakdownList items={costs} format={{ style: "currency", currency: "USD" }} />',
      tokens: 'Markers role/chart-1…5  ·  Rows on role/line hairlines, 10px in  ·  Tiles role/band, radius/lg, marker disc role/surface  ·  Value Mono/base/Medium (tiles UI/lg/Medium)  ·  Share Mono/sm role/fg-muted',
      file: ui('breakdown-list.tsx'),
    },
    spec: () => breakdownListSpec(),
  },
  {
    doc: {
      key: 'component:contribution-list',
      title: 'Contribution list',
      usage: '<ContributionList baseline={{ label: "Starting MRR", value: 24000 }} steps={changes} total={{ label: "Ending MRR" }} />',
      tokens: 'Steps on role/line hairlines  ·  Icon 32 on role/surface, role/line  ·  Marks role/band track, steps role/success · role/danger, ticks role/fg-muted  ·  Total role/accent-subtle, role/accent-line, role/accent-text  ·  Values Mono/base/Medium',
      file: ui('contribution-list.tsx'),
    },
    spec: (deps) => contributionListSpec(deps),
  },
  {
    doc: {
      key: 'component:unit-chart',
      title: 'Unit chart',
      usage: '<UnitChart data={covers} highlight={[9, 12]} label="Covers through the day" />',
      tokens: 'Dots role/accent (outside the highlight role/chart-quiet), empty role/well  ·  10px pitch, 3.3 radius  ·  Axis Mono/xs role/fg-muted',
      file: ui('unit-chart.tsx'),
    },
    spec: () => unitChartSpec(),
  },
  {
    doc: {
      key: 'component:waffle-chart',
      title: 'Waffle chart',
      usage: '<WaffleChart parts={storage} total={200} layout="cluster" label="Storage by type" />',
      tokens: 'Cells role/chart-1…5, empty role/well  ·  Squares with 1.4 corners on a 10px pitch  ·  Legend UI/base, shares Mono/base role/fg-muted, swatches radius/xs',
      file: ui('waffle-chart.tsx'),
    },
    spec: () => waffleSpec(),
  },
  {
    doc: {
      key: 'component:radar-chart',
      title: 'Radar chart',
      usage: '<RadarChart axes={axes} series={[{ id: "youj", name: "Youj", values }]} max={10} label="Vendor scores" />',
      tokens: 'Shapes role/chart-1…5 at 10% with a 1.5 stroke  ·  Rings role/line-subtle, outer role/line  ·  Spokes role/line-subtle  ·  Axis names UI/sm role/fg-muted  ·  Legend toggles control/sm on bezel/pill',
      file: ui('radar-chart.tsx'),
    },
    spec: () => radarSpec(),
  },
  {
    doc: {
      key: 'component:radial-graph',
      title: 'Radial graph',
      usage: '<RadialGraph center={{ id: "svc", label: "svc-reports" }} nodes={[{ id: "vault", label: "secrets-vault", ring: "solid", state: "Hit" }]} hops={2} />',
      tokens: 'Rings role/line-strong dashed 2 4  ·  Dots role/chart-1…5 by kind, 6 on ring 1, 4.75 on ring 2, a 2px role/surface gap  ·  State ring role/danger 1.5, solid or dashed 2 2, the link into it the same  ·  Center 17 role/accent, short UI/sm role/canvas  ·  Captions UI/xs role/fg-subtle',
      file: ui('radial-graph.tsx'),
    },
    spec: () => radialGraphSpec(),
  },
  {
    doc: {
      key: 'component:density-lanes',
      title: 'Density lanes',
      usage: '<DensityLanes lanes={[{ id: "id", label: "Identity", values: byHour }]} columns={hours} highlight={[[0, 6]]} marker={{ column: 12, label: "Peak 12:00" }} />',
      tokens: 'Lit dots role/chart-1…5 by lane (outside a highlight role/chart-quiet), empty role/well  ·  10px pitch, 3.1 radius, 4 dots of swell  ·  Name UI/base role/fg-muted, share Mono role/fg  ·  Flag role/inverse, marker dashed role/fg-subtle  ·  Axis Mono/xs role/fg-muted',
      file: ui('density-lanes.tsx'),
    },
    spec: () => densityLanesSpec(),
  },
  {
    doc: {
      key: 'component:coverage-matrix',
      title: 'Coverage matrix',
      usage: '<CoverageMatrix rows={tactics} columns={sources} defaultValue="lateral" formatValue={(n) => `${n} rules`} noneLabel="No rules" />',
      tokens: 'Cells 32 on radius/md, a well of the column colour at 14% (22% dark) filled from the bottom in it  ·  None: the hatch, dashed role/line-strong (selected row role/danger, role/danger-line)  ·  Selected row role/selected  ·  Names UI/base role/fg-muted, upright column names UI/sm',
      file: ui('coverage-matrix.tsx'),
    },
    spec: () => coverageMatrixSpec(),
  },
  {
    doc: {
      key: 'component:score-ring',
      title: 'Score ring',
      usage: '<ScoreRing value={77} grades={[{ from: 75, label: "B", tone: "success" }]} label="Security score" />',
      tokens: 'Ticks 40 round the ring, 2.2 wide: lit in the band tone (role/success, role/warning, role/danger) up to the score, the head 2.6 and longer, the rest role/line-strong  ·  Grade Heading role/fg  ·  64 / 96 / 128',
      file: ui('score-ring.tsx'),
    },
    spec: () => scoreRingSpec(),
  },
  {
    doc: {
      key: 'component:milestone-ruler',
      title: 'Milestone ruler',
      usage: '<MilestoneRuler milestones={[{ id: "v2", date: "2026-11-26", title: "Version 2", major: true }]} today={today} label="Roadmap 2026" />',
      tokens: 'Ticks 1px, 8 / 14 at a month, role/fg-subtle before today and role/line-strong after  ·  Today 2px role/fg and a 4px dot  ·  Pins a 2px stem (36, 56 major) and a 10 / 12 dot: role/accent done, hollow upcoming, role/warning at risk  ·  Count Mono/xs role/accent-text  ·  Callout role/overlay, role/line, radius/lg, Shadow/md  ·  Months Bezel/Eyebrow',
      file: ui('milestone-ruler.tsx'),
    },
    spec: () => milestoneRulerSpec(),
  },
  {
    doc: {
      key: 'component:calendar-heatmap',
      title: 'Calendar heatmap',
      usage: '<CalendarHeatmap days={habit} max={4} today={today} onTodayChange={mark} />',
      tokens: 'Heat the tone over role/well at 30 / 52 / 76 / 100%  ·  Missed role/well  ·  Frozen hatched role/chart-5  ·  Future a role/fg 9% ring  ·  Today ringed role/accent  ·  Months and weekdays Bezel/Eyebrow  ·  Readout Mono/sm',
      file: ui('calendar-heatmap.tsx'),
    },
    spec: () => heatmapSpec(),
  },
  {
    doc: {
      key: 'component:forecast-band',
      title: 'Forecast band',
      usage: '<ForecastBand actual={spend} forecast={projection} budget={10000} format={{ style: "currency", currency: "USD" }} />',
      tokens: 'Spent role/fg 1.75 over a role/fg 6% wash  ·  Forecast dashed role/accent in its range at 18%  ·  Budget dashed role/line-strong  ·  Crossing role/danger ring and flag  ·  Grid role/line-subtle  ·  Axes Mono/xs role/fg-muted',
      file: ui('forecast-band.tsx'),
    },
    spec: () => forecastSpec(),
  },
  {
    doc: {
      key: 'component:level-matrix',
      title: 'Level matrix',
      usage: '<LevelMatrix roles={roles} resources={resources} value={access} onValueChange={setAccess} />',
      tokens: 'Segments 10 × 10, 3px apart: on role/fg, off role/well, gain role/success, loss a role/danger outline  ·  Level Mono/sm  ·  Resources Bezel/Eyebrow  ·  Rows on role/line  ·  Bulk bar Button secondary xs',
      file: ui('level-matrix.tsx'),
    },
    spec: (deps) => levelMatrixSpec(deps),
  },
  {
    doc: {
      key: 'component:history-strip',
      title: 'History strip',
      usage: '<HistoryStrip days={uptime} target={0.999} critical={0.99} label="API uptime" />',
      tokens: 'Days role/success, below target role/warning, critical role/danger, no data role/well  ·  40 high, 2px apart (sm 14, 1px)  ·  Incident pip 4px  ·  Axis Mono/xs on a role/line rule',
      file: ui('history-strip.tsx'),
    },
    spec: () => historyStripSpec(),
  },
  {
    doc: {
      key: 'component:route-map',
      title: 'Route map',
      usage: '<RouteMap stops={stops} routes={routes} land={city} value={picked} onValueChange={setPicked} />',
      tokens: 'Ground role/canvas, role/line, radius/xl  ·  Water role/accent 6% over role/fg 9%  ·  Park role/success 9%  ·  Roads role/line  ·  Routes role/line-strong, role/fg, role/danger, dotted role/accent  ·  Current role/accent ringed role/surface  ·  Card role/overlay, Shadow/md',
      file: ui('route-map.tsx'),
    },
    spec: () => routeMapSpec(),
  },
  {
    doc: {
      key: 'component:seat-map',
      title: 'Seat map',
      usage: '<SeatMap rows={rows} tiers={tiers} currency="EUR" value={picked} onValueChange={setPicked} />',
      tokens: 'Seats the tier colour (a chart colour) at 26% on a 55% edge, picked solid with a role/on-accent check, taken role/fg 7%  ·  Stage role/fg 8%  ·  Row letters Mono/xs  ·  Legend UI/sm, prices Mono/sm',
      file: ui('seat-map.tsx'),
    },
    spec: (deps) => seatMapSpec(deps),
  },
  {
    doc: {
      key: 'component:proposal-card',
      title: 'Proposal card',
      usage: '<ProposalCard source="Routing agent" title="Reroute truck 12" options={options} proposed="harbor" actions={<Button>Approve</Button>} />',
      tokens: 'Card role/surface, role/line, radius/xl, Shadow/xs  ·  Source Mono/xs role/accent-text  ·  Proposed row role/accent-subtle, dashed role/accent-line, radius/lg  ·  Figures Mono, in their tone  ·  Muted rows at 55%',
      file: ui('proposal-card.tsx'),
    },
    spec: (deps) => proposalSpec(deps),
  },
  {
    doc: {
      key: 'component:data-table',
      title: 'Data table',
      usage: 'const table = useDataTable({ data, columns, features: dataTableFeatures({ sorting: true, rowSelection: true }) })',
      tokens: 'Surface role/surface, role/line, radius/lg  ·  Head 36, Bezel/Eyebrow (Classic UI/sm/Medium) role/fg-muted, sorted arrow  ·  Rows 44 on role/line  ·  Selected role/accent-subtle  ·  Cells: Checkbox, Badge, Button instances  ·  Selection bar role/overlay, Shadow/md  ·  Pager UI/sm',
      file: ui('data-table/'),
    },
    spec: (deps) => dataTableSpec(deps),
  },
  {
    doc: {
      key: 'component:hierarchy-chart',
      title: 'Hierarchy chart',
      usage: '<HierarchyChart root={org} value={selected} onValueChange={setSelected} label="Organisation" />',
      tokens: 'Canvas role/well, role/line, radius/xl  ·  Nodes 224 × 64, role/surface, role/line, radius/lg, Shadow/xs  ·  Edges role/line-strong 1.25, path role/accent 2  ·  Selected role/accent  ·  Toggle chip 20 high on role/surface  ·  Controls role/overlay',
      file: ui('hierarchy-chart/'),
    },
    spec: (deps) => hierarchySpec(deps),
  },
  {
    doc: {
      key: 'component:flow-graph',
      title: 'Flow graph',
      usage: '<FlowGraph nodes={steps} edges={links} value={open} onValueChange={setOpen} controls="step-detail" />',
      tokens: 'Canvas role/fg 2.5% over role/surface with a role/fg 16% dot grid  ·  Steps role/surface, radius/lg, Mono/base names, Bezel/Eyebrow kinds  ·  States role/success, role/accent, role/danger, role/warning, hollow and dashed  ·  Edges role/line-strong, running dashed role/accent',
      file: ui('flow-graph.tsx'),
    },
    spec: (deps) => flowGraphSpec(deps),
  },
  {
    doc: {
      key: 'component:lollipop-chart',
      title: 'Lollipop chart',
      usage: '<LollipopChart data={slos} sort="ascending" domain={[-1, 1]} value={picked} onValueChange={setPicked} />',
      tokens: 'Dots 8 (12 picked, a 3px role/surface gap and a ring in its ink) by tone  ·  Stems dashed role/fg-subtle  ·  Baseline role/line-strong, grid dashed role/line-subtle  ·  Ticks Mono/xs role/fg-muted  ·  Picked band role/band, pill role/inverse',
      file: ui('lollipop-chart.tsx'),
    },
    spec: () => lollipopSpec(),
  },
  {
    doc: {
      key: 'component:flow-lanes',
      title: 'Flow lanes',
      usage: '<FlowLanes source="Gateway" lanes={[{ id: "orrery", label: "Orrery 2", value: 137 }]} formatValue={(v) => `${v}/s`} />',
      tokens: 'Lines role/chart-1…5 by lane at 38% (70% lit), 1–3px by rate  ·  Particles 6px in the lane colour  ·  Source ring role/fg-muted 1.5 on role/surface, name Mono/xs role/fg-muted  ·  Names UI/base role/fg, rates Mono/sm role/fg-muted, the lit one on role/hover  ·  32px lanes (28 compact)',
      file: ui('flow-lanes.tsx'),
    },
    spec: () => flowLanesSpec(),
  },
  {
    doc: {
      key: 'component:diff-viewer',
      title: 'Diff viewer',
      usage: '<DiffViewer name="src/deploy.tsx" before={oldSource} after={newSource} language="tsx" />',
      tokens: 'Panel role/surface, role/line, radius/lg  ·  Header 44, Mono/sm file name, +/− in role/success-text and role/danger-text  ·  Added role/success-subtle, removed role/danger-subtle  ·  Numbers role/fg-subtle  ·  Hunks role/band  ·  Code Mono/base, 20 high',
      file: ui('diff-viewer/'),
    },
    spec: (deps) => diffViewerSpec(deps),
  },
  {
    doc: {
      key: 'component:chat',
      title: 'Chat',
      usage: '<ChatMessageList><ChatMessage role="user" content={text} /><ChatMessage role="assistant" content={reply} /></ChatMessageList><ChatPromptInput onSubmit={send} />',
      tokens: 'Bubble role/hover, radius/2xl, UI/lg  ·  Assistant avatar role/fg with role/canvas  ·  Reply UI/lg role/fg  ·  Tool call role/surface, role/line, radius/lg, Mono name and arguments, a Badge  ·  Prompt the field control, bezel/field-area-radius',
      file: ui('chat/'),
    },
    spec: (deps) => chatSpec(deps),
  },
  {
    doc: {
      key: 'component:filter-builder',
      title: 'Filter builder',
      usage: '<FilterBuilder fields={fields} value={query} onValueChange={setQuery} />',
      tokens: 'Panel role/surface, role/line-subtle, radius/lg  ·  Tokens role/band, control/sm, joined (2px inside, control corner at the ends)  ·  Connectors UI/base role/fg-muted, 64 wide  ·  Invalid role/danger-subtle, message role/danger-text  ·  Nested groups on a role/line hairline',
      file: ui('filter-builder/'),
    },
    spec: (deps) => filterBuilderSpec(deps),
  },
  {
    doc: {
      key: 'component:import-mapper',
      title: 'Import mapper',
      usage: '<ImportMapper fields={contactFields} onImport={save} noun={{ one: "contact", other: "contacts" }} />',
      tokens: 'File role/well, radius/md  ·  Columns UI/base/Medium, samples UI/sm role/fg-muted  ·  Targets NativeSelect  ·  Guesses Badge warning  ·  Issues UI/sm with Button outline and ghost  ·  Import Button default',
      file: ui('import-mapper/'),
    },
    spec: (deps) => importMapperSpec(deps),
  },
]
