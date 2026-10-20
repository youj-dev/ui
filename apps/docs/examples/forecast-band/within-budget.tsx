'use client'

import { ForecastBand, type ForecastPoint } from '@youj/react'

/** Twenty-one days of ad spend at about $180 a day, as a running total. */
const ACTUAL = Array.from({ length: 21 }, (_, i) => Math.round((i + 1) * 180 + Math.sin(i * 1.7) * 60))

/** The last 9 days at a slower $150 a day; the range still reaches toward the budget. */
const FORECAST: ForecastPoint[] = Array.from({ length: 9 }, (_, i) => {
  const value = ACTUAL.at(-1)! + 150 * (i + 1)
  const spread = 90 * Math.sqrt(i + 1) + 20 * (i + 1)
  return { value, low: value - spread, high: value + spread * 1.2 }
})

export default function ForecastBandWithinBudget() {
  return (
    <div className="w-full max-w-2xl">
      {/* No crossing: no marker, and the summary says it stays within budget. */}
      <ForecastBand
        actual={ACTUAL}
        forecast={FORECAST}
        budget={6000}
        start="2026-06-01"
        format={{ style: 'currency', currency: 'EUR' }}
        tone="chart-3"
        label="Ad spend forecast for June"
      />
    </div>
  )
}
