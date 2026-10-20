'use client'

import { useState } from 'react'
import { cn } from '@youj/core'
import { SpotlightGroup, SpotlightSurface } from '@youj/motion'
import { CheckIcon } from '@youj/icons'

const PLANS = [
  { id: 'hobby', name: 'Hobby', price: '$0', note: 'For side projects', features: ['1 project', 'Preview deploys', 'Community support'] },
  { id: 'pro', name: 'Pro', price: '$24', note: 'Per seat, per month', features: ['Unlimited projects', 'Password protection', 'Priority builds'] },
  { id: 'team', name: 'Team', price: '$64', note: 'Per seat, per month', features: ['SSO and audit log', 'Role-based access', '99.99% uptime SLA'] },
]

export default function SpotlightDemo() {
  const [plan, setPlan] = useState('pro')

  return (
    <fieldset className="@container w-full max-w-2xl">
      <legend className="mb-3 text-sm font-medium text-fg">Choose a plan</legend>
      {/* One light for all three surfaces: near a card's edge, its neighbor lights up too. */}
      <SpotlightGroup radius={220} className="grid gap-3 @xl:grid-cols-3">
        {PLANS.map((p) => {
          const selected = plan === p.id
          return (
            <SpotlightSurface
              key={p.id}
              className={cn(
                'rounded-2xl border bg-surface transition-colors duration-(--yj-duration-fast) ease-standard has-focus-visible:ring-2 has-focus-visible:ring-accent',
                selected ? 'border-accent' : 'border-line',
              )}
            >
              <label className="flex h-full cursor-pointer flex-col p-5">
                <input type="radio" name="plan" value={p.id} checked={selected} onChange={() => setPlan(p.id)} className="sr-only" />
                <span className="flex items-center justify-between">
                  <span className="text-sm font-medium text-fg">{p.name}</span>
                  <span
                    aria-hidden
                    className={cn(
                      'grid size-4 place-items-center rounded-full border',
                      selected ? 'border-accent bg-accent text-on-accent' : 'border-line-strong',
                    )}
                  >
                    {selected && <CheckIcon size={11} strokeWidth={3} trigger="mount" />}
                  </span>
                </span>
                <span className="mt-4 text-2xl font-semibold tracking-tight text-fg">{p.price}</span>
                <span className="text-xs text-fg-muted">{p.note}</span>
                <span className="mt-4 flex flex-col gap-1.5 text-[13px] text-fg-muted">
                  {p.features.map((f) => (
                    <span key={f} className="flex items-center gap-2">
                      <CheckIcon size={13} trigger="none" className="text-accent" />
                      {f}
                    </span>
                  ))}
                </span>
              </label>
            </SpotlightSurface>
          )
        })}
      </SpotlightGroup>
    </fieldset>
  )
}
