'use client'

import { useState } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  ToggleGroup,
  ToggleGroupItem,
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

type Range = '6m' | '12m'

const MONTHS = [
  { month: 'Oct', revenue: 31200, expenses: 26100 },
  { month: 'Nov', revenue: 33800, expenses: 26900 },
  { month: 'Dec', revenue: 39100, expenses: 28400 },
  { month: 'Jan', revenue: 36400, expenses: 29100 },
  { month: 'Feb', revenue: 40900, expenses: 29800 },
  { month: 'Mar', revenue: 44600, expenses: 30700 },
  { month: 'Apr', revenue: 48200, expenses: 31800 },
  { month: 'May', revenue: 51900, expenses: 32600 },
  { month: 'Jun', revenue: 49400, expenses: 33900 },
  { month: 'Jul', revenue: 58700, expenses: 34800 },
  { month: 'Aug', revenue: 63100, expenses: 36200 },
  { month: 'Sep', revenue: 71800, expenses: 37100 },
]

const config = {
  revenue: { label: 'Revenue', color: 'var(--color-chart-1)' },
  expenses: { label: 'Expenses', color: 'var(--color-chart-4)' },
} satisfies ChartConfig

const usd = (value: number) => `$${value.toLocaleString('en-US')}`
const compact = (value: number) => `$${Math.round(value / 1000)}k`

export default function RevenueChart() {
  const [range, setRange] = useState<Range>('6m')
  const motion = useChartMotion()
  const data = range === '6m' ? MONTHS.slice(-6) : MONTHS
  const first = data[0]!.revenue
  const last = data[data.length - 1]!.revenue

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle>Revenue</CardTitle>
        <CardDescription>Net revenue against operating expenses, {range === '6m' ? 'last 6 months' : 'last 12 months'}.</CardDescription>
        <CardAction>
          <ToggleGroup
            variant="segmented"
            size="sm"
            aria-label="Range"
            value={[range]}
            onValueChange={(value) => value[0] && setRange(value[0] as Range)}
          >
            <ToggleGroupItem value="6m">6M</ToggleGroupItem>
            <ToggleGroupItem value="12m">12M</ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={config}
          className="aspect-auto h-60 w-full"
          title="Revenue and expenses by month"
          summary={`Revenue grew from ${usd(first)} to ${usd(last)}; expenses rose more slowly.`}
        >
          <AreaChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
            <defs>
              <linearGradient id="revenue-wash" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-revenue)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="var(--color-revenue)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} />
            <YAxis tickLine={false} axisLine={false} tickMargin={4} width={40} tickFormatter={compact} />
            <ChartTooltip cursor content={<ChartTooltipContent indicator="line" valueFormatter={(v) => usd(Number(v))} />} />
            <Area dataKey="revenue" type="monotone" fill="url(#revenue-wash)" stroke="var(--color-revenue)" strokeWidth={2} {...motion.draw(0)} />
            <Area
              dataKey="expenses"
              type="monotone"
              fill="transparent"
              stroke="var(--color-expenses)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              {...motion.draw(1)}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-0 py-2">
        <ChartDataTable
          mode="toggle"
          data={data}
          config={config}
          labelKey="month"
          labelHeading="Month"
          caption="Revenue and expenses by month, in USD."
          valueFormatter={usd}
        />
      </CardFooter>
    </Card>
  )
}
