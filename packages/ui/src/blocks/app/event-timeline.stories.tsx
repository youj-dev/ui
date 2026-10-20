import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import type { SeverityEvent } from '../../components/ui/severity-timeline'
import { EventTimeline } from './event-timeline'
import { history, MIN } from './event-timeline/data'

const meta: Meta<typeof EventTimeline> = {
  title: 'Blocks/App/Event Timeline',
  component: EventTimeline,
  // The gallery's picture: the demo incident, without its Demo data badge.
  args: { demoMarker: false },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Follow an incident from first report to resolution with affected services and key milestones in one timeline.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof EventTimeline>

export const Default: Story = { name: 'Checkout outage' }

/** Worked and closed: every milestone reached, the clock stopped at the resolution. */
export const Resolved: Story = {
  args: {
    defaultPhase: 'resolved',
    defaultSeverity: 3,
    live: false,
    entries: (() => {
      const start = Date.now() - 64 * MIN
      return [
        ...history(start).map((e: SeverityEvent) => (e.ongoing ? { ...e, ongoing: false, duration: 38 * MIN } : e)),
        { id: 'acknowledged', at: start + 3 * MIN, milestone: 'acknowledged' as const, title: 'M. Oyelaran took command', actor: 'm.oyelaran' },
        { id: 'rollback', at: start + 11 * MIN, severity: 3 as const, title: 'Rolled back checkout-api to v2.14.3', actor: 'deploybot', duration: 4 * MIN },
        { id: 'mitigated', at: start + 16 * MIN, milestone: 'mitigated' as const, title: 'Authorisations recovering', actor: 'm.oyelaran' },
        { id: 'resolved', at: start + 38 * MIN, milestone: 'resolved' as const, title: 'Error rate under 0.5% for 10 min', actor: 'm.oyelaran' },
      ]
    })(),
  },
}

/** On a page of its own: `embedded={false}` draws the centered canvas and the page's `h1` around it. By default it's the card alone, for your page to place. */
export const Standalone: Story = { args: { embedded: false } }

/** Your own incident: its details, events and services as data, the clock from your server's time, the UI strings in `copy` and every action wired. */
export const WithYourData: Story = {
  name: 'With your data',
  args: (() => {
    const now = Date.UTC(2026, 9, 1, 16, 20)
    return {
      live: false,
      now,
      timeZone: 'UTC',
      defaultSeverity: 1 as const,
      event: {
        id: 'OPS-311',
        title: 'Search results timing out',
        subject: 'search-api',
        lead: 'R. Iyer',
        leadHandle: 'riyer',
        milestones: { acknowledged: 'R. Iyer took the pager', mitigated: 'Shed traffic to the warm replica' },
      },
      entries: [
        { id: 'p95', at: now - 26 * MIN, severity: 1 as const, title: 'search-api p95 above 4 s', detail: 'eu-central, 38% of queries', actor: 'grafana', ongoing: true },
        { id: 'gc', at: now - 21 * MIN, severity: 2 as const, title: 'Long GC pauses on index-7', actor: 'grafana', duration: 9 * MIN },
        { id: 'page', at: now - 19 * MIN, title: 'Paged search on-call', actor: 'opsgenie' },
      ],
      items: [
        { id: 'search', name: 'search-api', rates: { triggered: 0.38, acknowledged: 0.34, mitigated: 0.02, resolved: 0.001 } },
        { id: 'index', name: 'index-7', rates: { triggered: 0.12, acknowledged: 0.12, mitigated: 0.004, resolved: 0 } },
      ],
      copy: { lead: (name: string) => `Incident lead · ${name}`, postmortem: 'Write the review' },
      onAdvance: fn(),
      onEscalate: fn(),
      onPhaseChange: fn(),
      onSeverityChange: fn(),
      onCopyLink: fn(),
      onOpenRunbook: fn(),
      onPostmortem: fn(),
    }
  })(),
}

const at = Date.UTC(2026, 10, 3, 14, 30)

/** Health: a patient's visit. Phases from arrival to discharge, priorities for severities, the departments involved as the items. */
export const PatientAdmission: Story = {
  name: 'Patient admission',
  args: {
    live: false,
    now: at,
    timeZone: 'UTC',
    defaultSeverity: 2,
    event: { id: 'ADM-4821', title: 'Chest pain, 58-year-old', subject: 'Emergency', lead: 'Dr. A. Okafor', leadHandle: 'aokafor', milestones: { triaged: 'Triaged by nurse S. Brandt' } },
    phases: [
      { id: 'arrived', label: 'Arrived', tone: 'danger' },
      { id: 'triaged', label: 'Triaged', tone: 'warning', action: 'Triage', pending: 'Triaging…', milestone: '{lead} assessed', announce: 'Patient triaged', stat: { label: 'Wait', name: 'Time to triage' } },
      { id: 'treated', label: 'Treated', tone: 'accent', action: 'Start treatment', pending: 'Starting…', milestone: 'Treatment started', announce: 'Treatment started', stat: { label: 'Care', name: 'Time to treatment' }, eases: 3 },
      { id: 'discharged', label: 'Discharged', tone: 'success', action: 'Discharge', pending: 'Discharging…', milestone: 'Discharged home', announce: 'Patient discharged', stat: { label: 'Stay', name: 'Length of stay' } },
    ],
    severities: [
      { id: 'immediate', label: 'Critical', tone: 'danger' },
      { id: 'urgent', label: 'Urgent', tone: 'warning' },
      { id: 'standard', label: 'Standard', tone: 'accent' },
      { id: 'minor', label: 'Minor', tone: 'neutral' },
    ],
    statuses: [
      { id: 'full', label: 'Over capacity', tone: 'danger', from: 0.9 },
      { id: 'busy', label: 'Busy', tone: 'warning', from: 0.6 },
      { id: 'open', label: 'Open', tone: 'success' },
    ],
    entries: [
      { id: 'door', at: at - 18 * MIN, severity: 2, title: 'Arrived by ambulance', detail: 'Pain radiating to the left arm, 40 min', actor: 'triage desk', ongoing: true },
      { id: 'ecg', at: at - 14 * MIN, severity: 2, title: '12-lead ECG taken', detail: 'ST elevation in leads II, III, aVF', actor: 'S. Brandt', duration: 3 * MIN },
      { id: 'labs', at: at - 9 * MIN, title: 'Troponin drawn, sent to the lab', actor: 'S. Brandt' },
    ],
    items: [
      { id: 'ed', name: 'Emergency', rates: { arrived: 0.96, triaged: 0.97, treated: 0.92, discharged: 0.7 } },
      { id: 'cath', name: 'Cath lab', rates: { arrived: 0.35, triaged: 0.62, treated: 0.78, discharged: 0.4 } },
      { id: 'icu', name: 'Cardiac ICU', rates: { arrived: 0.5, triaged: 0.55, treated: 0.72, discharged: 0.45 } },
    ],
    scale: 1,
    format: { rate: (n: number) => `${Math.round(n * 100)}% full` },
    copy: {
      lead: (name: string) => `Attending · ${name}`,
      open: 'In care',
      closedAfter: 'Stay',
      affected: 'Departments involved',
      noItems: 'No departments involved',
      timeline: 'Care timeline',
      entries: (n: number) => `${n} notes`,
      rate: (rate: string) => `${rate} occupancy`,
      escalate: 'Raise priority',
      escalating: 'Raising…',
      escalated: (priority: string) => `Priority raised to ${priority}`,
      escalatedDetail: 'Charge nurse notified',
      postmortem: 'Write discharge summary',
      runbook: 'Open care pathway',
      demoData: 'Sample patient',
    },
    onAdvance: fn(),
    onEscalate: fn(),
    onPostmortem: fn(),
  },
}

const later = Date.UTC(2026, 10, 9, 10, 5)

/** Commerce: a customer's dispute. Phases from opened to settled, priorities as the severities, the orders in question as the items. */
export const OrderDispute: Story = {
  name: 'Order dispute',
  args: {
    live: false,
    now: later,
    timeZone: 'UTC',
    defaultPhase: 'responded',
    defaultSeverity: 3,
    event: { id: 'DSP-1093', title: 'Item not as described', subject: 'Order #88412', lead: 'Priya N.', leadHandle: 'priya.n' },
    phases: [
      { id: 'opened', label: 'Opened', tone: 'warning' },
      { id: 'responded', label: 'Responded', tone: 'accent', action: 'Respond', pending: 'Sending…', milestone: '{lead} replied to the buyer', announce: 'Seller responded', stat: { label: 'Reply', name: 'Time to respond' } },
      { id: 'escalated', label: 'Escalated', tone: 'danger', action: 'Escalate to review', pending: 'Escalating…', milestone: 'Sent to the review team', announce: 'Dispute escalated', stat: { label: 'Review', name: 'Time to escalate' } },
      { id: 'settled', label: 'Settled', tone: 'success', action: 'Settle', pending: 'Settling…', milestone: 'Refund of $48 issued', announce: 'Dispute settled', stat: { label: 'Total', name: 'Time to settle' } },
    ],
    severities: [
      { id: 'urgent', label: 'Urgent', tone: 'danger' },
      { id: 'high', label: 'High', tone: 'warning' },
      { id: 'normal', label: 'Normal', tone: 'accent' },
      { id: 'low', label: 'Low', tone: 'neutral' },
    ],
    statuses: [
      { id: 'contested', label: 'Contested', tone: 'danger', from: 0.3 },
      { id: 'partial', label: 'Partly disputed', tone: 'warning', from: 0.05 },
      { id: 'clear', label: 'Agreed', tone: 'success' },
    ],
    entries: [
      { id: 'open', at: later - 52 * MIN, severity: 3, title: 'Buyer opened a dispute', detail: '“The jacket is a size smaller than listed.”', actor: 'buyer', ongoing: true },
      { id: 'photos', at: later - 47 * MIN, title: 'Two photos attached', actor: 'buyer' },
      { id: 'hold', at: later - 40 * MIN, severity: 3, title: 'Payout held for $48', actor: 'payments', duration: 30 * MIN },
      { id: 'responded', at: later - 31 * MIN, milestone: 'responded', title: 'Priya N. replied to the buyer', actor: 'priya.n' },
    ],
    items: [
      { id: 'jacket', name: 'Rain jacket (M)', rates: { opened: 0.36, responded: 0.32, escalated: 0.32, settled: 0 } },
      { id: 'shipping', name: 'Shipping', rates: { opened: 0.08, responded: 0.06, escalated: 0.06, settled: 0 } },
      { id: 'gift', name: 'Gift wrap', rates: { opened: 0, responded: 0, escalated: 0, settled: 0 } },
    ],
    scale: 1,
    copy: {
      lead: (name: string) => `Case owner · ${name}`,
      open: 'Open for',
      affected: 'Items in question',
      noItems: 'No items in question',
      timeline: 'Case history',
      entries: (n: number) => `${n} updates`,
      rate: (rate: string) => `${rate} disputed`,
      escalate: 'Raise priority',
      escalated: (priority: string) => `Priority raised to ${priority}`,
      escalatedDetail: 'Support lead notified',
      postmortem: 'Write case summary',
      runbook: 'Open dispute policy',
    },
    onAdvance: fn(),
    onEscalate: fn(),
  },
}
