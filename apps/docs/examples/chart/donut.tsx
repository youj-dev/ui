'use client'

import { Label, Pie, PieChart, Sector, type PieSectorShapeProps } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@youj/react'
import {
  ChartContainer,
  ChartDataTable,
  ChartTooltip,
  ChartTooltipContent,
  useChartMotion,
  type ChartConfig,
} from '@youj/react/chart'

const traffic = [
  { source: 'direct', visitors: 4820, fill: 'var(--color-direct)' },
  { source: 'search', visitors: 3610, fill: 'var(--color-search)' },
  { source: 'social', visitors: 1940, fill: 'var(--color-social)' },
  { source: 'referral', visitors: 1180, fill: 'var(--color-referral)' },
  { source: 'email', visitors: 640, fill: 'var(--color-email)' },
]

const config = {
  visitors: { label: 'Visitors' },
  direct: { label: 'Direct', color: 'var(--color-chart-1)' },
  search: { label: 'Search', color: 'var(--color-chart-2)' },
  social: { label: 'Social', color: 'var(--color-chart-3)' },
  referral: { label: 'Referral', color: 'var(--color-chart-4)' },
  email: { label: 'Email', color: 'var(--color-chart-5)' },
} satisfies ChartConfig

const total = traffic.reduce((sum, row) => sum + row.visitors, 0)

/** The hovered slice steps out 4px. */
function Slice(props: PieSectorShapeProps) {
  return <Sector {...props} outerRadius={(props.outerRadius ?? 0) + (props.isActive ? 4 : 0)} />
}

export default function TrafficDonut() {
  const motion = useChartMotion()
  return (
    <Card className="w-full max-w-xs">
      <CardHeader>
        <CardTitle>Traffic sources</CardTitle>
        <CardDescription>Visitors this week.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={config}
          className="mx-auto aspect-square h-52"
          title="Traffic by source"
          summary={`Direct traffic leads with ${Math.round((4820 / total) * 100)}% of ${total.toLocaleString('en-US')} visitors.`}
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="source" hideLabel />} />
            <Pie
              data={traffic}
              dataKey="visitors"
              nameKey="source"
              innerRadius="62%"
              outerRadius="88%"
              paddingAngle={2}
              cornerRadius={3}
              stroke="none"
              shape={Slice}
              {...motion.sweep()}
            >
              <Label
                content={({ viewBox }) =>
                  viewBox && 'cx' in viewBox ? (
                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                      <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) - 6} className="fill-fg text-2xl font-semibold tabular-nums">
                        {total.toLocaleString('en-US')}
                      </tspan>
                      <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 16} className="fill-fg-muted text-ui-xs">
                        visitors
                      </tspan>
                    </text>
                  ) : null
                }
              />
            </Pie>
          </PieChart>
        </ChartContainer>
        <ChartDataTable data={traffic} config={config} keys={['visitors']} labelKey="source" labelHeading="Source" caption="Visitors by traffic source." />
      </CardContent>
    </Card>
  )
}
