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

export interface QueueMonitorItem {
  id: string
  /** Why it failed: "Timeout after 30 s". */
  error: string
}

export interface QueueMonitorQueue {
  id: string
  /** The name on its tab: "emails". */
  label: string
  /** Workers serving the queue; each takes `slotsPerWorker` jobs at once. */
  workers: number
  /** Jobs a worker runs at once. Default 8. */
  slotsPerWorker?: number
  /** Jobs waiting, and how many the queue holds. */
  queued: number
  capacity: number
  /** Jobs in flight. Their ceiling is workers × slots. */
  running: number
  failed: QueueMonitorItem[]
  /** Jobs finished in the last hour, and the hour's capacity. */
  done: number
  target: number
  /** Jobs per minute, the last 30 minutes, oldest first. */
  throughput: number[]
  /** Seconds. */
  p95Wait: number
  oldest: number
}

/** Jobs a worker runs at once, unless the queue says. */
export const SLOTS_PER_WORKER = 8

/** A calm 30-minute trace around a rate, the same on every render. */
const trace = (rate: number, swing: number, seed: number) =>
  Array.from({ length: 30 }, (_, i) => Math.round(rate * (0.9 + i / 290) + Math.sin(i / 2.3 + seed) * swing + Math.cos(i / 1.1 + seed * 2) * swing * 0.4))

const job = (id: string, error: string): QueueMonitorItem => ({ id: `job-${id}`, error })

export const QUEUES: QueueMonitorQueue[] = [
  {
    id: 'emails',
    label: 'emails',
    workers: 4,
    queued: 214,
    capacity: 500,
    running: 24,
    failed: [
      job('8f2a1c', 'Timeout after 30 s'),
      job('41be07', 'SMTP 421: try again later'),
      job('c93d58', 'Timeout after 30 s'),
      job('0a7f12', 'Rate limited by provider'),
      job('5e61b9', 'Template “receipt” not found'),
      job('77d0ca', 'Timeout after 30 s'),
      job('b2f4e3', 'SMTP 550: mailbox unavailable'),
    ],
    done: 12480,
    target: 16000,
    throughput: trace(1284, 60, 1),
    p95Wait: 4.2,
    oldest: 38,
  },
  {
    id: 'webhooks',
    label: 'webhooks',
    workers: 6,
    queued: 1020,
    capacity: 1200,
    running: 46,
    failed: [job('d41f90', '502 from hooks.acme.dev'), job('2c8e7a', 'TLS handshake failed'), job('9b3a55', '410 Gone: endpoint removed')],
    done: 38200,
    target: 42000,
    throughput: trace(3410, 180, 2),
    p95Wait: 18.6,
    oldest: 212,
  },
  {
    id: 'exports',
    label: 'exports',
    workers: 2,
    queued: 12,
    capacity: 200,
    running: 5,
    failed: [],
    done: 640,
    target: 1000,
    throughput: trace(42, 6, 3),
    p95Wait: 1.1,
    oldest: 9,
  },
  {
    id: 'billing',
    label: 'billing',
    workers: 3,
    queued: 88,
    capacity: 400,
    running: 11,
    failed: [job('e07c3b', 'Card network timeout')],
    done: 4120,
    target: 6000,
    throughput: trace(318, 22, 4),
    p95Wait: 2.7,
    oldest: 21,
  },
]

/** The emails queue at capacity: every slot busy, the backlog near full, failures piling up. */
export const BACKLOGGED: QueueMonitorQueue[] = QUEUES.map((q) =>
  q.id !== 'emails'
    ? q
    : {
    ...q,
    queued: 486,
    running: 32,
    failed: [
      ...q.failed,
      job('f81d20', 'Timeout after 30 s'),
      job('3aa7c4', 'Timeout after 30 s'),
      job('6c02e9', 'Rate limited by provider'),
      job('a19b77', 'Timeout after 30 s'),
      job('47e6d1', 'SMTP 421: try again later'),
    ],
    throughput: trace(860, 90, 5).map((v, i) => v - i * 9),
    p95Wait: 41.8,
    oldest: 540,
  },
)

export const DEFAULT_COPY = {
  title: 'Job queue',
  /** The head's "/ subtitle": the queue and its workers. */
  subtitle: (queue: string, workers: number) => `${queue} · ${workers} ${workers === 1 ? 'worker' : 'workers'}`,
  more: 'More actions',
  queue: 'Queue',
  live: 'Live',
  paused: 'Paused',
  demoData: 'Demo data',
  throughput: 'Throughput',
  perMinute: '/min',
  /** The change over the trace: "+12%" (arrives signed). */
  change: (percent: string) => `${percent} in 30 min`,
  trend: 'Throughput, last 30 minutes',
  last30: 'Last 30 min',
  now: 'now',
  p95Wait: 'p95 wait',
  oldest: 'Oldest job',
  slots: 'Slots',
  load: 'Queue load',
  queued: 'Queued',
  running: 'Running',
  failed: 'Failed',
  done: 'Done · 1h',
  retry: 'Retry',
  retryAll: 'Retry all',
  retrying: (job: string) => `Retrying ${job}`,
  retryingAll: (count: number) => `Retrying ${count} ${count === 1 ? 'job' : 'jobs'}`,
  /** `{ago}` is replaced by the time since the queue last moved, kept in its own case. */
  updated: 'Updated {ago} ago',
  justNow: 'Live · updated just now',
  pause: 'Pause',
  resume: 'Resume',
  pauseQueue: 'Pause queue',
  resumeQueue: 'Resume queue',
  drain: 'Drain queue',
  drained: 'Queue drained',
  scale: 'Scale workers',
  scaling: 'Scaling…',
  scaled: 'Scaled',
  scaledTo: (workers: number) => `Scaled to ${workers} ${workers === 1 ? 'worker' : 'workers'}`,
  loadingLabel: 'Loading the queues',
  emptyTitle: 'No queues yet',
  emptyDescription: 'Queues show up here once something is waiting for a worker.',
}

export type QueueMonitorCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale its numbers and dates are written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}
