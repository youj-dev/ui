'use client'

import { useId, useMemo } from 'react'
import { Area, CartesianGrid, ComposedChart, Line, ReferenceDot, ReferenceLine, XAxis, YAxis } from 'recharts'
import { ChartContainer, useChartMotion, type ChartConfig } from '../../../components/ui/chart'
import type { Cohort } from './data'

/* The curve above the grid: every cohort as a faint line, the average as
 * the first chart colour over a wash, and the picked cohort drawn over them
 * in the second, with its period marked. Readings still running are left
 * off, so no curve dips at its end for a period that isn't over. Lines draw
 * in on the deliberate token; a new pick morphs the cohort's line. Time
 * reads left to right in either direction of text. */

interface CurveProps {
  cohorts: Cohort[]
  averages: (number | undefined)[]
  partial: boolean
  /** The picked cohort and period. */
  row: number | null
  col: number | null
  label: (period: number) => string
  percent: (share: number) => string
  title: string
  summary: string
  config: ChartConfig
}

/** A cohort's share in period `p`, unless that period is still running. */
const shareOf = (c: Cohort, p: number, partial: boolean) => (p < c.active.length - (partial && p > 0 ? 1 : 0) && c.size ? c.active[p]! / c.size : undefined)

function Curve({ cohorts, averages, partial, row, col, label, percent, title, summary, config }: CurveProps) {
  const motion = useChartMotion()
  const wash = `retention-${useId().replace(/:/g, '')}`
  const data = useMemo(
    () =>
      averages.map((average, p) => {
        const point: Record<string, number | string | undefined> = { period: label(p), average, picked: row === null ? undefined : shareOf(cohorts[row]!, p, partial) }
        cohorts.forEach((c, i) => (point[`c${i}`] = shareOf(c, p, partial)))
        return point
      }),
    [averages, cohorts, partial, row, label],
  )
  const dot = row !== null && col !== null ? shareOf(cohorts[row]!, col, partial) : undefined

  return (
    <div dir="ltr">
      <ChartContainer config={config} title={title} summary={summary} className="aspect-auto h-44 w-full">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} accessibilityLayer={false}>
          <defs>
            <linearGradient id={wash} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-average)" stopOpacity={0.24} />
              <stop offset="100%" stopColor="var(--color-average)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" minTickGap={16} />
          <YAxis domain={[0, 1]} ticks={[0, 0.25, 0.5, 0.75, 1]} tickFormatter={percent} tickLine={false} axisLine={false} width={40} />
          {cohorts.map((c, i) => (
            <Line key={c.id} dataKey={`c${i}`} type="monotone" stroke="var(--color-cohorts)" strokeOpacity={0.5} strokeWidth={1} dot={false} activeDot={false} connectNulls={false} isAnimationActive={false} />
          ))}
          <Area dataKey="average" type="monotone" stroke="var(--color-average)" strokeWidth={2} fill={`url(#${wash})`} dot={false} activeDot={false} {...motion.draw(0)} />
          {row !== null && (
            <Line dataKey="picked" type="monotone" stroke="var(--color-picked)" strokeWidth={2} dot={{ r: 2, strokeWidth: 0, fill: 'var(--color-picked)' }} activeDot={false} connectNulls={false} {...motion.draw(0)} />
          )}
          {col !== null && <ReferenceLine x={label(col)} stroke="var(--color-line-strong)" ifOverflow="hidden" />}
          {col !== null && dot !== undefined && <ReferenceDot x={label(col)} y={dot} r={4.5} fill="var(--color-picked)" stroke="var(--color-surface)" strokeWidth={2} />}
        </ComposedChart>
      </ChartContainer>
    </div>
  )
}

export { Curve }
