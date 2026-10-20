'use client'

import type { ComponentProps, ReactNode } from 'react'
import { Rows2Icon } from '@youj/icons/components/youj/icons/rows-2'
import { RowsIcon } from '@youj/icons/components/youj/icons/rows'
import { useComponentLabels } from '@youj/core/labels'
import { dataTableToolbarLabels } from '@youj/core/labels'
import { cn } from '../../../lib/utils'
import { ToggleGroup, ToggleGroupItem } from '../toggle-group'
import type { DataTableDensity } from './data-table-model'

export interface DataTableToolbarProps extends ComponentProps<'div'> {
  /** The controls at the end: view options, density, export, a primary action. */
  actions?: ReactNode
}

/**
 * The row above a table: the search and filters at the start, the view
 * controls at the end. Each side wraps on its own, so on a narrow screen the
 * end's controls drop below the start's instead of squeezing the search.
 */
export function DataTableToolbar({ actions, children, className, ...props }: DataTableToolbarProps) {
  return (
    <div data-slot="data-table-toolbar" className={cn('own:flex flex-wrap items-center own:gap-2', className)} {...props}>
      {/* Sized by its content, so the end's controls wrap below it rather than squeeze it. */}
      {children && <div className="own:flex min-w-0 flex-auto flex-wrap items-center gap-2">{children}</div>}
      {actions && <div className="ms-auto own:flex min-w-0 flex-wrap items-center justify-end gap-2">{actions}</div>}
    </div>
  )
}

/* One family on one sheet: four rows (rows' compact pose), three, two. Held still, so hovering never previews another density. */
const DENSITIES: ReadonlyArray<{
  value: DataTableDensity
  label: 'compactRows' | 'standardRows' | 'comfortableRows'
  Icon: typeof RowsIcon
  compact?: boolean
}> = [
  { value: 'compact', label: 'compactRows', Icon: RowsIcon, compact: true },
  { value: 'standard', label: 'standardRows', Icon: RowsIcon },
  { value: 'comfortable', label: 'comfortableRows', Icon: Rows2Icon },
]

/** Row density as a segmented control: one Tab stop, arrow keys between the three. */
export function DataTableDensityToggle({
  value,
  onValueChange,
  className,
}: {
  value: DataTableDensity
  onValueChange: (density: DataTableDensity) => void
  className?: string
}) {
  const labels = useComponentLabels(dataTableToolbarLabels)
  return (
    <ToggleGroup
      variant="segmented"
      size="sm"
      aria-label={labels.rowDensity}
      value={[value]}
      onValueChange={(next) => {
        const density = next[0] as DataTableDensity | undefined
        if (density) onValueChange(density)
      }}
      className={className}
    >
      {DENSITIES.map(({ value: density, label, Icon, compact }) => (
        <ToggleGroupItem key={density} value={density} aria-label={labels[label]} title={labels[label]} className="own:px-2">
          <Icon active={compact} trigger="none" />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
