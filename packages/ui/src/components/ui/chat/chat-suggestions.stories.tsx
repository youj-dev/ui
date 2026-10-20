import { useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { BarChartIcon } from '@youj/icons/components/youj/icons/bar-chart'
import { BugIcon } from '@youj/icons/components/youj/icons/bug'
import { GitBranchIcon } from '@youj/icons/components/youj/icons/git-branch'
import { RocketIcon } from '@youj/icons/components/youj/icons/rocket'
import { RefreshIcon } from '@youj/icons/components/youj/icons/refresh'
import { Button } from '../button'
import { PromptInput } from './chat-prompt-input'
import { ChatSuggestions, type ChatSuggestion } from './chat-suggestions'

const meta: Meta<typeof ChatSuggestions> = {
  title: 'UI/Chat/Suggestions',
  component: ChatSuggestions,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Prompt suggestions. They arrive in sequence through motion\'s Stagger (each rises a few px and fades in, one base step after the last), and picking one hands its prompt to `onSelect`, typically to fill the composer and focus it. Chips wrap in a row; cards form a two-column grid with a line of detail. Real buttons in a labeled group. Reduced motion: all at once.',
      },
    },
  },
}
export default meta

const ICON = { size: 16, strokeWidth: 1.75 } as const

const PROMPTS: ChatSuggestion[] = [
  { label: 'Ship to production', prompt: 'How do I ship orion to production with a safe rollback?', icon: <RocketIcon {...ICON} /> },
  { label: 'Compare regions', prompt: 'Compare cold starts and cost across our regions', icon: <BarChartIcon {...ICON} /> },
  { label: 'Debug a slow page', prompt: 'Why did checkout get slower after Tuesday?', icon: <BugIcon {...ICON} /> },
  { label: 'Review a branch', prompt: 'Summarize what changed on feat/onboarding', icon: <GitBranchIcon {...ICON} /> },
]

function FillsTheComposer() {
  const [value, setValue] = useState('')
  const [run, setRun] = useState(0)
  const field = useRef<HTMLTextAreaElement>(null)
  return (
    <div className="flex w-full max-w-[min(680px,calc(100vw-2rem))] flex-col gap-4">
      <ChatSuggestions
        key={run}
        suggestions={PROMPTS}
        onSelect={(prompt) => {
          setValue(prompt)
          field.current?.focus()
        }}
      />
      <PromptInput value={value} onValueChange={setValue} textareaRef={field} onSubmit={() => setValue('')} />
      <div className="flex justify-center">
        <Button variant="ghost" size="sm" onClick={() => setRun((n) => n + 1)}>
          <RefreshIcon size={14} strokeWidth={1.75} />
          Replay the entrance
        </Button>
      </div>
    </div>
  )
}

/** Pick one: its prompt fills the composer and focus moves there, ready to send or edit. */
export const Hero: StoryObj = {
  render: () => <FillsTheComposer />,
}

/** The cards layout: a two-column grid with a line of detail under each. */
export const Cards: StoryObj = {
  render: () => (
    <div className="w-full max-w-[min(640px,calc(100vw-2rem))]">
      <ChatSuggestions
        layout="cards"
        onSelect={() => {}}
        suggestions={[
          { label: 'Ship to production', description: 'Checks, command and a rollback path', icon: <RocketIcon {...ICON} /> },
          { label: 'Compare regions', description: 'Cold starts, p95 and cost per region', icon: <BarChartIcon {...ICON} /> },
          { label: 'Debug a slow page', description: 'Find what changed and where it hurts', icon: <BugIcon {...ICON} /> },
          { label: 'Review a branch', description: 'A summary of the diff, with risks', icon: <GitBranchIcon {...ICON} /> },
        ]}
      />
    </div>
  ),
}
