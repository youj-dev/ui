'use client'

import { memo, useMemo, useRef, type ComponentType, type ReactNode } from 'react'
import { m } from 'motion/react'
import { ChevronRightIcon } from '@youj/icons/components/youj/icons/chevron-right'
import { FlexRender, type RowData } from '@tanstack/react-table'
import { useYouj } from '@youj/core'
import { PresenceItem } from '@youj/motion'
import { Checkbox } from '../../../components/ui/checkbox'
import { cn } from '../../../lib/utils'
import { useCopy } from './copy'
import { ALIGN, cellRing, edgeShadow, pinStyle, type GridColumnLayout } from './head'
import { ACTIONS_COLUMN_ID, EXPAND_COLUMN_ID, SELECT_COLUMN_ID, type DataGridRow } from './model'
import { RowActions } from './row-actions'
import { useLatest } from './state'

/** An action on a row: an icon button on hover when `inline`, and always an item in its "…" menu. */
export interface DataGridRowAction<TData> {
  label: string
  icon?: ComponentType<{ className?: string; size?: number }>
  onSelect: (row: TData) => void
  /** Also an icon button on the row, shown on hover and focus. */
  inline?: boolean
  destructive?: boolean
  /** A line above it in the menu. */
  separated?: boolean
  disabled?: boolean
  /** Shown in the menu beside it, e.g. "⌘E". */
  shortcut?: string
}

/** A group of rows under one heading: the rows share `key` in the grouped column. */
export interface GridGroup<TData extends RowData> {
  key: string
  label: ReactNode
  /** Every row in the group, across pages. */
  rows: DataGridRow<TData>[]
  collapsed: boolean
}

/** One line of the body, in display order. */
export type GridItem<TData extends RowData> =
  | { kind: 'row'; key: string; row: DataGridRow<TData>; stripe: boolean }
  | { kind: 'detail'; key: string; row: DataGridRow<TData>; open: boolean }
  | { kind: 'group'; key: string; group: GridGroup<TData> }
  | { kind: 'footer'; key: string; group: GridGroup<TData> }

/** Stable callbacks every row reaches through one prop, so memoized rows stay memoized. */
export interface GridBodyContext {
  toggleRow: (rowId: string, checked: boolean, shift: boolean) => void
  toggleExpanded: (rowId: string) => void
  toggleGroup: (key: string) => void
  rowLabel: (rowId: string) => string
}

/** One stable context for every row: forwarders to the latest `handlers`, and the label rows render with. */
export function useForwardedContext(handlers: Omit<GridBodyContext, 'rowLabel'>, rowLabel: GridBodyContext['rowLabel']): GridBodyContext {
  const latest = useLatest(handlers)
  return useMemo<GridBodyContext>(
    () => ({
      toggleRow: (...args) => latest.current.toggleRow(...args),
      toggleExpanded: (...args) => latest.current.toggleExpanded(...args),
      toggleGroup: (...args) => latest.current.toggleGroup(...args),
      rowLabel,
    }),
    [latest, rowLabel],
  )
}

/* Cell surfaces are opaque (a hover or selected tint is mixed into the
 * surface, not layered over it), so a pinned cell hides what scrolls under
 * it and rows crossing mid-sort occlude cleanly. The height follows the
 * density on the base token. */
export const cellBase = cn(
  'relative h-(--dg-row-h) border-b border-(--dg-line) bg-(--dg-row-bg) own:px-3 align-middle own:text-ui own:first:ps-4 own:last:pe-4',
  '[transition:background-color_var(--yj-duration-fast)_var(--ease-standard),height_calc(var(--yj-duration-base)*var(--yj-motion,1))_var(--ease-standard)]',
  cellRing,
  'scroll-mt-(--dg-head-h) scroll-ms-(--dg-pin-s) scroll-me-(--dg-pin-e)',
)

/* ── A row ──────────────────────────────────────────────────────────────── */

export interface GridRowProps<TData extends RowData> {
  row: DataGridRow<TData>
  /** Its line in display order: `data-dg-row`. */
  navIndex: number
  ariaRowIndex: number
  selected: boolean
  /** Open elsewhere (`activeRowId`): tinted like a selected row, with `aria-current`. */
  active: boolean
  selectable: boolean
  expanded: boolean
  stripe: boolean
  columns: readonly GridColumnLayout[]
  fillerAt: number | null
  /** Rows animate in, out and between slots through PresenceList. Off when virtualized. */
  presence: boolean
  detailId?: string
  actions?: (row: TData) => DataGridRowAction<TData>[]
  ctx: GridBodyContext
  measure?: (el: HTMLElement | null) => void
  virtualIndex?: number
}

function GridRowView<TData extends RowData>(props: GridRowProps<TData>) {
  const { row, navIndex, ariaRowIndex, selected, active, selectable, expanded, stripe, columns, fillerAt, presence, ctx, measure, virtualIndex } = props
  const labels = useCopy()
  const cells: ReactNode[] = row.getVisibleCells().map((cell, i) => {
    const layout = columns[i]!
    const id = cell.column.id
    let content: ReactNode
    if (id === SELECT_COLUMN_ID)
      content = <RowCheckbox rowId={row.id} selected={selected} disabled={!selectable} label={labels.selectRow(ctx.rowLabel(row.id))} onToggle={ctx.toggleRow} />
    else if (id === EXPAND_COLUMN_ID)
      content = (
        <ExpandButton
          expanded={expanded}
          controls={props.detailId}
          label={expanded ? labels.hideDetails(ctx.rowLabel(row.id)) : labels.showDetails(ctx.rowLabel(row.id))}
          onToggle={() => ctx.toggleExpanded(row.id)}
        />
      )
    else if (id === ACTIONS_COLUMN_ID)
      content = props.actions ? <RowActions row={row.original} actions={props.actions(row.original)} label={labels.rowActions(ctx.rowLabel(row.id))} /> : null
    else content = <FlexRender cell={cell} />
    return (
      <td
        key={cell.id}
        role="gridcell"
        data-dg-cell=""
        data-dg-row={navIndex}
        data-dg-col={layout.index}
        data-kind={layout.kind}
        data-numeric={layout.numeric || undefined}
        aria-colindex={layout.index + 1}
        tabIndex={-1}
        style={pinStyle(layout)}
        className={cn(
          cellBase,
          ALIGN[layout.align],
          !layout.utility && 'truncate',
          layout.utility && 'own:px-0 own:first:ps-0 own:last:pe-0',
          layout.pinned && 'sticky z-1',
          layout.edgeStart && edgeShadow.start,
          layout.edgeEnd && edgeShadow.end,
          layout.cellClassName,
        )}
      >
        {content}
      </td>
    )
  })
  if (fillerAt !== null) cells.splice(fillerAt, 0, <td key="__filler" aria-hidden className={cellBase} />)

  const rowProps = {
    'data-slot': 'data-grid-row',
    'data-dg-kind': 'row',
    'data-row-id': row.id,
    'data-selected': selected || undefined,
    'data-active': active || undefined,
    'aria-current': active || undefined,
    'data-expanded': expanded || undefined,
    'data-stripe': stripe || undefined,
    'data-index': virtualIndex,
    'aria-rowindex': ariaRowIndex,
    'aria-selected': selectable ? selected : undefined,
    className: rowClass,
  }
  return presence ? (
    <PresenceItem as="tr" {...rowProps}>
      {cells}
    </PresenceItem>
  ) : (
    <tr ref={measure} {...rowProps}>
      {cells}
    </tr>
  )
}

/* A row stacks as one: its pinned cells rise above its own scrolled cells
 * but never above a row gliding past it. Selected rows, and the row open
 * elsewhere, take the accent's tint and a 2px bar on their leading edge. */
const rowClass = cn(
  'group/row relative z-0',
  'data-stripe:[--dg-row-bg:var(--dg-row-zebra)]',
  'hover:[--dg-row-bg:var(--dg-row-hover)] focus-within:[--dg-row-bg:var(--dg-row-hover)]',
  'data-selected:[--dg-row-bg:var(--dg-row-selected)] data-selected:hover:[--dg-row-bg:var(--dg-row-selected-hover)]',
  '[&>td:first-child]:before:pointer-events-none [&>td:first-child]:before:absolute [&>td:first-child]:before:inset-y-0 [&>td:first-child]:before:start-0 [&>td:first-child]:before:w-0.5',
  '[&>td:first-child]:before:bg-accent [&>td:first-child]:before:opacity-0 [&>td:first-child]:before:transition-opacity [&>td:first-child]:before:yj-duration-fast',
  'data-active:[--dg-row-bg:var(--dg-row-selected)] data-active:hover:[--dg-row-bg:var(--dg-row-selected-hover)]',
  'data-selected:[&>td:first-child]:before:opacity-100 data-active:[&>td:first-child]:before:opacity-100',
  // An open row's detail continues its surface: no line between them.
  'data-expanded:[&>td]:border-b-transparent',
)

export const GridRow = memo(GridRowView) as typeof GridRowView

/* ── Controls in a row ──────────────────────────────────────────────────── */

function RowCheckbox({
  rowId,
  selected,
  disabled,
  label,
  onToggle,
}: {
  rowId: string
  selected: boolean
  disabled: boolean
  label: string
  onToggle: GridBodyContext['toggleRow']
}) {
  // Shift is read from the press itself: a keyboard toggle (Shift+Space)
  // reaches onCheckedChange through a click that carries no modifiers.
  const shift = useRef(false)
  return (
    <span
      className="own:flex items-center justify-center"
      onPointerDownCapture={(event) => (shift.current = event.shiftKey)}
      onKeyDownCapture={(event) => (shift.current = event.shiftKey)}
      onMouseDown={(event) => {
        // Shift+click would also extend the page's text selection across the rows.
        if (!event.shiftKey) return
        event.preventDefault()
        event.currentTarget.querySelector<HTMLElement>('[role=checkbox]')?.focus({ preventScroll: true })
      }}
    >
      <Checkbox
        data-dg-focus=""
        tabIndex={-1}
        aria-label={label}
        checked={selected}
        disabled={disabled}
        onCheckedChange={(checked, details) => {
          const native = details.event as { shiftKey?: boolean } | undefined
          onToggle(rowId, checked, shift.current || native?.shiftKey === true)
          shift.current = false
        }}
      />
    </span>
  )
}

function ExpandButton({ expanded, controls, label, onToggle }: { expanded: boolean; controls?: string; label: string; onToggle: () => void }) {
  const k = useYouj()
  return (
    <span className="own:flex items-center justify-center">
      <button
        type="button"
        data-dg-focus=""
        tabIndex={-1}
        aria-expanded={expanded}
        aria-controls={expanded ? controls : undefined}
        aria-label={label}
        onClick={onToggle}
        className={cn(
          'relative grid size-6 place-items-center rounded-sm own:text-fg-muted focus-ring',
          'transition-[color,background-color] yj-duration-fast ease-standard hover:bg-hover hover:text-fg',
          'after:absolute after:-inset-1 aria-expanded:text-fg',
        )}
      >
        <m.span
          className="grid place-items-center rtl:-scale-x-100"
          initial={false}
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={k.reduced ? { type: false } : k.spring('snappy')}
        >
          <ChevronRightIcon size={15} strokeWidth={2} trigger="none" />
        </m.span>
      </button>
    </span>
  )
}
