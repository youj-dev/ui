'use client'

import { memo } from 'react'
import { useLocale } from '@youj/core'
import { FileTextIcon, SparklesIcon } from '@youj/icons'
import { ChatEmptyState, ChatMessage, ChatMessageList, ChatReasoning, ChatSuggestions, ChatToolCall, ChatTypingIndicator, type ChatFeedback } from '../../../components/ui/chat'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { cn } from '../../../lib/utils'
import { COPY, SUGGESTIONS, USER, type Attachment, type Chat, type Turn } from './data'

/* The conversation: each turn as a ChatMessage (Atlas's with its reasoning,
 * tool calls, streamed markdown and sources), the follow-ups under the last
 * answer once it's done, or, for a new chat, a greeting with four ways in. */

const kb = (bytes: number | undefined, locale: string) =>
  bytes === undefined ? '' : Math.max(1, Math.round(bytes / 1024)).toLocaleString(locale, { style: 'unit', unit: 'kilobyte', unitDisplay: 'short', maximumFractionDigits: 0 })

function Attachments({ attachments }: { attachments: Attachment[] }) {
  const locale = useLocale()
  return (
    <ul aria-label="Attachments" className="flex flex-wrap justify-end gap-2">
      {attachments.map((a) => (
        <li key={a.id} className="flex h-control items-center gap-2 rounded-md border border-line bg-band px-2.5 text-ui-sm text-fg">
          <FileTextIcon size={15} strokeWidth={1.75} className="text-fg-muted" />
          <span className="max-w-48 truncate">{a.name}</span>
          {a.size !== undefined && <span className="font-mono text-ui-xs text-fg-muted tabular-nums">{kb(a.size, locale)}</span>}
        </li>
      ))}
    </ul>
  )
}

/** Atlas's mark on an accent tile, ringed while it writes. */
function AtlasAvatar({ writing }: { writing: boolean }) {
  return (
    <Avatar className={cn('size-7 ring-2 ring-transparent transition-[box-shadow] yj-duration-base ease-standard', writing && 'ring-accent-line')}>
      <AvatarFallback className="bg-accent text-on-accent">
        <SparklesIcon size={14} strokeWidth={1.75} />
      </AvatarFallback>
    </Avatar>
  )
}

/** One turn, memoised on the turn: a streaming answer re-renders only its own text. */
const TurnView = memo(function TurnView({ turn, onRate }: { turn: Turn; onRate: (id: string, feedback: ChatFeedback) => void }) {
  const atlas = turn.role === 'assistant'
  return (
    <ChatMessage
      role={turn.role}
      name={atlas ? COPY.product : USER.name}
      avatar={atlas ? <AtlasAvatar writing={Boolean(turn.streaming)} /> : undefined}
      timestamp={turn.at}
      content={turn.stream ?? turn.text}
      streaming={turn.streaming}
      incomplete={turn.stopped}
      sources={turn.sources}
      feedback={atlas ? (turn.feedback ?? null) : undefined}
      onFeedbackChange={atlas ? (feedback) => onRate(turn.id, feedback) : undefined}
    >
      {turn.waiting && <ChatTypingIndicator label="Reading your workspace…" />}
      {turn.reasoning && <ChatReasoning content={turn.reasoning.stream ?? turn.reasoning.text} streaming={turn.reasoning.streaming} duration={turn.reasoning.duration} />}
      {turn.tools?.map((t) => (
        <ChatToolCall key={t.id} name={t.name} args={t.args} status={t.status} result={t.result} error={t.error} duration={t.duration} />
      ))}
      {turn.attachments?.length ? <Attachments attachments={turn.attachments} /> : null}
    </ChatMessage>
  )
})

interface ThreadProps {
  chat: Chat | null
  /** Nothing is playing: follow-ups can show. */
  idle: boolean
  onPick: (prompt: string) => void
  onRate: (id: string, feedback: ChatFeedback) => void
}

export function Thread({ chat, idle, onPick, onRate }: ThreadProps) {
  if (!chat || chat.turns.length === 0)
    return (
      <div className="yj-scrollbar grid min-h-0 flex-1 place-items-center overflow-y-auto px-4 py-10">
        <ChatEmptyState greeting={COPY.greeting} description={COPY.description} suggestions={SUGGESTIONS} onSelect={onPick} />
      </div>
    )
  return (
    <ChatMessageList key={chat.id} aria-label={chat.title} className="min-h-0 flex-1" contentClassName="max-w-184 px-4 pt-6 pb-10 sm:px-6">
      {chat.turns.map((t) => (
        <TurnView key={t.id} turn={t} onRate={onRate} />
      ))}
      {idle && chat.followUps.length > 0 && (
        <ChatSuggestions key={`follow-${chat.turns.length}`} label={COPY.followUps} suggestions={chat.followUps.map((label) => ({ label }))} onSelect={onPick} className="ps-10 max-sm:ps-0 [&>ul]:justify-start" />
      )}
    </ChatMessageList>
  )
}
