/* A fictional team's detection rules by tactic and source: pass yours through the block's props. */

export type CoverageGridTone = 'accent' | 'neutral' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

/** A column: where the coverage comes from (a source of telemetry, a kind of test). */
export interface CoverageGridColumn {
  id: string
  label: string
  tone: CoverageGridTone
}

/** A row: what is covered, with how deep the coverage goes in each column (in the order of the columns; 0 is none). */
export interface CoverageGridRow {
  id: string
  label: string
  depth: readonly number[]
}

export const COLUMNS: CoverageGridColumn[] = [
  { id: 'identity', label: 'Identity', tone: 'chart-3' },
  { id: 'devices', label: 'Devices', tone: 'chart-1' },
  { id: 'cloud', label: 'Cloud', tone: 'chart-5' },
  { id: 'mail', label: 'Mail', tone: 'chart-4' },
  { id: 'network', label: 'Network', tone: 'chart-2' },
  { id: 'apps', label: 'Apps', tone: 'neutral' },
]

export const ROWS: CoverageGridRow[] = [
  { id: 'initial-access', label: 'Initial access', depth: [3, 1, 1, 5, 2, 1] },
  { id: 'execution', label: 'Execution', depth: [1, 5, 2, 1, 0, 0] },
  { id: 'persistence', label: 'Persistence', depth: [2, 4, 3, 0, 1, 2] },
  { id: 'credential-access', label: 'Credential access', depth: [5, 3, 1, 1, 1, 2] },
  { id: 'discovery', label: 'Discovery', depth: [1, 2, 2, 0, 3, 1] },
  { id: 'lateral-movement', label: 'Lateral movement', depth: [1, 2, 0, 0, 2, 0] },
  { id: 'command-and-control', label: 'Command and control', depth: [0, 2, 1, 1, 4, 1] },
  { id: 'exfiltration', label: 'Exfiltration', depth: [1, 1, 2, 1, 3, 1] },
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
  title: 'Detection coverage',
  subtitle: 'Tactics by source',
  coveredCount: (covered: string, total: string) => `${covered} / ${total}`,
  coveredName: (covered: string, total: string) => `${covered} of ${total} covered`,
  matrixLabel: 'Detection rules by tactic and source',
  depth: (n: number) => `${n} ${plural(n, 'rule', 'rules')}`,
  noDepth: 'No rules',
  depthLabel: 'Fill shows rule depth',
  suggestion: (gaps: number, row: string) =>
    `${row} has ${gaps} ${plural(gaps, 'gap', 'gaps')}. Draft rules to cover ${plural(gaps, 'it', 'them')}?`,
  noGaps: (row: string) => `${row} is covered by every source.`,
  drafted: (n: number, row: string) => `Drafted ${n} ${plural(n, 'rule', 'rules')} for ${row}. They go live once reviewed.`,
  draft: (n: number) => `Draft ${n} ${plural(n, 'rule', 'rules')}`,
  /** The draft button while there is nothing to draft for: loading, an error or an empty grid. */
  draftIdle: 'Draft rules',
  drafting: 'Drafting',
  draftDone: 'Drafted',
  review: 'Review gaps',
  failed: 'That didn’t go through',
  loadingLabel: 'Loading the coverage',
  retry: 'Retry',
  emptyTitle: 'Nothing to cover',
  emptyDescription: 'Rows and columns show up here.',
}

export type CoverageGridCopy = typeof DEFAULT_COPY
