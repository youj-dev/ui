import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import type { RowData } from '@tanstack/react-table'
import { useYouj } from '@youj/core'
import { DATA_TABLE_SELECT_COLUMN_ID, dataTableColumnLabel, type DataTableColumn } from '../../../components/ui/data-table'
import { useLiveRegion } from '../../../hooks/use-announcer'
import type { DataTableCopy } from './copy'
import type { TableModel } from './model'

/**
 * What the table says aloud, once per change: the sort, the selection count,
 * the page, a load, and after the filters change how many rows match. In
 * server mode that count belongs to the rows the new query brings, so it waits
 * for them. Rows are named by `getRowLabel`, or by their first column's value.
 */
export function useAnnouncements<TData extends RowData>({
  model,
  leafColumns,
  rowsIn,
  totalRows,
  selectedCount,
  loading,
  getRowLabel,
  copy,
  locale,
}: {
  model: TableModel<TData>
  leafColumns: DataTableColumn<TData>[]
  rowsIn: ReadonlyArray<TData>
  totalRows: number
  selectedCount: number
  loading: boolean
  getRowLabel?: (row: TData) => string
  copy: DataTableCopy
  locale: string
}) {
  const { table, sorting, paginated, pagination, columnFilters, globalFilter, manual } = model
  const k = useYouj()
  const labelColumn = leafColumns.find((column) => column.id !== DATA_TABLE_SELECT_COLUMN_ID)
  const labelColumnId = labelColumn?.id
  const { row: rowWord, rowNumber, selectRow } = copy
  const getRowLabelRef = useRef(getRowLabel)
  useLayoutEffect(() => {
    getRowLabelRef.current = getRowLabel
  })
  // Rows call it while they render; the table instance is stable and reads its latest rows.
  const rowLabel = useCallback(
    (rowId: string) => {
      const row = table.getRowModel().rowsById[rowId] ?? table.getCoreRowModel().rowsById[rowId]
      if (!row) return rowWord
      if (getRowLabelRef.current) return getRowLabelRef.current(row.original)
      const value = labelColumnId ? row.getValue(labelColumnId) : undefined
      return value === undefined || value === null || value === '' ? rowNumber(row.index + 1) : String(value)
    },
    [table, labelColumnId, rowWord, rowNumber],
  )
  const selectLabel = useCallback((rowId: string) => selectRow(rowLabel(rowId)), [selectRow, rowLabel])
  const { politeRef, assertiveRef, announce } = useLiveRegion()

  const first = useRef(true)
  useEffect(() => {
    first.current = false
  }, [])

  const sortSentence = sorting.length
    ? copy.sortedBy(
        sorting.map((sort) => {
          const column = table.getColumn(sort.id)
          return copy.sortedColumn(column ? dataTableColumnLabel(column) : sort.id, Boolean(sort.desc))
        }),
      )
    : copy.sortCleared
  useEffect(() => {
    if (!first.current) announce(sortSentence)
  }, [sortSentence, announce])

  const selectionSentence = selectedCount === 0 ? copy.selectionCleared : copy.selectedRows(selectedCount.toLocaleString(locale), selectedCount)
  useEffect(() => {
    if (!first.current) announce(selectionSentence, { delay: k.ms('base') })
  }, [selectionSentence, announce, k])

  const pageCount = table.getPageCount()
  const pageSentence = paginated ? copy.pageOf(String(pagination.pageIndex + 1), String(Math.max(1, pageCount))) : ''
  useEffect(() => {
    if (!first.current && pageSentence) announce(pageSentence)
  }, [pageSentence, announce])

  // The copy is often a new object each render (an inline `copy` prop): the effects read the latest and watch only what they say.
  const copyNow = useRef(copy)
  useLayoutEffect(() => {
    copyNow.current = copy
  })
  useEffect(() => {
    if (!first.current && loading) announce(copyNow.current.loadingNamed(copyNow.current.noun), { delay: k.ms('slow') })
  }, [loading, announce, k])

  const filterKey = `${JSON.stringify(columnFilters)}|${globalFilter}`
  const announcedFilter = useRef(filterKey)
  const settledData = useRef(rowsIn)
  useEffect(() => {
    if (filterKey === announcedFilter.current) {
      settledData.current = rowsIn
      return
    }
    if (loading || (manual && rowsIn === settledData.current)) return
    announcedFilter.current = filterKey
    settledData.current = rowsIn
    const count = totalRows.toLocaleString(locale)
    const words = copyNow.current
    announce((filterKey === '[]|' ? words.totalCount : words.matchCount)(count, totalRows, words.noun), { delay: k.ms('slow') })
  }, [filterKey, loading, manual, rowsIn, totalRows, announce, k, locale])

  return { rowLabel, selectLabel, politeRef, assertiveRef, announce }
}
