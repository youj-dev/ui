'use client'

import { addDays, isWeekend } from 'date-fns'
import { Field, FieldDescription, FieldLabel } from '@youj/react'
import { DatePicker } from '@youj/react/date'

export default function DatePickerBounds() {
  const today = new Date()

  return (
    <Field className="w-full max-w-72">
      <FieldLabel>Launch</FieldLabel>
      <DatePicker minDate={today} maxDate={addDays(today, 60)} disabledDates={isWeekend} />
      <FieldDescription>A weekday in the next 60 days. Try typing a Saturday.</FieldDescription>
    </Field>
  )
}
