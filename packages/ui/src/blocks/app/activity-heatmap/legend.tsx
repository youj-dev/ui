'use client'

import { useYouj } from '@youj/core'
import { cn } from '../../../lib/utils'

/* Less → More: a swatch per step, each a toggle that lights only its cells
 * (press it again for all of them). Pointing at a step, or focusing it,
 * previews it. The swatches are the cells' size with a 24px target. */

export interface Step {
  level: number
  /** For assistive tech and the line under the grid: "Days with 29–33 orders". */
  name: string
}

interface LegendProps {
  steps: Step[]
  fill: (level: number) => string
  picked: number | null
  onPick: (level: number | null) => void
  onPreview: (level: number | null) => void
  copy: { legend: string; less: string; more: string }
}

function Legend({ steps, fill, picked, onPick, onPreview, copy }: LegendProps) {
  const k = useYouj()
  return (
    <div role="group" aria-label={copy.legend} data-slot="activity-heatmap-legend" className="flex shrink-0 items-center gap-1.5 text-ui-xs text-fg-muted" onPointerLeave={() => onPreview(null)}>
      <span aria-hidden>{copy.less}</span>
      <span className="flex items-center gap-1">
        {steps.map((step) => (
          <button
            key={step.level}
            type="button"
            aria-pressed={picked === step.level}
            aria-label={step.name}
            data-yj-level={step.level}
            className={cn(
              'relative size-3 rounded-xs outline-hidden focus-ring before:absolute before:-inset-1.5',
              'transition-[scale,box-shadow] ease-standard yj-duration-fast',
              !k.reduced && 'hover:scale-125',
              'aria-pressed:ring-[1.5px] aria-pressed:ring-fg aria-pressed:ring-offset-1 aria-pressed:ring-offset-surface',
            )}
            style={{ backgroundColor: fill(step.level) }}
            onPointerEnter={() => onPreview(step.level)}
            onFocus={() => onPreview(step.level)}
            onBlur={() => onPreview(null)}
            onClick={() => onPick(picked === step.level ? null : step.level)}
          />
        ))}
      </span>
      <span aria-hidden>{copy.more}</span>
    </div>
  )
}

export { Legend }
