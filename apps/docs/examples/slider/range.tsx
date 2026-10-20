'use client'

import { useState } from 'react'
import { Field, FieldDescription, FieldLabel, Slider } from '@youj/react'

export default function SliderRange() {
  const [range, setRange] = useState([120, 480])

  return (
    <Field className="w-full max-w-sm">
      <div className="flex items-baseline justify-between gap-4">
        <FieldLabel>Response time</FieldLabel>
        <span className="font-mono text-ui text-fg tabular-nums">
          {range[0]}–{range[1]} ms
        </span>
      </div>
      {/* Two values make a range. Each thumb gets its own name. */}
      <Slider
        value={range}
        onValueChange={(value) => setRange(value as number[])}
        min={0}
        max={1000}
        step={10}
        minStepsBetweenValues={5}
        thumbLabels={['Fastest response', 'Slowest response']}
      />
      <FieldDescription>Show requests that took this long to answer.</FieldDescription>
    </Field>
  )
}
