'use client'

import { useId, useMemo, useRef, useState, type ComponentProps, type CSSProperties, type KeyboardEvent } from 'react'
import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip'
import { useInView } from 'motion/react'
import { unitChartLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale, useDirection } from '@youj/core/lib/youj/provider'
import { cn, numberFormat, toneColor } from '../../lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

/* A count you can see one by one: each column is a bucket (an hour, a day, a
 * price band) and each dot in it is one unit, stacked from the baseline over
 * a faint grid of every dot the chart could hold, so the empty room reads as
 * part of the scale. Labels sit under the columns every few buckets.
 * - Highlight: a range of buckets stays in the tone; the rest go quiet, so a
 *   window (a service, a shift) stands out without losing the whole.
 * - Time runs from the inline start; in RTL the dots mirror (they hold no
 *   text) and the labels follow.
 * - Keyboard: one tab stop. The arrow keys walk the columns in the order
 *   they're drawn, Home and End go to the first and last; focus or hover
 *   shows the bucket's label and value.
 * - Semantics: a named group holding a list of the columns, each named with
 *   its label, value and whether it's highlighted, and a summary (how many
 *   columns, the total and the peak) as its description.
 * - Motion: when it scrolls into view the dots light column by column from
 *   the start, each from the baseline up, over the deliberate token. New data
 *   lights and darkens the dots that change in the same wave.
 * - Reduced motion: drawn in place; changes land at once. */

type UnitChartTone = 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

interface UnitChartBucket {
  /** Names the column, under it and when spoken: "11:00". */
  label: string
  value: number
}

interface UnitChartProps extends Omit<ComponentProps<'div'>, 'children'> {
  data: readonly UnitChartBucket[]
  /** How much one dot counts for. Default 1. */
  unit?: number
  /** The grid's height in dots. Default: the peak with some headroom; pass one to keep the scale still across data. */
  rows?: number
  /** The first and last index of the buckets to keep in the tone; the rest go quiet. */
  highlight?: readonly [number, number]
  /** The lit dots' color. Default 'accent'. */
  tone?: UnitChartTone
  /** Formats values in the tooltip and the spoken text. Default: the locale's number format. */
  formatValue?: (value: number) => string
  /** Accessible name of the chart. Default: the labels' "Unit chart". */
  label?: string
  /** Label every nth column. Default: about six labels across. */
  tickEvery?: number
}

/** The dot pitch and radius, in viewBox units. */
const PITCH = 10
const RADIUS = 3.3

function UnitChart({
  data,
  unit = 1,
  rows: rowsProp,
  highlight,
  tone = 'accent',
  formatValue,
  label,
  tickEvery,
  className,
  style,
  ...props
}: UnitChartProps) {
  const k = useYouj()
  const locale = useLocale()
  const rtl = useDirection() === 'rtl'
  const labels = useComponentLabels(unitChartLabels)
  const summaryId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const columnRefs = useRef<(HTMLDivElement | null)[]>([])
  const inView = useInView(rootRef, { once: true, amount: 0.3 })
  const shown = k.reduced || inView
  const [active, setActive] = useState(0)
  const [handle] = useState(() => TooltipPrimitive.createHandle<number>())

  const format = useMemo(() => formatValue ?? numberFormat(locale).format, [formatValue, locale])
  const per = unit > 0 ? unit : 1
  const { counts, rows, total, peak } = useMemo(() => {
    const counts = data.map((d) => Math.max(0, Math.round(d.value / per)))
    const top = Math.max(0, ...counts)
    const rows = Math.max(1, Math.round(rowsProp ?? Math.max(4, Math.ceil(top * 1.15))))
    const total = data.reduce((sum, d) => sum + Math.max(0, d.value), 0)
    const peak = counts.indexOf(top)
    return { counts, rows, total, peak }
  }, [data, per, rowsProp])

  const cols = data.length
  const inRange = (i: number) => !highlight || (i >= highlight[0] && i <= highlight[1])
  const every = Math.max(1, Math.round(tickEvery ?? Math.ceil(cols / 6)))
  const current = Math.min(active, Math.max(0, cols - 1))

  // The reveal: a wave over the columns, each lighting from the baseline up.
  const spread = k.reduced ? 0 : k.ms('deliberate')
  const colStep = cols ? (spread * 0.75) / cols : 0
  const rowStep = (spread * 0.25) / rows

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight'
    const back = rtl ? 'ArrowRight' : 'ArrowLeft'
    let next = -1
    if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = cols - 1
    else if (event.key === forward) next = Math.min(cols - 1, current + 1)
    else if (event.key === back) next = Math.max(0, current - 1)
    else return
    event.preventDefault()
    setActive(next)
    columnRefs.current[next]?.focus()
  }

  const empty = cols === 0 || total === 0
  const at = (i: number) => ((i + 0.5) / cols) * 100

  return (
    <>
      <div
        ref={rootRef}
        role="group"
        aria-label={label ?? labels.unitChart}
        aria-describedby={empty ? undefined : summaryId}
        data-slot="unit-chart"
        className={cn(
          'own:flex w-full min-w-0 flex-col gap-2',
          // An empty dot: a faint ink on light surfaces, recessed to the canvas in the dark.
          '[--unit-chart-off:color-mix(in_oklab,var(--color-canvas)_calc(100%*var(--yj-dark)),color-mix(in_oklab,var(--color-fg)_9%,transparent))]',
          className,
        )}
        style={{ '--unit-chart-tone': toneColor(tone, 'var(--color-fg)'), ...style } as CSSProperties}
        {...props}
      >
        {empty ? (
          <div
            data-slot="unit-chart-empty"
            className="own:grid aspect-[3/1] place-items-center own:rounded-md border border-dashed border-line own:text-ui own:text-fg-muted"
          >
            {labels.noData}
          </div>
        ) : (
          <>
            <div data-slot="unit-chart-plot" className="relative">
              {/* The columns: hit areas and tab stops, under the dots so a hovered one washes the band behind them. */}
              <div role="list" data-slot="unit-chart-columns" className="absolute inset-0" onKeyDown={onKeyDown}>
                {data.map((bucket, i) => (
                  <TooltipTrigger
                    key={i}
                    handle={handle}
                    payload={i}
                    delay={0}
                    closeDelay={0}
                    render={
                      <div
                        ref={(el: HTMLDivElement | null) => {
                          columnRefs.current[i] = el
                        }}
                        role="listitem"
                        tabIndex={i === current ? 0 : -1}
                        aria-label={labels.unitChartItem(bucket.label, format(bucket.value), Boolean(highlight) && inRange(i))}
                        data-slot="unit-chart-column"
                        data-highlighted={(highlight && inRange(i)) || undefined}
                        onFocus={() => setActive(i)}
                        className="absolute inset-y-0 own:rounded-xs outline-none transition-[background-color] yj-duration-fast ease-standard hover:bg-band focus-visible:bg-band focus-ring"
                        style={{ insetInlineStart: `${(i / cols) * 100}%`, width: `${100 / cols}%` }}
                      />
                    }
                  />
                ))}
              </div>
              <svg
                aria-hidden
                data-slot="unit-chart-dots"
                viewBox={`0 0 ${cols * PITCH} ${rows * PITCH}`}
                className="pointer-events-none relative own:block h-auto w-full rtl:-scale-x-100"
              >
                {counts.map((count, c) =>
                  Array.from({ length: rows }, (_, r) => {
                    const on = shown && r < count
                    const delay = Math.round(c * colStep + r * rowStep)
                    return (
                      <circle
                        key={`${c}-${r}`}
                        data-slot="unit-chart-dot"
                        data-state={on ? 'on' : 'off'}
                        cx={c * PITCH + PITCH / 2}
                        cy={(rows - 1 - r) * PITCH + PITCH / 2}
                        r={RADIUS}
                        className={cn(
                          !k.reduced && 'transition-[fill] yj-duration-fast ease-standard',
                          on ? (inRange(c) ? 'fill-(--unit-chart-tone)' : 'fill-(--color-chart-quiet)') : 'fill-(--unit-chart-off)',
                        )}
                        style={delay ? { transitionDelay: `${delay}ms` } : undefined}
                      />
                    )
                  }),
                )}
              </svg>
            </div>
            <div aria-hidden data-slot="unit-chart-axis" className="relative h-4 own:font-mono own:text-ui-xs own:text-fg-muted own:tabular-nums">
              {data.map((bucket, i) =>
                i % every === 0 ? (
                  <span
                    key={i}
                    data-slot="unit-chart-tick"
                    className={cn(
                      'absolute top-0 own:leading-none whitespace-nowrap',
                      at(i) < 6 ? '' : at(i) > 94 ? '-translate-x-full rtl:translate-x-full' : '-translate-x-1/2 rtl:translate-x-1/2',
                    )}
                    style={{ insetInlineStart: `${at(i) < 6 ? (i / cols) * 100 : at(i) > 94 ? ((i + 1) / cols) * 100 : at(i)}%` }}
                  >
                    {bucket.label}
                  </span>
                ) : null,
              )}
            </div>
            <p id={summaryId} data-slot="unit-chart-summary" className="sr-only">
              {labels.unitChartSummary(cols, format(total), data[peak]!.label, format(data[peak]!.value))}
            </p>
          </>
        )}
      </div>
      <Tooltip handle={handle}>
        {({ payload }) => {
          const bucket = typeof payload === 'number' ? data[payload] : undefined
          return bucket ? (
            <TooltipContent data-slot="unit-chart-tooltip" className="flex-col items-start gap-0.5 own:py-1.5">
              <span data-slot="unit-chart-tooltip-label">{bucket.label}</span>
              <span data-slot="unit-chart-tooltip-value" className="own:font-mono own:font-normal own:tabular-nums opacity-75">
                {format(bucket.value)}
              </span>
            </TooltipContent>
          ) : null
        }}
      </Tooltip>
    </>
  )
}

export { UnitChart, type UnitChartBucket, type UnitChartProps, type UnitChartTone }
