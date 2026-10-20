'use client'

import { useState } from 'react'
import { Toggle } from '@youj/react'
import { cn } from '@youj/core'
import { ClockIcon, CornerDownLeftIcon, PinIcon } from '@youj/icons'

const LOG = [
  { time: '14:02:11.204', line: 'Cloning github.com/youj/web (branch main, commit 4f2a91c)' },
  { time: '14:02:13.871', line: 'Installing dependencies from pnpm-lock.yaml with pnpm 10.34' },
  { time: '14:02:26.040', line: 'Compiled 48 routes in 11.8s, 3 of them static with a 60 second revalidation window' },
  { time: '14:02:39.512', line: 'Deployed to production at youj.io' },
]

export default function ToggleDemo() {
  const [timestamps, setTimestamps] = useState(true)
  const [wrap, setWrap] = useState(false)
  const [pinned, setPinned] = useState(false)

  return (
    <div className="w-full max-w-xl overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
      <div className="flex items-center gap-1.5 border-b border-line py-2 ps-4 pe-2">
        <p className="min-w-0 flex-1 truncate text-ui font-medium text-fg">Build logs</p>
        <Toggle variant="outline" size="sm" pressed={timestamps} onPressedChange={setTimestamps}>
          <ClockIcon />
          Timestamps
        </Toggle>
        <Toggle variant="outline" size="sm" pressed={wrap} onPressedChange={setWrap}>
          <CornerDownLeftIcon />
          Wrap
        </Toggle>
        {/* Icon-only: the name stays the same, and aria-pressed carries the state. */}
        <Toggle size="sm" aria-label="Pin to sidebar" pressed={pinned} onPressedChange={setPinned}>
          <PinIcon active={pinned} />
        </Toggle>
      </div>
      <ol className="flex flex-col gap-1 px-4 py-3 font-mono text-ui-sm">
        {LOG.map(({ time, line }) => (
          <li key={time} className="flex gap-3">
            {timestamps && <span className="shrink-0 text-fg-muted tabular-nums">{time}</span>}
            <span className={cn('min-w-0 text-fg', wrap ? 'break-words' : 'truncate')}>{line}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
