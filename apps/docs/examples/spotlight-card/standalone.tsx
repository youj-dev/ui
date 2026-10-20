'use client'

import { SpotlightCard } from '@youj/motion/interactions'

const METRICS = [
  { label: 'p95 latency', value: '82', unit: 'ms', change: '−14% since last deploy', good: true },
  { label: 'Error rate', value: '0.08', unit: '%', change: '−0.02 pts this week', good: true },
  { label: 'Cold starts', value: '312', unit: '/ day', change: '+9% this week', good: false },
]

export default function SpotlightCardStandalone() {
  return (
    // A plain grid, not a SpotlightGrid: each card tracks the pointer on its own, so neighbors stay dark.
    <div className="@container w-full max-w-2xl">
      <div className="grid gap-3 @lg:grid-cols-3">
        {METRICS.map((m) => (
          <SpotlightCard key={m.label} radius={180} className="p-5">
            <p className="text-xs text-fg-muted">{m.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-fg">
              {m.value}
              <span className="ms-1 text-sm font-normal text-fg-muted">{m.unit}</span>
            </p>
            <p className={m.good ? 'mt-1 text-xs text-success' : 'mt-1 text-xs text-warning'}>{m.change}</p>
          </SpotlightCard>
        ))}
      </div>
    </div>
  )
}
