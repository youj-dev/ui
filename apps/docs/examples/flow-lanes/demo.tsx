'use client'

import { FlowLanes, type FlowLane } from '@youj/react'

/** A made-up delivery hub's parcels per minute, by route. */
const LANES: FlowLane[] = [
  { id: 'north', label: 'North loop', value: 64 },
  { id: 'harbor', label: 'Harbor run', value: 142 },
  { id: 'airport', label: 'Airport express', value: 88 },
  { id: 'hills', label: 'Hill towns', value: 31 },
]

export default function FlowLanesDemo() {
  return (
    <div className="w-full max-w-lg">
      <FlowLanes source="Hub" lanes={LANES} formatValue={(v) => `${v}/min`} label="Parcels by route" />
    </div>
  )
}
