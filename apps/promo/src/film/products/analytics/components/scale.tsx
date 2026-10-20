import { cn } from '@youj/react/lib/utils'
import { short } from '../format'

/* A horizontal money scale shared by the bridge and the products: whole
 * steps, dashed gridlines behind every row, labels on top. */

export interface Scale {
  ticks: number[]
  /** Where a value sits along the track, 0 to 1. */
  at: (v: number) => number
}

/** A scale over `values`, rounded out to whole `step`s with a little air; `floor` pins its start. */
export function scaleFor(values: number[], step: number, air: number, floor?: number): Scale {
  const lo = floor ?? Math.floor((Math.min(...values) - air) / step) * step
  const hi = Math.ceil((Math.max(...values) + air) / step) * step
  const ticks: number[] = []
  for (let t = lo; t <= hi; t += step) ticks.push(t)
  return { ticks, at: (v) => (v - lo) / (hi - lo) }
}

/** Gridlines behind every row of a figure, and their labels on top. `row` is the figure's grid: its second column is the track. */
export function ScaleGrid({ scale, row, inset = '' }: { scale: Scale; row: string; inset?: string }) {
  return (
    <>
      <div aria-hidden className={cn(row, 'pointer-events-none absolute inset-0', inset)}>
        <span />
        <span className="relative h-full">
          {scale.ticks.map((t) => (
            <span key={t} className="absolute inset-y-0 border-s border-dashed border-line" style={{ insetInlineStart: `${scale.at(t) * 100}%` }} />
          ))}
        </span>
      </div>
      <div aria-hidden className={cn(row, 'pb-1', inset)}>
        <span />
        <span className="relative h-4">
          {scale.ticks.map((t, i) =>
            // More than four ticks is too many labels for a narrow column: label every other one.
            scale.ticks.length > 4 && i % 2 === 1 ? null : (
              <span
                key={t}
                className={cn(
                  'absolute top-0 text-ui-xs text-fg-muted tabular-nums',
                  i === 0 ? '' : i === scale.ticks.length - 1 ? '-translate-x-full rtl:translate-x-full' : '-translate-x-1/2 rtl:translate-x-1/2',
                )}
                style={{ insetInlineStart: `${scale.at(t) * 100}%` }}
              >
                {short(t)}
              </span>
            ),
          )}
        </span>
      </div>
    </>
  )
}
