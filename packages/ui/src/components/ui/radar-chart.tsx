'use client'

import { useId, useMemo, useRef, useState, type ComponentProps, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { m, useInView } from 'motion/react'
import { MotionFeatures } from '@youj/core'
import { radarChartLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import { cn, numberFormat, seriesColor } from '../../lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'

/* Several things scored on the same axes, one filled shape each: the shapes
 * overlap, so what one has more of than another reads at a glance. Values run
 * from zero at the center to `max` at the outer ring; the rings and spokes
 * are calm hairlines.
 * - Axes: `axes` are drawn clockwise from the top. An axis with a
 *   `description` explains itself in a tooltip when its label is hovered or
 *   focused (the sentence is also the label's accessible description) and
 *   lights its spoke.
 * - Reading a value: hovering or focusing a point names series, axis and
 *   value in a chip beside it, and lights that series. The plot is one tab
 *   stop; Left and Right walk the axes, Up and Down the series, Home and End
 *   go to the first and last axis, Escape lets go.
 * - Legend: one button per series; pressing it takes the series out of the
 *   plot and back (the shape folds to the center), hovering it lights it.
 * - Semantics: a named group whose points are spoken as "series, axis:
 *   value"; a visually hidden table holds the same numbers.
 * - Motion: when it scrolls into view every shape opens from the center over
 *   the deliberate token; new values and toggled series morph on the smooth
 *   spring. Reduced motion: drawn in place, changes land at once. */

type RadarChartTone = 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

interface RadarChartAxis {
  id: string
  /** The axis name, written at the end of its spoke. */
  label: string
  /** One sentence on what the axis measures, shown in a tooltip on its label. */
  description?: string
}

interface RadarChartSeries {
  id: string
  name: string
  /** One value per axis, in the order of `axes`. */
  values: readonly number[]
  /** Default: its color in `config`, else the chart colors in order. */
  tone?: RadarChartTone
}

interface RadarChartProps extends Omit<ComponentProps<'div'>, 'children'> {
  axes: readonly RadarChartAxis[]
  series: readonly RadarChartSeries[]
  /** The value at the outer ring. Default: the largest value rounded up to a round number. */
  max?: number
  /** How many rings divide the scale. Default 4. */
  rings?: number
  /** Formats values for the readout, the table and the spoken points. Default: the locale's number format. */
  formatValue?: (value: number, axis: RadarChartAxis) => string
  /** Default: the YoujProvider locale. */
  locale?: string
  /** Names the chart for assistive tech. Default: the labels' "Radar chart". */
  label?: string
  /** Show the legend under the plot. Default true. */
  legend?: boolean
  /** Rendered in place of the legend, e.g. your own series controls. */
  legendEnd?: ReactNode
  /** A ChartConfig shared with your other charts: a series whose id is a key takes its color, so one series matches across chart types. */
  config?: Readonly<Record<string, { color?: string }>>
}

const CHART_TONES: RadarChartTone[] = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5']
/** The plot is a 200 by 200 box centered on 100,100; the outer ring sits at RADIUS. */
const CENTER = 100
const RADIUS = 80
/** The plot's share of the stage: its height, and the half-widths that turn plot units into stage percent. */
const STAGE_X = 36.75
const STAGE_Y = 42
/** How far past the outer ring (in plot half-extents) an axis label's anchor sits. */
const LABEL_RADIUS = 0.9

const r2 = (n: number) => Math.round(n * 100) / 100

/** 1, 2, 2.5, 5 or 10 times a power of ten, at or above `value`. */
function niceCeil(value: number) {
  if (value <= 0) return 1
  const power = 10 ** Math.floor(Math.log10(value))
  const n = value / power
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * power
}

/** Where an axis points: clockwise from the top. */
function angleOf(index: number, count: number) {
  return -Math.PI / 2 + (index / count) * Math.PI * 2
}

function RadarChart({
  axes,
  series,
  max: maxProp,
  rings = 4,
  formatValue,
  locale: localeProp,
  label,
  legend = true,
  legendEnd,
  config,
  className,
  style,
  ...props
}: RadarChartProps) {
  const k = useYouj()
  const locale = useLocale(localeProp)
  const labels = useComponentLabels(radarChartLabels)
  const summaryId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const pointRefs = useRef(new Map<string, SVGCircleElement>())
  const inView = useInView(rootRef, { once: true, amount: 0.3 })
  const shown = k.reduced || inView
  const [played, setPlayed] = useState(false)
  const first = !k.reduced && !played

  const [off, setOff] = useState<readonly string[]>([])
  const [lit, setLit] = useState<string>()
  const [axisLit, setAxisLit] = useState<number>()
  const [point, setPoint] = useState<{ series: string; axis: number }>()
  const [live, setLive] = useState(false)
  const [focus, setFocus] = useState<{ series: string; axis: number }>()

  const count = axes.length
  const fmt = useMemo(
    () => formatValue ?? ((value: number) => numberFormat(locale, { maximumFractionDigits: 1 }).format(value)),
    [formatValue, locale],
  )
  const tones = useMemo(() => new Map(series.map((s, i) => [s.id, s.tone ?? (config?.[s.id]?.color ? undefined : CHART_TONES[i % CHART_TONES.length])])), [series, config])
  const colors = useMemo(() => new Map(series.map((s, i) => [s.id, seriesColor(s.tone, config, s.id, i, 'var(--color-fg-subtle)')])), [series, config])
  const visible = series.filter((s) => !off.includes(s.id))
  const largest = series.reduce((top, s) => Math.max(top, ...s.values), 0)
  const max = maxProp ?? niceCeil(largest)
  const ringCount = Math.max(1, Math.round(rings))

  /** Plot coordinates of `value` on axis `index`. */
  const at = (index: number, value: number) => {
    const a = angleOf(index, count)
    const r = (Math.min(Math.max(value, 0), max) / max) * RADIUS
    return { x: CENTER + Math.cos(a) * r, y: CENTER + Math.sin(a) * r }
  }
  const outline = (values: readonly number[]) =>
    values.length === 0 ? '' : `${values.map((v, i) => `${i ? 'L' : 'M'}${r2(at(i, v).x)},${r2(at(i, v).y)}`).join('')}Z`
  const collapsed = outline(axes.map(() => 0))
  /** A plot point as a place on the stage, in percent. */
  const stage = (x: number, y: number) => ({
    left: `${r2(50 + ((x - CENTER) / CENTER) * STAGE_X)}%`,
    top: `${r2(50 + ((y - CENTER) / CENTER) * STAGE_Y)}%`,
  })

  const current = (() => {
    if (focus && visible.some((s) => s.id === focus.series) && focus.axis < count) return focus
    const top = visible[0]
    return top ? { series: top.id, axis: 0 } : undefined
  })()

  const activate = (target: { series: string; axis: number } | undefined) => {
    if (!target) return
    setFocus(target)
    pointRefs.current.get(`${target.series}:${target.axis}`)?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<SVGGElement>) => {
    if (!current || visible.length === 0) return
    const row = visible.findIndex((s) => s.id === current.series)
    let next: { series: string; axis: number } | undefined
    if (event.key === 'ArrowRight') next = { series: current.series, axis: (current.axis + 1) % count }
    else if (event.key === 'ArrowLeft') next = { series: current.series, axis: (current.axis + count - 1) % count }
    else if (event.key === 'ArrowDown') next = { series: visible[Math.min(visible.length - 1, row + 1)]!.id, axis: current.axis }
    else if (event.key === 'ArrowUp') next = { series: visible[Math.max(0, row - 1)]!.id, axis: current.axis }
    else if (event.key === 'Home') next = { series: current.series, axis: 0 }
    else if (event.key === 'End') next = { series: current.series, axis: count - 1 }
    else if (event.key === 'Escape') {
      setLive(false)
      return
    } else return
    event.preventDefault()
    activate(next)
  }

  const glide = k.reduced ? { type: false as const } : k.spring('smooth')
  const reveal = first ? k.tween('deliberate', 'emphasized') : glide
  const readout = point ? series.find((s) => s.id === point.series) : undefined
  const readoutAxis = point ? axes[point.axis] : undefined
  const readoutValue = readout && point ? (readout.values[point.axis] ?? 0) : 0
  const readoutAt = readout && point ? at(point.axis, readoutValue) : undefined
  const highlighted = live && point ? point.series : lit

  const toggle = (id: string) => setOff((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]))

  return (
    <MotionFeatures>
      <TooltipProvider delay={200}>
        <div
          ref={rootRef}
          role="group"
          aria-label={label ?? labels.radarChart}
          data-slot="radar-chart"
          className={cn('own:flex w-full min-w-0 flex-col gap-3', className)}
          style={style}
          {...props}
        >
          {count < 3 || series.length === 0 ? (
            <div
              data-slot="radar-chart-empty"
              className="own:grid aspect-[8/7] place-items-center own:rounded-md border border-dashed border-line own:text-ui own:text-fg-muted"
            >
              {labels.noData}
            </div>
          ) : (
            <>
              <div data-slot="radar-chart-stage" className="own:relative own:mx-auto aspect-[8/7] w-full max-w-xl">
                <svg
                  viewBox="0 0 200 200"
                  data-slot="radar-chart-plot"
                  className="own:absolute inset-y-[8%] start-1/2 aspect-square h-[84%] -translate-x-1/2 overflow-visible rtl:translate-x-1/2"
                >
                  {Array.from({ length: ringCount }, (_, i) => {
                    const f = (i + 1) / ringCount
                    const ring = Array.from({ length: count }, (_, a) => at(a, max * f))
                    return (
                      <polygon
                        key={i}
                        data-slot="radar-chart-ring"
                        points={ring.map((p) => `${r2(p.x)},${r2(p.y)}`).join(' ')}
                        fill="none"
                        className={i === ringCount - 1 ? 'stroke-line' : 'stroke-line-subtle'}
                        strokeWidth={1}
                        vectorEffect="non-scaling-stroke"
                      />
                    )
                  })}
                  {axes.map((axis, a) => {
                    const end = at(a, max)
                    return (
                      <line
                        key={axis.id}
                        data-slot="radar-chart-spoke"
                        data-active={axisLit === a || undefined}
                        x1={CENTER}
                        y1={CENTER}
                        x2={r2(end.x)}
                        y2={r2(end.y)}
                        className={cn(
                          'transition-[stroke] yj-duration-fast ease-standard',
                          axisLit === a ? 'stroke-fg-subtle' : 'stroke-line-subtle',
                        )}
                        strokeWidth={1}
                        vectorEffect="non-scaling-stroke"
                      />
                    )
                  })}
                  {series.map((s) => {
                    const tone = tones.get(s.id)
                    const hidden = off.includes(s.id)
                    const drawn = shown && !hidden
                    const quiet = highlighted !== undefined && highlighted !== s.id
                    return (
                      <g
                        key={s.id}
                        data-slot="radar-chart-series"
                        data-state={hidden ? 'hidden' : 'shown'}
                        data-tone={tone}
                        className={cn(
                          'transition-opacity yj-duration-fast ease-standard',
                          hidden ? 'opacity-0' : quiet ? 'opacity-30' : 'opacity-100',
                        )}
                        style={{ '--radar-chart-tone': colors.get(s.id) } as CSSProperties}
                      >
                        <m.path
                          initial={k.reduced ? false : { d: collapsed }}
                          animate={{ d: drawn ? outline(s.values) : collapsed }}
                          transition={reveal}
                          onAnimationComplete={() => (drawn ? setPlayed(true) : undefined)}
                          className="fill-(--radar-chart-tone) stroke-(--radar-chart-tone)"
                          fillOpacity={highlighted === s.id ? 0.2 : 0.1}
                          strokeWidth={1.5}
                          strokeLinejoin="round"
                          vectorEffect="non-scaling-stroke"
                        />
                      </g>
                    )
                  })}
                  <g
                    data-slot="radar-chart-points"
                    onKeyDown={onKeyDown}
                    onBlur={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setLive(false)
                    }}
                  >
                    {visible.flatMap((s) => {
                      const color = colors.get(s.id)
                      return axes.map((axis, a) => {
                        const value = s.values[a] ?? 0
                        const p = at(a, value)
                        const key = `${s.id}:${a}`
                        const isActive = live && point?.series === s.id && point.axis === a
                        const text = `${s.name}, ${axis.label}: ${fmt(value, axis)}`
                        return (
                          <g key={key} className="group/point" style={{ '--radar-chart-tone': color } as CSSProperties}>
                            <m.circle
                              ref={(el: SVGCircleElement | null) => {
                                if (el) pointRefs.current.set(key, el)
                                else pointRefs.current.delete(key)
                              }}
                              role="img"
                              aria-label={text}
                              tabIndex={current?.series === s.id && current.axis === a ? 0 : -1}
                              data-slot="radar-chart-point"
                              initial={k.reduced ? false : { cx: CENTER, cy: CENTER }}
                              animate={{ cx: shown ? r2(p.x) : CENTER, cy: shown ? r2(p.y) : CENTER }}
                              transition={reveal}
                              r={6}
                              className="fill-transparent outline-none"
                              onPointerEnter={() => {
                                setPoint({ series: s.id, axis: a })
                                setLive(true)
                              }}
                              onPointerLeave={() => setLive(false)}
                              onFocus={() => {
                                setFocus({ series: s.id, axis: a })
                                setPoint({ series: s.id, axis: a })
                                setLive(true)
                              }}
                            />
                            <m.circle
                              aria-hidden
                              pointerEvents="none"
                              initial={k.reduced ? false : { cx: CENTER, cy: CENTER }}
                              animate={{ cx: shown ? r2(p.x) : CENTER, cy: shown ? r2(p.y) : CENTER }}
                              transition={reveal}
                              r={isActive ? 3.4 : 2.2}
                              className="fill-(--radar-chart-tone) stroke-canvas transition-[r] yj-duration-fast ease-standard"
                              strokeWidth={1}
                            />
                            <m.circle
                              aria-hidden
                              pointerEvents="none"
                              initial={k.reduced ? false : { cx: CENTER, cy: CENTER }}
                              animate={{ cx: shown ? r2(p.x) : CENTER, cy: shown ? r2(p.y) : CENTER }}
                              transition={reveal}
                              r={7}
                              fill="none"
                              strokeWidth={2}
                              data-slot="radar-chart-point-focus"
                              className="stroke-focus opacity-0 group-has-[circle:focus-visible]/point:opacity-100"
                            />
                          </g>
                        )
                      })
                    })}
                  </g>
                </svg>

                {axes.map((axis, a) => {
                  const angle = angleOf(a, count)
                  const cos = Math.cos(angle)
                  const sin = Math.sin(angle)
                  const place = stage(CENTER + cos * CENTER * LABEL_RADIUS, CENTER + sin * CENTER * LABEL_RADIUS)
                  const x = cos > 0.3 ? '0%' : cos < -0.3 ? '-100%' : '-50%'
                  const y = sin < -0.6 ? '-100%' : sin > 0.6 ? '0%' : '-50%'
                  const align = cos > 0.3 ? 'own:text-start' : cos < -0.3 ? 'own:text-end' : 'own:text-center'
                  const common = cn(
                    'own:absolute own:max-w-30 own:text-ui-sm own:leading-snug text-balance transition-[color] yj-duration-fast ease-standard',
                    align,
                    axisLit === a ? 'own:text-fg' : 'own:text-fg-muted',
                  )
                  const box = { ...place, translate: `${x} ${y}` } as CSSProperties
                  return axis.description ? (
                    <Tooltip key={axis.id}>
                      <TooltipTrigger
                        data-slot="radar-chart-axis"
                        aria-describedby={`${summaryId}-${axis.id}`}
                        className={cn(common, 'cursor-default own:rounded-sm outline-none focus-ring')}
                        style={box}
                        onPointerEnter={() => setAxisLit(a)}
                        onPointerLeave={() => setAxisLit(undefined)}
                        onFocus={() => setAxisLit(a)}
                        onBlur={() => setAxisLit(undefined)}
                      >
                        {axis.label}
                      </TooltipTrigger>
                      <TooltipContent side={sin < -0.6 ? 'top' : sin > 0.6 ? 'bottom' : cos > 0 ? 'right' : 'left'}>
                        <span className="own:flex flex-col gap-0.5">
                          <span className="own:font-medium">{axis.label}</span>
                          <span className="own:text-fg-muted own:font-normal">{axis.description}</span>
                        </span>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <span key={axis.id} data-slot="radar-chart-axis" className={common} style={box}>
                      {axis.label}
                    </span>
                  )
                })}

                <div
                  aria-hidden
                  data-slot="radar-chart-readout"
                  data-yj-tone="inverse"
                  data-state={live ? 'open' : 'closed'}
                  className={cn(
                    'pointer-events-none own:absolute z-10 own:flex w-max max-w-56 items-center gap-2 own:rounded-md own:px-2 own:py-1 own:text-ui-sm',
                    'bg-inverse text-fg shadow-sm transition-opacity yj-duration-fast ease-standard',
                    live ? 'opacity-100' : 'opacity-0',
                  )}
                  style={
                    {
                      ...(readoutAt ? stage(readoutAt.x, readoutAt.y) : {}),
                      translate: '-50% calc(-100% - 10px)',
                      '--radar-chart-tone': colors.get(readout?.id ?? '') ?? 'var(--color-fg-subtle)',
                    } as CSSProperties
                  }
                >
                  <span data-slot="radar-chart-swatch" className="own:size-2 shrink-0 own:rounded-full bg-(--radar-chart-tone)" />
                  <span className="own:text-fg-muted">
                    {readout?.name} · {readoutAxis?.label}
                  </span>
                  <span className="own:font-medium own:tabular-nums">{readoutAxis ? fmt(readoutValue, readoutAxis) : ''}</span>
                </div>
              </div>

              {(legend || legendEnd) && (
                <div data-slot="radar-chart-legend-row" className="own:flex flex-wrap items-center justify-center gap-1">
                  {legend && (
                    <ul data-slot="radar-chart-legend" className="own:flex flex-wrap items-center justify-center gap-1">
                      {series.map((s) => {
                        const hidden = off.includes(s.id)
                        return (
                          <li key={s.id}>
                            <button
                              type="button"
                              aria-pressed={!hidden}
                              data-slot="radar-chart-legend-item"
                              data-state={hidden ? 'hidden' : 'shown'}
                              onClick={() => toggle(s.id)}
                              onPointerEnter={() => setLit(s.id)}
                              onPointerLeave={() => setLit(undefined)}
                              onFocus={() => setLit(s.id)}
                              onBlur={() => setLit(undefined)}
                              className={cn(
                                'own:inline-flex h-control-sm items-center gap-2 own:rounded-control-sm own:px-2.5 own:text-ui-sm outline-none focus-ring',
                                'transition-[background-color,color] yj-duration-fast ease-standard hover:bg-hover',
                                hidden ? 'own:text-fg-subtle' : 'own:text-fg',
                              )}
                              style={{ '--radar-chart-tone': colors.get(s.id) } as CSSProperties}
                            >
                              <span
                                aria-hidden
                                data-slot="radar-chart-swatch"
                                className={cn(
                                  'own:size-2.5 shrink-0 own:rounded-full transition-[background-color,box-shadow] yj-duration-fast ease-standard',
                                  hidden ? 'bg-transparent shadow-[inset_0_0_0_1.5px_var(--radar-chart-tone)]' : 'bg-(--radar-chart-tone)',
                                )}
                              />
                              {s.name}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                  {legendEnd}
                </div>
              )}

              <div hidden>
                {axes.map((axis) => (
                  <span key={axis.id} id={`${summaryId}-${axis.id}`}>
                    {axis.description}
                  </span>
                ))}
              </div>
              <div className="sr-only">
                <table data-slot="radar-chart-table">
                  <caption>{label ?? labels.radarChart}</caption>
                  <thead>
                    <tr>
                      <th scope="col">{labels.radarChartAxis}</th>
                      {series.map((s) => (
                        <th key={s.id} scope="col">
                          {s.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {axes.map((axis, a) => (
                      <tr key={axis.id}>
                        <th scope="row">{axis.label}</th>
                        {series.map((s) => (
                          <td key={s.id}>{fmt(s.values[a] ?? 0, axis)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </TooltipProvider>
    </MotionFeatures>
  )
}

export { RadarChart, type RadarChartAxis, type RadarChartProps, type RadarChartSeries, type RadarChartTone }
