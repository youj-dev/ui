'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar } from '@youj/react/date'

export default function CalendarDemo() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-xl border border-line bg-surface p-3 shadow-xs">
        <Calendar mode="single" selected={date} onSelect={setDate} />
      </div>
      <p className="text-ui-sm text-fg-muted" aria-live="polite">
        {date ? format(date, 'EEEE, MMMM d, yyyy') : 'No date selected'}
      </p>
    </div>
  )
}
