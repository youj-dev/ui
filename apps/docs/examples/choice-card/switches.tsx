'use client'

import { useState } from 'react'
import { ChoiceCard, ChoiceCardGroup, HatchedBar } from '@youj/react'
import { LayersIcon, MoonIcon, TimerIcon } from '@youj/icons'

const LEVERS = [
  { id: 'cache', icon: <LayersIcon />, title: 'Cache dependencies', saving: 0.32, minutes: '−410 min', description: 'Reuse installs between builds on the same lockfile.' },
  { id: 'sleep', icon: <MoonIcon />, title: 'Sleep idle previews', saving: 0.18, minutes: '−230 min', description: 'Previews nobody opened for a day stop until visited.' },
  { id: 'batch', icon: <TimerIcon />, title: 'Batch docs builds', saving: 0.09, minutes: '−115 min', description: 'Docs-only commits build once an hour.' },
]

export default function ChoiceCardSwitches() {
  const [on, setOn] = useState<Record<string, boolean>>({ cache: true })
  return (
    <ChoiceCardGroup control="switch" aria-label="Ways to save build minutes" columns={3} className="w-full max-w-3xl">
      {LEVERS.map((lever) => (
        <ChoiceCard
          key={lever.id}
          orientation="vertical"
          icon={lever.icon}
          title={lever.title}
          description={lever.description}
          checked={!!on[lever.id]}
          onCheckedChange={(checked) => setOn((prev) => ({ ...prev, [lever.id]: checked }))}
        >
          <div className="flex flex-col gap-2">
            <span className="text-ui-lg font-medium text-fg tabular-nums">{lever.minutes}</span>
            <div className="overflow-hidden rounded-full bg-band">
              <HatchedBar
                orientation="horizontal"
                value={lever.saving}
                max={0.4}
                tone={on[lever.id] ? 'success' : 'neutral'}
                fill={on[lever.id] ? 'solid' : 'hatched'}
              />
            </div>
          </div>
        </ChoiceCard>
      ))}
    </ChoiceCardGroup>
  )
}
