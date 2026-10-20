'use client'

import { useCallback, useId, useMemo, useState, type ComponentProps } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { Empty, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { StatDelta, StatValue } from '../../components/ui/stat-card'
import { cn, dateTimeFormat, numberFormat } from '../../lib/utils'
import { DAYS, DEFAULT_COPY, NOTES, PREVIOUS_TOTAL, type DailyBarsCopy, type DailyBarsDay, type DailyBarsNote } from './daily-bars/data'
import { Plot } from './daily-bars/plot'
import { changeBetween, dayStats } from './daily-bars/stats'

/* A period read day by day. The total leads, large, with its change on the
 * period before; under it the readout, which names the period until you
 * point at a day, then reads that day. The bars are quiet, the busiest day
 * lit; the average is a dashed line with its tag at the end. A note on a day
 * is a callout over its bar, kept in a lane above the tallest one so it never
 * touches a bar. Point at a day, or focus the chart and use the arrow keys
 * (Home and End jump, Escape lets go). The footer reads the data back: top
 * day, daily average and quietest day. Feed it `days` (one reading each, in
 * order), `previousTotal` for the change and `notes`; every string is in
 * `copy`. Built for the compact layout density, taken from the page; embedded,
 * it keeps its natural width unless `fill`. Reduced motion: bars are drawn in
 * place. */

interface DailyBarsProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (576px at 100% scale). Default false. */
  fill?: boolean
  /** The title's level. Default: 2 when embedded, else 1. */
  headingLevel?: 1 | 2 | 3
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<DailyBarsCopy>
  /** Formats every figure and date (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** Intl.NumberFormat options for every figure: currency, units, decimals. Default: whole numbers. */
  format?: Intl.NumberFormatOptions
  /** One reading per day, oldest first. Default: the demo's month. */
  days?: readonly DailyBarsDay[]
  /** The same measure summed over the period before, for the change beside the total. Without it the change is left out. */
  previousTotal?: number
  /** Notes to draw over their days. Those that can't fit the lane beside the others are left out of it. */
  notes?: readonly DailyBarsNote[]
}

const WHOLE: Intl.NumberFormatOptions = { maximumFractionDigits: 0 }
const NO_NOTES: readonly DailyBarsNote[] = []

function DailyBars({
  theme,
  embedded = true,
  fill = false,
  headingLevel,
  copy: copyProp,
  locale,
  format = WHOLE,
  days: daysProp,
  previousTotal: previousProp,
  notes: notesProp,
  className,
  ...rest
}: DailyBarsProps) {
  const copyLocale = useLocale(locale ?? copyProp?.locale)
  const copy = useMemo(() => ({ ...DEFAULT_COPY, ...copyProp, locale: copyLocale }) satisfies DailyBarsCopy, [copyProp, copyLocale])
  const titleId = useId()
  const summaryId = useId()
  const Title = `h${headingLevel ?? (embedded ? 2 : 1)}` as 'h1' | 'h2' | 'h3'
  const [active, setActive] = useState<number | null>(null)

  const demo = daysProp === undefined
  const days = daysProp ?? DAYS
  const previousTotal = previousProp ?? (demo ? PREVIOUS_TOTAL : undefined)
  const notes = notesProp ?? (demo ? NOTES : NO_NOTES)
  const values = useMemo(() => days.map((d) => d.value), [days])
  const stats = useMemo(() => dayStats(values), [values])

  const number = useMemo(() => numberFormat(copy.locale, format), [copy.locale, format])
  const short = useMemo(() => dateTimeFormat(copy.locale, { month: 'short', day: 'numeric', timeZone: 'UTC' }), [copy.locale])
  const dateOf = useCallback((i: number) => short.format(Date.parse(`${days[i]!.date}T00:00:00Z`)), [short, days])
  const readingOf = useCallback((i: number) => copy.reading(dateOf(i), number.format(values[i]!)), [copy, dateOf, number, values])
  const placed = useMemo(() => notes.map((note) => ({ index: days.findIndex((d) => d.date === note.date), text: note.text })), [notes, days])

  const change = stats ? changeBetween(stats.total, previousTotal) : undefined
  const period = days.length > 1 ? short.formatRange(Date.parse(`${days[0]!.date}T00:00:00Z`), Date.parse(`${days.at(-1)!.date}T00:00:00Z`)) : days.length ? dateOf(0) : ''

  const card = (
    <Card className={cn('w-full gap-5 text-fg', !embedded && !fill && 'max-w-xl')}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription>{copy.subtitle}</CardDescription>
      </CardHeader>

      {stats ? (
        <>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <StatValue value={stats.total} format={format} locale={copy.locale} size="lg" />
              {change !== undefined && (
                <StatDelta value={change} locale={copy.locale}>
                  {copy.vsPrevious}
                </StatDelta>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <p aria-live="polite" data-slot="daily-bars-readout" className="min-h-5 text-ui-sm text-fg-muted tabular-nums">
                {active === null ? period : <span className="text-fg">{readingOf(active)}</span>}
              </p>
              <Plot
                values={values}
                tickOf={dateOf}
                readingOf={readingOf}
                notes={placed}
                peak={stats.top}
                average={stats.average}
                averageTag={copy.averageTag(number.format(stats.average))}
                active={active}
                onActiveChange={setActive}
                label={copy.chart}
                summaryId={summaryId}
              />
              <p id={summaryId} className="sr-only">
                {copy.summary(number.format(stats.total), days.length, dateOf(stats.top), number.format(values[stats.top]!), number.format(stats.average))}
              </p>
            </div>
          </CardContent>

          <CardFooter>
            <dl className="grid w-full grid-cols-3 gap-4">
              <Fact label={copy.topDay} value={number.format(values[stats.top]!)} note={dateOf(stats.top)} />
              <Fact label={copy.dailyAverage} value={number.format(stats.average)} />
              <Fact label={copy.quietest} value={number.format(values[stats.quietest]!)} note={dateOf(stats.quietest)} />
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

export { DailyBars, type DailyBarsProps }
export type { DailyBarsCopy, DailyBarsDay, DailyBarsNote }
