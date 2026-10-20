/* Fixtures, types and the query language of the order search: a quarter of
 * orders by fulfillment state and basket value, and the tokens that mirror
 * the filters as text. Any records filter the same way: a range with a
 * histogram, and a checklist of groups whose records fall along the range. */

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

/** Counts are whole records, even mid-count (Counter format). */
export const WHOLE: Intl.NumberFormatOptions = { maximumFractionDigits: 0 }

/** The range filter: a number the histogram spreads the records along, such as a basket value. */
export interface ChipFiltersRange {
  /** What the query calls it: `total` in `total:25..180`. Letters only. */
  id: string
  min: number
  max: number
  step: number
  /** How many bins the histogram has; each group's `bins` has this many. */
  bins: number
  /** Where the axis is labeled. */
  ticks: number[]
}

/** The checklist filter: the groups the records fall into, such as a fulfillment state. */
export interface ChipFiltersChoice {
  /** What the query calls it: `state` in `state:in(paid,shipped)`. Letters only. */
  id: string
}

export interface ChipFiltersFields {
  range: ChipFiltersRange
  choice: ChipFiltersChoice
}

/** The basket-value axis: 0 to 320 in 40 bins of 8, set in whole units. */
export const FIELDS: ChipFiltersFields = {
  range: { id: 'total', min: 0, max: 320, step: 1, bins: 40, ticks: [0, 80, 160, 240, 320] },
  choice: { id: 'state' },
}

export interface ChipFiltersOption {
  id: string
  /** As the list shows it. */
  label: string
  /** As the query writes it: `state:in(paid,shipped)`. */
  token: string
  /** Records in the period per bin of the range, evenly spaced over it. */
  bins: number[]
}

export interface ChipFiltersValue {
  /** The range, [from, to]. */
  range: [number, number]
  /** Option ids. */
  selected: string[]
}

/** Records per bin of a mix of log-normal values: each part a peak at `mode`, its `share` of `records`. */
export function histogram(parts: [mode: number, sigma: number, share: number][], records: number, range: ChipFiltersRange = FIELDS.range) {
  const width = (range.max - range.min) / range.bins
  return Array.from({ length: range.bins }, (_, i) => {
    const x = range.min + (i + 0.5) * width
    const density = parts.reduce((sum, [mode, sigma, share]) => {
      const mu = Math.log(mode) + sigma * sigma
      return sum + (share * Math.exp(-((Math.log(x) - mu) ** 2) / (2 * sigma * sigma))) / (x * sigma * Math.sqrt(2 * Math.PI))
    }, 0)
    return Math.round(density * records * width)
  })
}

/* Two humps: single items around 25, bundles around 100. Returns lean to the dearer baskets. */
export const OPTIONS: ChipFiltersOption[] = [
  { id: 'paid', label: 'paid', token: 'paid', bins: histogram([[26, 0.5, 0.34], [104, 0.3, 0.66]], 1_420) },
  { id: 'packed', label: 'packed', token: 'packed', bins: histogram([[30, 0.48, 0.3], [112, 0.3, 0.7]], 1_730) },
  { id: 'shipped', label: 'shipped', token: 'shipped', bins: histogram([[24, 0.5, 0.32], [98, 0.32, 0.68]], 5_960) },
  { id: 'returned', label: 'returned', token: 'returned', bins: histogram([[168, 0.3, 1]], 760) },
]

export const DEFAULT_VALUE: ChipFiltersValue = { range: [25, 180], selected: ['paid', 'shipped'] }

/** Records whose value falls in [from, to], a bin counted by the share of it inside. */
export function countIn(bins: number[], [from, to]: [number, number], range: ChipFiltersRange = FIELDS.range) {
  const width = (range.max - range.min) / bins.length
  return bins.reduce((sum, count, i) => {
    const start = range.min + i * width
    const inside = Math.max(0, Math.min(to, start + width) - Math.max(from, start))
    return sum + (count * inside) / width
  }, 0)
}

/** A number as the query writes it: trimmed. */
const numberToken = (n: number) => `${Number(n.toFixed(2))}`

/** The filters as query tokens; a filter that lets everything through has none. */
export function toTokens(value: ChipFiltersValue, options: ChipFiltersOption[], fields: ChipFiltersFields = FIELDS) {
  const tokens: string[] = []
  const [from, to] = value.range
  if (from > fields.range.min || to < fields.range.max) tokens.push(`${fields.range.id}:${numberToken(from)}..${numberToken(to)}`)
  if (value.selected.length < options.length) {
    const picked = options.filter((o) => value.selected.includes(o.id)).map((o) => o.token)
    tokens.push(`${fields.choice.id}:in(${picked.join(',')})`)
  }
  return tokens
}

const rangeToken = (fields: ChipFiltersFields) => new RegExp(`^${fields.range.id}:[^\\d.]?(\\d+(?:\\.\\d+)?)\\.\\.[^\\d.]?(\\d+(?:\\.\\d+)?)$`, 'i')
const choiceToken = (fields: ChipFiltersFields) => new RegExp(`^${fields.choice.id}:(?:in\\((.*)\\)|([\\w-]+))$`, 'i')

const clamp = (n: number, { min, max }: ChipFiltersRange) => Math.round(Math.min(max, Math.max(min, n)))

/** The filters the tokens say; a filter without a token lets everything through. Tokens are validated first. */
export function fromTokens(tokens: string[], options: ChipFiltersOption[], fields: ChipFiltersFields = FIELDS): ChipFiltersValue {
  const value: ChipFiltersValue = { range: [fields.range.min, fields.range.max], selected: options.map((o) => o.id) }
  for (const token of tokens) {
    const compact = token.replace(/\s+/g, '')
    const range = rangeToken(fields).exec(compact)
    if (range) {
      const [a, b] = [clamp(Number(range[1]), fields.range), clamp(Number(range[2]), fields.range)]
      value.range = a <= b ? [a, b] : [b, a]
    }
    const choice = choiceToken(fields).exec(compact)
    if (choice) {
      const names = (choice[1] ?? choice[2] ?? '').split(',').filter(Boolean)
      value.selected = options.filter((o) => names.some((n) => n.toLowerCase() === o.token.toLowerCase())).map((o) => o.id)
    }
  }
  return value
}

export const DEFAULT_COPY = {
  currency: 'EUR',
  title: 'Orders',
  scope: 'all stores · Q3',
  more: 'More search actions',
  copyQuery: 'Copy search',
  copied: 'Search copied',
  search: 'Search orders',
  ofTotal: (total: string) => `of ${total} orders`,
  matchedAnnouncement: (count: string) => `${count} orders match`,
  rangeLabel: 'Basket value',
  choiceLabel: 'Fulfillment',
  allOptions: 'All states',
  countColumn: 'Orders',
  selectedOf: (selected: number, total: number) => `${selected} of ${total} states`,
  reset: 'Clear filters',
  saveView: 'Save search',
  saving: 'Saving…',
  saved: 'Saved',
  invalidToken: 'Write a filter as field:value, e.g. state:shipped.',
  invalidRange: 'Write a basket value as total:25..180.',
  unknownOption: (known: string) => `State takes ${known}.`,
  unknownField: (field: string, known: string) => `There’s no ${field} filter here. Use ${known}.`,
}

export type ChipFiltersCopy = typeof DEFAULT_COPY & {
  /** The locale counts and amounts are written in (BCP 47). Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}

/** Checks a token the user typed; returns the reason it can't be used, or nothing. */
export function checkToken(token: string, options: ChipFiltersOption[], copy: ChipFiltersCopy, fields: ChipFiltersFields = FIELDS) {
  const field = /^([a-z]+):\S/i.exec(token)?.[1]?.toLowerCase()
  if (!field) return copy.invalidToken
  const compact = token.replace(/\s+/g, '')
  if (field === fields.range.id) return rangeToken(fields).test(compact) ? undefined : copy.invalidRange
  if (field === fields.choice.id) {
    const match = choiceToken(fields).exec(compact)
    const names = (match?.[1] ?? match?.[2] ?? '').split(',').filter(Boolean)
    const known = options.map((o) => o.token.toLowerCase())
    return match && names.every((n) => known.includes(n.toLowerCase())) ? undefined : copy.unknownOption(options.map((o) => o.token).join(', '))
  }
  return copy.unknownField(field, `${fields.range.id} or ${fields.choice.id}`)
}
