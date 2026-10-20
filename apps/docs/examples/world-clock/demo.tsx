'use client'

import { WorldClock, type WorldClockZone } from '@youj/react'

const TEAM: WorldClockZone[] = [
  { timeZone: 'Europe/London', label: 'Ada · London' },
  { timeZone: 'America/New_York', label: 'Grace · New York' },
  { timeZone: 'Asia/Singapore', label: 'Lin · Singapore', workingHours: [8.5, 17.5] },
  { timeZone: 'America/Los_Angeles', label: 'Joan · San Francisco', workingHours: [8, 16] },
]

export default function WorldClockDemo() {
  // No value: the cursor follows the clock. Drag it, or use the arrow keys, to propose a time.
  return (
    <div className="w-full max-w-3xl rounded-2xl border border-line bg-surface p-5">
      <WorldClock zones={TEAM} />
    </div>
  )
}
