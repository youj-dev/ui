import { useCallback, useEffect, useMemo, useState } from 'react'
import type { RowData } from '@tanstack/react-table'
import type { DataTableRow } from '../../../components/ui/data-table'
import type { TableModel } from './model'
import type { DataTableSelection } from './props'

const EMPTY: never[] = []

/**
 * Which rows are selected. In client mode the selection is TanStack's; in
 * server mode "select all" means every row matching the query, minus the ones
 * unticked since (`allMatching`), since most of them were never loaded. With
 * 10k virtualized rows "the page" is every row: the selectable count follows
 * the rows, and the selected count walks the selection (usually small).
 */
export function useSelection<TData extends RowData>(model: TableModel<TData>, rows: DataTableRow<TData>[], totalRows: number) {
  const { table, tableNow, manual, paginated, selectionEnabled, rowSelection, setRowSelection, displayData } = model
  const [allMatching, setAllMatching] = useState<Record<string, true> | null>(null)

  const isSelected = useCallback((row: DataTableRow<TData>) => (allMatching ? !allMatching[row.id] : rowSelection[row.id] === true), [allMatching, rowSelection])
  const selectedCount = useMemo(
    () => (allMatching ? Math.max(0, totalRows - Object.keys(allMatching).length) : Object.keys(rowSelection).length),
    [allMatching, rowSelection, totalRows],
  )
  const selectablePageRows = useMemo(() => (selectionEnabled ? rows.filter((row) => row.getCanSelect()) : (EMPTY as DataTableRow<TData>[])), [rows, selectionEnabled])
  const pageRowsById = table.getRowModel().rowsById
  const pageSelected = useMemo(() => {
    if (!selectionEnabled) return 0
    if (allMatching) return selectablePageRows.filter((row) => !allMatching[row.id]).length
    let selected = 0
    for (const id in rowSelection) if (pageRowsById[id]) selected++
    return selected
  }, [selectionEnabled, allMatching, selectablePageRows, rowSelection, pageRowsById])
  const allPageSelected = selectablePageRows.length > 0 && pageSelected >= selectablePageRows.length

  const clearSelection = useCallback(() => {
    setAllMatching(null)
    setRowSelection({})
  }, [setRowSelection])

  const selectAll = useCallback(() => {
    if (manual) {
      setRowSelection({})
      setAllMatching({})
    } else tableNow.current.toggleAllRowsSelected(true)
  }, [manual, setRowSelection, tableNow])

  const togglePage = (checked: boolean) => {
    if (allMatching) {
      setAllMatching((except) => {
        const next = { ...except }
        for (const row of selectablePageRows) {
          if (checked) delete next[row.id]
          else next[row.id] = true
        }
        return next
      })
    } else if (paginated) table.toggleAllPageRowsSelected(checked)
    else table.toggleAllRowsSelected(checked)
  }

  const toggleRow = (rowId: string, checked: boolean, shift: boolean) => {
    if (allMatching) {
      setAllMatching((except) => {
        const next = { ...except }
        if (checked) delete next[rowId]
        else next[rowId] = true
        return next
      })
      return
    }
    table.getRowModel().rowsById[rowId]?.getToggleSelectedHandler()({ target: { checked }, shiftKey: shift })
  }

  // Selected ids whose rows left the data are dropped (client mode, where every
  // row is known): after the commit, so a controlled selection's owner hears it
  // outside its own render.
  useEffect(() => {
    if (manual) return
    const known = tableNow.current.getCoreRowModel().rowsById
    const stale = Object.keys(rowSelection).filter((id) => !known[id])
    if (stale.length === 0) return
    let live = true
    queueMicrotask(() => {
      if (!live) return
      setRowSelection((old) => {
        const next = { ...old }
        for (const id of stale) delete next[id]
        return next
      })
    })
    return () => {
      live = false
    }
    // Only the rows decide what is stale.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only the rows decide what is stale
  }, [displayData, manual, setRowSelection, tableNow])

  /** The selection, as the app's bulk actions receive it. */
  const snapshot = (exportCsv: () => void): DataTableSelection<TData> => {
    const inView = table.getPrePaginatedRowModel().rows
    return {
      count: selectedCount,
      rows: inView.filter(isSelected).map((row) => row.original),
      ids: allMatching ? rows.filter(isSelected).map((row) => row.id) : Object.keys(rowSelection),
      allMatching: allMatching !== null,
      excludedIds: allMatching ? Object.keys(allMatching) : [],
      clear: clearSelection,
      exportCsv,
    }
  }

  return { allMatching, isSelected, selectedCount, pageSelected, allPageSelected, clearSelection, selectAll, togglePage, toggleRow, snapshot }
}
