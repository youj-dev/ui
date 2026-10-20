'use client'

import { memo, type CSSProperties, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import { FlexRender, type Header, type RowData } from '@tanstack/react-table'
import { Checkbox } from '../../../components/ui/checkbox'
import { cn } from '../../../lib/utils'
import { SELECT_COLUMN_ID, type DataGridColumnKind, type DataGridFeatures } from './model'
import { ResizeHandle, SortIndicator } from './sort-indicator'

/** Where a visible column sits and how its cells look. One per visible leaf column, in render order. */
export interface GridColumnLayout {
  id: string
  /** Visible index in render order: `data-dg-col`. */
  index: number
  pinned: false | 'start' | 'end'
  /** The last start-pinned column: its end edge casts the scroll shadow. */
  edgeStart: boolean
  /** The first end-pinned column: its start edge casts the scroll shadow. */
  edgeEnd: boolean
  align: 'start' | 'center' | 'end'
  numeric: boolean
  grow: boolean
  kind?: DataGridColumnKind
  /** The checkbox, expander or actions column. */
  utility: boolean
  cellClassName?: string
  headerClassName?: string
}

export const ALIGN = { start: 'own:text-start', center: 'own:text-center', end: 'own:text-end' } as const
export const JUSTIFY = { start: 'justify-start', center: 'justify-center', end: 'justify-end' } as const

/** Sticky offsets for a pinned column; the values live on the grid as CSS variables. */
export function pinStyle(layout: GridColumnLayout): CSSProperties | undefined {
  if (layout.pinned === 'start') return { insetInlineStart: `var(--dg-s${layout.index})` }
  if (layout.pinned === 'end') return { insetInlineEnd: `var(--dg-e${layout.index})` }
  return undefined
}

/* A pinned edge's shadow: a hairline and a soft falloff over the scrolled
 * content, only while content is hidden under that side (the scroll area
 * carries data-overflow-start / -end). */
export const edgeShadow = {
  start: cn(
    'after:pointer-events-none after:absolute after:inset-y-0 after:-end-4 after:w-4 after:opacity-0',
    'after:bg-linear-to-r after:from-(--dg-shadow) after:to-transparent rtl:after:bg-linear-to-l',
    'after:transition-opacity after:yj-duration-fast after:ease-standard',
    'group-data-overflow-start/scroll:after:opacity-100',
  ),
  end: cn(
    'before:pointer-events-none before:absolute before:inset-y-0 before:-start-4 before:w-4 before:opacity-0',
    'before:bg-linear-to-l before:from-(--dg-shadow) before:to-transparent rtl:before:bg-linear-to-r',
    'before:transition-opacity before:yj-duration-fast before:ease-standard',
    'group-data-overflow-end/scroll:before:opacity-100',
  ),
}

/** A focused cell draws its ring inside its own edges, so neighbors and pinned edges never cover it. */
export const cellRing =
  'outline-hidden focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-focus'

export function headCellClass(layout: GridColumnLayout | null, sorted = false) {
  return cn(
    'group/head sticky top-0 z-3 own:h-(--dg-head-h) border-b border-line own:bg-(--dg-head-bg) own:px-3 align-middle own:first:ps-4 own:last:pe-4',
    'own:text-ui-sm own:font-medium whitespace-nowrap own:text-fg-muted',
    'transition-[height] yj-duration-base ease-standard',
    cellRing,
    layout && [
      ALIGN[layout.align],
      layout.pinned && 'z-4',
      layout.edgeStart && edgeShadow.start,
      layout.edgeEnd && edgeShadow.end,
      layout.utility && 'own:px-0 own:first:ps-0 own:last:pe-0',
      layout.headerClassName,
    ],
    sorted && 'own:text-fg',
  )
}

export interface GridHeaderRowProps<TData extends RowData> {
  headers: ReadonlyArray<Header<DataGridFeatures, TData, unknown>>
  columns: readonly GridColumnLayout[]
  /** Visible index before which the filler cell goes, or null when a column grows. */
  fillerAt: number | null
  multiSorted: boolean
  /** The static copy drawn over the loading swap: same markup, no behavior. */
  interactive?: boolean
  selectAll?: { checked: boolean; indeterminate: boolean; label: string; onChange: (checked: boolean) => void }
}

export function DataGridHeaderRow<TData extends RowData>({ headers, columns, fillerAt, multiSorted, interactive = true, selectAll }: GridHeaderRowProps<TData>) {
  // Each cell gets its column's state as plain values, so a render that
  // changes nothing of a column's (a selection, a page) skips its header.
  const cells: ReactNode[] = headers.map((header, i) => {
    const column = header.column
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
        selectAll={column.id === SELECT_COLUMN_ID ? selectAll : undefined}
      />
    )
  })
  if (fillerAt !== null) cells.splice(fillerAt, 0, <th key="__filler" aria-hidden className={headCellClass(null)} />)
  return (
    <tr data-slot="data-grid-header-row" aria-rowindex={1}>
      {cells}
    </tr>
  )
}

const HeaderCell = memo(function HeaderCellView<TData extends RowData>({
  header,
  layout,
  sorted,
  sortIndex,
  resizing,
  multiSorted,
  interactive,
  selectAll,
}: {
  header: Header<DataGridFeatures, TData, unknown>
  layout: GridColumnLayout
  sorted: false | 'asc' | 'desc'
  sortIndex: number
  resizing: boolean
  multiSorted: boolean
  interactive: boolean
  selectAll?: GridHeaderRowProps<TData>['selectAll']
}) {
  const column = header.column
  const canSort = column.getCanSort()
  const isSelect = column.id === SELECT_COLUMN_ID
  return (
    <th
      scope="col"
      data-dg-cell=""
      data-dg-row="-1"
      data-dg-col={layout.index}
      data-sorted={sorted || undefined}
      aria-colindex={layout.index + 1}
      aria-sort={sorted && sortIndex === 0 ? (sorted === 'asc' ? 'ascending' : 'descending') : undefined}
      tabIndex={-1}
      style={pinStyle(layout)}
      className={headCellClass(layout, sorted !== false)}
    >
      {isSelect ? (
        <span className="own:flex items-center justify-center">
          {selectAll && (
            <Checkbox
              data-dg-focus=""
              tabIndex={-1}
              aria-label={selectAll.label}
              checked={selectAll.checked}
              indeterminate={selectAll.indeterminate}
              onCheckedChange={interactive ? (checked) => selectAll.onChange(checked) : undefined}
            />
          )}
        </span>
      ) : layout.utility ? (
        <span className="sr-only">{header.isPlaceholder ? null : <FlexRender header={header} />}</span>
      ) : (
        <span className={cn('own:flex min-w-0 items-center', JUSTIFY[layout.align])}>
          {canSort ? (
            <SortButton header={header} sorted={sorted} sortIndex={sortIndex} interactive={interactive} align={layout.align} multiSorted={multiSorted} />
          ) : (
            <span className="truncate">{header.isPlaceholder ? null : <FlexRender header={header} />}</span>
          )}
        </span>
      )}
      {interactive && column.getCanResize() && !layout.grow && !layout.utility && <ResizeHandle header={header} resizing={resizing} />}
    </th>
  )
}) as <TData extends RowData>(props: {
  header: Header<DataGridFeatures, TData, unknown>
  layout: GridColumnLayout
  sorted: false | 'asc' | 'desc'
  sortIndex: number
  resizing: boolean
  multiSorted: boolean
  interactive: boolean
  selectAll?: GridHeaderRowProps<TData>['selectAll']
}) => ReactNode

function SortButton<TData extends RowData>({
  header,
  sorted,
  sortIndex,
  interactive,
  align,
  multiSorted,
}: {
  header: Header<DataGridFeatures, TData, unknown>
  sorted: false | 'asc' | 'desc'
  sortIndex: number
  interactive: boolean
  align: GridColumnLayout['align']
  multiSorted: boolean
}) {
  const column = header.column
  const toggle = interactive ? column.getToggleSortingHandler() : undefined
  return (
    <button
      type="button"
      data-dg-focus=""
      tabIndex={-1}
      onClick={(event: MouseEvent) => toggle?.(event)}
      onMouseDown={(event: MouseEvent<HTMLButtonElement>) => {
        // Shift+click adds to the sort; it must not also extend the page's text selection.
        if (!event.shiftKey) return
        event.preventDefault()
        event.currentTarget.focus({ preventScroll: true })
      }}
      onKeyDown={(event: KeyboardEvent) => {
        if (event.key === 'Enter' && event.shiftKey) {
          event.preventDefault()
          toggle?.(event)
        }
      }}
      className={cn(
        '-mx-1.5 inline-flex max-w-[calc(100%_+_var(--spacing)*3)] min-w-0 items-center gap-1 rounded-sm px-1.5 py-0.5 own:text-inherit',
        // The label is 16px tall; the hit area reaches 4px past it above and below (WCAG 2.5.8, 24px).
        'relative after:absolute after:inset-x-0 after:-inset-y-1',
        'transition-[color] yj-duration-fast ease-standard hover:text-fg focus-ring',
        // Figures put the arrow inside, so the label's edge lines up with the digits.
        align === 'end' && 'flex-row-reverse',
      )}
    >
      <span className="truncate">{header.isPlaceholder ? null : <FlexRender header={header} />}</span>
      <SortIndicator direction={sorted} next={column.getNextSortingOrder()} index={sortIndex} showIndex={multiSorted} />
    </button>
  )
}
