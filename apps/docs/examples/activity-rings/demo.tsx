'use client'

import { ArrowRightIcon, ArrowUpIcon, ZapIcon } from '@youj/icons'
import { ActivityRings, type ActivityRing } from '@youj/react'

// A day's three goals, outermost first. Each ring is its own goal: `value` of `max`.
const DAY: ActivityRing[] = [
  { label: 'Move', value: 420, max: 500, unit: 'calories', tone: 'danger', icon: <ArrowRightIcon /> },
  { label: 'Exercise', value: 26, max: 30, unit: 'minutes', tone: 'success', icon: <ZapIcon /> },
  { label: 'Stand', value: 9, max: 12, unit: 'hours', tone: 'info', icon: <ArrowUpIcon /> },
]

export default function ActivityRingsDemo() {
  return (
    <div className="w-full max-w-xl rounded-2xl border border-line bg-surface p-6">
      <ActivityRings rings={DAY} size="lg" legend="side" />
    </div>
  )
}
