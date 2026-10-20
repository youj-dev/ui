'use client'

import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, type XAxisTickContentProps } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, chartColor, useChartMotion, type ChartConfig } from '../../../components/ui/chart'
import { Eyebrow } from '../../../components/ui/typography'
import { dateTimeFormat, numberFormat } from '../../../lib/utils'
import type { ScoreOverviewCopy, ScoreOverviewSeverity, ScoreOverviewTone, ScoreOverviewTrendPoint } from './data'

/* Open findings by severity over the period, stacked: critical at the
 * bottom in the danger tone, high in warning, medium and low in two grays,
 * each a hairline over a faint wash, so the total reads off the top line and
 * each band's share off its thickness. A key of the severities sits above
 * the plot; hover, or the arrow keys on the focused plot, open the tooltip
 * for a day. Time reads left to right in either direction of text. */

/** Each tone's ink: the hot ones in their status tones, the rest in grays. */
export const TONE_INK: Record<ScoreOverviewTone, string> = {
  danger: 'var(--color-danger)',
  warning: 'var(--color-warning)',
  success: 'var(--color-success)',
  accent: 'var(--color-accent)',
  muted: 'var(--color-fg-muted)',
  subtle: 'var(--color-fg-subtle)',
}

interface TrendProps {
  points: readonly ScoreOverviewTrendPoint[]
  severities: readonly ScoreOverviewSeverity[]
  copy: Pick<ScoreOverviewCopy, 'chartTitle' | 'chartSummary'>
  locale: string
}

const DAY = 86_400_000
const dayOf = (date: string) => Date.parse(`${date}T00:00:00Z`) / DAY

function Trend({ points, severities, copy, locale }: TrendProps) {
  const motion = useChartMotion()
  const day = dateTimeFormat(locale, { month: 'short', day: 'numeric', timeZone: 'UTC' })
  const count = numberFormat(locale)
  const rows = useMemo(() => points.map((p) => ({ ...p.counts, date: p.date, day: dayOf(p.date) })), [points])
  const config = useMemo(
    () => Object.fromEntries(severities.map((s) => [s.id, { label: s.label, color: TONE_INK[s.tone] }])) satisfies ChartConfig,
    [severities],
  )
  const total = (p: ScoreOverviewTrendPoint | undefined) => (p ? severities.reduce((sum, s) => sum + (p.counts[s.id] ?? 0), 0) : 0)
  const first = rows[0]?.day ?? 0
  const last = rows[rows.length - 1]?.day ?? 0
  // Three dates: the first day, the middle and the last, the ends lined up with the plot's edges.
  const ticks = [...new Set([first, Math.round((first + last) / 2), last])]
  const top = Math.max(1, ...points.map(total))
  const step = top <= 8 ? 2 : top <= 20 ? 5 : top <= 50 ? 10 : 25

  return (
    <div className="flex h-full flex-col gap-2">
      <ul aria-hidden className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {severities.map((s) => (
          <li key={s.id} className="flex items-center gap-1.5">
            <span className="size-2 shrink-0 rounded-full" style={{ background: TONE_INK[s.tone] }} />
            <Eyebrow className="text-ui-xs">{s.label}</Eyebrow>
          </li>
        ))}
      </ul>
      <div dir="ltr" className="min-h-0 flex-1">
        <ChartContainer
          config={config}
          title={copy.chartTitle}
          summary={copy.chartSummary(count.format(total(points[0])), count.format(total(points[points.length - 1])))}
          className="aspect-auto h-full w-full"
        >
          <AreaChart data={rows} margin={{ top: 6, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              type="number"
              domain={[first, last]}
              ticks={ticks}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={0}
              tick={({ x, y, payload }: XAxisTickContentProps) => (
                <text
                  x={x}
                  y={y}
                  dy="0.71em"
                  textAnchor={payload.value === first ? 'start' : payload.value === last ? 'end' : 'middle'}
                  className="fill-fg-muted font-mono"
                >
                  {day.format(Number(payload.value) * DAY)}
                </text>
              )}
            />
            <YAxis
              allowDecimals={false}
              domain={[0, Math.ceil(top / step) * step]}
              ticks={Array.from({ length: Math.ceil(top / step) + 1 }, (_, i) => i * step)}
              tickLine={false}
              axisLine={false}
              width={22}
              tick={{ className: 'font-mono' }}
            />
            <ChartTooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={
                <ChartTooltipContent labelFormatter={(_, payload) => day.format(((payload[0]?.payload as { day?: number })?.day ?? 0) * DAY)} />
              }
            />
            {severities.map((s, i) => (
              <Area
                key={s.id}
                dataKey={s.id}
                stackId="open"
                type="monotone"
                stroke={chartColor(s.id)}
                strokeWidth={1.5}
                fill={chartColor(s.id)}
                fillOpacity={0.14}
                activeDot={{ r: 3 }}
                {...motion.draw(i)}
              />
            ))}
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  )
}

export { Trend }
