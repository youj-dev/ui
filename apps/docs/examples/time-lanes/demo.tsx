'use client'

import { TimeLanes, type RotaLane, type RotaShift } from '@youj/react'

const HOUR = 3_600_000
const WEEK = new Date(2026, 8, 28).getTime()
const at = (day: number, hour: number) => WEEK + (day * 24 + hour) * HOUR

const PEOPLE: RotaLane[] = [
  { id: 'mara', name: 'Mara Quinn', detail: 'Platform' },
  { id: 'theo', name: 'Theo Park', detail: 'Platform' },
  { id: 'iris', name: 'Iris Okafor', detail: 'Data infra' },
  { id: 'jonas', name: 'Jonas Weber', detail: 'Platform' },
]

const SHIFTS: RotaShift[] = [
  { id: 's0', lane: 'jonas', start: at(-1, 9), end: at(0, 9) },
  { id: 's1', lane: 'mara', start: at(0, 9), end: at(1, 9) },
  { id: 's2', lane: 'theo', start: at(1, 9), end: at(2, 9) },
  { id: 's3', lane: 'iris', start: at(2, 9), end: at(3, 9) },
  { id: 's4', lane: 'jonas', start: at(3, 9), end: at(4, 9) },
  { id: 's5', lane: 'mara', start: at(4, 9), end: at(7, 9) },
  { id: 'o1', lane: 'theo', start: at(3, 12), end: at(3, 18), override: true, note: 'Covering Jonas' },
  { id: 'o2', lane: 'iris', start: at(5, 10), end: at(5, 16), override: true },
]

export default function TimeLanesDemo() {
  // `now` pins the line for the demo; leave it out and the line follows the clock.
  return (
    <div className="w-full max-w-3xl rounded-2xl border border-line bg-surface p-5">
      <TimeLanes lanes={PEOPLE} shifts={SHIFTS} start={WEEK} now={at(2, 14.5)} />
    </div>
  )
}
