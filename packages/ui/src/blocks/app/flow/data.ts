type DemoRange = '7d' | '30d' | '90d'
export type Tone = 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5' | 'success' | 'warning' | 'danger' | 'neutral'

export interface Node {
  id: string
  label: string
  /** The stage (column) it stands in, 0 first. */
  stage: number
  /** Its colour. Default: a chart colour for each node of the first stage (the paths from it wear it on), neutral after. */
  tone?: Tone
}

export interface Path {
  /** The nodes it passes through, one a stage from the first; it may stop early. */
  steps: string[]
  /** How many took it. */
  value: number
}

/** One span the switch offers: "7D", "30D", "90D". */
export interface Range {
  id: string
  /** On the switch. */
  label: string
  /** In words, in the description, the table's name and what is spoken ("last 30 days"). Default: `label`. */
  name?: string
}

/** The block's item types, under its name. */
export type FlowNode = Node
export type FlowPath = Path
export type FlowRange = Range
export type FlowTone = Tone

/* ── Demo data ─────────────────────────────────────────────────────────────
 * A product's free trials: where each came from, the plan it tried and how
 * it ended, for the last 7, 30 and 90 days. Referrals and partners convert
 * best, social worst; Team converts best, Starter worst. The longer the
 * range the fewer are still trialing, since older trials have ended; last
 * week a social campaign brought in a crowd that mostly tried Starter. */

export const NODES: Node[] = [
  { id: 'search', label: 'Search', stage: 0 },
  { id: 'direct', label: 'Direct', stage: 0 },
  { id: 'referral', label: 'Referral', stage: 0 },
  { id: 'social', label: 'Social', stage: 0 },
  { id: 'partners', label: 'Partners', stage: 0 },
  { id: 'starter', label: 'Starter', stage: 1 },
  { id: 'pro', label: 'Pro', stage: 1 },
  { id: 'team', label: 'Team', stage: 1 },
  { id: 'paid', label: 'Paid', stage: 2, tone: 'success' },
  { id: 'trialing', label: 'Still trialing', stage: 2 },
  { id: 'cancelled', label: 'Cancelled', stage: 2, tone: 'danger' },
]

export const STAGES = ['Source', 'Plan', 'Outcome']

const SOURCES = ['search', 'direct', 'referral', 'social', 'partners'] as const
const PLANS = ['starter', 'pro', 'team'] as const
/** Each source's pull on the plans, and how well its trials convert. */
const MIX: Record<(typeof SOURCES)[number], { plans: number[]; quality: number }> = {
  search: { plans: [0.42, 0.43, 0.15], quality: 1 },
  direct: { plans: [0.35, 0.45, 0.2], quality: 0.95 },
  referral: { plans: [0.28, 0.44, 0.28], quality: 1.3 },
  social: { plans: [0.58, 0.33, 0.09], quality: 0.7 },
  partners: { plans: [0.2, 0.4, 0.4], quality: 1.2 },
}
/** Each plan's paid and cancelled shares once a trial has ended. */
const ENDS = { starter: [0.32, 0.68], pro: [0.5, 0.5], team: [0.66, 0.34] }
const RANGES: Record<DemoRange, { total: number; sources: number[]; trialing: number }> = {
  '7d': { total: 590, sources: [0.27, 0.2, 0.13, 0.32, 0.08], trialing: 0.64 },
  '30d': { total: 2480, sources: [0.33, 0.25, 0.18, 0.14, 0.1], trialing: 0.26 },
  '90d': { total: 7140, sources: [0.35, 0.26, 0.17, 0.12, 0.1], trialing: 0.09 },
}

function demo(range: DemoRange): Path[] {
  const { total, sources, trialing } = RANGES[range]
  return SOURCES.flatMap((source, s) =>
    PLANS.flatMap((plan, p) => {
      const tried = total * sources[s]! * MIX[source].plans[p]!
      const paid = Math.min(0.9, ENDS[plan][0]! * MIX[source].quality)
      const ended = tried * (1 - trialing)
      return [
        { steps: [source, plan, 'paid'], value: Math.round(ended * paid) },
        { steps: [source, plan, 'trialing'], value: Math.round(tried * trialing) },
        { steps: [source, plan, 'cancelled'], value: Math.round(ended * (1 - paid)) },
      ]
    }),
  )
}

export const DEMO: Record<DemoRange, Path[]> = { '7d': demo('7d'), '30d': demo('30d'), '90d': demo('90d') }

/** The demo's ranges. */
export const DEMO_RANGES: Range[] = [
  { id: '7d', label: '7D', name: 'last 7 days' },
  { id: '30d', label: '30D', name: 'last 30 days' },
  { id: '90d', label: '90D', name: 'last 90 days' },
]

const plural = new Intl.PluralRules('en')

export const DEFAULT_COPY = {
  title: 'Trial flow',
  /** Under the title: what the flow follows, and the range. */
  description: (range: string) => `Where trials came from, the plan they tried and how they ended · ${range}`,
  /** The range switch's name. */
  range: 'Range',
  /** A count with its noun: "2,480 trials". */
  count: (value: string, n: number) => `${value} ${plural.select(n) === 'one' ? 'trial' : 'trials'}`,
  /** The chart's name, and the name of its steps for assistive tech. */
  chart: 'Trial flow',
  nodes: 'Steps of the flow',
  /** A step for assistive tech: its stage, figure and share, then where its people went on to (or came from, at the end). */
  node: (label: string, stage: string, count: string, share: string, then: string) => `${label}, ${stage}: ${count}, ${share} of all. ${then}`,
  onward: (parts: string) => `Went on to ${parts}.`,
  from: (parts: string) => `Came from ${parts}.`,
  /** One part of a split: "Paid 860 (35%)". */
  part: (label: string, value: string, share: string) => `${label} ${value} (${share})`,
  /** A path, named when pointed at: "Search → Pro → Paid: 124 trials (5%)". */
  path: (steps: string, count: string, share: string) => `${steps}: ${count} (${share})`,
  /** Between a path's steps. */
  arrow: ' → ',
  /** The chart's summary for assistive tech. */
  summary: (total: string, sources: number, ends: string) => `${total} from ${sources} sources. ${ends}.`,
  /** The table that can stand in for the chart. */
  viewData: 'View data',
  hideData: 'Hide data',
  table: (range: string) => `Trial flow, step to step, ${range}`,
  columnFrom: 'From',
  columnTo: 'To',
  columnValue: 'Trials',
  columnShare: 'Share of from',
  /** Spoken after the range changes. */
  announcement: (range: string, total: string) => `${range}: ${total}`,
  loading: 'Loading the flow',
  retry: 'Retry',
  empty: 'Nothing has flowed yet',
  emptyDescription: 'Paths appear once trials start.',
}

export type FlowCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale every figure is written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}
