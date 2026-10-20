'use client'

import type { RowData } from '@tanstack/react-table'
import { Collapse } from '@youj/motion'
import { cn } from '../../../lib/utils'
import { FilterChips, FilterMenu } from './filters'
import { ColumnsMenu, GroupMenu, SortMenu } from './menus'
import { ACTIONS_COLUMN_ID, EXPAND_COLUMN_ID, SELECT_COLUMN_ID, isUtilityColumn, metaOf } from './model'
import type { DataGridProps } from './props'
import { DensitySwitch, GridSearch, ToolbarDivider, ViewTabs } from './toolbar'
import type { GridModel } from './use-grid'

const EMPTY: never[] = []

/**
 * The grid's toolbar, inside its frame: the app's own start, the saved views
 * as tabs, the search and the Filter menu; then grouping (and sorting, where
 * cards have no headers), the Columns menu, density and the app's actions;
 * and the filters in force as chips on a row of their own that eases open
 * with the first and shut with the last.
 */
export function GridControls<TData extends RowData>({ props, model, onClearFilters }: { props: DataGridProps<TData>; model: GridModel<TData>; onClearFilters: () => void }) {
  const { table, cards, selectionEnabled, hasDetail, hasActions, grouping, setGrouping, sorting, density, setDensity, columnOrder } = model
  const allColumns = table.getAllLeafColumns()
  const facetColumns = props.filters === false ? [] : allColumns.filter((column) => metaOf(column)?.facet && column.getCanFilter())
  const groupColumns = props.grouping === false ? [] : allColumns.filter((column) => metaOf(column)?.groupable)
  const sortColumns = allColumns.filter((column) => !isUtilityColumn(column.id) && column.getCanSort())
  const search = props.search === false ? null : props.search === true || props.search === undefined ? {} : props.search
  const applyView = (id: string) => {
    model.setActiveView(id)
    const view = props.views?.find((v) => v.id === id)
    if (!view) return
    model.setSorting(view.state.sorting ?? EMPTY)
    model.setColumnFilters(view.state.columnFilters ?? EMPTY)
    model.setGlobalFilter(view.state.globalFilter ?? '')
    model.setGrouping(view.state.grouping ?? null)
    if (view.state.columnVisibility) model.setColumnVisibility(view.state.columnVisibility)
    model.setPageIndex(0)
  }
  const columnIds = allColumns.map((column) => column.id)
  const dataOrder = (columnOrder.length ? columnOrder : columnIds).filter((id) => !isUtilityColumn(id))
  const setDataOrder = (order: string[]) =>
    model.setColumnOrder([...(selectionEnabled ? [SELECT_COLUMN_ID] : []), ...(hasDetail ? [EXPAND_COLUMN_ID] : []), ...order, ...(hasActions ? [ACTIONS_COLUMN_ID] : [])])
  const anyFiltered = facetColumns.some((column) => column.getIsFiltered())

  return (
    <div data-slot="data-grid-toolbar" className="border-b border-(--dg-line)">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
        {props.toolbar}
        {props.views && props.views.length > 0 && <ViewTabs views={props.views} value={model.activeView} onValueChange={applyView} />}
        {search && (
          <GridSearch
            value={model.globalFilter}
            onChange={(value) => table.setGlobalFilter(value)}
            placeholder={search.placeholder}
            shortcut={search.shortcut}
            className={cn(cards ? 'flex-1 sm:w-auto' : 'sm:w-56')}
          />
        )}
        {facetColumns.length > 0 && <FilterMenu columns={facetColumns} compact={cards} />}
        <div className="ms-auto flex items-center gap-1">
          {groupColumns.length > 0 && <GroupMenu columns={groupColumns} value={grouping} onValueChange={(id) => setGrouping(id)} compact={cards} />}
          {cards && sortColumns.length > 0 && <SortMenu columns={sortColumns} sorting={sorting} onSortingChange={(next) => table.setSorting(next)} />}
          {!cards && props.columnsMenu !== false && (
            <ColumnsMenu
              columns={allColumns}
              order={dataOrder}
              onOrderChange={setDataOrder}
              onReset={() => {
                model.setColumnOrder(EMPTY)
                model.setColumnVisibility(props.initialState?.columnVisibility ?? {})
              }}
            />
          )}
          {!cards && props.densitySwitch !== false && (
            <>
              <ToolbarDivider />
              <DensitySwitch value={density} onValueChange={setDensity} />
            </>
          )}
          {props.actions && (
            <>
              <ToolbarDivider />
              {props.actions}
            </>
          )}
        </div>
      </div>
      <Collapse open={anyFiltered} keepMounted={false}>
        <div className="px-3 pb-2.5">
          <FilterChips columns={facetColumns} onClearAll={onClearFilters} />
        </div>
      </Collapse>
    </div>
  )
}
