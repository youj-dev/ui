'use client'

import { SegmentedMeter, type SegmentedMeterThreshold } from '@youj/react'

const HEALTH: SegmentedMeterThreshold[] = [
  { value: 0, tone: 'danger', label: 'At risk' },
  { value: 40, tone: 'warning', label: 'Watch' },
  { value: 70, tone: 'success', label: 'Healthy' },
]

const WORKSPACES = [
  { name: 'Northline Studio', score: 96 },
  { name: 'Harbor & Pine', score: 52 },
  { name: 'Fieldnote', score: 81 },
  { name: 'Quarry Labs', score: 18 },
]

export default function SegmentedMeterScore() {
  return (
    <div className="flex w-full max-w-md flex-col rounded-xl border border-line bg-surface">
      {WORKSPACES.map((row) => (
        <div key={row.name} className="flex items-center gap-4 border-b border-line-subtle px-4 py-3 last:border-b-0">
          <span className="min-w-0 flex-1 truncate text-sm">{row.name}</span>
          <span className="w-7 text-end text-sm font-medium tabular-nums">{row.score}</span>
          <SegmentedMeter
            aria-label={`${row.name} health`}
            value={row.score}
            segments={12}
            thresholds={HEALTH}
            colorBy="value"
            showValue={false}
            className="w-36 shrink-0 [&_[data-slot=segmented-meter-cell]]:rounded-full [&_[data-slot=segmented-meter-track]]:h-3 [&_[data-slot=segmented-meter-track]]:gap-1"
          />
        </div>
      ))}
    </div>
  )
}
