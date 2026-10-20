'use client'

import { useState } from 'react'
import { Button, FlowLanes, type FlowLane } from '@youj/react'

/** A made-up balancer's requests a second, by pool. */
const POOLS: FlowLane[] = [
  { id: 'a', label: 'pool-a', value: 210, tone: 'chart-1' },
  { id: 'b', label: 'pool-b', value: 180, tone: 'chart-2' },
  { id: 'c', label: 'pool-c', value: 96, tone: 'chart-3' },
  { id: 'canary', label: 'canary', value: 12, tone: 'chart-5' },
]

export default function FlowLanesPointing() {
  const [active, setActive] = useState<string | null>('canary')
  return (
    <div className="grid w-full max-w-lg gap-4">
      <FlowLanes source="Balancer" lanes={POOLS} active={active} onActiveChange={setActive} formatValue={(v) => `${v}/s`} label="Requests by pool" />
      <div className="flex flex-wrap gap-2">
        {POOLS.map((pool) => (
          <Button
            key={pool.id}
            size="sm"
            variant={active === pool.id ? 'secondary' : 'outline'}
            aria-pressed={active === pool.id}
            onClick={() => setActive(active === pool.id ? null : pool.id)}
            className="font-mono"
          >
            {pool.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
