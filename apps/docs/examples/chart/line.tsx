'use client'

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@youj/react'
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

const latency = [
  { hour: '00:00', p50: 82, p95: 210, p99: 390 },
  { hour: '03:00', p50: 79, p95: 198, p99: 362 },
  { hour: '06:00', p50: 88, p95: 231, p99: 420 },
  { hour: '09:00', p50: 104, p95: 286, p99: 541 },
  { hour: '12:00', p50: 112, p95: 302, p99: 588 },
  { hour: '15:00', p50: 108, p95: 277, p99: 512 },
  { hour: '18:00', p50: 97, p95: 251, p99: 466 },
  { hour: '21:00', p50: 86, p95: 219, p99: 401 },
]

const config = {
  p50: { label: 'p50', color: 'var(--color-chart-1)' },
  p95: { label: 'p95', color: 'var(--color-chart-3)' },
  p99: { label: 'p99', color: 'var(--color-chart-4)' },
} satisfies ChartConfig

export default function LatencyChart() {
  const motion = useChartMotion()
  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle>API latency</CardTitle>
        <CardDescription>Percentiles over the last 24 hours, in ms.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={config}
          className="aspect-auto h-56 w-full"
          title="API latency percentiles"
          summary="Latency peaks around midday, with p99 reaching 588 ms at 12:00."
        >
          <LineChart data={latency} margin={{ left: 4, right: 12, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="hour" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} width={36} tickMargin={4} />
            <ChartTooltip content={<ChartTooltipContent valueFormatter={(v) => `${v} ms`} />} />
            {(['p50', 'p95', 'p99'] as const).map((key, i) => (
              <Line key={key} dataKey={key} type="monotone" stroke={`var(--color-${key})`} strokeWidth={2} dot={false} {...motion.draw(i)} />
            ))}
            <ChartLegend content={<ChartLegendContent />} />
          </LineChart>
        </ChartContainer>
        <ChartDataTable data={latency} config={config} labelKey="hour" labelHeading="Hour" caption="Latency percentiles by hour, in ms." />
      </CardContent>
    </Card>
  )
}
