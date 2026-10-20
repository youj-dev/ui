'use client'

import { useId, useMemo, useState, type ComponentProps } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Empty, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { useNow } from '../../hooks/use-now'
import { cn, dateTimeFormat, numberFormat } from '../../lib/utils'
import { DEFAULT_COPY, ENTRIES, KINDS, WEEK_START, type WeekBlocksCopy, type WeekBlocksEntry, type WeekBlocksKind } from './week-blocks/data'
import { addDays, hourTicks, layoutWeek, mondayOf, parseTime, splitDuration, totalsByKind, wallClock, weekColumns } from './week-blocks/model'
import { Plot } from './week-blocks/plot'
import { Summary } from './week-blocks/summary'

/* A week of logged time as columns, one per day, the hours down the side. Each
 * entry is a rounded block in its kind's color, placed by its start and end;
 * today is marked in the header and, while the clock is inside the hours
 * shown, a line crosses today's column with its time in the gutter (it moves
 * on each minute, in place under reduced motion). Under the plot the week's
 * total leads, large, and the legend is the totals per kind. Point at a block,
 * or focus the plot and use the arrow keys, to read it above the plot: the
 * day, the times, the kind and how long. Feed it `entries` (a day, `HH:MM`
 * start and end and a kind each), `kinds` (an id, a label and a color role
 * each; the first is the headline) and `weekStart`; every string is in `copy`.
 * Entries that overlap on a day are drawn over each other. Built for the
 * compact layout density, taken from the page; embedded, it keeps its natural
 * width unless `fill`. */

const DEFAULT_HOURS = [9, 18] as const

interface WeekBlocksProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (576px at 100% scale). Default false. */
  fill?: boolean
  /** The title's level. Default: 2 when embedded, else 1. */
  headingLevel?: 1 | 2 | 3
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<WeekBlocksCopy>
  /** Formats every time, day and length (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** What was logged, in any order. Default: the demo's week. */
  entries?: readonly WeekBlocksEntry[]
  /** The kinds the entries name: an id, a label and a color role. The first leads the legend. Default: Billable and Personal. */
  kinds?: readonly WeekBlocksKind[]
  /** The Monday the week starts on, as an ISO date. Default: the Monday of the first entry. */
  weekStart?: string
  /** The hours shown, start and end. Default `[9, 18]`. */
  hours?: readonly [number, number]
  /** The time for the now line: a timestamp or a Date. Default: the clock, read each minute. */
  now?: number | Date
  /** The time zone the entries' clock is in, for the now line. Default: the browser's. */
  timeZone?: string
}

function WeekBlocks({
  theme,
  embedded = true,
  fill = false,
  headingLevel,
  copy: copyProp,
  locale,
  entries: entriesProp,
  kinds: kindsProp,
  weekStart: weekStartProp,
  hours = DEFAULT_HOURS,
  now: nowProp,
  timeZone,
  className,
  ...rest
}: WeekBlocksProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) } satisfies WeekBlocksCopy
  const titleId = useId()
  const summaryId = useId()
  const Title = `h${headingLevel ?? (embedded ? 2 : 1)}` as 'h1' | 'h2' | 'h3'
  const [active, setActive] = useState<number | null>(null)

  const entries = entriesProp ?? ENTRIES
  const kinds = kindsProp ?? KINDS
  const weekStart =
    weekStartProp ?? (entriesProp === undefined ? WEEK_START : entries.length ? mondayOf(entries.map((e) => e.day).sort()[0]!) : WEEK_START)
  const columnCount = weekColumns(weekStart, entries)
  const shown = [hours[0] * 60, hours[1] * 60] as const
  const { slots, valid } = useMemo(() => layoutWeek(entries, kinds, weekStart, columnCount, hours), [entries, kinds, weekStart, columnCount, hours])
  const totals = useMemo(() => totalsByKind(valid), [valid])
  const total = valid.reduce((sum, e) => sum + parseTime(e.end)! - parseTime(e.start)!, 0)

  const clock = useNow(nowProp === undefined ? 60_000 : 0)
  const time = nowProp === undefined ? clock : typeof nowProp === 'number' ? nowProp : nowProp.getTime()
  const today = time === null ? undefined : wallClock(time, timeZone)

  const fmt = useMemo(() => {
    const clockTime = dateTimeFormat(copy.locale, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'UTC' })
    const hour = numberFormat(copy.locale, { minimumIntegerDigits: 2, useGrouping: false })
    const weekday = dateTimeFormat(copy.locale, { weekday: 'short', timeZone: 'UTC' })
    const dayNumber = dateTimeFormat(copy.locale, { day: 'numeric', timeZone: 'UTC' })
    const range = dateTimeFormat(copy.locale, { month: 'short', day: 'numeric', timeZone: 'UTC' })
    const hours = numberFormat(copy.locale, { style: 'unit', unit: 'hour', unitDisplay: 'narrow', maximumFractionDigits: 0 })
    const minutes = numberFormat(copy.locale, { style: 'unit', unit: 'minute', unitDisplay: 'narrow', maximumFractionDigits: 0 })
    const units = new Intl.ListFormat(copy.locale, { style: 'narrow', type: 'unit' })
    const at = (day: string) => Date.parse(`${day}T00:00:00Z`)
    return {
      time: (minute: number) => clockTime.format(Date.UTC(2000, 0, 1, 0, minute)),
      hour: (h: number) => hour.format(h),
      weekday: (day: string) => weekday.format(at(day)),
      dayNumber: (day: string) => dayNumber.format(at(day)),
      range: (from: string, to: string) => range.formatRange(at(from), at(to)),
      duration: (length: number) => {
        const { hours: h, minutes: m } = splitDuration(length)
        return units.format([...(h || !m ? [hours.format(h)] : []), ...(m ? [minutes.format(m)] : [])])
      },
    }
  }, [copy.locale])

  const columns = Array.from({ length: columnCount }, (_, i) => {
    const day = addDays(weekStart, i)
    return { day, name: fmt.weekday(day), number: fmt.dayNumber(day), today: today?.day === day }
  })
  const column = today ? columns.findIndex((c) => c.day === today.day) : -1
  const now =
    today && column >= 0 && today.minute >= shown[0] && today.minute <= shown[1]
      ? { column, minute: today.minute, label: fmt.time(today.minute) }
      : undefined
  const ticks = hourTicks(hours[0], hours[1]).map((h) => ({ minute: h * 60, label: fmt.hour(h) }))
  const readingOf = (i: number) => {
    const { entry, kind, minutes } = slots[i]!
    return copy.reading(
      fmt.weekday(entry.day),
      `${fmt.time(parseTime(entry.start)!)}–${fmt.time(parseTime(entry.end)!)}`,
      kind.label,
      fmt.duration(minutes),
    )
  }

  const card = (
    <Card className={cn('w-full gap-5 text-fg', !embedded && !fill && 'max-w-xl')}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription aria-live="polite" className="tabular-nums">
          <span data-slot="week-blocks-readout">
            {active !== null ? (
              <span className="text-fg">{readingOf(active)}</span>
            ) : (
              valid.length > 0 && fmt.range(columns[0]!.day, columns.at(-1)!.day)
            )}
          </span>
        </CardDescription>
      </CardHeader>

      {valid.length > 0 ? (
        <CardContent className="flex flex-col gap-6">
          <Plot
            columns={columns}
            slots={slots}
            shown={shown}
            ticks={ticks}
            now={now}
            active={active}
            onActiveChange={setActive}
            label={copy.chart}
            summaryId={summaryId}
          />
          <p id={summaryId} className="sr-only">
            {copy.summary(fmt.duration(total), valid.length)}
          </p>
          <ul className="sr-only">
            {slots.map((_, i) => (
              <li key={i}>{readingOf(i)}</li>
            ))}
          </ul>
          <Summary
            total={fmt.duration(total)}
            totalLabel={copy.total}
            kinds={kinds.map((kind) => ({ kind, length: fmt.duration(totals[kind.id] ?? 0) }))}
          />
        </CardContent>
      ) : (
        <CardContent>
          <Empty className="rounded-lg border border-dashed border-line">
            <EmptyHeader>
              <EmptyTitle>{copy.empty}</EmptyTitle>
            </EmptyHeader>
          </Empty>
        </CardContent>
      )}
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-xl', className)}>
      {card}
    </section>
  ) : (
    <main
      aria-labelledby={titleId}
      {...rest}
      className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}
    >
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { WeekBlocks, type WeekBlocksProps }
export type { WeekBlocksCopy, WeekBlocksEntry, WeekBlocksKind }
