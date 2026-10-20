'use client'

import { useId, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '@youj/icons'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Calendar } from '../../components/ui/calendar'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { Skeleton } from '../../components/ui/skeleton'
import { Eyebrow } from '../../components/ui/typography'
import { useControllableState } from '../../hooks/use-controllable-state'
import { useNow } from '../../hooks/use-now'
import { cn, dateTimeFormat, listFormat, numberFormat } from '../../lib/utils'
import {
  DEFAULT_COPY,
  DEMO_TODAY,
  EVENTS,
  type MonthAgendaEvent,
  type MonthAgendaCopy,
  type MonthAgendaCycle,
  type MonthAgendaMark,
  type MonthAgendaTone,
} from './month-agenda/data'
import { AgendaDay, AgendaDays, CycleDot, type DayInfo } from './month-agenda/day'

/* What comes round each month, on the kit's Calendar: each day a tile with
 * the marks of what falls on it and a dot for the cycle (solid monthly,
 * a ring yearly; the legend names only the cycles in use), today lit in the accent and the days outside the month
 * hatched. Hover or arrow onto a day and its tooltip lists the events; pick
 * one and + adds one on it (or today). The head counts what is active and
 * what is new this month; the foot sums what is due in the month shown, or
 * counts the events when none has an amount. Today, the arrows and the
 * month name move it a month at a time. Loading holds the grid as skeleton
 * tiles and an error with Retry sits over it, both at the grid's size.
 * Pass `today` from your server so the marks hydrate; with the demo data it
 * is the demo's own day. Embedded, it stops at its natural width unless `fill`.
 * Reduced motion: the month changes in place. */

interface MonthAgendaProps extends Omit<ComponentProps<'section'>, 'children' | 'title' | 'defaultValue'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (448px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<MonthAgendaCopy>
  /** Formats the month, days and money (BCP 47). Default: the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The events, each coming round on the day it starts. */
  events?: MonthAgendaEvent[]
  /** Formats an amount. Default: US dollars in the locale's number format. */
  format?: (amount: number) => string
  /** Skeleton tiles in place of the month's events while your data loads. Default false. */
  loading?: boolean
  /** Shown over the month when it fails to load, with Retry when `onRetry` is set. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** Replaces the line under the month when there are no events. Default: `copy.none`. */
  empty?: ReactNode
  /** Lit on the calendar. Default: the demo's day with the demo events; with your own, the browser's clock once mounted. */
  today?: Date | string | number
  /** The month shown (any day in it), when your app owns it. */
  month?: Date | string
  /** The month shown at first. Default: today's. */
  defaultMonth?: Date | string
  onMonthChange?: (month: Date) => void
  /** The picked day, "2026-10-15", when your app owns it; `null` for none. */
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (day: string | null) => void
  /** The first day of the week, 0 for Sunday. Default: the locale's. */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  /** Adds an event on a day (the picked one, else today), "2026-10-15". */
  onAdd?: (day: string) => void
}

/** "2026-10-15" as its numbers. */
const partsOf = (iso: string) => iso.split('-').map(Number) as [number, number, number]
/** A local date's "2026-10-15". */
const isoOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
/** A day as a local date: "2026-10-15" as written, a Date or ms by its local date. */
function dateOf(input: Date | string | number) {
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [y, m, d] = partsOf(input)
    return new Date(y, m - 1, d)
  }
  const d = new Date(input)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}
const daysIn = (year: number, month: number) => new Date(year, month + 1, 0).getDate()

/** Whether an event falls on a local date: on its start day each month, or each year in its month; short months use their last day. */
function occursOn(s: MonthAgendaEvent, date: Date) {
  const [sy, sm, sd] = partsOf(s.start)
  const [y, m, d] = [date.getFullYear(), date.getMonth(), date.getDate()]
  if (y * 400 + m * 32 + d < sy * 400 + (sm - 1) * 32 + sd) return false
  if (s.cycle === 'yearly' && m !== sm - 1) return false
  return Math.min(sd, daysIn(y, m)) === d
}

function MonthAgenda({
  theme,
  embedded = true,
  fill = false,
  className,
  copy: copyProp,
  locale: localeProp,
  events: eventsProp,
  format: formatProp,
  loading = false,
  error,
  onRetry,
  empty,
  today: todayProp,
  month: monthProp,
  defaultMonth,
  onMonthChange,
  value: valueProp,
  defaultValue = null,
  onValueChange,
  weekStartsOn,
  onAdd,
  ...rest
}: MonthAgendaProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const own = eventsProp !== undefined || loading || !!error
  const events = eventsProp ?? (own ? [] : EVENTS)
  const clock = useNow(todayProp === undefined && own ? 60 * 60_000 : 0)
  const todayInput = todayProp ?? (own ? (clock ?? undefined) : DEMO_TODAY)
  const today = todayInput === undefined ? undefined : dateOf(todayInput)
  const firstOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)
  const [month, setMonthState] = useControllableState<Date>(
    monthProp === undefined ? undefined : firstOf(dateOf(monthProp)),
    firstOf(defaultMonth !== undefined ? dateOf(defaultMonth) : (today ?? new Date())),
  )
  const [value, setValueState] = useControllableState(valueProp, defaultValue)
  const setMonth = (next: Date) => {
    setMonthState(next)
    onMonthChange?.(next)
  }
  const setValue = (next: string | null) => {
    setValueState(next)
    onValueChange?.(next)
  }

  const usd = numberFormat(locale, { style: 'currency', currency: 'USD' })
  const money = { format: formatProp ?? usd.format }
  const count = numberFormat(locale)
  const monthName = dateTimeFormat(locale, { month: 'long' }).format(month)
  const monthTitle = dateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(month)
  const dayName = dateTimeFormat(locale, { month: 'short', day: 'numeric' })
  const list = listFormat(locale, { type: 'conjunction' })

  // The month's charges, day by day, and what is active and new in it.
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0)
  const dated: { date: Date; event: MonthAgendaEvent }[] = []
  for (let d = 1; d <= end.getDate(); d++) {
    const date = new Date(month.getFullYear(), month.getMonth(), d)
    for (const s of events) if (occursOn(s, date)) dated.push({ date, event: s })
  }
  const active = events.filter((s) => s.start <= isoOf(end))
  const added = active.filter((s) => s.start >= isoOf(month))
  const hasAmounts = events.some((s) => s.amount !== undefined)
  const due = dated.reduce((sum, c) => sum + (c.event.amount ?? 0), 0)
  const next = today ? dated.find((c) => c.date >= today) : undefined
  const idle = loading || !!error

  const amountOf = (s: MonthAgendaEvent) => (s.amount === undefined ? '' : money.format(s.amount))
  const price = (s: MonthAgendaEvent) => (s.amount === undefined ? '' : (s.cycle === 'yearly' ? copy.perYear : copy.perMonth)(amountOf(s)))
  const info: DayInfo = {
    loading,
    eventsOf: (date) => events.filter((s) => occursOn(s, date)),
    line: (s) => ({ name: s.name, price: price(s) }),
    spoken: (subs) => copy.onDay(list.format(subs.map((s) => copy.onDayEvent(s.name, amountOf(s), s.cycle === 'yearly' ? copy.yearly : copy.monthly)))),
  }
  const picked = value ? dateOf(value) : undefined
  const step = (by: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + by, 1))
  const VOICE = 'font-(family-name:--yj-label-font) tracking-(--yj-label-tracking) [text-transform:var(--yj-label-case)]'

  const card = (
    <Card className={cn('w-full text-fg', !embedded && !fill && 'max-w-md')}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription className="tabular-nums">
          {loading ? <Skeleton className="inline-block h-4 w-24 align-middle" /> : error ? '—' : copy.subtitle(count.format(active.length), count.format(added.length))}
        </CardDescription>
        <CardAction>
          <Button size="icon-sm" aria-label={copy.add} disabled={idle} onClick={() => onAdd?.(value ?? (today ? isoOf(today) : isoOf(month)))}>
            <PlusIcon aria-hidden />
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <p aria-live="polite" className="truncate text-ui-lg font-medium tracking-tight tabular-nums">
            {monthTitle}
          </p>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="outline"
              size="xs"
              disabled={idle}
              onClick={() => {
                if (!today) return
                setMonth(firstOf(today))
                setValue(isoOf(today))
              }}
            >
              {copy.today}
            </Button>
            <Button variant="ghost" size="icon-xs" aria-label={copy.previous} disabled={idle} onClick={() => step(-1)}>
              <ChevronLeftIcon trigger="none" className="rtl:-scale-x-100" />
            </Button>
            <Button variant="ghost" size="icon-xs" aria-label={copy.next} disabled={idle} onClick={() => step(1)}>
              <ChevronRightIcon trigger="none" className="rtl:-scale-x-100" />
            </Button>
          </div>
        </div>
        <div className="relative">
        <AgendaDays.Provider value={info}>
          <Calendar
            mode="single"
            month={month}
            onMonthChange={setMonth}
            selected={picked}
            onSelect={(d) => setValue(d ? isoOf(d) : null)}
            today={today}
            weekStartsOn={weekStartsOn}
            hideNavigation
            formatters={{ formatWeekdayName: (d) => dateTimeFormat(locale, { weekday: 'short' }).format(d) }}
            components={{ DayButton: AgendaDay }}
            className={cn('-mx-1 w-auto', error && 'invisible')}
            classNames={{
              months: 'flex flex-col',
              month: 'flex flex-col',
              month_caption: 'sr-only',
              month_grid: 'w-full table-fixed border-separate border-spacing-1',
              weekday: cn('h-6 p-0 text-center align-middle text-ui-xs font-normal text-fg-muted', VOICE),
              day: 'p-0',
            }}
          />
        </AgendaDays.Provider>
        {error && (
          <div className="absolute inset-0 grid place-items-center">
            <Alert variant="danger">
              <AlertDescription>{error}</AlertDescription>
              {onRetry && (
                <AlertAction>
                  <Button size="sm" variant="outline" onClick={onRetry}>
                    {copy.retry}
                  </Button>
                </AlertAction>
              )}
            </Alert>
          </div>
        )}
        {loading && <span className="sr-only">{copy.loadingLabel}</span>}
        </div>
        <div className="flex min-h-5 items-center justify-between gap-3">
          <ul className="flex shrink-0 items-center gap-3">
            {(events.length === 0 || events.some((s) => s.cycle === 'monthly')) && (
              <li className="flex items-center gap-1.5">
                <CycleDot yearly={false} />
                <Eyebrow className="text-ui-xs">{copy.monthly}</Eyebrow>
              </li>
            )}
            {(events.length === 0 || events.some((s) => s.cycle === 'yearly')) && (
              <li className="flex items-center gap-1.5">
                <CycleDot yearly />
                <Eyebrow className="text-ui-xs">{copy.yearly}</Eyebrow>
              </li>
            )}
          </ul>
          <div className="min-w-0 truncate text-ui-sm text-fg-muted">
            {loading ? (
              <Skeleton className="h-4 w-32" />
            ) : error ? null : events.length === 0 ? (
              (empty ?? copy.none)
            ) : next ? (
              copy.upcoming(next.event.name, dayName.format(next.date))
            ) : (
              copy.count(active.length)
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="justify-between gap-3">
        <span>{hasAmounts || events.length === 0 ? copy.monthTotal(monthName) : copy.monthCount(monthName)}</span>
        {loading ? (
          <Skeleton className="h-5 w-16" />
        ) : error ? (
          <data value="" className="font-mono text-ui-lg text-fg-subtle">—</data>
        ) : hasAmounts || events.length === 0 ? (
          <data value={String(Math.round(due * 100) / 100)} className="font-mono text-ui-lg font-medium text-fg tabular-nums">
            {money.format(due)}
          </data>
        ) : (
          <data value={String(dated.length)} className="font-mono text-ui-lg font-medium text-fg tabular-nums">
            {count.format(dated.length)}
          </data>
        )}
      </CardFooter>
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} data-slot="month-agenda" {...rest} className={cn('w-full', !fill && 'max-w-md', className)}>
      {card}
    </section>
  ) : (
    <main
      aria-labelledby={titleId}
      data-slot="month-agenda"
      {...rest}
      className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}
    >
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { MonthAgenda, type MonthAgendaProps }
export type { MonthAgendaEvent, MonthAgendaCopy, MonthAgendaCycle, MonthAgendaMark, MonthAgendaTone }
