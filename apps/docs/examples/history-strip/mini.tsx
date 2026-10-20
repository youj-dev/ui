'use client'

import { HistoryStrip, type UptimeDay } from '@youj/react'

/** Ninety days ending 28 Sep 2026 with a few bad days, `[days ago, minutes down]`. */
function history(bad: [number, number][]): UptimeDay[] {
  return Array.from({ length: 90 }, (_, i) => {
    const ago = 89 - i
    const minutes = bad.find(([day]) => day === ago)?.[1] ?? 0
    return { date: new Date(2026, 8, 28 - ago), uptime: 1 - minutes / 1440, downtimeMinutes: minutes }
  })
}

const SERVICES = [
  { name: 'api-gateway', days: history([[23, 9]]) },
  { name: 'webhooks', days: history([[41, 192], [40, 11]]) },
  { name: 'search', days: history([[12, 6], [11, 14], [10, 8]]) },
  { name: 'storage', days: history([[4, 26]]) },
]

const percent = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function HistoryStripMini() {
  return (
    <ul className="flex w-full max-w-xl flex-col gap-2">
      {SERVICES.map((service) => {
        const average = service.days.reduce((sum, day) => sum + (day.uptime ?? 1), 0) / service.days.length
        return (
          // The row says the name and the figure, so its strip is decoration.
          <li key={service.name} className="grid grid-cols-[7rem_minmax(0,1fr)_4.5rem] items-center gap-4 rounded-xl bg-band px-4 py-3">
            <span className="truncate font-mono text-ui text-fg">{service.name}</span>
            <HistoryStrip days={service.days} size="sm" interactive={false} />
            <span className="text-end font-mono text-ui text-fg-muted tabular-nums">{percent.format(Math.floor(average * 10000) / 10000)}</span>
          </li>
        )
      })}
    </ul>
  )
}
