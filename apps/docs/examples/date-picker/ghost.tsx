'use client'

import { DatePicker } from '@youj/react/date'

export default function DatePickerGhost() {
  return (
    <dl className="grid w-full max-w-xs grid-cols-[6rem_1fr] items-center gap-x-3 gap-y-1 text-ui">
      <dt className="text-fg-muted">Start date</dt>
      <dd>
        <DatePicker variant="ghost" size="sm" aria-label="Start date" defaultValue={new Date(2026, 8, 21)} />
      </dd>
      <dt className="text-fg-muted">Due date</dt>
      <dd>
        <DatePicker variant="ghost" size="sm" aria-label="Due date" placeholder="No due date" />
      </dd>
    </dl>
  )
}
