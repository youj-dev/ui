'use client'

import { PhoneInput } from '@youj/react'

// E.164 values: each picks its country and shows in that country's pattern.
const NUMBERS = [
  { label: 'London office', value: '+442079460958' },
  { label: 'Paris mobile', value: '+33612345678' },
  { label: 'Tokyo mobile', value: '+819012345678' },
  { label: 'São Paulo mobile', value: '+5511912345678' },
]

export default function PhoneInputFormats() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      {NUMBERS.map((number) => (
        <PhoneInput key={number.value} aria-label={number.label} defaultValue={number.value} />
      ))}
    </div>
  )
}
