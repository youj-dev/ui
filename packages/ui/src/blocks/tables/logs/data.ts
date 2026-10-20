/* The Logs block's types, its English and its demo stream: a small
 * platform's services talking. The history is seeded from a fixed moment, so
 * every render (server and browser) shows the same events; the live part
 * continues from the last one, seeded by how many came before. */

export type LogsTableLevel = 'debug' | 'info' | 'warn' | 'error'
export const LEVELS: readonly LogsTableLevel[] = ['debug', 'info', 'warn', 'error']

/** One event, one row of the stream. */
export interface LogsTableEvent {
  id: string
  /** When it happened (ISO, with milliseconds). */
  time: string
  level: LogsTableLevel
  /** What sent it: "api", "billing". */
  service: string
  message: string
  /** The request it belongs to, when there is one. */
  requestId?: string
  /** How long it took, in milliseconds. */
  duration?: number
  /** Everything else, shown as JSON in the inspector. */
  payload?: Record<string, unknown>
}

const plural = (n: number, one: string, other: string) => (new Intl.PluralRules('en').select(n) === 'one' ? one : other)

export const DEFAULT_COPY = {
  title: 'Logs',
  description: (events: string, errors: string, n: number) => `${events} events · ${errors} ${plural(n, 'error', 'errors')}`,
  noun: 'events',
  search: 'Search events…',
  columns: { time: 'Time', level: 'Level', service: 'Service', message: 'Message', duration: 'Duration' },
  levels: { debug: 'Debug', info: 'Info', warn: 'Warn', error: 'Error' } satisfies Record<LogsTableLevel, string>,
  live: 'Live',
  paused: 'Paused',
  pauseStream: 'Pause the stream',
  resumeStream: 'Resume the stream',
  newEvents: (count: string, n: number) => `${count} new ${plural(n, 'event', 'events')}`,
  showNew: (events: string) => `Show ${events}`,
  waitingAbove: 'New events are waiting at the top.',
  inspector: 'Event',
  inspectHint: 'Pick an event to see everything it carried.',
  closeInspector: 'Close the event',
  request: 'Request',
  duration: 'Duration',
  payload: 'Payload',
  copyJson: 'Copy JSON',
  ms: (value: string) => `${value} ms`,
  demoData: 'Demo data',
  emptyTitle: 'Nothing logged yet',
  emptyHint: 'Events show up here the moment a service writes one.',
}

export type LogsTableCopy = typeof DEFAULT_COPY

/** The moment the demo's history ends, so the server and the browser agree. */
export const DEMO_NOW = Date.UTC(2026, 9, 10, 9, 41, 12, 480)

type Random = () => number
const random = (seed: number): Random => {
  let s = seed % 2147483647 || 1
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
}

const SERVICES = ['api', 'api', 'api', 'auth', 'billing', 'worker', 'edge', 'edge', 'search'] as const
const REGIONS = ['fra1', 'iad1', 'sfo1', 'hnd1']
const ROUTES = ['/v1/orders', '/v1/orders/:id', '/v1/customers', '/v1/checkout', '/v1/invoices', '/v1/search']
const hex = (next: Random, length: number) => Array.from({ length }, () => Math.floor(next() * 16).toString(16)).join('')

/** One event at `at`, in the shape its service and level write. */
function makeEvent(next: Random, at: number): LogsTableEvent {
  const pick = <T,>(list: readonly T[]) => list[Math.floor(next() * list.length)]!
  const r = next()
  const level: LogsTableLevel = r < 0.16 ? 'debug' : r < 0.8 ? 'info' : r < 0.93 ? 'warn' : 'error'
  const service = pick(SERVICES)
  const requestId = `req_${hex(next, 10)}`
  const region = pick(REGIONS)
  const route = pick(ROUTES)
  let message: string
  let duration: number | undefined
  let payload: Record<string, unknown> = { service, region }
  if (level === 'debug') {
    message = pick([`Cache lookup orders:list:p${1 + Math.floor(next() * 9)}`, 'Query plan chose idx_orders_created_at', 'Flag new-checkout evaluated: on', 'Connection pool: 18 of 40 busy'])
    payload = { ...payload, pool: { busy: 18, idle: 22 }, flag: 'new-checkout' }
  } else if (level === 'info') {
    const method = pick(['GET', 'GET', 'GET', 'POST', 'PATCH'])
    const status = method === 'POST' ? 201 : 200
    duration = Math.round(8 + next() * (service === 'edge' ? 40 : 220))
    message =
      service === 'auth'
        ? `Signed in with ${pick(['a passkey', 'Google', 'a password'])}`
        : service === 'billing'
          ? `Invoice in_${hex(next, 8)} paid`
          : service === 'worker'
            ? `Job ${pick(['sync-catalog', 'send-digest', 'rollup-metrics'])} finished`
            : service === 'search'
              ? `Indexed ${Math.round(40 + next() * 900)} documents`
              : `${method} ${route} ${status}`
    payload = { ...payload, method, path: route, status, durationMs: duration, userAgent: pick(['Mozilla/5.0 (Macintosh)', 'okhttp/4.12', 'Youj-iOS/3.2']) }
  } else if (level === 'warn') {
    duration = Math.round(900 + next() * 1800)
    message = pick([
      `Slow query on orders: ${duration.toLocaleString('en')} ms`,
      `Rate limit at ${80 + Math.floor(next() * 16)}% for key pk_demo_${hex(next, 4)}`,
      `Retrying webhook delivery (attempt ${2 + Math.floor(next() * 3)})`,
      `Index lag ${2 + Math.floor(next() * 9)}s behind primary`,
    ])
    payload = { ...payload, threshold: 800, durationMs: duration, attempt: 2 }
  } else {
    duration = Math.round(1200 + next() * 2800)
    const failure = pick([
      ['UpstreamTimeout', 'POST /v1/charges 502: upstream timed out'],
      ['CardDeclined', 'Payment declined: card_expired'],
      ['OutOfMemory', 'Job reindex-search failed: out of memory'],
      ['TlsHandshake', 'TLS handshake failed for api.partner.io'],
    ] as const)
    message = failure[1]
    payload = { ...payload, durationMs: duration, error: { type: failure[0], message: failure[1], retryable: failure[0] !== 'CardDeclined' }, trace: { id: hex(next, 16), span: hex(next, 8) } }
  }
  // Times only move forward, so the moment names the event.
  return { id: `evt_${at.toString(36)}`, time: new Date(at).toISOString(), level, service, message, requestId, duration, payload: { ...payload, requestId } }
}

/** The demo's history: `count` events up to DEMO_NOW, oldest first. */
export function makeEvents(count = 400): LogsTableEvent[] {
  const next = random(41)
  const gaps = Array.from({ length: count }, () => 120 + Math.floor(next() * 2400))
  let at = DEMO_NOW - gaps.reduce((sum, gap) => sum + gap, 0)
  return gaps.map((gap) => makeEvent(next, (at += gap)))
}

/** What the stream writes next: one to three events after the last one. */
export function nextEvents(list: readonly LogsTableEvent[]): LogsTableEvent[] {
  let at = list.length ? new Date(list[list.length - 1]!.time).getTime() : DEMO_NOW
  const next = random(at)
  return Array.from({ length: 1 + Math.floor(next() * 3) }, () => makeEvent(next, (at += 150 + Math.floor(next() * 900))))
}
