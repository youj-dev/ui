'use client'

import { TimeLanes, type RotaLane, type RotaShift } from '@youj/react'

const DAY = new Date(2026, 9, 5, 8).getTime()
const at = (h: number, m = 0) => DAY + ((h - 8) * 60 + m) * 60_000

const DRIVERS: RotaLane[] = [
  { id: 'mq', name: 'Mara Quinn', detail: 'Load 4821' },
  { id: 'tp', name: 'Theo Park', detail: 'Load 4910' },
  { id: 'io', name: 'Iris Okafor', detail: 'Available' },
]

const RUNS: RotaShift[] = [
  { id: 'r1', lane: 'mq', start: at(8), end: at(9, 40), label: '4790', tone: 'neutral' },
  { id: 'r2', lane: 'mq', start: at(10), end: at(14, 50), label: '4821' },
  { id: 'r2x', lane: 'mq', start: at(14, 50), end: at(15, 37), label: '+47m', tone: 'danger', override: true, note: 'Running late on Ridge road' },
  { id: 'r3', lane: 'tp', start: at(8), end: at(10, 20), label: '4874', tone: 'neutral' },
  { id: 'r4', lane: 'tp', start: at(10, 50), end: at(13, 20), label: '4910', tone: 'danger', note: 'Dock conflict at 13:30' },
  { id: 'p1', lane: 'tp', start: at(13, 50), end: at(16), label: 'Reassign', proposed: true },
  { id: 'r5', lane: 'io', start: at(8), end: at(9, 50), label: '4863', tone: 'neutral' },
  { id: 'p2', lane: 'io', start: at(10, 30), end: at(13), label: '4935', proposed: true, note: '4.2 mi from the yard' },
  { id: 'p3', lane: 'io', start: at(13, 50), end: at(16), label: '4910', proposed: true },
]

export default function TimeLanesDay() {
  return (
    <div className="w-full max-w-3xl rounded-2xl border border-line bg-surface p-5">
      <TimeLanes lanes={DRIVERS} shifts={RUNS} start={DAY} hours={9} now={at(11, 58)} label="Driver timeline" />
    </div>
  )
}
