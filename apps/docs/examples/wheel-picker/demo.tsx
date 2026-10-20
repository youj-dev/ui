'use client'

import { useState } from 'react'
import { WheelPicker, type WheelPickerColumn } from '@youj/react'

const pad = (n: number) => String(n).padStart(2, '0')

const COLUMNS: WheelPickerColumn[] = [
  { id: 'hour', label: 'Hours', options: Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) })) },
  { id: 'minute', label: 'Minutes', options: Array.from({ length: 12 }, (_, i) => ({ value: pad(i * 5), label: pad(i * 5) })) },
  {
    id: 'period',
    label: 'AM or PM',
    options: [
      { value: 'AM', label: 'AM' },
      { value: 'PM', label: 'PM' },
    ],
  },
]

export default function WheelPickerDemo() {
  const [alarm, setAlarm] = useState<Record<string, string>>({ hour: '7', minute: '30', period: 'AM' })

  return (
    <div className="flex flex-col items-center gap-3">
      <WheelPicker aria-label="Alarm" columns={COLUMNS} value={alarm} onValueChange={setAlarm} />
      <p className="text-ui-sm text-fg-muted tabular-nums">
        Alarm at {alarm.hour}:{alarm.minute} {alarm.period}
      </p>
    </div>
  )
}
