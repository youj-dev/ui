export type Group = 'high-high' | 'low-high' | 'low-low' | 'high-low'
export type Scale = 'linear' | 'log'

export interface Item {
  id: string
  label: string
  /** Its place across (the first measure) and up (the second). */
  x: number
  y: number
  /** How big its bubble is (seats, users); bubbles grow by area. Default: all one size. */
  size?: number
  /** Where it stood last period: turns on Movement. */
  previous?: { x: number; y: number }
}

export interface Axis {
  /** Intl.NumberFormat options for its figures. Default: whole numbers. */
  format?: Intl.NumberFormatOptions
  /** `log` for measures that span powers of ten (revenue). Default `linear`. */
  scale?: Scale
  /** Its ends. Default: rounded out from the items. */
  domain?: [number, number]
}

/** The block's item types, under its name. */
export type QuadrantItem = Item
export type QuadrantGroup = Group
export type QuadrantAxis = Axis

/** The group a place falls in: high or low across, then up. */
export const groupOf = (x: number, y: number, [tx, ty]: [number, number]): Group => `${x >= tx ? 'high' : 'low'}-${y >= ty ? 'high' : 'low'}`
export const GROUPS: Group[] = ['high-high', 'low-high', 'high-low', 'low-low']
/** Each group's chart colour: the good corner first, the one at risk in the warm one, the quiet corner quiet. */
export const TONES: Record<Group, string> = {
  'high-high': 'var(--color-chart-1)',
  'low-high': 'var(--color-chart-2)',
  'high-low': 'var(--color-chart-5)',
  'low-low': 'var(--color-chart-quiet)',
}

/* ── Demo data ─────────────────────────────────────────────────────────────
 * A product's 36 business accounts in September: across, the share of
 * their seats active each week; up, monthly revenue (a log scale, since
 * the largest pays a hundred times the smallest); bubbles by seats; and
 * where each stood in August. Three champions slid into risk as their usage
 * fell, one at-risk account came back, and three moved up from nurture or
 * expand. Demo content — edit after adding. */

const row = (id: string, label: string, x: number, y: number, size: number, px: number, py: number): Item => ({ id, label, x, y, size, previous: { x: px, y: py } })

export const ITEMS: Item[] = [
  row('northgate', 'Northgate Labs', 86, 42_100, 380, 82, 39_800),
  row('cobalt', 'Cobalt Freight', 78, 28_400, 240, 74, 26_000),
  row('fernway', 'Fernway Health', 71, 18_900, 210, 69, 18_900),
  row('lantern', 'Lantern Retail', 92, 12_600, 96, 88, 11_800),
  row('harbor', 'Harbor & Pine', 64, 9_400, 120, 51, 9_400),
  row('kestrel', 'Kestrel Mutual', 68, 54_200, 420, 70, 52_000),
  row('orchard', 'Orchard Studio', 83, 6_200, 48, 79, 4_100),
  row('quarry', 'Quarry Systems', 59, 15_800, 150, 62, 15_200),
  row('ironwood', 'Ironwood Legal', 75, 7_800, 64, 73, 7_800),
  row('granite', 'Granite Assurance', 31, 36_800, 310, 63, 36_800),
  row('tidewater', 'Tidewater Logistics', 44, 21_400, 260, 58, 21_400),
  row('vantage', 'Vantage Media', 38, 11_200, 140, 41, 11_900),
  row('saltbox', 'Saltbox Foods', 22, 8_600, 90, 35, 8_600),
  row('parallax', 'Parallax Games', 49, 5_600, 72, 61, 5_600),
  row('riverbend', 'Riverbend Clinics', 27, 14_300, 180, 30, 14_800),
  row('dovecote', 'Dovecote', 81, 2_400, 22, 77, 2_400),
  row('ember', 'Ember Analytics', 73, 3_900, 38, 44, 3_600),
  row('fieldwork', 'Fieldwork', 88, 1_300, 12, 86, 1_300),
  row('juniper', 'Juniper & Co', 66, 4_100, 41, 63, 3_900),
  row('yardline', 'Yardline', 92, 900, 8, 90, 900),
  row('brightwell', 'Brightwell', 57, 2_900, 30, 48, 2_700),
  row('acorn', 'Acorn Robotics', 69, 1_800, 18, 71, 1_800),
  row('wren', 'Wren Health', 77, 3_300, 26, 75, 3_100),
  row('umbra', 'Umbra Studio', 41, 2_100, 24, 44, 2_100),
  row('zephyr', 'Zephyr Air', 18, 3_800, 46, 21, 3_800),
  row('larkspur', 'Larkspur', 35, 900, 9, 33, 900),
  row('mosaic', 'Mosaic Learning', 48, 1_600, 20, 52, 1_600),
  row('pebble', 'Pebble Pay', 12, 600, 6, 15, 600),
  row('halcyon', 'Halcyon Rooms', 29, 4_600, 52, 34, 4_600),
  row('sundial', 'Sundial', 53, 1_100, 14, 49, 1_100),
  row('thistle', 'Thistle', 24, 2_700, 31, 22, 2_700),
  row('copperline', 'Copperline', 40, 3_300, 36, 38, 3_300),
  row('vellum', 'Vellum', 15, 1_900, 17, 18, 1_900),
  row('basin', 'Basin Water', 33, 4_400, 58, 39, 4_400),
  row('clover', 'Clover Dental', 46, 700, 7, 43, 700),
  row('driftwood', 'Driftwood', 8, 1_200, 15, 12, 1_200),
]
export const THRESHOLDS: [number, number] = [55, 5_000]
export const X: Axis = { format: { style: 'unit', unit: 'percent', maximumFractionDigits: 0 }, domain: [0, 100] }
export const Y: Axis = { format: { style: 'currency', currency: 'USD', notation: 'compact', minimumFractionDigits: 0, maximumFractionDigits: 1 }, scale: 'log' }

export const DEFAULT_COPY = {
  title: 'Account health',
  /** Under the title. */
  description: (count: string) => `${count} accounts by product usage and revenue · September`,
  /** The measures, across and up, and what a bubble's size is. */
  x: 'Weekly active seats',
  y: 'MRR',
  size: 'Seats',
  /** An item's figures, in the line over the field. */
  xValue: (value: string) => `${value} weekly active`,
  yValue: (value: string) => `${value} MRR`,
  sizeValue: (value: string) => `${value} seats`,
  /** The four groups' names. */
  groups: { 'high-high': 'Champions', 'low-high': 'At risk', 'high-low': 'Expand', 'low-low': 'Nurture' } as Record<Group, string>,
  /** The chips over the chart: their name for assistive tech, and each chip's. */
  filter: 'Show a group',
  chip: (group: string, count: string) => `${group}: ${count}`,
  /** The switch that draws where each stood last period. */
  movement: 'Movement',
  movedFrom: (group: string) => `from ${group}`,
  /** The chart's name, its points' group, and a point for assistive tech. */
  chart: 'Accounts by usage and revenue',
  points: 'Accounts',
  point: (label: string, x: string, y: string, size: string, group: string, moved: string) => `${label}: ${x} weekly active, ${y} MRR${size ? `, ${size} seats` : ''}. ${group}${moved ? `, ${moved}` : ''}.`,
  /** The split lines' handles. */
  splitX: (value: string) => `Usage split at ${value}`,
  splitY: (value: string) => `Revenue split at ${value}`,
  splitXName: 'Usage split',
  splitYName: 'Revenue split',
  /** The list beside the chart. */
  all: 'All accounts',
  list: (group: string) => `${group}, by revenue`,
  /** Spoken after the split moves or a group is picked: each group's count. */
  counts: (parts: string) => `${parts}.`,
  /** The chart's summary for assistive tech. */
  summary: (count: string, parts: string) => `${count} accounts. ${parts}.`,
  loading: 'Loading accounts',
  retry: 'Retry',
  empty: 'No accounts yet',
  emptyDescription: 'Accounts appear once they have usage and revenue.',
}

export type QuadrantCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale every figure is written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}

/* ── Scales ──────────────────────────────────────────────────────────────── */

export interface Measure {
  /** A value's place along the axis, 0 to 1. */
  at: (value: number) => number
  /** The value at a place. */
  from: (t: number) => number
  /** Grid lines; the major ones are labelled. */
  ticks: { value: number; major: boolean }[]
  /** A split dragged or stepped here, rounded to a figure worth reading. */
  round: (value: number) => number
  /** One keyboard step from a value, up or down (`big` for Page Up and Down, or Shift). */
  step: (value: number, up: boolean, big: boolean) => number
  domain: [number, number]
}

const two = (v: number) => Number(v.toPrecision(2))

/** A measure's scale: linear, rounded out to four even steps, or log, out to powers of ten with 1-2-5 ticks. */
export function measure(values: number[], axis: Axis): Measure {
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  if (axis.scale === 'log') {
    // Out to the 1-2-5 steps either side, so the field isn't spent on a decade nothing reaches.
    const steps = (v: number) => [1, 2, 5, 10].map((m) => m * 10 ** Math.floor(Math.log10(Math.max(v, 1e-9))))
    const [d0, d1] = axis.domain ?? [steps(lo).filter((s) => s <= lo).at(-1)!, steps(hi).find((s) => s >= hi)!]
    const [l0, l1] = [Math.log10(d0), Math.log10(d1)]
    const ticks: Measure['ticks'] = []
    // Every 1-2-5 step is labelled while the span is short enough to give each room; else the powers of ten.
    for (let p = Math.floor(l0); p <= Math.ceil(l1); p++) for (const m of [1, 2, 5]) if (m * 10 ** p >= d0 && m * 10 ** p <= d1) ticks.push({ value: m * 10 ** p, major: m === 1 || l1 - l0 <= 2.5 })
    return {
      at: (v) => (Math.log10(Math.max(v, d0)) - l0) / (l1 - l0 || 1),
      from: (t) => 10 ** (l0 + t * (l1 - l0)),
      ticks,
      round: (v) => two(Math.min(d1, Math.max(d0, v))),
      step: (v, up, big) => two(Math.min(d1, Math.max(d0, v * (big ? 1.5 : 1.1) ** (up ? 1 : -1)))),
      domain: [d0, d1],
    }
  }
  const span = (axis.domain ? axis.domain[1] - axis.domain[0] : hi - lo) || 1
  const unit = 10 ** Math.floor(Math.log10(span / 4))
  const tick = [1, 2, 2.5, 5, 10].map((m) => m * unit).find((s) => span / s <= 5) ?? 10 * unit
  const [d0, d1] = axis.domain ?? [Math.floor(lo / tick) * tick, Math.ceil(hi / tick) * tick]
  const fine = tick / 20
  return {
    at: (v) => (v - d0) / (d1 - d0 || 1),
    from: (t) => d0 + t * (d1 - d0),
    ticks: Array.from({ length: Math.round((d1 - d0) / tick) + 1 }, (_, i) => ({ value: d0 + i * tick, major: true })),
    round: (v) => Math.min(d1, Math.max(d0, Math.round(v / fine) * fine)),
    step: (v, up, big) => Math.min(d1, Math.max(d0, Math.round((v + (up ? 1 : -1) * (big ? tick : fine)) / fine) * fine)),
    domain: [d0, d1],
  }
}

/** The middle value, rounded like a split. */
export function median(values: number[], m: Measure) {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = sorted.length / 2
  return m.round(sorted.length % 2 ? sorted[Math.floor(mid)]! : (sorted[mid - 1]! + sorted[mid]!) / 2)
}

/** The nearest item to `from` in a direction on screen ([1, 0] is right, [0, -1] up), by its place: along the direction, plus twice the distance across it. */
export function nearest(items: Item[], from: Item, dir: [number, number], at: (item: Item) => { left: number; top: number }, width: number, height: number) {
  const a = at(from)
  let best = Infinity
  let next: Item | undefined
  for (const item of items) {
    const b = at(item)
    const dx = (b.left - a.left) * width
    const dy = (b.top - a.top) * height
    const along = dx * dir[0] + dy * dir[1]
    const score = along + 2 * Math.abs(dx * dir[1] - dy * dir[0])
    if (item !== from && along > 0 && score < best) [best, next] = [score, item]
  }
  return next
}
