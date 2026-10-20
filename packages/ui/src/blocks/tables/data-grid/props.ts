import type { ComponentProps, ReactNode } from 'react'
import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ColumnVisibilityState,
  RowData,
  RowSelectionState,
  SortingState,
} from '@tanstack/react-table'
import type { ThemeInput } from '@youj/core'
import type { DataGridCopy } from './copy'
import type { DataGridColumnDef, DataGridDensity } from './model'
import type { DataGridEmpty } from './parts'
import type { DataGridRowAction } from './body'

export interface DataGridState {
  sorting: SortingState
  columnFilters: ColumnFiltersState
  globalFilter: string
  rowSelection: RowSelectionState
  columnVisibility: ColumnVisibilityState
  columnOrder: ColumnOrderState
  columnSizing: ColumnSizingState
  columnPinning: ColumnPinningState
  /** The column rows are grouped by, or null. */
  grouping: string | null
  /** Rows whose detail panel is open. */
  expanded: Record<string, boolean>
  /** Groups that are folded shut, by key. */
  collapsedGroups: Record<string, boolean>
  pageIndex: number
  pageSize: number
}

/** A saved view: a tab that applies its filters, search, sort, grouping and columns. */
export interface DataGridView {
  id: string
  label: string
  /** What the view shows. Slices it leaves out go back to their defaults. */
  state: Partial<Pick<DataGridState, 'sorting' | 'columnFilters' | 'globalFilter' | 'grouping' | 'columnVisibility'>>
  /** Shown after its name, e.g. how many rows it holds. */
  count?: number
}

export interface DataGridSelection<TData> {
  /** How many rows are selected. */
  count: number
  /** The selected rows, in view order. */
  rows: TData[]
  ids: string[]
  clear: () => void
}

type Change<T> = (value: T) => void

export interface DataGridProps<TData extends RowData> extends Omit<ComponentProps<'div'>, 'title' | 'children' | 'onChange'> {
  /** The records, one per row. Default: 18 projects, with the demo's columns. */
  rows?: ReadonlyArray<TData>
  /** The columns, from `createDataGridColumns` (this block's `data-grid/columns`). Default: the projects' Project, Status, Lead, Progress, Velocity, Budget, Target and Tags. */
  columns?: ReadonlyArray<DataGridColumnDef<TData>>
  /** Stable row identity: selection, expansion and row motion key on it. Default: its `id` field. */
  getRowId?: (row: TData, index: number) => string
  /** Names a row for its checkbox, its menus and announcements. Default: its first column's value. */
  getRowLabel?: (row: TData) => string

  /** The heading over the grid. Without one the grid stands alone, named by `label`. Default: "Projects" with the demo's rows. */
  title?: ReactNode
  /** A line under the title. */
  description?: ReactNode
  /** The title's level when `embedded`. Default 2. */
  headingLevel?: 2 | 3 | 4
  /** The grid's accessible name, when it has no `title`. */
  label?: string
  'aria-labelledby'?: string

  /** Starting state for every slice you don't control. */
  initialState?: Partial<DataGridState>
  /** Controlled slices. Pair each with its change callback. */
  state?: Partial<DataGridState>
  onSortingChange?: Change<SortingState>
  onColumnFiltersChange?: Change<ColumnFiltersState>
  onGlobalFilterChange?: Change<string>
  onRowSelectionChange?: Change<RowSelectionState>
  onColumnVisibilityChange?: Change<ColumnVisibilityState>
  onColumnOrderChange?: Change<ColumnOrderState>
  onColumnSizingChange?: Change<ColumnSizingState>
  onGroupingChange?: Change<string | null>
  onExpandedChange?: Change<Record<string, boolean>>
  onPageIndexChange?: Change<number>

  /** A checkbox on every row, or a function deciding per row. */
  selectable?: boolean | ((row: TData) => boolean)
  /** The selection bar's actions. */
  bulkActions?: (selection: DataGridSelection<TData>) => ReactNode
  /** Each row's actions: `inline` ones show as icon buttons on hover, and all are in its "…" menu. */
  rowActions?: (row: TData) => DataGridRowAction<TData>[]
  /** Enter on a row (or a click on its name) opens it. */
  onRowOpen?: (row: TData) => void
  /** A click on a row (or card), anywhere but its own controls (checkbox, actions, links, detail panel) and not while text is selected. Keyboard opens go through `onRowOpen`. */
  onRowClick?: (row: TData) => void
  /** A detail panel under a row, opened from its chevron (or Enter, when rows don't open). */
  renderDetail?: (row: TData) => ReactNode
  /** The row open elsewhere (in a side panel or a drawer): it keeps the selection's tint and bar, and `aria-current`. Default: none. */
  activeRowId?: string | null

  density?: DataGridDensity
  /** Default: `compact` inside a compact layout density (YoujProvider's `density`), else `comfortable`. */
  defaultDensity?: DataGridDensity
  onDensityChange?: Change<DataGridDensity>
  /** Alternate rows take a faint tint, instead of hairlines alone. */
  striped?: boolean
  /** Shift+click on a header adds it to the sort. Default true. */
  enableMultiSort?: boolean
  /** Drag a header's edge to resize its column. Default true. */
  enableColumnResizing?: boolean
  /** Pins the first column (the identity) while the grid scrolls sideways. Default true. */
  pinFirstColumn?: boolean

  /** A search over every visible column. Default true. */
  search?: boolean | { placeholder?: string; shortcut?: string | false }
  /** The Filter menu, for columns that filter (status, tags, people…). Default true. */
  filters?: boolean
  /** The Group menu, for columns that group. Default true. */
  grouping?: boolean
  /** The Columns menu: show, hide and reorder. Default true. */
  columnsMenu?: boolean
  /** The density switch. Default true. */
  densitySwitch?: boolean

  /** Saved views, as tabs over the toolbar. */
  views?: ReadonlyArray<DataGridView>
  activeView?: string
  defaultActiveView?: string
  onActiveViewChange?: Change<string>

  /** Rows per page, or false for every row. Default 25. Grouped rows aren't paged: groups fold instead. */
  pageSize?: number | false
  /** Renders only the rows in view, for thousands of rows. Needs a `height`. Paging is off. */
  virtualize?: boolean
  /** The scroll area's height: the header sticks and virtualized rows scroll inside it. */
  height?: number | string
  maxHeight?: number | string
  /** Called when a virtualized grid scrolls to its end: load the next rows. */
  onEndReached?: () => void
  /** Rows are on their way (with `onEndReached`): skeleton rows follow the last. */
  loadingMore?: boolean

  /** No rows yet: skeleton rows that resolve into the data. With rows: a progress line, and nothing moves. */
  loading?: boolean
  skeletonRows?: number
  /** Replaces the rows with an error panel. A string is its message. */
  error?: ReactNode
  onRetry?: () => void
  /** The empty state: its title, description, an illustration or icon, and an action. */
  empty?: DataGridEmpty

  /** `auto` lays rows out as cards when the grid is narrower than `cardsBelow`. Default auto. */
  layout?: 'auto' | 'table' | 'cards'
  /** The width (px) under which `auto` shows cards. Default 640. */
  cardsBelow?: number

  /** The start of the toolbar: a scope switch, a count. */
  toolbar?: ReactNode
  /** The end of the toolbar: "New customer". */
  actions?: ReactNode
  /** The moment relative dates count from. Default: the browser's clock, each minute. */
  now?: number | Date

  /** Wraps the grid in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another page: the grid alone, at its natural width (72rem at 100% scale) unless `fill`. Default true; `false` draws a page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width. Default false. */
  fill?: boolean
  /** Any of the grid's strings, to rewrite or translate. `noun` names the rows ("customers"). A locale pack on YoujProvider translates the rest. */
  copy?: Partial<DataGridCopy>
  /** Formats its numbers and dates (BCP 47). Default: the app's locale (YoujProvider). */
  locale?: string
}

/** Every prop the grid reads itself; the rest (an id, a data attribute, a style) reach its root element. */
const OWN = [
  'rows', 'columns', 'getRowId', 'getRowLabel', 'title', 'description', 'headingLevel', 'label', 'aria-labelledby', 'initialState', 'state',
  'onSortingChange', 'onColumnFiltersChange', 'onGlobalFilterChange', 'onRowSelectionChange', 'onColumnVisibilityChange', 'onColumnOrderChange',
  'onColumnSizingChange', 'onGroupingChange', 'onExpandedChange', 'onPageIndexChange', 'selectable', 'bulkActions', 'rowActions', 'onRowOpen',
  'onRowClick', 'renderDetail', 'activeRowId', 'density', 'defaultDensity', 'onDensityChange', 'striped', 'enableMultiSort', 'enableColumnResizing',
  'pinFirstColumn', 'search', 'filters', 'grouping', 'columnsMenu', 'densitySwitch', 'views', 'activeView', 'defaultActiveView', 'onActiveViewChange',
  'pageSize', 'virtualize', 'height', 'maxHeight', 'onEndReached', 'loadingMore', 'loading', 'skeletonRows', 'error', 'onRetry', 'empty', 'layout',
  'cardsBelow', 'toolbar', 'actions', 'now', 'theme', 'embedded', 'fill', 'copy', 'locale', 'className',
] as const satisfies ReadonlyArray<keyof DataGridProps<RowData>>

/** The root element's props: what's left once the grid's own are taken out. */
export function rootProps<TData extends RowData>(props: DataGridProps<TData>): ComponentProps<'div'> {
  const own: ReadonlySet<string> = new Set(OWN)
  return Object.fromEntries(Object.entries(props).filter(([key]) => !own.has(key)))
}
