'use client'

import { useState } from 'react'
import { WheelPicker, type WheelPickerColumn } from '@youj/react'
import { Demo, TileCard } from './demo'

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

/** An alarm: spin or flick the hours, minutes and period. */
export default function WheelTile() {
  const [alarm, setAlarm] = useState<Record<string, string>>({ hour: '6', minute: '45', period: 'AM' })
  return (
    <Demo>
      <TileCard className="max-w-72 items-center">
        <p className="text-ui font-semibold text-fg">Wake me up</p>
        <WheelPicker size="lg" aria-label="Alarm" columns={COLUMNS} value={alarm} onValueChange={setAlarm} />
        <p className="text-ui-sm text-fg-muted tabular-nums">
          Alarm at {alarm.hour}:{alarm.minute} {alarm.period}
        </p>
      </TileCard>
    </Demo>
  )
}
