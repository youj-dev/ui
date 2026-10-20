'use client'

import { useState } from 'react'
import { StreakCheck, CalendarHeatmap, StreakSummary, streakStats, type StreakDay } from '@youj/react'

const DAY = 86_400_000
const TODAY = '2026-09-28'
const T = Date.parse(`${TODAY}T00:00:00Z`) / DAY
const iso = (n: number) => new Date(n * DAY).toISOString().slice(0, 10)

/** Missed days: one before the current run, one either side of an older 31-day run, and a scatter further back. */
const missed = (ago: number) => {
  if (ago === 24 || ago === 40 || ago === 72) return true
  if (ago > 40 && ago < 72) return false
  return ago > 24 && (ago % 9 === 0 || ago % 13 === 5)
}

const HISTORY: StreakDay[] = []
for (let ago = 182; ago >= 1; ago--) {
  if (ago === 9) HISTORY.push({ date: iso(T - ago), frozen: true })
  else if (!missed(ago)) HISTORY.push({ date: iso(T - ago) })
}

export default function CalendarHeatmapDemo() {
  const [days, setDays] = useState(HISTORY)
  const done = streakStats(days, TODAY).today
  const setToday = (next: boolean) => setDays((list) => [...list.filter((d) => d.date !== TODAY), ...(next ? [{ date: TODAY }] : [])])

  return (
    <div className="w-full max-w-3xl rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="text-ui font-medium text-fg">Morning run</p>
            <p className="text-ui-sm text-fg-muted">5 km before 8:00</p>
          </div>
          <StreakCheck pressed={done} onPressedChange={setToday} />
        </div>
        <StreakSummary days={days} today={TODAY} freezes={{ left: 2, total: 3 }} />
        <CalendarHeatmap days={days} today={TODAY} onTodayChange={setToday} />
      </div>
    </div>
  )
}
