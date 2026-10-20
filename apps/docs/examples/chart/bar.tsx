'use client'

import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@youj/react'
import {
  ChartContainer,
  ChartDataTable,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  useChartMotion,
  type ChartConfig,
} from '@youj/react/chart'

const WEEKS = [
  { week: 'W32', production: 42, preview: 118, failed: 4 },
  { week: 'W33', production: 38, preview: 131, failed: 7 },
  { week: 'W34', production: 51, preview: 144, failed: 3 },
  { week: 'W35', production: 47, preview: 126, failed: 5 },
  { week: 'W36', production: 58, preview: 162, failed: 2 },
  { week: 'W37', production: 63, preview: 171, failed: 6 },
]

const config = {
  production: { label: 'Production', color: 'var(--color-chart-1)' },
  preview: { label: 'Preview', color: 'var(--color-chart-3)' },
  failed: { label: 'Failed', color: 'var(--color-chart-4)' },
} satisfies ChartConfig

const reading = (rows: typeof WEEKS) =>
  rows.map((row) => ({
    ...row,
    production: Math.round(30 + Math.random() * 40),
    preview: Math.round(90 + Math.random() * 90),
    failed: Math.round(Math.random() * 9),
  }))

export default function BuildsChart() {
  const motion = useChartMotion()
  const [data, setData] = useState(WEEKS)
  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle>Builds</CardTitle>
        <CardDescription>Per week, stacked by environment.</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" onClick={() => setData(reading)}>
            Refresh
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-56 w-full" title="Builds per week by environment">
          <BarChart data={data} margin={{ left: 4, right: 4, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} width={32} />
            <ChartTooltip cursor={{ radius: 6 }} content={<ChartTooltipContent />} />
            <Bar dataKey="production" stackId="builds" fill="var(--color-production)" {...motion.grow()} />
            <Bar dataKey="preview" stackId="builds" fill="var(--color-preview)" {...motion.grow()} />
            <Bar dataKey="failed" stackId="builds" fill="var(--color-failed)" radius={[4, 4, 0, 0]} {...motion.grow()} />
            <ChartLegend content={<ChartLegendContent />} />
          </BarChart>
        </ChartContainer>
        <ChartDataTable data={data} config={config} labelKey="week" labelHeading="Week" caption="Builds per week by environment." />
      </CardContent>
    </Card>
  )
}
