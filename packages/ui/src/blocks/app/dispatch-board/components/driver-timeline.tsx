'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { TimeLanes } from '../../../../components/ui/time-lanes'
import { at, NOW, type Load, type Proposal } from '../data'
import { lanesFor, shiftsFor, type Decisions } from '../model'

/** Every driver's day as lanes of runs, late overruns in danger and proposed runs dashed, with now at 11:58. */
export function DriverTimeline({
  loads,
  proposals,
  decisions,
  hours = 9,
  title = 'Driver timeline',
}: {
  loads: Load[]
  proposals: Proposal[]
  decisions: Decisions
  hours?: number
  title?: string
}) {
  return (
    <Card role="region" aria-labelledby="driver-timeline" size="sm" className="min-w-0">
      <CardHeader>
        <CardTitle>
          <h2 id="driver-timeline">{title}</h2>
        </CardTitle>
        <CardDescription>Today · 08:00 to {String(8 + hours).padStart(2, '0')}:00 · proposals are dashed</CardDescription>
      </CardHeader>
      <CardContent>
        <TimeLanes
          lanes={lanesFor(loads)}
          shifts={shiftsFor(loads, proposals, decisions)}
          start={at(8 * 60)}
          hours={hours}
          now={at(NOW)}
          label={title}
        />
      </CardContent>
    </Card>
  )
}
