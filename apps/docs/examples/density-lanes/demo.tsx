'use client'

import { DensityLanes, type DensityLane } from '@youj/react'

/** Half-hours of a day, "00:00" to "23:30", and a label every six hours. */
const COLUMNS = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`)
const TICKS = [0, 12, 24, 36, 48].map((at) => ({ at, label: String(at / 2).padStart(2, '0') }))

/** A swell around `peak` (a half-hour index), over a low floor. */
const swell = (peak: number, height: number, width: number, floor = 4) =>
  COLUMNS.map((_, i) => Math.round(floor + height * Math.exp(-((i - peak) ** 2) / (2 * width * width))))

/** A made-up café's orders through a day, by channel. */
const LANES: DensityLane[] = [
  { id: 'counter', label: 'Counter', values: swell(17, 60, 5) },
  { id: 'app', label: 'App', values: swell(24, 46, 7) },
  { id: 'delivery', label: 'Delivery', values: swell(38, 52, 4) },
  { id: 'catering', label: 'Catering', values: swell(22, 24, 3, 1) },
]

export default function DensityLanesDemo() {
  return (
    <div className="w-full max-w-lg">
      <DensityLanes lanes={LANES} columns={COLUMNS} ticks={TICKS} formatValue={(v) => `${v} orders`} label="Orders through the day, by channel" />
    </div>
  )
}
