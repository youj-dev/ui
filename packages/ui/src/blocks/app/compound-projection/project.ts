export interface CompoundProjectionInput {
  /** Added at the end of every month. */
  monthly: number
  /** Whole years to project. */
  years: number
  /** The yearly rate as a fraction (0.07 is 7%), compounded monthly. */
  rate: number
  /** What there is today. Default 0. */
  initial?: number
}

export interface CompoundProjectionYear {
  /** 1 for the end of the first year. */
  year: number
  /** The total at the end of the year. */
  total: number
  /** What has been added by then, the starting amount included. */
  added: number
  /** The total less what was added. */
  gain: number
}

const clean = (n: number) => (Number.isFinite(n) ? Math.max(0, n) : 0)

/** The total at the end of each year of adding `monthly` a month at `rate` a year, compounded monthly. */
export function projectCompound({ monthly, years, rate, initial = 0 }: CompoundProjectionInput): CompoundProjectionYear[] {
  const deposit = clean(monthly)
  const start = clean(initial)
  const perMonth = clean(rate) / 12
  let total = start
  const rows: CompoundProjectionYear[] = []
  for (let year = 1; year <= Math.floor(clean(years)); year++) {
    for (let month = 0; month < 12; month++) total = total * (1 + perMonth) + deposit
    const added = start + deposit * 12 * year
    rows.push({ year, total, added, gain: total - added })
  }
  return rows
}

/** At most `max` of the years for a bar chart, evenly spaced and always ending on the last year. */
export function groupYears<T extends { year: number }>(rows: readonly T[], max = 10): T[] {
  if (rows.length <= max) return [...rows]
  const step = Math.ceil(rows.length / max)
  const last = rows[rows.length - 1]!
  return [...rows.filter((r) => r.year % step === 0 && r.year !== last.year), last]
}
