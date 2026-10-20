'use client'

import { useState } from 'react'
import { addDays, differenceInCalendarDays, startOfDay } from 'date-fns'
import { Field, FieldDescription, FieldLabel } from '@youj/react'
import { DateRangePicker, type DateRangePickerProps } from '@youj/react/date'

type DateRange = NonNullable<DateRangePickerProps['value']>

export default function DateRangePickerDemo() {
  const today = startOfDay(new Date())
  const [range, setRange] = useState<DateRange | null>({ from: addDays(today, -6), to: today })
  const days = range?.from && range.to ? differenceInCalendarDays(range.to, range.from) + 1 : 0

  return (
    <Field className="w-full max-w-80">
      <FieldLabel>Reporting period</FieldLabel>
      <DateRangePicker value={range} onValueChange={setRange} maxDate={today} />
      <FieldDescription>{days ? `Comparing ${days} days of traffic.` : 'Pick a period to compare.'}</FieldDescription>
    </Field>
  )
}
