'use client'

import { useId, type ComponentProps } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Reveal, Stagger } from '@youj/motion'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'
import { MetricCard, MetricCardSkeleton } from './metrics/card'
import { DEFAULT_COPY, METRICS, PERIODS, SOURCES } from './metrics/data'
import type { MarketingMetricsCopy, MetricsDatum, MetricsMetric, MetricsPeriod, MetricsSource } from './metrics/data'

/* Numbers with their context. Four headline figures, each counting up to its
 * value (a Counter, rolling like an odometer) for the period the visitor
 * picks (a segmented control; the figures, change and trend lines all move to
 * the new period), with the change on the period before colored by whether
 * that direction is good (a falling latency is green), a trend line, and
 * where there is a baseline, ours against theirs as two bars. Every figure
 * that cites a source carries a footnote number linking to it, and the
 * sources are listed under the grid. Screen readers get the final figure, the
 * change in words, and a polite announcement of the period shown.
 * Reduced motion: figures are simply there and the bars don't glide.
 * Pass your own `metrics` (their `values` keyed by `periods`' ids) and
 * `sources`, follow or drive the period with `period`, and set `locale`;
 * every string is in `copy`. */

interface MarketingMetricsProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** Default: the theme around it. The showcase passes the chosen preset here. */
  theme?: ThemeInput
  /** A section inside another page: the host lays it out (no page background, section padding or max width). Default false. */
  embedded?: boolean
  /** The headline figures. Default: the demo's four. */
  metrics?: MetricsMetric[]
  /** The periods to choose between; each metric's `values` is keyed by their ids. Default: the demo's 30 days, 12 months and all time. */
  periods?: MetricsPeriod[]
  /** The footnotes metrics cite by `source`. Default: the demo's three. */
  sources?: MetricsSource[]
  /** The period shown, controlled. */
  period?: string
  /** The period shown first, uncontrolled. Default: the first. */
  defaultPeriod?: string
  /** Called with the period the visitor picked. */
  onPeriodChange?: (period: string) => void
  /** Show skeletons in place of the figures, while the data loads. Default false. */
  loading?: boolean
  /** The locale numbers are written in. Default: the YoujProvider's. */
  locale?: string
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<MarketingMetricsCopy>
  /** The heading's level; the figures' labels sit one below. Default 2. */
  headingLevel?: 1 | 2 | 3
}

function MarketingMetrics({
  theme,
  embedded = false,
  metrics = METRICS,
  periods = PERIODS,
  sources = SOURCES,
  period: periodProp,
  defaultPeriod = periods[0]?.id ?? '',
  onPeriodChange,
  loading = false,
  locale: localeProp,
  copy: copyProp,
  headingLevel = 2,
  className,
  ...rest
}: MarketingMetricsProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const titleId = useId()
  const Title = `h${headingLevel}` as 'h1' | 'h2' | 'h3'
  const [periodId, setPeriodId] = useControllableState(periodProp, defaultPeriod)
  const period = periods.find((p) => p.id === periodId) ?? periods[0]
  // Footnotes are numbered in the order metrics cite them.
  const cited = [...new Set(metrics.flatMap((metric) => (metric.source ? [metric.source] : [])))].filter((id) => sources.some((s) => s.id === id))
  const view = (
    <section aria-labelledby={titleId} {...rest} className={cn('text-fg', !embedded && 'border-y border-line bg-transparent py-16 md:py-24', className)}>
      <div className={cn('flex flex-col gap-10', !embedded && 'mx-auto max-w-6xl px-4 sm:px-6')}>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <Reveal className="flex max-w-2xl flex-col gap-3">
            <p className="text-ui-sm font-medium text-accent">{copy.eyebrow}</p>
            <Title id={titleId} className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
              {copy.title}
            </Title>
            <p className="text-pretty text-ui-lg text-fg-muted">{copy.description}</p>
          </Reveal>
          {/* No scroll box around the switch: a box a few px too narrow scrolled and flickered as the indicator slid. */}
          {periods.length > 1 && (
            <SegmentedControl
              value={period?.id ?? ''}
              onValueChange={(next) => {
                setPeriodId(next)
                onPeriodChange?.(next)
              }}
              aria-label={copy.periodLabel}
              className="max-w-full shrink-0"
            >
              {periods.map((p) => (
                <SegmentedControlItem key={p.id} value={p.id}>
                  {p.label}
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
          )}
        </div>
        {period && (
          <p role="status" className="sr-only">
            {copy.showing(period.label)}
          </p>
        )}
        {loading || !period ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: metrics.length || 4 }, (_, i) => (
              <MetricCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <Stagger variant="rise" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" itemClassName="flex [&>*]:flex-1">
            {metrics.map((metric) => (
              <MetricCard
                key={metric.id}
                metric={metric}
                period={period}
                note={metric.source && cited.includes(metric.source) ? cited.indexOf(metric.source) + 1 : undefined}
                noteId={`${titleId}-${metric.source}`}
                locale={locale}
                copy={copy}
              />
            ))}
          </Stagger>
        )}
        {cited.length > 0 && (
          <ol aria-label={copy.sourcesLabel} className="flex flex-col gap-1.5 text-ui-sm text-fg-muted">
            {cited.map((id, i) => {
              const source = sources.find((s) => s.id === id)!
              return (
                <li key={id} id={`${titleId}-${id}`} className="flex gap-2">
                  <span aria-hidden className="tabular-nums">
                    {i + 1}
                  </span>
                  {source.href ? (
                    <a href={source.href} className="rounded-sm underline underline-offset-3 hover:text-fg focus-ring">
                      {source.text}
                    </a>
                  ) : (
                    <span>{source.text}</span>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </section>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { MarketingMetrics }
export type { MarketingMetricsProps, MarketingMetricsCopy, MetricsMetric, MetricsPeriod, MetricsDatum, MetricsSource }
