'use client'

import { useId, useMemo } from 'react'
import { useLocale } from '@youj/core'
import { SlotGrid, type SlotGridSlot } from '../../../components/ui/slot-grid'
import { cn } from '../../../lib/utils'
import type { CalendarCopy, Day, PlacedEvent } from './data'

/* "Find a time", beside the week: a Slot Grid of the week's hours one day at
 * a time (its own day picker steps through them), each hour saying how many
 * of the calendars are still free then. An hour with an event on every
 * calendar is hatched, and hours already over today aren't offered. Picking
 * a free hour tells the app (`onFindTime`). */

export interface FreeTime {
  /** The day, as "2026-09-29". */
  date: string
  /** The hour's start, in minutes after midnight. */
  start: number
}

interface FindTimeProps {
  days: Day[]
  events: PlacedEvent[]
  /** How many calendars an hour can be booked on: its places. */
  places: number
  hours: { start: number; end: number }
  /** Today's column, or -1 when this week isn't the current one. */
  today: number
  /** Minutes after midnight, on today's column. */
  now: number | null
  copy: CalendarCopy
  heading: 'h2' | 'h3' | 'h4'
  onFindTime?: (time: FreeTime) => void
  className?: string
}

export function FindTime({ days, events, places, hours, today, now, copy, heading: Heading, onFindTime, className }: FindTimeProps) {
  const locale = useLocale()
  const titleId = useId()
  const rows = useMemo(() => Array.from({ length: hours.end - hours.start }, (_, i) => (hours.start + i) * 60), [hours.start, hours.end])
  const slots = useMemo(() => {
    const out: (SlotGridSlot & { date: string; minute: number })[] = []
    for (const day of days) {
      const [y, m, d] = day.iso.split('-').map(Number)
      for (const minute of rows) {
        if (day.index === today && now !== null && minute + 60 <= now) continue
        const busy = new Set(events.filter((e) => e.day === day.index && e.start < minute + 60 && e.end > minute).map((e) => e.calendar)).size
        out.push({
          id: `${day.iso}:${minute}`,
          start: new Date(y!, m! - 1, d!, Math.floor(minute / 60), minute % 60),
          left: Math.max(0, places - busy),
          capacity: places,
          date: day.iso,
          minute,
        })
      }
    }
    return out
  }, [days, rows, events, places, today, now])
  if (!days[0] || slots.length === 0) return null
  const [y, m, d] = days[0]!.iso.split('-').map(Number)
  return (
    <section aria-labelledby={titleId} className={cn('flex flex-col gap-3 rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line bg-surface p-4 shadow-xs', className)}>
      <div className="flex flex-col gap-0.5">
        <Heading id={titleId} className="text-ui font-semibold text-fg">
          {copy.findTime}
        </Heading>
        <p className="text-ui-sm text-fg-muted">{copy.findTimeHint}</p>
      </div>
      <SlotGrid
        slots={slots}
        start={new Date(y!, m! - 1, d!)}
        days={days.length}
        times={rows}
        layout="day"
        label={copy.findTime}
        locale={locale}
        sound={false}
        onValueChange={(id) => {
          const slot = slots.find((s) => s.id === id)
          if (slot) onFindTime?.({ date: slot.date, start: slot.minute })
        }}
      />
    </section>
  )
}
