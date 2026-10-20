'use client'

import { useState } from 'react'
import { Field, FieldDescription, FieldLabel, FieldLegend, FieldSet, RadioGroup, RadioGroupItem } from '@youj/react'

const CHANNELS = [
  { value: 'stable', label: 'Stable', note: 'Updates after two weeks in beta.' },
  { value: 'beta', label: 'Beta', note: 'New features a few days early.' },
  { value: 'canary', label: 'Canary', note: 'Every merged change. Expect rough edges.' },
]

export default function RadioGroupInline() {
  const [channel, setChannel] = useState('stable')
  const current = CHANNELS.find((c) => c.value === channel)

  return (
    <FieldSet className="w-full max-w-md">
      <FieldLegend variant="label">Release channel</FieldLegend>
      {/* A short set can sit in a row. Arrow keys move the choice in any layout. */}
      <RadioGroup value={channel} onValueChange={(value) => setChannel(value as string)} className="flex flex-wrap gap-x-6 gap-y-3">
        {CHANNELS.map((c) => (
          <Field key={c.value} orientation="horizontal" className="w-auto">
            <RadioGroupItem value={c.value} />
            <FieldLabel>{c.label}</FieldLabel>
          </Field>
        ))}
      </RadioGroup>
      <FieldDescription>{current?.note}</FieldDescription>
    </FieldSet>
  )
}
