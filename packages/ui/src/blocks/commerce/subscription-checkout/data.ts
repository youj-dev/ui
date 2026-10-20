import { numberFormat } from '../../../lib/utils'
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

export type Period = 'monthly' | 'yearly'

export interface Plan {
  id: string
  name: string
  description: string
  /** Per seat per month, billed monthly. */
  price: number
  features: string[]
  /** Marked as the one most teams pick. */
  popular?: boolean
}

export interface Country {
  code: string
  name: string
  taxLabel: string
  taxRate: number
}

export interface Payment {
  email: string
  holder: string
  card: string
  expiry: string
  cvc: string
  country: string
  postal: string
}

export interface SubscriptionOrder {
  plan: string
  period: Period
  seats: number
  promo?: string
  total: number
  payment: Omit<Payment, 'card' | 'cvc'> & { last4: string }
}

export const PLANS: Plan[] = [
  { id: 'starter', name: 'Starter', description: 'For small teams getting going.', price: 12, features: ['Unlimited projects', '10 GB storage', 'Email support'] },
  { id: 'pro', name: 'Pro', description: 'For teams that ship every week.', price: 24, features: ['Everything in Starter', 'Automations', 'Priority support'], popular: true },
  { id: 'business', name: 'Business', description: 'For organizations with more to manage.', price: 42, features: ['Everything in Pro', 'SAML SSO', 'Audit log'] },
]

export const COUNTRIES: Country[] = [
  { code: 'US', name: 'United States', taxLabel: 'Sales tax', taxRate: 0.08 },
  { code: 'CA', name: 'Canada', taxLabel: 'GST/HST', taxRate: 0.13 },
  { code: 'GB', name: 'United Kingdom', taxLabel: 'VAT', taxRate: 0.2 },
  { code: 'DE', name: 'Germany', taxLabel: 'VAT', taxRate: 0.19 },
  { code: 'FR', name: 'France', taxLabel: 'VAT', taxRate: 0.2 },
  { code: 'NL', name: 'Netherlands', taxLabel: 'VAT', taxRate: 0.21 },
]

/** Demo codes and the share they take off. */
export const PROMO_CODES: Record<string, number> = { LAUNCH20: 0.2, WELCOME10: 0.1 }

export const YEARLY_DISCOUNT = 0.2

const round = (n: number) => Math.round(n * 100) / 100

/** The whole order, per billing period. */
export function quote(plan: Plan, period: Period, seats: number, promo: number, taxRate: number) {
  const months = period === 'yearly' ? 12 : 1
  const list = round(plan.price * seats * months)
  const yearly = period === 'yearly' ? round(list * YEARLY_DISCOUNT) : 0
  const discount = round((list - yearly) * promo)
  const subtotal = round(list - yearly - discount)
  const tax = round(subtotal * taxRate)
  return { list, yearly, discount, subtotal, tax, total: round(subtotal + tax) }
}

/** Every string the checkout shows. Pass any of them through `copy` to rewrite or translate it. */
export const DEFAULT_COPY = {
  currency: 'USD',
  brand: 'Northwind',
  secure: 'Secure checkout',
  demo: 'Demo: no payment is processed',
  title: 'Upgrade your workspace',
  subtitle: 'Pick a plan, add your team and you’re set. Cancel any time.',
  stepPlan: 'Plan',
  stepPlanDescription: 'Every plan includes unlimited members, pay per seat.',
  stepPayment: 'Payment',
  stepPaymentDescription: 'You’re charged today, then at the start of every period.',
  billing: 'Billing period',
  monthly: 'Monthly',
  yearly: 'Yearly',
  save: (percent: number) => `Save ${percent}%`,
  plan: 'Plan',
  popular: 'Popular',
  perSeat: (period: Period) => (period === 'yearly' ? '/ seat / mo, billed yearly' : '/ seat / mo'),
  seats: 'Seats',
  seatsHint: 'One per person who signs in. Add or remove seats any time; changes are prorated.',
  placeholderTitle: 'Placeholder payment form',
  placeholderDescription: 'These are plain inputs for the demo. In your app, mount your payment provider’s secure fields (Stripe Elements, Adyen, Paddle…) here; never collect card numbers yourself.',
  email: 'Billing email',
  holder: 'Name on card',
  card: 'Card number',
  cardPlaceholder: '1234 1234 1234 1234',
  expiry: 'Expiry',
  expiryPlaceholder: 'MM/YY',
  cvc: 'CVC',
  cvcPlaceholder: '123',
  country: 'Country',
  postal: 'Postal code',
  emailInvalid: 'Enter an email like you@company.com.',
  holderRequired: 'Enter the name on the card.',
  cardInvalid: 'Enter the 16 digits on the card.',
  expiryInvalid: 'Use MM/YY, like 08/28.',
  cvcInvalid: '3 or 4 digits.',
  postalRequired: 'Enter a postal code.',
  back: 'Back',
  next: 'Continue to payment',
  subscribe: (total: string) => `Subscribe · ${total}`,
  subscribed: 'Subscribed',
  summary: 'Order summary',
  seatLine: (seats: number, price: string, period: Period) => `${seats} ${seats === 1 ? 'seat' : 'seats'} × ${price}${period === 'yearly' ? ' × 12 months' : ''}`,
  yearlyDiscount: 'Yearly discount',
  promo: 'Promo code',
  promoPlaceholder: 'Enter a code',
  apply: 'Apply',
  removePromo: (code: string) => `Remove ${code}`,
  promoInvalid: (code: string) => `“${code}” isn’t a valid code.`,
  promoApplied: (code: string, percent: number) => `${code} · ${percent}% off`,
  subtotal: 'Subtotal',
  tax: (label: string, percent: number) => `${label} (${percent}%)`,
  total: 'Due today',
  renews: (total: string, period: Period) => `Then ${total} ${period === 'yearly' ? 'every year' : 'every month'}, until you cancel.`,
  doneTitle: (plan: string) => `You’re on ${plan}`,
  doneDescription: (email: string) => `A receipt is on its way to ${email}. Your new seats are ready to use.`,
  receipt: 'Receipt',
  paidWith: (last4: string) => `Card ending ${last4}`,
  open: 'Go to your workspace',
}
export type SubscriptionCheckoutCopy = typeof DEFAULT_COPY & {
  /** The locale prices and dates are written in (BCP 47). Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}

export const money = (amount: number, copy: SubscriptionCheckoutCopy) => numberFormat(copy.locale, { style: 'currency', currency: copy.currency }).format(amount)

export const PAYMENT: Payment = { email: '', holder: '', card: '', expiry: '', cvc: '', country: 'US', postal: '' }

/** "4242424242424242" → "4242 4242 4242 4242". */
export const groupCard = (value: string) =>
  value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ')

/** "0828" → "08/28". */
export const formatExpiry = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}

export function paymentErrors(p: Payment, copy: SubscriptionCheckoutCopy): Partial<Record<keyof Payment, string>> {
  const errors: Partial<Record<keyof Payment, string>> = {}
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email.trim())) errors.email = copy.emailInvalid
  if (!p.holder.trim()) errors.holder = copy.holderRequired
  if (p.card.replace(/\s/g, '').length !== 16) errors.card = copy.cardInvalid
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(p.expiry)) errors.expiry = copy.expiryInvalid
  if (!/^\d{3,4}$/.test(p.cvc)) errors.cvc = copy.cvcInvalid
  if (!p.postal.trim()) errors.postal = copy.postalRequired
  return errors
}
