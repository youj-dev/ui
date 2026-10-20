'use client'

import { useState } from 'react'
import { SlotGrid, type SlotGridSlot } from '@youj/react'

const WEEK = new Date(2026, 8, 28)
const TIMES = [7 * 60, 9 * 60, 12 * 60 + 30, 18 * 60]
// Places still free in each slot, a row per start time and a column per day; -1 isn't offered.
const LEFT = [
  [6, 0, 3, 1, 8, 5, 2],
  [2, 4, 8, 7, 1, 0, 6],
  [8, 6, 5, 8, 7, 3, 4],
  [0, 1, 2, 0, 3, 5, -1],
]

const SLOTS: SlotGridSlot[] = LEFT.flatMap((row, r) =>
  row.flatMap((left, day) => {
    if (left < 0) return []
    const start = new Date(WEEK)
    start.setDate(start.getDate() + day)
    start.setHours(Math.floor(TIMES[r]! / 60), TIMES[r]! % 60)
    return [{ id: `${r}-${day}`, start, left, capacity: 8, mine: r === 2 && day === 3 }]
  }),
)

export default function SlotGridDemo() {
  const [slot, setSlot] = useState<string | null>(null)
  return (
    <div className="w-full max-w-3xl rounded-2xl border border-line bg-surface p-5">
      <SlotGrid slots={SLOTS} start={WEEK} value={slot} onValueChange={setSlot} />
    </div>
  )
}
