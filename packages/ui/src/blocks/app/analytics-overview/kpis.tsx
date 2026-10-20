'use client'

import { Sparkline } from '../../../components/ui/sparkline'
import { StatBars, StatCard } from '../../../components/ui/stat-card'
import type { AnalyticsOverviewCopy } from './copy'
import { withCurrency, type AnalyticsKpi, type Summary } from './data'

interface KpisProps {
  summary: Summary
  kpis: AnalyticsKpi[]
  locale: string
  currency: string
  loading: boolean
  copy: AnalyticsOverviewCopy
}

/* Sums and counts draw as bars, one per bucket of the range (with the
 * previous period's bucket as a tick on each while there are few enough to
 * read), and rates and averages as a line. Each takes its series color from
 * the trend chart below. */

/** The period's headline numbers against the period before, each with its shape over the range. */
function Kpis({ summary, kpis, locale, currency, loading, copy }: KpisProps) {
  return (
    // Two, then four abreast by the block's own width (its @container), so it fits whatever cell it's embedded in.
    <section aria-label={copy.kpis} className="grid grid-cols-1 gap-4 @xl/analytics:grid-cols-2 @4xl/analytics:grid-cols-4">
      {kpis.map((kpi) => {
        const value = kpi.value(summary.totals)
        const previous = kpi.value(summary.previousTotals)
        const series = summary.series.map(kpi.value)
        return (
          <StatCard
            key={kpi.label}
            label={kpi.label}
            value={value}
            format={withCurrency(kpi.format, currency)}
            locale={locale}
            delta={previous ? (value - previous) / previous : undefined}
            comparison={copy.vsPrevious}
            loading={loading}
            chart={
              kpi.bars ? (
                <StatBars
                  data={series}
                  // Ticks for the previous period while each bar has room for one; past that the change says it.
                  previous={series.length <= 16 ? summary.previousSeries.map(kpi.value) : undefined}
                  tone={kpi.tone}
                  label={copy.byUnit(kpi.label, summary.unit)}
                />
              ) : (
                <Sparkline data={series} color={`var(--color-${kpi.tone})`} className="h-9" />
              )
            }
          />
        )
      })}
    </section>
  )
}

export { Kpis }
