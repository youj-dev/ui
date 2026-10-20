'use client'

import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartDataTable, ChartTooltip, ChartTooltipContent, chartColor, useChartMotion, type ChartConfig } from '../../../components/ui/chart'
import { dateTimeFormat, numberFormat, toneColor } from '../../../lib/utils'
import type { UsageChargesCopy, UsageChargesSku } from './data'
import type { DayRow } from './model'

interface ChargesChartProps {
  copy: UsageChargesCopy
  locale: string
  currency: string
  /** The SKUs that billed something in these days, bottom of the stack first. */
  skus: UsageChargesSku[]
  days: DayRow[]
  total: number
}

const day = (iso: string) => new Date(`${iso}T00:00:00Z`)

/** Daily charges stacked by SKU. Arrow keys walk the days and open the tooltip; the same numbers are a table for screen readers. */
function ChargesChart({ copy, locale, currency, skus, days, total }: ChargesChartProps) {
  const motion = useChartMotion()
  const config = useMemo(() => Object.fromEntries(skus.map((s) => [s.id, { label: s.name, color: toneColor(s.tone) }])) satisfies ChartConfig, [skus])
  const data = useMemo(() => days.map((d) => ({ day: d.date, ...d.charges })), [days])
  const money = numberFormat(locale, { style: 'currency', currency })
  const axis = numberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 })
  const table = useMemo(() => data.map((row) => ({ ...row, day: dateTimeFormat(locale, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).format(day(row.day)) })), [data, locale])
  const short = dateTimeFormat(locale, { month: 'short', day: 'numeric', timeZone: 'UTC' })
  const long = dateTimeFormat(locale, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
  return (
    <>
      <ChartContainer config={config} className="aspect-auto h-60 w-full" title={copy.chartTitle} summary={copy.chartSummary(money.format(total), days.length)}>
        <BarChart data={data} margin={{ left: 0, right: 0, top: 8 }} barCategoryGap="22%">
          <CartesianGrid vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} tickFormatter={(iso: string) => short.format(day(iso))} />
          <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={(v: number) => axis.format(v)} />
          <ChartTooltip
            cursor={{ radius: 2 }}
            content={<ChartTooltipContent labelFormatter={(_, payload) => long.format(day(String((payload[0]?.payload as { day?: string } | undefined)?.day)))} valueFormatter={(v) => money.format(Number(v))} />}
          />
          {skus.map((s, i) => (
            <Bar
              key={s.id}
              dataKey={s.id}
              stackId="charges"
              fill={chartColor(s.id)}
              {...(i === skus.length - 1 && { radius: [2, 2, 0, 0] as [number, number, number, number] })}
              {...motion.grow(0)}
            />
          ))}
        </BarChart>
      </ChartContainer>
      <ChartDataTable data={table} config={config} labelKey="day" labelHeading={copy.day} caption={copy.chartCaption} valueFormatter={(v) => money.format(Number(v))} />
    </>
  )
}

export { ChargesChart }
