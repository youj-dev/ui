'use client'

import { Gauge, type GaugeThreshold } from '@youj/react'

const LOAD: GaugeThreshold[] = [
  { value: 70, tone: 'warning', label: 'Busy' },
  { value: 90, tone: 'danger', label: 'Saturated' },
]

export default function GaugeThresholds() {
  return (
    <div className="flex flex-wrap items-end justify-center gap-8">
      <Gauge value={34} size="sm" thresholds={LOAD} format={{ style: 'unit', unit: 'percent' }} label="Web" />
      <Gauge value={76} size="default" thresholds={LOAD} format={{ style: 'unit', unit: 'percent' }} label="Workers" />
      <Gauge value={95} size="sm" thresholds={LOAD} format={{ style: 'unit', unit: 'percent' }} label="Database" />
    </div>
  )
}
