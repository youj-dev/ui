import { useCallback, useEffect, useRef } from 'react'
import type { RowData } from '@tanstack/react-table'
import { useYouj } from '@youj/core'
import { useLiveRegion } from '../../../hooks/use-announcer'
import type { DataGridCopy } from './copy'
import { columnLabel, isUtilityColumn } from './model'
import { useLatest, useOnChange } from './state'
import type { GridModel } from './use-grid'

/**
 * What the grid says aloud, once per change: the sort, the selection count,
 * the grouping, the page, and after the search or filters change how many
 * rows match. Rows are named by `getRowLabel`, or by their first column's
 * value; rows call `rowLabel` while they render, so it follows the data.
 */
export function useGridAnnouncements<TData extends RowData>({
  model,
  selectedCount,
  loading,
  getRowLabel,
  copy,
  locale,
}: {
  model: GridModel<TData>
  selectedCount: number
  loading: boolean
  getRowLabel?: (row: TData) => string
  copy: DataGridCopy
  locale: string
}) {
  const { table, leafColumns, sorting, groupColumn, columnFilters, globalFilter, rows, paged, page, pageCount } = model
  const k = useYouj()
  const labelColumn = leafColumns.find((column) => !isUtilityColumn(column.id))
  const rowsById = table.getCoreRowModel().rowsById
  const labelColumnId = labelColumn?.id
  const getRowLabelRef = useLatest(getRowLabel)
  const rowLabel = useCallback(
    (rowId: string) => {
      const row = rowsById[rowId]
      if (!row) return copy.row
      if (getRowLabelRef.current) return getRowLabelRef.current(row.original)
      const value = labelColumnId ? row.getValue(labelColumnId) : undefined
      return value === undefined || value === null || value === '' ? copy.rowNumber(row.index + 1) : String(value)
    },
    [rowsById, labelColumnId, copy, getRowLabelRef],
  )
  const { politeRef, assertiveRef, announce } = useLiveRegion()
  const say = (message: string, delay = 0) => announce(message, { delay })

  const sortSentence = sorting.length
    ? copy.sortedBy(sorting.map((sort) => copy.sortedColumn(columnLabel(table.getColumn(sort.id) ?? { id: sort.id, columnDef: {} }), Boolean(sort.desc))))
    : copy.sortCleared
  useOnChange(sortSentence, () => say(sortSentence))
  const selectionSentence = selectedCount === 0 ? copy.selectionCleared : copy.selectedRows(selectedCount.toLocaleString(locale), selectedCount)
  useOnChange(selectionSentence, () => say(selectionSentence, k.ms('base')))
  const groupSentence = groupColumn ? copy.groupedBy(columnLabel(groupColumn)) : copy.groupingCleared
  useOnChange(groupSentence, () => say(groupSentence))
  const filterKey = `${JSON.stringify(columnFilters)}|${globalFilter}`
  const lastFilter = useRef(filterKey)
  const filtered = columnFilters.length > 0 || globalFilter !== ''
  const copyNow = useLatest(copy)
  useEffect(() => {
    if (filterKey === lastFilter.current || loading) return
    lastFilter.current = filterKey
    const count = rows.length.toLocaleString(locale)
    const words = copyNow.current
    say((filtered ? words.matchCount : words.totalCount)(count, rows.length, words.noun), k.ms('slow'))
    // Only a new query (once it has loaded) speaks.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only a new query (once it has loaded) speaks
  }, [filterKey, loading, rows.length])
  useOnChange(page, () => {
    if (paged) say(copy.pageOf(String(page + 1), String(pageCount)))
  })

  return { rowLabel, politeRef, assertiveRef, announce }
}
