'use client'

import type { RowData, SortingState } from '@tanstack/react-table'
import { ArrowDownIcon } from '@youj/icons/components/youj/icons/arrow-down'
import { ArrowUpIcon } from '@youj/icons/components/youj/icons/arrow-up'
import { ColumnsIcon } from '@youj/icons/components/youj/icons/columns'
import { LayersIcon } from '@youj/icons/components/youj/icons/layers'
import { RotateCcwIcon } from '@youj/icons/components/youj/icons/rotate-ccw'
import { SortIcon } from '@youj/icons/components/youj/icons/sort'
import { Button } from '../../../components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '../../../components/ui/popover'
import { SortableList, SortableListHandle, SortableListItem } from '../../../components/ui/sortable-list'
import { Switch } from '../../../components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../components/ui/tooltip'
import { cn } from '../../../lib/utils'
import { useCopy } from './copy'
import { columnLabel, isUtilityColumn, type DataGridColumn } from './model'

/* ── Grouping ────────────────────────────────────────────────────────────── */

export function GroupMenu<TData extends RowData>({
  columns,
  value,
  onValueChange,
  compact,
}: {
  columns: DataGridColumn<TData>[]
  value: string | null
  onValueChange: (id: string | null) => void
  compact?: boolean
}) {
  const labels = useCopy()
  const current = columns.find((column) => column.id === value)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant={current ? 'secondary' : 'ghost'} size={compact ? 'icon-sm' : 'sm'} aria-label={compact ? labels.groupBy : undefined}>
            <LayersIcon />
            {!compact && (current ? columnLabel(current) : labels.groupBy)}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuLabel>{labels.groupBy}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={value ?? ''} onValueChange={(next) => onValueChange(next ? String(next) : null)}>
          <DropdownMenuRadioItem value="">{labels.noGrouping}</DropdownMenuRadioItem>
          <DropdownMenuSeparator />
          {columns.map((column) => (
            <DropdownMenuRadioItem key={column.id} value={column.id}>
              {columnLabel(column)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ── Sort (the card layout has no headers to click) ──────────────────────── */

export function SortMenu<TData extends RowData>({
  columns,
  sorting,
  onSortingChange,
}: {
  columns: DataGridColumn<TData>[]
  sorting: SortingState
  onSortingChange: (sorting: SortingState) => void
}) {
  const labels = useCopy()
  const first = sorting[0]
  const current = columns.find((column) => column.id === first?.id)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant={current ? 'secondary' : 'ghost'} size="sm">
            <SortIcon />
            {current ? columnLabel(current) : labels.sortBy}
            {first && (first.desc ? <ArrowDownIcon className="own:size-3.5" /> : <ArrowUpIcon className="own:size-3.5" />)}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuLabel>{labels.sortBy}</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={first?.id ?? ''}
          onValueChange={(next) => onSortingChange(next ? [{ id: String(next), desc: first?.desc ?? false }] : [])}
        >
          {columns.map((column) => (
            <DropdownMenuRadioItem key={column.id} value={column.id}>
              {columnLabel(column)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        {first && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={first.desc ? 'desc' : 'asc'} onValueChange={(next) => onSortingChange([{ id: first.id, desc: next === 'desc' }])}>
              <DropdownMenuRadioItem value="asc">{labels.sortAscending}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="desc">{labels.sortDescending}</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ── Columns: show, hide and reorder ─────────────────────────────────────── */

/**
 * Every column with a switch to show or hide it and a grip to move it (drag,
 * or Space and the arrows). The order is the grid's column order; the
 * checkbox, expander and actions stay where they are.
 */
export function ColumnsMenu<TData extends RowData>({
  columns,
  order,
  onOrderChange,
  onReset,
  compact,
}: {
  columns: DataGridColumn<TData>[]
  order: string[]
  onOrderChange: (order: string[]) => void
  onReset: () => void
  compact?: boolean
}) {
  const labels = useCopy()
  const data = columns.filter((column) => !isUtilityColumn(column.id))
  const ids = [...order.filter((id) => data.some((c) => c.id === id)), ...data.map((c) => c.id).filter((id) => !order.includes(id))]
  const visible = data.filter((column) => column.getIsVisible()).length
  const trigger = (
    <Button variant="ghost" size={compact ? 'icon-sm' : 'sm'} aria-label={compact ? labels.columns : undefined}>
      <ColumnsIcon />
      {!compact && labels.columns}
    </Button>
  )
  return (
    <Popover>
      <PopoverTrigger render={trigger} />
      <PopoverContent align="end" className="w-64 gap-2 own:p-2">
        <div className="own:flex items-center justify-between own:ps-1.5">
          <PopoverTitle className="text-ui-sm font-medium own:text-fg-muted">{labels.toggleColumns}</PopoverTitle>
          <Tooltip>
            <TooltipTrigger render={<Button variant="ghost" size="icon-xs" aria-label={labels.resetColumns} onClick={onReset} />}>
              <RotateCcwIcon />
            </TooltipTrigger>
            <TooltipContent>{labels.resetColumns}</TooltipContent>
          </Tooltip>
        </div>
        <SortableList aria-label={labels.columns} value={ids} onValueChange={onOrderChange} className="gap-1">
          {ids.map((id) => {
            const column = data.find((c) => c.id === id)!
            const label = columnLabel(column)
            const shown = column.getIsVisible()
            return (
              <SortableListItem key={id} value={id} textValue={label} className="min-h-9 own:border-transparent own:bg-transparent own:py-1 own:ps-1 own:pe-2 hover:bg-hover">
                <SortableListHandle />
                <span className={cn('flex-1 truncate', !shown && 'own:text-fg-muted')}>{label}</span>
                <Switch
                  size="sm"
                  aria-label={label}
                  checked={shown}
                  // The last visible column stays: a grid with no columns says nothing.
                  disabled={!column.getCanHide() || (shown && visible === 1)}
                  onCheckedChange={(checked) => column.toggleVisibility(checked)}
                />
              </SortableListItem>
            )
          })}
        </SortableList>
      </PopoverContent>
    </Popover>
  )
}
