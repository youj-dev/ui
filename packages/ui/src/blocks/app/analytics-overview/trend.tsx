'use client'

import { useId, useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, Line, XAxis, YAxis } from 'recharts'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { ChartContainer, ChartDataTable, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, useChartMotion, type ChartConfig } from '../../../components/ui/chart'
import { ToggleGroup, ToggleGroupItem } from '../../../components/ui/toggle-group'
import type { AnalyticsOverviewCopy } from './copy'
import { METRICS, withCurrency, type Metric, type Summary } from './data'
import { numberFormat } from '../../../lib/utils'

interface TrendProps {
  summary: Summary
  locale: string
  currency: string
  metric: Metric
  onMetricChange: (metric: Metric) => void
  copy: AnalyticsOverviewCopy
}

/** The chosen metric over the range, against the period before it (dashed), aligned bucket by bucket. */
function Trend({ summary, locale, currency, metric, onMetricChange, copy }: TrendProps) {
  const motion = useChartMotion()
  const gradient = `trend-${useId().replace(/:/g, '')}`
  const config = useMemo(
    () =>
      ({
        current: { label: copy.thisPeriod, color: 'var(--color-chart-1)' },
        previous: { label: copy.previousPeriod, color: 'var(--color-fg-muted)' },
      }) satisfies ChartConfig,
    [copy.thisPeriod, copy.previousPeriod],
  )
  const label = copy.metrics[metric]
  const { format, axis } = METRICS[metric]
  const value = useMemo(() => numberFormat(locale, withCurrency(format, currency)).format, [locale, format, currency])
  const tick = useMemo(() => numberFormat(locale, withCurrency(axis, currency)).format, [locale, axis, currency])
  const rows = summary.series.map((point, i) => ({ label: point.label, current: point[metric], previous: summary.previousSeries[i]?.[metric] }))
  const peak = rows.reduce((top, row) => (row.current > top.current ? row : top), rows[0] ?? { label: '', current: 0, previous: 0 })
  const change = summary.previousTotals[metric] ? summary.totals[metric] / summary.previousTotals[metric] - 1 : 0

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{copy.overTime(label)}</CardTitle>
        <CardDescription>
          {copy.per[summary.unit]}, {copy.against(summary.days)}
        </CardDescription>
        <CardAction className="max-sm:col-[1/-1]! max-sm:row-[3]! max-sm:mt-2 max-sm:justify-self-start!">
          <ToggleGroup variant="segmented" size="sm" aria-label={copy.metric} value={[metric]} onValueChange={(next: unknown[]) => next[0] && onMetricChange(next[0] as Metric)}>
            {(Object.keys(METRICS) as Metric[]).map((key) => (
              <ToggleGroupItem key={key} value={key} className="px-2.5">
                {copy.metrics[key]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <ChartContainer
          config={config}
          className="aspect-auto min-h-64 w-full flex-1"
          title={copy.overTime(label)}
          summary={copy.trendSummary(label, value(peak.current), peak.label, change)}
        >
          <AreaChart data={rows} margin={{ left: 0, right: 8, top: 8 }}>
            <defs>
              <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-current)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="var(--color-current)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={28} />
            <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={(v: number) => tick(v)} />
            <ChartTooltip content={<ChartTooltipContent valueFormatter={(v) => (typeof v === 'number' ? value(v) : v)} />} />
            <Line dataKey="previous" type="monotone" stroke="var(--color-previous)" strokeWidth={1.5} strokeDasharray="4 4" strokeOpacity={0.7} dot={false} activeDot={false} {...motion.draw(1)} />
            <Area dataKey="current" type="monotone" stroke="var(--color-current)" strokeWidth={2} fill={`url(#${gradient})`} {...motion.draw(0)} />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
        <ChartDataTable data={rows} config={config} labelKey="label" labelHeading={copy.period} caption={copy.trendCaption(label)} valueFormatter={(v) => value(v)} />
      </CardContent>
    </Card>
  )
}

export { Trend }
