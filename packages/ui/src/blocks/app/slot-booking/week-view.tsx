'use client'

import { useMemo, useRef, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { CardContent } from '../../../components/ui/card'
import { SegmentedControl, SegmentedControlItem } from '../../../components/ui/segmented-control'
import { SlotGrid, type SlotGridSlot } from '../../../components/ui/slot-grid'
import { ConfirmWell } from './confirm-well'
import { demo, type SlotBookingCopy, type SlotBookingPass, type SlotBookingService } from './data'
import { dateTimeFormat } from '../../../lib/utils'

interface WeekViewProps {
  copy: SlotBookingCopy
  services: SlotBookingService[]
  slotsFor: (service: SlotBookingService, week: number) => SlotGridSlot[]
  firstWeek: number
  pass: SlotBookingPass | null
  formatPrice: (price: number) => string
  onBook?: (slot: SlotGridSlot, service: SlotBookingService) => Promise<unknown> | unknown
  announce: (message: string) => void
}

const WEEKS = 4

/** The week as a SlotGrid: a service track, a week stepper, the grid of times and the confirm well under it. */
function WeekView({ copy, services, slotsFor, firstWeek, pass: passProp, formatPrice, onBook, announce }: WeekViewProps) {
  const grid = useRef<HTMLDivElement>(null)
  const [serviceId, setServiceId] = useState(services[0]!.id)
  const [offset, setOffset] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [booked, setBooked] = useState<string | null>(null)
  const [mine, setMine] = useState<string[]>([])

  const service = services.find((s) => s.id === serviceId) ?? services[0]!
  const week = useMemo(() => {
    const d = new Date(firstWeek)
    d.setDate(d.getDate() + offset * 7)
    return d.getTime()
  }, [firstWeek, offset])
  const base = useMemo(() => slotsFor(service, week), [slotsFor, service, week])
  const slots = base.map((s) => (mine.includes(s.id) ? { ...s, mine: true, left: Math.max(0, s.left - 1) } : s))
  const slot = slots.find((s) => s.id === picked)
  const bookedSlot = slots.find((s) => s.id === booked)
  const pass = passProp && { left: Math.max(0, passProp.left - mine.length), total: passProp.total }

  const weekEnd = new Date(week)
  weekEnd.setDate(weekEnd.getDate() + 6)
  const range = dateTimeFormat(copy.locale, { day: 'numeric', month: 'short' }).formatRange(week, weekEnd).replace(/[\u2009\u202f]/g, ' ') // Node's ICU pads the dash with thin spaces, a browser's doesn't: hydration needs one text
  const when = (s: SlotGridSlot) => dateTimeFormat(copy.locale, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(s.start)

  const reset = () => {
    setPicked(null)
    setBooked(null)
  }
  const goWeek = (step: number) => {
    setOffset((o) => o + step)
    reset()
  }
  const backToGrid = () => {
    setPicked(null)
    requestAnimationFrame(() => grid.current?.querySelector<HTMLElement>('[data-slot=slot-grid-cell][tabindex="0"]')?.focus())
  }

  return (
    <>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedControl
            aria-label={copy.service}
            value={serviceId}
            onValueChange={(id) => {
              setServiceId(id)
              reset()
            }}
          >
            {services.map((s) => (
              <SegmentedControlItem key={s.id} value={s.id}>
                {s.name}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
          <div role="group" aria-label={copy.week} className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon-sm" aria-label={copy.previousWeek} disabled={offset === 0} onClick={() => goWeek(-1)}>
              <ChevronLeftIcon size={16} className="rtl:-scale-x-100" />
            </Button>
            <span aria-live="polite" className="min-w-34 text-center font-mono text-ui-sm text-fg tabular-nums">
              {range}
            </span>
            <Button variant="ghost" size="icon-sm" aria-label={copy.nextWeek} disabled={offset === WEEKS - 1} onClick={() => goWeek(1)}>
              <ChevronRightIcon size={16} className="rtl:-scale-x-100" />
            </Button>
          </div>
        </div>
        <SlotGrid
          ref={grid}
          key={`${service.id}-${week}`}
          slots={slots}
          start={week}
          value={picked}
          onValueChange={(id) => {
            setPicked(id)
            setBooked(null)
          }}
          label={copy.grid}
          locale={copy.locale}
        />
      </CardContent>

      <CardContent role="region" aria-label={copy.confirm}>
        <ConfirmWell
          service={service}
          slot={slot}
          booked={bookedSlot && !slot ? bookedSlot : undefined}
          pass={pass}
          formatPrice={formatPrice}
          copy={copy}
          onChange={backToGrid}
          onAnother={reset}
          onBook={async () => {
            if (!slot) return
            await (onBook ? onBook(slot, service) : demo('Booking: onBook', 900))
            setMine((list) => [...list, slot.id])
            setPicked(null)
            setBooked(slot.id)
            announce(copy.bookedAnnounce(when(slot)))
          }}
        />
      </CardContent>
    </>
  )
}

export { WeekView }
