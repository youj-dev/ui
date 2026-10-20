import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ShareIcon } from '@youj/icons/components/youj/icons/share'
import { Button } from '../button'
import { AssistantChat, ComposerToolbar, HISTORY } from './chat.fixtures'

const meta: Meta = {
  title: 'UI/Chat/Assistant',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Composable parts for AI chat and assistant interfaces: a message list that stays with a streaming answer, messages with actions, streamed markdown, a composer, thinking and reasoning, tool calls, citations, suggestions and an empty state. This screen runs them on a deterministic fake model (the same tokens in the same order at a rate you choose, with reasoning, tool calls and an error path), streaming through a ChatTextSource so a reply re-renders only its own text. Everything reads in both themes, with reduced motion, and at every Speed.',
      },
    },
  },
}
export default meta

interface ScreenArgs {
  /** The fake model's rate. */
  tokensPerSecond: number
  /** Think out loud first, in a reasoning block. */
  reasoning: boolean
  /** Call a tool for live data. */
  toolCalls: boolean
  /** The next reply drops part-way: the error path, with Retry. */
  failNextReply: boolean
}

function Screen({ autoSend, fresh, ...args }: ScreenArgs & { autoSend?: string; fresh?: boolean }) {
  const [model, setModel] = useState('youj-pro')
  return (
    <div className="flex h-dvh min-h-[600px] flex-col bg-canvas text-fg">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line px-4">
        <h1 className="min-w-0 truncate text-ui font-medium">{fresh ? 'New chat' : 'Checkout latency after Tuesday'}</h1>
        <span className="text-ui-sm text-fg-muted max-sm:hidden">orion</span>
        <Button variant="ghost" size="sm" className="ms-auto">
          <ShareIcon size={14} strokeWidth={1.75} />
          Share
        </Button>
      </header>
      <AssistantChat
        // A new set of options starts a new conversation.
        key={JSON.stringify(args)}
        initial={fresh ? [] : HISTORY}
        autoSend={autoSend}
        toolbar={<ComposerToolbar model={model} onModelChange={setModel} />}
        {...args}
      />
    </div>
  )
}

const argTypes = {
  tokensPerSecond: { control: { type: 'range', min: 5, max: 400, step: 5 } },
} as const

/**
 * A conversation under way; a question streams its answer on load: "Thinking…", the reasoning folding away, a tool
 * call, then markdown with code and a table, followed and kept in view. Scroll up mid-answer, stop it, regenerate,
 * rate it, edit your question. Tweak the rate, the reasoning, the tools or make the next reply fail.
 */
export const Hero: StoryObj<ScreenArgs> = {
  args: { tokensPerSecond: 60, reasoning: true, toolCalls: true, failNextReply: false },
  argTypes,
  render: (args) => <Screen {...args} autoSend="How do I ship orion to production with a safe rollback?" />,
}

/** The error path: the reply drops part-way, keeps what arrived and offers Retry; the failure is announced assertively. */
export const ErrorPath: StoryObj<ScreenArgs> = {
  args: { tokensPerSecond: 60, reasoning: false, toolCalls: false, failNextReply: true },
  argTypes,
  render: (args) => <Screen {...args} autoSend="Compare cold starts across our regions" />,
}

/** A new chat: the greeting and ways in. Pick one and send it to watch it all run from the start. */
export const NewChat: StoryObj<ScreenArgs> = {
  args: { tokensPerSecond: 60, reasoning: true, toolCalls: true, failNextReply: false },
  argTypes,
  render: (args) => <Screen {...args} fresh />,
}
