'use client'

import { useState } from 'react'
import { Button, ForecastBand, type ForecastPoint } from '@youj/react'

/** Nineteen days of cloud spend, lighter at weekends, as a running total. */
const DAILY = [412, 468, 455, 301, 288, 476, 490, 463, 471, 318, 296, 502, 488, 479, 495, 334, 305, 512, 497]
const ACTUAL = DAILY.reduce<number[]>((sums, day) => [...sums, (sums.at(-1) ?? 0) + day], [])

/** The other 11 days of September at `pace` a day, the likely range widening with each day out. */
function project(pace: number): ForecastPoint[] {
  const last = ACTUAL.at(-1)!
  return Array.from({ length: 11 }, (_, i) => {
    const value = last + pace * (i + 1)
    const spread = 160 * Math.sqrt(i + 1) + 25 * (i + 1)
    return { value, low: value - spread * 0.8, high: value + spread }
  })
}

export default function ForecastBandDemo() {
  const [pace, setPace] = useState(460)
  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      {/* max holds the scale still, so a new pace morphs the paths and glides the marker instead of rescaling. */}
      <ForecastBand
        actual={ACTUAL}
        forecast={project(pace)}
        budget={12000}
        max={15000}
        start="2026-09-01"
        format={{ style: 'currency', currency: 'USD' }}
        label="Cloud spend forecast for September"
      />
      <div className="flex gap-2">
        {[460, 520].map((p) => (
          <Button key={p} size="sm" variant={p === pace ? 'secondary' : 'outline'} onClick={() => setPace(p)}>
            ${p} a day
          </Button>
        ))}
      </div>
    </div>
  )
}
