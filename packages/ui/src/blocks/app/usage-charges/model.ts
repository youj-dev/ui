import type { UsageChargesRecord, UsageChargesSku } from './data'

export interface SkuRow {
  sku: UsageChargesSku
  used: number
  overage: number
  /** Overage times the SKU's rate, to the cent. */
  charge: number
}

export interface DayRow {
  date: string
  /** Charge by SKU id. */
  charges: Record<string, number>
  total: number
}

/** The days a range covers, as `YYYY-MM-DD`; either end may be open. */
export interface IsoRange {
  from?: string
  to?: string
}

const cents = (n: number) => Math.round(n * 100) / 100

/** Local calendar day of a Date, as `YYYY-MM-DD`. */
export function toIso(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** A `YYYY-MM-DD` day as a local Date at midnight. */
export function fromIso(day: string) {
  const [y = 1970, m = 1, d = 1] = day.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** The records inside the range and project (`undefined` or 'all' keeps every project). */
export function filterRecords(records: readonly UsageChargesRecord[], range: IsoRange, project?: string) {
  return records.filter(
    (r) => (!range.from || r.date >= range.from) && (!range.to || r.date <= range.to) && (!project || project === 'all' || r.project === project),
  )
}

/** Usage, billed overage and charge for every SKU, in the SKUs' order. */
export function skuRows(records: readonly UsageChargesRecord[], skus: readonly UsageChargesSku[]): SkuRow[] {
  return skus.map((sku) => {
    let used = 0
    let overage = 0
    for (const r of records) {
      if (r.sku !== sku.id) continue
      used += r.quantity
      overage += r.overage ?? 0
    }
    return { sku, used, overage, charge: cents(overage * sku.rate) }
  })
}

/** Charges by day (oldest first) and SKU, for the days the records cover. */
export function dayRows(records: readonly UsageChargesRecord[], skus: readonly UsageChargesSku[]): DayRow[] {
  const rate = new Map(skus.map((s) => [s.id, s.rate]))
  const days = new Map<string, Record<string, number>>()
  for (const r of records) {
    const charges = days.get(r.date) ?? {}
    charges[r.sku] = (charges[r.sku] ?? 0) + (r.overage ?? 0) * (rate.get(r.sku) ?? 0)
    days.set(r.date, charges)
  }
  return [...days.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, charges]) => {
      const rounded = Object.fromEntries(Object.entries(charges).map(([id, value]) => [id, cents(value)]))
      return { date, charges: rounded, total: cents(Object.values(rounded).reduce((a, b) => a + b, 0)) }
    })
}

export const totalCharge = (rows: readonly SkuRow[]) => cents(rows.reduce((sum, row) => sum + row.charge, 0))
