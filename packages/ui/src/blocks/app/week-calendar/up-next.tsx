'use client'

import { useId } from 'react'
import { Avatar, AvatarFallback, AvatarGroup } from '../../../components/ui/avatar'
import { cn, initials } from '../../../lib/utils'
import { clock, TONES, type Day, type PlacedEvent } from './data'
import { EventButton, sourceOf, type CalendarContext } from './event'

/* Up next, beside the week: what's left of today on a rail, each event a dot
 * in its calendar's tone, the one under way marked Now and the rest counting
 * down from `now` ("in 18 min"). Each is the same button as in the grid, so
 * it opens the same details. */

interface UpNextProps {
  day: Day
  events: PlacedEvent[]
  ctx: CalendarContext
  /** Minutes after midnight. */
  now: number
  heading: 'h2' | 'h3' | 'h4'
}

export function UpNext({ day, events, ctx, now, heading: Heading }: UpNextProps) {
  const titleId = useId()
  const { copy } = ctx
  const left = events.filter((e) => e.day === day.index && e.end > now).sort((a, b) => a.start - b.start)
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-3 rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line bg-surface p-4 shadow-xs">
      <Heading id={titleId} className="text-ui font-semibold text-fg">
        {copy.upNext}
      </Heading>
      {left.length === 0 ? (
        <p className="text-ui-sm text-fg-muted">{copy.dayDone}</p>
      ) : (
        <ol className="relative flex flex-col gap-1 before:absolute before:inset-y-2 before:start-1.5 before:w-px before:bg-line">
          {left.map((event) => {
            const live = event.start <= now
            const tone = TONES[sourceOf(ctx, event).tone]
            return (
              <li key={event.id} className="relative ps-5">
                <span aria-hidden className={cn('absolute start-0 top-3 size-3 rounded-full ring-4 ring-surface', tone.dot, !live && 'opacity-70')} />
                <EventButton
                  event={event}
                  day={day}
                  ctx={ctx}
                  side="inline-end"
                  className="flex w-full flex-col gap-1 rounded-md px-2 py-1.5 text-start transition-colors yj-duration-fast ease-standard hover:bg-band"
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-ui-sm font-medium text-fg">{event.title}</span>{' '}
                    <span className={cn('shrink-0 text-ui-xs tabular-nums', live ? 'font-medium text-danger-text' : 'text-fg-muted')}>{live ? copy.now : copy.startsIn(event.start - now)}</span>
                  </span>{' '}
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-ui-xs text-fg-muted tabular-nums">
                      {clock(event.start)} – {clock(event.end)}
                      {event.location && ` · ${event.location}`}
                    </span>
                    {event.people?.length ? (
                      <AvatarGroup aria-hidden className="shrink-0 -space-x-1 *:data-[slot=avatar]:ring-surface">
                        {event.people.slice(0, 3).map((name) => (
                          <Avatar key={name} size="sm">
                            <AvatarFallback>{initials(name)}</AvatarFallback>
                          </Avatar>
                        ))}
                      </AvatarGroup>
                    ) : null}
                  </span>
                </EventButton>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
