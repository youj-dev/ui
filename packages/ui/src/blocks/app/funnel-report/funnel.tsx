'use client'

import { useId, useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { ChartContainer, ChartDataTable, ChartTooltip, ChartTooltipContent, useChartMotion, type ChartConfig } from '../../../components/ui/chart'
import type { FunnelReportCopy } from './copy'
import { pct, type Step } from './data'
import { numberFormat } from '../../../lib/utils'

/** The funnel as columns: who reached each step, and above it (hatched) who dropped off since the step before, with the step's conversion on top. */
function Funnel({ steps, locale, copy }: { steps: Step[]; locale: string; copy: FunnelReportCopy }) {
  const motion = useChartMotion()
  const config = useMemo(
    () =>
      ({
        reached: { label: copy.reached, color: 'var(--color-chart-1)' },
        dropped: { label: copy.dropped, color: 'var(--color-fg-muted)' },
      }) satisfies ChartConfig,
    [copy.reached, copy.dropped],
  )
  const hatch = `funnel-hatch-${useId().replace(/:/g, '')}`
  const number = useMemo(() => numberFormat(locale).format, [locale])
  const compact = useMemo(() => numberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format, [locale])
  const percent = useMemo(() => pct(locale), [locale])
  const rows = steps.map((s, i) => ({ step: s.short, name: s.name, reached: s.count, dropped: i ? steps[i - 1]!.count - s.count : 0, rate: i ? percent(s.rate) : '' }))
  const worst = steps.slice(1).reduce((low, s) => (s.rate < low.rate ? s : low), steps[1] ?? steps[0]!)
  const last = steps[steps.length - 1]!

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{copy.funnelTitle}</CardTitle>
        <CardDescription>{copy.funnelDescription}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <ChartContainer
          config={config}
          className="aspect-auto min-h-72 w-full flex-1"
          title={copy.funnelChart}
          summary={copy.funnelSummary(number(steps[0]!.count), steps[0]!.name, number(last.count), worst.name, percent(worst.rate))}
        >
          <BarChart data={rows} margin={{ left: 0, right: 4, top: 24 }} barCategoryGap="22%">
            <defs>
              <pattern id={hatch} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="6" height="6" fill="var(--color-dropped)" fillOpacity={0.08} />
                <line x1="0" y1="0" x2="0" y2="6" stroke="var(--color-dropped)" strokeOpacity={0.35} strokeWidth={1.5} />
              </pattern>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="step" tickLine={false} axisLine={false} tickMargin={8} interval={0} />
            <YAxis tickLine={false} axisLine={false} width={40} tickFormatter={(v: number) => compact(v)} />
            <ChartTooltip cursor={{ radius: 4 }} content={<ChartTooltipContent valueFormatter={(v) => (typeof v === 'number' ? number(v) : v)} />} />
            <Bar dataKey="reached" stackId="funnel" fill="var(--color-reached)" {...motion.grow(0)} />
            <Bar dataKey="dropped" stackId="funnel" fill={`url(#${hatch})`} radius={[4, 4, 0, 0]} {...motion.grow(0)}>
              <LabelList dataKey="rate" position="top" offset={8} className="fill-fg font-mono text-ui-xs tabular-nums" />
            </Bar>
          </BarChart>
        </ChartContainer>
        <ChartDataTable data={rows} config={config} labelKey="name" labelHeading={copy.step} keys={['reached', 'dropped']} caption={copy.funnelCaption} />
      </CardContent>
    </Card>
  )
}

export { Funnel }
