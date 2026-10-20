'use client'

import { useState } from 'react'
import { Field, FieldDescription, FieldLabel, Slider } from '@youj/react'

export default function SliderTicks() {
  const [seats, setSeats] = useState(14)

  return (
    <Field className="w-full max-w-sm rounded-xl border border-line bg-surface p-5">
      <div className="flex items-baseline justify-between gap-4">
        <FieldLabel>Seats</FieldLabel>
        <span className="font-mono text-ui text-fg tabular-nums">{seats} seats</span>
      </div>
      <Slider variant="ticks" tone="chart-4" value={seats} onValueChange={(value) => setSeats(value as number)} min={1} max={40} />
      <FieldDescription>Each seat is $9 a month, billed with the plan.</FieldDescription>
    </Field>
  )
}
