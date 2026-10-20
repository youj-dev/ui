'use client'

import { useState } from 'react'
import { addDays, format, isWeekend } from 'date-fns'
import { Calendar } from '@youj/react/date'

export default function CalendarBounded() {
  const today = new Date()
  const last = addDays(today, 60)
  const [date, setDate] = useState<Date | undefined>()

  return (
    <div className="rounded-xl border border-line bg-surface p-3 shadow-xs">
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        startMonth={today}
        endMonth={last}
        disabled={[{ before: today }, { after: last }, isWeekend]}
        footer={date ? `Deploy window: ${format(date, 'PPP')}` : 'Weekdays in the next 60 days.'}
      />
    </div>
  )
}
