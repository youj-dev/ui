'use client'

import { useState } from 'react'
import { addDays } from 'date-fns'
import { Calendar, type DateRangePickerProps } from '@youj/react/date'

type DateRange = NonNullable<DateRangePickerProps['value']>

export default function CalendarRange() {
  const today = new Date()
  const [range, setRange] = useState<DateRange | undefined>({ from: addDays(today, -3), to: addDays(today, 9) })

  return (
    <div className="rounded-xl border border-line bg-surface p-3 shadow-xs">
      <Calendar mode="range" numberOfMonths={2} showOutsideDays={false} fixedWeeks={false} selected={range} onSelect={setRange} />
    </div>
  )
}
