import type { Driver, Figure, Week } from './data'

/* The Ledger's house style: how it sets money, changes and weeks, and the
 * inks its drivers wear. */

/** Small caps: the kickers, figure labels and scales. */
export const KICKER = 'text-ui-xs font-medium tracking-[0.14em] text-fg-muted uppercase'

export const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const usdShort = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 })
export const whole = new Intl.NumberFormat('en-US')

/** "$150k": a scale label, in the lowercase the page's figures use. */
export const short = (n: number) => usdShort.format(n).replace(/K$/, 'k')

export const change = ({ value, previous }: Figure) => (previous ? (value - previous) / previous : 0)

/** "+$21,380", "−$6,190": with a true minus, not a hyphen. */
export const signed = (n: number, format: (n: number) => string = usd.format) => `${n < 0 ? '−' : '+'}${format(Math.abs(n))}`

/** A driver's color: gains in the success ink, losses in the danger ink, the remainder in a quiet one. */
export const driverTone = (d: Pick<Driver, 'amount' | 'kind'>) => (d.kind === 'Other' ? 'bg-fg-subtle' : d.amount >= 0 ? 'bg-success' : 'bg-danger')
export const driverInk = (d: Pick<Driver, 'amount' | 'kind'>) => (d.kind === 'Other' ? 'text-fg-muted' : d.amount >= 0 ? 'text-success-text' : 'text-danger-text')

const DAY = 86_400_000
const monthDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
const dayOnly = new Intl.DateTimeFormat('en-US', { day: 'numeric' })

/** "Sep 21 – 27", or "Sep 28 – Oct 4" across a month. */
export function span(week: Week) {
  const end = week.start + 6 * DAY
  const sameMonth = new Date(week.start).getMonth() === new Date(end).getMonth()
  return `${monthDay.format(week.start)} – ${sameMonth ? dayOnly.format(end) : monthDay.format(end)}`
}
