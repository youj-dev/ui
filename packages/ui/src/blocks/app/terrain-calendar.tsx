'use client'

import { memo, useCallback, useDeferredValue, useId, useMemo, useState, type HTMLAttributes, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import type { StatTone } from '../../components/ui/stat-card'
import { useAnnouncer } from '../../hooks/use-announcer'
import { TerrainCard } from './terrain-calendar/card'
import {
  ALL,
  CATEGORIES,
  DEFAULT_COPY,
  DETAILS,
  METRICS,
  TONES,
  dayAt,
  gridOf,
  peakOf,
  type Cell,
  type TerrainCalendarCategory,
  type TerrainCalendarCopy,
  type TerrainCalendarDay,
  type TerrainCalendarDetail,
  type TerrainCalendarMetric,
  type TerrainCalendarTone,
} from './terrain-calendar/data'
import { DEMO_DAYS } from './terrain-calendar/demo'
import { formatsFor } from './terrain-calendar/format'
import { reachOf } from './terrain-calendar/geometry'
import { CardPlaceholder, StatsPlaceholder } from './terrain-calendar/states'
import { TerrainStats } from './terrain-calendar/stats'
import { cn, toneColor } from '../../lib/utils'

/* Months of days as a landscape: every day an isometric column whose
 * height and color are that day's measure, weeks running toward you and the
 * weekend at the back. A busy stretch rises as a ridge, a quiet one sinks to
 * a valley, and a lone day can stand as a spire. The measure and the category
 * reshape it in a wave. Point at a day, tap it, or tab in and move with the
 * arrow keys: its day of the week and its week stay lit while the rest
 * recede, a tooltip gives the figure, and the panel beside it gives the day:
 * its entries (category, then a column per detail), your usual day of that
 * name, and its share of the week. Above, the selected week's total, the
 * longest streak of days with an entry and the peak day. The drawing is a
 * canvas that draws only when something changes and pauses off screen; its
 * days are a grid for the keyboard and screen readers, and view changes are
 * announced. The demo is a triathlete's training; pass your own days, metrics
 * and categories. Loading, an error with Retry and no days take the stats and
 * the terrain's place at their size.
 * Reduced motion: every change lands at once.
 * It is built for the compact layout density (ui.css), taken from the page; embedded, it keeps its natural width unless `fill`. */

interface TerrainCalendarProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'onSelect' | 'title'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around it. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (1152px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<TerrainCalendarCopy>
  /** Whole weeks of days, Monday first (7 each). Default: a 24-week plan toward a triathlon. */
  days?: TerrainCalendarDay[]
  /** The measures to switch between: each sums `values[id]` of the day's entries. Default: load, time and distance. */
  metrics?: TerrainCalendarMetric[]
  /** The kinds of entry, in the filter's order after "All". Default: run, ride, swim (and strength, counted in "All" only). */
  categories?: TerrainCalendarCategory[]
  /** The columns of the day's entries table, each read from `values[id]`. Default: time, distance and effort. */
  details?: TerrainCalendarDetail[]
  /** A `TerrainCalendarMetric` id. Default: the first. */
  defaultMetric?: string
  /** A `TerrainCalendarCategory` id, or 'all'. Default 'all'. */
  defaultCategory?: string
  /** Called when a day is selected (a click, a tap, or the arrow keys). */
  onSelect?: (day: TerrainCalendarDay) => void
  /** Skeletons in place of the stats and the terrain while your days load. Default false. */
  loading?: boolean
  /** Shown in place of the terrain when the days fail to load, with Retry when `onRetry` is set. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** Replaces the message when there are no days. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
}

const Stats = memo(TerrainStats)

function TerrainCalendar({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  days = DEMO_DAYS,
  metrics = METRICS,
  categories = CATEGORIES,
  details = DETAILS,
  defaultMetric,
  defaultCategory = ALL,
  onSelect,
  loading = false,
  error,
  onRetry,
  empty,
  className,
  ...rest
}: TerrainCalendarProps) {
  const copy = useMemo(() => ({ ...DEFAULT_COPY, ...copyProp }), [copyProp])
  const locale = useLocale(copy.locale)
  const format = useMemo(() => formatsFor(locale, metrics), [locale, metrics])
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const { announce, announcer } = useAnnouncer()
  const [metricId, setMetricId] = useState(defaultMetric ?? metrics[0]?.id ?? '')
  const [category, setCategory] = useState(defaultCategory)
  const metric = metrics.find((m) => m.id === metricId) ?? metrics[0]
  const filters = useMemo(() => [ALL, ...categories.filter((c) => c.filter !== false).map((c) => c.id)], [categories])
  const labelOf = useCallback((id: string) => (id === ALL ? copy.all : (categories.find((c) => c.id === id)?.label ?? id)), [categories, copy.all])
  const labels = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.label])), [categories])
  const [selected, setSelected] = useState<Cell>(() => peakOf(gridOf(days, defaultMetric ?? metrics[0]?.id ?? '', defaultCategory)))
  const rows = useMemo(() => gridOf(days, metric?.id ?? '', category), [days, metric, category])
  // The summary takes a new view deferred, so the terrain starts its morph in the frame the choice is made.
  const quietRows = useDeferredValue(rows)
  const quietMetric = useDeferredValue(metric)
  const quietCategory = useDeferredValue(category)
  // Every view the days offer, so the drawing's box never changes size between them.
  const reach = useMemo(() => reachOf(metrics.flatMap((m) => filters.map((f) => gridOf(days, m.id, f)))), [days, metrics, filters])
  // Each measure's color: the terrain's ramp (a token) and the stat parts' tone.
  const tones = useMemo(
    () =>
      Object.fromEntries(
        metrics.map((m, i) => {
          const tone: TerrainCalendarTone = m.tone ?? TONES[i % TONES.length]!
          return [m.id, { css: toneColor(tone), stat: tone as StatTone }]
        }),
      ),
    [metrics],
  )

  /** Shows a measure and category, and says where the terrain now peaks. */
  const show = (m: TerrainCalendarMetric, c: string) => {
    setMetricId(m.id)
    setCategory(c)
    const grid = gridOf(days, m.id, c)
    const top = peakOf(grid)
    const topDay = dayAt(days, top)
    const peak = topDay ? copy.cell(format.date(topDay.date), format.text(m.id, grid[top.row]?.[top.col] ?? 0)) : ''
    announce(copy.showing(m.label, labelOf(c), peak))
  }

  const select = useCallback(
    (cell: Cell) => {
      setSelected(cell)
      const picked = dayAt(days, cell)
      if (picked) onSelect?.(picked)
    },
    [days, onSelect],
  )

  const state = loading ? 'loading' : error ? 'error' : days.length === 0 || !metric ? 'empty' : null

  const content = (
    <div className="flex w-full flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="flex min-w-0 flex-col gap-1">
          <Title id={titleId} className="text-2xl font-semibold tracking-tight text-fg">
            {copy.title}
          </Title>
          <p className="text-ui text-fg-muted">{copy.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {metrics.length > 1 && metric && (
            <SegmentedControl aria-label={copy.metricLabel} value={metric.id} onValueChange={(next) => show(metrics.find((m) => m.id === next) ?? metric, category)}>
              {metrics.map((m) => (
                <SegmentedControlItem key={m.id} value={m.id}>
                  {m.label}
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
          )}
          {filters.length > 1 && metric && (
            <SegmentedControl aria-label={copy.categoryLabel} value={category} onValueChange={(next) => show(metric, next)}>
              {filters.map((f) => (
                <SegmentedControlItem key={f} value={f}>
                  {labelOf(f)}
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
          )}
        </div>
      </header>

      {state || !metric || !quietMetric ? (
        <>
          <StatsPlaceholder state={state ?? 'empty'} copy={copy} />
          <CardPlaceholder state={state ?? 'empty'} copy={copy} error={error} onRetry={onRetry} empty={empty} />
        </>
      ) : (
        <>
          <Stats
            days={days}
            rows={quietRows}
            metric={quietMetric}
            category={quietCategory}
            labels={labels}
            col={selected.col}
            tone={tones[quietMetric.id]!.stat}
            locale={locale}
            copy={copy}
            format={format}
          />

          <TerrainCard
            days={days}
            rows={rows}
            reach={reach}
            metric={metric}
            category={category}
            categories={categories}
            details={details}
            tones={tones}
            selected={selected}
            onSelect={select}
            locale={locale}
            copy={copy}
            format={format}
          />
        </>
      )}
      {announcer}
    </div>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full text-fg', !fill && 'max-w-6xl', className)}>
      {content}
    </section>
  ) : (
    <main
      aria-labelledby={titleId}
      {...rest}
      className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}
    >
      <div className={cn('w-full', !fill && 'max-w-6xl')}>{content}</div>
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { TerrainCalendar, type TerrainCalendarProps }
export type {
  TerrainCalendarCategory,
  TerrainCalendarCopy,
  TerrainCalendarDay,
  TerrainCalendarDetail,
  TerrainCalendarEntry,
  TerrainCalendarFormat,
  TerrainCalendarMetric,
  TerrainCalendarTone,
} from './terrain-calendar/data'
