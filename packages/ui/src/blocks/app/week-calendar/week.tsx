'use client'

import { useLabels } from '@youj/core'
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from '../../../components/ui/avatar'
import { cn, initials } from '../../../lib/utils'
import { clock, TONES, type Day, type PlacedEvent } from './data'
import { EventButton, sourceOf, type CalendarContext } from './event'

/* The week as a time grid: a gutter of hours (`hours`, 08:00 to 18:00 by default) on hairlines,
 * five day columns, and each event placed by its start and end as a tinted
 * block with an accent on its start edge: its title, its times and, when it
 * has the room, where it is and who's coming as overlapping avatars (the
 * button's name already says it all, so they're decoration). Events that
 * overlap split their column. Today's column is washed faintly and a line
 * marks now; the text of events already over is dimmed. */


/** Side-by-side lanes for events that overlap: each gets its lane and how many share its cluster. */
function lanes(events: PlacedEvent[]) {
  const placed: { event: PlacedEvent; lane: number; of: number }[] = []
  let cluster: typeof placed = []
  let ends: number[] = []
  let clusterEnd = -1
  const close = () => {
    for (const p of cluster) p.of = ends.length
    cluster = []
    ends = []
  }
  for (const event of [...events].sort((a, b) => a.start - b.start || b.end - a.end)) {
    if (event.start >= clusterEnd) close()
    let lane = ends.findIndex((end) => end <= event.start)
    if (lane === -1) lane = ends.push(event.end) - 1
    else ends[lane] = event.end
    const p = { event, lane, of: 1 }
    cluster.push(p)
    placed.push(p)
    clusterEnd = Math.max(clusterEnd, event.end)
  }
  close()
  return placed
}

interface WeekViewProps {
  days: Day[]
  events: PlacedEvent[]
  ctx: CalendarContext
  /** The grid's first and last hour. */
  hours: { start: number; end: number }
  /** Today's column, or -1 when this week isn't the current one. */
  today: number
  /** Minutes after midnight, on today's column. */
  now: number | null
  label: string
  className?: string
}

export function WeekView({ days, events, ctx, hours, today, now, label, className }: WeekViewProps) {
  const labels = useLabels()
  const DAY_START = hours.start * 60
  const DAY_END = hours.end * 60
  const HOURS = hours.end - hours.start
  const pct = (minutes: number) => `${((Math.min(DAY_END, Math.max(DAY_START, minutes)) - DAY_START) / (DAY_END - DAY_START)) * 100}%`
  const cols = 'grid grid-cols-[--spacing(14)_repeat(5,minmax(0,1fr))]'
  const past = (event: PlacedEvent) => today >= 0 && now !== null && (event.day < today || (event.day === today && event.end <= now))
  return (
    <div role="group" aria-label={label} className={cn('overflow-hidden rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line bg-surface shadow-xs', className)}>
      <div className={cn(cols, 'border-b border-line')}>
        <div />
        {days.map((d) => (
          <div key={d.index} className={cn('flex items-baseline gap-2 border-s border-line px-3 py-2.5', d.index === today && 'bg-[color-mix(in_oklab,var(--color-accent)_7%,transparent)]')}>
            <span className="text-ui-sm text-fg-muted">{d.weekday.slice(0, 3)}</span>
            <span
              className={cn(
                'text-ui-lg leading-6 font-semibold tabular-nums',
                d.index === today ? 'rounded-sm bg-accent px-1.5 text-on-accent' : 'text-fg',
              )}
            >
              {d.date}
            </span>
            {d.index === today && <span className="sr-only">, {labels.today}</span>}
          </div>
        ))}
      </div>
      <div className={cn(cols, 'relative h-160')}>
        <div aria-hidden className="pointer-events-none absolute inset-y-0 start-14 end-0">
          {Array.from({ length: HOURS - 1 }, (_, i) => (
            <span key={i} style={{ top: `${((i + 1) / HOURS) * 100}%` }} className="absolute inset-x-0 border-t-[1px] border-line" />
          ))}
        </div>
        <div aria-hidden className="relative">
          {Array.from({ length: HOURS }, (_, i) => (
            <span
              key={i}
              style={{ top: `${(i / HOURS) * 100}%` }}
              className={cn('absolute end-2 text-ui-xs text-fg-muted tabular-nums', i === 0 ? 'mt-1' : '-translate-y-1/2')}
            >
              {clock(DAY_START + i * 60)}
            </span>
          ))}
          {now !== null && today >= 0 && now >= DAY_START && now <= DAY_END && (
            <span style={{ top: pct(now) }} className="absolute end-1.5 -translate-y-1/2 bg-surface px-0.5 text-ui-xs font-medium text-danger-text tabular-nums">
              {clock(now)}
            </span>
          )}
        </div>
        {days.map((d) => (
          <div key={d.index} className={cn('relative border-s border-line', d.index === today && 'bg-[color-mix(in_oklab,var(--color-accent)_7%,transparent)]')}>
            {lanes(events.filter((e) => e.day === d.index)).map(({ event, lane, of }) => {
              const short = event.end - event.start < 45
              // Who's coming, when the block has the room; where it is takes their place otherwise.
              const faces = event.end - event.start >= 60 && of === 1 && Boolean(event.people?.length)
              return (
                <EventButton
                  key={event.id}
                  event={event}
                  day={d}
                  ctx={ctx}
                  side="inline-end"
                  style={{
                    top: pct(event.start),
                    height: `calc(${pct(event.end)} - ${pct(event.start)} - 2px)`,
                    insetInlineStart: `calc(${(lane / of) * 100}% + 3px)`,
                    width: `calc(${100 / of}% - 6px)`,
                  }}
                  className={cn(
                    'absolute flex flex-col overflow-hidden rounded-md border px-2 text-start',
                    'transition-[background-color] yj-duration-fast ease-standard',
                    short ? 'justify-center py-0' : 'py-1',
                    TONES[sourceOf(ctx, event).tone].block,
                    past(event) && '*:opacity-90',
                  )}
                >
                  <span className="truncate text-ui-sm font-medium text-fg">{event.title}</span>{' '}
                  {!short && (
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="min-w-0 flex-1 truncate text-ui-xs text-fg-muted tabular-nums">
                        {clock(event.start)} – {clock(event.end)}
                        {event.location && of === 1 && !faces && ` · ${event.location}`}
                      </span>
                      {faces ? (
                        <AvatarGroup aria-hidden className="shrink-0 -space-x-1 *:data-[slot=avatar]:ring-surface">
                          {event.people!.slice(0, 3).map((name) => (
                            <Avatar key={name} size="sm">
                              <AvatarFallback>{initials(name)}</AvatarFallback>
                            </Avatar>
                          ))}
                          {event.people!.length > 3 && <AvatarGroupCount>+{event.people!.length - 3}</AvatarGroupCount>}
                        </AvatarGroup>
                      ) : null}
                    </span>
                  )}
                </EventButton>
              )
            })}
            {d.index === today && now !== null && now >= DAY_START && now <= DAY_END && (
              <div aria-hidden style={{ top: pct(now) }} className="pointer-events-none absolute inset-x-0 z-10 -translate-y-1/2">
                <div className="h-0.5 bg-danger" />
                <span className="absolute -start-1 top-1/2 size-2 -translate-y-1/2 rounded-full bg-danger" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
