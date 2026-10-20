'use client'

import { useId, useMemo } from 'react'
import { Area, CartesianGrid, ComposedChart, Line, ReferenceDot, ReferenceLine, XAxis, YAxis } from 'recharts'
import { ChartContainer, useChartMotion, type ChartConfig } from '../../../components/ui/chart'
import { reach, type Forecast, type Goal } from './data'

/* The picked goal as a burn-up: the running total so far over a wash, an
 * even pace from nothing to the target as a dotted line, the target as a
 * dashed rule, and from today the forecast at the recent rate, dashed,
 * inside its likely range, a fan that widens with the days left. Where the
 * forecast (or the total) crosses the target, a dot. A new pick morphs every
 * line from where it is. Time reads left to right in either direction of
 * text. */

/** A round top: four steps of 1, 2, 2.5 or 5 times a power of ten. */
function nice(max: number) {
  const raw = max / 4
  const power = 10 ** Math.floor(Math.log10(raw || 1))
  const n = raw / power
  const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * power
  return { top: step * Math.ceil(max / step), ticks: Array.from({ length: Math.ceil(max / step) + 1 }, (_, i) => i * step) }
}

interface BurnupProps {
  goal: Goal
  forecast: Forecast
  /** Days in the period. */
  total: number
  /** Where each month starts, as a day of the period, and its name. */
  months: { day: number; label: string }[]
  /** A figure on the axis. */
  tick: (value: number) => string
  color: string
  title: string
  summary: string
  copy: { actual: string; pace: string; forecast: string; target: string }
}

function Burnup({ goal, forecast: f, total, months, tick, color, title, summary, copy }: BurnupProps) {
  const motion = useChartMotion()
  const wash = `burnup-${useId().replace(/:/g, '')}`
  const elapsed = goal.daily.length
  const rows = useMemo(() => {
    // The running total up to each day.
    const sums: number[] = []
    let sum = 0
    for (let day = 0; day <= total; day++) {
      if (day > 0 && day <= elapsed) sum += goal.daily[day - 1]!
      sums.push(sum)
    }
    return Array.from({ length: total + 1 }, (_, day) => {
      const ahead = day - elapsed
      const width = reach(f, ahead)
      const forecast = f.actual + f.rate * ahead
      return {
        day,
        actual: day <= elapsed ? sums[day] : undefined,
        forecast: ahead >= 0 && f.status !== 'hit' ? forecast : undefined,
        range: ahead >= 0 && f.status !== 'hit' ? [Math.max(f.actual, forecast - width), forecast + width] : undefined,
        pace: (goal.target * day) / total,
      }
    })
  }, [goal, f, total, elapsed])
  const scale = nice(Math.max(goal.target, f.status === 'hit' ? f.actual : f.high) * 1.04)
  const config = useMemo(
    () =>
      ({
        actual: { label: copy.actual, color },
        forecast: { label: copy.forecast, color },
        pace: { label: copy.pace, color: 'var(--color-fg-subtle)' },
        target: { label: copy.target, color: 'var(--color-fg-muted)' },
      }) satisfies ChartConfig,
    [color, copy.actual, copy.forecast, copy.pace, copy.target],
  )

  return (
    <div dir="ltr">
      <ChartContainer config={config} title={title} summary={summary} className="aspect-auto h-48 w-full">
        <ComposedChart data={rows} margin={{ top: 10, right: 12, bottom: 0, left: 0 }} accessibilityLayer={false}>
          <defs>
            <linearGradient id={wash} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-actual)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--color-actual)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="day" type="number" domain={[0, total]} ticks={months.map((m) => m.day)} tickFormatter={(day: number) => months.find((m) => m.day === day)?.label ?? ''} tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis domain={[0, scale.top]} ticks={scale.ticks} tickFormatter={tick} tickLine={false} axisLine={false} width={46} />
          <Area dataKey="range" type="monotone" stroke="none" fill="var(--color-forecast)" fillOpacity={0.14} activeDot={false} connectNulls={false} {...motion.draw(1)} />
          <Line dataKey="pace" type="linear" stroke="var(--color-pace)" strokeWidth={1.25} strokeDasharray="1 4" strokeLinecap="round" dot={false} activeDot={false} isAnimationActive={false} />
          <ReferenceLine y={goal.target} stroke="var(--color-target)" strokeDasharray="5 4" ifOverflow="extendDomain" />
          <ReferenceLine x={elapsed} stroke="var(--color-line-strong)" ifOverflow="hidden" />
          <Area dataKey="actual" type="monotone" stroke="var(--color-actual)" strokeWidth={2} fill={`url(#${wash})`} activeDot={false} connectNulls={false} {...motion.draw(0)} />
          <Line dataKey="forecast" type="linear" stroke="var(--color-forecast)" strokeWidth={1.75} strokeDasharray="5 4" dot={false} activeDot={false} connectNulls={false} {...motion.draw(1)} />
          {f.crossing !== undefined && f.crossing <= total && (
            <ReferenceDot x={f.crossing} y={goal.target} r={4.5} fill="var(--color-actual)" stroke="var(--color-surface)" strokeWidth={2} ifOverflow="extendDomain" />
          )}
        </ComposedChart>
      </ChartContainer>
    </div>
  )
}

export { Burnup }
