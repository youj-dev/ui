'use client'

import { LollipopChart, type LollipopDatum } from '@youj/react'

/** A made-up league's teams, goal difference against par. */
const TEAMS: LollipopDatum[] = [
  { id: 'harbor', label: 'Harbor FC', value: 14 },
  { id: 'mill', label: 'Mill Lane', value: -9 },
  { id: 'north', label: 'North End', value: 6 },
  { id: 'quarry', label: 'Quarry Town', value: -17 },
  { id: 'river', label: 'Riverside', value: 2 },
  { id: 'station', label: 'Station Road', value: -3 },
  { id: 'vale', label: 'Vale Rovers', value: 21 },
  { id: 'wharf', label: 'Wharf United', value: 9 },
].map((team) => ({ ...team, tone: team.value < -5 ? 'danger' : team.value < 5 ? 'warning' : 'success' }))

export default function LollipopChartDemo() {
  return (
    <div className="w-full max-w-lg">
      <LollipopChart data={TEAMS} sort="ascending" formatValue={(v) => `${v > 0 ? '+' : ''}${v}`} label="Goal difference by team" />
    </div>
  )
}
