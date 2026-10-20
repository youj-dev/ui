'use client'

import { useState } from 'react'
import { Field, FieldDescription, FieldLabel, Slider } from '@youj/react'

const usd = { style: 'currency', currency: 'USD', maximumFractionDigits: 0 } as const
const formatter = new Intl.NumberFormat('en-US', usd)

export default function SliderDemo() {
  const [limit, setLimit] = useState(400)

  return (
    <Field className="w-full max-w-sm rounded-xl border border-line bg-surface p-5">
      <div className="flex items-baseline justify-between gap-4">
        <FieldLabel>Monthly spend limit</FieldLabel>
        <span className="font-mono text-ui text-fg tabular-nums">{formatter.format(limit)}</span>
      </div>
      {/* `format` makes assistive tech hear "$400", not "400". */}
      <Slider value={limit} onValueChange={(value) => setLimit(value as number)} min={0} max={2000} step={50} format={usd} locale="en-US" />
      <FieldDescription>We pause deployments at the limit and email the owners at 80%.</FieldDescription>
    </Field>
  )
}
