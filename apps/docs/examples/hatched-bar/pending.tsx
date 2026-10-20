'use client'

import { Hatch } from '@youj/react'

const QUOTA = 400
const USED = 348
const PENDING = 118

export default function HatchedBarPending() {
  return (
    <div className="flex w-80 flex-col gap-2 text-ui">
      <div className="flex justify-between">
        <span>Quota</span>
        <span className="font-mono text-fg-muted tabular-nums">
          {USED} / {QUOTA} GB
        </span>
      </div>
      {/* Used is solid; what the cleanup will free is hatched inside it. The text below says both. */}
      <div aria-hidden className="flex h-2.5 overflow-hidden rounded-xs bg-well">
        <span className="bg-accent" style={{ width: `${((USED - PENDING) / QUOTA) * 100}%` }} />
        <Hatch tone="accent" className="rounded-none" style={{ width: `${(PENDING / QUOTA) * 100}%` }} />
      </div>
      <p className="text-ui-sm text-fg-muted">{PENDING} GB will be freed by the cleanup.</p>
    </div>
  )
}
