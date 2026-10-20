'use client'

import { ArrowRightIcon, ArrowUpIcon, ZapIcon } from '@youj/icons'
import { ActivityRings, type ActivityRing } from '@youj/react'
import { Demo, TileCard } from './demo'

const DAY: ActivityRing[] = [
  { label: 'Move', value: 420, max: 500, unit: 'calories', tone: 'danger', icon: <ArrowRightIcon /> },
  { label: 'Exercise', value: 26, max: 30, unit: 'minutes', tone: 'success', icon: <ZapIcon /> },
  { label: 'Stand', value: 9, max: 12, unit: 'hours', tone: 'info', icon: <ArrowUpIcon /> },
]

/** A day's three goals, filling as they come into view, with the legend under them. */
export default function RingsTile() {
  return (
    <Demo>
      <TileCard className="max-w-72">
        <div className="flex items-baseline justify-between">
          <span className="text-ui font-semibold text-fg">Today</span>
          <span className="text-ui-sm text-fg-muted">3 goals</span>
        </div>
        <ActivityRings rings={DAY} size="default" legend="below" sound={false} />
      </TileCard>
    </Demo>
  )
}
