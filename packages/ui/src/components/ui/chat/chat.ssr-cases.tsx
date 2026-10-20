import type { ReactElement } from 'react'
import { YoujProvider } from '@youj/core'
import { ChatEmptyState } from './chat-empty-state'
import { ChatMessage } from './chat-message'
import { ChatMessageList } from './chat-message-list'
import { PromptInput } from './chat-prompt-input'
import { ChatSuggestions } from './chat-suggestions'
import { ChatReasoning, ChatTypingIndicator } from './chat-thinking'
import { ChatToolCall } from './chat-tool-call'

/* Rendered on a server by scripts/ssr-render.mjs and hydrated in jsdom by
 * chat-ssr.test.tsx. Fixed data and timestamps, so both sides agree. */

const AT = new Date('2026-01-15T09:41:00Z')

const ANSWER = `## Plan

1. Run \`pnpm verify\`
2. Promote the build [1]

| Region | p95 |
| :----- | --: |
| iad1   | 84 ms |

\`\`\`ts
await deploy({ project: 'orion' })
\`\`\``

const SOURCES = [{ title: 'Deployments', url: 'https://youj.io/docs/deployments' }]

export const cases: Record<string, () => ReactElement> = {
  Conversation: () => (
    <YoujProvider>
      <ChatMessageList>
        <ChatMessage key="s" role="system" content="Model switched to Youj Pro" timestamp={AT} />
        <ChatMessage key="u" role="user" name="Ada Lovelace" content="How do I ship orion?" timestamp={AT} onEdit={() => {}} />
        <ChatMessage key="a" role="assistant" name="Youj" content={ANSWER} sources={SOURCES} timestamp={AT} feedback={null} onFeedbackChange={() => {}} onRegenerate={() => {}}>
          <ChatReasoning content="Check the deployments first." duration={4} />
          <ChatToolCall name="get_deployments" args={{ project: 'orion' }} status="success" duration={900} result={{ state: 'READY' }} />
        </ChatMessage>
        <ChatMessage key="w" role="assistant" name="Youj" content="Streaming **now" streaming timestamp={AT}>
          <ChatTypingIndicator />
        </ChatMessage>
      </ChatMessageList>
    </YoujProvider>
  ),
  'Prompt input': () => (
    <YoujProvider>
      <PromptInput
        defaultValue="Draft the postmortem"
        maxLength={280}
        status="streaming"
        onStop={() => {}}
        onSubmit={() => {}}
        onAttach={() => {}}
        attachments={[{ id: 'a', name: 'incident.pdf', type: 'application/pdf', size: 2048 }]}
      />
    </YoujProvider>
  ),
  'Empty state': () => (
    <YoujProvider>
      <ChatEmptyState greeting="Good morning, Ada" description="Ask about your deployments." suggestions={[{ label: 'Compare regions' }]} onSelect={() => {}} />
      <ChatSuggestions layout="cards" suggestions={[{ label: 'Ship it', description: 'Checks and a rollback' }]} onSelect={() => {}} />
    </YoujProvider>
  ),
}
