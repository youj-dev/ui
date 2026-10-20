'use client'

import { WaffleChart } from '@youj/react'

/** A kitchen's food waste over a week, in kilograms, by where it came from. */
const WASTE = [
  { id: 'trim', name: 'Produce trim', value: 22 },
  { id: 'plates', name: 'Plate returns', value: 17 },
  { id: 'overprep', name: 'Overprep', value: 15 },
  { id: 'bread', name: 'Bread', value: 11 },
  { id: 'dairy', name: 'Dairy', value: 7 },
]

export default function WaffleChartDemo() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-medium tabular-nums">72 kg</span>
        <span className="text-sm text-fg-muted">this week. Each cell is 1 kg.</span>
      </div>
      <WaffleChart items={WASTE} shape="hex" layout="cluster" columns={16} rows={10} label="Waste by source" formatValue={(v) => `${v} kg`} />
    </div>
  )
}
