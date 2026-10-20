'use client'

import { Counter } from '@youj/motion'
import { Badge, BadgeDot } from '../../../components/ui/badge'
import { Eyebrow } from '../../../components/ui/typography'
import { cn, numberFormat } from '../../../lib/utils'
import type { PercentileTrendCopy } from './data'

/** The theme's label voice (mono capitals in Bezel); Bezel sets every Eyebrow in it anyway. */
export const VOICE = 'font-(family-name:--yj-label-font) tracking-(--yj-label-tracking) [text-transform:var(--yj-label-case)]'

interface HeadlineProps {
  /** In the figures' unit (milliseconds by default). */
  p50: number
  p90: number
  p99: number
  previous: number
  count: number
  /** Writes a value as text. Default: milliseconds, and seconds from 1 s, in the locale. */
  format?: (value: number) => string
  copy: PercentileTrendCopy
}

const unitOf = (locale: string, unit: 'millisecond' | 'second') =>
  numberFormat(locale, { style: 'unit', unit, unitDisplay: 'short' }).formatToParts(1).find((part) => part.type === 'unit')?.value ?? ''

/** The p99, large and counting to each new window's value, how it moved since the period before, and p50, p90 and the request count beside it. */
function Headline({ p50, p90, p99, previous, count, format, copy }: HeadlineProps) {
  const seconds = !format && p99 >= 1000
  const ms = numberFormat(copy.locale, { style: 'unit', unit: 'millisecond', unitDisplay: 'short', maximumFractionDigits: 0 })
  const delta = numberFormat(copy.locale, {
    style: 'unit',
    unit: 'millisecond',
    unitDisplay: 'short',
    maximumFractionDigits: 0,
    signDisplay: 'exceptZero',
  })
  const compact = numberFormat(copy.locale, { notation: 'compact', maximumSignificantDigits: 3 })
  const change = Math.round(p99 - previous)
  const slower = change > 0
  const stats = [
    { label: copy.p50, value: (format ?? ms.format)(p50) },
    { label: copy.p90, value: (format ?? ms.format)(p90) },
    { label: copy.count, value: compact.format(count) },
  ]

  return (
    <div
      data-slot="percentile-trend-headline"
      className="grid items-end gap-x-10 gap-y-5 sm:grid-cols-[minmax(0,1fr)_minmax(--spacing(44),--spacing(52))]"
    >
      <div className="flex min-w-0 flex-col gap-3">
        <Eyebrow className={cn('text-ui-sm text-fg-muted', VOICE)}>{copy.headline}</Eyebrow>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="flex items-baseline gap-1.5 font-mono text-[length:--spacing(11)] leading-none font-medium tracking-[-0.03em] text-fg">
            {format ? (
              // Your own unit: the figure as you write it, without the count-up.
              format(p99)
            ) : (
              <>
                {/* Keyed by unit, so crossing a second remounts it instead of counting milliseconds as seconds. */}
                <Counter
                  key={seconds ? 's' : 'ms'}
                  value={seconds ? p99 / 1000 : p99}
                  from={seconds ? p99 / 1000 : 0}
                  format={seconds ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : { maximumFractionDigits: 0 }}
                  locale={copy.locale}
                />
                <span className="text-[0.5em] tracking-normal text-fg-muted">{unitOf(copy.locale, seconds ? 'second' : 'millisecond')}</span>
              </>
            )}
          </p>
          <Badge
            variant={slower ? 'warning' : 'success'}
            title={slower ? copy.slower : copy.faster}
            size="lg"
            className="font-mono text-ui-sm tracking-normal normal-case tabular-nums"
          >
            <BadgeDot />
            <bdi>{copy.change(format ? `${change > 0 ? '+' : change < 0 ? '−' : ''}${format(Math.abs(change))}` : delta.format(change))}</bdi>
          </Badge>
        </div>
      </div>
      <dl data-slot="percentile-trend-stats" aria-label={copy.stats} className="flex flex-col gap-2">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-baseline justify-between gap-6">
            <Eyebrow render={<dt />} className={cn('text-ui-sm text-fg-muted', VOICE)}>
              {stat.label}
            </Eyebrow>
            <dd className="font-mono text-ui-lg text-fg tabular-nums">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export { Headline }
