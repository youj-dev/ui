import { dateTimeFormat, initials, numberFormat, relativeTimeFormat } from '../../../lib/utils'

/* Formatting for the grid's figures and dates, in the provider's locale. The
 * formatters come from the shared cache (lib/utils): a grid formats thousands
 * of cells, so each is built once per locale and option set. */

export { initials, numberFormat }
export const dateFormat = dateTimeFormat

/** A figure in parts: the digits carry the weight, and the symbol, the cents and a compact suffix are muted. */
export interface FigurePart {
  text: string
  muted: boolean
}

const MUTED_PARTS = new Set(['currency', 'decimal', 'fraction', 'compact', 'percentSign', 'unit', 'exponentSeparator'])

export function figureParts(value: number, locale: string, options: Intl.NumberFormatOptions): FigurePart[] {
  const parts: FigurePart[] = []
  for (const part of numberFormat(locale, options).formatToParts(value)) {
    const muted = MUTED_PARTS.has(part.type)
    const last = parts[parts.length - 1]
    // Neighbors of the same weight merge, so a figure is two or three spans, not ten.
    if (last && last.muted === muted) last.text += part.value
    else parts.push({ text: part.value, muted })
  }
  return parts
}

export function toTime(value: unknown): number | null {
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value !== '') {
    const time = new Date(value).getTime()
    return Number.isNaN(time) ? null : time
  }
  return null
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 86_400_000],
  ['month', 30 * 86_400_000],
  ['week', 7 * 86_400_000],
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
]

/** "3 days ago", "in 2 weeks", "yesterday": the largest unit that fits, rounded. Under a minute, `justNow`. */
export function relativeTime(time: number, now: number, locale: string, justNow: string): string {
  const diff = time - now
  const abs = Math.abs(diff)
  if (abs < 45_000) return justNow
  const format = relativeTimeFormat(locale, { numeric: 'auto' })
  for (const [unit, ms] of UNITS) {
    if (abs >= ms * 0.95 || unit === 'minute') return format.format(Math.round(diff / ms), unit)
  }
  return justNow
}

/** A stable chart color (1–5) for a name, so a logo keeps its tint across renders and pages. */
export function hueOf(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0
  return (Math.abs(hash) % 5) + 1
}
