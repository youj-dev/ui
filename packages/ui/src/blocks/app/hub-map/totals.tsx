import type { ReactNode } from 'react'
import { Counter } from '@youj/motion'
import { CardContent } from '../../../components/ui/card'
import { Skeleton } from '../../../components/ui/skeleton'
import { Eyebrow } from '../../../components/ui/typography'
import { cn } from '../../../lib/utils'
import type { HubMapCopy } from './data'

/* The throughput, large, and the three figures beside it. */

const VOICE = 'font-(family-name:--yj-label-font) tracking-(--yj-label-tracking) [text-transform:var(--yj-label-case)]'

interface TotalsProps {
  loading: boolean
  /** Loading, failed or nothing yet: no figure to show. */
  bare: boolean
  total: number
  volumeFormat: Intl.NumberFormatOptions
  stats: { label: string; value: ReactNode; tone: string }[]
  copy: HubMapCopy
}

export function Totals({ loading, bare, total, volumeFormat, stats, copy }: TotalsProps) {
  return (
    <CardContent className="flex flex-col gap-4 py-(--card-spacing) sm:grid sm:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] sm:gap-x-4">
      <div className="flex min-w-0 flex-col gap-1.5">
        <Eyebrow className={VOICE}>{copy.throughput}</Eyebrow>
        {loading ? (
          <Skeleton className="h-10 w-32" />
        ) : bare ? (
          <p className="h-10 font-mono text-4xl leading-none font-medium text-fg-subtle">—</p>
        ) : (
          <p className="flex items-baseline gap-1 font-mono leading-none">
            <Counter
              value={total}
              from={total}
              locale={copy.locale}
              format={volumeFormat}
              duration="slow"
              className="text-4xl font-medium tracking-tight"
            />
            <span className="text-ui-lg text-fg-muted">{copy.unit}</span>
          </p>
        )}
      </div>
      {/* A wrapping row on a phone; on a wider card its figures join the grid beside the total. */}
      <dl className="flex flex-wrap gap-x-4 gap-y-3 sm:contents">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={cn('flex min-w-0 flex-col justify-end gap-1 sm:border-s sm:border-line sm:ps-4', i > 0 && 'border-s border-line ps-4')}
          >
            <dt>
              <Eyebrow className={cn('block truncate', VOICE)}>{stat.label}</Eyebrow>
            </dt>
            <dd className={cn('truncate font-mono text-ui-lg font-medium tabular-nums', stat.tone || 'text-fg')}>{stat.value}</dd>
          </div>
        ))}
      </dl>
    </CardContent>
  )
}
