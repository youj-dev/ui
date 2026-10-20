'use client'

import { Field, FieldError, FieldLabel, NativeSelect, NativeSelectOption } from '@youj/react'

const SIZES = ['sm', 'default', 'lg'] as const

export default function NativeSelectStates() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-6">
      <div className="flex items-center gap-2">
        {SIZES.map((size) => (
          <NativeSelect key={size} size={size} aria-label={`Priority (${size})`} defaultValue="high">
            <NativeSelectOption value="urgent">Urgent</NativeSelectOption>
            <NativeSelectOption value="high">High</NativeSelectOption>
            <NativeSelectOption value="low">Low</NativeSelectOption>
          </NativeSelect>
        ))}
      </div>

      {/* An empty value reads as a placeholder. */}
      <Field data-invalid>
        <FieldLabel htmlFor="plan">Plan</FieldLabel>
        <NativeSelect id="plan" aria-invalid defaultValue="" className="w-full">
          <NativeSelectOption value="" disabled>
            Choose a plan
          </NativeSelectOption>
          <NativeSelectOption value="hobby">Hobby</NativeSelectOption>
          <NativeSelectOption value="pro">Pro</NativeSelectOption>
        </NativeSelect>
        <FieldError>Pick a plan to continue.</FieldError>
      </Field>

      <NativeSelect aria-label="Team" disabled defaultValue="design" className="w-full">
        <NativeSelectOption value="design">Design</NativeSelectOption>
      </NativeSelect>
    </div>
  )
}
