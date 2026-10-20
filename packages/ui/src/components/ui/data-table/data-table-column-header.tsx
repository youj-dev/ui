'use client'

import { useId, useRef, useState, type ComponentProps, type KeyboardEvent, type MouseEvent, type Ref } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { FlexRender, type Header, type RowData } from '@tanstack/react-table'
import { MotionFeatures } from '@youj/core'
import { useYouj } from '@youj/core/lib/youj/provider'
import { cn } from '../../../lib/utils'
import { DataTableColumnMenu } from './data-table-columns'
import { columnAlign, type DataTableFeatures } from './data-table-model'

export interface DataTableColumnHeaderProps<TData extends RowData> extends Omit<ComponentProps<'th'>, 'children' | 'align'> {
  /** The TanStack header this cell draws: `headerGroup.headers[i]`. */
  header: Header<DataTableFeatures, TData, unknown>
  /** Where the label sits. Default: the column's `meta.align`, else `end` for a `meta.numeric` column, else `start`. */
  align?: 'start' | 'center' | 'end'
  /** The column's menu (sort, pin, move, hide) behind a chevron and a right-click. Default true, for a column that can sort, pin or hide. */
  menu?: boolean
  /** The menu's open state, controlled: a grid opens it from the keyboard (Alt+↓). */
  menuOpen?: boolean
  onMenuOpenChange?: (open: boolean) => void
  /** Number each sorted column by its priority. Default: while more than one column is sorted. */
  showSortIndex?: boolean
  /** A handle on the end edge that resizes the column (double-click resets it). Default: when the column can resize. */
  resizable?: boolean
}

const ALIGN = { start: 'own:text-start', center: 'own:text-center', end: 'own:text-end' } as const
const JUSTIFY = { start: 'justify-start', center: 'justify-center', end: 'justify-end' } as const

/**
 * A column's header cell, a `<th>` in place of TableHead: its label sorts the
 * column (Shift adds it to the sort, and the arrow turns to the new direction
 * on the snappy spring), a chevron and a right-click open its menu (sort,
 * pin, move, hide), and its end edge drags to resize. It reports `aria-sort`
 * for the first sorted column and is named by its label alone, so the menu
 * button never becomes part of what every cell below is announced with.
 * Reduced motion: the arrow flips without turning.
 */
export function DataTableColumnHeader<TData extends RowData>({
  header,
  align: alignProp,
  menu = true,
  menuOpen: menuOpenProp,
  onMenuOpenChange,
  showSortIndex,
  resizable,
  className,
  onContextMenu,
  onKeyDown,
  ...props
}: DataTableColumnHeaderProps<TData>) {
  const column = header.column
  const align = alignProp ?? columnAlign(column.columnDef.meta)
  const sorted = column.getIsSorted()
  const sortIndex = column.getSortIndex()
  const canSort = column.getCanSort()
  const withMenu = menu && (canSort || column.getCanPin() || column.getCanHide())
  const withResize = (resizable ?? true) && column.getCanResize()
  const [ownOpen, setOwnOpen] = useState(false)
  const menuOpen = menuOpenProp ?? ownOpen
  const setMenuOpen = (open: boolean) => {
    if (menuOpenProp === undefined) setOwnOpen(open)
    onMenuOpenChange?.(open)
  }
  // Where focus returns when the menu closes: the sort button, or the cell.
  const home = useRef<HTMLElement | null>(null)
  const labelId = useId()
  const multi = showSortIndex ?? column.table.atoms.sorting.get().length > 1
  return (
    <th
      ref={canSort ? undefined : (el) => void (home.current = el)}
      scope="col"
      aria-labelledby={withMenu ? labelId : undefined}
      aria-sort={sorted && sortIndex === 0 ? (sorted === 'asc' ? 'ascending' : 'descending') : undefined}
      data-slot="data-table-column-header"
      data-sorted={sorted || undefined}
      onContextMenu={(event) => {
        onContextMenu?.(event)
        if (!withMenu || event.defaultPrevented) return
        event.preventDefault()
        setMenuOpen(true)
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        // The menu's chevron stays out of the Tab order; the keys that open a context menu open it from the header.
        const menuKey = (event.altKey && event.key === 'ArrowDown') || (event.shiftKey && event.key === 'F10') || event.key === 'ContextMenu'
        if (!withMenu || !menuKey || event.defaultPrevented) return
        event.preventDefault()
        setMenuOpen(true)
      }}
      className={cn(
        'group/head relative own:h-[calc(var(--spacing)*(9_-_var(--ui--compact,0)))] own:border-b own:border-line own:px-3 align-middle',
        'own:text-ui-sm own:font-medium whitespace-nowrap own:text-fg-muted',
        ALIGN[align],
        sorted && 'own:text-fg',
        className,
      )}
      {...props}
    >
      <span className={cn('own:flex min-w-0 items-center', JUSTIFY[align])}>
        {canSort ? (
          <SortButton ref={home} labelId={labelId} header={header} sorted={sorted} sortIndex={sortIndex} align={align} showIndex={multi} />
        ) : (
          <span id={labelId} className="truncate">
            {header.isPlaceholder ? null : <FlexRender header={header} />}
          </span>
        )}
      </span>
      {withMenu && (
        // Opposite the label, so it never covers the name: at the end for
        // start-aligned columns, at the start for figures. The cell tints
        // while it shows, so it reads as this column's.
        <span className={cn('absolute inset-y-0 own:flex items-center', align === 'end' ? 'start-1.5' : 'end-2.5')}>
          <DataTableColumnMenu table={column.table} column={column} open={menuOpen} onOpenChange={setMenuOpen} returnFocus={home} />
        </span>
      )}
      {withResize && <ResizeHandle header={header} resizing={column.getIsResizing()} />}
    </th>
  )
}

function SortButton<TData extends RowData>({
  header,
  sorted,
  sortIndex,
  align,
  showIndex,
  labelId,
  ref,
}: {
  header: Header<DataTableFeatures, TData, unknown>
  sorted: false | 'asc' | 'desc'
  sortIndex: number
  align: 'start' | 'center' | 'end'
  showIndex: boolean
  labelId?: string
  ref?: Ref<HTMLElement | null>
}) {
  const column = header.column
  const toggle = column.getToggleSortingHandler()
  return (
    <button
      ref={ref as Ref<HTMLButtonElement>}
      type="button"
      data-dt-focus=""
      onClick={(event: MouseEvent) => toggle?.(event)}
      onMouseDown={(event: MouseEvent<HTMLButtonElement>) => {
        // Shift+click adds to the sort; it must not also extend the page's text selection.
        if (!event.shiftKey) return
        event.preventDefault()
        event.currentTarget.focus({ preventScroll: true })
      }}
      onKeyDown={(event: KeyboardEvent) => {
        // Shift+Enter adds the column to the sort, as Shift+click does.
        if (event.key === 'Enter' && event.shiftKey) {
          event.preventDefault()
          toggle?.(event)
        }
      }}
      className={cn(
        '-mx-1.5 inline-flex max-w-[calc(100%_+_var(--spacing)*3)] min-w-0 items-center gap-1 rounded-sm px-1.5 py-0.5 text-inherit',
        // The label is 20px tall; the hit area takes 4px more above and below (WCAG 2.5.8, 24px).
        'relative after:absolute after:inset-x-0 after:-inset-y-1 touch:after:-inset-y-3',
        'transition-[color] yj-duration-fast ease-standard hover:text-fg focus-ring',
        // End-aligned (figure) columns put the arrow on the inside, so the
        // label's edge lines up with the digits below it.
        align === 'end' && 'flex-row-reverse',
      )}
    >
      <span id={labelId} className="truncate">
        {header.isPlaceholder ? null : <FlexRender header={header} />}
      </span>
      <SortIndicator direction={sorted} next={column.getNextSortingOrder()} index={sortIndex} showIndex={showIndex} />
    </button>
  )
}

/**
 * One arrow that turns: up for ascending, down for descending, on the snappy
 * spring, so a reversal mid-turn continues from where it is. Unsorted, it
 * rests pointing the way a click would sort and shows faintly on hover or
 * focus. With several sorted columns, each shows its priority.
 */
function SortIndicator({
  direction,
  next,
  index,
  showIndex,
}: {
  direction: false | 'asc' | 'desc'
  next: false | 'asc' | 'desc'
  index: number
  showIndex: boolean
}) {
  const k = useYouj()
  const pointing = direction || next || 'asc'
  return (
    <MotionFeatures>
      <span
        aria-hidden
        data-slot="data-table-sort-indicator"
        data-direction={direction || undefined}
        className={cn(
          'own:inline-flex shrink-0 items-center gap-0.5 transition-opacity yj-duration-fast ease-standard',
          direction ? 'own:text-fg opacity-100' : 'opacity-0 group-hover/head:opacity-60 group-has-[:focus-visible]/head:opacity-60',
        )}
      >
        <m.svg
          viewBox="0 0 16 16"
          width={14}
          height={14}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ rotate: pointing === 'desc' ? 180 : 0 }}
          transition={k.reduced ? { type: false } : k.spring('snappy')}
        >
          <path d="M8 12.75V3.5M4.25 7.25L8 3.5L11.75 7.25" />
        </m.svg>
        <AnimatePresence initial={false} mode="popLayout">
          {showIndex && direction && (
            <m.span
              key={index}
              className="min-w-[1ch] own:text-ui-xs own:leading-none own:font-medium own:tabular-nums"
              initial={k.reduced ? false : { opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0, transition: k.reduced ? { type: false } : k.tween('fast', 'enter') }}
              exit={k.reduced ? undefined : { opacity: 0, y: -3, transition: k.tween('instant', 'exit') }}
            >
              {index + 1}
            </m.span>
          )}
        </AnimatePresence>
      </span>
    </MotionFeatures>
  )
}

function ResizeHandle<TData extends RowData>({ header, resizing }: { header: Header<DataTableFeatures, TData, unknown>; resizing: boolean }) {
  const resize = header.getResizeHandler()
  return (
    <div
      aria-hidden
      data-slot="data-table-resize-handle"
      data-resizing={resizing || undefined}
      onMouseDown={resize}
      onTouchStart={resize}
      onDoubleClick={() => header.column.resetSize()}
      className={cn(
        'absolute inset-y-0 end-0 z-1 own:w-2 cursor-col-resize touch-none select-none',
        'after:absolute after:inset-y-2 after:end-0 after:w-px after:rounded-full own:after:bg-transparent',
        'after:transition-[background-color,width] after:yj-duration-fast after:ease-standard',
        'own:group-hover/head:after:bg-line-strong own:hover:after:bg-fg-subtle',
        'data-resizing:after:inset-y-0 data-resizing:after:w-0.5 own:data-resizing:after:bg-focus',
      )}
    />
  )
}
