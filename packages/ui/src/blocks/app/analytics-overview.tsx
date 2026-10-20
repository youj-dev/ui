'use client'

import { useId, useMemo, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Reveal } from '@youj/motion'
import { PencilIcon } from '@youj/icons'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { AppPage } from '../../components/ui/app-page'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { DateRangePicker } from '../../components/ui/date-range-picker'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { Field, FieldLabel } from '../../components/ui/field'
import { Skeleton } from '../../components/ui/skeleton'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { useNow } from '../../hooks/use-now'
import { cn, numberFormat } from '../../lib/utils'
import { Channels } from './analytics-overview/channels'
import { DEFAULT_COPY, type AnalyticsOverviewCopy } from './analytics-overview/copy'
import {
  FIRST_TODAY,
  formatSpan,
  KPIS,
  LAUNCH,
  lastDays,
  summarise,
  usd,
  withCurrency,
  type AnalyticsCategory,
  type AnalyticsChannel,
  type AnalyticsKpi,
  type DateSpan,
  type Day,
  type Metric,
  type Point,
  type ProductRow,
  type Summary,
} from './analytics-overview/data'
import { Kpis } from './analytics-overview/kpis'
import { Categories, TopProducts } from './analytics-overview/top-products'
import { Trend } from './analytics-overview/trend'

/* Fieldnote Supply's store overview: how the shop did over a span of days.
 * A date-range picker (presets beside a two-month calendar) sets the span;
 * every figure on the page is recomputed for it and compared with the
 * same-length period just before. Four KPI cards roll their numbers to the
 * new values and morph their sparklines; the trend chart morphs its area
 * (this period) over a dashed line (the previous one), with a metric switch;
 * the channel donut sweeps to its new shares; the category treemap re-lays
 * its cells; and the top-products table re-ranks. Colors come from the
 * theme's chart palette, so every preset, light and dark, recolors it.
 * The new span and its revenue are announced. Feed it your data: answer
 * `onRangeChange` with a new `summary` from your analytics API (an
 * `AnalyticsSummary`), set `kpis`, `currency` and `brand`; every string is in
 * `copy`. It is built for the compact layout density (ui.css), taken from the page,
 * and lays out by its own width, not the window's: the KPIs go two abreast
 * from 36rem and four from 56rem, where the charts take the side column too.
 * Reduced motion: numbers, marks and cells land at once. */

interface AnalyticsOverviewProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** A page in your app's frame: the shared page header (AppPage) and the frame's gutter, across the whole width, with no store header of its own. Default true; `false` draws its own page (the store header and a centered canvas). */
  embedded?: boolean
  /** The title's level. Default 1. */
  headingLevel?: 1 | 2 | 3
  /** The span shown (controlled); pair it with `onRangeChange`. */
  range?: DateSpan
  /** The span shown first. Default: the last 30 days. */
  defaultRange?: DateSpan
  /** Called with each complete span the picker settles on. */
  onRangeChange?: (range: DateSpan) => void
  /** The page's figures for the span shown, from your analytics API. Default: the demo store's, computed for the span. */
  summary?: Summary
  /** The headline numbers, in order. Default: revenue, orders, conversion rate and average order. */
  kpis?: AnalyticsKpi[]
  /** The trend chart's metric (controlled); pair it with `onMetricChange`. */
  metric?: Metric
  /** The trend chart's first metric. Default `revenue`. */
  defaultMetric?: Metric
  /** Called with the metric the trend switch lands on. */
  onMetricChange?: (metric: Metric) => void
  /** Today, the last day the picker offers. Default: the browser's today once mounted (a fixed demo day before, so hydration matches). */
  today?: Date | number
  /** The first day the picker offers. Default: the demo store's launch, Jan 6, 2025. */
  minDate?: Date
  /** The currency of every amount. Default `USD`. */
  currency?: string
  /** Formats dates and numbers. Default: the YoujProvider locale. */
  locale?: string
  /** The store in the standalone header: its name and mark. Default: Fieldnote Supply and a pencil. */
  brand?: { name: string; logo?: ReactNode }
  /** Beside the date picker: an export button, a filter. Default: none. */
  actions?: ReactNode
  /** Skeletons in place of the figures while your data loads; the layout holds. Default false. */
  loading?: boolean
  /** Shown in place of the figures when they fail to load, with a retry button when `onRetry` is set. Default: none. */
  error?: ReactNode
  /** Retries loading after an `error`. Default: none. */
  onRetry?: () => void
  /** Replaces the message for a span without visitors or orders. Default: `copy.empty` and `copy.emptyDetail`. */
  empty?: ReactNode
  /** Any of the page's strings, to rewrite or translate. Default: the demo's English strings. */
  copy?: Partial<AnalyticsOverviewCopy>
}

type Picked = ComponentProps<typeof DateRangePicker>['value']

function AnalyticsOverview({
  theme,
  embedded = true,
  headingLevel = 1,
  range: rangeProp,
  defaultRange,
  onRangeChange,
  summary: summaryProp,
  kpis = KPIS,
  metric: metricProp,
  defaultMetric = 'revenue',
  onMetricChange,
  today: todayProp,
  minDate = LAUNCH,
  currency = 'USD',
  locale: localeProp,
  brand,
  actions,
  loading = false,
  error,
  onRetry,
  empty,
  copy: copyProp,
  className,
  ...rest
}: AnalyticsOverviewProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const titleId = useId()
  const Title = `h${headingLevel}` as 'h1' | 'h2' | 'h3'
  const locale = useLocale(localeProp)
  const { announce, announcer } = useAnnouncer()
  // The browser's today, once hydrated: until then a fixed day, so the server's render and the first client render match.
  const now = useNow(0)
  const today = useMemo(() => (todayProp !== undefined ? new Date(todayProp) : now === null ? FIRST_TODAY : new Date(now)), [todayProp, now])
  const [chosen, setChosen] = useControllableState<DateSpan | null>(rangeProp, defaultRange ?? null)
  const range = useMemo(() => chosen ?? lastDays(today, 30), [chosen, today])
  const [metric, setMetric] = useControllableState(metricProp, defaultMetric)
  // The picker holds a half-picked range (a start, no end yet) while the page keeps showing the last whole one.
  const [picking, setPicking] = useState<{ value: Picked } | null>(null)
  const summary = useMemo(() => summaryProp ?? summarise(range, locale), [summaryProp, range, locale])
  const money = useMemo(() => numberFormat(locale, withCurrency(usd, currency)).format, [locale, currency])
  const blank = !summary.totals.visitors && !summary.totals.orders && !summary.totals.revenue

  const pick = (next: Picked) => {
    if (!next?.from || !next.to) return setPicking({ value: next })
    const span = { from: next.from, to: next.to }
    setPicking(null)
    setChosen(span)
    onRangeChange?.(span)
    // Your summary for the new span arrives later; the demo's is known now.
    if (!summaryProp) announce(copy.announce(formatSpan(span, locale), money(summarise(span, locale).totals.revenue)))
  }
  const pickMetric = (next: Metric) => {
    setMetric(next)
    onMetricChange?.(next)
  }

  const parts = { summary, locale, currency, copy }
  const figures = error ? (
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
  ) : !loading && blank ? (
    (empty ?? (
      <Empty className="rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line">
        <EmptyHeader>
          <EmptyTitle>{copy.empty}</EmptyTitle>
          <EmptyDescription>{copy.emptyDetail}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    ))
  ) : (
    <>
      <Kpis summary={summary} kpis={kpis} locale={locale} currency={currency} loading={loading} copy={copy} />
      {loading ? (
        <>
          <span className="sr-only">{copy.loading}</span>
          {[0, 1].map((row) => (
            <div key={row} className="grid gap-6 @4xl/analytics:grid-cols-[minmax(0,1fr)_--spacing(88)]">
              <Skeleton className="h-80 rounded-xl" />
              <Skeleton className="h-80 rounded-xl" />
            </div>
          ))}
        </>
      ) : (
        <>
          <div className="grid gap-6 @4xl/analytics:grid-cols-[minmax(0,1fr)_--spacing(88)]">
            <Trend {...parts} metric={metric} onMetricChange={pickMetric} />
            <Channels {...parts} />
          </div>
          <div className="grid gap-6 @4xl/analytics:grid-cols-[minmax(0,1fr)_--spacing(88)]">
            <TopProducts {...parts} />
            <Categories {...parts} />
          </div>
        </>
      )}
    </>
  )

  const description = (
    <>
      {formatSpan(summary.span, locale)} <span aria-hidden>·</span> {copy.comparedWith} {formatSpan(summary.previousSpan, locale)}
    </>
  )
  const controls = (
    <>
      <Field className="w-full sm:w-auto">
        <FieldLabel className="sr-only">{copy.dateRange}</FieldLabel>
        <DateRangePicker value={picking ? picking.value : range} onValueChange={pick} minDate={minDate} maxDate={today} />
      </Field>
      {actions}
    </>
  )
  const body = (
    <>
      <div aria-busy={loading || undefined} className="flex flex-col gap-6">
        {figures}
      </div>
      {announcer}
    </>
  )

  const view = embedded ? (
    <AppPage
      {...rest}
      title={copy.title}
      description={description}
      actions={controls}
      headingLevel={headingLevel}
      width="fill"
      className={cn('text-fg', className)}
      classNames={{ body: '@container/analytics' }}
    >
      {body}
    </AppPage>
  ) : (
    <div {...rest} className={cn('min-h-dvh bg-canvas text-fg', className)}>
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 md:px-8">
          {brand?.logo ?? (
            <span aria-hidden className="grid size-7 place-items-center rounded-md bg-accent text-on-accent">
              <PencilIcon size={15} />
            </span>
          )}
          <span className="font-semibold tracking-tight whitespace-nowrap">{brand?.name ?? 'Fieldnote Supply'}</span>
          <span aria-hidden className="text-fg-muted max-sm:hidden">/</span>
          <span className="truncate text-fg-muted max-sm:hidden">{copy.section}</span>
          <Badge variant="outline" className="ms-auto">
            {copy.badge}
          </Badge>
        </div>
      </header>
      <main aria-labelledby={titleId} className="@container/analytics mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 md:px-8">
        <Reveal inView={false} variant="rise" className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div className="flex min-w-0 flex-col gap-1">
            <Title id={titleId} className="text-2xl font-semibold tracking-tight">
              {copy.title}
            </Title>
            <p className="text-ui text-fg-muted">{description}</p>
          </div>
          <div className="flex w-full flex-wrap items-end gap-2 sm:w-auto">{controls}</div>
        </Reveal>
        {body}
      </main>
    </div>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export {
  AnalyticsOverview,
  type AnalyticsCategory,
  type AnalyticsChannel,
  type AnalyticsKpi,
  type Metric as AnalyticsMetric,
  type AnalyticsOverviewCopy,
  type AnalyticsOverviewProps,
  type DateSpan as AnalyticsDateSpan,
  type Day as AnalyticsDay,
  type Point as AnalyticsPoint,
  type ProductRow as AnalyticsProduct,
  type Summary as AnalyticsSummary,
}
