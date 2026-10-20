'use client'

import { Field, FieldDescription, FieldLabel } from '@youj/react'
import { DateRangePicker } from '@youj/react/date'

export default function DateRangePickerPlanning() {
  return (
    <Field className="w-full max-w-80">
      <FieldLabel>Freeze window</FieldLabel>
      <DateRangePicker presets={false} minDate={new Date()} disabledDates={{ dayOfWeek: [0, 6] }} />
      <FieldDescription>No deploys to production between these dates.</FieldDescription>
    </Field>
  )
}
