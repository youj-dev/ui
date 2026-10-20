'use client'

import { memo, useMemo, useRef, type ReactNode, type RefObject } from 'react'
import { m } from 'motion/react'
import { FlexRender, type Cell, type RowData } from '@tanstack/react-table'
import { useYouj } from '@youj/core'
import { PresenceItem } from '@youj/motion'
import { Checkbox } from '../../../components/ui/checkbox'
import {
  DATA_TABLE_SELECT_COLUMN_ID,
  DataTableCellEditor,
  dataTableColumnLabel,
  type DataTableColumnMeta,
  type DataTableFeatures,
  type DataTableRow,
} from '../../../components/ui/data-table'
import { cn } from '../../../lib/utils'
import { cellRing, edgeShadow, pinStyle, type ColumnLayout } from './head'

/** An optimistic edit in flight (saving), confirmed (saved) or rolled back (error). */
export interface PendingEdit {
  value: unknown
  status: 'saving' | 'saved' | 'error'
}
export type RowEdits = Readonly<Record<string, PendingEdit>>

/** Stable callbacks every row reaches through one prop, so memoized rows stay memoized. */
export interface BodyContext {
  toggleRow: (rowId: string, checked: boolean, shift: boolean) => void
  rowLabel: (rowId: string) => string
  /** The row checkbox's name: "Select ORD-1042". */
  selectLabel: (rowId: string) => string
  startEdit: (rowId: string, columnId: string) => void
  commitEdit: (rowId: string, columnId: string, value: unknown) => string | null
  tabEdit: (rowId: string, columnId: string, value: unknown, backward: boolean) => string | null
  cancelEdit: () => void
}

/** The callbacks rows call from their handlers, kept in a ref: the latest each commit. */
export type BodyHandlers = Omit<BodyContext, 'rowLabel' | 'selectLabel'>

/** One stable object for every row: the labels rows render with, and forwarders to the latest handlers in `ref`. */
export function useForwardedContext(ref: RefObject<BodyHandlers | null>, rowLabel: BodyContext['rowLabel'], selectLabel: BodyContext['selectLabel']): BodyContext {
  return useMemo<BodyContext>(
    () => ({
      toggleRow: (...args) => ref.current!.toggleRow(...args),
      rowLabel,
      selectLabel,
      startEdit: (...args) => ref.current!.startEdit(...args),
      commitEdit: (...args) => ref.current!.commitEdit(...args),
      tabEdit: (...args) => ref.current!.tabEdit(...args),
      cancelEdit: () => ref.current!.cancelEdit(),
    }),
    [ref, rowLabel, selectLabel],
  )
}

export interface BodyRowProps<TData extends RowData> {
  row: DataTableRow<TData>
  /** Index in the current row model: `data-dt-row`. */
  index: number
  ariaRowIndex: number
  selected: boolean
  selectable: boolean
  columns: readonly ColumnLayout[]
  fillerAt: number | null
  /** Rows animate in, out and between slots through PresenceList. Off when virtualized. */
  presence: boolean
  /** The column being edited in this row, and a character that started it. */
  editing: string | null
  typed?: string
  edits?: RowEdits
  ctx: BodyContext
}

/* Cell backgrounds are opaque (a hover or selected tint is mixed into the
 * surface, not layered over it), so a pinned cell hides what scrolls under
 * it and rows crossing during a re-sort occlude cleanly. Height follows the
 * density on the base token; a color change is quick. */
export const cellBase = cn(
  'relative h-(--dt-row-h) border-b border-line bg-(--dt-row-bg) own:px-3 align-middle own:text-ui',
  '[transition:background-color_var(--yj-duration-fast)_var(--ease-standard),height_calc(var(--yj-duration-base)*var(--yj-motion,1))_var(--ease-standard)]',
  cellRing,
  'scroll-mt-(--dt-head-h) scroll-ms-(--dt-pin-s) scroll-me-(--dt-pin-e)',
  // Edit feedback: a confirmed save glows success, a rollback glows danger.
  'data-[edit=saved]:bg-[color-mix(in_oklab,var(--dt-row-bg),var(--color-success)_14%)]',
  'data-[edit=error]:bg-[color-mix(in_oklab,var(--dt-row-bg),var(--color-danger)_14%)]',
)

const ALIGN = { start: 'own:text-start', center: 'own:text-center', end: 'own:text-end' } as const

function BodyRowView<TData extends RowData>({
  row,
  index,
  ariaRowIndex,
  selected,
  selectable,
  columns,
  fillerAt,
  presence,
  editing,
  typed,
  edits,
  ctx,
}: BodyRowProps<TData>) {
  const cells: ReactNode[] = row.getVisibleCells().map((cell, i) => {
    const layout = columns[i]!
    return (
      <BodyCell
        key={cell.id}
        cell={cell}
        layout={layout}
        index={index}
        selected={selected}
        selectable={selectable}
        editing={editing === cell.column.id}
        typed={editing === cell.column.id ? typed : undefined}
        edit={edits?.[cell.column.id]}
        ctx={ctx}
      />
    )
  })
  if (fillerAt !== null) cells.splice(fillerAt, 0, <td key="__filler" aria-hidden className={cellBase} />)

  const rowProps = {
    'data-slot': 'data-table-row',
    'data-row-id': row.id,
    'data-selected': selected || undefined,
    'aria-rowindex': ariaRowIndex,
    'aria-selected': selectable ? selected : undefined,
    className: cn(
      // Each row stacks as one: its pinned cells rise above its own scrolled
      // cells but never above a row gliding past it mid-animation. The row
      // being edited rises so the editor's message can overlap the next row.
      'group/row relative z-0 has-data-editing:z-1',
      'hover:[--dt-row-bg:var(--dt-row-hover)]',
      'data-selected:[--dt-row-bg:var(--dt-row-selected)] data-selected:hover:[--dt-row-bg:var(--dt-row-selected-hover)]',
    ),
  }
  return presence ? (
    <PresenceItem as="tr" {...rowProps}>
      {cells}
    </PresenceItem>
  ) : (
    <tr {...rowProps}>{cells}</tr>
  )
}

export const BodyRow = memo(BodyRowView) as typeof BodyRowView

function BodyCell<TData extends RowData>({
  cell,
  layout,
  index,
  selected,
  selectable,
  editing,
  typed,
  edit,
  ctx,
}: {
  cell: Cell<DataTableFeatures, TData, unknown>
  layout: ColumnLayout
  index: number
  selected: boolean
  selectable: boolean
  editing: boolean
  typed?: string
  edit?: PendingEdit
  ctx: BodyContext
}) {
  const column = cell.column
  const meta = column.columnDef.meta as DataTableColumnMeta | undefined
  const rowId = cell.row.id
  const isSelect = column.id === DATA_TABLE_SELECT_COLUMN_ID

  let content: ReactNode
  if (isSelect) {
    content = <RowCheckbox rowId={rowId} selected={selected} disabled={!selectable} label={ctx.selectLabel(rowId)} onToggle={ctx.toggleRow} />
  } else if (editing && meta?.editor) {
    content = (
      <DataTableCellEditor
        editor={meta.editor}
        value={cell.getValue()}
        typed={typed}
        label={`${dataTableColumnLabel(column)}, ${ctx.rowLabel(rowId)}`}
        onCommit={(value) => ctx.commitEdit(rowId, column.id, value)}
        onTab={(value, backward) => ctx.tabEdit(rowId, column.id, value, backward)}
        onCancel={ctx.cancelEdit}
      />
    )
  } else {
    content = <FlexRender cell={cell} />
    if (edit?.status === 'error') content = <Shake>{content}</Shake>
  }

  return (
    <td
      // Explicit: a td is a gridcell inside role="grid", but not every tool knows it.
      role="gridcell"
      data-dt-cell=""
      data-dt-row={index}
      data-dt-col={layout.index}
      data-numeric={layout.numeric || undefined}
      data-editable={layout.editable || undefined}
      data-editing={editing || undefined}
      data-edit={edit?.status}
      tabIndex={-1}
      aria-busy={edit?.status === 'saving' || undefined}
      style={pinStyle(layout)}
      onDoubleClick={layout.editable && !editing ? () => ctx.startEdit(rowId, column.id) : undefined}
      className={cn(
        cellBase,
        ALIGN[layout.align],
        layout.numeric && 'own:tabular-nums',
        editing ? 'z-5 overflow-visible' : !isSelect && 'truncate',
        isSelect && 'own:px-0',
        layout.pinned && 'sticky z-1',
        layout.edgeStart && edgeShadow.start,
        layout.edgeEnd && edgeShadow.end,
        layout.editable && !editing && 'cursor-text',
        layout.cellClassName,
      )}
    >
      {content}
      {edit?.status === 'saving' && <SavingLine />}
    </td>
  )
}

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
  onToggle: BodyContext['toggleRow']
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
        data-dt-focus=""
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

/** A rejected save: the old value is back, and it shakes once (4, 3, 2px) to say so. */
function Shake({ children }: { children: ReactNode }) {
  const k = useYouj()
  return (
    <m.span className="block truncate" animate={k.reduced ? undefined : { x: [0, -4, 4, -3, 3, -2, 2, 0] }} transition={k.tween('slow', 'standard')}>
      {children}
    </m.span>
  )
}

/** A save in flight: a hairline sweeping along the cell's bottom edge; still stripes when reduced. */
function SavingLine() {
  const k = useYouj()
  return (
    <span aria-hidden data-reduced-motion={k.reduced || undefined} className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 overflow-hidden">
      <span
        className={cn(
          'own:block h-full w-full origin-left animate-indeterminate bg-accent rtl:[animation-direction:reverse]',
          'reduced:animate-none reduced:bg-transparent reduced:bg-[repeating-linear-gradient(-45deg,var(--color-accent)_0_3px,transparent_3px_7px)]',
        )}
      />
    </span>
  )
}
