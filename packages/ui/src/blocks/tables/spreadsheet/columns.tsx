'use client'

import type { ReactNode } from 'react'
import { createDataTableColumnHelper, type DataTableColumnDef, type DataTableInstance } from '../../../components/ui/data-table'
import { checkField, type SpreadsheetTableCopy, type SpreadsheetTableField, type SpreadsheetTableRow } from './data'
import { numberFormat } from '../../../lib/utils'

const col = createDataTableColumnHelper<SpreadsheetTableRow>()

/** Each column's letter, as the sheet names it in the formula bar: E7 is row 7's On hand. */
export const LETTERS: Record<string, string> = { ref: 'A', name: 'B', category: 'C', location: 'D', quantity: 'E', threshold: 'F', unitValue: 'G', value: 'H' }

export const isLow = (item: SpreadsheetTableRow) => item.quantity <= item.threshold

/** The row's number in the sheet: its place among the rows in view. */
export const rowNumber = (table: DataTableInstance<SpreadsheetTableRow>, id: string) => table.getRowModel().rows.findIndex((row) => row.id === id) + 1

function Head({ letter, children }: { letter: string; children: ReactNode }) {
  return (
    <span className="inline-flex min-w-0 items-baseline gap-1.5">
      <span aria-hidden className="font-mono text-ui-xs text-fg-subtle">
        {letter}
      </span>
      <span className="truncate">{children}</span>
    </span>
  )
}

/** The sheet's columns: row numbers and the SKU stay put; every other cell edits in place, and Value is worked out from On hand × Unit cost. */
export function sheetColumns({
  copy,
  locale,
  currency,
  categories,
}: {
  copy: SpreadsheetTableCopy
  locale: string
  currency: string
  categories: readonly string[]
}): DataTableColumnDef<SpreadsheetTableRow>[] {
  const h = copy.columns
  const count = numberFormat(locale)
  const money = numberFormat(locale, { style: 'currency', currency })
  const inView = (table: DataTableInstance<SpreadsheetTableRow>) => table.getFilteredRowModel().rows.map((row) => row.original)
  const validate = (field: SpreadsheetTableField) => (value: unknown) => checkField(field, value, categories, copy)
  const options = categories.map((category) => ({ value: category, label: category }))

  return [
    col.display({
      id: 'row',
      size: 48,
      minSize: 48,
      maxSize: 48,
      enableSorting: false,
      enableResizing: false,
      enableHiding: false,
      enableColumnFilter: false,
      enableGlobalFilter: false,
      header: () => null,
      cell: ({ row, table }) => rowNumber(table, row.id),
      meta: { label: h.row, align: 'center', exportable: false, skeleton: 'short', cellClassName: 'bg-(--dt-head-bg) font-mono text-ui-xs text-fg-subtle' },
    }),
    ...col.columns([
      col.accessor('ref', {
        header: () => <Head letter={LETTERS.ref!}>{h.ref}</Head>,
        size: 112,
        cell: (info) => <span className="font-mono text-ui-sm">{info.getValue()}</span>,
        footer: () => copy.total,
        meta: { label: h.ref, skeleton: 'short' },
      }),
      col.accessor('name', {
        header: () => <Head letter={LETTERS.name!}>{h.name}</Head>,
        size: 220,
        footer: ({ table }) => {
          const low = inView(table).filter(isLow).length
          return low > 0 ? <span className="font-normal text-warning-text">{copy.lowCount(count.format(low), low)}</span> : null
        },
        meta: { label: h.name, grow: true, editor: { type: 'text', maxLength: 80 }, validate: validate('name') },
      }),
      col.accessor('category', {
        header: () => <Head letter={LETTERS.category!}>{h.category}</Head>,
        size: 128,
        meta: { label: h.category, editor: { type: 'select', options }, filter: { type: 'select', options }, skeleton: 'short' },
      }),
      col.accessor('location', {
        header: () => <Head letter={LETTERS.location!}>{h.location}</Head>,
        size: 100,
        cell: (info) => <span className="font-mono text-ui-sm">{info.getValue()}</span>,
        meta: { label: h.location, editor: { type: 'text', maxLength: 12 }, validate: validate('location'), skeleton: 'short' },
      }),
      col.accessor('quantity', {
        header: () => <Head letter={LETTERS.quantity!}>{h.quantity}</Head>,
        size: 124,
        cell: ({ row, getValue }) => {
          const low = isLow(row.original)
          return (
            <span className={low ? 'inline-flex items-center gap-1.5 text-warning-text' : undefined}>
              {low && <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-warning" />}
              {count.format(getValue())}
              {low && <span className="sr-only">, {copy.low}</span>}
            </span>
          )
        },
        footer: ({ table }) => count.format(inView(table).reduce((sum, item) => sum + item.quantity, 0)),
        meta: { label: h.quantity, numeric: true, editor: { type: 'number', min: 0, step: 1 }, validate: validate('quantity'), skeleton: 'number' },
      }),
      col.accessor('threshold', {
        header: () => <Head letter={LETTERS.threshold!}>{h.threshold}</Head>,
        size: 148,
        cell: (info) => count.format(info.getValue()),
        meta: { label: h.threshold, numeric: true, editor: { type: 'number', min: 0, step: 1 }, validate: validate('threshold'), skeleton: 'number' },
      }),
      col.accessor('unitValue', {
        header: () => <Head letter={LETTERS.unitValue!}>{h.unitValue}</Head>,
        size: 140,
        cell: (info) => money.format(info.getValue()),
        meta: { label: h.unitValue, numeric: true, editor: { type: 'number', min: 0, step: 0.01 }, validate: validate('unitValue'), skeleton: 'number' },
      }),
      col.accessor((item) => item.quantity * item.unitValue, {
        id: 'value',
        header: () => <Head letter={LETTERS.value!}>{h.value}</Head>,
        size: 136,
        cell: (info) => <span className="font-medium">{money.format(info.getValue())}</span>,
        footer: ({ table }) => money.format(inView(table).reduce((sum, item) => sum + item.quantity * item.unitValue, 0)),
        meta: { label: h.value, numeric: true, skeleton: 'number' },
      }),
    ]),
  ]
}
