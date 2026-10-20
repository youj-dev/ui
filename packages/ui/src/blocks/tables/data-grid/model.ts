import type { ReactNode } from 'react'
import {
  columnFacetingFeature,
  columnFilteringFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createFacetedRowModel,
  createFilteredRowModel,
  createSortedRowModel,
  globalFilteringFeature,
  metaHelper,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  type Column,
  type ColumnDef,
  type FilterFn,
  type Row,
  type RowData,
  type Table,
} from '@tanstack/react-table'

/* The DataGrid's model on TanStack Table v9: sorting, filtering, faceting,
 * selection and the column features. Grouping and paging happen after it, in
 * the grid itself, on the sorted and filtered rows: a group keeps the order
 * the sort gave its rows, and a page can open partway into a group. The column
 * meta is typed per feature set, so it never leaks into another TanStack table
 * in the same app. */

export type DataGridDensity = 'compact' | 'comfortable' | 'spacious'

/** The color of a status, a delta or a meter: the theme's status colors, the accent, or none. */
export type DataGridTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger'

/** An option's color: a tone, or one of the theme's chart colors for categories that aren't states (pipeline stages, ticket types). */
export type DataGridOptionTone = DataGridTone | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

export type DataGridColumnKind =
  | 'identity'
  | 'status'
  | 'tags'
  | 'meter'
  | 'trend'
  | 'currency'
  | 'number'
  | 'date'
  | 'people'
  | 'boolean'
  | 'id'
  | 'link'
  | 'text'

export interface DataGridOption {
  value: string
  label: string
  tone?: DataGridOptionTone
  /** An image for the option (a person's avatar). */
  src?: string
}

/** A person, for `people` columns and their filter. */
export interface DataGridPerson {
  id: string
  name: string
  src?: string
}

/**
 * A column's filter in the toolbar's Filter menu: it narrows the rows to the
 * ones holding any of the chosen values. The values are plain strings, so a
 * saved view can hold them.
 */
export interface DataGridFacet {
  /** The filter's name in the menu and on its chip. Default: the column's label. */
  title?: string
  /** The values offered, in order. Default: every value found in the rows. */
  options?: readonly DataGridOption[]
  /** The values a cell holds: one for a status, several for tags or people. */
  keys: (value: unknown) => string[]
  /** Names a value that isn't in `options` (a person found in the rows). */
  describe?: (key: string, value: unknown) => DataGridOption | undefined
}

export type DataGridSkeleton = 'text' | 'identity' | 'badge' | 'tags' | 'number' | 'meter' | 'trend' | 'people' | 'toggle' | 'none'

export interface DataGridColumnMeta {
  /** What the column holds; the column types set it. */
  kind?: DataGridColumnKind
  /** The column's name in words: menus, cards, announcements. Default: a string header, then the id. */
  label?: string
  /** Cell and header alignment. Figures default to `end`. */
  align?: 'start' | 'center' | 'end'
  /** Figures: tabular mono, end-aligned. */
  numeric?: boolean
  /** Takes the width the other columns leave (never narrower than its size). */
  grow?: boolean
  /** A filter in the toolbar's Filter menu. */
  facet?: DataGridFacet
  /** Rows can be grouped by this column. */
  groupable?: boolean
  /** The group a cell value falls in. Default: the value as a string. */
  groupKey?: (value: unknown) => string
  /** A group's heading. Default: the key. */
  groupLabel?: (key: string) => ReactNode
  /** Orders the groups. Default: the options' order, else A to Z. */
  groupOrder?: (a: string, b: string) => number
  /** A figure for each group's footer: a sum, a mean, or your own. */
  aggregate?: 'sum' | 'mean' | ((values: unknown[]) => ReactNode)
  /** Formats a `sum` or `mean` aggregate like the column's cells. */
  formatAggregate?: (value: number) => ReactNode
  /** The placeholder shape while the grid loads. */
  skeleton?: DataGridSkeleton
  /** Its place on a card, when the grid lays out as cards: the title, a badge beside it, a field, or left off. */
  card?: 'title' | 'badge' | 'field' | 'hidden'
  /** What the search matches for this column. Default: the value as text. */
  searchText?: (value: unknown) => string
  /** Classes for this column's body cells. */
  cellClassName?: string
  /** Classes for this column's header cell. */
  headerClassName?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the grid's features include these filters, so their type can't name the features
type GridFilterFn = FilterFn<any, any>
type GridFilterRow = Parameters<GridFilterFn>[0]

/** Keeps rows holding any of the chosen values. Removes itself when nothing is chosen. */
const facet: GridFilterFn = Object.assign(
  (row: GridFilterRow, columnId: string, chosen: readonly string[]) => {
    const meta = metaOf(row.table.getColumn(columnId))
    const value = row.getValue(columnId)
    const keys = meta?.facet ? meta.facet.keys(value) : [String(value)]
    return keys.some((key) => chosen.includes(key))
  },
  { autoRemove: (value: unknown) => !Array.isArray(value) || value.length === 0 },
)

/** The search: every visible column's text, case- and accent-insensitive. */
const search: GridFilterFn = Object.assign(
  (row: GridFilterRow, columnId: string, query: string) => {
    const column = row.table.getColumn(columnId)
    if (!column || !column.getIsVisible()) return false
    const meta = metaOf(column)
    const value = row.getValue(columnId)
    const text = meta?.searchText ? meta.searchText(value) : value === null || value === undefined ? '' : String(value)
    return fold(text).includes(fold(query))
  },
  { autoRemove: (value: unknown) => typeof value !== 'string' || value.trim() === '' },
)

/** Lower case, without accents: "Zoë" matches "zoe". */
export function fold(text: string) {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()
}

export const dataGridFeatures = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, basic: sortFn_basic, datetime: sortFn_datetime, text: sortFn_text },
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { facet, search },
  columnFacetingFeature,
  facetedRowModel: createFacetedRowModel(),
  rowSelectionFeature,
  columnVisibilityFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnSizingFeature,
  columnResizingFeature,
  columnMeta: metaHelper<DataGridColumnMeta>(),
})

export type DataGridFeatures = typeof dataGridFeatures
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TanStack's way to hold columns of different value types in one array
export type DataGridColumnDef<TData extends RowData> = ColumnDef<DataGridFeatures, TData, any>
export type DataGridInstance<TData extends RowData> = Table<DataGridFeatures, TData>
export type DataGridRow<TData extends RowData> = Row<DataGridFeatures, TData>
export type DataGridColumn<TData extends RowData> = Column<DataGridFeatures, TData, unknown>

/** The columns the grid adds: the checkbox, the expander and the row actions. */
export const SELECT_COLUMN_ID = '__select'
export const EXPAND_COLUMN_ID = '__expand'
export const ACTIONS_COLUMN_ID = '__actions'
export const isUtilityColumn = (id: string) => id === SELECT_COLUMN_ID || id === EXPAND_COLUMN_ID || id === ACTIONS_COLUMN_ID

/* Comfortable is the default: two lines of an identity (a name and its
 * domain) beside a 32px avatar with room to breathe. Compact folds the
 * second line away; spacious gives every row the height of a list item. */
export const ROW_HEIGHT: Record<DataGridDensity, number> = { compact: 40, comfortable: 56, spacious: 68 }
export const HEAD_HEIGHT: Record<DataGridDensity, number> = { compact: 34, comfortable: 38, spacious: 42 }

/** A column's meta, typed: the one place the grid casts TanStack's meta. */
export function metaOf(column: { columnDef: { meta?: unknown } } | undefined): DataGridColumnMeta | undefined {
  return column?.columnDef.meta as DataGridColumnMeta | undefined
}

/** The column's name in words: `meta.label`, then a string header, then the id. */
export function columnLabel(column: { id: string; columnDef: { header?: unknown; meta?: DataGridColumnMeta } }): string {
  const meta = column.columnDef.meta
  if (meta?.label) return meta.label
  return typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id
}

export function columnAlign(meta: DataGridColumnMeta | undefined): 'start' | 'center' | 'end' {
  return meta?.align ?? (meta?.numeric ? 'end' : 'start')
}
