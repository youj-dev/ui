'use client'

import { Fragment, useRef, type ComponentType, type ReactNode, type RefObject } from 'react'
import { ArrowDownIcon } from '@youj/icons/components/youj/icons/arrow-down'
import { ArrowLeftIcon } from '@youj/icons/components/youj/icons/arrow-left'
import { ArrowRightIcon } from '@youj/icons/components/youj/icons/arrow-right'
import { ArrowUpIcon } from '@youj/icons/components/youj/icons/arrow-up'
import { ChevronDownIcon } from '@youj/icons/components/youj/icons/chevron-down'
import { ColumnsIcon } from '@youj/icons/components/youj/icons/columns'
import { EyeOffIcon } from '@youj/icons/components/youj/icons/eye-off'
import { MoreHorizontalIcon } from '@youj/icons/components/youj/icons/more-horizontal'
import { PinIcon } from '@youj/icons/components/youj/icons/pin'
import { PinOffIcon } from '@youj/icons/components/youj/icons/pin-off'
import { RotateCcwIcon } from '@youj/icons/components/youj/icons/rotate-ccw'
import { XIcon } from '@youj/icons/components/youj/icons/x'
import type { RowData } from '@tanstack/react-table'
import { useComponentLabels } from '@youj/core/labels'
import { dataTableColumnsLabels } from '@youj/core/labels'
import { cn } from '../../../lib/utils'
import { Button } from '../button'
import { Checkbox } from '../checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '../dropdown-menu'
import { useDataTableReturnFocus } from './data-table-grid-nav'
import {
  SELECT_COLUMN_ID,
  columnLabel,
  type DataTableColumn,
  type DataTableColumnDef,
  type DataTableFeatures,
  type DataTableInstance,
} from './data-table-model'
import type { CellContext } from '@tanstack/react-table'

/* ── Column order ────────────────────────────────────────────────────────── */

/** Every leaf column id in its current order (the columnOrder state applied to the definitions). */
function orderedIds<TData extends RowData>(table: DataTableInstance<TData>) {
  const ids = table.getAllLeafColumns().map((column) => column.id)
  const order = table.atoms.columnOrder.get() ?? []
  return [...order.filter((id) => ids.includes(id)), ...ids.filter((id) => !order.includes(id))]
}

/**
 * Moves a column one visible step within its region (start-pinned, center or
 * end-pinned), skipping hidden columns. The checkbox column never moves.
 */
export function moveColumn<TData extends RowData>(table: DataTableInstance<TData>, column: DataTableColumn<TData>, step: -1 | 1) {
  const region = column.getIsPinned()
  const visible = table.getVisibleLeafColumns().filter((c) => c.getIsPinned() === region && c.id !== SELECT_COLUMN_ID)
  const at = visible.findIndex((c) => c.id === column.id)
  const neighbour = visible[at + step]
  if (!neighbour) return false
  const ids = orderedIds(table)
  const from = ids.indexOf(column.id)
  const to = ids.indexOf(neighbour.id)
  ids.splice(from, 1)
  ids.splice(to, 0, column.id)
  table.setColumnOrder(ids)
  return true
}

function canMove<TData extends RowData>(table: DataTableInstance<TData>, column: DataTableColumn<TData>, step: -1 | 1) {
  const region = column.getIsPinned()
  const visible = table.getVisibleLeafColumns().filter((c) => c.getIsPinned() === region && c.id !== SELECT_COLUMN_ID)
  const at = visible.findIndex((c) => c.id === column.id)
  return at !== -1 && visible[at + step] !== undefined
}

/* ── A column's own menu, from its header ────────────────────────────────── */

/**
 * The menu behind a header's chevron: sort, pin, move and hide that column.
 * It opens from the pointer, or from the keyboard with Alt+↓ (or Shift+F10)
 * on the header; closing returns focus to the header's sort button.
 */
export function DataTableColumnMenu<TData extends RowData>({
  table,
  column,
  open,
  onOpenChange,
  returnFocus,
}: {
  table: DataTableInstance<TData>
  column: DataTableColumn<TData>
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The header's own control, focused again when the menu closes. */
  returnFocus?: RefObject<HTMLElement | null>
}) {
  const label = columnLabel(column)
  const sorted = column.getIsSorted()
  const pinned = column.getIsPinned()
  const canSort = column.getCanSort()
  const canPin = column.getCanPin()
  const canHide = column.getCanHide() && table.getVisibleLeafColumns().filter((c) => c.id !== SELECT_COLUMN_ID).length > 1
  const finalFocus = useDataTableReturnFocus(returnFocus)
  const labels = useComponentLabels(dataTableColumnsLabels)
  return (
    <DropdownMenu open={open} onOpenChange={(next) => onOpenChange(next)} modal={false}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            tabIndex={-1}
            aria-label={labels.columnOptions(label)}
            className={cn(
              'own:text-fg-muted opacity-0 transition-opacity',
              'group-hover/head:opacity-100 group-has-[:focus-visible]/head:opacity-100 data-popup-open:opacity-100 touch:opacity-100',
            )}
          />
        }
      >
        <ChevronDownIcon className="own:size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48" finalFocus={finalFocus}>
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        {canSort && (
          <>
            {/* From the menu the column takes over the sort; Shift+click on the header adds to it. */}
            <DropdownMenuRadioGroup value={sorted || ''} onValueChange={(value) => column.toggleSorting(value === 'desc', false)}>
              <DropdownMenuRadioItem value="asc" closeOnClick>
                <ArrowUpIcon trigger="none" />
                {labels.sortAscending}
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="desc" closeOnClick>
                <ArrowDownIcon trigger="none" />
                {labels.sortDescending}
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            {sorted && (
              <DropdownMenuItem onClick={() => column.clearSorting()}>
                <XIcon />
                {labels.clearSort}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
          </>
        )}
        {canPin && column.id !== SELECT_COLUMN_ID && (
          <>
            <DropdownMenuRadioGroup value={pinned || 'none'} onValueChange={(value) => column.pin(value === 'none' ? false : (value as 'start' | 'end'))}>
              <DropdownMenuRadioItem value="start" closeOnClick>
                <PinIcon />
                {labels.pinToStart}
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="end" closeOnClick>
                <PinIcon className="-scale-x-100" />
                {labels.pinToEnd}
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="none" closeOnClick>
                <PinOffIcon />
                {labels.unpinned}
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem disabled={!canMove(table, column, -1)} onClick={() => moveColumn(table, column, -1)}>
          <ArrowLeftIcon className="rtl:-scale-x-100" />
          {labels.moveLeft}
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!canMove(table, column, 1)} onClick={() => moveColumn(table, column, 1)}>
          <ArrowRightIcon className="rtl:-scale-x-100" />
          {labels.moveRight}
        </DropdownMenuItem>
        {canHide && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
              <EyeOffIcon />
              {labels.hideColumn}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ── Which columns show ──────────────────────────────────────────────────── */

/** The toolbar's column list: show or hide each one (the menu stays open while you toggle), or reset the layout. */
export function DataTableViewOptions<TData extends RowData>({ table }: { table: DataTableInstance<TData> }) {
  const columns = table.getAllLeafColumns().filter((column) => column.getCanHide() && column.id !== SELECT_COLUMN_ID)
  const visibleCount = columns.filter((column) => column.getIsVisible()).length
  const hidden = columns.length - visibleCount
  const labels = useComponentLabels(dataTableColumnsLabels)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
        <ColumnsIcon />
        {labels.columns}
        {hidden > 0 && <span className="own:text-fg-muted own:tabular-nums">{labels.hiddenColumns(hidden)}</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuLabel>{labels.toggleColumns}</DropdownMenuLabel>
        {orderedIds(table)
          .map((id) => columns.find((column) => column.id === id))
          .filter((column) => column !== undefined)
          .map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={column.getIsVisible()}
              // The last visible column stays: a table with no columns shows nothing.
              disabled={column.getIsVisible() && visibleCount === 1}
              onCheckedChange={(checked) => column.toggleVisibility(checked)}
            >
              {columnLabel(column)}
            </DropdownMenuCheckboxItem>
          ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            table.resetColumnVisibility(true)
            table.resetColumnOrder(true)
            table.resetColumnPinning()
            table.resetColumnSizing(true)
          }}
        >
          <RotateCcwIcon />
          {labels.resetColumns}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ── Row selection ───────────────────────────────────────────────────────── */

function SelectAllHeader<TData extends RowData>({ table }: { table: DataTableInstance<TData> }) {
  const labels = useComponentLabels(dataTableColumnsLabels)
  const all = table.getIsAllPageRowsSelected()
  return (
    <span className="own:flex items-center justify-center">
      <Checkbox
        aria-label={labels.selectAllOnPage}
        checked={all}
        indeterminate={!all && table.getIsSomePageRowsSelected()}
        onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked)}
      />
    </span>
  )
}

function SelectRowCell<TData extends RowData>({ ctx, label }: { ctx: CellContext<DataTableFeatures, TData, unknown>; label: string }) {
  const labels = useComponentLabels(dataTableColumnsLabels)
  const row = ctx.row
  return (
    <span className="own:flex items-center justify-center">
      <Checkbox
        aria-label={labels.selectRow(label)}
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onCheckedChange={(checked) => row.toggleSelected(checked)}
      />
    </span>
  )
}

/**
 * A checkbox column for a table you compose yourself: the header's checkbox
 * selects the page (indeterminate while some rows are), each row's selects the
 * row. `label` names the row in its checkbox ("Select ORD-1042"). Its id is
 * DATA_TABLE_SELECT_COLUMN_ID, so the column menus and the Columns menu leave it alone.
 */
export function createSelectColumn<TData extends RowData>({ label }: { label: (row: TData) => string }): DataTableColumnDef<TData> {
  return {
    id: SELECT_COLUMN_ID,
    size: 44,
    minSize: 44,
    maxSize: 44,
    enableSorting: false,
    enableResizing: false,
    enableHiding: false,
    enablePinning: false,
    enableColumnFilter: false,
    enableGlobalFilter: false,
    header: (ctx) => <SelectAllHeader table={ctx.table as DataTableInstance<TData>} />,
    cell: (ctx: CellContext<DataTableFeatures, TData, unknown>) => <SelectRowCell ctx={ctx} label={label(ctx.row.original)} />,
    meta: { label: 'Selection', exportable: false, skeleton: 'check', align: 'center', cellClassName: 'own:px-0', headerClassName: 'own:px-0' },
  }
}

/* ── Row actions ─────────────────────────────────────────────────────────── */

export interface DataTableRowAction {
  label: string
  icon?: ComponentType<{ className?: string }>
  onSelect: () => void
  /** Tints the row red: deleting, revoking, leaving. */
  destructive?: boolean
  disabled?: boolean
  shortcut?: string
  /** Draws a separator above this action. */
  separated?: boolean
}

/** The ⋯ button at a row's end and its menu. Its name carries the row: "Actions for ORD-1042". */
export function DataTableRowActions({ label, actions, children }: { label: string; actions: DataTableRowAction[]; children?: ReactNode }) {
  const trigger = useRef<HTMLButtonElement>(null)
  const finalFocus = useDataTableReturnFocus(trigger)
  const labels = useComponentLabels(dataTableColumnsLabels)
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={
          <Button
            ref={trigger}
            variant="ghost"
            size="icon-xs"
            data-dt-focus=""
            tabIndex={-1}
            aria-label={labels.rowActions(label)}
            className="own:text-fg-muted own:data-popup-open:bg-hover own:data-popup-open:text-fg"
          />
        }
      >
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44" finalFocus={finalFocus}>
        {actions.map((action, i) => (
          <Fragment key={action.label}>
            {action.separated && i > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem variant={action.destructive ? 'danger' : 'default'} disabled={action.disabled} onClick={action.onSelect}>
              {action.icon && <action.icon />}
              {action.label}
              {action.shortcut && <DropdownMenuShortcut>{action.shortcut}</DropdownMenuShortcut>}
            </DropdownMenuItem>
          </Fragment>
        ))}
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ActionsHeader() {
  return <span className="sr-only">{useComponentLabels(dataTableColumnsLabels).actions}</span>
}

/**
 * A column of row menus, pinned to the end by convention. `label` names the
 * row in each trigger's accessible name; `actions` lists what a row offers.
 */
export function createRowActionsColumn<TData extends RowData>({
  id = 'actions',
  label,
  actions,
}: {
  id?: string
  label: (row: TData) => string
  actions: (row: TData) => DataTableRowAction[]
}): DataTableColumnDef<TData> {
  return {
    id,
    size: 48,
    minSize: 48,
    maxSize: 48,
    enableSorting: false,
    enableResizing: false,
    enableHiding: false,
    // It stays where the table puts it (pin it to the end in the initial state): no header menu.
    enablePinning: false,
    enableColumnFilter: false,
    enableGlobalFilter: false,
    header: () => <ActionsHeader />,
    cell: (ctx: CellContext<DataTableFeatures, TData, unknown>) => (
      <span className="own:flex justify-center">
        <DataTableRowActions label={label(ctx.row.original)} actions={actions(ctx.row.original)} />
      </span>
    ),
    meta: { label: 'Actions', exportable: false, skeleton: 'none', align: 'center', cellClassName: 'own:px-0 overflow-visible' },
  }
}
