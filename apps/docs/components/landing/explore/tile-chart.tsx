'use client'

import { useRef, useState } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceDot, ReferenceLine, XAxis } from 'recharts'
import { useYouj } from '@youj/core'
import { ChartContainer, ChartTooltip, ChartTooltipContent, useChartMotion, type ChartConfig } from '@youj/react/chart'
import { useLoop } from '@/components/landing/use-loop'
import { Demo, useInUse } from './demo'

const SIGNUPS = [
  { month: 'Jan', now: 186, before: 120 },
  { month: 'Feb', now: 205, before: 138 },
  { month: 'Mar', now: 237, before: 151 },
  { month: 'Apr', now: 228, before: 163 },
  { month: 'May', now: 276, before: 172 },
  { month: 'Jun', now: 309, before: 188 },
  { month: 'Jul', now: 296, before: 201 },
  { month: 'Aug', now: 341, before: 214 },
  { month: 'Sep', now: 372, before: 226 },
]

const config = {
  now: { label: 'This year', color: 'var(--color-chart-1)' },
  before: { label: 'Last year', color: 'var(--color-chart-3)' },
} satisfies ChartConfig

/** Two years of signups; a crosshair walks the months and the header reads it. Point at the chart and the tooltip is yours. */
export default function ChartTile() {
  const k = useYouj()
  const root = useRef<HTMLDivElement>(null)
  const inUse = useInUse(root, 1200)
  const motion = useChartMotion()
  const [at, setAt] = useState(SIGNUPS.length - 1)
  useLoop(root, k.ms('deliberate') * 2, () => !inUse && setAt((i) => (i + 1) % SIGNUPS.length))
  const point = SIGNUPS[at]!
  const crosshair = !inUse
  return (
    <Demo>
      <div ref={root} className="flex h-60 w-full max-w-xl flex-col gap-2 rounded-2xl border border-line bg-surface px-4 pt-4 pb-2 shadow-xs">
        <div aria-hidden className="flex items-baseline gap-3 text-ui-sm">
          <span className="font-medium text-fg">Signups</span>
          <span className="text-fg-muted tabular-nums">
            {point.month}: <span className="text-fg">{point.now}</span> vs {point.before}
          </span>
        </div>
        <ChartContainer
          config={config}
          className="aspect-auto min-h-0 w-full flex-1"
          title="Monthly signups"
          summary="Signups rose every quarter, from 186 in January to 372 in September, against 120 to 226 last year."
        >
          <LineChart data={SIGNUPS} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={6} />
            <ChartTooltip content={<ChartTooltipContent />} />
            {(['now', 'before'] as const).map((key, i) => (
              <Line key={key} dataKey={key} type="monotone" stroke={`var(--color-${key})`} strokeWidth={2} dot={false} {...motion.draw(i)} />
            ))}
            {crosshair && <ReferenceLine x={point.month} className="stroke-fg-subtle" strokeDasharray="3 3" />}
            {crosshair && <ReferenceDot x={point.month} y={point.now} r={4} fill="var(--color-now)" stroke="var(--color-surface)" strokeWidth={2} />}
            {crosshair && (
              <ReferenceDot x={point.month} y={point.before} r={4} fill="var(--color-before)" stroke="var(--color-surface)" strokeWidth={2} />
            )}
          </LineChart>
        </ChartContainer>
      </div>
    </Demo>
  )
}
