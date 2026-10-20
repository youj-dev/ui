import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { CaseFile } from './case-file'

const meta: Meta<typeof CaseFile> = {
  title: 'Blocks/App/Case File',
  component: CaseFile,
  args: { timeZone: 'UTC' },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Work one case from open to closed: its stage on a stepper, the verdict with its confidence and the evidence behind it, and the chain of events step by step with its pace on a ribbon. Security cases, insurance claims and fraud reviews all read the same way.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof CaseFile>

/** Case 4127 in Contain: five steps from a fake payment reminder to an archive still being packed. */
export const Default: Story = { name: 'Phishing case' }

/** Contained and ready to close: the archive step stopped where the account was contained. */
export const Contained: Story = { args: { defaultStage: 'close' } }

/** Other data: a suspicious case in Triage, German words, your own stages, steps and signals, and the actions in Actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    locale: 'de-DE',
    now: '2026-10-13T15:40:00Z',
    defaultStage: 'triage',
    details: {
      id: 'Fall 88',
      openedAt: '2026-10-13T15:02:00Z',
      subject: 'build-runner-7',
      verdict: 'suspicious',
      summary: 'Ein Build-Server spricht mit einer unbekannten Adresse',
      confidence: 0.61,
    },
    stages: [
      { id: 'triage', label: 'Sichten', action: 'Prüfen', pending: 'Starte', done: 'Wird geprüft' },
      { id: 'investigate', label: 'Prüfen', action: 'Eindämmung starten', pending: 'Starte', done: 'Wird eingedämmt' },
      { id: 'contain', label: 'Eindämmen', action: 'Konto sperren', pending: 'Sperre', done: 'Gesperrt', stops: true },
      { id: 'close', label: 'Schließen', action: 'Fall schließen', pending: 'Schließe', done: 'Geschlossen' },
    ],
    verdicts: [
      { id: 'malicious', label: 'Bösartig', tone: 'danger' },
      { id: 'suspicious', label: 'Verdächtig', tone: 'warning' },
      { id: 'benign', label: 'Harmlos', tone: 'success' },
    ],
    signals: [
      { id: 'net', label: 'Netzwerk', weight: 70, tone: 'chart-2' },
      { id: 'dev', label: 'Geräte', weight: 30, tone: 'chart-1' },
    ],
    steps: [
      {
        id: 'a',
        at: '2026-10-13T15:02:00Z',
        title: 'Neues Paket aus einer fremden Quelle',
        source: 'Geräte',
        entity: 'build-runner-7',
        tone: 'chart-1',
      },
      {
        id: 'b',
        at: '2026-10-13T15:18:00Z',
        title: 'Verbindungen zu 203.0.113.40',
        source: 'Netzwerk',
        entity: 'egress-2',
        tone: 'chart-2',
        ongoing: true,
      },
    ],
    copy: {
      opened: (age: string) => `Geöffnet ${age}`,
      verdictTitle: 'Bewertung',
      confidence: 'Sicherheit',
      signals: (n: number) => `${n} Signale`,
      chainTitle: 'Angriffskette',
      closed: 'Geschlossen',
      dismiss: 'Verwerfen',
    },
    onAdvance: fn(),
    onDismiss: fn(),
    onStageChange: fn(),
  },
}

/** Finance: an insurance claim in Assess. Four stages, three coverage decisions, evidence by weight and the claim's events; Deny closes it. */
export const InsuranceClaim: Story = {
  name: 'Insurance claim',
  args: {
    now: '2026-10-13T16:00:00Z',
    defaultStage: 'assess',
    formatSpan: (minutes: number) => `${Math.floor(minutes / 60)} h ${minutes % 60} min`,
    details: {
      id: 'Claim 2291',
      openedAt: '2026-10-13T08:10:00Z',
      subject: 'R. Alvarez',
      verdict: 'partial',
      summary: 'The burst pipe is covered; the flooring upgrade and the older carpet are not',
      confidence: 0.84,
    },
    stages: [
      { id: 'intake', label: 'Intake', action: 'Start assessment', pending: 'Starting', done: 'Assessing' },
      { id: 'assess', label: 'Assess', action: 'Send for approval', pending: 'Sending', done: 'Sent' },
      { id: 'approve', label: 'Approve', action: 'Approve payout', pending: 'Approving', done: 'Approved' },
      { id: 'pay', label: 'Pay', action: 'Pay claim', pending: 'Paying', done: 'Paid' },
    ],
    verdicts: [
      { id: 'covered', label: 'Covered', tone: 'success' },
      { id: 'partial', label: 'Partially covered', tone: 'warning' },
      { id: 'excluded', label: 'Not covered', tone: 'danger' },
    ],
    signals: [
      { id: 'photos', label: 'Photos', weight: 34, tone: 'chart-1' },
      { id: 'adjuster', label: 'Adjuster', weight: 30, tone: 'chart-3' },
      { id: 'policy', label: 'Policy', weight: 22, tone: 'chart-2' },
      { id: 'receipts', label: 'Receipts', weight: 14, tone: 'chart-4' },
    ],
    steps: [
      { id: 'filed', at: '2026-10-13T08:10:00Z', title: 'Claim filed online', source: 'Portal', entity: 'R. Alvarez', tone: 'chart-2' },
      { id: 'photos', at: '2026-10-13T08:40:00Z', title: 'Uploaded 14 photos of the kitchen', source: 'Portal', entity: 'R. Alvarez', tone: 'chart-1' },
      { id: 'policy', at: '2026-10-13T10:05:00Z', title: 'Policy checked: sudden pipe burst is covered', source: 'Policy', entity: 'HO-77310', tone: 'chart-2' },
      { id: 'visit', at: '2026-10-13T13:20:00Z', title: 'Adjuster visited the home', source: 'Adjuster', entity: 'M. Kowalski', tone: 'chart-3' },
      {
        id: 'estimate',
        at: '2026-10-13T14:45:00Z',
        title: 'Waiting on the contractor’s estimate',
        source: 'Contractor',
        entity: 'Dry Out Co.',
        tone: 'chart-4',
        ongoing: true,
      },
    ],
    copy: {
      verdictTitle: 'Coverage decision',
      confidence: 'certainty',
      signals: (n: number) => `${n} kinds of evidence`,
      signalsLabel: 'Evidence behind the decision',
      chainTitle: 'Claim timeline',
      stagesLabel: 'Claim stage',
      closed: 'Claim paid',
      dismiss: 'Deny',
      dismissing: 'Denying',
      dismissed: 'Denied',
      announceClosed: 'Claim paid',
      announceDismissed: 'Claim denied',
    },
  },
}

/** Commerce: an order flagged for fraud in Review. Hold ends what was still running, here the order still being picked. */
export const FraudReview: Story = {
  name: 'Fraud review',
  args: {
    now: '2026-10-13T12:45:00Z',
    defaultStage: 'review',
    details: {
      id: 'Order 58213',
      openedAt: '2026-10-13T12:20:00Z',
      subject: 'o.petrenko',
      verdict: 'likely',
      summary: 'Three new accounts paid with one card and asked for express shipping to a freight forwarder',
      confidence: 0.77,
    },
    stages: [
      { id: 'flag', label: 'Flag', action: 'Start review', pending: 'Starting', done: 'In review' },
      { id: 'review', label: 'Review', action: 'Hold order', pending: 'Holding', done: 'On hold', stops: true },
      { id: 'hold', label: 'Hold', action: 'Contact buyer', pending: 'Sending', done: 'Contacted' },
      { id: 'resolve', label: 'Resolve', action: 'Resolve case', pending: 'Resolving', done: 'Resolved' },
    ],
    verdicts: [
      { id: 'likely', label: 'Likely fraud', tone: 'danger' },
      { id: 'unclear', label: 'Needs a look', tone: 'warning' },
      { id: 'legit', label: 'Looks legitimate', tone: 'success' },
    ],
    signals: [
      { id: 'payment', label: 'Payment', weight: 40, tone: 'chart-4' },
      { id: 'device', label: 'Device', weight: 28, tone: 'chart-1' },
      { id: 'address', label: 'Address', weight: 32, tone: 'chart-5' },
    ],
    steps: [
      { id: 'placed', at: '2026-10-13T12:20:00Z', title: 'Order placed by a new account', source: 'Checkout', entity: 'o.petrenko', tone: 'chart-4' },
      { id: 'card', at: '2026-10-13T12:22:00Z', title: 'Same card used on two other accounts', source: 'Payments', entity: 'card •• 4417', tone: 'chart-4' },
      { id: 'address', at: '2026-10-13T12:31:00Z', title: 'Shipping changed to a freight forwarder', source: 'Checkout', entity: 'Newark, NJ', tone: 'chart-5' },
      { id: 'express', at: '2026-10-13T12:36:00Z', title: 'Upgraded to overnight shipping', source: 'Checkout', entity: 'o.petrenko', tone: 'chart-5' },
      {
        id: 'pick',
        at: '2026-10-13T12:40:00Z',
        title: 'Picking started in the warehouse',
        source: 'Warehouse',
        entity: 'Bay 6',
        tone: 'chart-1',
        ongoing: true,
      },
    ],
    copy: {
      verdictTitle: 'Risk assessment',
      signals: (n: number) => `${n} risk signals`,
      signalsLabel: 'Signals behind the risk score',
      chainTitle: 'Order activity',
      stagesLabel: 'Review stage',
      closed: 'Review resolved',
      dismiss: 'Release',
      dismissing: 'Releasing',
      dismissed: 'Released',
      announceClosed: 'Review resolved',
      announceDismissed: 'Order released as legitimate',
    },
  },
}

/** Drawn as its own page, with the case as the page's `h1`. */
export const Standalone: Story = { args: { embedded: false } }
