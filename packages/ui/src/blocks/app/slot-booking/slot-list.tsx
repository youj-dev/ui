'use client'

import { useId } from 'react'
import { Stagger } from '@youj/motion'
import { CheckIcon, ChevronRightIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { cn, dateTimeFormat } from '../../../lib/utils'
import type { SlotBookingCopy, SlotBookingService, SlotBookingSlot } from './data'

/** One ink per service, so a slot keeps its color from day to day. */
const TONES = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5']

interface SlotListProps {
  /** The day shown, local midnight. */
  day: number
  slots: SlotBookingSlot[]
  services: SlotBookingService[]
  copy: SlotBookingCopy
  /** The heading level under the block's title. */
  level: 'h2' | 'h3'
  /** The slot last picked, drawn as chosen when you come back from its review. */
  picked: string | null
  onPick: (id: string) => void
  /** The next day with a slot for this filter, offered when this one has none. */
  next?: number
  onNext: (day: number) => void
  /** Name of the service filter when it isn't "all", for the empty state. */
  serviceName?: string
}

/** The chosen day's timetable: a quiet heading, then one row a slot (time and length, service and host, places left). */
function SlotList({ day, slots, services, copy, level: Heading, picked, onPick, next, onNext, serviceName }: SlotListProps) {
  const weekday = dateTimeFormat(copy.locale, { weekday: 'long' }).format(day)
  const date = dateTimeFormat(copy.locale, { day: 'numeric', month: 'long' }).format(day)
  const time = dateTimeFormat(copy.locale, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
  const nextDay = next === undefined ? '' : dateTimeFormat(copy.locale, { weekday: 'short', day: 'numeric', month: 'short' }).format(next)
  const headingId = useId()

  return (
    <section aria-labelledby={headingId} className="flex min-w-0 flex-col gap-3">
      <div className="flex items-end justify-between gap-3 border-b border-line pb-4">
        <Heading id={headingId} className="flex flex-col gap-0.5">
          <span className="text-ui-sm text-fg-muted">{weekday}</span>{' '}
          <span className="text-2xl leading-tight font-semibold tracking-tight text-fg">{date}</span>
        </Heading>
        {slots.length > 0 && <span dir="auto" className="pb-1 text-ui-sm text-fg-muted tabular-nums">{copy.slotCount(slots.length)}</span>}
      </div>

      {slots.length === 0 ? (
        <div className="flex flex-col items-start gap-3 py-6">
          <p className="text-ui text-fg-muted">{serviceName ? copy.noneOfService(serviceName) : copy.closed}</p>
          {next !== undefined && (
            <Button variant="outline" size="sm" onClick={() => onNext(next)}>
              {copy.nextOne(nextDay)}
              <ChevronRightIcon trigger="none" size={14} className="rtl:-scale-x-100" />
            </Button>
          )}
        </div>
      ) : (
        <Stagger key={`${day}-${serviceName}`} as="ul" itemAs="li" inView={false} step="tight" aria-label={copy.slotsOn(`${weekday}, ${date}`)} className="-mx-3 flex flex-col gap-0.5">
          {slots.map((c) => {
            const index = services.findIndex((s) => s.id === c.service)
            const service = services[index]!
            const full = c.left === 0 && !c.mine
            const few = !full && !c.mine && c.left <= 2 && c.capacity > 2
            const places = c.mine ? copy.yours : full ? copy.full : few ? copy.fewLeft(c.left) : copy.placesOpen(c.left)
            const start = time.format(c.start)
            return (
              <button
                key={c.id}
                type="button"
                data-slot-pick={c.id}
                data-picked={picked === c.id || undefined}
                disabled={full || c.mine}
                onClick={() => onPick(c.id)}
                aria-label={`${start}, ${service.name}, ${copy.with(service.host.name)}, ${places}`}
                className={cn(
                  'group/slot grid w-full grid-cols-[--spacing(15)_minmax(0,1fr)_auto] items-center gap-x-4 rounded-lg px-3 py-3 text-start focus-ring',
                  'transition-colors yj-duration-fast ease-standard hover:bg-hover',
                  'data-picked:bg-accent-subtle disabled:hover:bg-transparent',
                )}
              >
                <span className={cn('flex flex-col', full && 'opacity-50')}>
                  <span className="text-ui-lg leading-tight font-medium text-fg tabular-nums">{start}</span>
                  <span className="text-ui-xs text-fg-muted tabular-nums [unicode-bidi:plaintext]">
                    {service.minutes} {copy.minutes}
                  </span>
                </span>
                <span className={cn('flex min-w-0 items-center gap-3', full && 'opacity-50')}>
                  <span aria-hidden className={cn('h-8 w-0.5 shrink-0 rounded-full opacity-80', TONES[index % TONES.length])} />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-ui font-medium text-fg">{service.name}</span>
                    <span className="truncate text-ui-sm text-fg-muted">{copy.with(service.host.name)}</span>
                  </span>
                </span>
                <span
                  className={cn(
                    'flex items-center gap-1.5 text-ui-sm whitespace-nowrap',
                    c.mine ? 'font-medium text-success-text' : few ? 'text-warning-text' : 'text-fg-muted',
                  )}
                >
                  {c.mine && <CheckIcon size={14} strokeWidth={2.25} />}
                  <span dir="auto">{places}</span>
                  {/* Held still and kept in the layout (hidden where there's nothing to pick), so every row's words end on one line. */}
                  <ChevronRightIcon
                    trigger="none"
                    size={14}
                    className={cn(
                      '-me-1 text-fg-muted opacity-0 transition-opacity yj-duration-fast ease-standard group-hover/slot:opacity-100 group-focus-visible/slot:opacity-100 max-sm:hidden rtl:-scale-x-100',
                      (full || c.mine) && 'invisible',
                    )}
                  />
                </span>
              </button>
            )
          })}
        </Stagger>
      )}
    </section>
  )
}

export { SlotList }
