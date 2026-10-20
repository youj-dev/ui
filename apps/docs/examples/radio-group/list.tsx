'use client'

import { Field, FieldContent, FieldDescription, FieldLabel, FieldLegend, FieldSet, RadioGroup, RadioGroupItem } from '@youj/react'

const MACHINES = [
  { value: 'standard', label: 'Standard', detail: '4 vCPUs, 8 GB of memory' },
  { value: 'enhanced', label: 'Enhanced', detail: '8 vCPUs, 16 GB of memory' },
  { value: 'turbo', label: 'Turbo', detail: '30 vCPUs, 60 GB. Enterprise plans only.', disabled: true },
]

export default function RadioGroupList() {
  return (
    <FieldSet className="w-full max-w-sm">
      <FieldLegend variant="label">Build machine</FieldLegend>
      <RadioGroup defaultValue="standard" name="machine">
        {MACHINES.map((machine) => (
          <Field key={machine.value} orientation="horizontal" disabled={machine.disabled}>
            <RadioGroupItem value={machine.value} />
            <FieldContent>
              <FieldLabel>{machine.label}</FieldLabel>
              <FieldDescription>{machine.detail}</FieldDescription>
            </FieldContent>
          </Field>
        ))}
      </RadioGroup>
    </FieldSet>
  )
}
