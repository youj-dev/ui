'use client'

import { useMemo } from 'react'
import { Pie, PieChart } from 'recharts'
import { Counter } from '@youj/motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, chartColor, useChartMotion, type ChartConfig } from '../../../components/ui/chart'
import type { AnalyticsOverviewCopy } from './copy'
import { usd, withCurrency, type Summary } from './data'
import { numberFormat } from '../../../lib/utils'

interface ChannelsProps {
  summary: Summary
  locale: string
  currency: string
  copy: AnalyticsOverviewCopy
}

/** Where the period's revenue came from: a donut in the chart palette, the total in its hole, shares in a legend. */
function Channels({ summary, locale, currency, copy }: ChannelsProps) {
  const motion = useChartMotion()
  const money = useMemo(() => numberFormat(locale, withCurrency(usd, currency)).format, [locale, currency])
  const share = useMemo(() => numberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format, [locale])
  const config = useMemo(
    () => Object.fromEntries(summary.channels.map((c, i) => [c.key, { label: c.label, color: `var(--color-chart-${(i % 5) + 1})` }])) satisfies ChartConfig,
    [summary.channels],
  )
  const total = summary.totals.revenue
  const rows = summary.channels.map((c, i) => ({ key: c.key, label: c.label, revenue: c.revenue, fill: chartColor(c.key), swatch: `var(--color-chart-${(i % 5) + 1})` }))
  const top = rows.reduce<(typeof rows)[number] | undefined>((a, b) => (!a || b.revenue > a.revenue ? b : a), undefined)

  return (
    // The donut sits beside its legend once the card itself has room (28rem), and above it in the side column, so the names never truncate away.
    <Card className="@container/channels min-w-0">
      <CardHeader>
        <CardTitle>{copy.channelsTitle}</CardTitle>
        <CardDescription>{copy.channelsDescription}</CardDescription>
      </CardHeader>
      <CardContent className="grid items-center gap-6 @md/channels:grid-cols-[--spacing(44)_minmax(0,1fr)]">
        <div className="relative mx-auto size-44">
          <ChartContainer
            config={config}
            title={copy.channelsTitle}
            summary={top ? copy.channelsSummary(top.label, share(total ? top.revenue / total : 0), money(total)) : copy.noSales}
            className="aspect-square size-44"
          >
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel valueFormatter={(v) => (typeof v === 'number' ? money(v) : v)} />} />
              <Pie data={rows} dataKey="revenue" nameKey="key" innerRadius="68%" outerRadius="96%" paddingAngle={2} cornerRadius={3} stroke="none" {...motion.sweep()} />
            </PieChart>
          </ChartContainer>
          <div aria-hidden className="pointer-events-none absolute inset-0 grid place-content-center text-center">
            <span className="text-ui-xs text-fg-muted">{copy.revenue}</span>
            <Counter
              value={Math.round(total)}
              locale={locale}
              format={{ ...withCurrency(usd, currency), notation: 'compact', maximumFractionDigits: 1 }}
              inView={false}
              className="text-lg font-semibold tracking-tight text-fg"
            />
          </div>
        </div>
        <ul className="flex min-w-0 flex-col gap-2.5" aria-label={copy.channels}>
          {rows.map((r) => (
            <li key={r.key} className="flex items-center gap-2.5 text-ui">
              <span aria-hidden className="size-2.5 shrink-0 rounded-xs" style={{ background: r.swatch }} />
              <span className="min-w-0 flex-1 truncate text-fg-muted">{r.label}</span>
              <span className="w-10 text-end text-ui-sm text-fg-muted tabular-nums">{share(total ? r.revenue / total : 0)}</span>
              <span className="w-20 text-end font-medium tabular-nums">{money(r.revenue)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export { Channels }
