import type { SeverityEvent } from '../../../components/ui/severity-timeline'

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

export const MIN = 60_000

type Tone = 'accent' | 'neutral' | 'success' | 'warning' | 'danger'

/** A stage the event passes through. The first is where it starts; each later one is reached by an action. */
export interface EventTimelinePhase {
  id: string
  /** The status pill while it is here, and the milestone's word on the timeline: "Acknowledged". */
  label: string
  /** The pill's tone. Default accent. */
  tone?: Tone
  /** The button that moves it into this phase: "Acknowledge". Not on the first phase. */
  action?: string
  /** The button while that runs: "Acknowledging…". Default: the action. */
  pending?: string
  /** The milestone event's title; `{lead}` is the lead's name. Default: the phase's label. */
  milestone?: string
  /** Announced to screen readers on arrival. Default: the phase's label. */
  announce?: string
  /** The time-to-reach figure in the row under the pill: its short label ("TTA") and spoken name. Not on the first phase. */
  stat?: { label: string; name: string }
  /** Moving into this phase eases the severity down to this level, if it is higher. */
  eases?: EventTimelineSeverityLevel
}

export type EventTimelineSeverityLevel = 1 | 2 | 3 | 4

export const PHASES: EventTimelinePhase[] = [
  { id: 'triggered', label: 'Triggered', tone: 'danger' },
  {
    id: 'acknowledged',
    label: 'Acknowledged',
    tone: 'warning',
    action: 'Acknowledge',
    pending: 'Acknowledging…',
    milestone: '{lead} took command',
    announce: 'Incident acknowledged',
    stat: { label: 'TTA', name: 'Time to acknowledge' },
  },
  {
    id: 'mitigated',
    label: 'Mitigated',
    tone: 'accent',
    action: 'Mitigate',
    pending: 'Mitigating…',
    milestone: 'Impact mitigated',
    announce: 'Incident mitigated',
    stat: { label: 'TTM', name: 'Time to mitigate' },
    eases: 3,
  },
  {
    id: 'resolved',
    label: 'Resolved',
    tone: 'success',
    action: 'Resolve',
    pending: 'Resolving…',
    milestone: 'Incident resolved',
    announce: 'Incident resolved',
    stat: { label: 'TTR', name: 'Time to resolve' },
  },
]

/** A step of urgency, most urgent first (the first is level 1). */
export interface EventTimelineSeverity {
  id: string
  /** The chip's text: "SEV1". */
  label: string
  /** The spoken name. Default: the label. */
  name?: string
  /** Its tone, on the chip beside the pill and on the timeline's nodes. */
  tone: Tone
}

export const SEVERITIES: EventTimelineSeverity[] = [
  { id: 'sev1', label: 'SEV1', name: 'Severity 1', tone: 'danger' },
  { id: 'sev2', label: 'SEV2', name: 'Severity 2', tone: 'warning' },
  { id: 'sev3', label: 'SEV3', name: 'Severity 3', tone: 'accent' },
  { id: 'sev4', label: 'SEV4', name: 'Severity 4', tone: 'neutral' },
]

/** How an affected item is doing: matched from its rate, worst first (the first whose `from` the rate reaches). */
export interface EventTimelineStatus {
  id: string
  label: string
  tone: 'success' | 'warning' | 'danger'
  /** The rate (0–1) from which an item is in this status. Default 0. */
  from?: number
}

export const STATUSES: EventTimelineStatus[] = [
  { id: 'down', label: 'Down', tone: 'danger', from: 0.2 },
  { id: 'degraded', label: 'Degraded', tone: 'warning', from: 0.01 },
  { id: 'ok', label: 'Operational', tone: 'success' },
]

/** The full scale of an item's bar. */
export const SCALE = 0.4

/** Something the event touches, with its rate in each phase. */
export interface EventTimelineItem {
  id: string
  /** Set in mono, as your tooling names it: "checkout-api". */
  name: string
  /** Its rate (0–1) in each phase, by phase id: it falls as the event is worked. */
  rates: Record<string, number>
}

/** The event the block shows: what it is, where, and who leads it. */
export interface EventTimelineEvent {
  /** Its reference, set in mono: "INC-2817". */
  id: string
  /** What's wrong, as the heading: "Checkout errors". */
  title: string
  /** What it is filed against, set in mono beside the id. */
  subject: string
  /** Who's in charge, as people read it: "M. Oyelaran". */
  lead: string
  /** The lead's handle, the actor on the events the block adds. Default: `lead`. */
  leadHandle?: string
  /** When it began, in ms since the epoch. Default: its first entry. */
  startedAt?: number
  /** Titles for the milestones the actions add, by phase id. Default: the phases' own. */
  milestones?: Record<string, string>
}

export const EVENT: EventTimelineEvent = {
  id: 'INC-2817',
  title: 'Checkout errors',
  subject: 'checkout-api',
  lead: 'M. Oyelaran',
  leadHandle: 'm.oyelaran',
  milestones: {
    acknowledged: 'M. Oyelaran took command',
    mitigated: 'Rolled back checkout-api to v2.14.3',
    resolved: 'Error rate under 0.5% for 10 min',
  },
}

export const ITEMS: EventTimelineItem[] = [
  { id: 'checkout', name: 'checkout-api', rates: { triggered: 0.074, acknowledged: 0.081, mitigated: 0.009, resolved: 0.003 } },
  { id: 'payments', name: 'payments-worker', rates: { triggered: 0.31, acknowledged: 0.29, mitigated: 0.042, resolved: 0.002 } },
  { id: 'edge', name: 'edge-gateway', rates: { triggered: 0.012, acknowledged: 0.011, mitigated: 0.004, resolved: 0.002 } },
]

/** How long the event has been open when the block mounts. */
export const OPEN_FOR = 12 * MIN
/** The demo's "now", fixed so the server and the browser render the same clock. */
export const NOW = Date.UTC(2026, 8, 28, 9, 41)

/** The entries so far, from its start. */
export const history = (start: number): SeverityEvent[] => [
  { id: 'alert', at: start, severity: 2, title: 'Error rate above 5% on checkout-api', detail: '5xx at 7.4% over 5 min, up from 0.3%', actor: 'pagerbot', ongoing: true },
  { id: 'page', at: start + MIN, title: 'Paged the payments on-call', actor: 'pagerbot' },
  { id: 'auth', at: start + 4 * MIN, severity: 2, title: 'Card authorisations timing out', detail: 'payments-worker p95 above 30 s in eu-west', actor: 'pagerbot', duration: MIN * 5 },
  { id: 'deploy', at: start + 7 * MIN, severity: 3, title: 'checkout-api v2.15.0 finished rolling out', detail: 'Started 9 min before the first alert', actor: 'deploybot', duration: MIN * 2 },
]

/** Alerts that arrive while nobody has acknowledged (the demo's liveness). */
export const ARRIVALS: Omit<SeverityEvent, 'id' | 'at'>[] = [
  { severity: 2, title: 'Queue depth above 5,000 on payments-worker', detail: '5,812 jobs waiting', actor: 'queue-watch', ongoing: true },
  { title: 'Re-paged the payments on-call', detail: 'No acknowledgment after 10 min', actor: 'pagerbot' },
  { severity: 3, title: 'Latency p95 above 2 s on edge-gateway', actor: 'pagerbot', duration: MIN * 3 },
]

export const DEFAULT_COPY = {
  subtitle: (event: EventTimelineEvent) => `${event.id} · ${event.subject}`,
  more: 'More actions',
  copyLink: 'Copy link',
  demoData: 'Demo data',
  runbook: 'Open runbook',
  open: 'Open',
  closedAfter: 'Closed after',
  notYet: 'Not yet',
  affected: 'Affected services',
  noItems: 'No services affected',
  /** Spoken beside an item's rate. */
  rate: (rate: string) => `${rate} errors`,
  timeline: 'Timeline',
  entries: (count: number) => `${count} ${count === 1 ? 'event' : 'events'}`,
  lead: (name: string) => `Commander · ${name}`,
  escalate: 'Escalate',
  escalating: 'Escalating…',
  escalated: (severity: string) => `Escalated to ${severity}`,
  escalatedDetail: 'Paged the incident commander on call',
  postmortem: 'Start postmortem',
  /** Shown when an action's callback rejects without a message. */
  failed: 'That didn’t go through. Try again.',
  announceEvent: (title: string) => `New event: ${title}`,
}

export type EventTimelineCopy = typeof DEFAULT_COPY & {
  /** The locale durations and clock times are written in (BCP 47). Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}
