'use client'

import { Stat, StatBars, StatDelta, StatMeter, StatNote, StatValue, type StatTone } from '../../../components/ui/stat-card'
import { cn, toneColor } from '../../../lib/utils'
import { quietDay, entriesOf, type TerrainCalendarCategory, type TerrainCalendarDay, type TerrainCalendarDetail, type TerrainCalendarEntry, type TerrainCalendarMetric, type TerrainCalendarCopy } from './data'
import type { TerrainFormats } from './format'

/* The looked-at day in figures, beside the drawing: its date and entry
 * count, the day's measure (rolling to each new day), how it compares with
 * your usual day of that name, its entries (category, then a column per detail),
 * that day of the week across every week as bars with this one lit (the
 * drawing's row, flattened), and its share of its week (the drawing's
 * column, summed). And the legend under the card. */

/** A day against its usual swings far: whole percents read cleaner. */
const WHOLE_PERCENT: Intl.NumberFormatOptions = { style: 'percent', maximumFractionDigits: 0 }

interface ReadoutProps {
  day: TerrainCalendarDay
  /** The day of the week, 0 for Monday. */
  weekday: number
  metric: TerrainCalendarMetric
  /** The category shown: an id, or 'all'. */
  category: string
  categories: TerrainCalendarCategory[]
  details: TerrainCalendarDetail[]
  /** The category shown, by name: "No swim sessions". */
  categoryLabel: string
  value: number
  /** This day of the week in every week, oldest first, and which week this is. */
  row: number[]
  col: number
  weekTotal: number
  tone: StatTone
  locale: string
  copy: TerrainCalendarCopy
  format: TerrainFormats
}

export function Readout({ day, weekday, metric, category, categories, details, categoryLabel, value, row, col, weekTotal, tone, locale, copy, format }: ReadoutProps) {
  const entries = entriesOf(day, category)
  // Your usual day of this name: the average of the ones with something on.
  const active = row.filter((v) => v > 0)
  const usual = active.length ? active.reduce((a, b) => a + b, 0) / active.length : 0
  const name = format.weekday(weekday)
  return (
    <Stat
      label={<bdi>{format.date(day.date)}</bdi>}
      action={
        entries.length ? (
          <span dir="auto" className="font-mono tabular-nums">
            {copy.entryCount(entries.length)}
          </span>
        ) : undefined
      }
      data-slot="terrain-readout"
      className="gap-3 p-0"
    >
      <StatValue size="lg" locale={locale} {...format.day(metric.id, value)} />
      {!entries.length ? (
        <StatNote>{quietDay(day, categoryLabel, copy)}</StatNote>
      ) : (
        value > 0 &&
        usual > 0 && (
          <StatDelta value={value / usual - 1} format={WHOLE_PERCENT} locale={locale}>
            {copy.vsUsual(name)}
          </StatDelta>
        )
      )}
      <Entries entries={entries} categories={categories} details={details} locale={locale} copy={copy} />
      <StatBars data={row} highlight={col} tone={tone} label={copy.rowLabel(name, row.length)} className="mt-3 h-10" />
      <StatMeter value={value} max={weekTotal} tone={tone} locale={locale}>
        {copy.weekShare(metric.label)}
      </StatMeter>
    </Stat>
  )
}

/** The day's entries as a small table: what, then a column per detail. */
function Entries({ entries, categories, details, locale, copy }: { entries: TerrainCalendarEntry[]; categories: TerrainCalendarCategory[]; details: TerrainCalendarDetail[]; locale: string; copy: TerrainCalendarCopy }) {
  if (!entries.length) return null
  return (
    <table data-slot="terrain-entries" className="mt-2 w-full border-t border-line text-ui-sm">
      <caption className="sr-only">{copy.entries}</caption>
      <tbody>
        {entries.map((e, i) => {
          const category = categories.find((c) => c.id === e.category)
          const name = category?.label ?? e.category
          return (
            <tr key={i} className="*:pt-2 *:align-baseline">
              <th scope="row" className="w-full max-w-0 truncate text-start font-normal text-fg">
                {category?.tone && <span aria-hidden className="me-1.5 inline-block size-2 rounded-full align-baseline" style={{ background: toneColor(category.tone) }} />}
                {e.title ?? name}
                {/* "Race Swim", but not "Long ride Ride"; a space, not a margin, so the words keep apart in any direction. */}
                {e.title && !e.title.toLowerCase().includes(name.toLowerCase()) && (
                  <>
                    {' '}
                    <span className="text-fg-muted">{name}</span>
                  </>
                )}
              </th>
              {details.map((d) => {
                const v = e.values[d.id]
                return (
                  <td key={d.id} className={cn('ps-3 text-end font-mono whitespace-nowrap tabular-nums', v !== undefined && d.strong?.(v) ? 'text-fg' : 'text-fg-muted')}>
                    {v !== undefined && (
                      <>
                        <span aria-hidden={d.spoken ? true : undefined}>{d.format(v, locale)}</span>
                        {d.spoken && <span className="sr-only">{d.spoken(v, locale)}</span>}
                      </>
                    )}
                  </td>
                )
              })}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

/** The ramp from a quiet day to the biggest, with its two ends in figures, and the selected day's ink. */
export function Legend({ tone, max, metric, copy, format }: { tone: string; max: number; metric: string; copy: TerrainCalendarCopy; format: TerrainFormats }) {
  return (
    <div role="group" aria-label={copy.legend} className="me-auto flex flex-wrap items-center gap-x-5 gap-y-2 text-ui-sm text-fg-muted">
      <span className="flex items-center gap-2 font-mono tabular-nums">
        <span>0</span>
        <span
          aria-hidden
          className="h-1.5 w-24 rounded-full"
          style={{ backgroundImage: `linear-gradient(to right in oklab, color-mix(in oklab, var(--color-fg) 9%, var(--color-surface)), ${tone})` }}
        />
        <span>{format.text(metric, max)}</span>
      </span>
      <span className="flex items-center gap-2">
        <span aria-hidden className="size-2.5 rounded-[2px] bg-fg" />
        {copy.selected}
      </span>
    </div>
  )
}
