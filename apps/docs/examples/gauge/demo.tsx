'use client'

import { useState } from 'react'
import { Button, Gauge, type GaugeThreshold } from '@youj/react'

const INDEX: GaugeThreshold[] = [
  { value: 0, tone: 'danger', label: 'Critical' },
  { value: 50, tone: 'warning', label: 'Strained' },
  { value: 80, tone: 'success', label: 'Nominal' },
]

export default function GaugeDemo() {
  const [index, setIndex] = useState(74)
  return (
    <div className="flex flex-col items-center gap-4">
      <Gauge value={index} size="lg" gradient thresholds={INDEX} label="Health index" />
      <p className="text-ui text-fg-muted">
        <span className="font-mono text-fg">payments-api</span> · 6 h window
      </p>
      <div className="flex gap-2">
        {[38, 74, 91].map((v) => (
          <Button key={v} size="sm" variant={v === index ? 'secondary' : 'outline'} onClick={() => setIndex(v)}>
            {v}
          </Button>
        ))}
      </div>
    </div>
  )
}
