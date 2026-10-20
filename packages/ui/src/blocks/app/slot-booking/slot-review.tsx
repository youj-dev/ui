'use client'

import { useEffect, useRef } from 'react'
import { CalendarPlusIcon, CheckIcon } from '@youj/icons'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Button } from '../../../components/ui/button'
import { AsyncButton } from '../../../components/ui/async-button'
import { Eyebrow } from '../../../components/ui/typography'
import type { SlotBookingCopy, SlotBookingPass, SlotBookingService, SlotBookingSlot } from './data'
import { dateTimeFormat } from '../../../lib/utils'

interface SlotReviewProps {
  slot: SlotBookingSlot
  service: SlotBookingService
  copy: SlotBookingCopy
  level: 'h2' | 'h3'
  /** After booking: the confirmation in place of the review. */
  booked: boolean
  /** Null when the booking draws on no pass. */
  pass: SlotBookingPass | null
  formatPrice: (price: number) => string
  onBook: () => Promise<unknown>
  /** Book's button settled on success: move on to the confirmation. */
  onBooked: () => void
  onChange: () => void
  onAnother: () => void
}

/** The calm last step: what, when and with whom, the few facts that decide it, and Change / Book; then the confirmation. */
function SlotReview({ slot, service, copy, level: Heading, booked, pass, formatPrice, onBook, onBooked, onChange, onAnother }: SlotReviewProps) {
  const heading = useRef<HTMLHeadingElement>(null)
  const time = dateTimeFormat(copy.locale, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
  const day = dateTimeFormat(copy.locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(slot.start)
  const start = time.format(slot.start)
  const end = time.format(+slot.start + service.minutes * 60_000)

  // Each step takes focus on arrival, so a keyboard or screen reader lands on what changed.
  useEffect(() => heading.current?.focus({ preventScroll: false }), [booked])

  if (booked)
    return (
      <section aria-labelledby={`${slot.id}-booked`} className="flex flex-col items-center gap-5 py-8 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-success-subtle text-success-text">
          <CheckIcon trigger="mount" size={26} strokeWidth={2.25} />
        </span>
        <div className="flex max-w-sm flex-col gap-2">
          <Heading ref={heading} id={`${slot.id}-booked`} tabIndex={-1} className="text-2xl font-semibold tracking-tight text-fg outline-none">
            {copy.bookedTitle}
          </Heading>
          <p className="text-ui text-fg-muted text-pretty">
            {copy.bookedLine(`${service.name} ${copy.with(service.host.name)}`, `${day}, ${start}`)} {copy.bookedNote(copy.email)}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="secondary" onClick={onAnother}>
            {copy.bookAnother}
          </Button>
          <Button>
            <CalendarPlusIcon size={16} />
            {copy.addToCalendar}
          </Button>
        </div>
      </section>
    )

  const facts = [
    [copy.duration, `${service.minutes} ${copy.minutes}`],
    ...(service.price === undefined ? [] : [[copy.price, formatPrice(service.price)]]),
    [copy.places, copy.placesOpen(slot.left)],
    ...(pass ? [[copy.pass, copy.passLeft(pass.left, pass.total)]] : []),
  ]

  return (
    <section aria-labelledby={`${slot.id}-review`} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Eyebrow>{copy.review}</Eyebrow>
        <Heading ref={heading} id={`${slot.id}-review`} tabIndex={-1} className="text-2xl leading-tight font-semibold tracking-tight text-fg outline-none">
          {service.name}
        </Heading>
        <p className="text-ui-lg text-fg">
          {day}
          <span className="text-fg-muted"> · </span>
          <span className="tabular-nums [unicode-bidi:plaintext]">
            {start}–{end}
          </span>
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Avatar size="lg">
          <AvatarFallback className="bg-accent-subtle text-accent">{service.host.initials}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-ui font-medium text-fg">{service.host.name}</span>
          <span className="truncate text-ui-sm text-fg-muted">{service.host.role}</span>
        </div>
      </div>

      <dl className="flex flex-col border-y border-line">
        {facts.map(([term, value]) => (
          <div key={term} className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 last:border-b-0">
            <dt className="text-ui-sm text-fg-muted">{term}</dt>
            <dd dir="auto" className="text-ui text-fg tabular-nums">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="secondary" onClick={onChange}>
          {copy.change}
        </Button>
        <AsyncButton onAction={onBook} onActionStateChange={(s) => s === 'success' && onBooked()} pendingLabel={copy.booking} successLabel={copy.booked}>
          {service.price === undefined ? copy.book : `${copy.book} · ${formatPrice(service.price)}`}
        </AsyncButton>
      </div>
    </section>
  )
}

export { SlotReview }
