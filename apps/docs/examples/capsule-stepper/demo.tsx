'use client'

import { useState } from 'react'
import { CapsuleStepper } from '@youj/react'

export default function CapsuleStepperDemo() {
  const [zoom, setZoom] = useState<number | null>(1)
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <CapsuleStepper label="Tempo" defaultValue={124} min={60} max={200} unit="BPM" />
      <CapsuleStepper aria-label="Zoom" value={zoom} onValueChange={setZoom} min={0.25} max={4} step={0.25} format={{ style: 'percent' }} />
    </div>
  )
}
