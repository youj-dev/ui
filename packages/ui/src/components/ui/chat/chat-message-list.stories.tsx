import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Button } from '../button'
import { ChatMessage } from './chat-message'
import { ChatMessageList, useChatMessageList } from './chat-message-list'
import { HISTORY, useFakeChat, type FakeMessage } from './chat.fixtures'

const meta: Meta<typeof ChatMessageList> = {
  title: 'UI/Chat/MessageList',
  component: ChatMessageList,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'The conversation\'s scroll container. It sticks to the bottom while an answer streams, gliding after the content on the smooth spring, and lets go the moment you scroll up; a "Jump to latest" button then rises in (with a dot when something new arrived) and brings you back. Consecutive messages from one author group, new ones enter through PresenceList, and the log is aria-live="off" while messages announce themselves once complete, so a streaming answer is never read token by token. `animate={false}` hands the rows to a virtualizer, with useChatMessageList().getViewport() as its scroll element.',
      },
    },
  },
}
export default meta

type Chat = ReturnType<typeof useFakeChat>

/** A message row, memoised on its message: streaming a reply re-renders nothing here. */
const Row = memo(function Row({ message, onRegenerate, onFeedback }: { message: FakeMessage; onRegenerate: Chat['regenerate']; onFeedback: Chat['setFeedback'] }) {
  return (
    <ChatMessage
      role={message.role}
      name={message.role === 'assistant' ? 'Youj' : message.role === 'user' ? 'Ada Lovelace' : undefined}
      timestamp={message.createdAt}
      content={message.stream ?? message.content}
      streaming={message.streaming}
      error={message.error}
      onRetry={() => onRegenerate(message.id)}
      onRegenerate={() => onRegenerate(message.id)}
      feedback={message.role === 'assistant' ? message.feedback : undefined}
      onFeedbackChange={message.role === 'assistant' ? (feedback) => onFeedback(message.id, feedback) : undefined}
    />
  )
})

interface ListArgs {
  tokensPerSecond: number
}

function LiveConversation({ tokensPerSecond, autoSend = 'Compare cold starts across our regions' }: ListArgs & { autoSend?: string }) {
  const chat = useFakeChat({ initial: HISTORY, tokensPerSecond, reasoning: false, toolCalls: false })
  const { send } = chat
  const sent = useRef(false)
  useEffect(() => {
    if (sent.current) return
    sent.current = true
    send(autoSend)
  }, [send, autoSend])
  return (
    <div className="flex h-[600px] w-full max-w-[min(720px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-line bg-canvas shadow-sm">
      <ChatMessageList contentClassName="max-w-none px-6">
        {chat.messages.map((m) => (
          <Row key={m.id} message={m} onRegenerate={chat.regenerate} onFeedback={chat.setFeedback} />
        ))}
      </ChatMessageList>
      <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5 text-ui-sm text-fg-muted">
        <span>{chat.status === 'idle' ? 'Scroll up mid-answer to let go of the bottom.' : 'Streaming…'}</span>
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" disabled={chat.status !== 'idle'} onClick={() => chat.send('How do I ship orion to production?')}>
            Ask again
          </Button>
          <Button size="sm" variant="ghost" disabled={chat.status === 'idle'} onClick={chat.stop}>
            Stop
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * A conversation already under way; a reply streams in on load. The two short user messages in the middle group under
 * one header. Scroll up while it streams: the view lets go, and "Jump to latest" brings you back.
 */
export const Hero: StoryObj<ListArgs> = {
  args: { tokensPerSecond: 40 },
  argTypes: { tokensPerSecond: { control: { type: 'range', min: 5, max: 400, step: 5 } } },
  render: (args) => <LiveConversation {...args} />,
}

function ScrolledAway() {
  const chat = useFakeChat({ initial: HISTORY, tokensPerSecond: 30, reasoning: false, toolCalls: false, latency: 300 })
  const { send } = chat
  const list = useRef<HTMLDivElement>(null)
  const sent = useRef(false)
  useEffect(() => {
    if (!sent.current) send('How do I ship orion to production?')
    sent.current = true
    // The reader scrolls back up to the start while the reply streams.
    const timer = setTimeout(() => {
      const viewport = list.current?.querySelector('[data-slot=scroll-area-viewport]')
      viewport?.dispatchEvent(new WheelEvent('wheel', { deltaY: -100 }))
      viewport?.scrollTo({ top: 0 })
    }, 900)
    return () => clearTimeout(timer)
  }, [send])
  return (
    <div className="flex h-[520px] w-full max-w-[min(720px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-line bg-canvas shadow-sm">
      <ChatMessageList ref={list} contentClassName="max-w-none px-6">
        {chat.messages.map((m) => (
          <Row key={m.id} message={m} onRegenerate={chat.regenerate} onFeedback={chat.setFeedback} />
        ))}
      </ChatMessageList>
    </div>
  )
}

/** Scrolled back to the start while a reply streams: the list stays where you are, and the jump button carries a dot for what arrived below. */
export const ScrolledUp: StoryObj = {
  render: () => <ScrolledAway />,
}

const MANY: FakeMessage[] = Array.from({ length: 5000 }, (_, i) => {
  const user = i % 3 === 0
  return {
    id: `v${i}`,
    role: user ? 'user' : 'assistant',
    content: user
      ? `Question ${i / 3 + 1}: what changed in build #${4000 + i}?`
      : i % 3 === 1
        ? `Build **#${4000 + i - 1}** changed ${(i * 7) % 23} files; the largest diff is in \`checkout/route.ts\`.`
        : 'All checks passed, and bundle size stayed within budget.',
    createdAt: new Date(Date.UTC(2026, 0, 15, 9, 0) + i * 60_000),
  }
})

function VirtualRows({ messages }: { messages: FakeMessage[] }) {
  const list = useChatMessageList()
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => list.viewport,
    estimateSize: () => 92,
    overscan: 6,
    getItemKey: (index) => messages[index]!.id,
  })
  // A virtualizer scrolls its element to its initial offset when it takes it
  // over: stick to the bottom again straight after.
  const { viewport, scrollToBottom } = list
  useLayoutEffect(() => {
    if (viewport) scrollToBottom('instant')
  }, [viewport, scrollToBottom])
  return (
    <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
      {virtualizer.getVirtualItems().map((item) => {
        const m = messages[item.index]!
        return (
          <div key={item.key} data-index={item.index} ref={virtualizer.measureElement} className="absolute inset-x-0 top-0 pb-6" style={{ transform: `translateY(${item.start}px)` }}>
            <ChatMessage role={m.role} name={m.role === 'assistant' ? 'Youj' : 'Ada Lovelace'} timestamp={m.createdAt} content={m.content} />
          </div>
        )
      })}
    </div>
  )
}

function Virtualized() {
  const [messages] = useState(MANY)
  return (
    <div className="flex h-[600px] w-full max-w-[min(720px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-line bg-canvas shadow-sm">
      <ChatMessageList animate={false} contentClassName="max-w-none px-6">
        <VirtualRows messages={messages} />
      </ChatMessageList>
    </div>
  )
}

/** 5,000 messages through TanStack Virtual: `animate={false}`, and the list's viewport as the scroll element. It opens at the bottom and sticks there. */
export const Virtualised: StoryObj = {
  render: () => <Virtualized />,
}
