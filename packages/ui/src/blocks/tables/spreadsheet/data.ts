import { numberFormat } from '../../../lib/utils'
/* The spreadsheet table's types, its English, its demo stock and the parsing
 * that pasted and typed values go through. The demo is seeded, so every
 * render (server and browser) shows the same sheet. */

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

/** One row of the sheet (the demo: a stock line). */
export interface SpreadsheetTableRow {
  id: string
  /** What names the row (the demo: a stock-keeping unit, "CL-1042"). It isn't edited here. */
  ref: string
  name: string
  /** One of `categories`. */
  category: string
  /** Where it sits in the warehouse: "B-04-2". */
  location: string
  quantity: number
  /** At or under this, the row is low and its quantity turns amber. */
  threshold: number
  unitValue: number
}

/** The cells a person can change. */
export type SpreadsheetTableField = 'name' | 'category' | 'location' | 'quantity' | 'threshold' | 'unitValue'
export const FIELDS: readonly SpreadsheetTableField[] = ['name', 'category', 'location', 'quantity', 'threshold', 'unitValue']
export const isField = (id: string): id is SpreadsheetTableField => (FIELDS as readonly string[]).includes(id)

/** One cell an edit, a paste, an undo or a redo changed. */
export interface SpreadsheetTableEdit {
  /** The row as it is after the change. */
  row: SpreadsheetTableRow
  field: SpreadsheetTableField
  value: SpreadsheetTableRow[SpreadsheetTableField]
  previousValue: SpreadsheetTableRow[SpreadsheetTableField]
}

const plural = (n: number, one: string, other: string) => (new Intl.PluralRules('en').select(n) === 'one' ? one : other)

export const DEFAULT_COPY = {
  title: 'Inventory',
  description: (items: string, units: string, value: string) => `${items} lines · ${units} units · ${value} on the shelves`,
  noun: 'items',
  columns: { row: 'Row', ref: 'SKU', name: 'Item', category: 'Category', location: 'Bin', quantity: 'On hand', threshold: 'Reorder at', unitValue: 'Unit cost', value: 'Value' },
  formulaBar: 'Formula bar',
  nameBox: 'Cell',
  formulaLabel: (cell: string) => `Contents of ${cell}`,
  formulaPlaceholder: 'Pick a cell to see what’s in it',
  low: 'Low stock',
  total: 'Total',
  lowCount: (count: string, n: number) => `${count} ${plural(n, 'line', 'lines')} low`,
  undo: 'Undo',
  redo: 'Redo',
  undid: (what: string) => `Undone: ${what}`,
  redid: (what: string) => `Redone: ${what}`,
  changed: (field: string, ref: string, value: string) => `${field} of ${ref} to ${value}`,
  cells: (count: string, n: number) => `${count} ${plural(n, 'cell', 'cells')}`,
  pasted: (cells: string) => `Pasted ${cells}`,
  skipped: (cells: string) => `${cells} left as they were: the value doesn’t fit the column or the cell can’t be edited`,
  copied: (cell: string) => `Copied ${cell}`,
  wholeNumber: 'Enter a whole number, 0 or more.',
  amount: 'Enter an amount, 0 or more.',
  required: 'An item needs a name.',
  unknownCategory: (categories: string) => `Pick one of: ${categories}.`,
  failed: 'Couldn’t save that change, so it’s been put back.',
  dismiss: 'Dismiss',
  emptyTitle: 'No stock yet',
  emptyHint: 'Lines show up here as soon as the first delivery is booked in.',
}

export type SpreadsheetTableCopy = typeof DEFAULT_COPY

export const CATEGORIES = ['Apparel', 'Footwear', 'Camp', 'Climb', 'Accessories'] as const

const STOCK: ReadonlyArray<readonly [string, (typeof CATEGORIES)[number], number]> = [
  ['Merino base layer', 'Apparel', 64],
  ['Down jacket', 'Apparel', 148],
  ['Rain shell', 'Apparel', 119],
  ['Fleece midlayer', 'Apparel', 52],
  ['Hiking pants', 'Apparel', 46],
  ['Wool beanie', 'Apparel', 12.5],
  ['Sun hoodie', 'Apparel', 31],
  ['Trail runner', 'Footwear', 72],
  ['Approach shoe', 'Footwear', 84],
  ['Hiking boot', 'Footwear', 109],
  ['Camp slipper', 'Footwear', 24],
  ['Gaiters', 'Footwear', 19.9],
  ['Ultralight tent', 'Camp', 286],
  ['Sleeping pad', 'Camp', 74],
  ['Down quilt', 'Camp', 212],
  ['Titanium pot', 'Camp', 38],
  ['Canister stove', 'Camp', 41.5],
  ['Water filter', 'Camp', 27],
  ['Camp chair', 'Camp', 49],
  ['Dynamic rope 60 m', 'Climb', 164],
  ['Harness', 'Climb', 58],
  ['Locking carabiner', 'Climb', 7.4],
  ['Belay device', 'Climb', 21],
  ['Chalk bag', 'Climb', 9.8],
  ['Climbing shoe', 'Climb', 88],
  ['Quickdraw set', 'Climb', 96],
  ['Headlamp', 'Accessories', 29],
  ['Trekking poles', 'Accessories', 63],
  ['Dry bag 20 L', 'Accessories', 14.2],
  ['Insulated bottle', 'Accessories', 16.8],
  ['First-aid kit', 'Accessories', 22],
  ['Bear canister', 'Accessories', 54],
]

const CODE: Record<(typeof CATEGORIES)[number], string> = { Apparel: 'AP', Footwear: 'FW', Camp: 'CA', Climb: 'CL', Accessories: 'AC' }

export function makeRows(): SpreadsheetTableRow[] {
  let seed = 7
  const next = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
  return STOCK.map(([name, category, cost], i) => {
    const threshold = 5 * (2 + Math.floor(next() * 8))
    // Every seventh line runs low, so the sheet always has some amber in it.
    const quantity = i % 7 === 3 ? Math.floor(next() * threshold) : threshold + Math.floor(next() * 180)
    return {
      id: `sku_${i + 1}`,
      ref: `${CODE[category]}-${1040 + i * 3}`,
      name,
      category,
      location: `${'ABCD'[i % 4]}-${String(1 + (i % 9)).padStart(2, '0')}-${1 + (i % 3)}`,
      quantity,
      threshold,
      unitValue: cost,
    }
  })
}

/** Reads a number as people type it in `locale` ("1,234.50", "1.234,50", "$12"), or null. */
export function parseNumber(text: string, locale: string): number | null {
  const parts = numberFormat(locale).formatToParts(12345.6)
  const group = parts.find((part) => part.type === 'group')?.value ?? ','
  const decimal = parts.find((part) => part.type === 'decimal')?.value ?? '.'
  const plain = text
    .trim()
    .split(group)
    .join('')
    .replace(/\s/g, '')
    .split(decimal)
    .join('.')
    .replace(/[^\d.-]/g, '')
  if (plain === '' || plain === '-' || plain === '.') return null
  const n = Number(plain)
  return Number.isFinite(n) ? n : null
}

/** Checks a field's value: the reason it's refused, or null. */
export function checkField(field: SpreadsheetTableField, value: unknown, categories: readonly string[], copy: SpreadsheetTableCopy): string | null {
  switch (field) {
    case 'name':
    case 'location':
      return typeof value === 'string' && value.trim() !== '' ? null : copy.required
    case 'category':
      return typeof value === 'string' && categories.includes(value) ? null : copy.unknownCategory(categories.join(', '))
    case 'quantity':
    case 'threshold':
      return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? null : copy.wholeNumber
    case 'unitValue':
      return typeof value === 'number' && value >= 0 ? null : copy.amount
  }
}

/** Turns text (a paste, the formula bar) into a field's value, or the reason it doesn't fit. */
export function parseField(
  field: SpreadsheetTableField,
  text: string,
  categories: readonly string[],
  locale: string,
  copy: SpreadsheetTableCopy,
): { value: SpreadsheetTableRow[SpreadsheetTableField] } | { error: string } {
  let value: string | number | null
  if (field === 'quantity' || field === 'threshold' || field === 'unitValue') {
    value = parseNumber(text, locale)
    if (value !== null && field === 'unitValue') value = Math.round(value * 100) / 100
  } else if (field === 'category') {
    value = categories.find((category) => category.toLowerCase() === text.trim().toLowerCase()) ?? text.trim()
  } else {
    value = text.trim()
  }
  const error = checkField(field, value, categories, copy)
  return error ? { error } : { value: value as SpreadsheetTableRow[SpreadsheetTableField] }
}

/** A column's letter, as a spreadsheet names it: A…Z, then AA, AB… */
export function columnLetter(index: number): string {
  let letters = ''
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) letters = String.fromCharCode(65 + ((n - 1) % 26)) + letters
  return letters
}
