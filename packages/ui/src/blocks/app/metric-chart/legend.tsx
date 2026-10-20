'use client'

import type { CSSProperties, MouseEvent } from 'react'
import { cn } from '../../../lib/utils'

/* The legend is the chart's switchboard and its readout: one toggle per
 * series (and one for the period before), each with its swatch, its name and
 * its figure: the range's total, or the bucket under the crosshair while one
 * is picked. A press hides or shows that series (its band folds away and the
 * stack settles); Alt-press shows it alone, or everything again. A hidden
 * series keeps its place, its swatch hollow and its words quiet. */

export interface LegendItem {
  id: string
  label: string
  color: string
  value: string
  visible: boolean
  /** The period before: a dashed swatch. */
  dashed?: boolean
}

interface LegendProps {
  items: LegendItem[]
  label: string
  onToggle: (id: string, alone: boolean) => void
}

function Legend({ items, label, onToggle }: LegendProps) {
  return (
    <div role="group" aria-label={label} data-slot="metric-chart-legend" className="-mx-2 flex flex-wrap gap-x-0.5 gap-y-1">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-pressed={item.visible}
          data-slot="metric-chart-series"
          onClick={(event: MouseEvent) => onToggle(item.id, event.altKey)}
          className={cn(
            'group/series inline-flex h-control-sm min-w-0 items-center gap-2 rounded-md px-2 text-ui-sm outline-hidden focus-ring',
            'transition-colors yj-duration-fast ease-standard hover:bg-hover',
          )}
          style={{ '--swatch': item.color } as CSSProperties}
        >
          <span
            aria-hidden
            className={cn(
              'size-2.5 shrink-0 rounded-xs border-[1.5px] border-(--swatch) transition-colors yj-duration-fast ease-standard',
              item.dashed ? 'border-dashed' : item.visible && 'bg-(--swatch)',
            )}
          />
          <span className={cn('truncate transition-colors yj-duration-fast ease-standard', item.visible ? 'text-fg-muted' : 'text-fg-subtle line-through decoration-line-strong')}>
            {item.label}
          </span>
          <span className={cn('font-medium tabular-nums transition-colors yj-duration-fast ease-standard', item.visible ? 'text-fg' : 'text-fg-subtle')}>{item.value}</span>
        </button>
      ))}
    </div>
  )
}

export { Legend }
