'use client'

import { memo, useCallback, useDeferredValue, useMemo, useState } from 'react'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card'
import { Kbd } from '../../../components/ui/kbd'
import type { StatTone } from '../../../components/ui/stat-card'
import { ALL, WEEK_DAYS, dayAt, entriesOf, quietDay, weekTotals, weekdayOf, weeksIn, type Cell, type TerrainCalendarCategory, type TerrainCalendarCopy, type TerrainCalendarDay, type TerrainCalendarDetail, type TerrainCalendarMetric } from './data'
import type { TerrainFormats } from './format'
import { Legend, Readout } from './readout'
import { Terrain } from './terrain'

/* The terrain's card: the drawing, the readout beside it and the legend
 * under them. The pointer's hover lives here, so pointing only re-renders
 * this card, and the readout and the screen-reader grid take the view
 * deferred: the drawing, its tooltip and its axes answer at once (a new
 * measure starts its morph in the same frame), while React renders the rest
 * in slices and skips the readouts of days the pointer only passed over. */

interface TerrainCardProps {
  days: TerrainCalendarDay[]
  /** Readings: rows (the back first) × weeks. */
  rows: number[][]
  reach: number
  metric: TerrainCalendarMetric
  /** The category shown: an id, or 'all'. */
  category: string
  categories: TerrainCalendarCategory[]
  details: TerrainCalendarDetail[]
  /** Each measure's color by its id: the terrain's ramp (a token) and the stat parts' tone. */
  tones: Record<string, { css: string; stat: StatTone }>
  selected: Cell
  onSelect: (cell: Cell) => void
  locale: string
  copy: TerrainCalendarCopy
  format: TerrainFormats
}

const QuietReadout = memo(Readout)

export function TerrainCard({ days, rows, reach, metric, category, categories, details, tones, selected, onSelect, locale, copy, format }: TerrainCardProps) {
  const [hovered, setHovered] = useState<Cell | null>(null)
  const active = hovered ?? selected
  const shown = useDeferredValue(active)
  const quietRows = useDeferredValue(rows)
  const quietMetric = useDeferredValue(metric)
  const quietCategory = useDeferredValue(category)
  const labelOf = useCallback((id: string) => (id === ALL ? copy.all : (categories.find((c) => c.id === id)?.label ?? id)), [categories, copy.all])
  const ramps = useMemo(() => Object.values(tones).map((t) => t.css), [tones])
  const day = dayAt(days, shown)
  const weeks = weekTotals(quietRows)
  const peak = Math.max(0, ...rows.flat())
  const first = days[0]?.date
  const last = days.at(-1)?.date

  const weekdays = useMemo(() => Array.from({ length: WEEK_DAYS }, (_, d) => format.weekday(d)), [format])
  const grid = useMemo(
    () => ({
      label: copy.grid(quietMetric.label, labelOf(quietCategory)),
      weekdays,
      cornerHeader: copy.day,
      columnName: (col: number) => copy.week(format.short(days[col * WEEK_DAYS]?.date ?? '')),
      reading: (cell: Cell) => {
        const at = dayAt(days, cell)
        const count = entriesOf(at, quietCategory).length
        return count ? `${format.spoken(quietMetric.id, quietRows[cell.row]?.[cell.col] ?? 0)}, ${copy.entryCount(count)}` : quietDay(at, labelOf(quietCategory), copy)
      },
    }),
    [copy, format, quietMetric, quietCategory, quietRows, days, weekdays, labelOf],
  )
  const rowTicks = useMemo(() => Array.from({ length: WEEK_DAYS }, (_, row) => format.weekday(weekdayOf(row), true)), [format])
  // Each week's labels, formatted once: its month where one begins, and its date for while it's looked at.
  const ticks = useMemo(
    () =>
      Array.from({ length: weeksIn(days) }, (_, col) => {
        const monday = days[col * WEEK_DAYS]?.date ?? ''
        const previous = days[(col - 1) * WEEK_DAYS]?.date
        return { month: format.month(monday), date: format.short(monday), major: col === 0 || (!!previous && format.month(monday) !== format.month(previous)) }
      }),
    [days, format],
  )
  const columnTick = useCallback(
    (col: number) => {
      const tick = ticks[col]
      return { label: tick ? (tick.major && col !== active.col ? tick.month : tick.date) : '', major: !!tick?.major }
    },
    [ticks, active.col],
  )
  const tip = (cell: Cell) => {
    const at = dayAt(days, cell)
    return (
      <>
        <span className="font-mono uppercase opacity-70">{at ? format.tiny(at.date) : ''}</span>
        <span className="font-mono tabular-nums">{entriesOf(at, category).length ? format.text(metric.id, rows[cell.row]?.[cell.col] ?? 0) : quietDay(at, labelOf(category), copy)}</span>
      </>
    )
  }

  return (
    <Card className="gap-0 overflow-hidden py-0 text-fg">
      <CardHeader className="border-b border-line py-4">
        <CardTitle>{copy.terrain}</CardTitle>
        <CardDescription>{first && last ? copy.range(weeks.length, format.short(first), format.short(last)) : null}</CardDescription>
        <CardAction className="font-mono text-ui-xs text-fg-muted uppercase">{copy.synced}</CardAction>
      </CardHeader>
      <CardContent className="grid gap-6 py-(--card-spacing) lg:grid-cols-[minmax(0,1fr)_--spacing(64)] lg:items-center">
        <Terrain
          rows={rows}
          reach={reach}
          tone={tones[metric.id]!.css}
          tones={ramps}
          selected={selected}
          hovered={hovered}
          onHover={setHovered}
          onSelect={onSelect}
          rowTicks={rowTicks}
          columnTick={columnTick}
          tip={tip}
          grid={grid}
        />
        {day && (
          <QuietReadout
            day={day}
            weekday={weekdayOf(shown.row)}
            metric={quietMetric}
            category={quietCategory}
            categories={categories}
            details={details}
            categoryLabel={labelOf(quietCategory)}
            value={quietRows[shown.row]?.[shown.col] ?? 0}
            row={quietRows[shown.row] ?? []}
            col={shown.col}
            weekTotal={weeks[shown.col] ?? 0}
            tone={tones[quietMetric.id]!.stat}
            locale={locale}
            copy={copy}
            format={format}
          />
        )}
      </CardContent>
      <CardFooter className="flex-wrap justify-between gap-x-6 gap-y-3">
        <Legend tone={tones[metric.id]!.css} max={peak} metric={metric.id} copy={copy} format={format} />
        <div aria-label={copy.hintsLabel} className="hidden items-center gap-3 text-ui-sm text-fg-muted sm:flex">
          <span className="flex items-center gap-1.5">
            <Kbd>←</Kbd>
            <Kbd>→</Kbd>
            {copy.hints.weeks}
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            {copy.hints.days}
          </span>
        </div>
      </CardFooter>
    </Card>
  )
}
