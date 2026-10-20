'use client'

import { useMemo, type ReactNode } from 'react'
import { dateTimeFormat } from '../../../lib/utils'

/* The booked time as a ticket stub: the date on a block of its own in the
 * accent, the time in full and who it's with beside it, and room at the end
 * (Change time, on the details step). */

const VOICE = 'font-(family-name:--yj-label-font) tracking-(--yj-label-tracking) [text-transform:var(--yj-label-case)]'

interface TicketProps {
  start: Date | number
  /** The time in full, or the confirmation's heading. */
  title: ReactNode
  line?: ReactNode
  end?: ReactNode
  locale: string
}

export function Ticket({ start, title, line, end, locale }: TicketProps) {
  const format = useMemo(() => ({ month: dateTimeFormat(locale, { month: 'short' }), date: dateTimeFormat(locale, { day: 'numeric' }) }), [locale])
  const date = new Date(start)
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line p-2 pe-3">
      <span aria-hidden className="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg bg-accent text-on-accent">
        <span className={`text-ui-xs leading-none ${VOICE}`}>{format.month.format(date)}</span>
        <span className="text-ui-lg leading-tight font-semibold tabular-nums">{format.date.format(date)}</span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        {title}
        {line && <span className="text-pretty text-ui-sm text-fg-muted">{line}</span>}
      </span>
      {end}
    </div>
  )
}
