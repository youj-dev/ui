import type { ComponentProps, ReactNode } from 'react'
import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  PaginationState,
  RowData,
  RowSelectionState,
  SortingState,
} from '@tanstack/react-table'
import type { ThemeInput } from '@youj/core'
import type { DataTableColumnDef, DataTableDensity, DataTableInstance, DataTableView } from '../../../components/ui/data-table'
import type { DataTableCopy } from './copy'

export interface DataTableState {
  sorting: SortingState
  pagination: PaginationState
  rowSelection: RowSelectionState
  columnFilters: ColumnFiltersState
  globalFilter: string
  columnSizing: ColumnSizingState
  columnPinning: ColumnPinningState
  columnVisibility: ColumnVisibilityState
  columnOrder: ColumnOrderState
}

/** Like the state, with pinning and pagination fillable in part (`{ start: ['id'] }`, `{ pageSize: 50 }`). */
export type DataTableInitialState = Partial<Omit<DataTableState, 'columnPinning' | 'pagination'>> & {
  columnPinning?: Partial<ColumnPinningState>
  pagination?: Partial<PaginationState>
}

export interface DataTableCellEdit<TData> {
  row: TData
  rowId: string
  columnId: string
  value: unknown
  previousValue: unknown
}

/** The cell the keyboard is on. */
export interface DataTableActiveCell {
  rowId: string
  columnId: string
  /** The row's position among the rows in view (this page's), from 0. */
  rowIndex: number
}

export interface DataTableSelection<TData> {
  /** How many rows are selected, including rows on pages that are not loaded. */
  count: number
  /** The selected rows that are loaded, in view order. */
  rows: TData[]
  /** Selected row ids. With `allMatching`, the loaded ones. */
  ids: string[]
  /** Server mode: every row matching the current query is selected, except `excludedIds`. */
  allMatching: boolean
  excludedIds: string[]
  clear: () => void
  /** Downloads the selected, loaded rows as CSV. */
  exportCsv: () => void
}

type Change<T> = (value: T) => void

export interface DataTableProps<TData extends RowData> extends Omit<ComponentProps<'div'>, 'title' | 'children' | 'onChange'> {
  /** The records, one per row. Default: 48 deployments, with the demo's columns. */
  rows?: ReadonlyArray<TData>
  /** The columns, from `createDataTableColumnHelper` (`@youj/react/data-table`). Default: the deployments' Commit, Status, Environment, Duration and Created. */
  columns?: ReadonlyArray<DataTableColumnDef<TData>>
  /** Stable row identity. Strongly recommended: selection, editing and row animation key on it. */
  getRowId?: (row: TData, index: number) => string
  /** Names a row for its checkbox and for announcements: "ORD-1042". Default: its first column's value. */
  getRowLabel?: (row: TData) => string

  /** The heading over the table. Without one the table stands alone, named by `label`. Default: "Deployments" with the demo's rows. */
  title?: ReactNode
  /** A line under the title. */
  description?: ReactNode
  /** The title's level when `embedded`. Default 2. */
  headingLevel?: 2 | 3 | 4
  /** Buttons at the end of the title row: "New deployment". */
  actions?: ReactNode
  /** The grid's accessible name, when it has no `title`. */
  label?: string
  'aria-labelledby'?: string

  /** Starting state for every uncontrolled slice. */
  initialState?: DataTableInitialState
  /** Controlled slices. Pair each with its change callback. */
  state?: Partial<DataTableState>
  onSortingChange?: Change<SortingState>
  onPaginationChange?: Change<PaginationState>
  onRowSelectionChange?: Change<RowSelectionState>
  onColumnFiltersChange?: Change<ColumnFiltersState>
  onGlobalFilterChange?: Change<string>
  onColumnSizingChange?: Change<ColumnSizingState>
  onColumnPinningChange?: Change<ColumnPinningState>
  onColumnVisibilityChange?: Change<ColumnVisibilityState>
  onColumnOrderChange?: Change<ColumnOrderState>

  /** Server mode: sorting, filtering and pagination happen outside. Pass one page of `rows` and the `rowCount`. */
  manual?: boolean
  /** Rows behind the current page, in server mode. */
  rowCount?: number

  /** Adds a checkbox column. A function decides per row. */
  enableRowSelection?: boolean | ((row: TData) => boolean)
  enableSorting?: boolean
  /** Shift+click (Shift+Enter) adds a column to the sort. Default true. */
  enableMultiSort?: boolean
  enableColumnResizing?: boolean
  /** Client-side pages. Default true (off when virtualized). */
  paginated?: boolean
  pageSizeOptions?: readonly number[]

  /** Renders only the rows in view, for thousands of rows. Needs a `height`. */
  virtualize?: boolean
  /** The scroll area's height. Sticky headers and virtualization scroll inside it. */
  height?: number | string
  maxHeight?: number | string

  density?: DataTableDensity
  /** Default: `compact` inside a compact layout density (YoujProvider's `density`), else `standard`. */
  defaultDensity?: DataTableDensity
  onDensityChange?: Change<DataTableDensity>
  /** The density switch in the toolbar. Default true. */
  showDensityToggle?: boolean
  /** An Export button in the toolbar (all rows in view order) and in the selection bar. */
  exportable?: boolean | { filename?: string }

  /** Loading with no rows shows skeleton rows that resolve into the data; with rows, they stay (surfaces a step darker, text at full contrast) under a progress line. */
  loading?: boolean
  skeletonRows?: number
  /** Replaces the rows with an error panel. A string is its message. */
  error?: ReactNode
  onRetry?: () => void
  /** Shown when there are no rows. */
  empty?: ReactNode

  /** A search field above the grid, filtering every column as you type. */
  search?: boolean | { placeholder?: string; debounce?: number; shortcut?: string | false }
  /** A filter key for every column with `meta.filter`, and chips for the ones set. Default true. */
  showFilters?: boolean
  /** The Columns menu: show, hide and reset columns. Default true. */
  showColumnsMenu?: boolean
  /** A menu on every header (sort, pin, move, hide): its chevron, a right-click, or Alt+↓ on the header. Default true. */
  headerMenus?: boolean

  /** Saved views: named filters, sort, columns and density. Enables the view switcher. */
  views?: ReadonlyArray<DataTableView>
  /** Called with the new list whenever a view is saved, updated or deleted. Persist it. */
  onViewsChange?: (views: DataTableView[]) => void
  activeViewId?: string | null
  defaultActiveViewId?: string | null
  onActiveViewChange?: Change<string | null>

  /** The cell the keyboard is on moved (arrows, a click, focus coming back); `null` on a header. A formula bar, a status line. */
  onActiveCellChange?: (cell: DataTableActiveCell | null) => void
  /** Commits an inline edit. Return a promise to show saving; a rejection rolls the cell back. */
  onCellEdit?: (edit: DataTableCellEdit<TData>) => void | Promise<unknown>
  /** Actions for the current selection, rendered in the selection bar. */
  bulkActions?: (selection: DataTableSelection<TData>) => ReactNode
  /** Content at the start of the toolbar: a title, filters, a search. */
  toolbar?: ReactNode | ((table: DataTableInstance<TData>) => ReactNode)

  /** Wraps the table in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another page: the table alone, at its natural width (72rem at 100% scale) unless `fill`. Default true; `false` draws a page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width. Default false. */
  fill?: boolean
  /** Any of the table's strings, to rewrite or translate. `noun` names the rows ("orders"). A locale pack on YoujProvider translates the rest. */
  copy?: Partial<DataTableCopy>
  /** Formats its counts (BCP 47). Default: the app's locale (YoujProvider). */
  locale?: string
}

/** Every prop the table reads itself; the rest (an id, a data attribute, a style) reach its root element. */
const OWN = [
  'rows', 'columns', 'getRowId', 'getRowLabel', 'title', 'description', 'headingLevel', 'actions', 'label', 'aria-labelledby', 'initialState', 'state',
  'onSortingChange', 'onPaginationChange', 'onRowSelectionChange', 'onColumnFiltersChange', 'onGlobalFilterChange', 'onColumnSizingChange',
  'onColumnPinningChange', 'onColumnVisibilityChange', 'onColumnOrderChange', 'manual', 'rowCount', 'enableRowSelection', 'enableSorting',
  'enableMultiSort', 'enableColumnResizing', 'paginated', 'pageSizeOptions', 'virtualize', 'height', 'maxHeight', 'density', 'defaultDensity',
  'onDensityChange', 'showDensityToggle', 'exportable', 'loading', 'skeletonRows', 'error', 'onRetry', 'empty', 'search', 'showFilters',
  'showColumnsMenu', 'headerMenus', 'views', 'onViewsChange', 'activeViewId', 'defaultActiveViewId', 'onActiveViewChange', 'onActiveCellChange', 'onCellEdit',
  'bulkActions', 'toolbar', 'theme', 'embedded', 'fill', 'copy', 'locale', 'className',
] as const satisfies ReadonlyArray<keyof DataTableProps<RowData>>

/** The root element's props: what's left once the table's own are taken out. */
export function rootProps<TData extends RowData>(props: DataTableProps<TData>): ComponentProps<'div'> {
  const own: ReadonlySet<string> = new Set(OWN)
  return Object.fromEntries(Object.entries(props).filter(([key]) => !own.has(key)))
}
