'use client'

import { useMemo } from 'react'
import { Area, ComposedChart, Line, ReferenceArea, ReferenceLine, XAxis, YAxis } from 'recharts'
import { useYouj } from '@youj/core'
import { ChartContainer, ChartDataTable, ChartTooltip, ChartTooltipContent, useChartMotion, type ChartConfig } from '@youj/react/components/ui/chart'
import { cn } from '@youj/react/lib/utils'
import { chartData, eventTime, momentOf, type ChartPoint } from '../chart-data'
import type { Driver, Week } from '../data'
import { short, usd } from '../format'
import { HOURS } from '../series'
import { Annotations } from './annotations'

/* Fig. 1: the week's running total of revenue, hour by hour, against last
 * week (dashed) and the range of the eight weeks before (shaded). With a
 * driver open, a "without it" line peels away from this week's and the gap
 * between them fills: what that driver added or took, hour by hour. The
 * lines draw in, then the notes arrive; a new week or driver morphs them. */

const HOUR = 3_600_000
const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short' })
/** "Mon 14". */
const dayName = (time: number) => `${weekday.format(time)} ${new Date(time).getDate()}`
const GRID = [50_000, 100_000, 150_000, 200_000, 250_000]

export function RunningTotal({ week, driver, compact }: { week: Week; driver: Driver | null; compact: boolean }) {
  const motion = useChartMotion()
  const k = useYouj()
  const data = useMemo(() => chartData(week, driver), [week, driver])
  const tone = driver ? (driver.kind === 'Other' ? 'var(--color-chart-5)' : driver.amount >= 0 ? 'var(--color-success)' : 'var(--color-danger)') : 'var(--color-chart-1)'
  const config = {
    now: { label: week.offset === 0 ? 'So far' : 'This week', color: 'var(--color-chart-1)' },
    last: { label: 'Last week', color: 'var(--color-chart-4)' },
    without: { label: driver ? `Without ${driver.short}` : 'Without it', color: tone },
  } satisfies ChartConfig
  const top = Math.ceil(Math.max(...data.map((d) => Math.max(d.now ?? 0, d.last, d.range[1], d.without ?? 0))) / 50_000) * 50_000
  const grid = GRID.filter((y) => y < top)
  const end = data[week.hoursIn]!
  const last = data[HOURS]!
  const days = Array.from({ length: 7 }, (_, d) => ({
    day: dayName(week.start + d * 24 * HOUR),
    now: d * 24 + 24 <= week.hoursIn ? Math.round(data[d * 24 + 24]!.now ?? 0) : null,
    last: Math.round(data[d * 24 + 24]!.last),
    ...(driver ? { without: Math.round(data[d * 24 + 24]!.without ?? 0) } : {}),
  }))
  const summary =
    week.offset === 0
      ? `So far ${usd.format(end.now ?? 0)}, against ${usd.format(end.last)} at the same point last week.`
      : `This week ended at ${usd.format(end.now ?? 0)}, against ${usd.format(last.last)} last week.${driver ? ` Without ${driver.short} it would have been ${usd.format(last.without ?? 0)}.` : ''} Marked: ${week.events.map((e, i) => `${i + 1}, ${e.label}, ${eventTime(week, e)}`).join('; ')}.`

  return (
    <figure className="flex flex-col gap-3">
      <ChartContainer config={config} title={`Running total of revenue, week ${week.number}`} summary={summary} className={cn('aspect-auto w-full', compact ? 'h-64' : 'h-[22rem]')}>
        <ComposedChart data={data} margin={{ top: 12, right: compact ? 12 : 96, bottom: 0, left: 0 }}>
          {[24, 48, 72, 96, 120, 144].map((x) => (
            <ReferenceLine key={x} x={x} strokeDasharray="1 3" ifOverflow="hidden" />
          ))}
          {grid.map((y) => (
            <ReferenceLine key={y} y={y} ifOverflow="hidden" />
          ))}
          <XAxis
            dataKey="x"
            type="number"
            domain={[0, HOURS]}
            ticks={[12, 36, 60, 84, 108, 132, 156]}
            tickFormatter={(x: number) => dayName(week.start + (x - 12) * HOUR)}
            tickLine={false}
            tickMargin={8}
            interval={0}
            fontSize={compact ? 10 : undefined}
          />
          <YAxis type="number" domain={[0, top]} ticks={grid} tickFormatter={(v: number) => short(v)} orientation="left" mirror tickLine={false} axisLine={false} tick={{ dy: -8 }} width={1} />
          <ChartTooltip
            cursor={{ className: 'stroke-line-strong' }}
            content={(props) => (
              <ChartTooltipContent
                {...(props as object)}
                payload={props.payload?.filter((p) => p.dataKey === 'now' || p.dataKey === 'last' || (driver !== null && p.dataKey === 'without'))}
                labelFormatter={(_, payload) => momentOf(week, (payload[0]?.payload as ChartPoint | undefined)?.x ?? 0)}
                indicator="line"
                valueFormatter={(v) => usd.format(Number(v))}
              />
            )}
          />
          {week.events
            .filter((e) => e.to !== undefined)
            .map((e) => (
              <ReferenceArea key={`${week.offset}-${e.at}`} x1={e.at} x2={e.to} fill="var(--color-danger)" fillOpacity={0.16} ifOverflow="hidden" />
            ))}
          <Area dataKey="range" type="monotone" stroke="none" fill="var(--color-fg)" fillOpacity={0.07} activeDot={false} {...motion.draw(0)} />
          <Area dataKey="gap" type="monotone" stroke="none" fill="var(--color-without)" fillOpacity={0.2} activeDot={false} connectNulls={false} {...motion.draw(0)} />
          <Line dataKey="last" type="monotone" stroke="var(--color-last)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} {...motion.draw(0)} />
          <Line dataKey="without" type="monotone" stroke="var(--color-without)" strokeWidth={1.5} strokeDasharray="2 3" dot={false} connectNulls={false} {...motion.draw(1)} />
          <Line dataKey="now" type="monotone" stroke="var(--color-now)" strokeWidth={2.25} dot={false} connectNulls={false} {...motion.draw(1)} />
          <Annotations week={week} data={data} driver={driver} compact={compact} delay={k.reduced ? 0 : k.duration('deliberate') + k.stagger('loose')} />
        </ComposedChart>
      </ChartContainer>
      {/* On a phone the notes can't sit on the lines: they're numbered there and listed here. */}
      {compact && week.events.length > 0 && (
        <ol aria-label="Marked on the chart" className="flex flex-col gap-1.5 text-ui text-fg-muted">
          {week.events.map((e, i) => {
            // Notes about other drivers step back in color, not opacity, so they stay readable.
            const aside = driver && e.driver !== driver.id
            return (
              <li key={`${week.offset}-${i}`} className="flex items-baseline gap-2.5">
                <span
                  aria-hidden
                  className={cn(
                    'grid size-4.5 shrink-0 translate-y-0.5 place-items-center rounded-full border text-[0.625rem] font-semibold tabular-nums transition-colors yj-duration-fast ease-standard',
                    aside ? 'border-line text-fg-muted' : 'border-fg text-fg',
                  )}
                >
                  {i + 1}
                </span>
                <span>
                  <span className={cn('transition-colors yj-duration-fast ease-standard', !aside && 'text-fg')}>{e.label}</span> · {eventTime(week, e)}
                </span>
              </li>
            )
          })}
        </ol>
      )}
      <ChartDataTable
        data={days}
        config={config}
        labelKey="day"
        labelHeading="End of day"
        keys={['now', 'last', ...(driver ? ['without'] : [])]}
        caption={`Running total of revenue at the end of each day, week ${week.number}.`}
        mode="toggle"
        valueFormatter={(v) => usd.format(v)}
      />
    </figure>
  )
}
