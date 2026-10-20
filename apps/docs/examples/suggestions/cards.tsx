'use client'

import { useState } from 'react'
import { ChatSuggestions } from '@youj/react'
import { BarChartIcon, BugIcon, GitBranchIcon, RocketIcon } from '@youj/icons'

const ICON = { size: 16, strokeWidth: 1.75 } as const

const STARTERS = [
  { label: 'Ship to production', description: 'Checks, command and a rollback path', icon: <RocketIcon {...ICON} /> },
  { label: 'Compare regions', description: 'Cold starts, p95 and cost per region', icon: <BarChartIcon {...ICON} /> },
  { label: 'Debug a slow page', description: 'Find what changed and where it hurts', icon: <BugIcon {...ICON} /> },
  { label: 'Search the docs', description: 'What changed in 2.0, with citations', icon: <GitBranchIcon {...ICON} /> },
]

export default function SuggestionsCards() {
  const [picked, setPicked] = useState<string>()
  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <ChatSuggestions layout="cards" label="Ways to start" suggestions={STARTERS} onSelect={setPicked} />
      <p className="min-h-5 text-center text-ui-sm text-fg-muted" aria-live="polite">
        {picked ? `Picked “${picked}”` : 'Each card is a button.'}
      </p>
    </div>
  )
}
