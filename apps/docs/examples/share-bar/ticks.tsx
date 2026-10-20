'use client'

import { useState } from 'react'
import { ShareBar, type ShareBarTone } from '@youj/react'

const SUITES: { label: string; value: number; tone: ShareBarTone; color: string }[] = [
  { label: 'Passing', value: 34, tone: 'success', color: 'var(--color-success)' },
  { label: 'Flaky', value: 7, tone: 'warning', color: 'var(--color-warning)' },
  { label: 'Failing', value: 3, tone: 'danger', color: 'var(--color-danger)' },
  { label: 'Skipped', value: 12, tone: 'neutral', color: 'var(--color-fg-subtle)' },
]

export default function ShareBarTicks() {
  const [active, setActive] = useState<number | null>(null)
  return (
    <div className="flex w-full max-w-xs flex-col gap-3 rounded-xl border border-line bg-surface p-4 text-ui">
      <div className="flex items-baseline justify-between">
        <span className="font-medium">Test suites</span>
        <span className="font-mono text-ui-sm text-fg-muted tabular-nums">56 suites</span>
      </div>
      <ShareBar parts={SUITES} segments={48} mark="tick" active={active} label="Test suites by result" />
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-ui-sm">
        {SUITES.map((suite, i) => (
          <li key={suite.label} className="flex items-center gap-1.5" onPointerEnter={() => setActive(i)} onPointerLeave={() => setActive(null)}>
            <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: suite.color }} />
            <span className="font-mono font-medium tabular-nums">{suite.value}</span>
            <span className="text-fg-muted">{suite.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
