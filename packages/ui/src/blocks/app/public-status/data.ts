import { ActivityIcon, AlertTriangleIcon, CheckCircleIcon, SearchIcon } from '@youj/icons'
import type { TimelineEvent, TimelineEventType } from '../../../components/ui/timeline'
import { DEFAULT_COPY as CARD_COPY, type ServiceStatus, type StatusService } from '../status/data'
import { dateTimeFormat } from '../../../lib/utils'

/* What only the public page shows: how the services group, the incident's
 * updates and the response-time ranges. The services, their days and the
 * status rules are the card's (../status/data). */

export const MINUTE = 60_000

/** A section of the page: its heading and the ids of the services under it. */
export interface PublicStatusGroup {
  name: string
  /** Service ids, in order. */
  services: string[]
}

/** One update on the incident: `type` is investigating, identified, monitoring or resolved; `time` in ms (or a Date). */
export type PublicStatusUpdate = TimelineEvent

/** The incident the page leads with. */
export interface PublicStatusIncident {
  title: string
  /** The service it affects, set in mono. */
  service: string
  /** When it began, in ms since the epoch. */
  startedAt: number
  /** The banner's line while it's open. Default: the copy's `degradedDetail`. */
  summary?: string
  /** Its updates, newest first. The newest one's type is the incident's status. */
  updates: PublicStatusUpdate[]
}

export type PublicStatusRange = '24h' | '7d' | '30d'
type Range = PublicStatusRange

/** The page's sections, by service id. */
const GROUPS: PublicStatusGroup[] = [
  { name: 'Platform', services: ['api', 'web', 'webhooks', 'auth'] },
  { name: 'Data', services: ['search', 'storage'] },
]

const longDay = (locale: string) => dateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric' })

function rand(seed: number) {
  let h = Math.imul(seed ^ 0x2c1b3c6d, 2654435761)
  h ^= h >>> 13
  return ((h >>> 0) % 10_000) / 10_000
}

const RANGES = {
  '24h': { points: 48, base: 118 },
  '7d': { points: 56, base: 124 },
  '30d': { points: 60, base: 131 },
} as const

/** The demo's API response times for a range; during the incident the last day's latency climbs and falls back. */
function demoResponseTimes(range: Range, incident: boolean) {
  const { points, base } = RANGES[range]
  return Array.from({ length: points }, (_, i) => {
    const spike = incident && range === '24h' && i > points - 12 && i < points - 3 ? 280 - Math.abs(i - (points - 8)) * 55 : 0
    return Math.round(base + Math.sin(i / 3) * 14 + rand(i * 13 + base) * 26 + spike)
  })
}

const UPDATE_ICONS: Record<string, Omit<TimelineEventType, 'label'>> = {
  investigating: { icon: SearchIcon, tone: 'warning' },
  identified: { icon: AlertTriangleIcon, tone: 'warning' },
  monitoring: { icon: ActivityIcon, tone: 'accent' },
  resolved: { icon: CheckCircleIcon, tone: 'success' },
}

/** The update types with their labels from the copy. */
const updateTypes = (labels: Record<string, string>): Record<string, TimelineEventType> =>
  Object.fromEntries(Object.entries(UPDATE_ICONS).map(([key, type]) => [key, { ...type, label: labels[key] ?? key }]))

/** "Now" until the browser's clock is read, so the server's render and the first client render agree. */
export const DEMO_NOW = Date.UTC(2026, 8, 28, 15, 0)

/** The demo incident, storage failing uploads in eu-west as SERVICES_INCIDENT has it today, its times counted back from `now`. */
const demoIncident = (now: number): PublicStatusIncident => ({
  title: 'Upload errors in eu-west',
  service: 'storage',
  startedAt: now - 58 * MINUTE,
  summary: 'Some uploads to eu-west are failing. Everything else is up.',
  updates: [
    {
      id: 'u3',
      type: 'monitoring',
      title: 'Uploads to eu-west succeed again after a failover to the standby gateway. We’re watching the error rate.',
      time: now - 6 * MINUTE,
    },
    {
      id: 'u2',
      type: 'identified',
      title: 'A certificate rotation on the eu-west storage gateway rejected signed upload URLs. Rolling it back.',
      time: now - 24 * MINUTE,
    },
    { id: 'u1', type: 'investigating', title: 'Some uploads to eu-west are failing with server errors.', time: now - 58 * MINUTE },
  ],
})

/** The newest days with a resolved incident, across every service, each with what happened and for how long. */
function pastIncidents(services: readonly StatusService[], fallback: string, count = 5) {
  const byDay = new Map<string, { title: string; service: string; minutes: number }[]>()
  for (const s of services)
    s.days.forEach((d, i) => {
      if (!d.incidents || i === s.days.length - 1) return
      const key = typeof d.date === 'string' ? d.date : `${d.date.getFullYear()}-${String(d.date.getMonth() + 1).padStart(2, '0')}-${String(d.date.getDate()).padStart(2, '0')}`
      byDay.set(key, [...(byDay.get(key) ?? []), { title: d.note ?? fallback, service: s.name, minutes: d.downtimeMinutes ?? 0 }])
    })
  return [...byDay]
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, count)
    .map(([date, incidents]) => ({ date: new Date(`${date}T00:00`), incidents }))
}

const DEFAULT_COPY = {
  product: 'Status',
  heading: 'Orbit system status',
  operational: CARD_COPY.operational,
  partial: CARD_COPY.partial,
  operationalDetail: 'Every service is up. Checked every 30 seconds from 12 regions.',
  /** The banner's line when something is down and the incident has no `summary`. */
  degradedDetail: 'Some services are degraded. Everything else is up.',
  updated: 'Updated 1 min ago',
  affects: 'Affects',
  started: (minutes: number) => `Started ${minutes} minutes ago`,
  incidentUpdates: 'Incident updates',
  updateTypes: { investigating: 'Investigating', identified: 'Identified', monitoring: 'Monitoring', resolved: 'Resolved' } as Record<string, string>,
  services: 'Services',
  legend: { up: 'Up', degraded: 'Degraded', outage: 'Outage' },
  /** The heading of services no group names. */
  otherGroup: 'Services',
  status: { operational: 'Operational', degraded: 'Degraded', outage: 'Outage' } as Record<ServiceStatus, string>,
  stripLabel: CARD_COPY.stripLabel,
  uptime: 'uptime',
  loading: 'Loading services',
  emptyServices: 'No services to show yet.',
  retry: 'Try again',
  responseTitle: 'API response time',
  responseDescription: (range: string) => `Median across all regions, ${range}.`,
  responseLabel: (range: string, median: number) => `API response time, ${range}, median ${median} milliseconds`,
  ranges: { '24h': 'last 24 hours', '7d': 'last 7 days', '30d': 'last 30 days' } as Record<Range, string>,
  range: 'Range',
  ms: 'ms',
  noResponseTimes: 'No response times for this range.',
  pastIncidents: 'Past incidents',
  resolvedCount: (count: number) => `${count} resolved`,
  affected: 'Affected',
  lasted: (minutes: number) => `Resolved · lasted ${minutes} min`,
  disruption: 'Service disruption',
  noPastIncidents: 'No incidents in the last 90 days.',
  footer: '© 2026 Orbit Cloud',
  history: 'Incident history',
  subscribe: 'Subscribe',
  subscribeBy: 'Subscribe by',
  email: 'Email',
  rss: 'RSS',
  webhook: 'Webhook',
  emailPlaceholder: 'you@company.com',
  emailHint: 'Incidents and scheduled maintenance. Unsubscribe from any email.',
  subscribing: 'Subscribing…',
  subscribed: 'Subscribed',
  invalidEmail: 'Check the address',
  /** Under the field when a callback rejects without a message. */
  failed: 'Something went wrong. Try again.',
  subscribeToUpdates: 'Subscribe to updates',
  feedUrl: 'Feed URL',
  copyFeed: 'Copy feed URL',
  copied: 'Copied',
  feedHint: 'Atom and RSS readers, or Slack’s /feed.',
  endpoint: 'Endpoint',
  endpointPlaceholder: 'https://hooks.example.com/orbit',
  webhookHint: 'We POST a JSON event for every update.',
  saveWebhook: 'Save webhook',
  webhookSaved: 'Saved',
  webhookFailed: 'Not saved',
}

type PublicStatusCopy = typeof DEFAULT_COPY

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  return wait(ms)
}

export { DEFAULT_COPY, demo, demoIncident, demoResponseTimes, GROUPS, longDay, pastIncidents, rand, RANGES, updateTypes, type Range, type PublicStatusCopy }
