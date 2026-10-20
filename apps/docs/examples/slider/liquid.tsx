'use client'

import { useState } from 'react'
import { Field, FieldDescription, FieldLabel, Slider } from '@youj/react'

export default function SliderLiquid() {
  const [level, setLevel] = useState(64)

  return (
    <Field className="w-full max-w-sm rounded-xl border border-line bg-surface p-5">
      <div className="flex items-baseline justify-between gap-4">
        <FieldLabel>Tank level</FieldLabel>
        <span className="font-mono text-ui text-fg tabular-nums">{level}%</span>
      </div>
      <Slider variant="liquid" value={level} onValueChange={(value) => setLevel(value as number)} format={{ style: 'unit', unit: 'percent' }} />
      <FieldDescription>Refill starts when the tank drops below 20%.</FieldDescription>
    </Field>
  )
}
