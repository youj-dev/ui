'use client'

import { useRef, useState } from 'react'
import { ChatEmptyState, PromptInput } from '@youj/react'
import { BarChartIcon, BugIcon, GitBranchIcon, RocketIcon } from '@youj/icons'

const ICON = { size: 16, strokeWidth: 1.75 } as const

const STARTERS = [
  { label: 'Ship to production', description: 'Checks, command and a rollback path', prompt: 'How do I ship orion to production with a safe rollback?', icon: <RocketIcon {...ICON} /> },
  { label: 'Compare regions', description: 'Cold starts, p95 and cost per region', prompt: 'Compare cold starts and cost across our regions', icon: <BarChartIcon {...ICON} /> },
  { label: 'Debug a slow page', description: 'Find what changed and where it hurts', prompt: 'Why did checkout get slower after Tuesday?', icon: <BugIcon {...ICON} /> },
  { label: 'Search the docs', description: 'What changed in 2.0, with citations', prompt: 'Search the docs: what changed in 2.0?', icon: <GitBranchIcon {...ICON} /> },
]

export default function ChatEmptyStateDemo() {
  const [draft, setDraft] = useState('')
  const field = useRef<HTMLTextAreaElement>(null)

  return (
    <div className="flex w-full max-w-2xl flex-col gap-8 py-4">
      <ChatEmptyState
        greeting="Good morning, Ada"
        description="Ask about your deployments, logs and metrics."
        suggestions={STARTERS}
        onSelect={(prompt) => {
          setDraft(prompt)
          field.current?.focus()
        }}
      />
      <PromptInput value={draft} onValueChange={setDraft} textareaRef={field} onSubmit={() => setDraft('')} />
    </div>
  )
}
