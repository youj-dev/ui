'use client'

import { createContext, useContext, useEffect, useRef } from 'react'
import type { DayButtonProps } from 'react-day-picker'
import { Hatch } from '../../../components/ui/hatched-bar'
import { Skeleton } from '../../../components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../components/ui/tooltip'
import { cn } from '../../../lib/utils'
import type { MonthAgendaEvent } from './data'
import { EventMark } from './marks'

/* One day of the month as a tile: its number, the marks of what comes round
 * that day (two, then a count) and a dot for the cycle, solid for monthly and
 * a ring for yearly. Today is lit in the accent, the picked day ringed, and
 * days outside the month hatched. A day with events names them after its
 * date and shows them in a tooltip on hover and keyboard focus. While
 * loading, each tile is a skeleton of the same size. */

interface DayInfo {
  /** Holds each tile as a skeleton. */
  loading: boolean
  /** What comes round on this day. */
  eventsOf: (date: Date) => MonthAgendaEvent[]
  /** An event as one line: "Tessel, $54.99 / mo"; `price` is empty when it has no amount. */
  line: (event: MonthAgendaEvent) => { name: string; price: string }
  /** The events as spoken after the date. */
  spoken: (events: MonthAgendaEvent[]) => string
}

const AgendaDays = createContext<DayInfo | null>(null)

/** The cycle's dot: solid for monthly, a ring for yearly. */
function CycleDot({ yearly, className }: { yearly: boolean; className?: string }) {
  return <span aria-hidden className={cn('block size-1.5 shrink-0 rounded-full', yearly ? 'border-[1.5px] border-fg-muted' : 'bg-accent', className)} />
}

function AgendaDay({ day, modifiers, className, children, ...props }: DayButtonProps) {
  const info = useContext(AgendaDays)
  const ref = useRef<HTMLButtonElement>(null)
  // react-day-picker moves focus by marking the day focused; the tile follows.
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])
  const events = info && !modifiers.outside && !info.loading ? info.eventsOf(day.date) : []
  const yearly = events.some((s) => s.cycle === 'yearly')
  const monthly = events.some((s) => s.cycle === 'monthly')
  const label = props['aria-label']
  if (info?.loading && !modifiers.outside) return <Skeleton aria-hidden className="h-12 w-full rounded-md" />
  const tile = (
    <button
      ref={ref}
      type="button"
      {...props}
      aria-label={events.length && info ? `${label}. ${info.spoken(events)}` : label}
      data-yj-today={modifiers.today || undefined}
      data-selected={modifiers.selected || undefined}
      data-yj-outside={modifiers.outside || undefined}
      data-yj-events={events.length || undefined}
      className={cn(
        'relative flex h-12 w-full min-w-0 flex-col items-center justify-between overflow-hidden rounded-md bg-band px-1 pt-1.5 pb-2 text-fg outline-none focus-ring',
        'transition-[background-color,box-shadow] yj-duration-fast ease-standard hover:bg-hover reduced:transition-none',
        'data-yj-today:bg-accent-subtle data-yj-today:shadow-[inset_0_0_0_1px_var(--color-accent-line)]',
        'data-selected:shadow-[inset_0_0_0_1.5px_var(--color-fg)]',
        'data-yj-outside:bg-transparent data-yj-outside:text-fg-subtle',
        className,
      )}
    >
      {modifiers.outside && <Hatch className="absolute inset-0 rounded-none opacity-25" />}
      <span className={cn('relative font-mono text-ui-sm leading-none tabular-nums', modifiers.today ? 'font-medium text-accent-text' : !modifiers.outside && 'text-fg-muted')}>
        {children}
      </span>
      {events.length > 0 && (
        <span aria-hidden className="relative flex items-center gap-0.5">
          {events.slice(0, events.length > 2 ? 1 : 2).map((s) => (
            <EventMark key={s.id} event={s} className="size-4" />
          ))}
          {events.length > 2 && <span className="font-mono text-ui-xs leading-none text-fg-muted">+{events.length - 1}</span>}
        </span>
      )}
      {events.length > 0 && (
        <span aria-hidden className="absolute end-1 top-1 flex gap-0.5">
          {monthly && <CycleDot yearly={false} />}
          {yearly && <CycleDot yearly />}
        </span>
      )}
    </button>
  )
  if (!events.length || !info) return tile
  return (
    <Tooltip>
      <TooltipTrigger delay={150} render={tile} />
      <TooltipContent className="flex-col items-stretch gap-1 py-1.5">
        {events.map((s) => {
          const { name, price } = info.line(s)
          return (
            <span key={s.id} className="flex items-center gap-2">
              <EventMark event={s} className="size-3.5" />
              <span className="flex-1">{name}</span>
              {price && <span className="font-mono font-normal tabular-nums opacity-75">{price}</span>}
            </span>
          )
        })}
      </TooltipContent>
    </Tooltip>
  )
}

export { CycleDot, AgendaDay, AgendaDays, type DayInfo }
