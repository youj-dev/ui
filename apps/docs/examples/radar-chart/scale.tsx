'use client'

import { RadarChart } from '@youj/react'

const AXES = [
  { id: 'sleep', label: 'Sleep' },
  { id: 'focus', label: 'Focus' },
  { id: 'mood', label: 'Mood' },
  { id: 'energy', label: 'Energy' },
  { id: 'calm', label: 'Calm' },
]

/** Two check-ins on a 0 to 10 scale. */
const SERIES = [
  { id: 'mon', name: 'Monday', values: [6, 7, 5, 6, 4], tone: 'chart-5' as const },
  { id: 'fri', name: 'Friday', values: [8, 6, 9, 7, 8], tone: 'chart-4' as const },
]

export default function RadarChartScale() {
  return (
    <div className="w-full max-w-md">
      <RadarChart axes={AXES} series={SERIES} max={10} rings={5} formatValue={(v) => `${v} of 10`} label="Week check-in" />
    </div>
  )
}
