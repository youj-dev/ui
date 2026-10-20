'use client'

import { Field, FieldError, FieldLabel } from '@youj/react'
import { DatePicker } from '@youj/react/date'

export default function DatePickerStates() {
  return (
    <div className="flex w-full max-w-72 flex-col gap-6">
      <Field invalid required>
        <FieldLabel>Start date</FieldLabel>
        <DatePicker />
        <FieldError>Pick a start date.</FieldError>
      </Field>
      <Field disabled>
        <FieldLabel>Created</FieldLabel>
        <DatePicker defaultValue={new Date(2026, 0, 14)} disabled />
      </Field>
    </div>
  )
}
