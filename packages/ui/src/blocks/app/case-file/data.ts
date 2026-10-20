/* A fictional case from a fictional security team: pass yours through the block's props. */

/** The state past the last stage, once the case is closed or dismissed. */
export const CLOSED = 'closed'

/** One stage of the case. Its action finishes it and moves the case on to the next; past the last the case is closed. */
export interface CaseFileStage {
  id: string
  /** Its name on the stepper: "Triage". */
  label: string
  /** What the primary button says while the case is here: "Contain account". */
  action: string
  /** The button while the action runs: "Containing". */
  pending: string
  /** The button once it has run: "Contained". */
  done: string
  /** Its action ends what was still running: ongoing steps stop where it ran. */
  stops?: boolean
}

/** A verdict the case can carry, with the tone of its badge. */
export interface CaseFileVerdict {
  id: string
  label: string
  tone: 'danger' | 'warning' | 'success' | 'info' | 'neutral'
}

/** A chart color per kind of source (Identity, Mail…), so a kind wears the same color everywhere. */
export type CaseFileTone = 'accent' | 'neutral' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

export interface CaseFileDetails {
  /** Its reference, the card's title: "Case 4127". */
  id: string
  /** When it was opened, an ISO date-time. */
  openedAt: string
  /** Who or what it is about, set in mono after the age: "a.moreau". */
  subject: string
  /** A `CaseFileVerdict` id. */
  verdict: string
  /** The verdict in one sentence. */
  summary: string
  /** How sure the verdict is, 0–1. */
  confidence: number
}

/** One kind of evidence behind the verdict: the bar splits by `weight`. */
export interface CaseFileSignal {
  id: string
  label: string
  weight: number
  tone: CaseFileTone
}

/** One step of the case's chain of events. */
export interface CaseFileStep {
  id: string
  /** When it happened, an ISO date-time. */
  at: string
  /** What happened: "Opened a link in a payment reminder". */
  title: string
  /** Where it was seen: "Mail". */
  source: string
  /** What it touched, set in mono: "a.moreau". */
  entity: string
  tone: CaseFileTone
  /** Still going: its bar runs to now on the ribbon, until a stage that stops it has run. */
  ongoing?: boolean
}

/** The demo's "now", fixed so the server and the browser render the same ages. */
export const DEMO_NOW = '2026-10-13T09:26:00Z'

export const STAGES: CaseFileStage[] = [
  { id: 'triage', label: 'Triage', action: 'Investigate', pending: 'Starting', done: 'Investigating' },
  { id: 'investigate', label: 'Investigate', action: 'Start containment', pending: 'Starting', done: 'Containing' },
  { id: 'contain', label: 'Contain', action: 'Contain account', pending: 'Containing', done: 'Contained', stops: true },
  { id: 'close', label: 'Close', action: 'Close case', pending: 'Closing', done: 'Closed' },
]

/** The stage the demo starts in. */
export const DEFAULT_STAGE = 'contain'

export const VERDICTS: CaseFileVerdict[] = [
  { id: 'malicious', label: 'Malicious', tone: 'danger' },
  { id: 'suspicious', label: 'Suspicious', tone: 'warning' },
  { id: 'benign', label: 'Benign', tone: 'success' },
]

export const DETAILS: CaseFileDetails = {
  id: 'Case 4127',
  openedAt: '2026-10-13T09:12:00Z',
  subject: 'a.moreau',
  verdict: 'malicious',
  summary: 'Mailbox takeover that began with a fake payment reminder',
  confidence: 0.92,
}

export const SIGNALS: CaseFileSignal[] = [
  { id: 'identity', label: 'Identity', weight: 38, tone: 'chart-3' },
  { id: 'mail', label: 'Mail', weight: 27, tone: 'chart-4' },
  { id: 'cloud', label: 'Cloud', weight: 21, tone: 'chart-5' },
  { id: 'devices', label: 'Devices', weight: 14, tone: 'chart-1' },
]

export const STEPS: CaseFileStep[] = [
  { id: 'link', at: '2026-10-13T09:12:00Z', title: 'Opened a link in a payment reminder', source: 'Mail', entity: 'a.moreau', tone: 'chart-4' },
  { id: 'prompt', at: '2026-10-13T09:13:00Z', title: 'Approved a sign-in prompt on the phone', source: 'Identity', entity: 'sso', tone: 'chart-3' },
  { id: 'session', at: '2026-10-13T09:15:00Z', title: 'New session from an unknown laptop', source: 'Identity', entity: 'Lisbon', tone: 'chart-3' },
  { id: 'token', at: '2026-10-13T09:19:00Z', title: 'Created a storage access token', source: 'Cloud', entity: 'prod-eu', tone: 'chart-5' },
  {
    id: 'archive',
    at: '2026-10-13T09:22:00Z',
    title: 'Packing 1.8 GB into an archive',
    source: 'Devices',
    entity: 'lt-moreau',
    tone: 'chart-1',
    ongoing: true,
  },
]

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
export function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  return wait(ms)
}

const plural = (n: number, one: string, other: string) => (new Intl.PluralRules('en').select(n) === 'one' ? one : other)

export const DEFAULT_COPY = {
  opened: (age: string) => `Opened ${age}`,
  dismissed: 'Dismissed',
  stagesLabel: 'Case stage',
  verdictTitle: 'Verdict',
  confidence: 'confidence',
  signals: (n: number) => `${n} ${plural(n, 'signal', 'signals')}`,
  signalsLabel: 'Signals behind the verdict',
  chainTitle: 'Attack chain',
  /** The primary button once the case is closed or dismissed. */
  closed: 'Case closed',
  dismiss: 'Dismiss',
  dismissing: 'Dismissing',
  failed: 'That didn’t go through',
  announceStage: (stage: string) => `Case moved to ${stage}`,
  announceClosed: 'Case closed',
  announceDismissed: 'Case dismissed as a false positive',
}

export type CaseFileCopy = typeof DEFAULT_COPY
