'use client'

import { useState } from 'react'
import { HoursDial, SegmentedControl, SegmentedControlItem, type HoursDialValue } from '@youj/react'

type Days = 'weekdays' | 'weekend'

export default function HoursDialDemo() {
  const [days, setDays] = useState<Days>('weekdays')
  const [sleep, setSleep] = useState<Record<Days, HoursDialValue>>({
    weekdays: { start: 22 * 60 + 30, end: 6 * 60 + 45 },
    weekend: { start: 23 * 60 + 30, end: 8 * 60 + 30 },
  })
  return (
    <div className="flex w-full max-w-72 flex-col items-center gap-5">
      <SegmentedControl aria-label="Days" value={days} onValueChange={(v) => setDays(v as Days)} className="w-full">
        <SegmentedControlItem value="weekdays" className="flex-1">
          Weekdays
        </SegmentedControlItem>
        <SegmentedControlItem value="weekend" className="flex-1">
          Weekend
        </SegmentedControlItem>
      </SegmentedControl>
      <HoursDial label="Sleep schedule" caption="Asleep" value={sleep[days]} onValueChange={(v) => setSleep((s) => ({ ...s, [days]: v }))} />
    </div>
  )
}
