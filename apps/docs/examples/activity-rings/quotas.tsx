'use client'

import { PhoneIcon, TargetIcon, UsersIcon } from '@youj/icons'
import { ActivityRings, type ActivityRing } from '@youj/react'

// Two quotas past their goal: those rings run a second lap over the first.
const QUARTER: ActivityRing[] = [
  { label: 'New revenue', value: 1_380_000, max: 1_000_000, unit: 'USD', tone: 'accent', icon: <TargetIcon /> },
  { label: 'Meetings booked', value: 162, max: 120, tone: 'chart-2', icon: <UsersIcon /> },
  { label: 'Calls', value: 1_740, max: 2_000, tone: 'chart-3', icon: <PhoneIcon /> },
]

export default function ActivityRingsQuotas() {
  return (
    <div className="w-80 rounded-2xl border border-line bg-surface p-6">
      <ActivityRings rings={QUARTER} size="xl" legend="below" format={{ notation: 'compact', maximumFractionDigits: 1 }} />
    </div>
  )
}
