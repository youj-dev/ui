'use client'

import { MoreHorizontalIcon } from '@youj/icons'
import { Button, Sparkline, StatBars, StatCard, StatMeter } from '@youj/react'

/* StatCard: one tile on its own Card, its parts as props, and one picture in
 * the `chart` slot. */
export default function StatCards() {
  return (
    <div className="grid w-full gap-3 sm:grid-cols-3">
      <StatCard
        label="Visitors"
        value={48210}
        previous={42891}
        locale="en-US"
        comparison="vs. last week"
        action={
          <Button variant="ghost" size="icon-xs" aria-label="Visitors options">
            <MoreHorizontalIcon />
          </Button>
        }
        chart={<StatBars data={[31, 33, 32, 36, 38, 37, 41, 44, 48]} tone="chart-1" label="Visitors by day, rising" />}
      />
      <StatCard
        label="Error rate"
        value={0.0021}
        previous={0.0029}
        invert
        locale="en-US"
        format={{ style: 'percent', maximumFractionDigits: 2 }}
        comparison="vs. last 30 days"
        chart={<Sparkline data={[29, 31, 27, 26, 28, 24, 25, 23, 22, 21]} color="var(--color-success)" className="h-9" />}
      />
      <StatCard
        label="Seats"
        value={42}
        unit="of 50"
        locale="en-US"
        comparison="8 left on this plan"
        chart={
          <StatMeter locale="en-US" value={42} max={50}>
            in use
          </StatMeter>
        }
      />
    </div>
  )
}
