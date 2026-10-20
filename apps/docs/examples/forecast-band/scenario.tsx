'use client'

import { ForecastBand, type ForecastPoint } from '@youj/react'

/** Eighteen days of a team's API spend at about $260 a day, as a running total. */
const ACTUAL = Array.from({ length: 18 }, (_, i) => Math.round((i + 1) * 260 + Math.sin(i * 1.3) * 90))

/** The rest of the month at the current pace, the range widening with each day out. */
const FORECAST: ForecastPoint[] = Array.from({ length: 12 }, (_, i) => {
  const value = ACTUAL.at(-1)! + 265 * (i + 1)
  const spread = 120 * Math.sqrt(i + 1) + 18 * (i + 1)
  return { value, low: value - spread, high: value + spread }
})

/** If the batch jobs move to the cheaper tier from tomorrow: about $190 a day. */
const CHEAPER_TIER = FORECAST.map((_, i) => ACTUAL.at(-1)! + 190 * (i + 1))

export default function ForecastBandScenario() {
  return (
    <div className="w-full max-w-2xl">
      <ForecastBand
        actual={ACTUAL}
        forecast={FORECAST}
        budget={7500}
        start="2026-11-01"
        format={{ style: 'currency', currency: 'USD' }}
        label="API spend forecast for November"
        scenario={{ label: 'Batch jobs on the cheaper tier', values: CHEAPER_TIER, tone: 'chart-1' }}
      />
    </div>
  )
}
