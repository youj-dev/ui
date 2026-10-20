import { useLayoutEffect, useMemo, useState } from 'react'
import { useTable, type ColumnPinningState, type RowData } from '@tanstack/react-table'
import { useDirection, useYoujLayout } from '@youj/core'
import type { DataGridRowAction, GridGroup, GridItem } from './body'
import type { DataGridCopy } from './copy'
import { ACTIONS_COLUMN_ID, EXPAND_COLUMN_ID, SELECT_COLUMN_ID, dataGridFeatures, metaOf, type DataGridColumnDef, type DataGridDensity, type DataGridRow } from './model'
import type { DataGridProps } from './props'
import { useLatest, useSlice } from './state'

const EMPTY: never[] = []

/* The columns the grid adds. Their cells are drawn by the row (they need its
 * selection and expansion), so the defs render nothing. */
const utility = <TData extends RowData>(id: string, size: number, label: string): DataGridColumnDef<TData> =>
  ({
    id,
    size,
    minSize: size,
    maxSize: size,
    enableSorting: false,
    enableResizing: false,
    enableHiding: false,
    enableColumnFilter: false,
    enableGlobalFilter: false,
    meta: { label },
    header: () => label,
    cell: () => null,
  }) as DataGridColumnDef<TData>

const idOf = (row: unknown) => String((row as { id?: unknown } | null)?.id ?? '')

/**
 * The grid's state and model: every slice controlled or not, its own columns
 * (checkbox, expander, actions) around the app's, the TanStack instance, the
 * card layout on a narrow frame, the groups, the page, and the lines of the
 * body in display order (rows, open details, group headings and footers).
 */
export function useGrid<TData extends RowData>(props: DataGridProps<TData>, rowsIn: ReadonlyArray<TData>, columnDefs: ReadonlyArray<DataGridColumnDef<TData>>, copy: DataGridCopy, root: HTMLElement | null) {
  const { selectable = false, pinFirstColumn = true, virtualize = false, renderDetail, rowActions } = props
  const getRowId = props.getRowId ?? idOf
  const init = props.initialState ?? {}
  const selectionEnabled = selectable !== false

  const s = props.state ?? {}
  const [sorting, setSorting] = useSlice(s.sorting, props.onSortingChange, init.sorting ?? EMPTY)
  const [columnFilters, setColumnFilters] = useSlice(s.columnFilters, props.onColumnFiltersChange, init.columnFilters ?? EMPTY)
  const [globalFilter, setGlobalFilter] = useSlice(s.globalFilter, props.onGlobalFilterChange, init.globalFilter ?? '')
  const [rowSelection, setRowSelection] = useSlice(s.rowSelection, props.onRowSelectionChange, init.rowSelection ?? {})
  const [columnVisibility, setColumnVisibility] = useSlice(s.columnVisibility, props.onColumnVisibilityChange, init.columnVisibility ?? {})
  const [columnOrder, setColumnOrder] = useSlice(s.columnOrder, props.onColumnOrderChange, init.columnOrder ?? EMPTY)
  const [columnSizing, setColumnSizing] = useSlice(s.columnSizing, props.onColumnSizingChange, init.columnSizing ?? {})
  const [grouping, setGrouping] = useSlice(s.grouping, props.onGroupingChange, init.grouping ?? null)
  const [expanded, setExpanded] = useSlice(s.expanded, props.onExpandedChange, init.expanded ?? {})
  const [collapsedGroups, setCollapsedGroups] = useSlice<Record<string, boolean>>(s.collapsedGroups, undefined, init.collapsedGroups ?? {})
  const [pageIndex, setPageIndex] = useSlice(s.pageIndex, props.onPageIndexChange, init.pageIndex ?? 0)
  const pageSize = s.pageSize ?? init.pageSize ?? (props.pageSize || 25)
  const sizing = useYoujLayout()
  // Until it's picked (a prop or the switch), the density follows the layout's, live.
  const [picked, setDensity] = useSlice<DataGridDensity | undefined>(props.density, props.onDensityChange as ((value: DataGridDensity | undefined) => void) | undefined, props.defaultDensity)
  const density: DataGridDensity = picked ?? (sizing.density === 'compact' ? 'compact' : 'comfortable')
  const [activeView, setActiveView] = useSlice(props.activeView, props.onActiveViewChange, props.defaultActiveView ?? props.views?.[0]?.id ?? '')

  // The actions column is sized for its buttons: the inline ones and the menu.
  // `rowActions` and `renderDetail` are often inline arrows, new every render. The grid keeps the latest of each in a ref and
  // depends only on whether it has one, so columns, layout and the memoized rows hold still. A row's clicks always reach the latest.
  const hasDetail = renderDetail !== undefined
  const hasActions = rowActions !== undefined
  const rowActionsRef = useLatest(rowActions)
  const actionsOf = useMemo(() => {
    if (!hasActions) return undefined
    return (row: TData): DataGridRowAction<TData>[] =>
      rowActionsRef.current!(row).map((action) => ({
        ...action,
        onSelect: (target) => (rowActionsRef.current?.(target).find((next) => next.label === action.label) ?? action).onSelect(target),
      }))
  }, [hasActions, rowActionsRef])
  const firstRow = rowsIn[0]
  const inlineActions = rowActions && firstRow !== undefined ? rowActions(firstRow).filter((action) => action.inline && action.icon).length : 0
  const columns = useMemo(() => {
    const out: DataGridColumnDef<TData>[] = []
    if (selectionEnabled) out.push(utility(SELECT_COLUMN_ID, 44, copy.selectAllRows))
    if (hasDetail) out.push(utility(EXPAND_COLUMN_ID, 36, copy.showDetails('')))
    out.push(...columnDefs)
    if (hasActions) out.push(utility(ACTIONS_COLUMN_ID, 18 + (inlineActions + 1) * 30, copy.actions))
    return out
  }, [columnDefs, selectionEnabled, hasDetail, hasActions, inlineActions, copy])

  const firstDataId = useMemo(() => {
    const def = columnDefs[0]
    return def ? (def.id ?? ('accessorKey' in def && typeof def.accessorKey === 'string' ? def.accessorKey : undefined)) : undefined
  }, [columnDefs])
  // Utility columns hold their places; the first column rides pinned with them.
  const columnPinning = useMemo<ColumnPinningState>(() => {
    const start = [selectionEnabled && SELECT_COLUMN_ID, hasDetail && EXPAND_COLUMN_ID, pinFirstColumn && firstDataId].filter(Boolean) as string[]
    return { start: s.columnPinning?.start ?? init.columnPinning?.start ?? start, end: hasActions ? [ACTIONS_COLUMN_ID] : [] }
  }, [selectionEnabled, hasDetail, pinFirstColumn, firstDataId, hasActions, s.columnPinning, init.columnPinning])

  const dir = useDirection()
  const resetPage = () => setPageIndex(0)
  const table = useTable({
    features: dataGridFeatures,
    data: rowsIn as TData[],
    columns,
    getRowId,
    state: { sorting, columnFilters, globalFilter, rowSelection, columnVisibility, columnOrder, columnSizing, columnPinning },
    onSortingChange: (updater) => {
      setSorting(updater)
      resetPage()
    },
    onColumnFiltersChange: (updater) => {
      setColumnFilters(updater)
      resetPage()
    },
    onGlobalFilterChange: (updater) => {
      setGlobalFilter(updater)
      resetPage()
    },
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    globalFilterFn: 'search',
    enableSorting: true,
    enableMultiSort: props.enableMultiSort ?? true,
    enableSortingRemoval: true,
    enableColumnResizing: props.enableColumnResizing ?? true,
    columnResizeMode: 'onChange',
    columnResizeDirection: dir,
    enableRowSelection: typeof selectable === 'function' ? (row) => selectable(row.original) : selectionEnabled,
    defaultColumn: { size: 160, minSize: 72, maxSize: 640 },
  })
  const tableNow = useLatest(table)
  const rows = table.getRowModel().rows

  /* ── Layout: table or cards ───────────────────────────────────────────── */
  const [narrow, setNarrow] = useState(false)
  const cardsBelow = props.cardsBelow ?? 640
  useLayoutEffect(() => {
    if (!root || (props.layout !== undefined && props.layout !== 'auto')) return
    const measure = () => setNarrow(root.clientWidth > 0 && root.clientWidth < cardsBelow)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    return () => observer.disconnect()
  }, [root, props.layout, cardsBelow])
  const cards = props.layout === 'cards' || ((props.layout ?? 'auto') === 'auto' && narrow)

  /* ── Groups ───────────────────────────────────────────────────────────── */
  const groupColumn = grouping ? table.getColumn(grouping) : undefined
  const groups = useMemo<GridGroup<TData>[] | null>(() => {
    if (!groupColumn) return null
    const meta = metaOf(groupColumn)
    const keyOf = meta?.groupKey ?? ((value: unknown) => (value === null || value === undefined ? '' : String(value)))
    const byKey = new Map<string, DataGridRow<TData>[]>()
    for (const row of rows) {
      const key = keyOf(row.getValue(groupColumn.id))
      const list = byKey.get(key)
      if (list) list.push(row)
      else byKey.set(key, [row])
    }
    const keys = [...byKey.keys()].sort(meta?.groupOrder ?? ((a, b) => a.localeCompare(b)))
    return keys.map((key) => ({ key, label: meta?.groupLabel ? meta.groupLabel(key) : key || '—', rows: byKey.get(key)!, collapsed: collapsedGroups[key] === true }))
  }, [groupColumn, rows, collapsedGroups])

  /* ── Display order, pages and the lines of the body ───────────────────── */
  const displayRows = useMemo(() => (groups ? groups.flatMap((group) => (group.collapsed ? [] : group.rows)) : rows), [groups, rows])
  const paged = props.pageSize !== false && !virtualize && !groups
  const pageCount = paged ? Math.max(1, Math.ceil(displayRows.length / pageSize)) : 1
  // A page past the end (rows were removed) shows the last one.
  const page = Math.min(pageIndex, pageCount - 1)
  const pageRows = useMemo(() => (paged ? displayRows.slice(page * pageSize, (page + 1) * pageSize) : displayRows), [paged, displayRows, page, pageSize])

  const headerGroups = table.getHeaderGroups()
  const headers = headerGroups[headerGroups.length - 1]?.headers ?? EMPTY
  const leafColumns = headers.map((header) => header.column)
  const aggregates = useMemo(() => leafColumns.some((column) => metaOf(column)?.aggregate), [leafColumns])
  const items = useMemo<GridItem<TData>[]>(() => {
    const out: GridItem<TData>[] = []
    const pushRow = (row: DataGridRow<TData>, stripe: boolean) => {
      out.push({ kind: 'row', key: row.id, row, stripe })
      if (hasDetail && expanded[row.id] !== undefined) out.push({ kind: 'detail', key: `detail:${row.id}`, row, open: expanded[row.id] === true })
    }
    if (!groups) pageRows.forEach((row, i) => pushRow(row, props.striped === true && i % 2 === 1))
    else
      for (const group of groups) {
        out.push({ kind: 'group', key: `group:${group.key}`, group })
        if (group.collapsed) continue
        group.rows.forEach((row, i) => pushRow(row, props.striped === true && i % 2 === 1))
        if (aggregates) out.push({ kind: 'footer', key: `footer:${group.key}`, group })
      }
    return out
  }, [groups, pageRows, hasDetail, expanded, props.striped, aggregates])

  // Keyboard coordinates: every line but a closed detail.
  const navIndex = useMemo(() => {
    const index = new Map<string, number>()
    let n = 0
    for (const item of items) if (item.kind !== 'detail' || item.open) index.set(item.key, n++)
    return { of: (key: string) => index.get(key) ?? -1, count: n }
  }, [items])

  return {
    table,
    tableNow,
    rows,
    headers,
    leafColumns,
    columns,
    selectionEnabled,
    hasDetail,
    hasActions,
    actionsOf,
    density,
    setDensity,
    activeView,
    setActiveView,
    cards,
    groupColumn,
    groups,
    displayRows,
    paged,
    page,
    pageCount,
    pageSize,
    pageRows,
    items,
    navIndex,
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    globalFilter,
    setGlobalFilter,
    rowSelection,
    setRowSelection,
    columnVisibility,
    setColumnVisibility,
    columnOrder,
    setColumnOrder,
    setColumnSizing,
    grouping,
    setGrouping,
    expanded,
    setExpanded,
    setCollapsedGroups,
    setPageIndex,
  }
}

export type GridModel<TData extends RowData> = ReturnType<typeof useGrid<TData>>
