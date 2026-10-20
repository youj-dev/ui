'use client'

import { useState } from 'react'
import { CalendarHeatmap, StreakCheck, StreakSummary, streakStats, type StreakDay } from '@youj/react'
import { Demo, TileCard } from './demo'

const DAY = 86_400_000
const TODAY = '2026-10-14'
const T = Date.parse(`${TODAY}T00:00:00Z`) / DAY
const iso = (n: number) => new Date(n * DAY).toISOString().slice(0, 10)

/** Four months of reading: a 19-day run up to yesterday, a freeze in it, and a scatter of missed days before. */
const HISTORY: StreakDay[] = []
for (let ago = 120; ago >= 1; ago--) {
  if (ago === 6) HISTORY.push({ date: iso(T - ago), frozen: true })
  else if (ago !== 20 && !(ago > 20 && (ago % 7 === 3 || ago % 11 === 4))) HISTORY.push({ date: iso(T - ago) })
}

/** A reading habit: tick today, or today's cell, and the streak grows. */
export default function HeatmapTile() {
  const [days, setDays] = useState(HISTORY)
  const done = streakStats(days, TODAY).today
  const setToday = (next: boolean) => setDays((list) => [...list.filter((d) => d.date !== TODAY), ...(next ? [{ date: TODAY }] : [])])
  return (
    <Demo>
      <TileCard className="max-w-lg gap-4 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="text-ui font-medium text-fg">Reading</p>
            <p className="text-ui-sm text-fg-muted">20 pages a day</p>
          </div>
          <StreakCheck pressed={done} onPressedChange={setToday} />
        </div>
        <StreakSummary days={days} today={TODAY} freezes={{ left: 1, total: 2 }} />
        <CalendarHeatmap days={days} today={TODAY} onTodayChange={setToday} />
      </TileCard>
    </Demo>
  )
}
