'use client'

import { useCallback, useMemo } from 'react'
import type { ChartConfig } from '../../../components/ui/chart'
import { niceScale, place, type Annotation, type Granularity, type MetricChartCopy, type Point, type Series } from './data'
import type { Reading } from './headline'
import type { LegendItem } from './legend'
import type { Row } from './plot'
import { useDates } from './use-dates'
import { numberFormat } from '../../../lib/utils'

/* Everything the card shows, worked out from the points, the series shown
 * and the bucket under the crosshair: the chart's rows (a hidden series reads
 * 0, so its band folds instead of vanishing), the totals and their change,
 * the axis, the annotations' buckets, the legend's figures, the readout, the
 * sentences for assistive tech and the rows for the table and the CSV. */

interface MetricInput {
  points: Point[]
  series: Series[]
  hidden: string[]
  partial: boolean
  annotations: Annotation[]
  granularity: Granularity
  format?: Intl.NumberFormatOptions
  copy: MetricChartCopy
  /** The bucket under the crosshair. */
  active: number | null
}

function useMetric({ points, series, hidden, partial, annotations, granularity, format, copy, active }: MetricInput) {
  const visible = (id: string) => !hidden.includes(id)
  const hasPrevious = points.some((p) => p.previous)
  const showPrevious = visible('previous') && hasPrevious

  const number = useMemo(() => numberFormat(copy.locale, format ?? { maximumFractionDigits: 0 }), [copy.locale, format])
  const compact = useMemo(() => numberFormat(copy.locale, { ...format, notation: 'compact', maximumFractionDigits: 1 }), [copy.locale, format])
  const percent = useMemo(() => numberFormat(copy.locale, { style: 'percent', maximumFractionDigits: 1 }), [copy.locale])
  const tickValue = useCallback((v: number) => compact.format(v), [compact])
  const dates = useDates(points, granularity, copy)

  const bands = useMemo(() => series.map((s, i) => ({ key: `s${i}` as const, visible: !hidden.includes(s.id) })), [series, hidden])
  const rows = useMemo<Row[]>(
    () =>
      points.map((p, i) => {
        const row: Row = { key: p.date, tick: dates.tick(i) }
        series.forEach((s, j) => (row[`s${j}`] = bands[j]!.visible ? (p.values[s.id] ?? 0) : 0))
        if (p.previous) row.previous = series.reduce((sum, s, j) => sum + (bands[j]!.visible ? (p.previous?.[s.id] ?? 0) : 0), 0)
        return row
      }),
    [points, series, bands, dates],
  )
  const totalAt = (i: number) => series.reduce((sum, _, j) => sum + (rows[i]?.[`s${j}`] ?? 0), 0)
  const total = rows.reduce((sum, _, i) => sum + totalAt(i), 0)
  const previousTotal = hasPrevious ? rows.reduce((sum, r) => sum + (r.previous ?? 0), 0) : undefined
  const change = previousTotal ? total / previousTotal - 1 : undefined
  const tallest = Math.max(1, ...rows.map((_, i) => totalAt(i)), ...(showPrevious ? rows.map((r) => r.previous ?? 0) : []))
  const scale = useMemo(() => niceScale(tallest), [tallest])
  const placed = useMemo(() => place(annotations, points, granularity), [annotations, points, granularity])
  const blank = points.length === 0 || points.every((p) => series.every((s) => !p.values[s.id]))

  const config = useMemo(() => {
    const c: ChartConfig = { previous: { label: copy.previous, color: 'var(--color-fg-muted)' } }
    series.forEach((s, i) => (c[`s${i}`] = { label: s.label, color: `var(--color-${s.tone ?? `chart-${(i % 5) + 1}`})` }))
    return c
  }, [series, copy.previous])

  const changeText = (c: number | undefined) => (c === undefined || Math.abs(c) < 0.0005 ? copy.flat : (c > 0 ? copy.up : copy.down)(percent.format(Math.abs(c))))
  const pointText = (i: number) =>
    copy.point(
      dates.long(i),
      number.format(totalAt(i)),
      series
        .filter((s) => visible(s.id))
        .map((s) => `${s.label} ${number.format(points[i]?.values[s.id] ?? 0)}`)
        .concat(showPrevious && rows[i]?.previous !== undefined ? [`${copy.previous} ${number.format(rows[i]!.previous!)}`] : [])
        .concat(partial && i === points.length - 1 ? [copy.soFar] : [])
        .concat((placed.get(i) ?? []).map((a) => a.label))
        .join(', '),
    )
  const peak = rows.reduce((best, _, i) => (totalAt(i) > totalAt(best) ? i : best), 0)
  const summary = copy.summary(
    copy.title,
    dates.period,
    number.format(total),
    changeText(change),
    `${dates.long(peak)}, ${number.format(totalAt(peak))}`,
    [...placed.entries()].flatMap(([i, notes]) => notes.map((a) => `${a.label}, ${dates.long(i)}`)).join('; '),
  )

  const reading: Reading | null =
    active === null || !rows[active]
      ? null
      : {
          index: active,
          value: totalAt(active),
          date: dates.long(active),
          change: rows[active]!.previous ? totalAt(active) / rows[active]!.previous! - 1 : undefined,
          partial: partial && active === points.length - 1,
          notes: (placed.get(active) ?? []).map((a) => a.label),
        }

  const legend: LegendItem[] = [
    ...series.map((s, i) => ({
      id: s.id,
      label: s.label,
      color: config[`s${i}`]!.color!,
      value: number.format(active === null ? points.reduce((sum, p) => sum + (p.values[s.id] ?? 0), 0) : (points[active]?.values[s.id] ?? 0)),
      visible: visible(s.id),
    })),
    ...(hasPrevious
      ? [{ id: 'previous', label: copy.previous, color: 'var(--color-fg-muted)', value: number.format(active === null ? (previousTotal ?? 0) : (rows[active]?.previous ?? 0)), visible: visible('previous'), dashed: true }]
      : []),
  ]

  // The numbers shown, for the table and the CSV: a row per bucket, a column per shown series.
  const table = rows.map((r, i) => {
    const row: Record<string, string | number> = { date: dates.long(i) }
    series.forEach((s, j) => visible(s.id) && (row[`s${j}`] = r[`s${j}`] ?? 0))
    if (showPrevious && r.previous !== undefined) row.previous = r.previous
    return row
  })

  return { visible, hasPrevious, showPrevious, number, tickValue, dates, bands, rows, total, change, scale, placed, blank, config, changeText, pointText, summary, reading, legend, table }
}

export { useMetric }
