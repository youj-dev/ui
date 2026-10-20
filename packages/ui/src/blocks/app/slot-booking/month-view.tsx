'use client'

import { useMemo, useRef, useState } from 'react'
import { m } from 'motion/react'
import { MotionFeatures, useYouj } from '@youj/core'
import { Calendar } from '../../../components/ui/calendar'
import { CardContent } from '../../../components/ui/card'
import { SegmentedControl, SegmentedControlItem } from '../../../components/ui/segmented-control'
import type { SlotGridSlot } from '../../../components/ui/slot-grid'
import { SlotList } from './slot-list'
import { SlotReview } from './slot-review'
import { DAYS, demo, type SlotBookingCopy, type SlotBookingPass, type SlotBookingService, type SlotBookingSlot } from './data'
import { dateTimeFormat } from '../../../lib/utils'

interface MonthViewProps {
  copy: SlotBookingCopy
  services: SlotBookingService[]
  schedule: (day: number, services: SlotBookingService[]) => SlotBookingSlot[]
  from: number
  pass: SlotBookingPass | null
  formatPrice: (price: number) => string
  onBook?: (slot: SlotGridSlot, service: SlotBookingService) => Promise<unknown> | unknown
  announce: (message: string) => void
  level: 'h2' | 'h3'
}

type Step = 'list' | 'review' | 'booked'

const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

// Open days wear a soft wash of the accent; the chosen one keeps the Calendar's solid fill.
const OPEN = '[&>button:not([data-selected-single])]:bg-accent-subtle [&>button:not([data-selected-single])]:font-medium [&>button:not([data-selected-single]):hover]:bg-accent-subtle'
// A day holding one of your slots: a small success dot at its top corner.
const YOURS = 'after:pointer-events-none after:absolute after:end-1 after:top-1 after:size-1.5 after:rounded-full after:bg-success'
// On a phone the service track spans the card and its keys share it, so all four fit at 360px.
const ITEM = 'max-sm:min-w-0 max-sm:flex-1 max-sm:px-1.5'

/** The month on the left, the chosen day's slots on the right; a slot opens its review, then its confirmation, in the same place. */
function MonthView({ copy, services, schedule, from, pass: passProp, formatPrice, onBook, announce, level }: MonthViewProps) {
  const k = useYouj()
  const pane = useRef<HTMLDivElement>(null)
  const [filter, setFilter] = useState('all')
  const [step, setStep] = useState<Step>('list')
  const [picked, setPicked] = useState<string | null>(null)
  const [mine, setMine] = useState<string[]>([])

  const days = useMemo(() => Array.from({ length: DAYS }, (_, i) => midnight(new Date(new Date(from).setDate(new Date(from).getDate() + i)))), [from])
  const byDay = useMemo(() => new Map(days.map((d) => [d, schedule(d, services)])), [days, schedule, services])
  const [day, setDay] = useState(() => days.find((d) => byDay.get(d)!.some((c) => c.left > 0)) ?? days[0]!)

  const ofService = (c: SlotBookingSlot) => filter === 'all' || c.service === filter
  const slotsOn = (d: number) =>
    (byDay.get(d) ?? []).filter(ofService).map((c) => (mine.includes(c.id) ? { ...c, mine: true, left: Math.max(0, c.left - 1) } : c))
  const slots = slotsOn(day)
  const open = (d: number) => slotsOn(d).some((c) => c.left > 0 && !c.mine)
  const next = days.find((d) => d > day && open(d))
  const slot = slots.find((c) => c.id === picked)
  const service = slot && services.find((s) => s.id === slot.service)
  const pass = passProp && { left: Math.max(0, passProp.left - mine.length), total: passProp.total }
  const serviceName = filter === 'all' ? undefined : services.find((s) => s.id === filter)?.name

  const pickDay = (d: number) => {
    setDay(d)
    setStep('list')
    setPicked(null)
  }
  const focusRow = (id: string | null) =>
    requestAnimationFrame(() => (pane.current?.querySelector<HTMLElement>(id ? `[data-slot-pick="${id}"]` : '[data-slot-pick]:not(:disabled)'))?.focus())

  const last = new Date(days[days.length - 1]!)
  const enter = k.reduced ? false : { opacity: 0, y: 8 }
  const transition = k.reduced ? { type: false as const } : k.tween('base', 'enter')

  return (
    <CardContent className="flex flex-col gap-6">
      <SegmentedControl
        aria-label={copy.service}
        value={filter}
        onValueChange={(v) => {
          setFilter(v)
          setStep('list')
          setPicked(null)
        }}
        className="self-start max-sm:w-full"
      >
        <SegmentedControlItem value="all" className={ITEM}>{copy.allServices}</SegmentedControlItem>
        {services.map((s) => (
          <SegmentedControlItem key={s.id} value={s.id} className={ITEM}>
            {s.name}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>

      <div className="grid gap-x-10 gap-y-8 md:grid-cols-[auto_minmax(0,1fr)]">
        <div className="flex flex-col items-center gap-3 md:items-start">
          <Calendar
            mode="single"
            required
            selected={new Date(day)}
            onSelect={(d) => d && pickDay(midnight(d))}
            defaultMonth={new Date(day)}
            startMonth={new Date(from)}
            endMonth={last}
            today={new Date(from)}
            disabled={[{ before: new Date(from) }, { after: last }, (d) => !byDay.get(midnight(d))?.length]}
            modifiers={{ open: (d) => open(midnight(d)), yours: (d) => slotsOn(midnight(d)).some((c) => c.mine) }}
            modifiersClassNames={{ open: OPEN, yours: YOURS }}
            // A clear border inset-clips each day's fill, so neighbouring highlights never touch. Narrow: the grid shares the width it has (seven columns) rather than holding a cell size that clips in a phone-sized card.
            // Six weeks' height at an app's size: the last month, which shows no weeks past the timetable, never shrinks the card.
            className="min-h-88.5 [--spacing-control:2.5rem] [&_td>button]:border-[3px] [&_td>button]:border-transparent [&_td>button]:bg-clip-padding max-sm:w-full max-sm:[&_table]:w-full max-sm:[&_th]:w-auto! max-sm:[&_td>button]:w-full!"
          />
          <div aria-hidden className="flex items-center gap-4 px-1 text-ui-xs text-fg-muted">
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-full bg-accent-subtle" />
              {copy.openDays}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-success" />
              {copy.yourDays}
            </span>
          </div>
        </div>

        <MotionFeatures>
          <div ref={pane} className="min-w-0 md:min-h-88">
            <m.div hidden={step !== 'list'} initial={false} animate={step === 'list' ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }} transition={transition}>
              <SlotList
                day={day}
                slots={slots}
                services={services}
                copy={copy}
                level={level}
                picked={picked}
                serviceName={serviceName}
                next={next}
                onNext={pickDay}
                onPick={(id) => {
                  setPicked(id)
                  setStep('review')
                }}
              />
            </m.div>
            {step !== 'list' && slot && service && (
              <m.div key={step} initial={enter} animate={{ opacity: 1, y: 0 }} transition={transition}>
                <SlotReview
                  slot={slot}
                  service={service}
                  copy={copy}
                  level={level}
                  booked={step === 'booked'}
                  pass={pass}
                  formatPrice={formatPrice}
                  onBook={async () => {
                    await (onBook ? onBook(slot, service) : demo('Booking: onBook', 900))
                    setMine((list) => [...list, slot.id])
                    announce(copy.bookedAnnounce(dateTimeFormat(copy.locale, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(slot.start)))
                  }}
                  onBooked={() => setStep('booked')}
                  onChange={() => {
                    setStep('list')
                    focusRow(picked)
                  }}
                  onAnother={() => {
                    setStep('list')
                    setPicked(null)
                    focusRow(null)
                  }}
                />
              </m.div>
            )}
          </div>
        </MotionFeatures>
      </div>
    </CardContent>
  )
}

export { MonthView }
