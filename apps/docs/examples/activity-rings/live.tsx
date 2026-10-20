'use client'

import { useState } from 'react'
import { BriefcaseIcon, TimerIcon } from '@youj/icons'
import { ActivityRings, Button, type ActivityRing } from '@youj/react'

const START: ActivityRing[] = [
  { label: 'Focus', value: 70, max: 120, unit: 'minutes', tone: 'accent', icon: <TimerIcon /> },
  { label: 'Deep work', value: 1, max: 3, unit: 'blocks', tone: 'chart-2', icon: <BriefcaseIcon /> },
]

export default function ActivityRingsLive() {
  const [rings, setRings] = useState(START)
  // New values retarget from where each ring is; crossing a goal glows once.
  const log = () => setRings((rs) => rs.map((r) => ({ ...r, value: r.value >= r.max * 1.4 ? 0 : r.value + r.max / 6 })))

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-5 rounded-2xl border border-line bg-surface p-6">
      <ActivityRings rings={rings} legend="below" format={{ maximumFractionDigits: 0 }} />
      <Button variant="outline" size="sm" onClick={log}>
        Log progress
      </Button>
    </div>
  )
}
