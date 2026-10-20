'use client'

import { useId, useMemo, useRef, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { Area, CartesianGrid, ComposedChart, Line, ReferenceArea, XAxis, YAxis } from 'recharts'
import { ChartContainer, useChartMotion, type ChartConfig } from '../../../components/ui/chart'
import { cn } from '../../../lib/utils'
import { Annotations } from './annotations'
import type { Annotation, MetricChartCopy } from './data'

/* The chart and everything laid over it. Recharts draws the grid, the axes,
 * the stacked bands, the period before (dashed) and the hatch over a bucket
 * still filling; it re-renders only when the data or the visible series
 * change. Over the plot, in the same coordinates (the margins and axis sizes
 * below), sit the annotation lane, each annotation's guide, and the
 * crosshair with a dot on every band: those move on every pointer move or
 * key press without touching the chart. Time reads left to right in either
 * direction of text. */

export interface Row {
  key: string
  /** The bucket's date as the axis writes it. */
  tick: string
  /** Each series' reading, `s0`, `s1`…; a hidden series reads 0, so its band folds away. */
  [series: `s${number}`]: number
  /** The period before, for the visible series. */
  previous?: number
}

const MARGIN_TOP = 8
const LANE = 22
const MARGIN_END = 12
const Y_WIDTH = 46
const X_HEIGHT = 26

interface PlotProps {
  rows: Row[]
  config: ChartConfig
  /** Series keys (`s0`…) in stack order, with whether each is shown. */
  bands: { key: `s${number}`; visible: boolean }[]
  showPrevious: boolean
  partial: boolean
  yTop: number
  ticks: number[]
  annotations: Map<number, Annotation[]>
  /** The bucket under the crosshair. */
  active: number | null
  onActiveChange: (index: number | null) => void
  onAnnotationSelect?: (annotation: Annotation) => void
  tickValue: (value: number) => string
  /** A bucket's date in full ("Fri, Oct 3"), and its readout for the slider. */
  dateOf: (index: number) => string
  pointText: (index: number) => string
  title: string
  summary: string
  copy: MetricChartCopy
  className?: string
}

function Plot({
  rows,
  config,
  bands,
  showPrevious,
  partial,
  yTop,
  ticks,
  annotations,
  active,
  onActiveChange,
  onAnnotationSelect,
  tickValue,
  dateOf,
  pointText,
  title,
  summary,
  copy,
  className,
}: PlotProps) {
  const motion = useChartMotion()
  const hatch = `hatch-${useId().replace(/:/g, '')}`
  const n = rows.length
  const top = MARGIN_TOP + (annotations.size ? LANE : 0)
  const plotBox: CSSProperties = { top, bottom: X_HEIGHT, insetInlineStart: Y_WIDTH, insetInlineEnd: MARGIN_END }
  const xOf = (i: number) => (n > 1 ? (i / (n - 1)) * 100 : 50)
  const yOf = (v: number) => (1 - Math.min(1, Math.max(0, v / (yTop || 1)))) * 100

  // The chart itself, rebuilt only when what it draws changes: the crosshair moves over it.
  const tickOf = useMemo(() => new Map(rows.map((r) => [r.key, r.tick])), [rows])
  const chart = useMemo(
    () => (
      <ComposedChart data={rows} margin={{ top, right: MARGIN_END, bottom: 0, left: 0 }} accessibilityLayer={false}>
        <defs>
          {/* Stripes in the card's own colour cut through the bands: the bucket isn't finished. */}
          <pattern id={hatch} patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="5" stroke="var(--color-surface)" strokeWidth="2" />
          </pattern>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="key" tickFormatter={(key: string) => tickOf.get(key) ?? ''} tickLine={false} axisLine={false} tickMargin={8} minTickGap={28} height={X_HEIGHT} interval="preserveStartEnd" />
        <YAxis domain={[0, yTop]} ticks={ticks} tickFormatter={tickValue} tickLine={false} axisLine={false} width={Y_WIDTH} allowDataOverflow />
        {bands.map(({ key, visible }) => (
          <Area
            key={key}
            dataKey={key}
            stackId="total"
            type="monotone"
            stroke={visible ? `var(--color-${key})` : 'transparent'}
            strokeWidth={1.75}
            fill={`var(--color-${key})`}
            fillOpacity={visible ? 0.16 : 0}
            dot={false}
            activeDot={false}
            {...motion.draw(0)}
          />
        ))}
        <Line
          dataKey="previous"
          type="monotone"
          stroke="var(--color-previous)"
          strokeOpacity={showPrevious ? 1 : 0}
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={false}
          activeDot={false}
          {...motion.draw(1)}
        />
        {partial && n > 1 && <ReferenceArea x1={rows[n - 2]!.key} x2={rows[n - 1]!.key} fill={`url(#${hatch})`} zIndex={150} ifOverflow="hidden" />}
      </ComposedChart>
    ),
    [rows, n, tickOf, bands, showPrevious, partial, yTop, ticks, top, tickValue, hatch, motion],
  )

  const ref = useRef<HTMLDivElement>(null)
  const indexAt = (clientX: number) => {
    const box = ref.current?.getBoundingClientRect()
    if (!box || box.width <= 0 || n < 1) return null
    return Math.round(Math.min(1, Math.max(0, (clientX - box.left) / box.width)) * (n - 1))
  }
  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' && event.buttons === 0) return
    const i = indexAt(event.clientX)
    if (i !== null && i !== active) onActiveChange(i)
  }
  const keys = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = n - 1
    const from = active ?? last
    const next =
      event.key === 'ArrowRight' || event.key === 'ArrowUp' ? Math.min(last, from + 1)
      : event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? Math.max(0, from - 1)
      : event.key === 'PageUp' ? Math.min(last, from + 7)
      : event.key === 'PageDown' ? Math.max(0, from - 7)
      : event.key === 'Home' ? 0
      : event.key === 'End' ? last
      : undefined
    if (event.key === 'Escape' && active !== null) {
      event.preventDefault()
      onActiveChange(null)
      return
    }
    if (next === undefined) return
    event.preventDefault()
    onActiveChange(next)
  }

  // Where each shown band's top is at the crosshair, bottom band first.
  const stops: { key: string; y: number }[] = []
  if (active !== null && rows[active]) {
    let level = 0
    for (const band of bands) {
      if (!band.visible) continue
      level += rows[active]![band.key] ?? 0
      stops.push({ key: band.key, y: yOf(level) })
    }
  }
  const previousAt = active !== null && showPrevious ? rows[active]?.previous : undefined
  const edge = active === null ? 'center' : xOf(active) < 12 ? 'start' : xOf(active) > 88 ? 'end' : 'center'

  return (
    // Time runs left to right in either direction of text.
    <div dir="ltr" data-slot="metric-chart-plot" className={cn('relative', className)}>
      <ChartContainer config={config} title={title} summary={summary} className="aspect-auto size-full">
        {chart}
      </ChartContainer>

      {/* Guides, the crosshair and its dots: drawn over the plot, never in the way of the pointer. */}
      <div aria-hidden className="pointer-events-none absolute" style={plotBox}>
        {[...annotations.keys()].map((i) => (
          <span
            key={i}
            className={cn('absolute inset-y-0 w-0 border-s border-dashed transition-colors yj-duration-fast ease-standard', active === i ? 'border-fg-muted' : 'border-line-strong')}
            style={{ left: `${xOf(i)}%` }}
          />
        ))}
        {partial && n > 1 && (
          <span className="absolute top-1 -translate-x-full pe-1.5 text-ui-xs whitespace-nowrap text-fg-muted" style={{ left: '100%' }}>
            {copy.partial}
          </span>
        )}
        {active !== null && (
          <>
            <span data-slot="metric-chart-crosshair" className="absolute inset-y-0 w-px -translate-x-1/2 bg-fg-subtle" style={{ left: `${xOf(active)}%` }} />
            {previousAt !== undefined && (
              <span
                className="absolute size-2 -translate-1/2 rounded-full border-[1.5px] border-(--color-previous) bg-surface"
                style={{ left: `${xOf(active)}%`, top: `${yOf(previousAt)}%`, '--color-previous': config.previous?.color } as CSSProperties}
              />
            )}
            {stops.map((stop) => (
              <span
                key={stop.key}
                className="absolute size-2.5 -translate-1/2 rounded-full bg-(--dot) ring-2 ring-surface"
                style={{ left: `${xOf(active)}%`, top: `${stop.y}%`, '--dot': config[stop.key]?.color } as CSSProperties}
              />
            ))}
          </>
        )}
      </div>

      {/* The crosshair as a slider: pointer, touch drag or the arrow keys pick a bucket, and the header reads it. */}
      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label={copy.scrub(title)}
        aria-valuemin={0}
        aria-valuemax={Math.max(0, n - 1)}
        aria-valuenow={active ?? Math.max(0, n - 1)}
        aria-valuetext={pointText(active ?? Math.max(0, n - 1))}
        data-slot="metric-chart-scrub"
        className="absolute cursor-crosshair touch-pan-y rounded-sm outline-hidden focus-ring"
        style={plotBox}
        onPointerDown={(event) => {
          const i = indexAt(event.clientX)
          if (i !== null) onActiveChange(i)
        }}
        onPointerMove={move}
        onPointerLeave={() => onActiveChange(null)}
        onPointerCancel={() => onActiveChange(null)}
        onFocus={() => active === null && onActiveChange(n - 1)}
        onBlur={() => onActiveChange(null)}
        onKeyDown={keys}
      />

      {/* The date under the crosshair, over the axis. */}
      {active !== null && (
        <div aria-hidden className="pointer-events-none absolute h-(--x-height)" style={{ bottom: 0, insetInlineStart: Y_WIDTH, insetInlineEnd: MARGIN_END, '--x-height': `${X_HEIGHT}px` } as CSSProperties}>
          <span
            className={cn(
              'absolute top-1 rounded-sm bg-surface px-1.5 py-0.5 text-ui-xs font-medium whitespace-nowrap text-fg shadow-xs ring-1 ring-line',
              edge === 'center' ? '-translate-x-1/2' : edge === 'end' && '-translate-x-full',
            )}
            style={{ left: `${xOf(active)}%` }}
          >
            {dateOf(active)}
          </span>
        </div>
      )}

      {annotations.size > 0 && (
        <Annotations
          annotations={annotations}
          label={copy.annotations}
          active={active}
          xOf={xOf}
          dateOf={dateOf}
          onActiveChange={onActiveChange}
          onSelect={onAnnotationSelect}
          style={{ top: MARGIN_TOP, height: LANE, insetInlineStart: Y_WIDTH, insetInlineEnd: MARGIN_END }}
        />
      )}
    </div>
  )
}

export { Plot }
