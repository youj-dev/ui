'use client'

import { UnitChart } from '@youj/react'

/** Support tickets per hour over a day. */
const TICKETS = [12, 8, 5, 4, 6, 10, 22, 48, 85, 110, 124, 118, 96, 102, 115, 108, 92, 70, 52, 40, 33, 28, 20, 15].map((value, hour) => ({
  label: `${String(hour).padStart(2, '0')}:00`,
  value,
}))

export default function UnitChartUnit() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <UnitChart data={TICKETS} unit={5} tone="chart-2" tickEvery={6} label="Support tickets by hour" formatValue={(v) => `${v} tickets`} />
      <p className="text-sm text-fg-muted">Each dot is five tickets.</p>
    </div>
  )
}
