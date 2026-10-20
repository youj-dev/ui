import { numberFormat } from '../../../lib/utils'
/* Tern's billing: the plan the workspace pays for, the card it's charged to,
 * who invoices are addressed to, and the invoices so far. Pass yours from your
 * billing provider (Stripe, Paddle, …) through the block's props. */

export type BillingCycle = 'monthly' | 'annual'
export type Cycle = BillingCycle

export interface BillingPlan {
  id: string
  name: string
  blurb: string
  /** Per seat per month, billed monthly, in the block's currency. Annual billing takes two months off. */
  price: number
}
export type Plan = BillingPlan

export const PLANS: BillingPlan[] = [
  { id: 'starter', name: 'Starter', blurb: 'Up to 5 seats, 30-day history', price: 12 },
  { id: 'growth', name: 'Growth', blurb: 'Unlimited dashboards, 1-year history', price: 24 },
  { id: 'scale', name: 'Scale', blurb: 'SSO, audit log, unlimited history', price: 48 },
]

export const SEATS = 14

/** Per seat per month, for the cycle. */
export const seatPrice = (plan: BillingPlan, cycle: BillingCycle) => (cycle === 'annual' ? (plan.price * 10) / 12 : plan.price)

/** What one billing period costs. */
export const periodTotal = (plan: BillingPlan, cycle: BillingCycle, seats = SEATS) => (cycle === 'annual' ? plan.price * 10 * seats : plan.price * seats)

/** A money formatter for the block's locale and currency; whole amounts drop their cents. */
export const moneyFormat = (locale: string, currency: string) => {
  const whole = numberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 2 })
  const cents = numberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return (value: number) => (Number.isInteger(value) ? whole : cents).format(value)
}


export interface BillingCard {
  /** e.g. `Visa`. */
  brand: string
  last4: string
  expMonth: number
  /** Four digits. */
  expYear: number
  name: string
}
export type Card = BillingCard

/** What the update-card form collects. Hand it to your processor (or use its own form and ignore this). */
export interface BillingCardInput {
  name: string
  number: string
  /** `MM/YY`. */
  expiry: string
  cvc: string
}

export const CARD: BillingCard = { brand: 'Visa', last4: '4242', expMonth: 8, expYear: 2028, name: 'Ines Carvalho' }

export type BillingInvoiceStatus = 'paid' | 'due' | 'failed' | 'refunded'
export type InvoiceStatus = BillingInvoiceStatus

export interface BillingInvoice {
  id: string
  /** As printed, e.g. `TRN-0010`. */
  number: string
  /** As it reads, e.g. `Sep 1, 2026`. */
  date: string
  /** What it covers, e.g. `Sep 2026`. */
  period: string
  /** In the block's currency; negative for a credit. */
  amount: number
  status: BillingInvoiceStatus
}
export type Invoice = BillingInvoice

export const INVOICES: BillingInvoice[] = [
  { id: 'in_10', number: 'TRN-0010', date: 'Sep 1, 2026', period: 'Sep 2026', amount: 336, status: 'failed' },
  { id: 'in_09', number: 'TRN-0009', date: 'Aug 1, 2026', period: 'Aug 2026', amount: 336, status: 'paid' },
  { id: 'in_08', number: 'TRN-0008', date: 'Jul 1, 2026', period: 'Jul 2026', amount: 312, status: 'paid' },
  { id: 'in_07', number: 'TRN-0007', date: 'Jun 1, 2026', period: 'Jun 2026', amount: 312, status: 'paid' },
  { id: 'in_06', number: 'TRN-0006', date: 'May 14, 2026', period: 'Seat credit', amount: -24, status: 'refunded' },
  { id: 'in_05', number: 'TRN-0005', date: 'May 1, 2026', period: 'May 2026', amount: 288, status: 'paid' },
  { id: 'in_04', number: 'TRN-0004', date: 'Apr 1, 2026', period: 'Apr 2026', amount: 288, status: 'paid' },
]

export const STATUS_TONE: Record<BillingInvoiceStatus, 'success' | 'warning' | 'danger' | 'secondary'> = {
  paid: 'success',
  due: 'warning',
  failed: 'danger',
  refunded: 'secondary',
}

/** Who invoices are addressed and sent to. */
export interface BillingInfo {
  company: string
  email: string
  address: string
  taxId: string
}
export type Details = BillingInfo

export const DETAILS: BillingInfo = {
  company: 'Tern Analytics GmbH',
  email: 'finance@tern.io',
  address: 'Torstraße 109, 10119 Berlin, Germany',
  taxId: 'DE 318 204 551',
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

const pad = (n: number) => String(n).padStart(2, '0')

export const DEFAULT_COPY = {
  title: 'Billing',
  description: 'Your plan, how you pay, and every invoice so far.',
  breadcrumb: 'Settings',
  planBadge: (name: string) => `${name} plan`,
  errorTitle: 'Couldn’t load billing',
  retry: 'Retry',
  // The failed-payment alert
  failedTitle: (period: string) => `The ${period} payment failed`,
  failedDescription: (card: string, amount: string) => `${card} was declined for ${amount}. Update the card or retry the charge; the workspace stays active until Oct 15.`,
  retryPayment: 'Retry payment',
  charging: 'Charging…',
  paid: 'Paid',
  declined: 'Declined',
  paidToast: (number: string) => `${number} paid`,
  chargedTo: (amount: string, card: string) => `${amount} charged to ${card}`,
  // Plan card
  currentPlan: 'Current plan',
  monthly: 'Monthly',
  annual: 'Annual',
  changePlan: 'Change plan',
  perSeat: 'Per seat',
  perMonth: '/ month',
  seats: 'Seats',
  nextInvoice: 'Next invoice',
  nextInvoiceDate: 'Oct 1, 2026',
  renews: 'Renews',
  renewsDate: 'Oct 1, 2027',
  billedMonthly: 'Billed monthly',
  billedYearly: 'Billed yearly',
  // Change-plan dialog
  changePlanTitle: 'Change plan',
  changePlanDescription: (seats: number) => `Prices are per seat. You have ${seats} seats; changes are prorated to the day.`,
  billingCycle: 'Billing cycle',
  annualSaving: '−17%',
  planLabel: 'Plan',
  currentBadge: 'Current',
  perSeatMonth: 'per seat / mo',
  noChange: 'No change selected.',
  changeFrom: (total: string, cycle: BillingCycle) => `From Oct 1: ${total} ${cycle === 'annual' ? 'a year' : 'a month'}.`,
  cancel: 'Cancel',
  updating: 'Updating…',
  planUpdated: 'Plan updated',
  confirmChange: 'Confirm change',
  planChanged: (name: string, cycle: BillingCycle) => `You’re on ${name}, billed ${cycle === 'annual' ? 'yearly' : 'monthly'}`,
  // Invoices
  invoicesHeading: 'Invoices',
  invoicesLabel: 'Invoices',
  showInvoices: 'Show invoices',
  filterAll: 'All',
  filterPaid: 'Paid',
  filterOpen: 'Open',
  nothingOpen: 'Nothing open. Every invoice is settled.',
  emptyInvoices: 'No invoices yet. The first arrives at the end of this cycle.',
  loading: 'Loading invoices…',
  invoiceColumn: 'Invoice',
  dateColumn: 'Date',
  periodColumn: 'Period',
  statusColumn: 'Status',
  amountColumn: 'Amount',
  actionsColumn: 'Actions',
  status: { paid: 'Paid', due: 'Due', failed: 'Failed', refunded: 'Credit' } as Record<BillingInvoiceStatus, string>,
  retryCharge: 'Retry',
  retryFor: (number: string) => `Retry payment for ${number}`,
  downloadAs: (number: string) => `Download ${number} as PDF`,
  preparing: (number: string) => `Preparing ${number}`,
  downloaded: (number: string) => `Downloaded ${number}.pdf`,
  // Payment method
  paymentTitle: 'Payment method',
  paymentDescription: 'Charged on the 1st of each cycle.',
  update: 'Update',
  endingIn: 'ending in ',
  cardSummary: (brand: string, last4: string) => `${brand} •••• ${last4}`,
  expires: (month: number, year: number) => `Expires ${pad(month)}/${year}`,
  cardUpdated: 'Payment method updated',
  updateCardTitle: 'Update payment method',
  updateCardDescription: 'The new card is charged from the next invoice, and for any that failed.',
  nameOnCard: 'Name on card',
  cardNumber: 'Card number',
  cardNumberPlaceholder: '1234 1234 1234 1234',
  expiry: 'Expiry',
  expiryPlaceholder: 'MM/YY',
  cvc: 'CVC',
  cvcPlaceholder: '123',
  nameError: 'Enter the name on the card.',
  numberError: 'Enter the full card number.',
  expiryError: 'Use MM/YY, in the future.',
  cvcError: '3 or 4 digits.',
  processorNote: 'Card details go straight to the payment processor.',
  saving: 'Saving…',
  cardSaved: 'Card saved',
  saveCard: 'Save card',
  // Billing details
  detailsTitle: 'Billing details',
  detailsDescription: 'Printed on every invoice.',
  company: 'Company',
  invoiceEmail: 'Invoice email',
  address: 'Address',
  taxId: 'VAT ID',
  emailError: 'Enter an email like finance@company.com.',
  reset: 'Reset',
  saved: 'Saved',
  saveDetails: 'Save details',
  detailsSaved: 'Billing details saved',
  detailsSavedNote: 'Used from the next invoice.',
}

export type BillingCopy = typeof DEFAULT_COPY
