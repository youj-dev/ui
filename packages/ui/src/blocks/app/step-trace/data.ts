/* Fixtures, the run's schedule and the copy for the agent trace: one run of
 * a release-notes agent, its steps in the order they depend on each other,
 * each with what went in and what came out. */

import type { FlowStatus } from '../../../components/ui/flow-graph'

/** A kind of step, with its label and the one thing the card does differently for it. */
export interface StepTraceKind {
  id: string
  /** Over the step's name in the graph and in its detail: "LLM", "Tool". */
  label: string
  /** A mark before the label in the step's detail. Default: none. */
  tone?: 'accent' | 'info' | 'success' | 'warning' | 'danger' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'
  /** Its output arrives a piece at a time while it runs (a model call): the detail shows it growing, and its size and cost count up. A step of a kind without it shows nothing until it's done. */
  streams?: boolean
}

export interface StepTraceStep {
  id: string
  /** The step's name as the agent calls it, set in mono. */
  label: string
  /** A `StepTraceKind` id. */
  kind: string
  /** The steps it waits on. List steps after the ones they wait on. */
  after: string[]
  /** Seconds each attempt takes; every attempt but the last failed. */
  attempts: number[]
  /** Its last attempt fails too: the steps that need it are skipped. */
  fails?: boolean
  /** Left out by the run's settings: skipped from the start. */
  off?: boolean
  /** What went in and what came out, in whatever you count (tokens, bytes, samples). */
  size?: { input: number; output: number }
  /** What the step cost, in your currency's units. */
  cost?: number
  /** JSON the step was called with. */
  input: string
  /** What it returned: JSON, or the draft's text (streamed while it runs). */
  output: string
  /** What the failed attempts said. */
  error?: string
}

export interface StepTraceRun {
  id: string
  /** What ran: "release-scribe", "POST /checkout". */
  name: string
  /** What it was asked to do. */
  task: string
  /** How it ran, for the foot: "scribe-l · temp 0.2". */
  method: string
  /** Where it ran, for the foot: "eu-west-1". */
  place: string
}

export const RUN: StepTraceRun = {
  id: 'run_0412',
  name: 'release-scribe',
  task: 'Draft the v4.2 release notes from everything merged since v4.1',
  method: 'scribe-l · temp 0.2',
  place: 'eu-west-1',
}

const json = (value: unknown) => JSON.stringify(value, null, 2)

export const KINDS: StepTraceKind[] = [
  { id: 'llm', label: 'LLM', streams: true },
  { id: 'tool', label: 'Tool' },
]

export const STEPS: StepTraceStep[] = [
  {
    id: 'plan',
    label: 'plan',
    kind: 'llm',
    after: [],
    attempts: [3.2],
    size: { input: 1104, output: 286 },
    cost: 0.0061,
    input: json({ task: 'Draft the v4.2 release notes', since: 'v4.1', audience: 'customers' }),
    output: json({ steps: ['collect merged work', 'group by theme', 'draft', 'check links', 'publish'], tools: ['git.log', 'pr.list', 'issues.search'] }),
  },
  {
    id: 'git',
    label: 'git.log',
    kind: 'tool',
    after: ['plan'],
    attempts: [1.2],
    input: json({ range: 'v4.1..main', merges: true }),
    output: json({ commits: 86, merges: 31, authors: 12 }),
  },
  {
    id: 'issues',
    label: 'issues.search',
    kind: 'tool',
    after: ['plan'],
    attempts: [0.8, 2.3],
    error: '429 Too Many Requests: retry in 1.5 s',
    input: json({ query: 'closed:>2026-08-14 label:customer', limit: 50 }),
    output: json({ issues: 23, linked_prs: 19 }),
  },
  {
    id: 'prs',
    label: 'pr.list',
    kind: 'tool',
    after: ['plan'],
    attempts: [1.9],
    input: json({ state: 'merged', base: 'main', since: '2026-08-14' }),
    output: json({ count: 31, labels: { feature: 9, fix: 17, chore: 5 } }),
  },
  {
    id: 'shots',
    label: 'screenshots.fetch',
    kind: 'tool',
    after: ['prs'],
    attempts: [0.8],
    fails: true,
    error: '404: no preview deployment for PR 2291',
    input: json({ prs: [2291, 2304, 2317], size: '1280x800' }),
    output: json({ status: 404, error: 'No preview deployment for PR 2291' }),
  },
  {
    id: 'group',
    label: 'changes.group',
    kind: 'llm',
    after: ['git', 'issues', 'prs'],
    attempts: [7.5],
    size: { input: 9840, output: 1420 },
    cost: 0.0412,
    input: json({ commits: 86, prs: 31, issues: 23, themes: ['new', 'improved', 'fixed'] }),
    output: json({ new: 4, improved: 7, fixed: 15, left_out: 5 }),
  },
  {
    id: 'media',
    label: 'media.attach',
    kind: 'tool',
    after: ['shots'],
    attempts: [0.6],
    input: json({ images: 'screenshots.fetch' }),
    output: '',
  },
  {
    id: 'draft',
    label: 'notes.draft',
    kind: 'llm',
    after: ['group'],
    attempts: [13.8],
    size: { input: 4210, output: 2960 },
    cost: 0.0478,
    input: json({ groups: 'changes.group', tone: 'plain, second person', max_words: 600 }),
    output: [
      '## v4.2',
      '',
      '### New',
      '- Saved views: pin any set of filters to the sidebar.',
      '- Bulk edit up to 500 rows at once.',
      '',
      '### Improved',
      '- Search is about twice as fast in large workspaces.',
      '- Exports keep your column order.',
      '',
      '### Fixed',
      '- Dates in CSV exports follow your time zone.',
      '- The editor no longer loses focus after an upload.',
    ].join('\n'),
  },
  {
    id: 'links',
    label: 'links.check',
    kind: 'tool',
    after: ['draft'],
    attempts: [2.3],
    input: json({ urls: 14, timeout_ms: 4000 }),
    output: json({ ok: 13, redirected: 1, broken: 0 }),
  },
  {
    id: 'translate',
    label: 'translate.de',
    kind: 'tool',
    after: ['draft'],
    attempts: [3],
    off: true,
    input: json({ locale: 'de-DE' }),
    output: '',
  },
  {
    id: 'publish',
    label: 'notes.publish',
    kind: 'tool',
    after: ['links', 'media', 'translate'],
    attempts: [1.2],
    input: json({ channel: 'changelog', draft: true }),
    output: json({ url: '/changelog/v4-2', state: 'draft' }),
  },
]

/** Where the demo opens, in seconds into the run: the draft part-way through. */
export const START = 18.6

export interface Planned {
  start: number
  end: number
  outcome: 'ok' | 'error' | 'retried' | 'skipped'
  /** When each attempt after the first began. */
  retries: number[]
}

/**
 * When each step runs and how it ends: a step starts once everything it
 * waits on has finished; it's skipped when one of those failed or all were
 * skipped, and from the start when the run's settings leave it out.
 */
export function schedule(steps: StepTraceStep[]): Map<string, Planned> {
  const plan = new Map<string, Planned>()
  for (const s of steps) {
    const before = s.after.map((id) => plan.get(id)).filter((p): p is Planned => !!p)
    const ready = Math.max(0, ...before.map((p) => p.end))
    if (s.off) plan.set(s.id, { start: 0, end: 0, outcome: 'skipped', retries: [] })
    else if (before.some((p) => p.outcome === 'error') || (before.length > 0 && before.every((p) => p.outcome === 'skipped')))
      plan.set(s.id, { start: ready, end: ready, outcome: 'skipped', retries: [] })
    else {
      const retries = s.attempts.slice(0, -1).map((_, i) => ready + s.attempts.slice(0, i + 1).reduce((a, b) => a + b, 0))
      const end = ready + s.attempts.reduce((a, b) => a + b, 0)
      plan.set(s.id, { start: ready, end, outcome: s.fails ? 'error' : s.attempts.length > 1 ? 'retried' : 'ok', retries })
    }
  }
  return plan
}

/** A step's state `t` seconds into the run. */
export function statusAt(p: Planned, s: StepTraceStep, t: number): FlowStatus {
  if (p.outcome === 'skipped') return s.off || t >= p.start ? 'skipped' : 'queued'
  if (t < p.start) return 'queued'
  if (t < p.end) return 'running'
  return p.outcome
}

/** Which attempt a step is on (or ended on) at `t`. */
export const attemptAt = (p: Planned, t: number) => 1 + p.retries.filter((r) => t >= r).length

/** How far through a step is at `t`, from 0 to 1. */
export const progressAt = (p: Planned, t: number) => (p.end > p.start ? Math.min(1, Math.max(0, (t - p.start) / (p.end - p.start))) : t >= p.end ? 1 : 0)

export const DEFAULT_COPY = {
  title: 'v4.2 release notes',
  demoData: 'Demo data',
  subtitle: (name: string, id: string) => `${name} · ${id}`,
  more: 'More run actions',
  copyId: 'Copy run ID',
  copied: 'Run ID copied',
  download: 'Download trace',
  state: { running: 'Running', done: 'Completed', failed: 'Failed' } as Record<'running' | 'done' | 'failed', string>,
  steps: 'Steps',
  stepsOf: (done: number, total: number) => `${done}/${total}`,
  elapsed: 'Elapsed',
  size: 'Tokens',
  cost: 'Cost',
  failed: 'Failed',
  graph: 'Steps of the run',
  graphHint: 'Pick a step',
  status: { queued: 'Queued', running: 'Running', ok: 'Succeeded', error: 'Failed', retried: 'Retried', skipped: 'Skipped' } as Record<FlowStatus, string>,
  closeStep: 'Close step',
  duration: 'Duration',
  sizeInOut: 'Tokens in / out',
  attempts: 'Attempts',
  input: 'Input',
  output: 'Output',
  waiting: (names: string) => `Waiting on ${names}`,
  skippedOff: 'Left out: the run has no locales to translate into.',
  skippedAfter: 'Skipped: a step it needs failed or was skipped.',
  noOutput: 'Nothing yet',
  footer: (method: string, place: string) => `${method} · ${place}`,
  replay: 'Replay',
  approve: 'Approve and publish',
  approving: 'Publishing…',
  approved: 'Published',
  announceFailed: (name: string) => `${name} failed`,
  announceDone: (failed: number) => (failed ? `Run complete, ${failed} ${failed === 1 ? 'step' : 'steps'} failed` : 'Run complete'),
  announcePublished: 'Release notes published',
}

export type StepTraceCopy = typeof DEFAULT_COPY & {
  /** The locale the run's figures and names are written in (BCP 47). Default: the app's (YoujProvider's `locale`), else en-US. */
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
