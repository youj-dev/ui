import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { RowData, RowSelectionState } from '@tanstack/react-table'
import type { DataGridRow } from './model'
import type { DataGridSelection } from './props'
import type { GridModel } from './use-grid'

const EMPTY: never[] = []

/**
 * Which rows are selected: the page's checkbox state, a range with Shift
 * (from the last row toggled, across groups and pages in display order),
 * every row, and the selection as the app's bulk actions receive it.
 */
export function useGridSelection<TData extends RowData>(model: GridModel<TData>, rowsIn: ReadonlyArray<TData>) {
  const { tableNow: tableRef, selectionEnabled, pageRows, displayRows, rowSelection, setRowSelection } = model
  const isSelected = useCallback((row: DataGridRow<TData>) => rowSelection[row.id] === true, [rowSelection])
  const selectedCount = Object.keys(rowSelection).length
  const selectablePage = useMemo(() => (selectionEnabled ? pageRows.filter((row) => row.getCanSelect()) : (EMPTY as DataGridRow<TData>[])), [pageRows, selectionEnabled])
  const pageSelected = selectablePage.filter((row) => rowSelection[row.id]).length
  const allPageSelected = selectablePage.length > 0 && pageSelected === selectablePage.length
  const anchor = useRef<string | null>(null)

  const clearSelection = useCallback(() => setRowSelection({}), [setRowSelection])
  const selectAll = useCallback(() => {
    const next: RowSelectionState = {}
    for (const row of tableRef.current.getRowModel().rows) if (row.getCanSelect()) next[row.id] = true
    setRowSelection(next)
  }, [setRowSelection, tableRef])
  const togglePage = (checked: boolean) =>
    setRowSelection((old) => {
      const next = { ...old }
      for (const row of selectablePage) {
        if (checked) next[row.id] = true
        else delete next[row.id]
      }
      return next
    })
  const toggleRow = (rowId: string, checked: boolean, shift: boolean) => {
    const from = anchor.current
    anchor.current = rowId
    if (shift && from && from !== rowId) {
      const ids = displayRows.map((row) => row.id)
      const a = ids.indexOf(from)
      const b = ids.indexOf(rowId)
      if (a !== -1 && b !== -1) {
        const [lo, hi] = a < b ? [a, b] : [b, a]
        setRowSelection((old) => {
          const next = { ...old }
          for (const row of displayRows.slice(lo, hi + 1)) {
            if (!row.getCanSelect()) continue
            if (checked) next[row.id] = true
            else delete next[row.id]
          }
          return next
        })
        return
      }
    }
    setRowSelection((old) => {
      const next = { ...old }
      if (checked) next[rowId] = true
      else delete next[rowId]
      return next
    })
  }

  // Selected ids whose rows left the data are dropped, after the commit, so a
  // controlled selection's owner hears it outside its own render.
  useEffect(() => {
    const known = tableRef.current.getCoreRowModel().rowsById
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
    // Only the data decides what is stale.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only the data decides what is stale
  }, [rowsIn])

  const snapshot = (): DataGridSelection<TData> => {
    const rows = tableRef.current.getRowModel().rows.filter((row) => rowSelection[row.id])
    return { count: selectedCount, rows: rows.map((row) => row.original), ids: Object.keys(rowSelection), clear: clearSelection }
  }

  return { isSelected, selectedCount, pageSelected, allPageSelected, clearSelection, selectAll, togglePage, toggleRow, snapshot }
}
