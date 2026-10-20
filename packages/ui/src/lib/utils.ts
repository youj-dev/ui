import { cn } from '@youj/core/lib/youj/cn'

export { cn }

/* ── Shared helpers ───────────────────────────────────────────────────────
 * Small things many components need. They live here because this file ships
 * as youj-ui-core, which every registry item already depends on. */

/* Intl formatters cost 10-100µs to build (a DateTimeFormat the most), and a
 * component that builds one per render, per row or per frame pays it every
 * time. These build each once per locale and option set. Formatters are
 * immutable, so sharing them is safe. */
const intlCache = new Map<string, object>()
function cached<T extends object>(kind: string, locale: Intl.LocalesArgument, options: object | undefined, build: () => T): T {
  const key = `${kind}|${String(locale)}|${JSON.stringify(options)}`
  let format = intlCache.get(key) as T | undefined
  if (!format) intlCache.set(key, (format = build()))
  return format
}

/* Node's ICU and a browser's write some things differently, and server text that differs from the client's fails
 * hydration (React error 418, production only): Node pads a date range's dash and a time's AM/PM with thin and narrow
 * spaces, and keeps a currency's fraction digits in compact notation with `maximumFractionDigits` ("$1.0M" for "$1M").
 * These make both sides write one text, and the formatters below apply them: use those, not `new Intl.*`. */
export const hydrationSafeText = (text: string) => text.replace(/[\u2009\u202f]/g, ' ')
export const hydrationSafeNumberOptions = (options?: Intl.NumberFormatOptions) =>
  options?.notation === 'compact' && options.maximumFractionDigits !== undefined && options.minimumFractionDigits === undefined ? { ...options, minimumFractionDigits: 0 } : options
const safeParts = <T extends { value: string }>(parts: T[]) => parts.map((part) => ({ ...part, value: hydrationSafeText(part.value) }))

export function numberFormat(locale?: Intl.LocalesArgument, options?: Intl.NumberFormatOptions): Intl.NumberFormat {
  return cached('number', locale, options, () => new Intl.NumberFormat(locale, hydrationSafeNumberOptions(options)))
}

/** A DateTimeFormat whose every output, ranges and parts too, reads the same on the server and in a browser. */
export function dateTimeFormat(locale?: Intl.LocalesArgument, options?: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  return cached('date', locale, options, () => {
    const f = new Intl.DateTimeFormat(locale, options)
    type At = Date | number
    return {
      format: (at?: At) => hydrationSafeText(f.format(at)),
      formatToParts: (at?: At) => safeParts(f.formatToParts(at)),
      formatRange: (from: At, to: At) => hydrationSafeText(f.formatRange(from, to)),
      formatRangeToParts: (from: At, to: At) => safeParts(f.formatRangeToParts(from, to)),
      resolvedOptions: () => f.resolvedOptions(),
    } as Intl.DateTimeFormat
  })
}

export function relativeTimeFormat(locale?: Intl.LocalesArgument, options?: Intl.RelativeTimeFormatOptions): Intl.RelativeTimeFormat {
  return cached('relative', locale, options, () => new Intl.RelativeTimeFormat(locale, options))
}

export function listFormat(locale?: Intl.LocalesArgument, options?: Intl.ListFormatOptions): Intl.ListFormat {
  return cached('list', locale, options, () => new Intl.ListFormat(locale, options))
}

/** Up to two letters for a name: the first letters of its first and last words, upper-cased ("Mira Chen" → "MC", "Aster" → "A"). "?" when there is nothing to take. */
export function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const first = words[0] ? [...words[0]][0]! : ''
  const last = words.length > 1 ? [...words[words.length - 1]!][0]! : ''
  return (first + last).toUpperCase() || '?'
}

const BYTE_UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte']

/** Which of the byte units (an index: 0 byte, 1 kilobyte, 2 megabyte…) reads best for these bytes: the largest whose figure is at least one. */
export function byteUnit(bytes: number, base: 1000 | 1024 = 1024) {
  return Math.min(BYTE_UNITS.length - 1, Math.max(0, Math.floor(Math.log(Math.max(1, bytes)) / Math.log(base) + 1e-9)))
}

/**
 * Bytes (or bytes a second) in parts, in the locale: "48.2 MB". `base` is 1024
 * for file sizes, as a limit like `5 * 1024 * 1024` is written, and 1000 for
 * network transfers, whose rates are decimal. `unit` pins the unit (see
 * `byteUnit`), so moved bytes can read in their total's unit.
 */
export function byteParts(
  bytes: number,
  locale?: string,
  { base = 1024, perSecond = false, unit = byteUnit(bytes, base) }: { base?: 1000 | 1024; perSecond?: boolean; unit?: number } = {},
): Intl.NumberFormatPart[] {
  const value = bytes / base ** unit
  const name = `${BYTE_UNITS[unit]}${perSecond ? '-per-second' : ''}`
  // Bare bytes read in full ("70 bytes"): the short form is "70 byte", not "70 B".
  return numberFormat(locale, {
    style: 'unit',
    unit: name,
    unitDisplay: unit === 0 && !perSecond ? 'long' : 'short',
    maximumFractionDigits: unit > 0 && value < 100 ? 1 : 0,
  }).formatToParts(value)
}

/** Bytes as text in the locale: "6.8 MB". One formatter for every component, so a file's size reads the same wherever it appears. */
export function formatBytes(bytes: number, locale?: string, base: 1000 | 1024 = 1024) {
  return byteParts(bytes, locale, { base })
    .map((part) => part.value)
    .join('')
}

/** A color for a tone: `neutral` as given, anything else (the chart tones `chart-1`…, the status and accent colors) from its role. */
export function toneColor(tone: string, neutral = 'var(--color-fg-subtle)') {
  return tone === 'neutral' ? neutral : `var(--color-${tone})`
}

/** A chart series' color: its own `tone`, else its color in a shared ChartConfig (by id), else the chart colors in order, as Chart's series take them. */
export function seriesColor(tone: string | undefined, config: Readonly<Record<string, { color?: string }>> | undefined, id: string, index: number, neutral?: string) {
  return tone ? toneColor(tone, neutral) : (config?.[id]?.color ?? `var(--color-chart-${(index % 5) + 1})`)
}

/** CSS custom properties as an object Motion's `initial` and `animate` (and `style`) accept, so a variable can be animated without a cast: `animate={cssVars({ '--share-bar-value': 0.4 })}`. */
export function cssVars<T extends Record<`--${string}`, string | number>>(vars: T) {
  return vars as { [K in keyof T]: T[K] } & { [key: `--${string}`]: string | number }
}

/** `value` held between `min` and `max`. */
export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
