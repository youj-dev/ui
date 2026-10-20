'use client'

import type { ElementType } from 'react'
import { CheckIcon } from '@youj/icons'
import { Button, buttonVariants } from '../../../components/ui/button'
import { cn, dateTimeFormat } from '../../../lib/utils'
import type { SupportRequestCopy } from './data'

/* When to expect an answer, and the confirmation once the request is in.
 * The line knows the team's hours and speaks in the requester's own clock:
 * "Online now · replies by 3:45 PM" while the team is working, "Back
 * tomorrow at 9:00 AM · replies by tomorrow at 11:00 AM" once it's gone
 * home, and it moves up as a bug is marked as blocking work. */

/** An instant as the line says it, from where the requester is: "3:45 PM", "tomorrow at 9:00 AM", "Monday at 10:00 AM". */
export function spoken(at: Date, now: Date, locale: string, copy: SupportRequestCopy) {
  const time = dateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(at)
  const midnight = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const days = Math.round((midnight(at) - midnight(now)) / 86_400_000)
  if (days <= 0) return time
  const day =
    days === 1
      ? new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(1, 'day')
      : dateTimeFormat(locale, days < 7 ? { weekday: 'long' } : { month: 'long', day: 'numeric' }).format(at)
  return copy.dayAt(day, time)
}

export function ReplyLine({ open, back, by, copy }: { open: boolean; back: string; by: string; copy: SupportRequestCopy }) {
  return (
    <p className="flex items-center gap-2 text-ui-sm text-fg-muted">
      <span aria-hidden className={cn('size-2 shrink-0 rounded-full', open ? 'bg-success' : 'border border-fg-subtle')} />
      {open ? copy.online(by) : copy.away(back, by)}
    </p>
  )
}

interface DoneProps {
  id: string | undefined
  email: string
  by: string
  heading: 'h2' | 'h3'
  copy: SupportRequestCopy
  requestsHref?: string
  linkComponent: ElementType
  onAnother: () => void
}

export function Done({ id, email, by, heading: Heading, copy, requestsHref, linkComponent: Link, onAnother }: DoneProps) {
  return (
    <div className="flex flex-col items-start gap-4 px-(--ui--panel-x) py-(--ui--panel-y)">
      <span className="grid size-10 place-items-center rounded-full bg-success-subtle text-success-text">
        <CheckIcon size={20} strokeWidth={2.25} trigger="mount" />
      </span>
      <div className="flex flex-col gap-1.5">
        <Heading data-yj-done-heading tabIndex={-1} className="text-xl leading-snug font-semibold tracking-tight text-pretty text-fg outline-none">
          {copy.doneTitle(id)}
        </Heading>
        <p className="max-w-md text-ui text-pretty text-fg-muted">{copy.doneDescription(email, by)}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {requestsHref && (
          <Link href={requestsHref} className={buttonVariants({ variant: 'secondary' })}>
            {copy.requests}
          </Link>
        )}
        <Button variant="ghost" onClick={onAnother}>
          {copy.another}
        </Button>
      </div>
    </div>
  )
}
