'use client'

import { useState } from 'react'
import { Field, FieldDescription, FieldLabel, NumberInput } from '@youj/react'

export default function NumberInputDemo() {
  const [budget, setBudget] = useState<number | null>(2400)

  return (
    <Field className="w-64">
      <FieldLabel>Monthly budget</FieldLabel>
      <NumberInput
        value={budget}
        onValueChange={setBudget}
        min={0}
        max={50000}
        step={100}
        largeStep={1000}
        format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}
      />
      <FieldDescription>Alerts at 80%. Shift+arrows step by $1,000.</FieldDescription>
    </Field>
  )
}
