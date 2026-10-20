import { dateTimeFormat, numberFormat } from '../../../lib/utils'

/* How Kite writes money, names and days. */

export const usd = { style: 'currency', currency: 'USD' } as const
export const whole = { style: 'currency', currency: 'USD', maximumFractionDigits: 0 } as const
export const fmt = (locale: string) => numberFormat(locale, usd)
export const HIDDEN = '••••••'

export function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return ((words[0]?.[0] ?? '') + (words.length > 1 ? (words.at(-1)?.[0] ?? '') : '')).toUpperCase() || '?'
}

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
export function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function dayLabel(time: number, locale: string, now = Date.now()) {
  const start = (t: number) => new Date(t).setHours(0, 0, 0, 0)
  const days = Math.round((start(now) - start(time)) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return dateTimeFormat(locale, { weekday: 'long', month: 'short', day: 'numeric' }).format(time)
}
