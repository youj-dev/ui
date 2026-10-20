'use client'

import { StatDelta } from '@youj/react'

export default function StatDeltas() {
  return (
    <div className="flex flex-col gap-2.5">
      <StatDelta locale="en-US" value={0.124}>
        vs. last month
      </StatDelta>
      <StatDelta locale="en-US" value={-0.031}>
        vs. last month
      </StatDelta>
      <StatDelta locale="en-US" value={-0.092} invert>
        p95 latency, vs. yesterday
      </StatDelta>
      <StatDelta locale="en-US" value={0}>
        vs. last week
      </StatDelta>
      <StatDelta locale="en-US" value={4} format={{ maximumFractionDigits: 0 }}>
        accounts since Monday
      </StatDelta>
    </div>
  )
}
