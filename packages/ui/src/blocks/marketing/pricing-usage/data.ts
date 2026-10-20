import type { MouseEventHandler } from 'react'
import { numberFormat } from '../../../lib/utils'

/** Each meter's value, by meter id. */
export type PricingUsageValues = Record<string, number>

/** A metered resource: a slider on a linear scale, and a line on the receipt. */
export interface PricingUsageMeter {
  id: string
  label: string
  /** After the value ("a month"); also ends the slider's name. */
  unit: string
  min: number
  max: number
  step: number
  /** Included in the free plan. */
  free: number
  /** Included in the base plan's price; the notch under the track. */
  included: number
  /** The price of one step over the base allowance, in the block's currency. */
  perStep: number
  /** The rate as shown ("$2 per extra million"). */
  rate: string
  /** For the thumb's aria-valuetext. */
  format: Intl.NumberFormatOptions
  /** The value as shown beside the meter and on the rule, in the block's locale. */
  show: (value: number, locale: string) => string
}

/** A call to action: always a link, rendered with `linkComponent`. */
export interface PricingUsageCta {
  label: string
  href: string
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

/** A plan the estimate can land on. */
export interface PricingUsagePlan {
  id: string
  name: string
  /** The line under the total while the estimate fits this plan. */
  note: string
  /** The receipt's call to action while the estimate fits this plan; none without it. */
  cta?: PricingUsageCta
}

/** The three plans the estimate moves between: free, the metered base plan, and committed usage. */
export interface PricingUsagePlans {
  free: PricingUsagePlan
  base: PricingUsagePlan
  committed: PricingUsagePlan
}

export const METERS: PricingUsageMeter[] = [
  {
    id: 'requests',
    label: 'Edge requests',
    unit: 'a month',
    min: 0,
    max: 100_000_000,
    step: 1_000_000,
    free: 1_000_000,
    included: 10_000_000,
    perStep: 2,
    rate: '$2 per extra million',
    format: { notation: 'compact', compactDisplay: 'long' },
    show: (v, locale) => numberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(v),
  },
  {
    id: 'bandwidth',
    label: 'Bandwidth',
    unit: 'a month',
    min: 0,
    max: 5,
    step: 0.1,
    free: 0.1,
    included: 1,
    perStep: 15,
    rate: '$0.15 per extra GB',
    format: { style: 'unit', unit: 'terabyte', unitDisplay: 'long', maximumFractionDigits: 1 },
    // lint-blocks-allow: a pricing tier label, not a file size
    show: (v) => (v < 1 ? `${Math.round(v * 1000)} GB` : `${v.toFixed(1).replace(/\.0$/, '')} TB`),
  },
  {
    id: 'minutes',
    label: 'Build minutes',
    unit: 'a month',
    min: 0,
    max: 30_000,
    step: 500,
    free: 1_000,
    included: 6_000,
    perStep: 5,
    rate: '$1 per extra 100 minutes',
    format: { style: 'unit', unit: 'minute', unitDisplay: 'long' },
    show: (v, locale) => numberFormat(locale).format(v),
  },
]

export const USAGE: PricingUsageValues = { requests: 18_000_000, bandwidth: 1.6, minutes: 9_000 }

export const PLANS: PricingUsagePlans = {
  free: {
    id: 'hobby',
    name: 'Hobby',
    note: 'Everything here fits the free plan. We’ll email you before you reach a limit.',
    cta: { label: 'Start free on Hobby', href: '#signup-hobby' },
  },
  base: {
    id: 'pro',
    name: 'Pro',
    note: 'Billed at the end of each month. Set a spend cap and we’ll never go past it.',
    cta: { label: 'Start a Pro trial', href: '#signup-pro' },
  },
  committed: {
    id: 'scale',
    name: 'Scale',
    note: 'At this volume, Scale’s committed usage costs less than Pro’s overage. We’ll price it with you.',
    cta: { label: 'Talk to sales about Scale', href: '#sales' },
  },
}

export const DEFAULT_COPY = {
  eyebrow: 'Usage pricing',
  title: 'Pay for what you serve, not for what you might',
  description: (basePlan: string, basePrice: string) =>
    `${basePlan} is ${basePrice} a seat with a generous allowance. Past it, you pay per unit, at the same rate on day one and at a billion requests.`,
  rate: (rate: string, basePlan: string) => `${rate} over ${basePlan}’s allowance`,
  allowance: (basePlan: string, amount: string) => `${basePlan} includes ${amount}`,
  estimateTitle: 'Your estimate',
  fits: (plan: string) => `Fits ${plan}`,
  freeLine: (plan: string) => `${plan}, free`,
  baseLine: (plan: string) => `${plan} base, one seat`,
  withinFree: 'Within the free allowance',
  over: (amount: string) => `${amount} over`,
  included: 'Included',
  total: 'Per month',
  announce: (total: string, plan: string) => `Estimated ${total} a month on ${plan}.`,
}

export type PricingUsageCopy = typeof DEFAULT_COPY

/** Steps over the base allowance, counted on the meter's own grid so 0.1 TB steps never drift. */
export const over = (meter: PricingUsageMeter, value: number) => Math.max(0, Math.round((value - meter.included) / meter.step))

/** The receipt for some usage: each meter's overage, the total, and the plan it lands on. */
export function estimate(meters: PricingUsageMeter[], usage: PricingUsageValues, plans: PricingUsagePlans, basePrice: number, committedFrom: number) {
  const value = (m: PricingUsageMeter) => usage[m.id] ?? m.min
  const free = meters.every((m) => value(m) <= m.free)
  const lines = meters.map((m) => {
    const steps = free ? 0 : over(m, value(m))
    return { meter: m, steps, cost: steps * m.perStep }
  })
  const total = free ? 0 : basePrice + lines.reduce((sum, l) => sum + l.cost, 0)
  const tier = free ? 'free' : total >= committedFrom ? 'committed' : 'base'
  return { lines, total, tier, plan: plans[tier] } as const
}

const formats = new Map<string, Intl.NumberFormat>()
/** A cached whole-unit currency formatter. */
export function money(locale: string, currency: string) {
  const key = `${locale}|${currency}`
  let format = formats.get(key)
  if (!format) formats.set(key, (format = numberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 })))
  return format
}
