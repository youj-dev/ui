'use client'

import { m } from 'motion/react'
import { MotionFeatures, useYouj } from '@youj/core'
import { CalendarPlusIcon, CheckCircleIcon } from '@youj/icons'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Badge, BadgeDot } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { AsyncButton } from '../../../components/ui/async-button'
import { SegmentedMeter } from '../../../components/ui/segmented-meter'
import type { SlotGridSlot } from '../../../components/ui/slot-grid'
import { Eyebrow } from '../../../components/ui/typography'
import type { SlotBookingCopy, SlotBookingPass, SlotBookingService } from './data'
import { dateTimeFormat, numberFormat } from '../../../lib/utils'

interface ConfirmWellProps {
  service: SlotBookingService
  slot?: SlotGridSlot
  /** The slot just booked, while its confirmation shows. */
  booked?: SlotGridSlot
  /** Null when the booking draws on no pass. */
  pass: SlotBookingPass | null
  formatPrice: (price: number) => string
  copy: SlotBookingCopy
  onBook: () => Promise<unknown> | unknown
  onChange: () => void
  onAnother: () => void
}

const WELL = 'bg-[color-mix(in_oklab,var(--color-canvas)_calc(45%*var(--yj-dark)),color-mix(in_oklab,var(--color-fg)_3%,transparent))]'

/** The picked slot, springing into a well: who hosts it, when, how long, what it costs, the pass it draws on, and Book / Change. */
function ConfirmWell({ service, slot, booked, pass, formatPrice, copy, onBook, onChange, onAnother }: ConfirmWellProps) {
  const k = useYouj()
  const date = dateTimeFormat(copy.locale, { weekday: 'short', day: 'numeric', month: 'short' })
  const time = dateTimeFormat(copy.locale, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
  const shown = booked ?? slot
  const end = shown && +shown.start + service.minutes * 60_000
  const enter = k.reduced ? false : { opacity: 0, y: 10, scale: 0.985 }

  return (
    <MotionFeatures features="max">
      <m.div layout={!k.reduced} transition={k.spring('snappy')} data-slot="booking-confirm" className={`overflow-hidden rounded-xl ${WELL}`}>
        {!shown ? (
          <m.p key="empty" layout="position" className="px-4 py-5 text-ui-lg text-fg-muted sm:px-5">
            {copy.pickPrompt}
          </m.p>
        ) : (
          <m.div
            key={`${booked ? 'booked' : 'pick'}-${shown.id}`}
            layout="position"
            initial={enter}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={k.reduced ? { type: false } : k.spring(booked ? 'settle' : 'snappy')}
            className="flex flex-col gap-5 p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <Avatar size="lg">
                <AvatarFallback className="bg-[color-mix(in_oklab,var(--color-chart-3)_24%,transparent)] font-mono text-fg">{service.host.initials}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-44 flex-1 flex-col">
                <span className="truncate text-ui-lg font-medium text-fg">{booked ? copy.bookedTitle : service.name}</span>
                <span className="truncate text-ui-sm text-fg-muted">
                  {booked ? copy.bookedNote(copy.email) : `${copy.with(service.host.name)} · ${service.host.role}`}
                </span>
              </div>
              <div className="ms-auto flex flex-col items-end text-end">
                <span className="font-mono text-ui-sm text-fg-muted tabular-nums">{date.format(shown.start)}</span>
                <span className="font-mono text-2xl leading-tight font-medium tracking-tight text-fg tabular-nums">
                  {time.format(shown.start)}
                  <span className="text-[0.6em] text-fg-muted">–{time.format(end!)}</span>
                </span>
              </div>
            </div>

            {!booked && (
              <dl className={`grid gap-3 border-t border-line pt-4 ${service.price === undefined ? 'grid-cols-2' : 'grid-cols-3'}`}>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <Eyebrow render={<dt />}>{copy.duration}</Eyebrow>
                  <dd className="font-mono text-ui-lg text-fg tabular-nums [unicode-bidi:plaintext]">
                    {numberFormat(copy.locale).format(service.minutes)}
                    {' '}<span className="text-[0.8em] text-fg-muted">{copy.minutes}</span>
                  </dd>
                </div>
                {service.price !== undefined && (
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <Eyebrow render={<dt />}>{copy.price}</Eyebrow>
                    <dd className="font-mono text-ui-lg text-fg tabular-nums">{formatPrice(service.price)}</dd>
                  </div>
                )}
                <div className="flex min-w-0 flex-col items-start gap-1.5">
                  <Eyebrow render={<dt />}>{copy.places}</Eyebrow>
                  <dd>
                    <Badge dir="auto" variant={slot!.left <= 2 ? 'warning' : 'success'}>
                      <BadgeDot />
                      {copy.placesLeft(slot!.left)}
                    </Badge>
                  </dd>
                </div>
              </dl>
            )}

            {/* The pass it draws on: one cell a place, the one this booking takes going dark. */}
            {pass && (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <Eyebrow>{copy.pass}</Eyebrow>
                <span dir="auto" className="font-mono text-ui-sm text-fg-muted tabular-nums">{copy.passLeft(pass.left, pass.total)}</span>
              </div>
              <SegmentedMeter
                aria-label={copy.pass}
                value={pass.left}
                max={pass.total}
                segments={pass.total}
                showValue={false}
                locale={copy.locale}
                getAriaValueText={() => copy.passLeft(pass.left, pass.total)}
              />
            </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2">
              {booked ? (
                <>
                  <Badge variant="success" className="me-auto">
                    <CheckCircleIcon size={12} />
                    {copy.booked}
                  </Badge>
                  <Button variant="secondary" onClick={onAnother}>
                    {copy.bookAnother}
                  </Button>
                  <Button variant="secondary">
                    <CalendarPlusIcon size={14} />
                    {copy.addToCalendar}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="secondary" onClick={onChange}>
                    {copy.change}
                  </Button>
                  <AsyncButton onAction={onBook} pendingLabel={copy.booking} successLabel={copy.booked}>
                    {service.price === undefined ? copy.book : `${copy.book} · ${formatPrice(service.price)}`}
                  </AsyncButton>
                </>
              )}
            </div>
          </m.div>
        )}
      </m.div>
    </MotionFeatures>
  )
}

export { ConfirmWell }
