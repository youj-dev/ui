import type { RowData } from '@tanstack/react-table'
import { columnLabel, type DataTableColumn, type DataTableInstance, type DataTableRow } from './data-table-model'

/* CSV the way spreadsheets read it: RFC 4180 quoting, CRLF line ends (Excel
 * on Windows reads a bare LF as one long row), a UTF-8 byte-order mark so
 * accents survive a double-click open, and a guard against formula
 * injection: a text cell starting with = + - @ (or a tab/CR) is prefixed
 * with an apostrophe so a spreadsheet shows it instead of running it. */

const FORMULA_LEAD = /^[=+\-@\t\r]/

export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  let text: string
  if (value instanceof Date) text = Number.isNaN(value.getTime()) ? '' : value.toISOString()
  else if (typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean') text = String(value)
  else if (typeof value === 'object') text = JSON.stringify(value)
  else {
    text = String(value)
    if (FORMULA_LEAD.test(text)) text = `'${text}`
  }
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function toCsv(header: readonly string[], rows: ReadonlyArray<readonly unknown[]>): string {
  return [header, ...rows].map((cells) => cells.map(csvCell).join(',')).join('\r\n')
}

/** The columns an export includes: visible, holding data, not opted out. In the order on screen. */
export function exportColumns<TData extends RowData>(table: DataTableInstance<TData>): DataTableColumn<TData>[] {
  const ordered = [...table.getStartVisibleLeafColumns(), ...table.getCenterVisibleLeafColumns(), ...table.getEndVisibleLeafColumns()]
  return ordered.filter((column) => column.columnDef.meta?.exportable !== false && column.accessorFn !== undefined)
}

/** Builds the CSV for the given rows (the selection, or every row in view order). */
export function dataTableToCsv<TData extends RowData>(table: DataTableInstance<TData>, rows: ReadonlyArray<DataTableRow<TData>>): string {
  const columns = exportColumns(table)
  return toCsv(
    columns.map((column) => columnLabel(column)),
    rows.map((row) =>
      columns.map((column) => {
        const value = row.getValue(column.id)
        const custom = column.columnDef.meta?.exportValue
        return custom ? custom(value, row.original) : value
      }),
    ),
  )
}

/** Hands the CSV to the browser as a download. */
export function downloadCsv(csv: string, filename: string) {
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  anchor.style.display = 'none'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  // Revoked on the next task: some browsers start the download asynchronously.
  setTimeout(() => URL.revokeObjectURL(url))
}
