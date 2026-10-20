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

/** What the projection is read from, which the app's Start action receives. */
export interface CompoundProjectionPlan {
  /** Added every month. */
  monthly: number
  years: number
  /** The yearly rate as a fraction. */
  rate: number
}

/** The yearly rates the select offers, as fractions. */
export const RATES = [0.03, 0.05, 0.07, 0.09]
export const MIN_YEARS = 1
export const MAX_YEARS = 40

export const DEFAULT_COPY = {
  currency: 'USD',
  title: 'Growth forecast',
  description: 'What a steady monthly amount grows into.',
  /** The pill beside the title, e.g. "7% avg. return". */
  rateBadge: (rate: string) => `${rate} avg. return`,
  /** After the two figures: how the end total splits. */
  split: (added: string, gain: string) => `${added} put in, ${gain} growth`,
  /** The years slider's value text, e.g. "10 years". */
  yearsValue: (years: number) => `${years} ${new Intl.PluralRules('en').select(years) === 'one' ? 'year' : 'years'}`,
  start: 'Start investing',
  starting: 'Starting…',
  started: 'Plan started',
  disclaimer: 'Projections are illustrative and assume a steady return. Returns are not guaranteed and your capital is at risk.',
  loadingLabel: 'Loading the projection',
  retry: 'Retry',
  emptyTitle: 'Nothing to project yet',
  emptyDescription: 'Pick a number of years to see the bars.',
  /* The labels below default to the provider's (every locale); set one to say it your own way. */
  contribution: undefined as string | undefined,
  rate: undefined as string | undefined,
  years: undefined as string | undefined,
  today: undefined as string | undefined,
  year: undefined as ((year: string) => string) | undefined,
  bars: undefined as string | undefined,
  bar: undefined as ((year: string, total: string, added: string) => string) | undefined,
}

export type CompoundProjectionCopy = typeof DEFAULT_COPY & {
  /** The locale every amount is written in (BCP 47). Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}
