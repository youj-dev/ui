'use client'

import { useMemo } from 'react'
import { Counter } from '@youj/motion'
import { TrendingDownIcon, TrendingUpIcon } from '@youj/icons'
import { cn, numberFormat } from '../../../lib/utils'
import type { CustomerStoryCopy, CustomerStoryMetric } from './data'

/* The results: each a figure that counts up to where the customer is now, the
 * change since the start (colored by whether that direction is good) and two
 * bars, before and now, on one scale, so the size of the change is a shape.
 * The change is spoken, and the bars are decorative. */

interface ResultsProps {
  metrics: CustomerStoryMetric[]
  locale: string
  copy: CustomerStoryCopy
  label: string
}

export function Results({ metrics, locale, copy, label }: ResultsProps) {
  const formats = useMemo(() => ({ percent: numberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }) }), [locale])
  return (
    <dl aria-label={label} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => {
        const nf = numberFormat(locale, metric.format)
        const change = metric.before ? (metric.after - metric.before) / metric.before : undefined
        const good = change === undefined ? undefined : (change > 0) === ((metric.better ?? 'up') === 'up')
        const top = Math.max(metric.before ?? 0, metric.after)
        const Arrow = change !== undefined && change < 0 ? TrendingDownIcon : TrendingUpIcon
        return (
          <div key={metric.label} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5">
            <dt className="text-ui text-fg-muted">{metric.label}</dt>
            <dd className="flex flex-col gap-3">
              <span className="flex items-baseline text-4xl font-semibold tracking-tight text-fg tabular-nums">
                <Counter value={metric.after} mode="roll" format={metric.format} locale={locale} duration="deliberate" />
                {metric.suffix && <span className="ms-0.5 text-2xl text-fg-muted">{metric.suffix}</span>}
              </span>
              {change !== undefined && metric.before !== undefined && (
                <>
                  <span className={cn('inline-flex items-center gap-1.5 text-ui-sm font-medium', good ? 'text-success-text' : 'text-danger-text')}>
                    <Arrow size={14} aria-hidden className="rtl:-scale-x-100" />
                    <span aria-hidden>{formats.percent.format(Math.abs(change))}</span>
                    <span className="sr-only">{(change < 0 ? copy.down : copy.up)(formats.percent.format(Math.abs(change)))}</span>
                    <span className="font-normal text-fg-muted">
                      {copy.from(nf.format(metric.before) + (metric.suffix ?? ''))}
                    </span>
                  </span>
                  <span aria-hidden className="flex flex-col gap-1.5">
                    {[
                      { name: copy.before, value: metric.before, tone: 'bg-fg-subtle' },
                      { name: copy.after, value: metric.after, tone: 'bg-accent' },
                    ].map((bar) => (
                      <span key={bar.name} className="grid grid-cols-[--spacing(10)_minmax(0,1fr)] items-center gap-2 text-ui-xs text-fg-muted">
                        <span>{bar.name}</span>
                        <span className="h-1.5 rounded-full bg-well">
                          <span className={cn('block h-full rounded-full', bar.tone)} style={{ width: `${(bar.value / top) * 100}%` }} />
                        </span>
                      </span>
                    ))}
                  </span>
                </>
              )}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
