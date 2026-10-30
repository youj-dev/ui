'use client'

import type { CSSProperties, ReactNode } from 'react'
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from '../../../components/ui/popover'
import { cn } from '../../../lib/utils'
import { clock, TONES, type CalendarCopy, type CalendarSource, type Day, type PlacedEvent } from './data'
import { Eyebrow } from '../../../components/ui/typography'

/* An event as a button that opens its details in a popover (it grows from
 * the event with motion's yj-pop). The button's name says it all, so it
 * reads the same in the week grid and the agenda: "Design review, Tuesday
 * 29 September, 10:00 to 11:00, Team". Opening it tells the page's
 * `onSelect`. */

/** What the week and agenda views share: the calendars, the strings and the page's `onSelect`. */
export interface CalendarContext {
  calendars: CalendarSource[]
  copy: CalendarCopy
  onSelect?: (event: PlacedEvent) => void
}

const FALLBACK: CalendarSource = { id: '', name: '', tone: 'primary' }
export const sourceOf = (ctx: CalendarContext, event: PlacedEvent) => ctx.calendars.find((c) => c.id === event.calendar) ?? { ...FALLBACK, name: event.calendar }

interface EventButtonProps {
  event: PlacedEvent
  day: Day
  ctx: CalendarContext
  side?: 'bottom' | 'inline-end'
  className?: string
  style?: CSSProperties
  children: ReactNode
}

export function EventButton({ event, day, ctx, side = 'bottom', className, style, children }: EventButtonProps) {
  const calendar = sourceOf(ctx, event)
  const { copy } = ctx
  return (
    <Popover onOpenChange={(open) => open && ctx.onSelect?.(event)}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn('focus-ring', className)}
            style={style}
          />
        }
      >
        {children}
        {/* The button is named by what it shows; the day and the calendar follow. */}
        <span className="sr-only">, {copy.eventContext(day.name, calendar.name)}</span>
      </PopoverTrigger>
      <PopoverContent side={side} align="start" className="w-72">
        <PopoverHeader>
          <PopoverTitle>{event.title}</PopoverTitle>
          <PopoverDescription className="tabular-nums">
            {day.name} · {clock(event.start)} – {clock(event.end)}
          </PopoverDescription>
        </PopoverHeader>
        <dl className="grid grid-cols-[--spacing(18)_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-ui">
          <Eyebrow render={<dt />} className="text-ui text-fg-muted">
            {copy.calendar}
          </Eyebrow>
          <dd className="flex items-center gap-2 text-fg">
            <span aria-hidden className={cn('size-2 rounded-full', TONES[calendar.tone].dot)} />
            {calendar.name}
          </dd>
          {event.location && (
            <>
              <Eyebrow render={<dt />} className="text-ui text-fg-muted">
                {copy.where}
              </Eyebrow>
              <dd className="text-fg">{event.location}</dd>
            </>
          )}
          {event.people && (
            <>
              <Eyebrow render={<dt />} className="text-ui text-fg-muted">
                {copy.with}
              </Eyebrow>
              <dd className="text-fg">{event.people.join(', ')}</dd>
            </>
          )}
          {event.recurring && (
            <>
              <Eyebrow render={<dt />} className="text-ui text-fg-muted">
                {copy.repeats}
              </Eyebrow>
              <dd className="text-fg">{copy.every(day.weekday)}</dd>
            </>
          )}
        </dl>
      </PopoverContent>
    </Popover>
  )
}
