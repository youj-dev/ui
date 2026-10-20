'use client'

import { useId, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { DownloadIcon, LinkIcon, MoreHorizontalIcon } from '@youj/icons'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { ChartDataTable } from '../../components/ui/chart'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { Skeleton } from '../../components/ui/skeleton'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'
import {
  ANNOTATIONS,
  DEFAULT_COPY,
  DEFAULT_RANGE,
  RANGES,
  demoFor,
  SERIES,
  type MetricChartAnnotation,
  type MetricChartCopy,
  type MetricChartGranularity,
  type MetricChartPoint,
  type MetricChartRange,
  type MetricChartSeries,
} from './metric-chart/data'
import { Headline } from './metric-chart/headline'
import { Legend } from './metric-chart/legend'
import { Plot } from './metric-chart/plot'
import { useMetric } from './metric-chart/use-metric'

/* One metric over time, split into the segments it adds up from, against
 * the period before. The figure leads: the range's total of the shown
 * segments, rolling to each new value, and its change. The legend under it
 * is the switchboard and the readout: press a segment to fold its band away
 * (the stack settles and the total rolls), Alt-press to show it alone, and
 * the period before is a dashed line with its own toggle. Move across the
 * plot, drag a finger along it or focus it and use the arrow keys: the
 * crosshair picks a bucket, a dot lands on every band, and the figure, the
 * date and the legend read that bucket at once (Escape lets go). Annotations
 * sit in a lane over the plot on dashed guides, each a button: hover or
 * focus one to read its day, press it for `onAnnotationSelect`. A bucket
 * still filling is hatched and reads "so far". The range switch swaps the
 * window (the bands morph, the figure rolls, the new total is announced).
 * Under the plot, View data opens the same numbers as a table, and the menu
 * downloads them as CSV. Feed it `series`, `points` and `annotations` for
 * the range, answer `onRangeChange` with new points; every string is in
 * `copy`. Built for the compact layout density, taken from the page;
 * embedded, it keeps its natural width unless `fill`. Reduced motion: bands
 * and figures land in place; the crosshair still follows. */

interface MetricChartProps extends Omit<ComponentProps<'section'>, 'children' | 'title' | 'hidden'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (768px at 100% scale). Default false. */
  fill?: boolean
  /** The title's level. Default: 2 when embedded, else 1. */
  headingLevel?: 1 | 2 | 3
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<MetricChartCopy>
  /** Formats every figure and date (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The segments the metric adds up from, bottom of the stack first. Default: the demo's signup channels. */
  series?: MetricChartSeries[]
  /** One point per bucket of the range shown, oldest first. Default: the demo's points for the range. */
  points?: MetricChartPoint[]
  /** How long one point is, for the axis and the readout. Default: the demo's for the range, else `day`. */
  granularity?: MetricChartGranularity
  /** The last point is still filling (today, this week): it's hatched and reads "so far". Default: true with the demo's data, else false. */
  partial?: boolean
  /** Moments to mark on the chart; each pins to the bucket that holds its date. Default: the demo's launches and incidents. */
  annotations?: MetricChartAnnotation[]
  /** Intl.NumberFormat options for every figure (currency, units). Default: whole numbers. */
  format?: Intl.NumberFormatOptions
  /** Down is good for this metric (errors, churn): a fall takes the good ink. Default false. */
  invert?: boolean
  /** The windows the range switch offers; fewer than two hides it. Default: 7D, 30D, 90D and 12M. */
  ranges?: MetricChartRange[]
  /** The window shown, controlled: pair it with `onRangeChange`. Default: uncontrolled. */
  range?: string
  /** The window shown first, uncontrolled. Default `30d`. */
  defaultRange?: string
  /** Called with the window picked; answer with that window's `points`. */
  onRangeChange?: (range: string) => void
  /** The hidden series' ids (`previous` is the period before), controlled: pair it with `onHiddenChange`. */
  hidden?: string[]
  /** The series hidden at first, uncontrolled. Default: none. */
  defaultHidden?: string[]
  /** Called with the hidden series' ids after a legend press. */
  onHiddenChange?: (hidden: string[]) => void
  /** An annotation's mark is pressed. Default: none. */
  onAnnotationSelect?: (annotation: MetricChartAnnotation) => void
  /** The menu's Download CSV, with the rows shown. Default: downloads them as a CSV file. */
  onExport?: (rows: Record<string, string | number>[], range: string) => void
  /** The menu's Copy link, with the window shown. Default: the menu leaves it out. */
  onCopyLink?: (range: string) => void
  /** Skeletons in place of the figures and the plot while your data loads. Default false. */
  loading?: boolean
  /** Shown in place of the plot when the data fails to load, with Retry when `onRetry` is set. Default: none. */
  error?: ReactNode
  /** Retries after an `error`. Default: none. */
  onRetry?: () => void
  /** Replaces the message for a range without data. Default: `copy.empty` and `copy.emptyDescription`. */
  empty?: ReactNode
}

function MetricChart({
  theme,
  embedded = true,
  fill = false,
  headingLevel,
  copy: copyProp,
  locale,
  series = SERIES,
  points: pointsProp,
  granularity: granularityProp,
  partial: partialProp,
  annotations = ANNOTATIONS,
  format,
  invert = false,
  ranges = RANGES,
  range: rangeProp,
  defaultRange = DEFAULT_RANGE,
  onRangeChange,
  hidden: hiddenProp,
  defaultHidden = [],
  onHiddenChange,
  onAnnotationSelect,
  onExport,
  onCopyLink,
  loading = false,
  error,
  onRetry,
  empty,
  className,
  ...rest
}: MetricChartProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const titleId = useId()
  const Title = `h${headingLevel ?? (embedded ? 2 : 1)}` as 'h1' | 'h2' | 'h3'
  const { announce, announcer } = useAnnouncer()
  const [range, setRange] = useControllableState(rangeProp, defaultRange)
  const [hidden, setHidden] = useControllableState(hiddenProp, defaultHidden)
  const [active, setActive] = useState<number | null>(null)
  const [showData, setShowData] = useState(false)
  const dataId = useId()

  const demo = pointsProp === undefined
  const points = pointsProp ?? demoFor(range).points
  const granularity = granularityProp ?? (demo ? demoFor(range).granularity : 'day')
  const partial = partialProp ?? demo
  const m = useMetric({ points, series, hidden, partial, annotations, granularity, format, copy, active })
  const { visible, number, dates, rows, placed, blank, config, legend, table, changeText } = m

  const hide = (next: string[]) => {
    setHidden(next)
    onHiddenChange?.(next)
  }
  const toggle = (id: string, alone: boolean) => {
    const ids = [...series.map((s) => s.id), ...(m.hasPrevious ? ['previous'] : [])]
    const label = legend.find((item) => item.id === id)?.label ?? id
    // Alt-press shows one alone; on the one already alone, it shows everything again.
    const soloed = ids.every((other) => (other === id) === visible(other))
    if (alone) {
      hide(soloed ? [] : ids.filter((other) => other !== id))
      announce(soloed ? copy.allShown : copy.only(label))
      return
    }
    hide(visible(id) ? [...hidden, id] : hidden.filter((other) => other !== id))
    announce((visible(id) ? copy.hidden : copy.shown)(label))
  }

  const pick = (next: string) => {
    const picked = ranges.find((r) => r.id === next)
    setRange(next)
    setActive(null)
    onRangeChange?.(next)
    if (pointsProp !== undefined) return
    // The demo knows the new window's total at once; your data arrives with the next render.
    const nextPoints = demoFor(next).points
    const sum = (key: 'values' | 'previous') => nextPoints.reduce((t, p) => t + series.reduce((s, x) => s + (visible(x.id) ? (p[key]?.[x.id] ?? 0) : 0), 0), 0)
    announce(copy.announcement(picked?.name ?? picked?.label ?? next, number.format(sum('values')), changeText(sum('previous') ? sum('values') / sum('previous') - 1 : undefined)))
  }

  const download = () => {
    if (onExport) return onExport(table, range)
    const head = [copy.dateColumn, ...series.filter((s) => visible(s.id)).map((s) => s.label), ...(m.showPrevious ? [copy.previous] : [])]
    const lines = [head, ...table.map((row) => Object.values(row))].map((cells) => cells.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(','))
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: `${copy.title.toLowerCase().replace(/\W+/g, '-')}-${range}.csv` })
    a.click()
    URL.revokeObjectURL(url)
  }

  const card = (
    <Card className={cn('w-full gap-5 text-fg', !embedded && !fill && 'max-w-192')}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription className="tabular-nums">{loading ? <Skeleton className="h-4 w-40" /> : copy.description(dates.period, copy.per[granularity])}</CardDescription>
        {/* In a narrow header the switches take a row of their own, so the title and its description keep the width. */}
        <CardAction className="flex items-center gap-1.5 @max-md/card-header:col-span-full @max-md/card-header:col-start-1 @max-md/card-header:row-span-1 @max-md/card-header:row-start-3 @max-md/card-header:mt-2 @max-md/card-header:justify-self-start @max-md/card-header:ps-0">
          {ranges.length > 1 && (
            <SegmentedControl variant="pill" size="sm" aria-label={copy.range} value={range} onValueChange={pick}>
              {ranges.map((r) => (
                <SegmentedControlItem key={r.id} value={r.id} className="px-2.5 tabular-nums">
                  {r.label}
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={copy.more} />}>
              <MoreHorizontalIcon size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={download} disabled={blank || loading || !!error}>
                <DownloadIcon size={14} /> {copy.download}
              </DropdownMenuItem>
              {onCopyLink && (
                <DropdownMenuItem onClick={() => onCopyLink(range)}>
                  <LinkIcon size={14} /> {copy.copyLink}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4" aria-busy={loading || undefined}>
        {loading ? (
          <div className="flex flex-col gap-3">
            <span className="sr-only">{copy.loading}</span>
            <Skeleton className="h-10 w-44" />
            <Skeleton className="h-6 w-80 max-w-full" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        ) : error ? (
          <Alert variant="danger">
            <AlertDescription>{error}</AlertDescription>
            {onRetry && (
              <AlertAction>
                <Button size="sm" variant="outline" onClick={onRetry}>
                  {copy.retry}
                </Button>
              </AlertAction>
            )}
          </Alert>
        ) : blank ? (
          (empty ?? (
            <Empty className="min-h-64 rounded-lg border border-dashed border-line">
              <EmptyHeader>
                <EmptyTitle>{copy.empty}</EmptyTitle>
                <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ))
        ) : (
          <>
            <Headline
              total={m.total}
              change={m.change}
              comparison={ranges.find((r) => r.id === range)?.comparison ?? copy.versus}
              format={format ?? { maximumFractionDigits: 0 }}
              locale={copy.locale}
              invert={invert}
              reading={m.reading}
              versus={copy.versus}
              soFar={copy.soFar}
            />
            <Legend items={legend} label={copy.series} onToggle={toggle} />
            {/* View data swaps the plot for its numbers in the same room, so the card keeps its size. */}
            {showData ? (
              <div id={dataId} role="region" tabIndex={0} aria-label={copy.table(copy.title, dates.period)} className="h-64 overflow-auto yj-scrollbar rounded-sm focus-ring">
                <ChartDataTable
                  data={table}
                  config={config}
                  labelKey="date"
                  labelHeading={copy.dateColumn}
                  caption={copy.table(copy.title, dates.period)}
                  valueFormatter={(v) => number.format(v)}
                  className="not-sr-only"
                />
              </div>
            ) : m.bands.some((b) => b.visible) ? (
              <Plot
                rows={rows}
                config={config}
                bands={m.bands}
                showPrevious={m.showPrevious}
                partial={partial}
                yTop={m.scale.top}
                ticks={m.scale.ticks}
                annotations={placed}
                active={active}
                onActiveChange={setActive}
                onAnnotationSelect={onAnnotationSelect}
                tickValue={m.tickValue}
                dateOf={dates.long}
                pointText={m.pointText}
                title={copy.title}
                summary={m.summary}
                copy={copy}
                className="h-64"
              />
            ) : (
              <Empty className="h-64 rounded-lg border border-dashed border-line">
                <EmptyHeader>
                  <EmptyDescription>{copy.allHidden}</EmptyDescription>
                </EmptyHeader>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    hide([])
                    announce(copy.allShown)
                  }}
                >
                  {copy.showAll}
                </Button>
              </Empty>
            )}
            {!showData && (
              <ChartDataTable
                data={table}
                config={config}
                labelKey="date"
                labelHeading={copy.dateColumn}
                caption={copy.table(copy.title, dates.period)}
                valueFormatter={(v) => number.format(v)}
              />
            )}
            <Button variant="ghost" size="xs" className="-ms-2 self-start" aria-expanded={showData} aria-controls={showData ? dataId : undefined} onClick={() => setShowData((on) => !on)}>
              {showData ? copy.hideData : copy.viewData}
            </Button>
          </>
        )}
      </CardContent>
      {announcer}
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-192', className)}>
      {card}
    </section>
  ) : (
    <main aria-labelledby={titleId} {...rest} className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}>
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { MetricChart, type MetricChartProps, type MetricChartCopy, type MetricChartSeries, type MetricChartPoint, type MetricChartAnnotation, type MetricChartRange, type MetricChartGranularity }
