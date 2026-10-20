'use client'

import { useId } from 'react'
import { Badge, BadgeDot } from '../../../components/ui/badge'
import { Card, CardContent, CardHeader } from '../../../components/ui/card'
import { ForecastBand } from '../../../components/ui/forecast-band'
import { Skeleton } from '../../../components/ui/skeleton'
import { StatDelta, StatValue } from '../../../components/ui/stat-card'
import { dateTimeFormat, numberFormat } from '../../../lib/utils'
import type { SpendOverviewCopy } from './data'
import { addDays } from './format'
import type { SpendForecast } from './forecast'

interface HeadlineProps {
  copy: SpendOverviewCopy
  locale: string
  currency: string
  start: string
  periodDays: number
  limit: number
  spent: number
  previous: number
  forecast: SpendForecast
  loading?: boolean
}

/** One legend entry: a short stroke in the line's own look, then its name. */
function Key({ label, line }: { label: string; line: string }) {
  return (
    <span className="flex items-center gap-2">
      <span aria-hidden className={line} />
      {label}
    </span>
  )
}

/** The headline: the spend so far, how it changed, whether it stays under the limit, and the month's running total carried to its end. */
function Headline({ copy, locale, currency, start, periodDays, limit, spent, previous, forecast, loading }: HeadlineProps) {
  const labelId = useId()
  const day = dateTimeFormat(locale, { month: 'short', day: 'numeric', timeZone: 'UTC' })
  const whole = numberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 })
  const dateOf = (n: number) => day.format(addDays(start, n - 1))
  const change = previous > 0 ? (spent - previous) / previous : undefined

  const status = forecast.crossed
    ? { tone: 'danger' as const, text: copy.overLimit(dateOf(forecast.crossesOn ?? 1)) }
    : forecast.crossesOn !== null
      ? { tone: 'warning' as const, text: copy.willExceed(dateOf(forecast.crossesOn)) }
      : { tone: 'success' as const, text: copy.onTrack }

  return (
    <Card role="group" aria-labelledby={labelId} aria-busy={loading || undefined}>
      <CardHeader className="gap-2">
        <p id={labelId} className="text-ui text-fg-muted">
          {copy.workspaceSpend}
        </p>
        {loading ? (
          <Skeleton className="h-10 w-52" />
        ) : (
          <StatValue size="lg" value={spent} from={spent} format={{ style: 'currency', currency }} locale={locale} />
        )}
        <div className="flex min-h-6 flex-wrap items-center gap-x-4 gap-y-2">
          {loading ? (
            <Skeleton className="h-4 w-64" />
          ) : (
            <>
              {change !== undefined && (
                <StatDelta value={change} invert locale={locale}>
                  {copy.change(copy.lastPeriod)}
                </StatDelta>
              )}
              <Badge variant={status.tone} size="lg">
                <BadgeDot />
                {status.text}
              </Badge>
              <span className="text-ui text-fg-muted tabular-nums">{copy.projected(whole.format(forecast.projected), dateOf(periodDays))}</span>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {loading ? (
          <Skeleton className="h-66 w-full" />
        ) : (
          <ForecastBand
            actual={forecast.actual}
            forecast={forecast.forecast}
            budget={limit}
            start={start}
            format={{ style: 'currency', currency, maximumFractionDigits: 0 }}
            locale={locale}
            label={copy.chart}
            legend={false}
          />
        )}
        <div aria-hidden className="flex flex-wrap items-center gap-x-5 gap-y-1 text-ui-sm text-fg-muted">
          <Key label={copy.legendSpent} line="h-0.5 w-4 rounded-full bg-fg" />
          <Key label={copy.legendForecast} line="h-0.5 w-4 rounded-full bg-chart-5" />
          <Key label={copy.legendLimit} line="w-4 border-t border-dashed border-fg-subtle" />
        </div>
      </CardContent>
    </Card>
  )
}

export { Headline }
