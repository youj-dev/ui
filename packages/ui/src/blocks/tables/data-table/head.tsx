'use client'

import { memo, type CSSProperties, type ReactNode } from 'react'
import type { Header, RowData } from '@tanstack/react-table'
import { Checkbox } from '../../../components/ui/checkbox'
import { DATA_TABLE_SELECT_COLUMN_ID, DataTableColumnHeader, type DataTableFeatures } from '../../../components/ui/data-table'
import { cn } from '../../../lib/utils'

/** Where a visible column sits and how its cells look. One per visible leaf column, in render order. */
export interface ColumnLayout {
  id: string
  /** Visible index in render order: `data-dt-col`. */
  index: number
  pinned: false | 'start' | 'end'
  /** The start-pinned column whose end edge casts the scroll shadow. */
  edgeStart: boolean
  /** The end-pinned column whose start edge casts the scroll shadow. */
  edgeEnd: boolean
  align: 'start' | 'center' | 'end'
  numeric: boolean
  editable: boolean
  /** Fills the width the others leave: it flexes instead of resizing. */
  grow: boolean
  cellClassName?: string
  headerClassName?: string
}

const ALIGN = { start: 'own:text-start', center: 'own:text-center', end: 'own:text-end' } as const

/** Sticky offsets for a pinned column; the values live on the table as CSS variables. */
export function pinStyle(layout: ColumnLayout): CSSProperties | undefined {
  if (layout.pinned === 'start') return { insetInlineStart: `var(--dt-s${layout.index})` }
  if (layout.pinned === 'end') return { insetInlineEnd: `var(--dt-e${layout.index})` }
  return undefined
}

/* The pinned edge's shadow: a hairline plus a soft falloff over the scrolled
 * content, shown only while content is actually hidden under that side
 * (the scroll container carries data-overflow-start / -end). */
export const edgeShadow = {
  start: cn(
    'after:pointer-events-none after:absolute after:inset-y-0 after:-end-3 after:w-3 after:opacity-0',
    'after:bg-linear-to-r after:from-(--dt-shadow) after:to-transparent rtl:after:bg-linear-to-l',
    'after:transition-opacity after:yj-duration-fast after:ease-standard',
    'group-data-overflow-start/dt:after:opacity-100 group-data-overflow-start/dt:border-e own:group-data-overflow-start/dt:border-e-line',
  ),
  end: cn(
    'before:pointer-events-none before:absolute before:inset-y-0 before:-start-3 before:w-3 before:opacity-0',
    'before:bg-linear-to-l before:from-(--dt-shadow) before:to-transparent rtl:before:bg-linear-to-r',
    'before:transition-opacity before:yj-duration-fast before:ease-standard',
    'group-data-overflow-end/dt:before:opacity-100 group-data-overflow-end/dt:border-s own:group-data-overflow-end/dt:border-s-line',
  ),
}

/** A focused cell draws its ring inside its own edges, so neighbors and pinned edges never cover it. */
export const cellRing =
  'outline-hidden focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-focus'

/** Classes shared by every header cell, so the loading overlay's header is pixel-identical. */
export function headCellClass(layout: ColumnLayout | null, sorted = false) {
  return cn(
    'group/head sticky top-0 z-2 own:h-(--dt-head-h) border-b own:border-line own:bg-(--dt-head-bg) own:px-3 align-middle',
    'own:text-ui-sm own:font-medium whitespace-nowrap own:text-fg-muted',
    cellRing,
    layout && [
      ALIGN[layout.align],
      // The header under the pointer, in focus or with its menu open tints a step.
      'transition-[background-color] yj-duration-fast ease-standard',
      'own:hover:bg-(--dt-head-hover) own:has-[:focus-visible]:bg-(--dt-head-hover) own:has-data-popup-open:bg-(--dt-head-hover)',
      layout.pinned && 'z-3',
      layout.edgeStart && edgeShadow.start,
      layout.edgeEnd && edgeShadow.end,
      layout.id === DATA_TABLE_SELECT_COLUMN_ID && 'own:px-0',
      layout.headerClassName,
    ],
    sorted && 'own:text-fg',
  )
}

export interface HeaderRowProps<TData extends RowData> {
  headers: ReadonlyArray<Header<DataTableFeatures, TData, unknown>>
  columns: readonly ColumnLayout[]
  /** Visible index before which the filler cell goes, or null when a column grows. */
  fillerAt: number | null
  /** Sorting has more than one column: show each column's priority. */
  multiSorted: boolean
  /** The static copy drawn over the loading swap: same markup, no behavior. */
  interactive?: boolean
  selectAll?: { checked: boolean; indeterminate: boolean; label: string; onChange: (checked: boolean) => void }
  /** Each header's menu (sort, pin, move, hide). Pass a stable function: the headers skip renders that change nothing of theirs. */
  onMenuOpenChange?: (id: string | null) => void
  /** The column whose menu is open. */
  openMenu?: string | null
}

export function DataTableHeaderRow<TData extends RowData>({
  headers,
  columns,
  fillerAt,
  multiSorted,
  interactive = true,
  selectAll,
  onMenuOpenChange,
  openMenu = null,
}: HeaderRowProps<TData>) {
  // Each cell gets its column's state as plain values, so a render that
  // changes nothing of a column's (a selection, a page) skips its header.
  const cells: ReactNode[] = headers.map((header, i) => {
    const column = header.column
    const isSelect = column.id === DATA_TABLE_SELECT_COLUMN_ID
    return (
      <HeaderCell
        key={header.id}
        header={header}
        layout={columns[i]!}
        sorted={column.getIsSorted()}
        sortIndex={column.getSortIndex()}
        resizing={column.getIsResizing()}
        multiSorted={multiSorted}
        interactive={interactive}
        selectAll={isSelect ? selectAll : undefined}
        onMenuOpenChange={interactive && !isSelect ? onMenuOpenChange : undefined}
        menuOpen={openMenu === column.id}
      />
    )
  })
  if (fillerAt !== null) cells.splice(fillerAt, 0, <th key="__filler" aria-hidden data-dt-filler="" className={headCellClass(null)} />)
  return <tr data-slot="data-table-header-row">{cells}</tr>
}

function HeaderCellView<TData extends RowData>({
  header,
  layout,
  sorted,
  interactive,
  multiSorted,
  selectAll,
  onMenuOpenChange,
  menuOpen,
}: {
  header: Header<DataTableFeatures, TData, unknown>
  layout: ColumnLayout
  sorted: false | 'asc' | 'desc'
  /** Read by the memo: a new priority redraws the header. */
  sortIndex: number
  /** Read by the memo: a drag redraws the handle. */
  resizing: boolean
  multiSorted: boolean
  interactive: boolean
  selectAll?: HeaderRowProps<TData>['selectAll']
  onMenuOpenChange?: (id: string | null) => void
  menuOpen: boolean
}) {
  const column = header.column
  const cell = { 'data-dt-cell': '', 'data-dt-row': '-1', 'data-dt-col': layout.index, style: pinStyle(layout) }
  if (column.id === DATA_TABLE_SELECT_COLUMN_ID)
    return (
      <th scope="col" {...cell} className={headCellClass(layout)}>
        <span className="own:flex items-center justify-center">
          {selectAll && (
            <Checkbox
              data-dt-focus=""
              tabIndex={-1}
              aria-label={selectAll.label}
              checked={selectAll.checked}
              indeterminate={selectAll.indeterminate}
              onCheckedChange={interactive ? (checked) => selectAll.onChange(checked) : undefined}
            />
          )}
        </span>
      </th>
    )
  return (
    <DataTableColumnHeader
      {...cell}
      header={header}
      align={layout.align}
      // The grid opens the menu from the keyboard (Alt+↓ on the cell); the header opens it from a click or a right-click.
      menu={onMenuOpenChange !== undefined}
      menuOpen={menuOpen}
      onMenuOpenChange={(open) => onMenuOpenChange?.(open ? column.id : null)}
      showSortIndex={multiSorted}
      resizable={interactive && !layout.grow}
      tabIndex={column.getCanSort() ? undefined : -1}
      className={headCellClass(layout, sorted !== false)}
    />
  )
}

const HeaderCell = memo(HeaderCellView) as typeof HeaderCellView
