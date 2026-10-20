'use client'

import { useId, useState } from 'react'
import { CheckCircleIcon } from '@youj/icons'
import { SpotlightCard, SpotlightGrid } from '@youj/motion/interactions'

const REGIONS = [
  { code: 'iad1', city: 'Washington, D.C.', latency: 4 },
  { code: 'sfo1', city: 'San Francisco', latency: 62 },
  { code: 'fra1', city: 'Frankfurt', latency: 88 },
]

export default function SpotlightCardSelectable() {
  const name = useId()
  const [region, setRegion] = useState('iad1')

  return (
    <div className="@container w-full max-w-2xl">
      <fieldset className="min-w-0">
        <legend className="text-sm font-medium text-fg">Function region</legend>
        <p className="mt-0.5 mb-4 text-sm text-fg-muted">Your database is in iad1. Run your functions close to it.</p>
        {/* A radio fills each card, so the arrow keys move the selection and the light glides along with focus. */}
        <SpotlightGrid radius={160} className="grid-cols-1 gap-3 @md:grid-cols-3">
          {REGIONS.map((r) => (
            <SpotlightCard key={r.code} className="has-checked:border-accent">
              <label className="block h-full cursor-pointer rounded-xl p-4 has-focus-visible:ring-2 has-focus-visible:ring-accent">
                <input
                  type="radio"
                  name={name}
                  value={r.code}
                  checked={region === r.code}
                  onChange={() => setRegion(r.code)}
                  className="sr-only"
                />
                <span className="flex h-4 items-center justify-between">
                  <span className="font-mono text-xs text-fg-muted">{r.code}</span>
                  {region === r.code && <CheckCircleIcon size={16} trigger="mount" className="text-accent" />}
                </span>
                <span className="mt-5 block text-sm font-medium text-fg">{r.city}</span>
                <span className="mt-0.5 block text-xs text-fg-muted">{r.latency} ms to your database</span>
              </label>
            </SpotlightCard>
          ))}
        </SpotlightGrid>
      </fieldset>
    </div>
  )
}
