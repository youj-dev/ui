import { numberFormat } from '../../../lib/utils'
export interface SplitRow {
  id: string
  /** The id of a category in the list. */
  category: string
  /** Its share of the amount, in minor units (cents, tenths of an hour). */
  minor: number
}

/** The digits an amount writes after the point in `format`: 2 for dollars, 0 for yen. */
export function fractionDigits(locale: string, format: Intl.NumberFormatOptions) {
  return numberFormat(locale, format).resolvedOptions().maximumFractionDigits ?? 2
}

/** `total` cut into `count` equal shares of whole minor units; the leftover units go to the last share. */
export function equalShares(total: number, count: number) {
  if (count <= 0) return []
  const each = Math.floor(total / count)
  const shares = Array<number>(count).fill(each)
  shares[count - 1] = each + total - each * count
  return shares
}

/** Reads a number the way `locale` writes it ("1.234,5" in German); empty text is 0, nonsense is null. */
export function parseDecimal(text: string, locale: string) {
  const parts = numberFormat(locale).formatToParts(-1234.5)
  const group = parts.find((p) => p.type === 'group')?.value ?? ','
  const decimal = parts.find((p) => p.type === 'decimal')?.value ?? '.'
  let clean = text.replace(/[\s  ]/g, '')
  if (clean === '') return 0
  if (group !== decimal) clean = clean.split(group).join('')
  clean = clean.split(decimal).join('.')
  if (!/^\d*\.?\d*$/.test(clean) || clean === '.') return null
  return Number.parseFloat(clean)
}

export const sumOf = (rows: SplitRow[]) => rows.reduce((sum, row) => sum + row.minor, 0)
