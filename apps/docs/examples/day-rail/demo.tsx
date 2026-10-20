'use client'

import { ItineraryDay, DayRail, type ItineraryLeg, type ItineraryStay, type ItineraryStop } from '@youj/react'

/** A time as it reads on the clocks at a place `offset` minutes from UTC. */
const local = (month: number, day: number, hh: number, mm: number, offset: number) => Date.UTC(2026, month - 1, day, hh, mm) - offset * 60_000
const LIS = 60
const CET = 120

const STOPS: ItineraryStop[] = [
  { id: 'lis', code: 'LIS', name: 'Lisbon', utcOffset: LIS },
  { id: 'bcn', code: 'BCN', name: 'Barcelona', utcOffset: CET },
  { id: 'fco', code: 'FCO', name: 'Rome', utcOffset: CET },
]

const LEGS: ItineraryLeg[] = [
  { id: 'out', from: 'lis', to: 'bcn', depart: local(9, 30, 9, 40, LIS), arrive: local(9, 30, 12, 55, CET), code: 'TP 1036' },
  { id: 'hop', from: 'bcn', to: 'fco', depart: local(10, 3, 14, 20, CET), arrive: local(10, 3, 16, 10, CET), code: 'VY 6104' },
  { id: 'home', from: 'fco', to: 'lis', depart: local(10, 5, 16, 20, CET), arrive: local(10, 5, 18, 25, LIS), code: 'TP 839' },
]

const STAYS: ItineraryStay[] = [
  { id: 'bonay', at: 'bcn', start: local(9, 30, 15, 0, CET), end: local(10, 3, 11, 0, CET), name: 'Casa Bonay' },
  { id: 'vilon', at: 'fco', start: local(10, 3, 17, 0, CET), end: local(10, 5, 11, 0, CET), name: 'Hotel Vilòn' },
]

const PLANS = [
  'Fly to Barcelona at 09:40, then check in at Casa Bonay.',
  'Sagrada Família at 10:30, tapas at El Xampanyet at 20:30.',
  'Montjuïc cable car at 12:00. The afternoon is free.',
  'Check out by 11:00, fly to Rome at 14:20.',
  'Vatican Museums, early entry at 08:00.',
  'Check out by 11:00, fly home at 16:20.',
]

export default function DayRailDemo() {
  // `now` pins the line mid-flight to Rome; leave it out and the line follows the clock.
  return (
    <div className="w-full max-w-3xl rounded-2xl border border-line bg-surface p-5">
      <DayRail stops={STOPS} legs={LEGS} stays={STAYS} start={local(9, 30, 0, 0, LIS)} days={6} now={local(10, 3, 15, 10, CET)}>
        {PLANS.map((plan, d) => (
          <ItineraryDay key={d} value={d}>
            <p className="text-ui-sm text-fg-muted">{plan}</p>
          </ItineraryDay>
        ))}
      </DayRail>
    </div>
  )
}
