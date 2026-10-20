import type { CauseRingsContribution } from './geometry'

/* A fictional plant's lost minutes by cause: pass yours through the block's props. */

export type CauseRingsTone = 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5' | 'neutral'

export interface CauseRingsCause {
  id: string
  label: string
  /** What it accounts for in the period, in any unit; `format` and `copy.total` say which. */
  value: number
  tone: CauseRingsTone
  /** Where the figure came from (machines, lines, shifts): the three largest are drawn hatched on the outer ring, by rank. */
  contributors?: CauseRingsContribution[]
}

export const CAUSES: CauseRingsCause[] = [
  {
    id: 'tooling',
    label: 'Tooling',
    value: 412,
    tone: 'chart-4',
    contributors: [
      { label: 'Mill 04', value: 188 },
      { label: 'Mill 07', value: 131 },
      { label: 'Press 2', value: 62 },
      { label: 'Weld 1', value: 31 },
    ],
  },
  {
    id: 'maintenance',
    label: 'Maint.',
    value: 318,
    tone: 'chart-3',
    contributors: [
      { label: 'Press 2', value: 140 },
      { label: 'Mill 07', value: 96 },
      { label: 'Mill 04', value: 52 },
      { label: 'Weld 1', value: 30 },
    ],
  },
  {
    id: 'material',
    label: 'Material',
    value: 221,
    tone: 'chart-5',
    contributors: [
      { label: 'Weld 1', value: 104 },
      { label: 'Mill 04', value: 71 },
      { label: 'Press 2', value: 46 },
    ],
  },
  {
    id: 'setup',
    label: 'Setup',
    value: 168,
    tone: 'chart-2',
    contributors: [
      { label: 'Press 2', value: 91 },
      { label: 'Weld 1', value: 52 },
      { label: 'Mill 07', value: 25 },
    ],
  },
  { id: 'quality', label: 'Quality', value: 77, tone: 'chart-1', contributors: [{ label: 'Weld 1', value: 47 }, { label: 'Mill 04', value: 30 }] },
  { id: 'other', label: 'Other', value: 40, tone: 'neutral', contributors: [{ label: 'Weld 1', value: 40 }] },
]

const plural = (n: number, one: string, other: string) => (new Intl.PluralRules('en').select(n) === 'one' ? one : other)

export const DEFAULT_COPY = {
  title: 'Why lines stop',
  subtitle: 'minutes · last 28 days',
  total: (value: string) => `${value} min`,
  change: (percent: string, versus: string) => `${percent} vs ${versus}`,
  versus: 'Aug',
  chartLabel: (total: string, parts: string) => `Lost minutes by cause, ${total} in all: ${parts}`,
  share: (label: string, value: string, percent: string) => `${label} ${value} min, ${percent}`,
  legendLabel: 'Causes',
  legendHint: 'Select a cause to see where its minutes came from.',
  contributors: (list: string) => `Most from ${list}`,
  patternTop: 'Top contributor',
  patternSecond: '2nd',
  patternThird: '3rd',
  loadingLabel: 'Loading',
  retry: 'Retry',
  emptyTitle: 'Nothing lost',
  emptyDescription: 'No causes in this period.',
  insight: (count: number, percent: string) => `${count} ${plural(count, 'cause makes', 'causes make')} up ${percent} of lost minutes`,
}

export type CauseRingsCopy = typeof DEFAULT_COPY

/** How many of the largest causes the insight sums, by default. */
export const INSIGHT_COUNT = 3
