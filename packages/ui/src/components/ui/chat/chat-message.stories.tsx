import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ShareIcon } from '@youj/icons/components/youj/icons/share'
import { Specimen } from '../../../stories/kit'
import { Avatar, AvatarFallback, AvatarImage } from '../avatar'
import { ChatMessage, ChatMessageAction, type ChatFeedback } from './chat-message'
import { ANSWERS, useFakeStream } from './chat.fixtures'

const meta: Meta<typeof ChatMessage> = {
  title: 'UI/Chat/Message',
  component: ChatMessage,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'One message in a conversation. Assistant messages read across the column as streamed markdown under an avatar and a header; user messages are bubbles on the inline-end side; system messages are a quiet notice between hairlines. Actions sit in one toolbar (a single tab stop, arrow keys inside): copy with the CopyIcon → check morph, regenerate, good/bad response and edit for your own messages. They show on hover and focus, always on touch and on the latest message, and never while a message streams. An error shows under whatever arrived, with Retry. Messages are memoised, and a ChatTextSource as `content` re-renders only the text per token.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ChatMessage>

const AT = new Date('2026-01-15T09:41:00Z')
const minutes = (n: number) => new Date(AT.getTime() + n * 60_000)

function Conversation() {
  const [feedback, setFeedback] = useState<ChatFeedback>('up')
  const [question, setQuestion] = useState('How do I ship orion to production without downtime?')
  return (
    <div className="flex w-full max-w-[min(680px,calc(100vw-2rem))] flex-col gap-6">
      <ChatMessage role="system" content="Model switched to Youj Pro" timestamp={minutes(0)} />
      <ChatMessage role="user" name="Ada Lovelace" timestamp={minutes(1)} content={question} onEdit={setQuestion} />
      <ChatMessage
        role="assistant"
        name="Youj"
        timestamp={minutes(1)}
        content={ANSWERS.short}
        feedback={feedback}
        onFeedbackChange={setFeedback}
        onRegenerate={() => {}}
        data-latest=""
      />
    </div>
  )
}

/** A user bubble, an assistant answer with its actions (it's the latest, so they show) and a system notice. Hover the user message for Copy and Edit. */
export const Hero: Story = {
  render: () => <Conversation />,
}

/** A reply that failed part-way: what arrived stays, the error sits under it, and Retry is one tab stop away. */
export const FailedReply: Story = {
  render: () => (
    <div className="w-full max-w-[min(680px,calc(100vw-2rem))]">
      <ChatMessage
        role="assistant"
        name="Youj"
        timestamp={minutes(3)}
        content="Checking the last three deployments of **orion**: the first two"
        error="The connection dropped before the reply finished."
        onRetry={() => {}}
      />
    </div>
  ),
}

function Streaming() {
  const { stream, streaming } = useFakeStream(ANSWERS.deploy, { tokensPerSecond: 50 })
  return (
    <div className="w-full max-w-[min(680px,calc(100vw-2rem))]">
      <ChatMessage role="assistant" name="Youj" timestamp={minutes(4)} content={stream} streaming={streaming} onRegenerate={() => {}} data-latest="" />
    </div>
  )
}

/** Streaming through a ChatTextSource: the avatar twinkles, the caret leads, and the actions arrive once it's done. */
export const StreamingReply: Story = {
  render: () => <Streaming />,
}

/** Custom avatars (an image with its fallback), a longer user message, and an extra action. */
export const Customised: Story = {
  render: () => (
    <div className="flex w-full max-w-[min(680px,calc(100vw-2rem))] flex-col gap-6">
      <Specimen label="image avatar, long user text">
        <ChatMessage
          role="user"
          name="Grace Hopper"
          timestamp={minutes(6)}
          avatar={
            <Avatar className="size-7">
              <AvatarImage src="" alt="" />
              <AvatarFallback>GH</AvatarFallback>
            </Avatar>
          }
          content={'Can you compare the three regions we deploy to?\nI care most about cold starts, then p95 latency.\n\nAlso: which one is cheapest for 10M requests a month?'}
        />
      </Specimen>
      <Specimen label="extra action">
        <ChatMessage
          role="assistant"
          name="Youj"
          timestamp={minutes(7)}
          content="iad1 has the fastest cold starts; fra1 is the cheapest at that volume."
          data-latest=""
          actions={
            <ChatMessageAction label="Share">
              <ShareIcon size={16} strokeWidth={1.75} />
            </ChatMessageAction>
          }
        />
      </Specimen>
    </div>
  ),
}
