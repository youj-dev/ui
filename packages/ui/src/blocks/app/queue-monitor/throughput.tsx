'use client'

import type { ReactNode } from 'react'
import { Badge } from '../../../components/ui/badge'
import { Skeleton } from '../../../components/ui/skeleton'
import { Sparkline } from '../../../components/ui/sparkline'
import { Eyebrow } from '../../../components/ui/typography'
import { cn, numberFormat } from '../../../lib/utils'
import type { QueueMonitorCopy, QueueMonitorQueue } from './data'

/** A recessed well: a step below the section in dark, a light gray fill in light. */
const WELL = 'bg-[color-mix(in_oklab,var(--color-canvas)_calc(45%*var(--yj-dark)),color-mix(in_oklab,var(--color-fg)_3%,transparent))]'

/** A formatted figure with its unit set small and muted: "4.2" and "s". */
function Figure({ parts }: { parts: Intl.NumberFormatPart[] }) {
  return parts.map((part, i) =>
    part.type === 'unit' ? (
      <span key={i} className="text-fg-muted">
        {part.value}
      </span>
    ) : (
      part.value
    ),
  )
}

interface ThroughputProps {
  /** Without a queue the figures are skeletons (`loading`) or dashes. */
  queue?: QueueMonitorQueue
  loading?: boolean
  copy: QueueMonitorCopy
  format?: { rate?: (n: number) => string; age?: (seconds: number) => string }
}

/** Jobs a minute, big and in mono, how far it moved over the half hour, two waits as ruled rows, and the half hour's trace in a well. */
function Throughput({ queue, loading = false, copy, format }: ThroughputProps) {
  const number = numberFormat(copy.locale)
  const signed = numberFormat(copy.locale, { style: 'percent', signDisplay: 'exceptZero', maximumFractionDigits: 0 })
  const seconds = numberFormat(copy.locale, { style: 'unit', unit: 'second', unitDisplay: 'narrow', maximumFractionDigits: 1 })
  const rate = queue?.throughput.at(-1) ?? 0
  const first = queue?.throughput[0] || rate
  const change = first ? (rate - first) / first : 0
  const age = (value: number) => (format?.age ? [{ type: 'literal', value: format.age(value) } as Intl.NumberFormatPart] : seconds.formatToParts(value))
  // A figure is a skeleton while loading and a dash when there is nothing to show.
  const figure = (value: ReactNode, skeleton: string) => (loading ? <Skeleton className={skeleton} /> : queue ? value : <span className="text-fg-subtle">—</span>)
  const stats = [
    { label: copy.p95Wait, parts: age(queue?.p95Wait ?? 0), hot: (queue?.p95Wait ?? 0) > 30 },
    { label: copy.oldest, parts: age(queue?.oldest ?? 0), hot: (queue?.oldest ?? 0) > 300 },
  ]

  return (
    <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] sm:gap-6">
      <div className="flex min-w-0 flex-col gap-3">
        <Eyebrow>{copy.throughput}</Eyebrow>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-2">
          <span className={cn('font-mono text-3xl leading-none font-medium tracking-tight text-fg tabular-nums', loading && 'self-center')}>
            {figure(format?.rate ? format.rate(rate) : number.format(rate), 'h-7.5 w-20')}
          </span>
          <span dir="auto" className="font-mono text-ui-lg text-fg-muted">
            {copy.perMinute}
          </span>
          {queue ? (
            <Badge dir="auto" variant={change >= 0 ? 'success' : 'danger'} className="ms-1 self-center font-mono tabular-nums">
              {copy.change(signed.format(change))}
            </Badge>
          ) : (
            // Holds the badge's room (it wraps under the figure) so the card keeps its height.
            <span className="basis-full">
              <Skeleton className={cn('ms-1 h-5.5 w-40 rounded-full', !loading && 'invisible')} />
            </span>
          )}
        </div>
        <dl className="mt-auto flex flex-col">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-baseline justify-between gap-4 border-t border-line py-2 last:pb-0">
              <Eyebrow render={<dt />}>{stat.label}</Eyebrow>
              <dd className={cn('font-mono text-ui-lg tabular-nums', stat.hot ? 'text-warning-text' : 'text-fg', loading && 'self-center')}>
                {figure(<Figure parts={stat.parts} />, 'h-5 w-12')}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <div className={cn('flex min-w-0 flex-col gap-3 rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] p-3.5', WELL)}>
        <div className="flex items-baseline justify-between gap-3">
          <Eyebrow>{copy.last30}</Eyebrow>
          <Eyebrow className="tabular-nums">{copy.now}</Eyebrow>
        </div>
        {queue ? (
          <Sparkline data={queue.throughput} label={copy.trend} color="var(--color-chart-5)" className="min-h-20 w-full flex-1" />
        ) : (
          <svg aria-hidden preserveAspectRatio="none" viewBox="0 0 100 20" className="min-h-20 w-full flex-1 overflow-visible">
            <line x1={0} x2={100} y1={10} y2={10} strokeDasharray="2 4" vectorEffect="non-scaling-stroke" className="stroke-line-strong" />
          </svg>
        )}
      </div>
    </div>
  )
}

export { Throughput }
