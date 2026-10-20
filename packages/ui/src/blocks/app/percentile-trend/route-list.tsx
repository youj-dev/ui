'use client'

import { ShareBar } from '../../../components/ui/share-bar'
import { Eyebrow } from '../../../components/ui/typography'
import { cn, numberFormat } from '../../../lib/utils'
import type { PercentileTrendCopy, PercentileTrendItem } from './data'
import { VOICE } from './headline'

interface RouteListProps {
  items: PercentileTrendItem[]
  /** The target, in the figures' unit. */
  target: number
  /** Writes a value as text. Default: milliseconds, in the locale. */
  format?: (value: number) => string
  copy: PercentileTrendCopy
  /** The section heading. Default h3. */
  headingAs?: 'h2' | 'h3' | 'h4'
}

/** A filled well, a step below the section in dark and a gray wash in light. */
const WELL = 'bg-[color-mix(in_oklab,var(--color-canvas)_calc(45%*var(--yj-dark)),color-mix(in_oklab,var(--color-fg)_3%,transparent))]'
const DOT = {
  ok: 'bg-success shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-success)_22%,transparent)]',
  slow: 'bg-warning shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-warning)_22%,transparent)]',
}

/* Wide lists keep a route to one line. A narrow one (beside other panels, or
 * on a phone) gives the method and path a line of their own, and sets the
 * bar, the share over and the p99 on the line under it, so the path never
 * truncates to its first letter. The full route is the row's tooltip. */
const ROW = cn(
  'grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-2 rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] px-4 py-3',
  '@min-[32rem]/routes:grid-cols-[auto_minmax(0,1fr)_--spacing(24)_--spacing(18)_--spacing(16)] @min-[32rem]/routes:gap-x-4',
)
/** Placement in the one-line layout, from the container's wide size up. */
const WIDE = '@min-[32rem]/routes:row-start-1'

/** Each route as a well: its method and path in mono, how much of it runs over the objective (cells scaled to the worst route) and its p99. */
function RouteList({ items, target, format, copy, headingAs: Heading = 'h3' }: RouteListProps) {
  const ms = numberFormat(copy.locale, { style: 'unit', unit: 'millisecond', unitDisplay: 'short', maximumFractionDigits: 0 })
  const percent = numberFormat(copy.locale, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const worst = Math.max(...items.map((r) => r.over), 0.01)

  return (
    <section aria-label={copy.items} data-slot="percentile-trend-routes" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <Eyebrow render={<Heading />} className={cn('text-ui-sm text-fg-muted', VOICE)}>
          {copy.items}
        </Eyebrow>
        <Eyebrow className={cn('text-ui-sm text-fg-muted', VOICE)}>{copy.itemColumns}</Eyebrow>
      </div>
      <ul className="@container/routes flex flex-col gap-2">
        {items.map((route) => {
          const status = route.value > target ? 'slow' : 'ok'
          return (
            <li key={route.id} data-status={status} title={route.prefix ? `${route.prefix} ${route.name}` : route.name} className={cn(ROW, WELL)}>
              <span aria-hidden className={cn('size-2 shrink-0 rounded-full', DOT[status])} />
              <span className="col-span-3 flex min-w-0 items-baseline gap-2.5 font-mono @min-[32rem]/routes:col-span-1">
                {route.prefix && <span className="w-10 shrink-0 text-ui-sm text-fg-muted">{route.prefix}</span>}
                <span dir="ltr" className="truncate text-ui-lg text-fg">
                  {route.name}
                </span>
              </span>
              <ShareBar
                value={route.over}
                max={worst}
                segments={12}
                tone={status === 'slow' ? 'warning' : 'neutral'}
                className={cn('col-start-2 row-start-2 w-full @min-[32rem]/routes:col-start-3', WIDE)}
              />
              <span
                className={cn(
                  'col-start-3 row-start-2 text-end font-mono text-ui-sm text-fg-muted tabular-nums @min-[32rem]/routes:col-start-4 @min-[32rem]/routes:text-ui',
                  WIDE,
                )}
              >
                {copy.overShare(percent.format(route.over))}
              </span>
              <span
                className={cn(
                  'col-start-4 row-start-2 text-end font-mono text-ui-lg tabular-nums @min-[32rem]/routes:col-start-5',
                  WIDE,
                  status === 'slow' ? 'text-warning-text' : 'text-fg',
                )}
              >
                {(format ?? ms.format)(route.value)}
              </span>
              <span className="sr-only">, {copy.status[status]}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export { RouteList }
