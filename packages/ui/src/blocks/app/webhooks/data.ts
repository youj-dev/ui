import { numberFormat } from '../../../lib/utils'
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

export interface Endpoint {
  id: string
  url: string
  description: string
  events: string[]
  enabled: boolean
  secret: string
}

export interface Delivery {
  id: string
  endpointId: string
  event: string
  /** The HTTP status, or null when the endpoint didn't answer in time. */
  status: number | null
  /** Milliseconds. */
  duration: number
  at: number
  attempt: number
  request: string
  response: string
}

export interface EventGroup {
  label: string
  events: string[]
}

export const EVENT_GROUPS: EventGroup[] = [
  { label: 'Invoices', events: ['invoice.created', 'invoice.paid', 'invoice.payment_failed'] },
  { label: 'Subscriptions', events: ['subscription.created', 'subscription.updated', 'subscription.canceled'] },
  { label: 'Customers', events: ['customer.created', 'customer.updated', 'customer.deleted'] },
  { label: 'Payouts', events: ['payout.paid', 'payout.failed'] },
]
export const ALL_EVENTS = EVENT_GROUPS.flatMap((g) => g.events)

/** The demo's clock, so the fixtures read the same on every visit. */
export const NOW = Date.UTC(2026, 8, 28, 14, 30)
const MIN = 60_000

const hex = (seed: number, length: number) => {
  let out = ''
  let x = seed
  while (out.length < length) {
    x = (x * 1103515245 + 12345) % 2147483648
    out += x.toString(36)
  }
  return out.slice(0, length)
}
export const newSecret = () => `whsec_${hex(Date.now() % 100000, 32)}`

export const ok = (status: number | null) => status !== null && status >= 200 && status < 300

export function makeDelivery(endpointId: string, event: string, status: number | null, at: number, attempt = 1, seed = at): Delivery {
  const id = `evt_${hex(seed, 14)}`
  const request = JSON.stringify({ id, type: event, created: Math.floor(at / 1000), livemode: true, data: { object: { id: `${event.split('.')[0]!.slice(0, 3)}_${hex(seed + 7, 10)}`, amount: 4900, currency: 'usd', status: event.split('.')[1] } } }, null, 2)
  const response = status === null ? '' : ok(status) ? JSON.stringify({ received: true }, null, 2) : status === 404 ? '<html><body><h1>404 Not Found</h1></body></html>' : JSON.stringify({ error: 'Internal Server Error' }, null, 2)
  const duration = status === null ? 10_000 : ok(status) ? 90 + (seed % 240) : 400 + (seed % 900)
  return { id: `d_${hex(seed + 3, 10)}`, endpointId, event, status, duration, at, attempt, request, response }
}

export const ENDPOINTS: Endpoint[] = [
  {
    id: 'we_billing',
    url: 'https://api.northwind.dev/hooks/billing',
    description: 'Billing service: provisions plans and seats',
    events: ['invoice.created', 'invoice.paid', 'invoice.payment_failed', 'subscription.created', 'subscription.updated', 'subscription.canceled'],
    enabled: true,
    secret: 'whsec_demo_billing_example_00000g9h1',
  },
  {
    id: 'we_alerts',
    url: 'https://ops.northwind.dev/alerts/payments',
    description: 'On-call alerts for failed payments',
    events: ['invoice.payment_failed', 'payout.failed'],
    enabled: true,
    secret: 'whsec_demo_alerts_example_000000d4s2a',
  },
  {
    id: 'we_crm',
    url: 'https://staging.northwind.dev/webhooks/crm-sync',
    description: 'CRM sync (staging)',
    events: ['customer.created', 'customer.updated', 'customer.deleted'],
    enabled: false,
    secret: 'whsec_demo_orders_example_000000f1g6h',
  },
]

const plan: [string, string, number | null, number][] = [
  ['we_billing', 'invoice.paid', 200, 4],
  ['we_billing', 'subscription.updated', 200, 19],
  ['we_billing', 'invoice.created', 200, 47],
  ['we_billing', 'invoice.payment_failed', 200, 95],
  ['we_billing', 'subscription.created', 200, 180],
  ['we_billing', 'invoice.paid', 200, 330],
  ['we_alerts', 'invoice.payment_failed', 500, 12],
  ['we_alerts', 'invoice.payment_failed', null, 40],
  ['we_alerts', 'payout.failed', 500, 125],
  ['we_alerts', 'invoice.payment_failed', 200, 610],
  ['we_crm', 'customer.updated', 404, 2900],
  ['we_crm', 'customer.created', 200, 3100],
]
export const DELIVERIES: Delivery[] = plan.map(([endpointId, event, status, ago], i) => makeDelivery(endpointId, event, status, NOW - ago * MIN, 1, 1000 + i * 97))

/** Every string the block shows. Pass any of them through `copy` to rewrite or translate it. */
export const DEFAULT_COPY = {
  brand: 'Northwind',
  title: 'Webhooks',
  description: 'Northwind sends a signed POST to these URLs when events happen in your account. Failed deliveries retry with backoff for 3 days.',
  add: 'Add endpoint',
  endpointsLabel: 'Endpoints',
  endpoint: 'Endpoint',
  events: 'Events',
  status: 'Status',
  lastDelivery: 'Last delivery',
  actions: 'Actions',
  actionsFor: (url: string) => `Actions for ${url}`,
  enabled: 'Enabled',
  disabled: 'Disabled',
  failing: 'Failing',
  never: 'Never',
  eventCount: (count: number) => `${count} ${count === 1 ? 'event' : 'events'}`,
  edit: 'Edit…',
  sendTest: 'Send test event',
  enable: 'Enable',
  disable: 'Disable',
  remove: 'Delete…',
  emptyTitle: 'No endpoints yet',
  emptyDescription: 'Add a URL and choose the events it should hear about. You can send a test event right away.',
  deleteTitle: (url: string) => `Delete ${url}?`,
  deleteDescription: 'Events stop being sent to it at once, and its delivery log is removed. This can’t be undone.',
  deleteConfirm: 'Delete endpoint',
  // Sheet
  addTitle: 'Add endpoint',
  editTitle: 'Edit endpoint',
  sheetDescription: 'We POST a JSON body to this URL, signed with the endpoint’s secret.',
  url: 'Endpoint URL',
  urlPlaceholder: 'https://example.com/webhooks',
  urlRequired: 'Enter the URL to send events to.',
  urlInvalid: 'Enter a full URL, like https://example.com/webhooks.',
  urlInsecure: 'Use https:// so payloads are encrypted in transit.',
  urlDuplicate: 'Another endpoint already uses this URL.',
  endpointDescription: 'Description',
  endpointDescriptionPlaceholder: 'What listens here? Optional.',
  eventsHint: 'Choose what this endpoint hears about.',
  eventsRequired: 'Choose at least one event.',
  selected: (count: number, total: number) => `${count} of ${total} selected`,
  selectAll: 'Select all',
  clear: 'Clear',
  secret: 'Signing secret',
  secretHint: 'Verify the Northwind-Signature header with this secret to know a request came from us.',
  reveal: 'Reveal',
  hide: 'Hide',
  copy: 'Copy',
  copied: 'Copied',
  rotate: 'Rotate…',
  rotateTitle: 'Rotate the signing secret?',
  rotateDescription: 'A new secret is issued now. The old one keeps working for 24 hours, so you can deploy the new one first.',
  rotateConfirm: 'Rotate secret',
  rotated: 'New secret issued. The old one expires in 24 hours.',
  active: 'Receive events',
  activeHint: 'Paused endpoints keep their settings but get nothing.',
  cancel: 'Cancel',
  save: 'Save endpoint',
  saving: 'Saving…',
  saved: 'Saved',
  // Delivery log
  deliveries: 'Deliveries',
  deliveriesFor: (url: string) => `Recent deliveries to ${url}`,
  filter: 'Show',
  all: 'All',
  succeeded: 'Succeeded',
  failed: 'Failed',
  noDeliveries: 'Nothing here yet',
  noDeliveriesDescription: 'Deliveries appear as events happen. Send a test event to see one now.',
  timeout: 'Timeout',
  duration: 'Duration',
  attempt: 'Attempt',
  sent: 'Sent',
  request: 'Request',
  response: 'Response',
  noResponse: 'No response within 10 seconds.',
  resend: 'Resend',
  resending: 'Resending…',
  resent: 'Resent',
  pickDelivery: 'Choose a delivery to see its request and response.',
  demoData: 'Demo data',
}
export type WebhooksCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale its numbers and dates are written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}

/** How long before `now` a delivery went out, in words. */
export function ago(at: number, locale: string, now: number) {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' })
  const minutes = Math.round((at - now) / MIN)
  if (Math.abs(minutes) < 1) return rtf.format(0, 'minute')
  if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute')
  if (Math.abs(minutes) < 60 * 24) return rtf.format(Math.round(minutes / 60), 'hour')
  return rtf.format(Math.round(minutes / 60 / 24), 'day')
}

export const formatDuration = (ms: number, locale: string) =>
  ms >= 1000 ? `${numberFormat(locale, { maximumFractionDigits: 1 }).format(ms / 1000)} s` : `${numberFormat(locale).format(ms)} ms`

export function checkUrl(value: string, copy: WebhooksCopy, taken: string[]) {
  const url = value.trim()
  if (!url) return copy.urlRequired
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return copy.urlInvalid
  }
  if (parsed.protocol === 'http:') return copy.urlInsecure
  if (parsed.protocol !== 'https:' || !parsed.hostname.includes('.')) return copy.urlInvalid
  if (taken.includes(url)) return copy.urlDuplicate
  return undefined
}
