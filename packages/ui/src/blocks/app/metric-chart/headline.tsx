'use client'

import { StatDelta, StatValue } from '../../../components/ui/stat-card'
import { cn } from '../../../lib/utils'

/* The figure the card leads with, in two states that share one place. At
 * rest: the range's total of the shown series, rolling to each new value
 * (a range, a hidden series), and its change against the period before.
 * While a bucket is picked: that bucket's total, set at once so it can be
 * read while the crosshair moves, its date, and its change against the same
 * bucket before. The resting figures stay in place, hidden, so letting go
 * shows them again without a roll. */

export interface Reading {
  /** The bucket's index. */
  index: number
  value: number
  date: string
  /** Its change against the same bucket of the period before, as a fraction. */
  change?: number
  /** Still filling: "so far" instead of a change. */
  partial: boolean
  /** What happened that day. */
  notes: string[]
}

interface HeadlineProps {
  total: number
  /** The change of the total against the period before, as a fraction. */
  change?: number
  comparison: string
  format?: Intl.NumberFormatOptions
  locale: string
  invert: boolean
  reading: Reading | null
  versus: string
  soFar: string
}

function Headline({ total, change, comparison, format, locale, invert, reading, versus, soFar }: HeadlineProps) {
  return (
    <div data-slot="metric-chart-headline" className="grid min-w-0">
      <div className={cn('col-start-1 row-start-1 flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1', reading && 'invisible')}>
        <StatValue value={total} format={format} locale={locale} size="lg" />
        {change !== undefined && (
          <StatDelta value={change} invert={invert} locale={locale}>
            {comparison}
          </StatDelta>
        )}
      </div>
      {reading && (
        // Keyed by the bucket, so each reading is set at once, in the same type as the total it stands in for.
        <div aria-hidden data-slot="metric-chart-reading" className="col-start-1 row-start-1 flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
          <StatValue key={reading.index} value={reading.value} from={reading.value} format={format} locale={locale} size="lg" />
          <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 text-ui-sm">
            <span className="font-medium text-fg">{reading.date}</span>
            {reading.partial ? (
              <span className="text-fg-muted">{soFar}</span>
            ) : (
              reading.change !== undefined && (
                <StatDelta key={reading.index} value={reading.change} invert={invert} locale={locale}>
                  {versus}
                </StatDelta>
              )
            )}
            {reading.notes.map((note) => (
              <span key={note} className="inline-flex items-center gap-1.5 self-center rounded-full border border-line px-2 text-ui-xs text-fg-muted">
                <span className="size-1.5 rounded-full bg-fg-muted" />
                {note}
              </span>
            ))}
          </span>
        </div>
      )}
    </div>
  )
}

export { Headline }
