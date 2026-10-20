'use client'

import { useId, useMemo, useRef, useState, type ComponentProps, type CSSProperties, type KeyboardEvent } from 'react'
import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip'
import { useInView } from 'motion/react'
import { densityLanesLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale, useDirection } from '@youj/core/lib/youj/provider'
import { cn, numberFormat, seriesColor } from '../../lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

/* When things happen, one lane per kind: each lane is a row of columns (the
 * hours of a day, say) over a faint grid of dots, and each column swells
 * above and below the lane's spine by its value, so a lane's busy hours read
 * as a bulge and the lanes compare on one scale. Each lane's name sits at its
 * start with its share of the total under it.
 * - Highlight: column ranges (off-hours, a shift) stay in each lane's tone;
 *   the rest go quiet, so a window stands out without losing the whole.
 * - Marker: a dashed rule through every lane at one column, flagged above
 *   the plot (the peak, a deploy).
 * - Size: the dots grow with the width up to `maxDot` (16px apart); past it
 *   a lane holds its height and its columns spread apart, so a wide page
 *   never makes the lanes tall.
 * - Keyboard: one tab stop, the ARIA grid pattern. Left and Right walk the
 *   columns (mirrored in RTL), Up and Down the lanes, Home and End go to a
 *   lane's ends; focus or hover shows the lane, the column and its value,
 *   and marks the column through every lane.
 * - Semantics: a named grid with a row per lane (its header the lane's name
 *   and share), every cell named with its column and value, and a summary
 *   (the lanes, the total and the busiest column) as its description.
 * - Motion: when it scrolls into view the dots light column by column from
 *   the start over the deliberate token; a new highlight recolors on the fast
 *   token. Reduced motion: drawn in place; changes land at once. */

type DensityLanesTone = 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

interface DensityLane {
  id: string
  label: string
  /** One value per column, in the order of `columns`. */
  values: readonly number[]
  /** Default: its color in `config`, else the chart colors in order. */
  tone?: DensityLanesTone
}

interface DensityLanesTick {
  /** A column edge: 0 is the start of the first column, `columns.length` the end of the last. */
  at: number
  label: string
}

interface DensityLanesProps extends Omit<ComponentProps<'div'>, 'children'> {
  lanes: readonly DensityLane[]
  /** Names each column, in its tooltip and spoken: "12:30". */
  columns: readonly string[]
  /** How many dots a column can swell above and below the spine. Default 4. */
  depth?: number
  /** The largest a dot grows, in px from one dot to the next. Past it a wide plot stops growing taller and its columns spread apart. Default 16. */
  maxDot?: number
  /** The value at full swell, one scale for every lane. Default: the largest value. */
  max?: number
  /** Column ranges, first and last index, kept in each lane's tone; the rest go quiet. */
  highlight?: readonly (readonly [number, number])[]
  /** A dashed rule through every lane at one column, with a flag above it. */
  marker?: { column: number; label: string }
  /** Labels under the plot at column edges. Default: a label at each quarter, from `columns`. */
  ticks?: readonly DensityLanesTick[]
  /** Each lane's share of the total under its name. Default true. */
  shares?: boolean
  /** Formats values in the tooltip and the spoken text. Default: the locale's number format. */
  formatValue?: (value: number) => string
  /** Default: the YoujProvider locale. */
  locale?: string
  /** Accessible name of the chart. Default: the labels' "Density lanes". */
  label?: string
  /** A ChartConfig shared with your other charts: a lane whose id is a key takes its color, so one series matches across chart types. */
  config?: Readonly<Record<string, { color?: string }>>
}

/** The dot pitch and radius, in viewBox units. */
const PITCH = 10
const RADIUS = 3.1

function DensityLanes({
  lanes,
  columns,
  depth: depthProp = 4,
  maxDot = 16,
  max: maxProp,
  highlight,
  marker,
  ticks: ticksProp,
  shares = true,
  formatValue,
  locale: localeProp,
  label,
  config,
  className,
  style,
  ...props
}: DensityLanesProps) {
  const k = useYouj()
  const locale = useLocale(localeProp)
  const rtl = useDirection() === 'rtl'
  const labels = useComponentLabels(densityLanesLabels)
  const id = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const cellRefs = useRef(new Map<string, HTMLDivElement>())
  const inView = useInView(rootRef, { once: true, amount: 0.3 })
  const shown = k.reduced || inView
  const [focus, setFocus] = useState<[number, number]>([0, 0])
  const [active, setActive] = useState<[number, number]>()
  const [handle] = useState(() => TooltipPrimitive.createHandle<string>())

  const cols = columns.length
  const depth = Math.max(1, Math.round(depthProp))
  const rows = depth * 2 + 1
  const format = useMemo(() => formatValue ?? numberFormat(locale).format, [formatValue, locale])
  const percent = numberFormat(locale, { style: 'percent', maximumFractionDigits: 0 })
  const value = (lane: DensityLane, c: number) => Math.max(0, lane.values[c] ?? 0)
  const top = maxProp ?? Math.max(0, ...lanes.flatMap((lane) => columns.map((_, c) => value(lane, c))))
  const totals = lanes.map((lane) => columns.reduce((sum, _, c) => sum + value(lane, c), 0))
  const total = totals.reduce((a, b) => a + b, 0)
  const byColumn = columns.map((_, c) => lanes.reduce((sum, lane) => sum + value(lane, c), 0))
  const peak = byColumn.indexOf(Math.max(...byColumn))
  const inRange = (c: number) => !highlight || highlight.some(([a, b]) => c >= a && c <= b)
  const swell = (v: number) => (v <= 0 || top <= 0 ? -1 : Math.min(depth, Math.round((v / top) * depth)))
  const empty = cols === 0 || lanes.length === 0 || total === 0

  const ticks =
    ticksProp ?? (cols ? Array.from({ length: 4 }, (_, i) => Math.round((i * cols) / 4)).map((at) => ({ at, label: columns[at] ?? '' })) : [])
  const spread = k.reduced ? 0 : k.ms('deliberate')
  const step = cols ? spread / cols : 0

  const [focusLane, focusCol] = [Math.min(focus[0], lanes.length - 1), Math.min(focus[1], cols - 1)]
  const move = (lane: number, col: number) => {
    setFocus([lane, col])
    cellRefs.current.get(`${lane}:${col}`)?.focus()
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight'
    const back = rtl ? 'ArrowRight' : 'ArrowLeft'
    if (event.key === forward) move(focusLane, Math.min(cols - 1, focusCol + 1))
    else if (event.key === back) move(focusLane, Math.max(0, focusCol - 1))
    else if (event.key === 'ArrowDown') move(Math.min(lanes.length - 1, focusLane + 1), focusCol)
    else if (event.key === 'ArrowUp') move(Math.max(0, focusLane - 1), focusCol)
    else if (event.key === 'Home') move(focusLane, 0)
    else if (event.key === 'End') move(focusLane, cols - 1)
    else return
    event.preventDefault()
  }
  const at = (c: number) => `${(c / cols) * 100}%`
  // Every row is placed: the flag (with a marker) first, then a row per lane, then the axis; the marker's rule spans the flag and the lanes.
  const first = marker ? 2 : 1
  const toneOf = (lane: DensityLane, i: number) => seriesColor(lane.tone, config, lane.id, i, 'var(--color-fg-muted)')

  if (empty)
    return (
      <div
        role="group"
        aria-label={label ?? labels.densityLanes}
        data-slot="density-lanes"
        className={cn('own:w-full', className)}
        style={style}
        {...props}
      >
        <div
          data-slot="density-lanes-empty"
          className="own:grid aspect-[3/1] place-items-center own:rounded-md border border-dashed border-line own:text-ui own:text-fg-muted"
        >
          {labels.noData}
        </div>
      </div>
    )

  return (
    <>
      <div
        ref={rootRef}
        data-slot="density-lanes"
        className={cn(
          'own:w-full min-w-0',
          // An empty dot: a faint ink on light surfaces, recessed to the canvas in the dark.
          '[--density-lanes-off:color-mix(in_oklab,var(--color-canvas)_calc(100%*var(--yj-dark)),color-mix(in_oklab,var(--color-fg)_9%,transparent))]',
          className,
        )}
        style={style}
        {...props}
      >
        <svg aria-hidden width={0} height={0} className="absolute">
          <defs>
            <pattern id={`${id}-off`} width={PITCH} height={PITCH} patternUnits="userSpaceOnUse">
              <circle cx={PITCH / 2} cy={PITCH / 2} r={RADIUS * 0.8} className="fill-(--density-lanes-off)" />
            </pattern>
          </defs>
        </svg>
        <div
          role="grid"
          aria-label={label ?? labels.densityLanes}
          aria-describedby={`${id}-summary`}
          data-slot="density-lanes-grid"
          onKeyDown={onKeyDown}
          className="own:grid grid-cols-[auto_minmax(0,1fr)] own:gap-x-3 own:gap-y-2"
        >
          {marker && (
            <div aria-hidden data-slot="density-lanes-flag-row" className="relative col-start-2 row-start-1 h-7">
              <span
                data-slot="density-lanes-flag"
                data-yj-tone="inverse"
                className={cn(
                  'absolute top-0 own:rounded-md own:px-2 own:py-1 own:font-mono own:text-ui-xs whitespace-nowrap bg-inverse own:text-fg own:tabular-nums shadow-sm',
                  marker.column / cols < 0.2
                    ? ''
                    : marker.column / cols > 0.8
                      ? '-translate-x-full rtl:translate-x-full'
                      : '-translate-x-1/2 rtl:translate-x-1/2',
                )}
                style={{ insetInlineStart: at(marker.column + (marker.column / cols < 0.2 ? 0 : marker.column / cols > 0.8 ? 1 : 0.5)) }}
              >
                {marker.label}
              </span>
            </div>
          )}
          {lanes.map((lane, l) => {
            const tone = toneOf(lane, l)
            return (
              <div
                key={lane.id}
                role="row"
                data-slot="density-lanes-lane"
                className="col-span-2 col-start-1 own:grid grid-cols-subgrid items-center"
                style={{ gridRow: first + l }}
              >
                <div role="rowheader" data-slot="density-lanes-label" className="own:flex min-w-0 flex-col own:text-ui own:leading-tight">
                  <span className="truncate own:text-fg-muted">{lane.label}</span>
                  {shares && (
                    <span className="own:font-mono own:text-ui own:text-fg own:tabular-nums">{percent.format(total ? totals[l]! / total : 0)}</span>
                  )}
                </div>
                <div
                  data-slot="density-lanes-plot"
                  className="relative w-full"
                  style={{ '--density-lanes-tone': tone, aspectRatio: `${cols} / ${rows}`, maxHeight: rows * maxDot } as CSSProperties}
                >
                  {active && (
                    <span
                      aria-hidden
                      data-slot="density-lanes-band"
                      className="absolute inset-y-0 own:rounded-xs bg-band"
                      style={{ insetInlineStart: at(active[1]), width: at(1) }}
                    />
                  )}
                  {columns.map((_, c) => {
                    const n = swell(value(lane, c))
                    const lit = inRange(c)
                    // A column of its own: past `maxDot` the lane stops growing taller, and the columns spread apart with round dots.
                    return (
                      <svg
                        key={c}
                        aria-hidden
                        viewBox={`0 0 ${PITCH} ${rows * PITCH}`}
                        className="absolute inset-y-0 h-full overflow-visible"
                        style={{ insetInlineStart: at(c), width: at(1) }}
                      >
                        <rect width={PITCH} height={rows * PITCH} fill={`url(#${id}-off)`} />
                        {n >= 0 && (
                          <g
                            data-slot="density-lanes-column"
                            data-highlighted={(highlight && lit) || undefined}
                            className={cn(
                              !k.reduced && 'transition-[opacity,fill] yj-duration-fast ease-standard',
                              lit ? 'fill-(--density-lanes-tone)' : 'fill-(--color-chart-quiet)',
                            )}
                            style={{ opacity: shown ? 1 : 0, transitionDelay: shown && step ? `${Math.round(c * step)}ms` : undefined }}
                          >
                            {Array.from({ length: n * 2 + 1 }, (_, i) => (
                              <circle key={i} cx={PITCH / 2} cy={(depth - n + i) * PITCH + PITCH / 2} r={RADIUS} />
                            ))}
                          </g>
                        )}
                      </svg>
                    )
                  })}
                  <div data-slot="density-lanes-cells" className="absolute inset-0">
                    {columns.map((column, c) => {
                      const key = `${l}:${c}`
                      return (
                        <TooltipTrigger
                          key={c}
                          handle={handle}
                          payload={key}
                          delay={0}
                          closeDelay={0}
                          render={
                            <div
                              ref={(el: HTMLDivElement | null) => {
                                if (el) cellRefs.current.set(key, el)
                                else cellRefs.current.delete(key)
                              }}
                              role="gridcell"
                              tabIndex={l === focusLane && c === focusCol ? 0 : -1}
                              aria-label={labels.unitChartItem(column, format(value(lane, c)), Boolean(highlight) && inRange(c))}
                              data-slot="density-lanes-cell"
                              onFocus={() => {
                                setFocus([l, c])
                                setActive([l, c])
                              }}
                              onBlur={() => setActive(undefined)}
                              onPointerEnter={() => setActive([l, c])}
                              onPointerLeave={() => setActive(undefined)}
                              className="absolute inset-y-0 own:rounded-xs outline-none focus-ring"
                              style={{ insetInlineStart: at(c), width: at(1) }}
                            />
                          }
                        />
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
          <div
            aria-hidden
            data-slot="density-lanes-axis"
            className="relative col-start-2 h-4 own:font-mono own:text-ui-xs own:text-fg-muted own:tabular-nums"
            style={{ gridRow: first + lanes.length }}
          >
            {ticks.map((tick) => (
              <span
                key={`${tick.at}-${tick.label}`}
                data-slot="density-lanes-tick"
                className={cn(
                  'absolute top-0 own:leading-none whitespace-nowrap',
                  tick.at <= 0 ? '' : tick.at >= cols ? '-translate-x-full rtl:translate-x-full' : '-translate-x-1/2 rtl:translate-x-1/2',
                )}
                style={{ insetInlineStart: at(tick.at) }}
              >
                {tick.label}
              </span>
            ))}
          </div>
          {marker && (
            <span
              aria-hidden
              data-slot="density-lanes-marker"
              className="pointer-events-none relative col-start-2"
              style={{ gridRow: `1 / ${first + lanes.length}` }}
            >
              <span
                className="absolute top-7 bottom-0 w-0 border-s border-dashed border-fg-subtle"
                style={{ insetInlineStart: at(marker.column + 0.5) }}
              />
              <span className="absolute top-6.25 own:-ms-0.75 size-1.5 rounded-full bg-fg" style={{ insetInlineStart: at(marker.column + 0.5) }} />
            </span>
          )}
        </div>
        <p id={`${id}-summary`} data-slot="density-lanes-summary" className="sr-only">
          {labels.densityLanesSummary(lanes.length, format(total), columns[peak] ?? '', format(byColumn[peak] ?? 0))}
        </p>
      </div>
      <Tooltip handle={handle}>
        {({ payload }) => {
          if (typeof payload !== 'string') return null
          const [l, c] = payload.split(':').map(Number) as [number, number]
          const lane = lanes[l]
          if (!lane) return null
          return (
            <TooltipContent data-slot="density-lanes-tooltip" className="flex-col items-start gap-0.5 own:py-1.5">
              <span className="own:flex items-center gap-1.5">
                <span aria-hidden className="own:size-2 own:rounded-xs" style={{ background: toneOf(lane, l) }} />
                {lane.label}
              </span>
              <span className="own:font-mono own:font-normal own:tabular-nums opacity-75">
                {columns[c]} · {format(value(lane, c))}
              </span>
            </TooltipContent>
          )
        }}
      </Tooltip>
    </>
  )
}

export { DensityLanes, type DensityLane, type DensityLanesProps, type DensityLanesTick, type DensityLanesTone }
