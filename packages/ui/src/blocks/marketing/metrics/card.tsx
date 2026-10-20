'use client'

import { useMemo } from 'react'
import { Counter } from '@youj/motion'
import { TrendingDownIcon, TrendingUpIcon } from '@youj/icons'
import { Skeleton } from '../../../components/ui/skeleton'
import { Sparkline } from '../../../components/ui/sparkline'
import { cn, numberFormat } from '../../../lib/utils'
import type { MarketingMetricsCopy, MetricsMetric, MetricsPeriod } from './data'

/* One metric: the figure counting up to its value for the chosen period, the
 * change on the period before (colored by whether that direction is good),
 * its trend line, and, where the metric has a baseline, ours against theirs
 * as two bars. A footnote number links to its source. */

interface MetricCardProps {
  metric: MetricsMetric
  period: MetricsPeriod
  /** The footnote's number, when the metric cites a source. */
  note: number | undefined
  /** The id of the footnote the number links to. */
  noteId: string
  locale: string
  copy: MarketingMetricsCopy
}

export function MetricCard({ metric, period, note, noteId, locale, copy }: MetricCardProps) {
  const datum = metric.values[period.id]
  const percent = useMemo(() => numberFormat(locale, { style: 'percent', maximumFractionDigits: 2 }), [locale])
  const better = metric.better ?? 'up'
  const delta = datum?.delta
  const good = delta === undefined || delta === 0 ? undefined : (delta > 0) === (better === 'up')
  const baseline = datum?.baseline
  const top = datum && baseline !== undefined ? Math.max(datum.value, baseline) : 0
  const Arrow = delta !== undefined && delta < 0 ? TrendingDownIcon : TrendingUpIcon
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-ui text-fg-muted">{metric.label}</h3>
        {note !== undefined && (
          <a href={`#${noteId}`} aria-label={copy.source(note)} className="rounded-sm text-ui-xs font-medium text-fg-muted tabular-nums hover:text-fg focus-ring">
            <sup>{note}</sup>
          </a>
        )}
      </div>
      {datum ? (
        <>
          <p className="flex items-baseline text-4xl font-semibold tracking-tight text-fg tabular-nums">
            <Counter value={datum.value} mode="roll" format={metric.format} locale={locale} duration="deliberate" />
            {metric.suffix && <span className="ms-0.5 text-2xl text-fg-muted">{metric.suffix}</span>}
          </p>
          {delta !== undefined && (
            <p
              className={cn('inline-flex items-center gap-1.5 text-ui-sm font-medium', good === undefined ? 'text-fg-muted' : good ? 'text-success-text' : 'text-danger-text')}
            >
              <Arrow size={14} aria-hidden className="rtl:-scale-x-100" />
              <span aria-hidden>{percent.format(Math.abs(delta))}</span>
              <span className="sr-only">{(delta >= 0 ? copy.up : copy.down)(percent.format(Math.abs(delta)))}</span>
            </p>
          )}
          {datum.series && datum.series.length > 1 && (
            <Sparkline data={datum.series} label={copy.trend(metric.label, period.label)} className="mt-auto h-10 w-full" />
          )}
          {baseline !== undefined && (
            <dl className={cn("flex flex-col gap-1.5 text-ui-xs text-fg-muted", !datum.series && "mt-auto")}>
              {[
                { name: copy.ours, value: datum.value, ours: true },
                { name: metric.baselineLabel ?? copy.baseline, value: baseline, ours: false },
              ].map((row) => (
                <div key={row.name} className="grid grid-cols-[--spacing(24)_minmax(0,1fr)_--spacing(14)] items-center gap-2">
                  <dt className="truncate">{row.name}</dt>
                  <dd aria-hidden className="h-1.5 rounded-full bg-well">
                    {metric.baselineBars !== false && (
                      <span
                        className={cn('block h-full rounded-full transition-[width] yj-duration-slow ease-standard', row.ours ? 'bg-accent' : 'bg-fg-subtle')}
                        style={{ width: `${(row.value / top) * 100}%` }}
                      />
                    )}
                  </dd>
                  <dd className="text-end font-medium text-fg tabular-nums">
                    {numberFormat(locale, metric.format).format(row.value)}
                    {metric.suffix}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </>
      ) : (
        <p className="text-ui text-fg-muted">{copy.noData}</p>
      )}
    </div>
  )
}

export function MetricCardSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5">
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="mt-auto h-10 w-full" />
    </div>
  )
}
