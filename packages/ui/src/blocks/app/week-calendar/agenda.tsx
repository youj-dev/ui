'use client'

import { useId } from 'react'
import { useLabels } from '@youj/core'
import { Badge } from '../../../components/ui/badge'
import { Skeleton } from '../../../components/ui/skeleton'
import { cn } from '../../../lib/utils'
import { clock, TONES, type Day, type PlacedEvent } from './data'
import { EventButton, sourceOf, type CalendarContext } from './event'

/* The week as a list: each day under its own heading, its events in time
 * order with the calendar's accent on their start edge; those already over
 * are dimmed. The only view on a narrow page. Loading holds each day's
 * place with a skeleton row. */

interface AgendaViewProps {
  days: Day[]
  events: PlacedEvent[]
  ctx: CalendarContext
  loading: boolean
  heading: 'h2' | 'h3' | 'h4'
  today: number
  now: number | null
  className?: string
}

export function AgendaView({ days, events, ctx, loading, heading, today, now, className }: AgendaViewProps) {
  return (
    <div className={cn('flex flex-col gap-5', className)}>
      {days.map((d) => (
        <AgendaDay
          key={d.index}
          day={d}
          ctx={ctx}
          loading={loading}
          heading={heading}
          today={d.index === today}
          past={(e) => today >= 0 && now !== null && (e.day < today || (e.day === today && e.end <= now))}
          events={events.filter((e) => e.day === d.index).sort((a, b) => a.start - b.start)}
        />
      ))}
    </div>
  )
}

interface AgendaDayProps {
  day: Day
  ctx: CalendarContext
  loading: boolean
  heading: 'h2' | 'h3' | 'h4'
  today: boolean
  past: (event: PlacedEvent) => boolean
  events: PlacedEvent[]
}

function AgendaDay({ day, ctx, loading, heading: Heading, today, past, events }: AgendaDayProps) {
  const labels = useLabels()
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2">
      <Heading id={headingId} className="flex items-center gap-2 text-ui font-semibold text-fg">
        {day.weekday}{' '}
        <span className="font-normal text-fg-muted">
          {day.date} {day.month}
        </span>
        {today && <Badge>{labels.today}</Badge>}
      </Heading>
      {loading ? (
        <Skeleton aria-hidden className="h-13 w-full rounded-xl" />
      ) : events.length > 0 ? (
        <ul className="flex flex-col divide-y divide-line overflow-hidden rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line bg-surface shadow-xs">
          {events.map((event) => (
            <li key={event.id}>
              <EventButton
                event={event}
                day={day}
                ctx={ctx}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-2.5 text-start transition-[background-color] yj-duration-fast ease-standard -outline-offset-2 hover:bg-hover',
                  past(event) && '*:opacity-90',
                )}
              >
                <span className="w-24 shrink-0 text-ui-sm text-fg-muted tabular-nums">
                  {clock(event.start)} – {clock(event.end)}
                </span>{' '}
                <span aria-hidden className={cn('h-8 w-0.5 shrink-0 rounded-full', TONES[sourceOf(ctx, event).tone].dot)} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-ui font-medium text-fg">{event.title}</span>{' '}
                  <span className="truncate text-ui-sm text-fg-muted">
                    {[sourceOf(ctx, event).name, event.location].filter(Boolean).join(' · ')}
                  </span>
                </span>
              </EventButton>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-line px-4 py-3 text-ui-sm text-fg-muted">{labels.noItems('events')}</p>
      )}
    </section>
  )
}
