'use client'

import { useEffect, useState } from 'react'
import { Gauge, type GaugeThreshold } from '@youj/react'
import { Demo } from './demo'

const HEALTH: GaugeThreshold[] = [
  { value: 0, tone: 'danger', label: 'Critical' },
  { value: 50, tone: 'warning', label: 'Strained' },
  { value: 80, tone: 'success', label: 'Nominal' },
]
const READINGS = [74, 88, 61, 92, 79]

/** A service's health index, its needle easing between readings. */
export default function GaugeTile() {
  const [at, setAt] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setAt((n) => n + 1), 2600)
    return () => clearInterval(id)
  }, [])
  return (
    <Demo>
      <div className="explore-box flex flex-col items-center gap-4">
        <Gauge value={READINGS[at % READINGS.length]!} gradient thresholds={HEALTH} label="Health index" />
        <p className="text-ui-sm text-fg-muted">
          <span className="font-mono text-fg">payments-api</span> · 6 h
        </p>
      </div>
    </Demo>
  )
}
