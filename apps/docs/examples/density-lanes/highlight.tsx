'use client'

import { useState } from 'react'
import { DensityLanes, Switch, type DensityLane } from '@youj/react'

const COLUMNS = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00`)
const TICKS = [0, 6, 12, 18, 24].map((at) => ({ at, label: String(at).padStart(2, '0') }))

/** A made-up support desk's tickets by hour, by channel. */
const LANES: DensityLane[] = [
  { id: 'chat', label: 'Chat', values: [3, 2, 2, 1, 1, 2, 5, 11, 18, 22, 24, 23, 21, 22, 24, 22, 18, 13, 9, 7, 6, 5, 4, 3], tone: 'chart-1' },
  { id: 'email', label: 'Email', values: [6, 5, 4, 4, 3, 4, 6, 9, 13, 15, 14, 13, 12, 13, 14, 13, 12, 10, 9, 8, 8, 7, 7, 6], tone: 'chart-4' },
  { id: 'phone', label: 'Phone', values: [0, 0, 0, 0, 0, 0, 1, 4, 9, 12, 11, 9, 6, 9, 11, 10, 8, 4, 1, 0, 0, 0, 0, 0], tone: 'chart-5' },
]

export default function DensityLanesHighlight() {
  const [night, setNight] = useState(true)
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <label className="flex items-center gap-2 text-ui text-fg-muted">
        <Switch size="sm" checked={night} onCheckedChange={setNight} />
        Outside office hours
      </label>
      <DensityLanes
        lanes={LANES}
        columns={COLUMNS}
        ticks={TICKS}
        depth={3}
        highlight={
          night
            ? [
                [0, 7],
                [18, 23],
              ]
            : undefined
        }
        marker={{ column: 10, label: 'Busiest 10:00 · 49 tickets' }}
        formatValue={(v) => `${v} tickets`}
        label="Tickets by hour, by channel"
      />
    </div>
  )
}
