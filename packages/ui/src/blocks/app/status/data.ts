import type { UptimeDay } from '../../../components/ui/history-strip'

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

export type ServiceStatus = 'operational' | 'degraded' | 'outage'

/** A status a service can be in: its label and the tone of its pill and dot. */
export interface StatusLevel {
  id: string
  label: string
  tone: 'accent' | 'info' | 'success' | 'warning' | 'danger'
}

/** Best first. A day at or above the target is the first, one above the critical line the second, anything below the last; with fewer, the last stands in. */
export const STATUSES: StatusLevel[] = [
  { id: 'operational', label: 'Operational', tone: 'success' },
  { id: 'degraded', label: 'Degraded', tone: 'warning' },
  { id: 'outage', label: 'Outage', tone: 'danger' },
]

export interface StatusService {
  id: string
  /** Set in mono. */
  name: string
  /** One entry per day, oldest first; the last is today. */
  days: UptimeDay[]
  /** A `StatusLevel` id, to say its status instead of reading it from today's uptime. */
  status?: string
}

/** The window, and the demo's "today", so the fixtures read the same on every visit. */
export const WINDOW = 90
export const TODAY = new Date(2026, 8, 28)
/** The SLA: a day at or above it is healthy. Below CRITICAL it's an outage. */
export const TARGET = 0.999
export const CRITICAL = 0.99

const DAY_MINUTES = 1440
const iso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const dayOf = (ago: number, today = TODAY) => iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - ago))

/** A day as a local Date: "2026-09-28" or a Date, at midnight. */
export const dayDate = (day: Date | string) => {
  const [y, m, d] = typeof day === 'string' ? day.split('-').map(Number) : [day.getFullYear(), day.getMonth() + 1, day.getDate()]
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1)
}
/** Whole days from `day` to `today`. */
export const daysBetween = (day: Date | string, today: Date | string) => Math.round((+dayDate(today) - +dayDate(day)) / 86_400_000)

/** A small seeded generator (mulberry32), so the history is the same on every visit. */
function seeded(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Incident {
  /** Days before today. */
  ago: number
  /** Minutes down, or null for a day without data. */
  minutes: number | null
  note?: string
}

/** Ninety quiet days to `today` with the odd one-minute blip, then the incidents on top. */
function history(seed: number, incidents: Incident[], today: Date): UptimeDay[] {
  const random = seeded(seed)
  return Array.from({ length: WINDOW }, (_, i) => {
    const ago = WINDOW - 1 - i
    const roll = random()
    // Today is clean unless an incident says otherwise.
    const blip = ago === 0 ? 0 : roll < 0.07 ? 1 : roll < 0.085 ? 2 + Math.floor(random() * 3) : 0
    const incident = incidents.find((e) => e.ago === ago)
    if (incident?.minutes === null) return { date: dayOf(ago, today), uptime: null }
    const minutes = incident?.minutes ?? blip
    return {
      date: dayOf(ago, today),
      uptime: 1 - minutes / DAY_MINUTES,
      downtimeMinutes: minutes,
      incidents: incident ? 1 : 0,
      ...(incident?.note ? { note: incident.note } : null),
    }
  })
}

/** The demo fleet, its 90 days ending on `today`. */
export const demoServices = (today: Date = TODAY): StatusService[] => [
  { id: 'api', name: 'api-gateway', days: history(11, [{ ago: 23, minutes: 9, note: 'Elevated 5xx after a config push' }], today) },
  { id: 'web', name: 'web-app', days: history(29, [], today) },
  {
    id: 'webhooks',
    name: 'webhooks',
    days: history(47, [
      { ago: 41, minutes: 192, note: 'Delivery queue stalled; backlog replayed' },
      { ago: 40, minutes: 11, note: 'Backlog drain' },
    ], today),
  },
  { id: 'auth', name: 'auth', days: history(53, [], today) },
  {
    id: 'search',
    name: 'search',
    days: history(71, [
      { ago: 12, minutes: 6, note: 'Index rebuild' },
      { ago: 11, minutes: 14, note: 'Index rebuild' },
      { ago: 10, minutes: 8, note: 'Index rebuild' },
    ], today),
  },
  {
    id: 'storage',
    name: 'storage',
    days: history(89, [
      { ago: 57, minutes: null },
      { ago: 4, minutes: 26, note: 'Upload errors in eu-west' },
    ], today),
  },
]

export const SERVICES: StatusService[] = demoServices()

/** The same fleet with storage down today. */
export const SERVICES_INCIDENT: StatusService[] = SERVICES.map((s) =>
  s.id === 'storage'
    ? { ...s, days: [...s.days.slice(0, -1), { date: dayOf(0), uptime: 1 - 58 / DAY_MINUTES, downtimeMinutes: 58, incidents: 1, note: 'Upload errors in eu-west, ongoing' }] }
    : s,
)

/** Every service's day averaged into one; days without data are left out of a day's average. */
export function overall(services: StatusService[]): UptimeDay[] {
  const length = services.reduce((n, s) => Math.max(n, s.days.length), 0)
  return Array.from({ length }, (_, i) => {
    const days = services.map((s) => s.days[i]).filter((d): d is UptimeDay => !!d)
    const measured = days.filter((d) => d.uptime !== null)
    const noted = services.find((s) => s.days[i]?.note)
    return {
      date: days[0]?.date ?? dayOf(length - 1 - i),
      uptime: measured.length ? measured.reduce((sum, d) => sum + d.uptime!, 0) / measured.length : null,
      incidents: days.reduce((sum, d) => sum + (d.incidents ?? 0), 0),
      ...(noted ? { note: `${noted.name}: ${noted.days[i]!.note}` } : null),
    }
  })
}

/** The window's average uptime, and its downtime in minutes. */
export function stats(days: readonly UptimeDay[]) {
  const measured = days.filter((d) => d.uptime !== null)
  const average = measured.length ? measured.reduce((sum, d) => sum + d.uptime!, 0) / measured.length : 1
  const down = measured.reduce((sum, d) => sum + (1 - d.uptime!) * DAY_MINUTES, 0)
  return { average, down }
}

export const statusOf = (day: UptimeDay | undefined): ServiceStatus =>
  !day || day.uptime === null || day.uptime >= TARGET ? 'operational' : day.uptime >= CRITICAL ? 'degraded' : 'outage'

/** Where the fleet stands today: its worst status, and how many services aren't operational. */
export function fleet(services: readonly StatusService[]) {
  const today = services.map((s) => statusOf(s.days.at(-1)))
  const worst: ServiceStatus = today.includes('outage') ? 'outage' : today.includes('degraded') ? 'degraded' : 'operational'
  return { worst, affected: today.filter((s) => s !== 'operational').length }
}

export const DEFAULT_COPY = {
  title: 'Status',
  subtitle: (services: number) => `${services} services · last 90 days`,
  more: 'More actions',
  copyLink: 'Copy status link',
  exportCsv: 'Export CSV',
  uptime: 'Uptime · 90 days',
  target: 'Target',
  operational: 'All systems operational',
  partial: 'Partial outage',
  budget: 'Error budget left',
  daily: 'Daily uptime',
  allServices: 'all services',
  stripLabel: (subject: string) => `Daily uptime, ${subject}`,
  showAll: 'Show all services',
  noData: 'No data',
  services: 'Services',
  servicesSummary: (affected: number) => (affected ? `${affected} affected today` : 'All operational'),
  lastIncident: (ago: string, service: string) => `Last incident ${ago} · ${service}`,
  ongoing: (service: string) => `Incident ongoing · ${service}`,
  history: 'Incident history',
  subscribe: 'Subscribe',
  subscribing: 'Subscribing…',
  subscribed: 'Subscribed',
  /** Shown when `onSubscribe` rejects without a message. */
  failed: 'Couldn’t subscribe. Try again.',
  empty: 'No services to show yet',
  emptyDescription: 'Services appear here once they report uptime.',
  retry: 'Try again',
}

export type StatusCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale its numbers and dates are written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}
