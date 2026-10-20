export type Tone = 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5' | 'quiet'

export interface Item {
  id: string
  label: string
  value: number
  /** The same part in the period before: its change. */
  previous?: number
  /** Its colour. Default: the chart colours in order of size; the grouped rest is quiet gray. */
  tone?: Tone
  /** Its own parts: pressing it zooms in on them. */
  children?: Item[]
}

/** The block's item type, under its name. */
export type BreakdownItem = Item

/* ── Demo data ─────────────────────────────────────────────────────────────
 * A software company's revenue for September, by region, each region by
 * country and each country by plan: deep enough to drill twice, with long
 * tails that fold into Other. Figures are in US dollars. */

const plans = (id: string, total: number, previous: number, split: [number, number, number]): Item[] =>
  (['Business', 'Team', 'Starter'] as const).map((label, i) => ({
    id: `${id}-${label.toLowerCase()}`,
    label,
    value: Math.round(total * split[i]!),
    previous: Math.round(previous * split[i]! * [1.04, 0.98, 0.95][i]!),
  }))

const country = (id: string, label: string, value: number, previous: number, split: [number, number, number] = [0.52, 0.33, 0.15]): Item => ({
  id,
  label,
  value,
  previous,
  children: plans(id, value, previous, split),
})

const region = (id: string, label: string, countries: Item[]): Item => ({
  id,
  label,
  value: countries.reduce((t, c) => t + c.value, 0),
  previous: countries.reduce((t, c) => t + (c.previous ?? 0), 0),
  children: countries,
})

export const ITEMS: Item[] = [
  region('na', 'North America', [
    country('us', 'United States', 412_300, 386_900, [0.58, 0.3, 0.12]),
    country('ca', 'Canada', 61_800, 57_400),
    country('mx', 'Mexico', 18_900, 15_200, [0.38, 0.37, 0.25]),
  ]),
  region('eu', 'Europe', [
    country('de', 'Germany', 96_400, 91_100),
    country('gb', 'United Kingdom', 88_200, 84_700),
    country('fr', 'France', 54_900, 52_300),
    country('nl', 'Netherlands', 31_700, 27_800),
    country('se', 'Sweden', 22_100, 20_600),
    country('es', 'Spain', 18_400, 17_900),
    country('pl', 'Poland', 12_800, 9_900, [0.34, 0.4, 0.26]),
    country('it', 'Italy', 11_600, 12_400),
    country('ch', 'Switzerland', 9_800, 9_100, [0.66, 0.24, 0.1]),
  ]),
  region('apac', 'Asia Pacific', [
    country('jp', 'Japan', 64_200, 66_800),
    country('au', 'Australia', 47_500, 44_200),
    country('in', 'India', 36_800, 28_100, [0.3, 0.38, 0.32]),
    country('sg', 'Singapore', 22_900, 21_700),
    country('kr', 'South Korea', 19_600, 18_200),
    country('nz', 'New Zealand', 8_100, 7_900),
  ]),
  region('latam', 'Latin America', [
    country('br', 'Brazil', 41_300, 33_600, [0.36, 0.38, 0.26]),
    country('ar', 'Argentina', 12_200, 10_100, [0.3, 0.4, 0.3]),
    country('co', 'Colombia', 9_700, 7_800, [0.3, 0.4, 0.3]),
    country('cl', 'Chile', 8_400, 7_500),
  ]),
  region('mea', 'Middle East & Africa', [
    country('ae', 'United Arab Emirates', 21_400, 18_800),
    country('za', 'South Africa', 13_900, 13_100),
    country('il', 'Israel', 12_700, 11_900),
    country('sa', 'Saudi Arabia', 9_200, 7_100),
  ]),
]

export const DEFAULT_COPY = {
  title: 'Revenue by region',
  /** What the total is, under the title. */
  description: 'September, in US dollars',
  /** The top of the breadcrumb. */
  all: 'All regions',
  /** The grouped rest of a level, "Other (4)". */
  other: (count: number) => `Other (${count})`,
  /** The center of the ring, under the figure. */
  total: 'Total',
  /** The list's name: the level shown. */
  list: (level: string) => `${level}, largest first`,
  /** The breadcrumb's name. */
  path: 'Breakdown path',
  /** A part's name for assistive tech: its figure, share and change, and what pressing it does. */
  item: (label: string, value: string, share: string, change: string) => `${label}: ${value}, ${share}${change ? `, ${change}` : ''}`,
  /** Said after a part that opens: how many parts it holds. */
  drill: (count: number) => `${count} parts inside`,
  /** The share of the level's total. */
  share: (share: string) => `${share} of the total`,
  up: (change: string) => `up ${change}`,
  down: (change: string) => `down ${change}`,
  /** The change's comparison, shown in the center while a part is pointed at. */
  versus: 'vs. last month',
  /** Spoken after zooming in or out. */
  opened: (label: string, value: string, count: number) => `${label}: ${value} across ${count} parts.`,
  loading: 'Loading the breakdown',
  retry: 'Retry',
  empty: 'Nothing to break down yet',
  emptyDescription: 'Parts appear once there is revenue in the period.',
}

export type BreakdownCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale every figure is written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}
