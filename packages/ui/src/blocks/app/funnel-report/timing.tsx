'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { HistogramRange } from '../../../components/ui/histogram-range'
import { CalendarHeatmap, streakStats } from '../../../components/ui/calendar-heatmap'
import type { FunnelReportCopy } from './copy'
import { pct, type Report } from './data'
import { numberFormat } from '../../../lib/utils'

type Range = [number, number]

/** How long paying teams took from trial to paid; drag the window to see what share converted inside it. */
function TimeToPaid({ days, locale, copy }: { days: number[]; locale: string; copy: FunnelReportCopy }) {
  const [range, setRange] = useState<Range>([0, 7])
  const percent = useMemo(() => pct(locale), [locale])
  const number = useMemo(() => numberFormat(locale).format, [locale])
  const inside = days.filter((d) => d >= range[0] && d < range[1]).length
  const sorted = [...days].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)] ?? 0
  const dayLabel = copy.days

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{copy.timeTitle}</CardTitle>
        <CardDescription>{copy.timeDescription(dayLabel(Math.round(median)))}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <HistogramRange
          data={days}
          binCount={30}
          min={0}
          max={30}
          value={range}
          onValueChange={setRange}
          label={copy.timeLabel}
          format={dayLabel}
          formatTick={copy.daysTick}
          ticks={[0, 7, 14, 21, 30]}
          tone="accent"
        />
        <p className="text-ui text-fg-muted">
          {copy.inside(<span className="font-medium text-fg tabular-nums">{number(inside)}</span>, percent(days.length ? inside / days.length : 0), range[0], range[1])}
        </p>
      </CardContent>
    </Card>
  )
}

/** Upgrades a day as heat dots, a column a week; the fullest dot is the busiest day. */
function DailyUpgrades({ upgrades, locale, copy }: { upgrades: Report['upgrades']; locale: string; copy: FunnelReportCopy }) {
  const today = upgrades[upgrades.length - 1]?.date ?? ''
  const busiest = Math.max(1, ...upgrades.map((d) => d.value))
  const { current } = streakStats(upgrades, today)
  const number = useMemo(() => numberFormat(locale).format, [locale])
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{copy.upgradesTitle}</CardTitle>
        <CardDescription>{current > 1 ? copy.streak(number(current)) : copy.upgradesDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <CalendarHeatmap days={upgrades} today={today} weeks={18} max={busiest} tone="chart-1" label={copy.upgradesLabel} locale={locale} />
      </CardContent>
    </Card>
  )
}

export { DailyUpgrades, TimeToPaid }
