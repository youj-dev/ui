'use client'

import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Counter } from '@youj/motion'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { ChartContainer, ChartDataTable, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, chartColor, useChartMotion, type ChartConfig } from '../../../components/ui/chart'
import { Skeleton } from '../../../components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '../../../components/ui/toggle-group'
import type { UsageOverviewCopy } from './copy'
import { spend, type UsageDay, type UsageRange, type UsageResource } from './data'
import { numberFormat } from '../../../lib/utils'

interface DailyCostProps {
  copy: UsageOverviewCopy
  locale: string
  currency: string
  resources: UsageResource[]
  /** The days the range shows, oldest first. */
  rows: UsageDay[]
  range: UsageRange
  onRangeChange: (range: UsageRange) => void
  loading?: boolean
}

const RANGES: UsageRange[] = ['7d', '30d', 'cycle']

function DailyCost({ copy, locale, currency, resources, rows, range, onRangeChange, loading }: DailyCostProps) {
  const motion = useChartMotion()
  const total = useMemo(() => spend(rows), [rows])
  const config = useMemo(() => Object.fromEntries(resources.map((r) => [r.key, { label: r.label, color: r.color }])) satisfies ChartConfig, [resources])
  const data = useMemo(() => rows.map((r) => ({ day: r.day, ...r.costs })), [rows])
  const money = useMemo(() => numberFormat(locale, { style: 'currency', currency }), [locale, currency])
  const axis = useMemo(() => numberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }), [locale, currency])
  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.dailyCost}</CardTitle>
        <CardDescription>
          <Counter value={total} locale={locale} format={{ style: 'currency', currency }} inView={false} duration="slow" className="font-medium text-fg" /> {copy.over(rows.length)}
        </CardDescription>
        <CardAction>
          <ToggleGroup variant="segmented" size="sm" aria-label={copy.range} value={[range]} onValueChange={(next: unknown[]) => next[0] && onRangeChange(next[0] as UsageRange)}>
            {RANGES.map((r) => (
              <ToggleGroupItem key={r} value={r} className="px-2.5">
                {copy.ranges[r]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-60 w-full" />
        ) : (
          <>
            <ChartContainer config={config} className="aspect-auto h-60 w-full" title={copy.chartTitle} summary={copy.chartSummary}>
              <BarChart data={data} margin={{ left: 0, right: 4, top: 8 }} barCategoryGap={range === '7d' ? '28%' : '18%'}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
                <YAxis tickLine={false} axisLine={false} width={40} tickFormatter={(v: number) => axis.format(v)} />
                <ChartTooltip cursor={{ radius: 4 }} content={<ChartTooltipContent />} />
                {resources.map((r, i) => (
                  <Bar
                    key={r.key}
                    dataKey={r.key}
                    stackId="cost"
                    fill={chartColor(r.key)}
                    {...(i === resources.length - 1 && { radius: [3, 3, 0, 0] as [number, number, number, number] })}
                    {...motion.grow(0)}
                  />
                ))}
                <ChartLegend content={<ChartLegendContent />} />
              </BarChart>
            </ChartContainer>
            <ChartDataTable data={data} config={config} labelKey="day" labelHeading={copy.day} caption={copy.chartCaption} valueFormatter={(v) => money.format(v)} />
          </>
        )}
      </CardContent>
    </Card>
  )
}

export { DailyCost }
