import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTable, type ColumnPinningState, type RowData } from '@tanstack/react-table'
import { useDirection, useYoujLayout } from '@youj/core'
import {
  DATA_TABLE_SELECT_COLUMN_ID,
  dataTableFeatures,
  type DataTableColumnDef,
  type DataTableColumnMeta,
  type DataTableDensity,
} from '../../../components/ui/data-table'
import type { RowEdits } from './body'
import type { DataTableProps } from './props'
import { useSlice } from './state'

const EMPTY: never[] = []

/* The checkbox column. Its cells are drawn by the row (they need the
 * selection state and Shift from the press), so the defs render nothing. */
const selectColumn: DataTableColumnDef<RowData> = {
  id: DATA_TABLE_SELECT_COLUMN_ID,
  size: 44,
  minSize: 44,
  maxSize: 44,
  enableSorting: false,
  enableResizing: false,
  enableHiding: false,
  enableColumnFilter: false,
  enableGlobalFilter: false,
  meta: { label: 'Selection', exportable: false, skeleton: 'check' },
  header: () => null,
  cell: () => null,
}

/** Writes an optimistic value into a copy of the row: `meta.setValue`, or the column's `accessorKey`. */
function writeValue<TData extends RowData>(def: DataTableColumnDef<TData> | undefined, row: unknown, value: unknown): unknown {
  if (!def) return row
  const meta = def.meta as DataTableColumnMeta | undefined
  if (meta?.setValue) return meta.setValue(row, value)
  const key = 'accessorKey' in def ? def.accessorKey : undefined
  if (typeof key === 'string' && !key.includes('.') && row && typeof row === 'object') return { ...row, [key]: value }
  return row
}

const firstPage = <T extends { pageIndex: number }>(old: T) => (old.pageIndex === 0 ? old : { ...old, pageIndex: 0 })

/**
 * The table's state and its TanStack instance: every slice controlled or not
 * (a prop and its callback, else local), optimistic edits written into a copy
 * of the rows, the checkbox column, and a sort, filter or search that starts
 * from the first page.
 */
export function useTableModel<TData extends RowData>(props: DataTableProps<TData>, rowsIn: ReadonlyArray<TData>, columnDefs: ReadonlyArray<DataTableColumnDef<TData>>) {
  const { getRowId, manual = false, enableRowSelection = false, virtualize = false } = props
  const paginated = (props.paginated ?? true) && !virtualize
  const selectionEnabled = enableRowSelection !== false
  const init = props.initialState ?? {}

  const [sorting, setSorting] = useSlice(props.state?.sorting, props.onSortingChange, init.sorting ?? EMPTY)
  const [pagination, setPagination] = useSlice(props.state?.pagination, props.onPaginationChange, { pageIndex: 0, pageSize: 25, ...init.pagination })
  const [rowSelection, setRowSelection] = useSlice(props.state?.rowSelection, props.onRowSelectionChange, init.rowSelection ?? {})
  const [columnFilters, setColumnFilters] = useSlice(props.state?.columnFilters, props.onColumnFiltersChange, init.columnFilters ?? EMPTY)
  const [globalFilter, setGlobalFilter] = useSlice(props.state?.globalFilter, props.onGlobalFilterChange, init.globalFilter ?? '')
  const [columnSizing, setColumnSizing] = useSlice(props.state?.columnSizing, props.onColumnSizingChange, init.columnSizing ?? {})
  const [columnPinning, setColumnPinning] = useSlice(props.state?.columnPinning, props.onColumnPinningChange, { start: [], end: [], ...init.columnPinning })
  const [columnVisibility, setColumnVisibility] = useSlice(props.state?.columnVisibility, props.onColumnVisibilityChange, init.columnVisibility ?? {})
  const [columnOrder, setColumnOrder] = useSlice(props.state?.columnOrder, props.onColumnOrderChange, init.columnOrder ?? EMPTY)
  const sizing = useYoujLayout()
  // Until it's picked (a prop, the toolbar or a view), the density follows the layout's, live.
  const [picked, setDensity] = useSlice<DataTableDensity | undefined>(props.density, props.onDensityChange as ((value: DataTableDensity | undefined) => void) | undefined, props.defaultDensity)
  const density: DataTableDensity = picked ?? (sizing.density === 'compact' ? 'compact' : 'standard')
  const [activeViewId, setActiveViewId] = useSlice(props.activeViewId, props.onActiveViewChange, props.defaultActiveViewId ?? null)
  const [edits, setEdits] = useState<Record<string, RowEdits>>({})

  const defsById = useMemo(() => {
    const map = new Map<string, DataTableColumnDef<TData>>()
    for (const def of columnDefs) {
      const id = def.id ?? ('accessorKey' in def && typeof def.accessorKey === 'string' ? def.accessorKey : undefined)
      if (id) map.set(id, def)
    }
    return map
  }, [columnDefs])

  // Optimistic edits are written into a copy of the rows, so sorting, CSV and
  // every renderer see the new value while it saves.
  const displayData = useMemo(() => {
    if (Object.keys(edits).length === 0) return rowsIn
    return rowsIn.map((row, index) => {
      const rowEdits = edits[getRowId ? getRowId(row, index) : String(index)]
      if (!rowEdits) return row
      let next: unknown = row
      for (const [columnId, edit] of Object.entries(rowEdits)) if (edit.status !== 'error') next = writeValue(defsById.get(columnId), next, edit.value)
      return next as TData
    })
  }, [rowsIn, edits, getRowId, defsById])

  // A declared toolbar filter brings its filter function, unless the column chose one.
  const columns = useMemo(() => {
    const wired = columnDefs.map((def): DataTableColumnDef<TData> => {
      const filter = def.meta?.filter
      if (!filter || def.filterFn) return def
      return { ...def, filterFn: filter.type === 'select' ? 'oneOf' : filter.type === 'date-range' ? 'dateRange' : 'numberRange' }
    })
    return selectionEnabled ? [selectColumn as DataTableColumnDef<TData>, ...wired] : wired
  }, [columnDefs, selectionEnabled])

  // The checkbox column rides along with any start-pinned columns.
  const pinning = useMemo<ColumnPinningState>(() => {
    const start = columnPinning.start ?? []
    if (!selectionEnabled || start.length === 0 || start[0] === DATA_TABLE_SELECT_COLUMN_ID) return columnPinning
    return { ...columnPinning, start: [DATA_TABLE_SELECT_COLUMN_ID, ...start.filter((id) => id !== DATA_TABLE_SELECT_COLUMN_ID)] }
  }, [columnPinning, selectionEnabled])

  const dir = useDirection()
  const selectable = enableRowSelection
  const table = useTable({
    features: dataTableFeatures,
    data: displayData as TData[],
    columns,
    getRowId,
    state: { sorting, pagination, rowSelection, columnFilters, globalFilter, columnSizing, columnPinning: pinning, columnVisibility, columnOrder },
    onSortingChange: (updater) => {
      setSorting(updater)
      // A new order starts from the top.
      setPagination(firstPage)
    },
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: (updater) => {
      setColumnFilters(updater)
      setPagination(firstPage)
    },
    onGlobalFilterChange: (updater) => {
      setGlobalFilter(updater)
      setPagination(firstPage)
    },
    onColumnSizingChange: setColumnSizing,
    onColumnPinningChange: setColumnPinning,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    manualSorting: manual,
    manualFiltering: manual,
    manualPagination: manual || !paginated,
    rowCount: manual ? props.rowCount : undefined,
    autoResetPageIndex: false,
    enableSorting: props.enableSorting ?? true,
    enableMultiSort: props.enableMultiSort ?? true,
    enableSortingRemoval: true,
    enableColumnResizing: props.enableColumnResizing ?? true,
    columnResizeMode: 'onChange',
    columnResizeDirection: dir,
    enableRowSelection: typeof selectable === 'function' ? (row) => selectable(row.original) : selectionEnabled,
    defaultColumn: { size: 160, minSize: 64, maxSize: 720 },
  })

  // useTable hands back a fresh object on every render; effects reach the
  // instance through this ref instead of re-running each time.
  const tableNow = useRef(table)
  useLayoutEffect(() => {
    tableNow.current = table
  })

  return {
    table,
    tableNow,
    columns,
    displayData,
    manual,
    paginated,
    selectionEnabled,
    density,
    setDensity,
    activeViewId,
    setActiveViewId,
    edits,
    setEdits,
    sorting,
    setSorting,
    pagination,
    setPagination,
    rowSelection,
    setRowSelection,
    columnFilters,
    setColumnFilters,
    globalFilter,
    setGlobalFilter,
    setColumnSizing,
    columnPinning,
    setColumnPinning,
    columnVisibility,
    setColumnVisibility,
    columnOrder,
    setColumnOrder,
  }
}

export type TableModel<TData extends RowData> = ReturnType<typeof useTableModel<TData>>
