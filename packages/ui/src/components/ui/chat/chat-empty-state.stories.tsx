import { useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { BarChartIcon } from '@youj/icons/components/youj/icons/bar-chart'
import { BugIcon } from '@youj/icons/components/youj/icons/bug'
import { GitBranchIcon } from '@youj/icons/components/youj/icons/git-branch'
import { RocketIcon } from '@youj/icons/components/youj/icons/rocket'
import { ChatEmptyState } from './chat-empty-state'
import { PromptInput } from './chat-prompt-input'
import type { ChatSuggestion } from './chat-suggestions'

const meta: Meta<typeof ChatEmptyState> = {
  title: 'UI/Chat/EmptyState',
  component: ChatEmptyState,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A new conversation: a greeting and a few ways in. Built on the Empty primitive (the icon tile over plates that fan out), the greeting rises word by word from behind its line (TextSplit, masked), the description fades in after it and the suggestions stagger in last: one arrival, in order, then stillness. Screen readers get the greeting whole. Reduced motion: everything in place at once.',
      },
    },
  },
}
export default meta

const ICON = { size: 16, strokeWidth: 1.75 } as const

const SUGGESTIONS: ChatSuggestion[] = [
  { label: 'Ship to production', description: 'Checks, command and a rollback path', prompt: 'How do I ship orion to production with a safe rollback?', icon: <RocketIcon {...ICON} /> },
  { label: 'Compare regions', description: 'Cold starts, p95 and cost per region', prompt: 'Compare cold starts and cost across our regions', icon: <BarChartIcon {...ICON} /> },
  { label: 'Debug a slow page', description: 'Find what changed and where it hurts', prompt: 'Why did checkout get slower after Tuesday?', icon: <BugIcon {...ICON} /> },
  { label: 'Review a branch', description: 'A summary of the diff, with risks', prompt: 'Summarize what changed on feat/onboarding', icon: <GitBranchIcon {...ICON} /> },
]

function NewChat() {
  const [value, setValue] = useState('')
  const field = useRef<HTMLTextAreaElement>(null)
  return (
    <div className="flex h-dvh min-h-[560px] flex-col bg-canvas">
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto px-4">
        <ChatEmptyState
          greeting="Good morning, Ada"
          description="Ask about your deployments, logs and metrics. I can read orion's last 30 days."
          suggestions={SUGGESTIONS}
          onSelect={(prompt) => {
            setValue(prompt)
            field.current?.focus()
          }}
        />
      </div>
      <div className="mx-auto w-full max-w-3xl px-4 pb-6">
        <PromptInput value={value} onValueChange={setValue} textareaRef={field} onSubmit={() => setValue('')} />
      </div>
    </div>
  )
}

/** A fresh chat: the greeting rises in, then the ways in. Pick one and it lands in the composer. */
export const Hero: StoryObj = {
  render: () => <NewChat />,
}

/** Chips instead of cards, for a narrower column. */
export const Chips: StoryObj = {
  parameters: { layout: 'centered' },
  render: () => (
    <div className="w-full max-w-[min(560px,calc(100vw-2rem))]">
      <ChatEmptyState greeting="What are we building?" suggestions={SUGGESTIONS} suggestionsLayout="chips" onSelect={() => {}} />
    </div>
  ),
}
