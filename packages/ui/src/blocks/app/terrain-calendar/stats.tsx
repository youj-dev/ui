'use client'

import { Stat, StatBars, StatDelta, StatGroup, StatNote, StatValue, type StatTone } from '../../../components/ui/stat-card'
import { WEEK_DAYS, dayAt, entriesOf, longestStreak, peakOf, weekTotals, type TerrainCalendarCopy, type TerrainCalendarDay, type TerrainCalendarMetric } from './data'
import type { TerrainFormats } from './format'

/* The days at a glance, over the terrain: the selected week's total
 * with its change on the week before and every week as bars, this one lit
 * (the terrain's columns, summed); the longest run of days with an entry;
 * and the peak day, with what made it. */

interface TerrainStatsProps {
  days: TerrainCalendarDay[]
  /** The terrain's readings: rows (the back first) × weeks. */
  rows: number[][]
  metric: TerrainCalendarMetric
  category: string
  /** The label of each category, by id. */
  labels: Record<string, string>
  /** The selected week. */
  col: number
  tone: StatTone
  locale: string
  copy: TerrainCalendarCopy
  format: TerrainFormats
}

export function TerrainStats({ days, rows, metric, category, labels, col, tone, locale, copy, format }: TerrainStatsProps) {
  const weeks = weekTotals(rows)
  const week = weeks[col] ?? 0
  const before = weeks[col - 1] ?? 0
  const monday = days[col * WEEK_DAYS]
  const streak = longestStreak(days)
  const peak = peakOf(rows)
  const peakDay = dayAt(days, peak)
  const peakValue = rows[peak.row]?.[peak.col] ?? 0
  // What made the peak day: its titled entry in the category shown, else its biggest.
  const shown = entriesOf(peakDay, category)
  const lead = shown.find((e) => e.title) ?? [...shown].sort((a, b) => (b.values[metric.id] ?? 0) - (a.values[metric.id] ?? 0))[0]
  const headline = lead && (lead.title ?? labels[lead.category])
  const metricName = metric.label

  return (
    <StatGroup aria-label={copy.title} className="grid-cols-1 sm:grid-cols-3">
      <Stat label={monday ? copy.week(format.short(monday.date)) : metricName}>
        <StatValue locale={locale} {...format.total(metric.id, week)} />
        {before > 0 ? (
          <StatDelta value={week / before - 1} locale={locale}>
            {copy.vsLastWeek}
          </StatDelta>
        ) : (
          <StatNote>{metricName}</StatNote>
        )}
        <StatBars data={weeks} highlight={col} tone={tone} label={copy.weekly(metricName, weeks.length)} />
      </Stat>
      <Stat label={copy.streak}>
        <StatValue value={streak.length} format={{ style: 'unit', unit: 'day', unitDisplay: 'long' }} locale={locale} />
        {streak.length > 0 && <StatNote>{copy.span(format.short(days[streak.from]!.date), format.short(days[streak.to]!.date))}</StatNote>}
      </Stat>
      <Stat label={copy.peak}>
        <StatValue locale={locale} {...format.day(metric.id, peakValue)} />
        {peakDay && peakValue > 0 && (
          <StatNote>
            {format.date(peakDay.date)}
            {headline && ` · ${headline}`}
          </StatNote>
        )}
      </Stat>
    </StatGroup>
  )
}
