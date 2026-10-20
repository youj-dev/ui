'use client'

import { useCallback, useId, useMemo, useState, type ComponentProps } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { Empty, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { StatDelta, StatValue } from '../../components/ui/stat-card'
import { cn, dateTimeFormat, numberFormat } from '../../lib/utils'
import { CURRENT, DEFAULT_COPY, NOTE, PREVIOUS, START, type RunningTotalCopy, type RunningTotalNote } from './running-total/data'
import { Plot } from './running-total/plot'
import { bestDay, changeBetween, cumulative, passedAt } from './running-total/stats'

/* A total as it builds up, against the period before. This period's running
 * total leads, large, with how far ahead of (or behind) the previous period
 * it is at the same day. Both lines share the day count along the bottom, so
 * they read as a race; the stretch between them is washed in the accent
 * where this period is ahead and in danger where it has fallen behind, and
 * each line ends in a value. A note is text beside its point on the line,
 * placed clear of both lines. Point along the plot, or focus it and use the
 * arrow keys (Home and End jump, Escape lets go), and the line above it
 * reads that day against the previous period. The footer reads the data
 * back: the day this period passed the previous one's total, the daily
 * pace and the best day. Feed it `current` and `previous` (one reading per
 * day, not yet summed), the period's `start` and a `note`; every string is in
 * `copy`. Built for the compact layout density, taken from the page;
 * embedded, it keeps its natural width unless `fill`. Reduced motion: the
 * lines are drawn in place. */

interface RunningTotalProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (576px at 100% scale). Default false. */
  fill?: boolean
  /** The title's level. Default: 2 when embedded, else 1. */
  headingLevel?: 1 | 2 | 3
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<RunningTotalCopy>
  /** Formats every figure and date (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** Intl.NumberFormat options for every figure: currency, units, decimals. Default: whole numbers. */
  format?: Intl.NumberFormatOptions
  /** This period's reading for each day so far, oldest first (the card sums them). Default: the demo's month. */
  current?: readonly number[]
  /** The period before, one reading per day, to line up with `current` by day number. Default: the demo's month. */
  previous?: readonly number[]
  /** The first day of this period, an ISO date. Default: 1 September 2026. */
  start?: string
  /** A note on one day, drawn beside its point on the line. */
  note?: RunningTotalNote
}

const WHOLE: Intl.NumberFormatOptions = { maximumFractionDigits: 0 }
const NO_DAYS: readonly number[] = []

function RunningTotal({
  theme,
  embedded = true,
  fill = false,
  headingLevel,
  copy: copyProp,
  locale,
  format = WHOLE,
  current: currentProp,
  previous: previousProp,
  start = START,
  note: noteProp,
  className,
  ...rest
}: RunningTotalProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) } satisfies RunningTotalCopy
  const titleId = useId()
  const summaryId = useId()
  const Title = `h${headingLevel ?? (embedded ? 2 : 1)}` as 'h1' | 'h2' | 'h3'
  const [active, setActive] = useState<number | null>(null)

  const demo = currentProp === undefined
  const daily = currentProp ?? CURRENT
  const before = previousProp ?? (demo ? PREVIOUS : NO_DAYS)
  const note = noteProp ?? (demo ? NOTE : undefined)

  const current = useMemo(() => cumulative(daily), [daily])
  const previous = useMemo(() => cumulative(before), [before])
  const total = current.at(-1) ?? 0
  const lastTotal = previous.at(-1)
  const sameDay = previous[current.length - 1]
  const change = changeBetween(total, sameDay)
  const passed = lastTotal === undefined ? undefined : passedAt(current, lastTotal)
  const best = bestDay(daily)

  const number = useMemo(() => numberFormat(copy.locale, format), [copy.locale, format])
  const short = useMemo(() => dateTimeFormat(copy.locale, { month: 'short', day: 'numeric', timeZone: 'UTC' }), [copy.locale])
  // Day `i` of the period as a date, whichever period it is on the plot.
  const dateOf = useCallback((i: number) => short.format(Date.parse(`${start}T00:00:00Z`) + i * 86_400_000), [short, start])
  const noteIndex = note ? Math.round((Date.parse(`${note.date}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000) : -1
  const noteOf = useCallback((i: number) => `${dateOf(i)} · ${number.format(current[i] ?? 0)}`, [dateOf, number, current])
  const reading = (i: number) => copy.reading(dateOf(i), number.format(current[i] ?? 0), number.format(previous[i] ?? 0))

  const card = (
    <Card className={cn('w-full gap-5 text-fg', !embedded && !fill && 'max-w-xl')}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription>{copy.subtitle}</CardDescription>
      </CardHeader>

      {current.length ? (
        <>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <StatValue value={total} format={format} locale={copy.locale} size="lg" />
              {change !== undefined && (
                <StatDelta value={change} locale={copy.locale}>
                  {copy.vsPrevious}
                </StatDelta>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex min-h-5 flex-wrap items-center justify-between gap-x-4 gap-y-1 text-ui-sm text-fg-muted">
                <span className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-1.5">
                    <span aria-hidden className="h-0.5 w-3 rounded-full bg-chart-1" />
                    {copy.thisPeriod}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span aria-hidden className="h-0.5 w-3 rounded-full bg-fg-subtle" />
                    {copy.previousPeriod}
                  </span>
                </span>
                <span aria-live="polite" data-slot="running-total-readout" className="tabular-nums text-fg">
                  {active !== null && reading(active)}
                </span>
              </div>
              <Plot
                current={current}
                previous={previous}
                tickOf={dateOf}
                noteOf={noteOf}
                note={note && noteIndex >= 0 ? { index: noteIndex, text: note.text } : undefined}
                currentEnd={number.format(total)}
                previousEnd={number.format(lastTotal ?? 0)}
                active={active}
                onActiveChange={setActive}
                label={copy.chart}
                summaryId={summaryId}
              />
              <p id={summaryId} className="sr-only">
                {copy.summary(number.format(total), number.format(sameDay ?? 0), current.length, passed === undefined ? undefined : dateOf(passed))}
              </p>
            </div>
          </CardContent>

          <CardFooter>
            <dl className="grid w-full grid-cols-3 gap-4">
              <Fact label={copy.passed} value={passed === undefined ? copy.notYet : dateOf(passed)} />
              <Fact label={copy.perDay} value={number.format(total / current.length)} />
              <Fact label={copy.bestDay} value={number.format(daily[best!]!)} note={dateOf(best!)} />
            </dl>
          </CardFooter>
        </>
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

function Fact({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="truncate text-ui-sm text-fg-muted">{label}</dt>
      <dd className="flex flex-wrap items-baseline gap-x-1.5 tabular-nums">
        <span className="text-ui-lg font-medium text-fg">{value}</span>
        {note && <span className="text-ui-sm text-fg-muted">{note}</span>}
      </dd>
    </div>
  )
}

export { RunningTotal, type RunningTotalProps }
export type { RunningTotalCopy, RunningTotalNote }
