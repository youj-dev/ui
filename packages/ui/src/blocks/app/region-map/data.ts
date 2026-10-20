/* Fixtures and types for the traffic-by-region card: an edge network's points
 * of presence, each with its requests per second and p95 latency, per range. */

/** A span of time the snapshots are for. */
export interface RegionMapRange {
  id: string
  /** On its button. */
  label: string
  /** In the subtitle: "last 5 min". */
  name: string
  /** The total the range opened on, for the change beside the total. Without it the change reads as 0. */
  previous?: number
}

export const RANGES: RegionMapRange[] = [
  { id: '5m', label: '5M', name: 'last 5 min', previous: 54_300 },
  { id: '1h', label: '1H', name: 'last hour', previous: 58_900 },
  { id: '24h', label: '24H', name: 'last 24 hours', previous: 50_400 },
]

export interface RegionMapRegion {
  /** A short code, set in mono: the nearest airport's, by convention. */
  id: string
  city: string
  /** Longitude, degrees, east positive. */
  lng: number
  /** Latitude, degrees, north positive. */
  lat: number
  /** The main rate, per second. */
  value: number
  /** A reading where higher is worse, such as p95 latency in milliseconds. Past the card's `threshold` the region is flagged. */
  reading: number
  /** The share of events that fail, 0 to 1. */
  failures?: number
}

/** A region is flagged past this reading: its glow and its row turn to the warning tone. */
export const THRESHOLD = 180

/** A failure rate for the demo: flagged regions fail more. */
const failureOf = (reading: number, threshold = THRESHOLD) => (reading > threshold ? 0.021 : 0.0012)

const place = {
  iad: { city: 'Washington, D.C.', lng: -77.04, lat: 38.9 },
  sfo: { city: 'San Francisco', lng: -122.42, lat: 37.77 },
  fra: { city: 'Frankfurt', lng: 8.68, lat: 50.11 },
  lhr: { city: 'London', lng: -0.13, lat: 51.51 },
  nrt: { city: 'Tokyo', lng: 139.69, lat: 35.68 },
  sin: { city: 'Singapore', lng: 103.82, lat: 1.35 },
  bom: { city: 'Mumbai', lng: 72.88, lat: 19.08 },
  gru: { city: 'São Paulo', lng: -46.63, lat: -23.55 },
  syd: { city: 'Sydney', lng: 151.21, lat: -33.87 },
  jnb: { city: 'Johannesburg', lng: 28.05, lat: -26.2 },
} as const

type Reading = [id: keyof typeof place, value: number, reading: number]
const regions = (readings: Reading[]): RegionMapRegion[] =>
  readings.map(([id, value, reading]) => ({ id, ...place[id], value, reading, failures: failureOf(reading) }))

export const SNAPSHOTS: Record<string, RegionMapRegion[]> = {
  '5m': regions([
    ['iad', 12_400, 38],
    ['fra', 9_800, 35],
    ['sfo', 8_900, 42],
    ['lhr', 7_600, 33],
    ['nrt', 6_100, 51],
    ['sin', 4_300, 64],
    ['bom', 3_200, 88],
    ['gru', 2_700, 212],
    ['syd', 1_900, 71],
    ['jnb', 900, 96],
  ]),
  '1h': regions([
    ['iad', 11_800, 36],
    ['fra', 10_200, 34],
    ['sfo', 8_100, 40],
    ['lhr', 7_900, 31],
    ['nrt', 5_600, 49],
    ['sin', 4_600, 61],
    ['bom', 3_500, 84],
    ['gru', 2_300, 164],
    ['syd', 1_700, 69],
    ['jnb', 1_000, 92],
  ]),
  '24h': regions([
    ['iad', 9_700, 35],
    ['fra', 8_400, 33],
    ['sfo', 7_300, 39],
    ['lhr', 6_900, 31],
    ['nrt', 6_800, 47],
    ['sin', 5_100, 58],
    ['bom', 4_200, 81],
    ['gru', 2_100, 131],
    ['syd', 2_000, 66],
    ['jnb', 800, 90],
  ]),
}

/** A live tick: every rate drifts a few percent, the same way on every run (a seeded wobble, not Math.random). */
export function drift(list: RegionMapRegion[], tick: number, threshold = THRESHOLD): RegionMapRegion[] {
  return list.map((r, i) => {
    const wobble = Math.sin(tick * 1.7 + i * 2.3) * 0.035 + Math.sin(tick * 0.6 + i) * 0.02
    const reading = Math.max(20, Math.round(r.reading * (1 + wobble / 2)))
    return { ...r, value: Math.round((r.value * (1 + wobble)) / 10) * 10, reading, failures: failureOf(reading, threshold) }
  })
}

/** In the demo, handled regions hand most of their load to the busiest unhandled region and recover their reading. */
export function handle(base: RegionMapRegion[], handled: readonly string[], threshold = THRESHOLD): RegionMapRegion[] {
  if (!handled.length) return base
  const moved = base.filter((r) => handled.includes(r.id)).reduce((sum, r) => sum + r.value * 0.8, 0)
  const target = base.filter((r) => !handled.includes(r.id)).sort((a, b) => b.value - a.value)[0]?.id
  return base.map((r) => {
    if (handled.includes(r.id)) {
      const reading = Math.min(r.reading, threshold - 40)
      return { ...r, value: Math.round(r.value * 0.2), reading, failures: failureOf(reading, threshold) }
    }
    return r.id === target ? { ...r, value: r.value + Math.round(moved) } : r
  })
}

export const DEFAULT_COPY = {
  title: 'Traffic',
  scope: 'edge network',
  more: 'More traffic actions',
  exportCsv: 'Export CSV',
  openLogs: 'Open request logs',
  range: 'Time range',
  measure: 'Requests',
  unit: 'rps',
  change: (delta: string) => `${delta} vs. previous`,
  live: 'Live',
  demoData: 'Demo data',
  reading: 'p95 latency',
  failures: 'Error rate',
  regionsLabel: 'Regions',
  regionCount: (count: number, flagged: number) => `${count} regions${flagged ? ` · ${flagged} slow` : ''}`,
  map: 'Requests by region on a world map',
  mapLabel: 'Requests by region',
  mapHint: 'Hover a region',
  region: 'Region',
  share: 'Share',
  valueHead: 'Requests/s',
  readingHead: 'p95',
  flagged: 'Slow',
  showOnMap: (city: string) => `${city}, show on the map`,
  /** `{count}` is replaced by the number of regions, kept in its own case. */
  footer: 'Anycast · {count} points of presence',
  action: 'Reroute traffic',
  actionPending: 'Rerouting…',
  actionDone: 'Rerouted',
  logs: 'Open logs',
  loadingLabel: 'Loading regions',
  errorTitle: 'Couldn’t load the regions.',
  retry: 'Retry',
  emptyTitle: 'No regions yet',
  emptyDescription: 'Regions show up here once they report.',
}

export type RegionMapCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale its numbers and dates are written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}

/** The failure rate across the regions, weighted by their rate. */
export const failureRate = (list: RegionMapRegion[]) => {
  const total = list.reduce((sum, r) => sum + r.value, 0)
  return total ? list.reduce((sum, r) => sum + r.value * (r.failures ?? 0), 0) / total : 0
}

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
export function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  return wait(ms)
}
