'use client'

import { useEffect, useMemo, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { ContentSwap } from '@youj/motion'
import { ArrowLeftIcon, CalendarPlusIcon, CheckIcon, ClockIcon, RefreshIcon } from '@youj/icons'
import { Button } from '../../components/ui/button'
import { Calendar } from '../../components/ui/calendar'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, dateTimeFormat } from '../../lib/utils'
import {
  DEFAULT_COPY,
  DURATIONS,
  HOST,
  isOpen,
  MEETING,
  slotsFor,
  TODAY,
  ZONES,
  type BookingCopy,
  type BookingHost,
  type BookingMeeting,
  type BookingRequest,
  type BookingZone,
  type Step,
} from './meeting-booking/data'
import { DetailsForm } from './meeting-booking/details-form'
import { DetailsSkeleton } from './meeting-booking/details-skeleton'
import { MeetingPanel } from './meeting-booking/meeting-panel'
import { SlotColumn } from './meeting-booking/slot-column'
import { StepPane } from './meeting-booking/step-pane'

/* Tempo: a public booking page, one card on a soft wash. The host panel
 * holds who you're meeting, the length (a segmented control whose raised key
 * glides between 15, 30 and 45 minutes), where, and your time zone. Pick a
 * day on the Calendar (open days are tinted) and the slot column re-staggers
 * in for that day, zone and length; picking a slot splits it into the time
 * and a Next action. Next holds the slot for a beat (ContentSwap resolves the
 * form out of its skeleton), the details submit through Button onAction, and
 * the booking lands on a drawn check with the summary and calendar actions.
 * Pass your own `host`, `meeting`, `durations`, `zones` and `availability`,
 * book through `onBook`; every string is in `copy`.
 * It is built for the compact layout density (ui.css), taken from the page.
 * Reduced motion: slots, steps and the check appear in place. */

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  return wait(ms)
}

const DEMO_DURATIONS = DURATIONS.map(Number)

const BRAND = {
  name: 'Tempo',
  logo: (
    <span aria-hidden className="grid size-6 place-items-center rounded-md bg-accent text-on-accent">
      <ClockIcon size={14} strokeWidth={2.25} />
    </span>
  ),
}

interface MeetingBookingProps extends Omit<ComponentProps<'div'>, 'children' | 'onDurationChange'> {
  /** A theme to force on the block. Default: none, so it inherits the app's (YoujProvider or a ThemeScope around it). */
  theme?: ThemeInput
  /** Classes for the page's root; any other prop lands on it too. */
  className?: string
  /** Inside another page: the booking card alone, without the page around it (its canvas and the brand in the corner). Default false. */
  embedded?: boolean
  /** Embedded, take the whole width it's given instead of stopping at its natural width (1024px at 100% scale). Default false. */
  fill?: boolean
  /** The product in the corner: its name and logo. Default: Tempo, with a clock. */
  brand?: { name: string; logo?: ReactNode }
  /** The locale dates read in. Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The meeting title's level; the steps' headings sit one under it. Default 1. */
  headingLevel?: 1 | 2 | 3
  /** Any of the page's strings, to rewrite or translate; `formatTime` sets how slots read. */
  copy?: Partial<BookingCopy>
  /** Who the visitor meets. Default: Maya Okafor, design lead at Fieldwork. */
  host?: BookingHost
  /** What they book: its title, description and where it happens. Default: a portfolio review over video. */
  meeting?: BookingMeeting
  /** The lengths on offer, in minutes. Default: 15, 30 and 45. */
  durations?: readonly number[]
  /** The time zones the visitor can read the slots in, as offsets from the host's. Default: five, from Lisbon. */
  zones?: readonly BookingZone[]
  /** The host's free start times for a day and length, in minutes after midnight in the host's zone. Default: demo weekday slots. */
  availability?: (date: Date, duration: number) => readonly number[]
  /** Whether a day can be picked. Default: the demo's open weekdays; with your `availability`, days after `today` that have a slot. */
  isDayOpen?: (date: Date) => boolean
  /** Today, at local midnight: the calendar starts here and the first open day after it is picked. A prop so server and browser agree. Default: Sep 28, 2026. */
  today?: Date
  /** The chosen day (controlled). */
  date?: Date
  /** The day chosen at first. Default: the first open day after `today`. */
  defaultDate?: Date
  /** Runs when the visitor picks a day. */
  onDateChange?: (date: Date) => void
  /** The chosen length, in minutes (controlled). */
  duration?: number
  /** The length chosen at first, in minutes. Default 30. */
  defaultDuration?: number
  /** Runs when the visitor picks a length. */
  onDurationChange?: (duration: number) => void
  /** The visitor's zone, a `zones` value (controlled). */
  zone?: string
  /** The zone chosen at first. Default `lisbon`. */
  defaultZone?: string
  /** Runs when the visitor picks a zone. */
  onZoneChange?: (zone: string) => void
  /** Books the slot with the visitor's details; resolve when it's booked, throw to show the error. Default: a short demo wait. */
  onBook?: (booking: BookingRequest) => Promise<unknown> | unknown
  /** Runs from "Add to calendar" on the confirmation. */
  onAddToCalendar?: (booking: BookingRequest) => void
  /** Runs from "Reschedule" on the confirmation, as the page goes back to the times. */
  onReschedule?: (booking: BookingRequest) => void
}

function MeetingBooking({
  theme,
  className,
  embedded = false,
  fill = false,
  brand = BRAND,
  locale: localeProp,
  headingLevel = 1,
  copy: copyProp,
  host = HOST,
  meeting = MEETING,
  durations = DEMO_DURATIONS,
  zones = ZONES,
  availability,
  isDayOpen,
  today = TODAY,
  date: dateProp,
  defaultDate,
  onDateChange,
  duration: durationProp,
  defaultDuration = 30,
  onDurationChange,
  zone: zoneProp,
  defaultZone = 'lisbon',
  onZoneChange,
  onBook,
  onAddToCalendar,
  onReschedule,
  ...rest
}: MeetingBookingProps) {
  const locale = useLocale(localeProp ?? copyProp?.locale)
  const copy = { ...DEFAULT_COPY, ...copyProp, locale }
  const Sub = `h${headingLevel + 1}` as 'h2' | 'h3' | 'h4'
  const [duration, setDuration] = useControllableState(durationProp, defaultDuration)
  const [zone, setZone] = useControllableState(zoneProp, defaultZone)
  const slotsOf = availability ?? slotsFor
  const open = isDayOpen ?? (availability ? (d: Date) => d > today && availability(d, duration).length > 0 : (d: Date) => isOpen(d, today))
  // Start on the first open day after today: today is a prop, so the server and the browser agree.
  const [firstOpen] = useState(() => {
    if (defaultDate) return defaultDate
    const d = new Date(today)
    for (let i = 0; i < 40 && !open(d); i++) d.setDate(d.getDate() + 1)
    return d
  })
  const [date, setDate] = useControllableState(dateProp, firstOpen)
  const [slot, setSlot] = useState<number | null>(null)
  const [step, setStep] = useState<Step>('pick')
  const [holding, setHolding] = useState(false)
  const [booked, setBooked] = useState<BookingRequest | null>(null)

  const dayFormat = useMemo(() => dateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric' }), [locale])
  const shortDay = useMemo(() => dateTimeFormat(locale, { weekday: 'short', month: 'short', day: 'numeric' }), [locale])
  const offset = zones.find((z) => z.value === zone)?.offset ?? 0
  const zoneLabel = zones.find((z) => z.value === zone)?.label
  // The host's first name, for the form's questions.
  const hostName = host.name.split(/\s+/)[0] || host.name

  useEffect(() => {
    if (!holding) return
    const t = setTimeout(() => setHolding(false), 700)
    return () => clearTimeout(t)
  }, [holding])

  const when = slot !== null ? `${shortDay.format(date)}, ${copy.formatTime(slot + offset * 60)}` : ''
  const request = (details: { name: string; email: string; notes: string }): BookingRequest => ({ date, minutes: slot ?? 0, duration, zone, ...details })

  const card = (
    <div className="grid w-full overflow-hidden rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line bg-surface shadow-sm md:min-h-104 md:grid-cols-[--spacing(68)_1fr]">
      <MeetingPanel
        host={host}
        meeting={meeting}
        durations={durations}
        zones={zones}
        copy={copy}
        headingLevel={headingLevel}
        step={step}
        duration={duration}
        onDurationChange={(d) => {
          setDuration(d)
          onDurationChange?.(d)
          setSlot(null)
        }}
        zone={zone}
        onZoneChange={(z) => {
          setZone(z)
          onZoneChange?.(z)
          setSlot(null)
        }}
        when={when}
        zoneLabel={zoneLabel}
      />

      <div className="min-w-0 px-(--ui--panel-x) py-(--ui--panel-y)">
        {step === 'pick' && (
          <StepPane id="pick" className="grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)]">
            <section aria-labelledby="tempo-date" className="flex min-w-0 flex-col gap-3">
              <Sub id="tempo-date" className="text-ui font-medium">
                {copy.pickDay}
              </Sub>
              <Calendar
                mode="single"
                required
                selected={date}
                onSelect={(d) => {
                  setDate(d)
                  onDateChange?.(d)
                  setSlot(null)
                }}
                disabled={(d) => !open(d)}
                today={today}
                startMonth={today}
                modifiers={{ open }}
                modifiersClassNames={{
                  open: '[&>button:not([data-selected-single])]:font-semibold [&>button:not([data-selected-single])]:text-fg',
                }}
                className="mx-auto sm:mx-0 [--spacing-control:--spacing(10)]"
              />
            </section>
            {date && (
              <SlotColumn
                date={date}
                duration={duration}
                offset={offset}
                slots={slotsOf(date, duration)}
                dayLabel={dayFormat.format(date)}
                copy={copy}
                heading={Sub}
                selected={slot}
                onSelect={setSlot}
                onNext={() => {
                  setStep('details')
                  setHolding(true)
                }}
              />
            )}
          </StepPane>
        )}

        {step === 'details' && (
          <StepPane id="details" className="mx-auto flex max-w-md flex-col gap-5">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon-sm" aria-label={copy.backToTimes} onClick={() => setStep('pick')}>
                <ArrowLeftIcon size={16} className="rtl:-scale-x-100" />
              </Button>
              <Sub className="text-ui-lg font-semibold tracking-tight">{copy.details}</Sub>
            </div>
            <ContentSwap loading={holding} fallback={<DetailsSkeleton />} loadingLabel={copy.holding(when)}>
              <DetailsForm
                copy={copy}
                host={hostName}
                onBook={(details) => (onBook ? onBook(request(details)) : demo('MeetingBooking: onBook', 900))}
                onBooked={(details) => {
                  setBooked(request(details))
                  setStep('done')
                }}
              />
            </ContentSwap>
          </StepPane>
        )}

        {step === 'done' && (
          <StepPane id="done" className="mx-auto flex max-w-md flex-col items-center gap-5 py-6 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-accent-subtle text-accent">
              <CheckIcon trigger="mount" size={28} strokeWidth={2.5} />
            </span>
            <div className="flex flex-col gap-1.5" role="status">
              <Sub className="text-xl font-semibold tracking-tight">{copy.done}</Sub>
              <p className="text-ui text-fg-muted">{copy.doneDetail(when, host.name, booked?.email || copy.yourInbox)}</p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row">
              <Button className="flex-1" onClick={() => booked && onAddToCalendar?.(booked)}>
                <CalendarPlusIcon size={16} /> {copy.addToCalendar}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  if (booked) onReschedule?.(booked)
                  setStep('pick')
                  setSlot(null)
                }}
              >
                <RefreshIcon size={16} /> {copy.reschedule}
              </Button>
            </div>
          </StepPane>
        )}
      </div>
    </div>
  )

  return (
    <ThemeScope theme={theme}>
      {embedded ? (
        <div {...rest} className={cn('w-full text-fg', !fill && 'max-w-5xl', className)}>
          {card}
        </div>
      ) : (
        <div {...rest} className={cn('relative isolate flex min-h-dvh flex-col bg-canvas text-fg', className)}>
          <header className="mx-auto flex w-full max-w-5xl items-center gap-2 px-4 pt-6 md:px-8">
            {brand.logo}
            <span className="text-ui font-semibold tracking-tight">{brand.name}</span>
          </header>
          <main className="mx-auto flex w-full max-w-5xl flex-1 items-start justify-center px-4 py-6 md:px-8 md:pt-20 md:pb-10">{card}</main>
        </div>
      )}
    </ThemeScope>
  )
}

export { MeetingBooking, type MeetingBookingProps, type BookingCopy, type BookingHost, type BookingMeeting, type BookingRequest, type BookingZone }
