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

export type HeadToHeadSide = 'a' | 'b'

export interface HeadToHeadContender {
  /** What is compared: a model, an offer, a supplier. */
  name: string
  /** Its role: "Production", "Candidate", "Offer A". */
  role: string
  /** The figure under the name and on the trade-off's horizontal axis: where lower is better (a cost, a commute). */
  x: number
  /** The figure on the trade-off's vertical axis: where higher is better (a quality score, a salary). */
  y: number
}

export interface HeadToHeadMetric {
  id: string
  /** The row's name. Default: `copy.metrics[id]`, else the id. */
  label?: string
  a: number
  b: number
  better: 'higher' | 'lower'
  /** How the values read. */
  format: Intl.NumberFormatOptions
  /** How the margin reads in the row's chip: `points` for rates, `relative` for a share of the other value, or your own, from the winner's value and the other's. */
  margin: 'points' | 'relative' | ((winner: number, other: number) => string)
}

export const CONTENDERS: Record<HeadToHeadSide, HeadToHeadContender> = {
  a: { name: 'tern-large-0904', role: 'Production', x: 4.1, y: 89.8 },
  b: { name: 'tern-mini-0926', role: 'Candidate', x: 1.35, y: 90.6 },
}

const PCT: Intl.NumberFormatOptions = { style: 'unit', unit: 'percent', maximumFractionDigits: 1 }

export const METRICS: HeadToHeadMetric[] = [
  { id: 'accuracy', a: 91.2, b: 92.4, better: 'higher', format: PCT, margin: 'points' },
  { id: 'faithfulness', a: 88.4, b: 86.9, better: 'higher', format: PCT, margin: 'points' },
  { id: 'latency', a: 1560, b: 820, better: 'lower', format: { style: 'unit', unit: 'millisecond', maximumFractionDigits: 0 }, margin: 'relative' },
  { id: 'cost', a: 4.1, b: 1.35, better: 'lower', format: { style: 'currency', currency: 'USD' }, margin: 'relative' },
  { id: 'refusals', a: 3.1, b: 2.2, better: 'lower', format: PCT, margin: 'points' },
  { id: 'toxicity', a: 0.4, b: 0.4, better: 'lower', format: PCT, margin: 'points' },
]

export const DEFAULT_COPY = {
  title: 'Compare',
  subtitle: '540 cases · run 11:48',
  more: 'More options',
  contenders: 'Contenders',
  sides: { a: 'A', b: 'B' } as Record<HeadToHeadSide, string>,
  winner: 'Winner',
  wins: (count: number, total: number) => `${count} of ${total} wins`,
  xUnit: 'per 1K runs',
  metricsLabel: 'Metrics',
  metrics: {
    accuracy: 'Accuracy',
    faithfulness: 'Faithfulness',
    latency: 'Latency p95',
    cost: 'Cost / 1K runs',
    refusals: 'Over-refusals',
    toxicity: 'Toxicity',
  } as Record<string, string>,
  even: 'Even',
  higher: 'higher is better',
  lower: 'lower is better',
  tradeoff: 'Cost against quality',
  xAxis: 'Cost',
  yAxis: 'Quality',
  bestCorner: 'Cheaper and better',
  xChange: 'Cost',
  yChange: 'Quality',
  /** The trade-off in a sentence, with the change on each axis formatted ("−67%", "+0.8 pt"). */
  summary: (name: string, cost: string, quality: string) => `${name}: ${cost} cost, ${quality} quality.`,
  points: (value: string) => `${value} pt`,
  chooseLabel: 'Model to promote',
  choose: (name: string) => `Promote ${name}`,
  choosing: 'Promoting…',
  chosen: 'Promoted',
  status: 'Same 540 cases · seed 21',
  loading: 'Loading the comparison',
  retry: 'Retry',
  emptyTitle: 'Nothing to compare',
  emptyDescription: 'Pick two things to see them side by side.',
}

export type HeadToHeadCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale its numbers and dates are written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}
