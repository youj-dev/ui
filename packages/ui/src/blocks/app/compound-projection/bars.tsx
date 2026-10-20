'use client'

import { m } from 'motion/react'
import { MotionFeatures } from '@youj/core'
import { growthForecastLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj } from '@youj/core/lib/youj/provider'
import { cn, numberFormat } from '../../../lib/utils'
import type { CompoundProjectionCopy } from './data'
import type { CompoundProjectionYear } from './project'

interface ProjectionBarsProps {
  rows: readonly CompoundProjectionYear[]
  copy: CompoundProjectionCopy
  /** Writes an amount. */
  format: (value: number) => string
}

/* One bar per year group, rising; the last is the highlighted one. A bar
 * shows its value on hover and on keyboard focus, and is read as its year,
 * its total and how much of it was added. Bars grow from the baseline
 * when they appear and glide to a new height when the plan changes. */
function ProjectionBars({ rows, copy, format }: ProjectionBarsProps) {
  const k = useYouj()
  const labels = useComponentLabels(growthForecastLabels)
  const count = numberFormat(copy.locale)
  const yearLabel = copy.year ?? labels.growthYear
  const max = Math.max(1, ...rows.map((r) => r.total))
  const spring = k.reduced ? { type: false as const } : k.tween('slow', 'standard')

  return (
    <MotionFeatures>
      <ul role="list" aria-label={copy.bars ?? labels.growthBars} data-slot="projection-bars" className="flex h-52 items-end gap-2 pt-7">
        {rows.map((row, i) => {
          const last = i === rows.length - 1
          return (
            <li key={row.year} className="group/bar flex h-full min-w-0 flex-1 flex-col justify-end">
              <div
                role="img"
                tabIndex={0}
                aria-label={(copy.bar ?? labels.growthBar)(yearLabel(count.format(row.year)), format(row.total), format(row.added))}
                className="relative flex h-full flex-col justify-end rounded-t-md focus-ring"
              >
                <span
                  aria-hidden
                  className={cn(
                    'pointer-events-none absolute z-10 rounded-md border border-line bg-overlay px-1.5 py-0.5 font-mono text-ui-xs whitespace-nowrap tabular-nums opacity-0 shadow-xs transition-opacity yj-duration-fast',
                    'group-hover/bar:opacity-100 group-focus-within/bar:opacity-100',
                    last ? 'end-0 opacity-100' : 'start-1/2 -translate-x-1/2',
                  )}
                  style={{ bottom: `calc(${(row.total / max) * 100}% + 4px)` }}
                >
                  {format(row.total)}
                </span>
                <m.div
                  initial={k.reduced ? false : { height: '0%' }}
                  animate={{ height: `${(row.total / max) * 100}%` }}
                  transition={spring}
                  className={cn(
                    'w-full rounded-t-xl rounded-b-sm',
                    last ? 'bg-accent' : 'bg-accent-subtle group-hover/bar:bg-accent-line group-focus-within/bar:bg-accent-line',
                  )}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </MotionFeatures>
  )
}

export { ProjectionBars }
