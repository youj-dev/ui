/* Fixtures, types and the demo model for the logistics hubs: the distribution
 * hubs a carrier sorts through, each with its parcel volume, on-time rate,
 * delays and dock capacity, and the lanes between them with the parcels each
 * carries. */

export type HubMapTone = 'success' | 'warning' | 'danger'

/** A state a hub can be in, with its color. */
export interface HubMapStatus {
  id: string
  label: string
  tone: HubMapTone
  /** On target: the hub doesn't ping, counts toward the healthy total and isn't picked first. */
  healthy?: boolean
}

/** What the halos on the map show. */
export interface HubMapMetric {
  id: string
  label: string
  /** The hub's volume, or its backlog. */
  measure: 'volume' | 'backlog'
}

export interface HubMapHub {
  /** A short code, set in mono: the airport code, "MEM". */
  id: string
  city: string
  /** Longitude in degrees, east positive. */
  lng: number
  /** Latitude in degrees, north positive. */
  lat: number
  /** Handled per hour. */
  volume: number
  /** Share of the volume on target, 0–1. */
  health: number
  /** Held up right now. */
  backlog: number
  /** Share of its capacity in use, 0–1. */
  load: number
  /** A `HubMapStatus` id. */
  status: string
}

export interface HubMapLane {
  /** Volume flows from this hub… */
  from: string
  /** …to this one. */
  to: string
  /** Volume per hour. */
  volume: number
  /** Door-to-dock time, hours. */
  time: number
}

/** Where the readings turn to the warning ink: below `health` on target, above `backlog` held up, above `load` of capacity in use. */
export interface HubMapThresholds {
  health: number
  backlog: number
  load: number
}

export const THRESHOLDS: HubMapThresholds = { health: 0.9, backlog: 1_000, load: 0.85 }

export const STATUSES: HubMapStatus[] = [
  { id: 'onSchedule', label: 'On schedule', tone: 'success', healthy: true },
  { id: 'delayed', label: 'Delayed', tone: 'warning' },
  { id: 'halted', label: 'Halted', tone: 'danger' },
]

export const METRICS: HubMapMetric[] = [
  { id: 'volume', label: 'Volume', measure: 'volume' },
  { id: 'delays', label: 'Delays', measure: 'backlog' },
]

export const HUBS: HubMapHub[] = [
  { id: 'ANC', city: 'Anchorage', lng: -149.9, lat: 61.2, volume: 27_800, health: 0.962, backlog: 410, load: 0.61, status: 'onSchedule' },
  { id: 'MEM', city: 'Memphis', lng: -90, lat: 35.1, volume: 62_400, health: 0.974, backlog: 820, load: 0.83, status: 'onSchedule' },
  { id: 'GRU', city: 'São Paulo', lng: -46.5, lat: -23.4, volume: 9_400, health: 0.812, backlog: 2_140, load: 0.94, status: 'delayed' },
  { id: 'LEJ', city: 'Leipzig', lng: 12.2, lat: 51.4, volume: 38_600, health: 0.958, backlog: 690, load: 0.72, status: 'onSchedule' },
  { id: 'JNB', city: 'Johannesburg', lng: 28.2, lat: -26.1, volume: 6_100, health: 0.931, backlog: 180, load: 0.46, status: 'onSchedule' },
  { id: 'DXB', city: 'Dubai', lng: 55.4, lat: 25.3, volume: 24_300, health: 0.955, backlog: 370, load: 0.64, status: 'onSchedule' },
  { id: 'SIN', city: 'Singapore', lng: 103.8, lat: 1.35, volume: 29_700, health: 0.968, backlog: 290, load: 0.69, status: 'onSchedule' },
  { id: 'HKG', city: 'Hong Kong', lng: 113.9, lat: 22.3, volume: 51_200, health: 0.944, backlog: 1_260, load: 0.88, status: 'onSchedule' },
  { id: 'SYD', city: 'Sydney', lng: 151.2, lat: -33.9, volume: 11_200, health: 0.951, backlog: 140, load: 0.41, status: 'onSchedule' },
]

export const LANES: HubMapLane[] = [
  { from: 'MEM', to: 'LEJ', volume: 11_800, time: 11 },
  { from: 'ANC', to: 'MEM', volume: 8_600, time: 6 },
  { from: 'MEM', to: 'GRU', volume: 3_900, time: 13 },
  { from: 'LEJ', to: 'JNB', volume: 1_700, time: 14 },
  { from: 'DXB', to: 'LEJ', volume: 5_200, time: 9 },
  { from: 'HKG', to: 'LEJ', volume: 9_400, time: 16 },
  { from: 'SIN', to: 'DXB', volume: 4_600, time: 10 },
  { from: 'HKG', to: 'SIN', volume: 6_800, time: 5 },
  { from: 'SIN', to: 'SYD', volume: 2_900, time: 9 },
]

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/** A live tick: every figure drifts a few percent, the same way on every run (a seeded wobble, not Math.random). */
export function drift(hubs: HubMapHub[], lanes: HubMapLane[], tick: number): { hubs: HubMapHub[]; lanes: HubMapLane[] } {
  const wobble = (i: number) => Math.sin(tick * 1.3 + i * 2.1) * 0.04 + Math.sin(tick * 0.45 + i * 0.7) * 0.025
  return {
    hubs: hubs.map((h, i) => {
      const w = wobble(i)
      return {
        ...h,
        volume: Math.round((h.volume * (1 + w)) / 10) * 10,
        backlog: Math.max(0, Math.round(h.backlog * (1 + w * 2))),
        health: clamp(h.health * (1 - w * 0.12), 0, 0.999),
        load: clamp(h.load * (1 + w * 0.5), 0.05, 0.99),
      }
    }),
    lanes: lanes.map((l, i) => ({ ...l, volume: Math.max(50, Math.round((l.volume * (1 + wobble(i + 3) * 1.5)) / 10) * 10) })),
  }
}

/** Diverts hubs: each keeps a trickle, and its peers take the rest in proportion to their lanes. */
export function divert(hubs: HubMapHub[], lanes: HubMapLane[], diverted: readonly string[]): { hubs: HubMapHub[]; lanes: HubMapLane[] } {
  if (!diverted.length) return { hubs, lanes }
  const extra = new Map<string, number>()
  for (const id of diverted) {
    const hub = hubs.find((h) => h.id === id)
    const peers = lanes.filter((l) => (l.from === id || l.to === id) && !diverted.includes(l.from === id ? l.to : l.from))
    const weight = peers.reduce((sum, l) => sum + l.volume, 0)
    if (!hub || !weight) continue
    for (const l of peers) {
      const peer = l.from === id ? l.to : l.from
      extra.set(peer, (extra.get(peer) ?? 0) + (hub.volume * 0.92 * l.volume) / weight)
    }
  }
  return {
    hubs: hubs.map((h) =>
      diverted.includes(h.id)
        ? { ...h, volume: Math.round(h.volume * 0.08), backlog: 0, load: 0.06 }
        : {
            ...h,
            volume: Math.round(h.volume + (extra.get(h.id) ?? 0)),
            load: Math.min(0.99, h.load * (1 + (extra.get(h.id) ?? 0) / Math.max(1, h.volume))),
          },
    ),
    lanes: lanes.map((l) => (diverted.includes(l.from) || diverted.includes(l.to) ? { ...l, volume: Math.round((l.volume * 1.4) / 10) * 10 } : l)),
  }
}

/** Where a place lands on the map, as a share of its width and height (equirectangular, 180°W–180°E, 78°N–57°S). */
export const placeOf = (lng: number, lat: number) => ({ x: (lng + 180) / 360, y: (78 - lat) / 135 })

export const DEFAULT_COPY = {
  title: 'Hub network',
  subtitle: (count: number) => `Today · ${count} hubs`,
  more: 'More network actions',
  exportCsv: 'Export manifest',
  openRunbook: 'Open contingency plan',
  live: 'Live',
  demoData: 'Demo data',
  throughput: 'Parcels sorted',
  unit: '/h',
  health: 'On time',
  healthy: 'Hubs on schedule',
  healthyCount: (ok: number, total: number) => `${ok} of ${total}`,
  inTransit: 'In transit',
  metric: 'Show on the map',
  map: 'Distribution hubs on a world map, with the shipments between them',
  hubs: 'Hubs',
  acted: 'Diverted',
  /** A hub on the map, as spoken: its code, city, status and figures. */
  hubLabel: (id: string, city: string, status: string, volume: string, health: string) => `${id}, ${city}, ${status}, ${volume}, ${health} on time`,
  volume: 'Throughput',
  backlog: 'Late parcels',
  load: 'Sort capacity',
  lastHour: 'Parcels sorted, last hour',
  lanes: 'Top lanes',
  outbound: (peer: string) => `to ${peer}`,
  inbound: (peer: string) => `from ${peer}`,
  duration: 'Transit',
  legend: 'Legend',
  arcs: 'Shipments between hubs',
  action: 'Divert to peers',
  actionPending: 'Diverting…',
  resume: 'Resume intake',
  resumePending: 'Resuming…',
  /** Announced when a hub is diverted or resumed. */
  actionNote: (id: string) => `${id} diverted. Its parcels are rerouting through nearby hubs.`,
  resumeNote: (id: string) => `${id} is taking parcels again.`,
  manifests: 'Manifests',
  updated: 'Scans every 5 min · ETAs from carrier feeds',
  loadingLabel: 'Loading the network',
  errorTitle: 'Couldn’t load the network.',
  retry: 'Retry',
  emptyTitle: 'No hubs yet',
  emptyDescription: 'Hubs show up here once they report.',
}

export type HubMapCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale its numbers and dates are written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
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
