import { cn } from '../../../lib/utils'
import { Skeleton } from '../../../components/ui/skeleton'
import { CardContent } from '../../../components/ui/card'
import { Stat, StatDelta, StatGroup, StatValue } from '../../../components/ui/stat-card'
import type { ArcGlobeCopy, ArcGlobePeriod } from './data'
import type { Formats } from './panels'

/* The figures above the globe: how many are happening now, the two totals
 * and the period's rate, each with its change. A figure that can't be shown
 * (loading, failed, nothing yet) is a skeleton or a dash in its place. */

interface FiguresProps {
  bare: boolean
  loading: boolean
  now: number
  /** Against an hour ago, as a fraction. */
  nowChange: number
  totals: { volume: number; secondary: number; change: number; secondaryChange: number }
  rate: ArcGlobePeriod['rate']
  format: Formats
  copy: ArcGlobeCopy
}

export function Figures({ bare, loading, now, nowChange, totals, rate, format, copy }: FiguresProps) {
  const dash = (skeleton: string) =>
    loading ? (
      <>
        <Skeleton className={skeleton} />
        <Skeleton className="h-5 w-28" />
      </>
    ) : (
      <>
        <span className={cn(skeleton.split(' ')[0], 'block font-mono text-ui-lg text-fg-subtle')}>—</span>
        <span aria-hidden className="block h-5" />
      </>
    )
  return (
    <CardContent className="px-0 pb-0">
      <StatGroup className="rounded-none border-x-0 shadow-none">
        {/* On a phone the two wide figures take a row each; the counts share one. */}
        <Stat label={copy.now} className="max-sm:col-span-full">
          {bare ? (
            dash('h-9 w-24')
          ) : (
            <>
              <StatValue value={now} format={format.count} locale={copy.locale} size="lg" />
              <StatDelta value={nowChange}>{copy.vsHourAgo}</StatDelta>
            </>
          )}
        </Stat>
        <Stat label={copy.primary}>
          {bare ? (
            dash('h-7 w-20')
          ) : (
            <>
              <StatValue value={totals.volume} format={format.compact} locale={copy.locale} />
              <StatDelta value={totals.change}>{copy.vsPrevious}</StatDelta>
            </>
          )}
        </Stat>
        <Stat label={copy.secondary}>
          {bare ? (
            dash('h-7 w-20')
          ) : (
            <>
              <StatValue value={totals.secondary} format={format.compact} locale={copy.locale} />
              <StatDelta value={totals.secondaryChange}>{copy.vsPrevious}</StatDelta>
            </>
          )}
        </Stat>
        {rate && (
          <Stat label={copy.rate} className="max-sm:col-span-full">
            {bare ? (
              dash('h-7 w-20')
            ) : (
              <>
                <StatValue value={rate.share} format={{ style: 'percent', maximumFractionDigits: 1 }} locale={copy.locale} />
                {/* A rate of what goes wrong: a fall reads in the good ink. */}
                <StatDelta value={rate.change} invert>
                  {copy.vsPrevious}
                </StatDelta>
              </>
            )}
          </Stat>
        )}
      </StatGroup>
    </CardContent>
  )
}
