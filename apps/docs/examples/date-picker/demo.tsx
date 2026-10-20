'use client'

import { useState } from 'react'
import { addDays, format } from 'date-fns'
import { Field, FieldDescription, FieldLabel } from '@youj/react'
import { DatePicker } from '@youj/react/date'

export default function DatePickerDemo() {
  const [date, setDate] = useState<Date | null>(() => addDays(new Date(), 12))

  return (
    <Field className="w-full max-w-72">
      <FieldLabel>Due date</FieldLabel>
      <DatePicker value={date} onValueChange={setDate} />
      <FieldDescription>{date ? `Due ${format(date, 'EEEE, MMMM d')}.` : 'No due date.'} Type a date or pick one.</FieldDescription>
    </Field>
  )
}
