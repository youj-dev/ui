'use client'

import { useCallback, useId, useMemo, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { type ChartConfig } from '../../components/ui/chart'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { Skeleton } from '../../components/ui/skeleton'
import { StatValue } from '../../components/ui/stat-card'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, dateTimeFormat, numberFormat } from '../../lib/utils'
import { Curve } from './retention/curve'
import { DEFAULT_COPY, DEMO, averages as averagesOf, timeOf, type RetentionCohort, type RetentionCopy, type RetentionGranularity, type RetentionMeasure } from './retention/data'
import { Grid, type Cell } from './retention/grid'

/* Who stays. Each cohort (the people who signed up in one week or month)
 * is a row of the triangle, each period since a column, the share still
 * active a wash of colour; the average leads, weighted by size, and a period
 * still running is hatched and kept out of every average and curve. Above
 * it, the curve: every cohort faint, the average over a wash, and the
 * average at three telling periods as figures. Point at a cell or move
 * through the grid with the arrow keys: its row and column stay lit, the
 * rest step back, the curve draws that cohort over the average with its
 * period marked, and a line reads it (share, people, points above or
 * below the average). Switch Weekly or Monthly cohorts, and percent or
 * people. Feed it `cohorts` (start, size and active counts per period) for
 * the granularity shown and answer `onGranularityChange`; every string is
 * in `copy`. Built for the compact layout density, taken from the page;
 * embedded, it keeps its natural width unless `fill`, and the grid scrolls
 * sideways when it's narrower. Reduced motion: washes and lines land in
 * place. */

interface RetentionProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (768px at 100% scale). Default false. */
  fill?: boolean
  /** The title's level. Default: 2 when embedded, else 1. */
  headingLevel?: 1 | 2 | 3
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<RetentionCopy>
  /** Formats every figure and date (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The cohorts, oldest first, each with its size and active people per period. Default: the demo's weekly or monthly signups. */
  cohorts?: RetentionCohort[]
  /** Each cohort's last period is still running: hatched, and left out of averages and curves. Default: true with the demo's data, else false. */
  partial?: boolean
  /** The cohort sizes the switch offers; fewer than two hides it. Default: weekly and monthly. */
  granularities?: RetentionGranularity[]
  /** The cohort size shown, controlled: pair it with `onGranularityChange`. Default: uncontrolled. */
  granularity?: RetentionGranularity
  /** The cohort size shown first, uncontrolled. Default `week`. */
  defaultGranularity?: RetentionGranularity
  /** Called with the cohort size picked; answer with its `cohorts`. */
  onGranularityChange?: (granularity: RetentionGranularity) => void
  /** What the cells say, controlled: pair it with `onMeasureChange`. Default: uncontrolled. */
  measure?: RetentionMeasure
  /** What the cells say first: `percent` (the default) or `people`. */
  defaultMeasure?: RetentionMeasure
  /** Called with the measure picked. */
  onMeasureChange?: (measure: RetentionMeasure) => void
  /** Skeletons in place of the chart and the grid while your data loads. Default false. */
  loading?: boolean
  /** Shown in place of the card's body when the data fails to load, with Retry when `onRetry` is set. Default: none. */
  error?: ReactNode
  /** Retries after an `error`. Default: none. */
  onRetry?: () => void
  /** Replaces the message when there are no cohorts. Default: `copy.empty` and `copy.emptyDescription`. */
  empty?: ReactNode
}

const START: Record<RetentionGranularity, Intl.DateTimeFormatOptions> = { week: { month: 'short', day: 'numeric' }, month: { month: 'short', year: 'numeric' } }

function Retention({
  theme,
  embedded = true,
  fill = false,
  headingLevel,
  copy: copyProp,
  locale,
  cohorts: cohortsProp,
  partial: partialProp,
  granularities = ['week', 'month'],
  granularity: granularityProp,
  defaultGranularity = 'week',
  onGranularityChange,
  measure: measureProp,
  defaultMeasure = 'percent',
  onMeasureChange,
  loading = false,
  error,
  onRetry,
  empty,
  className,
  ...rest
}: RetentionProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const titleId = useId()
  const Title = `h${headingLevel ?? (embedded ? 2 : 1)}` as 'h1' | 'h2' | 'h3'
  const [granularity, setGranularity] = useControllableState(granularityProp, defaultGranularity)
  const [measure, setMeasure] = useControllableState(measureProp, defaultMeasure)
  const [active, setActive] = useState<Cell | null>(null)
  const [cursor, setCursor] = useState<Cell>({ row: 0, col: 0 })

  const cohorts = cohortsProp ?? DEMO[granularity]
  const partial = partialProp ?? cohortsProp === undefined
  const averages = useMemo(() => averagesOf(cohorts, partial), [cohorts, partial])
  const percentFormat = useMemo(() => numberFormat(copy.locale, { style: 'percent', maximumFractionDigits: 1 }), [copy.locale])
  const percent = useCallback((share: number) => percentFormat.format(share), [percentFormat])
  const number = numberFormat(copy.locale)
  const startFormat = useMemo(() => dateTimeFormat(copy.locale, { ...START[granularity], timeZone: 'UTC' }), [copy.locale, granularity])
  const dateOf = useCallback((iso: string) => startFormat.format(timeOf(iso)), [startFormat])
  const short = copy.periodShort[granularity]
  const label = useCallback((p: number) => short(p), [short])

  const keys = copy.keyPeriods[granularity].filter((p) => averages[p] !== undefined)
  const span = cohorts.length ? (cohorts.length > 1 ? startFormat.formatRange(timeOf(cohorts[0]!.start), timeOf(cohorts.at(-1)!.start)) : dateOf(cohorts[0]!.start)) : ''
  const people = cohorts.reduce((t, c) => t + c.size, 0)
  const summary = copy.summary(cohorts.length, number.format(people), keys.map((p) => `${copy.period[granularity](p)} ${percent(averages[p]!)}`).join(', '))
  const config = useMemo(
    () =>
      ({
        average: { label: copy.average, color: 'var(--color-chart-1)' },
        picked: { label: copy.cohort, color: 'var(--color-chart-2)' },
        cohorts: { label: copy.allCohorts, color: 'var(--color-chart-quiet)' },
      }) satisfies ChartConfig,
    [copy.average, copy.cohort, copy.allCohorts],
  )

  const picked = active && cohorts[active.row] ? cohorts[active.row]! : undefined
  const pickedShare = picked && active ? picked.active[active.col]! / (picked.size || 1) : undefined
  const pickedAverage = active ? averages[active.col] : undefined
  const pickedRunning = picked && active ? partial && active.col > 0 && active.col === picked.active.length - 1 : false

  const pickGranularity = (next: string) => {
    const g = next as RetentionGranularity
    setGranularity(g)
    setActive(null)
    setCursor({ row: 0, col: 0 })
    onGranularityChange?.(g)
  }
  const pickMeasure = (next: string) => {
    setMeasure(next as RetentionMeasure)
    onMeasureChange?.(next as RetentionMeasure)
  }

  const body = loading ? (
    <div className="flex flex-col gap-4">
      <span className="sr-only">{copy.loading}</span>
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-12 rounded-md" />
        ))}
      </div>
      <Skeleton className="h-44 rounded-lg" />
      <Skeleton className="h-56 rounded-lg" />
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
  ) : cohorts.length === 0 ? (
    (empty ?? (
      <Empty className="rounded-lg border border-dashed border-line">
        <EmptyHeader>
          <EmptyTitle>{copy.empty}</EmptyTitle>
          <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    ))
  ) : (
    <div className="flex flex-col gap-5">
      <dl data-slot="retention-keys" className="grid grid-cols-3 gap-4">
        {keys.map((p) => (
          <div key={p} className="flex min-w-0 flex-col gap-1">
            <dt className="truncate font-(family-name:--yj-label-font) text-ui-xs font-medium tracking-(--yj-label-tracking) text-fg-muted [text-transform:var(--yj-label-case)]">
              {copy.period[granularity](p)}
            </dt>
            <dd>
              <StatValue value={averages[p]!} format={{ style: 'percent', maximumFractionDigits: 1 }} locale={copy.locale} size="sm" />
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col gap-2">
        <p aria-hidden data-slot="retention-readout" className="flex min-h-5 flex-wrap items-center gap-x-3 gap-y-1 text-ui-sm">
          {picked && active ? (
            <>
              <span className="inline-flex items-center gap-1.5 text-fg">
                <span className="size-2 rounded-full bg-chart-2" />
                {copy.readout(dateOf(picked.start), copy.period[granularity](active.col), percent(pickedShare!), number.format(picked.active[active.col]!), number.format(picked.size))}
              </span>
              {pickedRunning ? (
                <span className="text-fg-muted">{copy.inProgress}</span>
              ) : (
                pickedAverage !== undefined &&
                active.col > 0 && (
                  <span className={cn('tabular-nums', pickedShare! >= pickedAverage ? 'text-success-text' : 'text-danger-text')}>
                    {copy.versus(numberFormat(copy.locale, { maximumFractionDigits: 1 }).format(Math.abs(pickedShare! - pickedAverage) * 100), pickedShare! >= pickedAverage)}
                  </span>
                )
              )}
            </>
          ) : (
            <>
              <span className="inline-flex items-center gap-1.5 text-fg-muted">
                <span className="h-0.5 w-3 rounded-full bg-chart-1" />
                {copy.average}
              </span>
              <span className="inline-flex items-center gap-1.5 text-fg-muted">
                <span className="h-px w-3 bg-chart-quiet" />
                {copy.allCohorts}
              </span>
            </>
          )}
        </p>
        <Curve cohorts={cohorts} averages={averages} partial={partial} row={active?.row ?? null} col={active?.col ?? null} label={label} percent={percent} title={copy.chart} summary={summary} config={config} />
      </div>
      <Grid
        cohorts={cohorts}
        averages={averages}
        partial={partial}
        measure={measure}
        granularity={granularity}
        active={active}
        onActiveChange={setActive}
        cursor={cursor}
        onCursorChange={setCursor}
        dateOf={dateOf}
        copy={copy}
        // The weekly cohorts' height at 100%: Monthly's fewer rows, or more of yours, never resize the card.
        className="h-102.25 overflow-y-auto"
      />
    </div>
  )

  const card = (
    <Card className={cn('w-full gap-5 text-fg', !embedded && !fill && 'max-w-3xl')}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription className="tabular-nums">{copy.description(copy.per[granularity], span)}</CardDescription>
        {/* In a narrow header the switches take a row of their own, so the title and its description keep the width. */}
        <CardAction className="flex flex-wrap items-center gap-1.5 @max-xl/card-header:col-span-full @max-xl/card-header:col-start-1 @max-xl/card-header:row-span-1 @max-xl/card-header:row-start-3 @max-xl/card-header:mt-2 @max-xl/card-header:justify-self-start @max-xl/card-header:ps-0">
          {granularities.length > 1 && (
            <SegmentedControl variant="pill" size="sm" aria-label={copy.granularity} value={granularity} onValueChange={pickGranularity}>
              {granularities.map((g) => (
                <SegmentedControlItem key={g} value={g} className="px-2.5">
                  {copy.granularities[g]}
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
          )}
          <SegmentedControl variant="pill" size="sm" aria-label={copy.measure} value={measure} onValueChange={pickMeasure}>
            {(['percent', 'people'] as const).map((m) => (
              <SegmentedControlItem key={m} value={m} aria-label={copy.measureNames[m]} className="px-2.5">
                {copy.measures[m]}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        </CardAction>
      </CardHeader>
      <CardContent aria-busy={loading || undefined}>{body}</CardContent>
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-3xl', className)}>
      {card}
    </section>
  ) : (
    <main aria-labelledby={titleId} {...rest} className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}>
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { Retention, type RetentionProps, type RetentionCopy, type RetentionCohort, type RetentionGranularity, type RetentionMeasure }
