'use client'

import { useMemo, type ReactNode } from 'react'
import type { RowData } from '@tanstack/react-table'
import { DownloadIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import {
  DataTableColumnFilter,
  DataTableDensityToggle,
  DataTableFilterChips,
  DataTableSearch,
  DataTableToolbar,
  DataTableViewOptions,
  DataTableViews,
  dataTableFilterChips,
  type DataTableInstance,
  type DataTableView,
  type DataTableViewState,
} from '../../../components/ui/data-table'
import type { DataTableCopy } from './copy'
import type { TableModel } from './model'
import type { DataTableProps } from './props'

/**
 * The rows above the grid: the app's own toolbar content, the saved views,
 * the search and a key per declared filter at the start; density, columns and
 * export at the end; and the filters in force as chips beneath.
 */
export function TableToolbar<TData extends RowData>({
  props,
  model,
  copy,
  locale,
  totalRows,
  onExport,
  onFocusGrid,
}: {
  props: DataTableProps<TData>
  model: TableModel<TData>
  copy: DataTableCopy
  locale: string
  totalRows: number
  onExport: () => void
  /** Where focus goes when the last chip is removed from the keyboard. */
  onFocusGrid: () => void
}) {
  const { table, sorting, columnFilters, globalFilter, columnVisibility, columnOrder, columnPinning, density, setDensity, activeViewId } = model
  const showFilters = props.showFilters ?? true
  const viewState = useMemo<DataTableViewState>(
    () => ({ sorting, columnFilters, globalFilter, columnVisibility, columnOrder, columnPinning, density }),
    [sorting, columnFilters, globalFilter, columnVisibility, columnOrder, columnPinning, density],
  )
  const applyView = (view: DataTableView | null) => {
    model.setActiveViewId(view?.id ?? null)
    if (!view) return
    const { state } = view
    model.setSorting(state.sorting)
    model.setColumnFilters(state.columnFilters)
    model.setGlobalFilter(state.globalFilter)
    model.setColumnVisibility(state.columnVisibility)
    model.setColumnOrder(state.columnOrder)
    model.setColumnPinning(state.columnPinning)
    setDensity(state.density)
    model.setPagination((old) => (old.pageIndex === 0 ? old : { ...old, pageIndex: 0 }))
  }
  const chips = showFilters ? dataTableFilterChips(table as DataTableInstance<TData>, locale, copy) : []
  const clearFilters = () => {
    table.resetColumnFilters(true)
    table.setGlobalFilter('')
  }

  const toolbarContent: ReactNode = typeof props.toolbar === 'function' ? props.toolbar(table) : props.toolbar
  const search = props.search === true ? {} : props.search || null
  const filterColumns = showFilters ? table.getAllLeafColumns().filter((column) => column.columnDef.meta?.filter && column.getCanFilter()) : []
  const filterBar = (props.views || search || filterColumns.length > 0) && (
    <>
      {props.views && (
        <DataTableViews views={props.views} activeId={activeViewId} current={viewState} onApply={applyView} onViewsChange={(next) => props.onViewsChange?.(next)} />
      )}
      {search && <DataTableSearch table={table} placeholder={search.placeholder} debounce={search.debounce} shortcut={search.shortcut} />}
      {filterColumns.map((column) => (
        <DataTableColumnFilter key={column.id} column={column} />
      ))}
    </>
  )
  const showDensity = props.showDensityToggle ?? true
  const showColumnsMenu = props.showColumnsMenu ?? true
  const endControls = (showDensity || showColumnsMenu || props.exportable) && (
    <>
      {showDensity && <DataTableDensityToggle value={density} onValueChange={setDensity} />}
      {showColumnsMenu && <DataTableViewOptions table={table} />}
      {props.exportable && (
        <Button variant="outline" size="sm" onClick={onExport} disabled={totalRows === 0}>
          <DownloadIcon />
          {copy.export}
        </Button>
      )}
    </>
  )

  return (
    <>
      {(toolbarContent || filterBar || endControls) && (
        <DataTableToolbar actions={endControls || undefined}>{toolbarContent ?? filterBar}</DataTableToolbar>
      )}
      {toolbarContent && filterBar && (
        <div data-slot="data-table-filter-bar" className="flex flex-wrap items-center gap-2">
          {filterBar}
        </div>
      )}
      {showFilters && <DataTableFilterChips chips={chips} onClearAll={clearFilters} onEmptied={onFocusGrid} />}
    </>
  )
}
