'use client'

import { useId } from 'react'
import { exportDialogLabels, useComponentLabels } from '@youj/core/labels'
import { ChevronDownIcon } from '@youj/icons/components/youj/icons/chevron-down'
import { cn } from '../../../lib/utils'
import { Button } from '../button'
import { Checkbox } from '../checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '../popover'

/* The Export Dialog's column chooser: a soft button that says how many columns
 * go out ("All 12", "8 of 12", "None") and opens a popover of checkboxes with
 * All and None above them. The list is a native checkbox group in a region of
 * its own height, so a long schema scrolls there and the dialog keeps its size. */

interface ExportColumn {
  /** Stable id, what `columns` in the request holds. */
  id: string
  /** The column's name as the file's header shows it. */
  label: string
}

interface ExportColumnsProps {
  columns: ExportColumn[]
  /** The chosen column ids. */
  value: string[]
  onValueChange: (value: string[]) => void
  disabled?: boolean
  /** The id of the row's label, which names the button along with its text. */
  labelledBy?: string
  className?: string
}

function ExportColumns({ columns, value, onValueChange, disabled, labelledBy, className }: ExportColumnsProps) {
  const labels = useComponentLabels(exportDialogLabels)
  const buttonId = useId()
  const chosen = columns.filter((column) => value.includes(column.id)).length
  const text =
    chosen === 0 ? labels.exportSelectNone : chosen === columns.length ? labels.exportColumnsAll(columns.length) : labels.exportColumnsSome(chosen, columns.length)
  const toggle = (id: string, on: boolean) => onValueChange(columns.map((column) => column.id).filter((c) => (c === id ? on : value.includes(c))))

  return (
    <Popover>
      <PopoverTrigger
        id={buttonId}
        disabled={disabled}
        aria-labelledby={labelledBy ? `${labelledBy} ${buttonId}` : undefined}
        data-slot="export-dialog-columns"
        className={cn(
          'flex h-control min-w-24 cursor-default items-center justify-between own:gap-2 own:rounded-md border own:border-transparent own:bg-well own:ps-2.5 own:pe-2 own:text-ui own:text-fg own:tabular-nums select-none',
          'transition-[background-color,border-color] yj-duration-fast ease-standard hover:bg-selected own:data-popup-open:bg-selected own:focus-field',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-well',
          className,
        )}
      >
        <span>{text}</span>
        <ChevronDownIcon size={16} strokeWidth={1.75} className="own:text-fg-muted" />
      </PopoverTrigger>
      <PopoverContent align="end" aria-label={labels.exportColumnsPick} className="w-64 gap-0 own:p-0">
        <div className="own:flex items-center justify-between gap-2 border-b border-line-subtle px-3 py-2">
          <span role="status" className="own:text-ui-sm own:font-medium own:text-fg-muted own:tabular-nums">{text}</span>
          <div className="own:flex gap-1">
            <Button variant="ghost" size="sm" disabled={chosen === columns.length} onClick={() => onValueChange(columns.map((column) => column.id))}>
              {labels.exportSelectAll}
            </Button>
            <Button variant="ghost" size="sm" disabled={chosen === 0} onClick={() => onValueChange([])}>
              {labels.exportSelectNone}
            </Button>
          </div>
        </div>
        <div role="group" aria-label={labels.columns} className="max-h-60 overflow-y-auto p-1 yj-scrollbar">
          {columns.map((column) => (
            <label key={column.id} className="flex h-control cursor-default items-center gap-2.5 rounded-md px-2 text-ui text-fg select-none hover:bg-hover">
              <Checkbox checked={value.includes(column.id)} onCheckedChange={(on) => toggle(column.id, on)} />
              <span className="min-w-0 truncate">{column.label}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { ExportColumns, type ExportColumn }
