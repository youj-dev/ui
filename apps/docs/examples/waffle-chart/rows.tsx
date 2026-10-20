'use client'

import { WaffleChart } from '@youj/react'

/** A team's storage, in GB, by file type. */
const STORAGE = [
  { id: 'video', name: 'Video', value: 412 },
  { id: 'images', name: 'Images', value: 236 },
  { id: 'docs', name: 'Documents', value: 128 },
  { id: 'archives', name: 'Archives', value: 94 },
  { id: 'other', name: 'Other', value: 50, tone: 'neutral' as const },
]

export default function WaffleChartRows() {
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <WaffleChart items={STORAGE} unit={10} columns={15} label="Storage by file type" formatValue={(v) => `${v} GB`} />
      <p className="text-sm text-fg-muted">Each cell is 10 GB.</p>
    </div>
  )
}
