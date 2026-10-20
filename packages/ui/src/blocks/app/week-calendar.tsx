'use client'

import { useMemo, useState, type ComponentProps, type ReactNode } from 'react'
import { useLabels, useLocale } from '@youj/core'
import { ChevronLeftIcon, ChevronRightIcon } from '@youj/icons'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '../../components/ui/alert'
import { AppPage } from '../../components/ui/app-page'
import { Button } from '../../components/ui/button'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { cn } from '../../lib/utils'
import { AgendaView } from './week-calendar/agenda'
import {
  CALENDARS,
  DEFAULT_COPY,
  EVENTS,
  eventsOn,
  isoDay,
  NOW,
  rangeLabel,
  TONES,
  weekDays,
  weekNumber,
  type CalendarCopy,
  type CalendarEvent,
  type CalendarSource,
  type CalendarTone,
} from './week-calendar/data'
import { FindTime, type FreeTime } from './week-calendar/find-time'
import { UpNext } from './week-calendar/up-next'
import { WeekView } from './week-calendar/week'

/* A screen: the week ahead. In a wide page it's a time grid (hours on
 * hairlines, events as tinted blocks placed by their times with where they
 * are and who's coming, overlaps side by side, today washed faintly with a
 * line at now), and beside it a rail: what's up next today, and Find a time,
 * a Slot Grid of the week's hours one day at a time, each saying how many
 * calendars are free (picking one tells the app, `onFindTime`). Agenda, and
 * every narrow page, lists the days instead. Every event is a button named
 * in full that opens its details. Previous and next step a week (recurring
 * events carry over) and the range is announced; Today comes back. Pass
 * your own `events` and `calendars`, your clock as `now`, and hear about
 * opened events with `onSelect`; leave the rail out with `aside={false}`.
 * Every string is in `copy`. */

type CalendarView = 'week' | 'agenda'

interface WeekCalendarProps extends Omit<ComponentProps<'div'>, 'title' | 'children' | 'onSelect'> {
  /** A page in your app's frame: the shared page header (AppPage) and the frame's gutter. Default true; `false` draws its own page (a canvas with a `main`). */
  embedded?: boolean
  /** The page's heading. Default "Calendar". */
  title?: string
  /** The heading's level; the agenda's days sit one below it. Default 1. */
  headingLevel?: 1 | 2 | 3
  /** Extra classes for the header and the views. */
  classNames?: Partial<Record<'header' | 'content', string>>
  /** The events. A recurring one shows every week on its weekday. Default: Northwind's week. */
  events?: CalendarEvent[]
  /** The calendars events belong to, listed as a legend. Default: Team, Focus and External. */
  calendars?: CalendarSource[]
  /** The current time: today's column, the line at now and which events are over. Default: 10:42 on Monday 28 September 2026. */
  now?: Date | number
  /** Any day of the week shown ("2026-10-05"), controlled. Pair with `onDateChange`. */
  date?: string
  /** Any day of the week shown first, uncontrolled. Default: today. */
  defaultDate?: string
  /** Previous, Next or Today moved the week; receives its Monday. */
  onDateChange?: (date: string) => void
  /** The view, controlled. Pair with `onViewChange`. */
  view?: CalendarView
  /** The view shown first, uncontrolled. Default "week". */
  defaultView?: CalendarView
  /** Week or Agenda was chosen. */
  onViewChange?: (view: CalendarView) => void
  /** An event's details were opened. */
  onSelect?: (event: CalendarEvent) => void
  /** A free hour was picked in Find a time. */
  onFindTime?: (time: FreeTime) => void
  /** The rail beside the week (Up next and Find a time) in a wide page. Default true. */
  aside?: boolean
  /** The grid's first and last hour. Default 8 to 18. */
  hours?: { start: number; end: number }
  /** How weekday and month names read (BCP 47). Default: the app's (YoujProvider's `locale`), else en-US. */
  locale?: string
  /** Keeps the layout while the events load. Default false. */
  loading?: boolean
  /** A load error, shown in place of the views with `onRetry`. */
  error?: ReactNode
  /** The error's "Try again". */
  onRetry?: () => void
  /** Shown in place of the views when the week has no events. Default: the views, each day saying it's free. */
  empty?: ReactNode
  /** The header's buttons, after the week controls. */
  actions?: ReactNode
  /** Take the frame's whole width instead of stopping at the page width (1280px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the page's strings, to rewrite or translate. */
  copy?: Partial<CalendarCopy>
}

const DEFAULT_HOURS = { start: 8, end: 18 }

function WeekCalendar({
  embedded = true,
  title = 'Calendar',
  headingLevel = 1,
  className,
  classNames,
  events: eventsProp = EVENTS,
  calendars = CALENDARS,
  now: nowProp = NOW,
  date: dateProp,
  defaultDate,
  onDateChange,
  view: viewProp,
  defaultView = 'week',
  onViewChange,
  onSelect,
  onFindTime,
  aside = true,
  hours = DEFAULT_HOURS,
  locale: localeProp,
  loading = false,
  error,
  onRetry,
  empty,
  actions,
  fill = false,
  copy: copyProp,
  ...rest
}: WeekCalendarProps) {
  const locale = useLocale(localeProp)
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const labels = useLabels()
  const now = typeof nowProp === 'number' ? new Date(nowProp) : nowProp
  const today = isoDay(now)
  const minutes = now.getHours() * 60 + now.getMinutes()
  const [ownDate, setOwnDate] = useState(() => defaultDate ?? today)
  const [ownView, setOwnView] = useState<CalendarView>(defaultView)
  const date = dateProp ?? ownDate
  const view = viewProp ?? ownView
  const days = useMemo(() => weekDays(date, 0, locale), [date, locale])
  const todayIndex = days.findIndex((d) => d.iso === today)
  const placed = loading ? [] : eventsOn(days, eventsProp)
  const range = copy.range(rangeLabel(days), weekNumber(days[0]!.iso))
  const Sub = `h${headingLevel + 1}` as 'h2' | 'h3' | 'h4'
  const ctx = { calendars, copy, onSelect }

  const goTo = (next: string) => {
    if (dateProp === undefined) setOwnDate(next)
    onDateChange?.(next)
  }
  const step = (weeks: number) => goTo(weekDays(date, weeks, locale)[0]!.iso)
  const setView = (next: CalendarView) => {
    if (viewProp === undefined) setOwnView(next)
    onViewChange?.(next)
  }

  const controls = (
    <>
      <Button variant="outline" size="sm" onClick={() => goTo(today)}>
        {labels.today}
      </Button>
      <div className="flex items-center">
        <Button variant="ghost" size="icon-sm" aria-label={copy.previous} onClick={() => step(-1)}>
          <ChevronLeftIcon className="rtl:-scale-x-100" />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label={copy.next} onClick={() => step(1)}>
          <ChevronRightIcon className="rtl:-scale-x-100" />
        </Button>
      </div>
      <SegmentedControl size="sm" aria-label={copy.viewLabel} value={view} onValueChange={(value) => setView(value as CalendarView)} className="hidden @3xl:flex">
        <SegmentedControlItem value="week">{copy.week}</SegmentedControlItem>
        <SegmentedControlItem value="agenda">{copy.agenda}</SegmentedControlItem>
      </SegmentedControl>
      {actions}
    </>
  )

  const page = (
    <AppPage
      {...rest}
      title={title}
      description={
        <span aria-live="polite" className="tabular-nums">
          {range}
        </span>
      }
      actions={controls}
      headingLevel={headingLevel}
      // Past the page width (80rem of content) a wide screen gets margins, not wider days.
      width={fill ? 'fill' : 'page'}
      className={className}
      classNames={{ header: classNames?.header }}
    >
      <ul aria-label={copy.calendars} className="-mt-1 flex flex-wrap gap-x-4 gap-y-1 text-ui-sm text-fg-muted">
        {calendars.map((c) => (
          <li key={c.id} className="flex items-center gap-1.5">
            <span aria-hidden className={cn('size-2 rounded-full', TONES[c.tone].dot)} />
            {c.name}
          </li>
        ))}
      </ul>
      {error != null ? (
        <Alert variant="danger" className={classNames?.content}>
          <AlertTitle>{copy.errorTitle}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          {onRetry && (
            <AlertAction>
              <Button variant="outline" size="sm" onClick={onRetry}>
                {copy.retry}
              </Button>
            </AlertAction>
          )}
        </Alert>
      ) : !loading && placed.length === 0 && empty !== undefined ? (
        empty
      ) : (
        <div aria-busy={loading || undefined} className={cn('grid grid-cols-1 items-start gap-4 @3xl:gap-5', aside && '@5xl:grid-cols-[minmax(0,1fr)_--spacing(72)]', classNames?.content)}>
          <div className="flex min-w-0 flex-col">
            {view === 'week' && (
              <WeekView
                days={days}
                events={placed}
                ctx={ctx}
                hours={hours}
                today={todayIndex}
                now={todayIndex >= 0 ? minutes : null}
                label={range}
                className="hidden @3xl:block"
              />
            )}
            <AgendaView
              days={days}
              events={placed}
              ctx={ctx}
              loading={loading}
              heading={Sub}
              today={todayIndex}
              now={todayIndex >= 0 ? minutes : null}
              className={cn(view === 'week' && '@3xl:hidden')}
            />
          </div>
          {aside && !loading && (
            <aside aria-label={copy.asideLabel} className="hidden flex-col gap-4 @5xl:flex">
              {todayIndex >= 0 && <UpNext day={days[todayIndex]!} events={placed} ctx={ctx} now={minutes} heading={Sub} />}
              <FindTime days={days} events={placed} places={calendars.length} hours={hours} today={todayIndex} now={todayIndex >= 0 ? minutes : null} copy={copy} heading={Sub} onFindTime={onFindTime} />
            </aside>
          )}
        </div>
      )}
    </AppPage>
  )
  return embedded ? (
    page
  ) : (
    <div className="min-h-dvh bg-canvas text-fg">
      <main>{page}</main>
    </div>
  )
}

export { WeekCalendar }
export type { FreeTime, WeekCalendarProps, CalendarCopy, CalendarEvent, CalendarSource, CalendarTone, CalendarView }
