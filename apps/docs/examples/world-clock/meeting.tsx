'use client'

import { useState } from 'react'
import { Button, WorldClock, type WorldClockZone } from '@youj/react'

const ZONES: WorldClockZone[] = [
  { timeZone: 'Europe/Berlin', label: 'Berlin' },
  { timeZone: 'America/New_York', label: 'New York' },
  { timeZone: 'Asia/Kolkata', label: 'Bengaluru', workingHours: [10, 18] },
]

export default function WorldClockMeeting() {
  const [value, setValue] = useState<Date | null>(new Date('2026-10-13T12:00:00Z'))
  const when = value ?? new Date()

  return (
    <div className="flex w-full max-w-3xl flex-col gap-4 rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-ui-lg font-medium text-fg">Quarterly planning</h3>
          <p className="text-ui-sm text-fg-muted">
            {new Intl.DateTimeFormat(undefined, { weekday: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin', timeZoneName: 'short' }).format(when)}
          </p>
        </div>
        <Button size="sm">Send invite</Button>
      </div>
      {/* Controlled, on half hours: the app keeps the proposed time and books it. */}
      <WorldClock zones={ZONES} value={value} onValueChange={setValue} step={30} />
    </div>
  )
}
