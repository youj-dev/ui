'use client'

import { useState } from 'react'
import { DistributionStrip, SegmentedControl, SegmentedControlItem } from '@youj/react'

/** Latencies in ms around `median`, log-normal with a slow tail, from a fixed seed so the page draws the same requests every time. */
function sampleLatencies(count: number, median: number, seed: number) {
  let t = seed
  const random = () => {
    t = (t + 0x6d2b79f5) | 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
  const normal = () => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random())
  return Array.from({ length: count }, () => {
    const slow = random() < 0.05
    return Math.exp(Math.log(slow ? median * 4.5 : median) + normal() * (slow ? 0.55 : 0.42))
  })
}

const WINDOWS = {
  before: sampleLatencies(320, 82, 7),
  after: sampleLatencies(320, 118, 11),
}

export default function DistributionStripDemo() {
  const [window, setWindow] = useState<keyof typeof WINDOWS>('before')
  return (
    <div className="flex w-full max-w-2xl flex-col gap-5">
      <SegmentedControl aria-label="Window" value={window} onValueChange={(value) => setWindow(value as keyof typeof WINDOWS)} className="self-start">
        <SegmentedControlItem value="before">Before the deploy</SegmentedControlItem>
        <SegmentedControlItem value="after">After the deploy</SegmentedControlItem>
      </SegmentedControl>
      {/* Switching morphs the swarm: each quantile slides to where it now falls. */}
      <DistributionStrip samples={WINDOWS[window]} slo={300} label="checkout-api" />
    </div>
  )
}
