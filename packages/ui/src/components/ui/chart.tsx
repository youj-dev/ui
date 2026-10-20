'use client'

import { chartLabels } from '@youj/core/labels'
import { createContext, useContext, useId, useMemo, useState, type ComponentProps, type ComponentType, type CSSProperties, type ReactNode } from 'react'
import * as RechartsPrimitive from 'recharts'
import { Collapse } from '@youj/motion'
import { useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale, type Youj } from '@youj/core/lib/youj/provider'
import type { DurationToken, EasingToken } from '@youj/core/lib/youj/tokens'
import { cn } from '../../lib/utils'
import { Button } from './button'
import { TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from './table'

/* shadcn's chart, on Recharts, re-skinned and re-timed.
 * - Color: a ChartConfig maps each series key to a label and a color, and
 *   the container exposes it as `--color-<key>`, so series read
 *   `var(--color-revenue)`. A key that isn't a CSS name (`PM2.5`) has `-`
 *   for each character a name can't hold (`--color-PM2-5`), and
 *   `chartColor(key)` writes the `var()` for any key. Point the config at
 *   the chart colors (`var(--color-chart-1)`…`var(--color-chart-5)`): the theme's chart palette, or one
 *   drawn from its accent, so every preset, and light and dark, re-color
 *   the chart.
 * - Motion: Recharts animates entrances and data changes itself; useChartMotion
 *   hands it youj timing instead of its own slow default. Lines and areas draw
 *   on the deliberate token, bars grow from the baseline on slow, pies and
 *   radials sweep on deliberate, all on the enter curve, with each further
 *   series a stagger step behind. A data change morphs every mark from where
 *   it is with the same timing. Speed scales it; reduced motion turns it off
 *   (marks render in place and updates jump).
 * - Access: the plot is a Recharts accessibility layer (a tab stop; the arrow
 *   keys walk the points and open the tooltip there). ChartContainer is a
 *   named figure with a summary for assistive tech, and ChartDataTable gives
 *   the numbers as a real table, either visually hidden or behind a
 *   "View data" toggle. */

type ChartConfig = Record<
  string,
  {
    label?: ReactNode
    icon?: ComponentType
    /** Any CSS color. Prefer the chart colors, `var(--color-chart-1)`…`var(--color-chart-5)`, which follow the theme. */
    color?: string
  }
>

interface ChartContextValue {
  config: ChartConfig
}

const ChartContext = createContext<ChartContextValue | null>(null)

function useChart() {
  const context = useContext(ChartContext)
  if (!context) throw new Error('useChart must be used within a <ChartContainer />')
  return context
}

const INITIAL_DIMENSION = { width: 320, height: 200 } as const

interface ChartContainerProps extends Omit<ComponentProps<'div'>, 'title' | 'children'> {
  config: ChartConfig
  /** One Recharts chart (LineChart, BarChart, PieChart…). */
  children: ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children']
  /** The figure's accessible name, e.g. "Revenue by month". */
  title?: string
  /** One or two sentences on what the chart shows (the trend, the extremes), read after the name. */
  summary?: ReactNode
  /** Size used before the container is measured (and on the server). */
  initialDimension?: { width: number; height: number }
}

function ChartContainer({
  id,
  className,
  children,
  config,
  title,
  summary,
  style,
  initialDimension = INITIAL_DIMENSION,
  ...props
}: ChartContainerProps) {
  const uniqueId = useId()
  const chartId = `chart-${id ?? uniqueId.replace(/:/g, '')}`
  const summaryId = `${chartId}-summary`
  const colors = useMemo(() => {
    const vars: Record<string, string> = {}
    for (const [key, item] of Object.entries(config)) if (item.color) vars[chartColorName(key)] = item.color
    return vars
  }, [config])
  if (process.env.NODE_ENV !== 'production') warnUnsafeKeys(config)
  const context = useMemo(() => ({ config }), [config])

  return (
    <ChartContext.Provider value={context}>
      <div
        data-slot="chart"
        data-chart={chartId}
        role="figure"
        aria-label={title}
        aria-describedby={summary ? summaryId : undefined}
        className={cn(
          // Shrinks with its column (a grid or flex child), so a chart never holds a phone's page wider than the screen.
          'own:flex aspect-video w-full min-w-0 justify-center own:text-ui-xs',
          // Axes, grid and cursors on the ink ramp.
          '[&_.recharts-cartesian-axis-tick_text]:fill-fg-muted [&_.recharts-polar-angle-axis-tick_text]:fill-fg-muted',
          "[&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-line [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-line", // youj-allow: selects Recharts' default stroke attribute to re-colour it
          "[&_.recharts-reference-line_[stroke='#ccc']]:stroke-line [&_.recharts-cartesian-axis-line]:stroke-line [&_.recharts-cartesian-axis-tick-line]:stroke-line", // youj-allow: selects Recharts' default stroke attribute to re-colour it
          '[&_.recharts-curve.recharts-tooltip-cursor]:stroke-line [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-band',
          '[&_.recharts-radial-bar-background-sector]:fill-band',
          // The hovered point wears a ring of the surface it sits on.
          "[&_.recharts-dot[stroke='#fff']]:stroke-surface [&_.recharts-sector[stroke='#fff']]:stroke-surface", // youj-allow: selects Recharts' default stroke attribute to re-colour it
          '[&_.recharts-layer]:outline-hidden [&_.recharts-sector]:outline-hidden',
          // The plot is a tab stop (arrow keys walk the points): ring it on keyboard focus only.
          '[&_.recharts-surface]:rounded-md [&_.recharts-surface]:outline-hidden [&_.recharts-surface]:focus-ring',
          className,
        )}
        style={{ ...colors, ...style } as CSSProperties}
        {...props}
      >
        {summary && (
          <p id={summaryId} className="sr-only">
            {summary}
          </p>
        )}
        <RechartsPrimitive.ResponsiveContainer initialDimension={initialDimension}>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

/* ── Motion ──────────────────────────────────────────────────────────────── */

/** Recharts takes a CSS easing string; this is the token's curve as one. */
function cssEase(k: Youj, token: EasingToken) {
  return `cubic-bezier(${k.ease(token).join(',')})` as RechartsPrimitive.LineProps['animationEasing'] // youj-allow: the token's own curve, formatted for Recharts
}

interface SeriesMotion {
  isAnimationActive: boolean
  animationBegin: number
  animationDuration: number
  animationEasing: RechartsPrimitive.LineProps['animationEasing']
}

interface ChartMotion {
  /** Lines and areas: the stroke draws in (and areas wipe in) on the deliberate token. */
  draw: (series?: number) => SeriesMotion
  /** Bars: grow from the baseline on the slow token. */
  grow: (series?: number) => SeriesMotion
  /** Pies, donuts and radial bars: sweep round on the deliberate token. */
  sweep: (series?: number) => SeriesMotion
  /** For Recharts' Tooltip: it glides between points on the fast token. ChartTooltip applies it. */
  tooltip: { isAnimationActive: boolean; animationDuration: number; animationEasing: RechartsPrimitive.TooltipProps['animationEasing'] }
  reduced: boolean
}

/**
 * Youj timing for Recharts' series. Spread one onto each series; the index
 * staggers later series behind the first:
 * `<Line {...motion.draw(0)} />`, `<Bar {...motion.grow(1)} />`, `<Pie {...motion.sweep()} />`.
 * Values are plain numbers and strings, so they are stable across renders
 * (Recharts restarts an animation when they change).
 */
function useChartMotion(): ChartMotion {
  const k = useYouj()
  return useMemo(() => {
    const series =
      (duration: DurationToken, ease: EasingToken) =>
      (index = 0): SeriesMotion => ({
        isAnimationActive: !k.reduced,
        animationBegin: Math.round(index * k.stagger('loose') * 1000),
        animationDuration: Math.round(k.ms(duration)),
        animationEasing: cssEase(k, ease),
      })
    return {
      draw: series('deliberate', 'enter'),
      grow: series('slow', 'enter'),
      sweep: series('deliberate', 'enter'),
      tooltip: {
        isAnimationActive: !k.reduced,
        animationDuration: Math.round(k.ms('fast')),
        animationEasing: cssEase(k, 'standard') as ChartMotion['tooltip']['animationEasing'],
      },
      reduced: k.reduced,
    }
  }, [k])
}

/* ── Tooltip ─────────────────────────────────────────────────────────────── */

/** Recharts' Tooltip, gliding between points on youj timing. */
function ChartTooltip(props: RechartsPrimitive.TooltipProps) {
  const motion = useChartMotion()
  return <RechartsPrimitive.Tooltip {...motion.tooltip} {...props} />
}

type TooltipPayloadItem = RechartsPrimitive.TooltipPayloadEntry

interface ChartTooltipContentProps extends Omit<ComponentProps<'div'>, 'color'> {
  active?: boolean
  payload?: readonly TooltipPayloadItem[]
  label?: ReactNode
  hideLabel?: boolean
  hideIndicator?: boolean
  indicator?: 'line' | 'dot' | 'dashed'
  /** The payload field whose value names each row in the config. */
  nameKey?: string
  /** The payload field whose value is the heading. */
  labelKey?: string
  labelFormatter?: (label: ReactNode, payload: readonly TooltipPayloadItem[]) => ReactNode
  labelClassName?: string
  /** Formats each value, e.g. as currency. Default: toLocaleString. */
  valueFormatter?: (value: number | string, name: string, item: TooltipPayloadItem) => ReactNode
  color?: string
}

/** The tooltip card: the popover surface, a heading, then one row per series with its swatch, label and value. */
function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = 'dot',
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  valueFormatter,
  color,
  nameKey,
  labelKey,
}: ChartTooltipContentProps) {
  const { config } = useChart()
  const locale = useLocale()
  if (!active || !payload?.length) return null

  const [first] = payload
  const headingKey = `${labelKey ?? first?.dataKey ?? first?.name ?? 'value'}`
  const headingConfig = configFor(config, first, headingKey)
  const headingValue = !labelKey && typeof label === 'string' ? (config[label]?.label ?? label) : headingConfig?.label
  const heading = hideLabel ? null : labelFormatter ? labelFormatter(headingValue, payload) : headingValue
  const nest = payload.length === 1 && indicator !== 'dot'
  const headingNode = heading ? <div className={cn('own:font-medium text-fg', labelClassName)}>{heading}</div> : null

  return (
    <div
      data-slot="chart-tooltip"
      data-yj-tone="overlay"
      className={cn(
        'own:grid min-w-36 items-start gap-1.5 own:rounded-lg border border-line own:bg-overlay own:px-2.5 own:py-2 own:text-ui-xs own:text-fg own:shadow-md',
        className,
      )}
    >
      {!nest && headingNode}
      <div className="own:grid gap-1.5">
        {payload
          .filter((item) => item.type !== 'none')
          .map((item, index) => {
            const key = `${nameKey ?? item.name ?? item.dataKey ?? 'value'}`
            const itemConfig = configFor(config, item, key)
            const swatch = color ?? (item.payload as { fill?: string } | undefined)?.fill ?? item.color
            const value = item.value as number | string | undefined
            return (
              <div
                key={`${item.dataKey ?? index}`}
                className={cn('own:flex w-full items-stretch gap-2 [&>svg]:size-2.5 [&>svg]:text-fg-muted', indicator === 'dot' && 'items-center')}
              >
                {itemConfig?.icon ? (
                  <itemConfig.icon />
                ) : (
                  !hideIndicator && (
                    <span
                      aria-hidden
                      className={cn('shrink-0 rounded-[2px] border-(--swatch) bg-(--swatch)', {
                        'size-2': indicator === 'dot',
                        'w-1': indicator === 'line',
                        'w-0 border-[1.5px] border-dashed bg-transparent': indicator === 'dashed',
                        'my-0.5': nest && indicator === 'dashed',
                      })}
                      style={{ '--swatch': swatch } as CSSProperties}
                    />
                  )
                )}
                <div className={cn('own:flex flex-1 justify-between gap-4 own:leading-none', nest ? 'items-end' : 'items-center')}>
                  <div className="own:grid gap-1.5">
                    {nest && headingNode}
                    <span className="own:text-fg-muted">{itemConfig?.label ?? item.name}</span>
                  </div>
                  {value != null && (
                    <span className="own:font-medium own:text-fg own:tabular-nums">
                      {valueFormatter ? valueFormatter(value, key, item) : typeof value === 'number' ? value.toLocaleString(locale) : String(value)}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}

/* ── Legend ──────────────────────────────────────────────────────────────── */

/** Recharts' Legend, listing series in the order they are drawn (Recharts sorts by name by default). */
function ChartLegend({ itemSorter = null, ...props }: RechartsPrimitive.LegendProps) {
  return <RechartsPrimitive.Legend itemSorter={itemSorter} {...props} />
}

interface ChartLegendContentProps extends ComponentProps<'div'> {
  payload?: readonly RechartsPrimitive.LegendPayload[]
  verticalAlign?: 'top' | 'middle' | 'bottom'
  hideIcon?: boolean
  nameKey?: string
}

function ChartLegendContent({ className, hideIcon = false, payload, verticalAlign = 'bottom', nameKey }: ChartLegendContentProps) {
  const { config } = useChart()
  if (!payload?.length) return null
  return (
    <ul
      data-slot="chart-legend"
      className={cn(
        'own:flex flex-wrap items-center justify-center gap-x-4 gap-y-1 own:text-ui-xs own:text-fg-muted',
        verticalAlign === 'top' ? 'own:pb-3' : 'own:pt-3',
        className,
      )}
    >
      {payload
        .filter((item) => item.type !== 'none')
        .map((item) => {
          const key = `${nameKey ?? item.dataKey ?? 'value'}`
          const itemConfig = configFor(config, item, key)
          return (
            <li key={`${item.value}`} className="flex items-center gap-1.5 [&>svg]:size-3 [&>svg]:text-fg-muted">
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <span aria-hidden className="size-2 shrink-0 rounded-[2px]" style={{ backgroundColor: item.color }} />
              )}
              {itemConfig?.label ?? item.value}
            </li>
          )
        })}
    </ul>
  )
}

/* ── Data table ──────────────────────────────────────────────────────────── */

interface ChartDataTableProps extends Omit<ComponentProps<'div'>, 'children'> {
  data: readonly Record<string, unknown>[]
  config: ChartConfig
  /** The field that names each row (the x axis, or the slice name). */
  labelKey: string
  /** Heading for the label column. Default: the config's label for labelKey, else the key. */
  labelHeading?: ReactNode
  /** Columns to show, in order. Default: every config key present in the data. */
  keys?: string[]
  /** Describes the table, e.g. "Revenue by month, in USD". */
  caption: ReactNode
  /** `hidden`: a visually hidden table for assistive tech. `toggle`: a "View data" button that reveals it. Default `hidden`. */
  mode?: 'hidden' | 'toggle'
  valueFormatter?: (value: number, key: string) => ReactNode
}

/** The chart's numbers as a real table: visually hidden, or revealed by a "View data" toggle (motion's Collapse). */
function ChartDataTable({
  data,
  config,
  labelKey,
  labelHeading,
  keys,
  caption,
  mode = 'hidden',
  valueFormatter,
  className,
  ...props
}: ChartDataTableProps) {
  const labels = useComponentLabels(chartLabels)
  const [open, setOpen] = useState(false)
  const id = useId()
  const locale = useLocale()
  const columns = keys ?? Object.keys(config).filter((key) => key !== labelKey && data.some((row) => key in row))
  // A bare table: Table's scroll container would be a scrollable region no
  // keyboard can reach (axe scrollable-region-focusable) inside the sr-only box.
  const table = (
    <table data-slot="chart-data-table" className="w-full caption-bottom border-separate border-spacing-0 own:text-ui-sm own:text-fg">
      <TableCaption id={`${id}-caption`} className={mode === 'toggle' ? 'own:text-start' : undefined}>
        {caption}
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead scope="col">{labelHeading ?? config[labelKey]?.label ?? labelKey}</TableHead>
          {columns.map((key) => (
            <TableHead key={key} scope="col" className="own:text-end">
              {config[key]?.label ?? key}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, index) => (
          <TableRow key={`${String(row[labelKey])}-${index}`}>
            <TableHead scope="row" className="own:h-auto own:py-1.5 own:font-normal own:text-fg [tbody>tr:last-child>&]:border-b-0">
              {String(row[labelKey])}
            </TableHead>
            {columns.map((key) => {
              const value = row[key]
              return (
                <TableCell key={key} className="own:py-1.5 own:text-end own:tabular-nums">
                  {typeof value === 'number' ? (valueFormatter ? valueFormatter(value, key) : value.toLocaleString(locale)) : String(value ?? '—')}
                </TableCell>
              )
            })}
          </TableRow>
        ))}
      </TableBody>
    </table>
  )

  if (mode === 'hidden') {
    return (
      <div data-slot="chart-data" className={cn('sr-only', className)} {...props}>
        {table}
      </div>
    )
  }
  return (
    <div data-slot="chart-data" className={cn('own:flex flex-col', className)} {...props}>
      <Button
        variant="ghost"
        size="xs"
        // Ghost padding would indent the label off the text edge above it.
        className="-ms-2 self-start"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? labels.hideData : labels.viewData}
      </Button>
      <Collapse id={id} open={open}>
        {/* Wide data scrolls sideways, so the region takes focus for arrow-key scrolling. A one-column grid, so the table's width never holds the page wider. */}
        <div role="region" aria-labelledby={`${id}-caption`} tabIndex={0} className="mt-2 own:grid grid-cols-[minmax(0,1fr)] overflow-x-auto yj-scrollbar rounded-sm focus-ring">
          {table}
        </div>
      </Collapse>
    </div>
  )
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

/** The custom property ChartContainer writes for a config key: `--color-<key>`, with `-` for each character a CSS name can't hold (not `_`, which Tailwind reads as a space in `bg-(--color-…)`). */
function chartColorName(key: string) {
  return `--color-${key.replace(/[^-\w\u00A0-\uFFFF]/g, '-')}`
}

/** A config key's color, for a series' `fill` or `stroke`: `chartColor('revenue')` is `var(--color-revenue)`, `chartColor('PM2.5')` is `var(--color-PM2-5)`. */
function chartColor(key: string) {
  return `var(${chartColorName(key)})`
}

declare const process: { env: { NODE_ENV?: string } }
const warnedKeys = new Set<string>()

/** In development, says once per key when a config key isn't a CSS name, since `var(--color-<key>)` written by hand then draws nothing. */
function warnUnsafeKeys(config: ChartConfig) {
  for (const key of Object.keys(config)) {
    const name = chartColorName(key)
    if (name === `--color-${key}` || warnedKeys.has(key)) continue
    warnedKeys.add(key)
    console.warn(`[youj] ChartConfig key "${key}" isn't a CSS name, so its color is ${name}. Color its series with chartColor(${JSON.stringify(key)}).`)
  }
}

/** The config entry for a payload item: by the value of `key` on it (or its datum), else by `key` itself. */
function configFor(config: ChartConfig, payload: unknown, key: string) {
  if (typeof payload !== 'object' || payload === null) return undefined
  const datum =
    'payload' in payload && typeof payload.payload === 'object' && payload.payload !== null ? (payload.payload as Record<string, unknown>) : undefined
  const own = (payload as Record<string, unknown>)[key]
  const name = typeof own === 'string' ? own : typeof datum?.[key] === 'string' ? (datum[key] as string) : key
  return config[name] ?? config[key]
}

export {
  ChartContainer,
  ChartDataTable,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  chartColor,
  useChart,
  useChartMotion,
}
export type { ChartConfig, ChartContainerProps, ChartDataTableProps, ChartLegendContentProps, ChartMotion, ChartTooltipContentProps }
