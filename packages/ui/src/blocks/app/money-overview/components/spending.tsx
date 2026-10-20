'use client'

import { useState } from 'react'
import { Pie, PieChart } from 'recharts'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, useChartMotion, type ChartConfig } from '../../../../components/ui/chart'
import { ToggleGroup, ToggleGroupItem } from '../../../../components/ui/toggle-group'
import { SPENDING, type Period } from '../data'
import { whole } from '../format'
import { Amount } from './amount'

const spendConfig = {
  groceries: { label: 'Groceries', color: 'var(--color-chart-1)' },
  dining: { label: 'Dining', color: 'var(--color-chart-2)' },
  transport: { label: 'Transport', color: 'var(--color-chart-3)' },
  shopping: { label: 'Shopping', color: 'var(--color-chart-4)' },
  bills: { label: 'Bills', color: 'var(--color-chart-5)' },
} satisfies ChartConfig

const PERIODS: Record<Period, string> = { week: 'Week', month: 'Month', year: 'Year' }

export function Spending({ hidden }: { hidden: boolean }) {
  const motion = useChartMotion()
  const [period, setPeriod] = useState<Period>('month')
  const rows = (Object.keys(spendConfig) as (keyof typeof spendConfig)[]).map((key) => ({ key, value: SPENDING[period][key], fill: `var(--color-${key})` }))
  const total = rows.reduce((s, r) => s + r.value, 0)
  const top = [...rows].sort((a, b) => b.value - a.value)[0]!
  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending</CardTitle>
        <CardDescription>
          <Amount value={total} hidden={hidden} format={whole} className="indent-0 text-fg" /> out this {period}
        </CardDescription>
        <CardAction>
          <ToggleGroup variant="segmented" size="sm" value={[period]} onValueChange={(v) => v[0] && setPeriod(v[0] as Period)} aria-label="Period">
            {Object.entries(PERIODS).map(([id, label]) => (
              <ToggleGroupItem key={id} value={id}>
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent className="grid items-center gap-4 sm:grid-cols-[11rem_1fr]">
        <ChartContainer
          config={spendConfig}
          title={`Spending by category this ${period}`}
          summary={`${spendConfig[top.key].label} is the largest share at ${Math.round((top.value / total) * 100)}%.`}
          className="mx-auto aspect-square h-44"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel />} />
            <Pie data={rows} dataKey="value" nameKey="key" innerRadius="64%" outerRadius="92%" paddingAngle={2} cornerRadius={4} stroke="none" {...motion.sweep()} />
          </PieChart>
        </ChartContainer>
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <li key={r.key} className="flex items-center gap-2.5 text-ui">
              <span aria-hidden className="size-2.5 rounded-sm" style={{ background: `var(--color-chart-${Object.keys(spendConfig).indexOf(r.key) + 1})` }} />
              <span className="flex-1 text-fg-muted">{spendConfig[r.key].label}</span>
              <span className="text-ui-sm text-fg-muted tabular-nums">{total ? Math.round((r.value / total) * 100) : 0}%</span>
              <Amount value={r.value} hidden={hidden} format={whole} className="w-20 justify-end font-medium text-fg" />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
