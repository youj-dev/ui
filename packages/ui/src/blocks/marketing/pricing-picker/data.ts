import type { MouseEventHandler } from 'react'
import { numberFormat } from '../../../lib/utils'

export type PricingPickerPeriod = 'monthly' | 'yearly'

/** A call to action: always a link, rendered with `linkComponent`. */
export interface PricingPickerCta {
  label: string
  href: string
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

/** A plan's radio card and its line in the order summary. */
export interface PricingPickerPlan {
  id: string
  name: string
  /** One line under the name; it describes the radio. */
  blurb: string
  /** The price per seat and month, when billed monthly or yearly. */
  price: Record<PricingPickerPeriod, number>
  /** A small badge beside the name ("Most teams"). */
  badge?: string
  /** What the plan includes, listed when it's chosen. */
  features: string[]
  /** For one person: the seats field locks at 1. */
  singleSeat?: boolean
  /** The order summary's call to action while this plan is chosen; none without it. */
  cta?: PricingPickerCta
}

export const PLANS: PricingPickerPlan[] = [
  {
    id: 'hobby',
    name: 'Hobby',
    blurb: 'For one person and their side projects.',
    price: { monthly: 0, yearly: 0 },
    singleSeat: true,
    cta: { label: 'Continue with Hobby', href: '#checkout-hobby' },
    features: ['Unlimited previews', '100 GB bandwidth', 'One concurrent build', 'Community support'],
  },
  {
    id: 'pro',
    name: 'Pro',
    blurb: 'For teams shipping to production every day.',
    price: { monthly: 24, yearly: 19 },
    badge: 'Most teams',
    cta: { label: 'Continue with Pro', href: '#checkout-pro' },
    features: ['1 TB bandwidth per seat', 'Instant rollback', 'Preview comments', 'Four concurrent builds', 'Spend caps and alerts', 'Email support in hours'],
  },
  {
    id: 'scale',
    name: 'Scale',
    blurb: 'For products with serious traffic and auditors.',
    price: { monthly: 96, yearly: 79 },
    cta: { label: 'Continue with Scale', href: '#checkout-scale' },
    features: ['5 TB bandwidth per seat', 'SSO, SCIM and audit logs', '99.99% uptime SLA', 'Twelve concurrent builds', 'Dedicated build machines', 'A named engineer'],
  },
]

export const DEFAULT_COPY = {
  eyebrow: 'Plans',
  title: 'Pick a plan. See exactly what you’ll pay.',
  description: 'Per seat, with usage included. Change plans or seats whenever you like; we prorate to the day.',
  periodLabel: 'Billing period',
  monthly: 'Monthly',
  yearly: 'Yearly',
  /** Empty hides the badge. */
  saveBadge: 'Save 20%',
  planLabel: 'Plan',
  perUnit: 'per seat / mo',
  includes: (plan: string) => `${plan} includes`,
  seatsLabel: 'Seats',
  seatsHint: 'Anyone who deploys. Reviewers are free.',
  singleSeatHint: (plan: string) => `${plan} is for one person.`,
  summaryTitle: 'Order summary',
  product: (brand: string, plan: string) => `${brand} ${plan}`,
  seatLine: (seats: number, price: string) => `${seats} ${seats === 1 ? 'seat' : 'seats'} × ${price}`,
  yearlyBilling: 'Yearly billing',
  switchToSave: (amount: string) => `Switch to save ${amount} a month`,
  /** Read before the yearly discount. */
  minus: 'minus ',
  totalLabel: 'Total per month',
  free: 'Free for as long as you like.',
  billedYearly: (total: string) => `Billed ${total} once a year.`,
  billedMonthly: 'Billed monthly. Cancel anytime.',
  /** Empty hides the note. */
  trialNote: 'Nothing is charged until your 14-day trial ends.',
}

export type PricingPickerCopy = typeof DEFAULT_COPY

const formats = new Map<string, Intl.NumberFormat>()
/** A cached whole-unit currency formatter. */
export function money(locale: string, currency: string) {
  const key = `${locale}|${currency}`
  let format = formats.get(key)
  if (!format) formats.set(key, (format = numberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 })))
  return format
}
