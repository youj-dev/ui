'use client'

import { useState } from 'react'
import { MilestoneRuler, type Milestone } from '@youj/react'

/** One quarter of a launch plan, on the success tone. */
const MILESTONES: Milestone[] = [
  { id: 'design', date: '2026-10-09', title: 'Design review', description: 'Flows signed off' },
  { id: 'build', date: '2026-11-02', title: 'Feature complete', description: 'Code freeze on main', major: true },
  { id: 'qa', date: '2026-11-20', title: 'QA sign-off' },
  { id: 'ship', date: '2026-12-08', title: 'Ship', description: 'To every workspace', major: true },
]

export default function MilestoneRulerQuarter() {
  const [picked, setPicked] = useState<string | null>('build')
  const milestone = MILESTONES.find((m) => m.id === picked)
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <MilestoneRuler
        milestones={MILESTONES}
        start="2026-10-01"
        end="2026-12-31"
        today="2026-10-20"
        tone="success"
        value={picked}
        onValueChange={setPicked}
        label="Q4 launch plan"
      />
      <p className="text-ui text-fg-muted">
        Picked: <span className="text-fg">{milestone?.title ?? 'nothing'}</span>
      </p>
    </div>
  )
}
