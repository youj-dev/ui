import { useMemo, type ComponentType } from 'react'
import {
  columnFacetingFeature,
  columnFilteringFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createFacetedMinMaxValues,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_arrIncludesSome,
  filterFn_equalsString,
  filterFn_inNumberRange,
  filterFn_includesString,
  globalFilteringFeature,
  metaHelper,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  useTable,
  type Column,
  type ColumnDef,
  type FilterFn,
  type Row,
  type RowData,
  type Table,
  type TableOptions,
} from '@tanstack/react-table'

/* The data table kit's model on TanStack Table v9. v9 registers features
 * explicitly, so this file is the inventory of what a table built on the kit
 * can do: every API a part calls exists because its feature is listed here.
 * Pass `dataTableFeatures` to `useTable` and type the columns with
 * `createDataTableColumnHelper`. Row models and function registries sit
 * beside the features that need them, and the column meta is typed per
 * feature set (not by global augmentation), so it never leaks into other
 * TanStack tables in the same app. */

export type DataTableDensity = 'compact' | 'standard' | 'comfortable'

export interface DataTableFilterOption {
  value: string
  label: string
  icon?: ComponentType<{ className?: string }>
}

/**
 * How a column is filtered from the toolbar. The filter value it writes is
 * plain JSON, so a saved view can hold it:
 * - `select`: `string[]`, the values to keep. Options default to the values
 *   in the column; each shows how many rows it would match.
 * - `date-range`: `{ from?: 'YYYY-MM-DD', to?: 'YYYY-MM-DD' }`, both inclusive.
 * - `number-range`: `{ min?: number, max?: number }`, both inclusive. The
 *   slider spans the column's values unless `min` and `max` are given.
 *
 * In server mode only one page is loaded, so pass `options`, `min` and `max`;
 * counts are left out rather than shown for one page.
 */
export type DataTableFilter =
  | { type: 'select'; title?: string; options?: ReadonlyArray<DataTableFilterOption> }
  | { type: 'date-range'; title?: string }
  | { type: 'number-range'; title?: string; min?: number; max?: number; step?: number; format?: (value: number) => string }

export interface DataTableDateRange {
  from?: string
  to?: string
}
export interface DataTableNumberRange {
  min?: number
  max?: number
}

/**
 * How a cell is edited in place. `DataTableCellEditor` draws it over the cell
 * and hands the parsed draft to its `onCommit`; saving it (and `meta.validate`)
 * is the app's. The Data table block wires the whole flow through its `onCellEdit`.
 */
export type DataTableEditor =
  | { type: 'text'; placeholder?: string; maxLength?: number }
  | { type: 'number'; min?: number; max?: number; step?: number; placeholder?: string }
  | { type: 'select'; options: ReadonlyArray<{ value: string; label: string }> }

export interface DataTableColumnMeta {
  /** The column's name in words: announcements, CSV headers, menus. Defaults to a string header, then the id. */
  label?: string
  /** Cell and header alignment. `numeric` columns default to `end`. */
  align?: 'start' | 'center' | 'end'
  /** Figures: tabular numerals, end-aligned. */
  numeric?: boolean
  /** Takes the width the other columns leave over (never narrower than its size). Ignored while pinned. */
  grow?: boolean
  /** A filter in the toolbar, with a chip while it is set. */
  filter?: DataTableFilter
  /** Edit the cell in place: Enter, F2, typing or a double click starts; Enter commits, Escape cancels. */
  editor?: DataTableEditor
  /** Rejects a draft with a reason, shown under the editor. Return nothing to accept. */
  validate?: (value: unknown) => string | null | undefined
  /** Writes an edited value into a row for the optimistic update. Defaults to setting `accessorKey`. */
  setValue?: (row: unknown, value: unknown) => unknown
  /** The CSV value. Defaults to the cell value (dates as ISO). */
  exportValue?: (value: unknown, row: unknown) => unknown
  /** `false` leaves the column out of CSV exports. */
  exportable?: boolean
  /** The placeholder shape while the table loads. */
  skeleton?: 'text' | 'short' | 'avatar' | 'badge' | 'number' | 'check' | 'none'
  /** Classes for this column's body cells (give them to each TableCell). useDataTable puts the column's alignment, and a numeric column's tabular figures, first. */
  cellClassName?: string
  /** Classes for this column's header cell. */
  headerClassName?: string
}

/* The toolbar filters' functions. Each removes itself from the state when it
 * holds nothing, so an emptied filter never lingers as a chip. */

function toTime(value: unknown): number | null {
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value !== '') {
    const time = new Date(value).getTime()
    return Number.isNaN(time) ? null : time
  }
  return null
}

/** Keeps rows whose value is one of the chosen values. */
const oneOf: FilterFn<any, any> = Object.assign(
  (row: Row<any, any>, columnId: string, value: readonly string[]) => value.includes(String(row.getValue(columnId))),
  { autoRemove: (value: unknown) => !Array.isArray(value) || value.length === 0 },
)

/** Keeps rows dated within the range, whole days inclusive, in local time. */
const dateRange: FilterFn<any, any> = Object.assign(
  (row: Row<any, any>, columnId: string, value: DataTableDateRange) => {
    const time = toTime(row.getValue(columnId))
    if (time === null) return false
    if (value.from && time < new Date(`${value.from}T00:00:00`).getTime()) return false
    if (value.to && time > new Date(`${value.to}T23:59:59.999`).getTime()) return false
    return true
  },
  { autoRemove: (value: unknown) => !value || (!(value as DataTableDateRange).from && !(value as DataTableDateRange).to) },
)

/** Keeps rows whose number is within the range, both ends inclusive. */
const numberRange: FilterFn<any, any> = Object.assign(
  (row: Row<any, any>, columnId: string, value: DataTableNumberRange) => {
    const n = row.getValue(columnId)
    if (typeof n !== 'number') return false
    return (value.min === undefined || n >= value.min) && (value.max === undefined || n <= value.max)
  },
  { autoRemove: (value: unknown) => !value || ((value as DataTableNumberRange).min === undefined && (value as DataTableNumberRange).max === undefined) },
)

export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic, datetime: sortFn_datetime, text: sortFn_text },
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: {
    includesString: filterFn_includesString,
    equalsString: filterFn_equalsString,
    arrIncludesSome: filterFn_arrIncludesSome,
    inNumberRange: filterFn_inNumberRange,
    oneOf,
    dateRange,
    numberRange,
  },
  columnFacetingFeature,
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
  facetedMinMaxValues: createFacetedMinMaxValues(),
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  rowSelectionFeature,
  columnVisibilityFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnSizingFeature,
  columnResizingFeature,
  columnMeta: metaHelper<DataTableColumnMeta>(),
})

export type DataTableFeatures = typeof dataTableFeatures
export type DataTableColumnDef<TData extends RowData> = ColumnDef<DataTableFeatures, TData, any>
export type DataTableInstance<TData extends RowData> = Table<DataTableFeatures, TData>
export type DataTableRow<TData extends RowData> = Row<DataTableFeatures, TData>
export type DataTableColumn<TData extends RowData> = Column<DataTableFeatures, TData, unknown>

/** A column helper bound to the DataTable's features, so `meta` is typed. */
export function createDataTableColumnHelper<TData extends RowData>() {
  return createColumnHelper<DataTableFeatures, TData>()
}

/**
 * TanStack's useTable with the kit's features: sorting, filters (the
 * toolbar's select, date and number ranges), faceting, pagination,
 * selection, and column visibility, order, pinning and sizing. Pass `state`
 * and its change callbacks for any slice you own; the rest the table keeps.
 * Render a cell with `<table.FlexRender cell={cell} />`.
 */
export function useDataTable<TData extends RowData>(
  options: Omit<TableOptions<DataTableFeatures, TData>, 'features'> & {
    /** `false` shows every row on one page: the table leaves its rows unpaginated (drop DataTablePagination too). */
    paginate?: boolean
  },
) {
  const { paginate = true, ...rest } = options
  const columns = useMemo(() => alignCells(rest.columns), [rest.columns])
  return useTable({ features: paginate ? dataTableFeatures : unpagedFeatures, ...rest, columns } as TableOptions<DataTableFeatures, TData>)
}

/* The same features with no paginated row model: TanStack then hands every
 * row to `getRowModel()`, and the pagination APIs the parts call still exist. */
const { paginatedRowModel: _paginated, ...unpaged } = dataTableFeatures
const unpagedFeatures = unpaged as DataTableFeatures

const CELL_ALIGN = { start: '', center: 'own:text-center', end: 'own:text-end' } as const

/* Body cells line up with their header with nothing to wire: a `numeric` (or
 * aligned) column's `meta.cellClassName` gains its alignment, and figures their
 * tabular numerals, ahead of the column's own classes so those still win. */
function alignCells<TData extends RowData>(columns: ReadonlyArray<DataTableColumnDef<TData>>): DataTableColumnDef<TData>[] {
  return columns.map((def) => {
    const meta = def.meta as DataTableColumnMeta | undefined
    const nested = 'columns' in def && def.columns ? { columns: alignCells(def.columns as DataTableColumnDef<TData>[]) } : {}
    const align = CELL_ALIGN[columnAlign(meta)]
    if (!align && !meta?.numeric) return { ...def, ...nested }
    return { ...def, ...nested, meta: { ...meta, cellClassName: [align, meta?.numeric && 'own:tabular-nums', meta?.cellClassName].filter(Boolean).join(' ') } }
  }) as DataTableColumnDef<TData>[]
}

/** The id a table gives its checkbox column: the column menus and the Columns menu leave it alone. */
export const SELECT_COLUMN_ID = '__select'

/** The column's name in words: `meta.label`, then a string header, then the id. */
export function columnLabel(column: { id: string; columnDef: { header?: unknown; meta?: DataTableColumnMeta } }): string {
  const meta = column.columnDef.meta
  if (meta?.label) return meta.label
  return typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id
}

/** Where a column's header and cells align: `meta.align`, else `end` for figures, else `start`. */
export function columnAlign(meta: DataTableColumnMeta | undefined): 'start' | 'center' | 'end' {
  return meta?.align ?? (meta?.numeric ? 'end' : 'start')
}
