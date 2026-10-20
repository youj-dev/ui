'use client'

import { BuildingIcon, CheckIcon } from '@youj/icons'
import { Badge, BadgeDot } from '../../../components/ui/badge'
import { cn } from '../../../lib/utils'
import { CodeChip } from './code-chip'
import type { ItineraryBooking, ItineraryBookingKind, ItineraryBookingStatus, ItineraryCopy } from './data'

const BADGE = { accent: 'default', success: 'success', warning: 'warning', danger: 'danger' } as const

interface DayPlansProps {
  /** "Thursday, 1 October". */
  date: string
  /** Where the day is spent. */
  place?: string
  /** Where you sleep that night: "Casa Bonay · night 2 of 3". */
  tonight?: string
  bookings: ItineraryBooking[]
  kinds: ItineraryBookingKind[]
  statuses: ItineraryBookingStatus[]
  copy: ItineraryCopy
  heading: 'h2' | 'h3'
  onCopied: (code: string) => void
}

/** A day of the trip: its date and city, where you sleep, and its bookings in time order on a quiet thread, each with its reference to copy. */
export function DayPlans({ date, place, tonight, bookings, kinds, statuses, copy, heading: Heading, onCopied }: DayPlansProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <Heading className="text-ui-lg font-medium text-fg">
          {date}
          {place && <span className="font-normal text-fg-muted"> · {place}</span>}
        </Heading>
        {tonight && (
          <p className="flex items-center gap-1.5 text-ui-sm text-fg-muted">
            <BuildingIcon size={13} className="shrink-0" />
            {tonight}
          </p>
        )}
      </div>
      {bookings.length ? (
        <ol className="flex flex-col">
          {bookings.map((b, i) => {
            const kind = kinds.find((k) => k.id === b.kind)
            const status = statuses.find((st) => st.id === b.status)
            const done = !!status?.done
            const Icon = done ? CheckIcon : kind?.icon
            const badge = status?.tone && BADGE[status.tone]
            const last = i === bookings.length - 1
            return (
              <li
                key={b.id}
                data-slot="itinerary-plan"
                data-status={b.status}
                className={cn('relative grid grid-cols-[--spacing(13)_--spacing(8)_minmax(0,1fr)] gap-x-3 gap-y-2 sm:grid-cols-[--spacing(13)_--spacing(8)_minmax(0,1fr)_auto]', !last && 'pb-5')}
              >
                <span className={cn('pt-1.5 font-mono text-ui tabular-nums', done ? 'text-fg-muted' : 'text-fg')}>{b.time}</span>
                <span aria-hidden className={cn('grid size-8 place-items-center rounded-full bg-band', done ? 'text-fg-subtle' : 'text-fg')}>
                  {Icon && <Icon size={14} />}
                </span>
                {!last && <span aria-hidden className="absolute start-[calc(--spacing(13)+--spacing(3)+--spacing(4)-0.5px)] top-9 bottom-1 w-px bg-line" />}
                <span className="flex min-w-0 flex-col gap-0.5 pt-0.5">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    {kind && <span className="sr-only">{kind.label}</span>}
                    <span className={cn('text-ui-lg', done ? 'text-fg-muted' : 'text-fg')}>{b.title}</span>
                    {badge ? (
                      <Badge variant={badge}>
                        <BadgeDot />
                        {status?.label}
                      </Badge>
                    ) : (
                      status && <span className="sr-only">{status.label}</span>
                    )}
                  </span>
                  <span className="text-ui-sm text-fg-muted">{b.detail}</span>
                </span>
                <CodeChip code={b.code} copy={copy} onCopied={onCopied} className="col-start-3 justify-self-start sm:col-start-4 sm:row-start-1" />
              </li>
            )
          })}
        </ol>
      ) : (
        <p className="rounded-xl border border-dashed border-line py-6 text-center text-ui text-fg-muted">{copy.nothing}</p>
      )}
    </div>
  )
}
