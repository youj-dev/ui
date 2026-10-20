'use client'

import { Field, FieldLabel } from '@youj/react'
import { MultiSelect } from '@youj/react/command'

const REGIONS = [
  { value: 'iad', label: 'Washington, D.C.', group: 'Americas' },
  { value: 'sfo', label: 'San Francisco', group: 'Americas' },
  { value: 'gru', label: 'São Paulo', group: 'Americas' },
  { value: 'fra', label: 'Frankfurt', group: 'Europe' },
  { value: 'lhr', label: 'London', group: 'Europe' },
  { value: 'hnd', label: 'Tokyo', group: 'Asia Pacific' },
  { value: 'syd', label: 'Sydney', group: 'Asia Pacific' },
]

export default function MultiSelectOverflow() {
  return (
    <Field className="w-60">
      <FieldLabel>Regions</FieldLabel>
      {/* The popup can be wider than a narrow field. */}
      <MultiSelect options={REGIONS} defaultValue={['iad', 'sfo', 'fra', 'hnd', 'syd']} contentClassName="w-72" />
    </Field>
  )
}
