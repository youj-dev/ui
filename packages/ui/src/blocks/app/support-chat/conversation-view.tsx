'use client'

import { memo, useCallback, type ReactNode, type RefObject } from 'react'
import { MorphLabel } from '@youj/motion'
import { ArrowLeftIcon, LoaderRingIcon, MoonIcon } from '@youj/icons'
import {
  ChatMessage,
  ChatMessageList,
  ChatSuggestions,
  ChatTypingIndicator,
  PromptInput,
  usePromptAttachments,
  type ChatFeedback,
} from '../../../components/ui/chat'
import { Button } from '../../../components/ui/button'
import { useSupportChat } from './context'
import type { SupportChatCopy, SupportStage } from './data'
import { BotAvatar, EmailCapture, MessageAttachments, PersonAvatar, RatingCard, UserAvatar } from './conversation-parts'
import type { Conversation, LiveMessage } from './use-conversation'

/* The conversation: who you're talking to and where things stand, the
 * messages, quick replies, and the composer.
 * - The header's avatar and name morph from the assistant to the person who
 *   joins (MorphLabel); the status line under them follows the stage, and a
 *   visually hidden status region says each change once.
 * - While waiting for a person the thread shows "Finding someone…" with
 *   light sweeping across it; the assistant types in dots, then streams.
 * - Quick replies sit on your side of the thread, in sequence (Stagger);
 *   picking one sends it. Closed conversations end on a rating, and with the
 *   team away, on an email form instead of the composer. */

function statusLine(copy: SupportChatCopy, stage: SupportStage, online: boolean, role?: string): { text: string; icon?: ReactNode; dot?: boolean } {
  if (stage === 'queue') return { text: copy.finding, icon: <LoaderRingIcon size={13} strokeWidth={2} trigger="loop" /> }
  if (stage === 'agent') return { text: copy.withAgent(role ?? copy.support), dot: true }
  if (stage === 'ended') return { text: copy.closed }
  if (stage === 'offline' || !online) return { text: copy.away(copy.backAt), icon: <MoonIcon size={13} strokeWidth={1.75} /> }
  return { text: copy.botStatus }
}

interface ConversationViewProps {
  convo: Conversation
  online: boolean
  files: ReturnType<typeof usePromptAttachments>
  titleId: string
  composerRef: RefObject<HTMLTextAreaElement | null>
  onBack: () => void
  close: ReactNode
  /** Sends the email left while the team is away; a rejection shows its message. */
  onLeaveEmail?: (email: string, threadId: string) => Promise<unknown> | unknown
  /** A closed conversation was rated. */
  onRate?: (rating: { threadId: string; score: number; note: string }) => void
  /** An answer from the assistant was rated up or down. */
  onFeedback?: (messageId: string, feedback: ChatFeedback) => void
}

export function ConversationView({ convo, online, files, titleId, composerRef, onBack, close, onLeaveEmail, onRate, onFeedback }: ConversationViewProps) {
  const { messages, stage, agent, suggestions, busy, setFeedback } = convo
  const { copy, bot } = useSupportChat()
  const feedback = useCallback(
    (id: string, next: ChatFeedback) => {
      setFeedback(id, next)
      onFeedback?.(id, next)
    },
    [setFeedback, onFeedback],
  )
  const status = statusLine(copy, stage, online, agent?.role)
  const talking = stage === 'bot' || stage === 'queue' || stage === 'agent'
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-1 border-b border-line py-2 ps-2 pe-2">
        <Button variant="ghost" size="icon-sm" aria-label={copy.backHome} onClick={onBack} className="text-fg-muted">
          <ArrowLeftIcon size={16} strokeWidth={1.75} className="rtl:-scale-x-100" />
        </Button>
        <div className="flex min-w-0 flex-1 items-center gap-2.5 ps-1">
          <MorphLabel value={agent?.id ?? 'bot'} className="shrink-0">
            {agent ? <PersonAvatar agent={agent} className="size-8" /> : <BotAvatar className="size-8" />}
          </MorphLabel>
          <div className="flex min-w-0 flex-col">
            <h2 id={titleId} className="truncate text-ui font-semibold text-fg">
              {agent?.name ?? bot}
            </h2>
            <MorphLabel value={status.text} className="min-w-0" contentClassName="inline-flex min-w-0 items-center gap-1.5 whitespace-nowrap">
              <span aria-hidden className="flex items-center gap-1.5 text-ui-sm text-fg-muted">
                {status.dot && <span className="size-1.5 rounded-full bg-success" />}
                {status.icon}
                <span className="truncate">{status.text}</span>
              </span>
            </MorphLabel>
            <span role="status" className="sr-only">
              {status.text}
            </span>
          </div>
        </div>
        {close}
      </div>

      <ChatMessageList aria-label={copy.conversation} className="min-h-0 flex-1" contentClassName="max-w-none px-4 pt-5 pb-6">
        {messages.map((m) => (
          <Message key={m.id} message={m} onFeedback={feedback} />
        ))}
        {stage === 'queue' && <ChatTypingIndicator key="queue" label={copy.finding} className="justify-center" />}
        {stage === 'offline' && (
          <EmailCapture
            key="email"
            email={convo.email}
            onSubmit={async (address) => {
              await onLeaveEmail?.(address, convo.threadId)
              convo.leaveEmail(address)
            }}
          />
        )}
        {stage === 'ended' && (
          <RatingCard
            key="rating"
            subject={agent?.first ?? bot}
            rated={convo.rated}
            onRate={(score, note) => {
              convo.setRated(score)
              onRate?.({ threadId: convo.threadId, score, note })
            }}
            onNew={() => convo.start(null)}
          />
        )}
        {talking && !busy && suggestions.length > 0 && (
          <ChatSuggestions
            key={`quick-${messages.length}`}
            label={copy.quickReplies}
            suggestions={suggestions.map((label) => ({ label }))}
            onSelect={(text) => {
              // The replies go once one is picked: focus waits in the composer.
              convo.send(text)
              composerRef.current?.focus()
            }}
            className="[&_ul]:justify-end"
          />
        )}
      </ChatMessageList>

      {talking && (
        <div className="px-3 pb-3">
          <PromptInput
            label={copy.messageLabel(agent?.first)}
            placeholder={copy.placeholder(agent?.first)}
            textareaRef={composerRef}
            status={convo.answering ? 'streaming' : 'idle'}
            onStop={convo.stop}
            attachments={files.attachments}
            onAttach={files.add}
            onRemoveAttachment={files.remove}
            accept="image/*,.pdf,.txt,.csv,.log"
            onSubmit={({ text, attachments }) => {
              convo.send(
                text,
                attachments.map(({ id, name, type, size, url }) => ({ id, name, type, size, url })),
              )
              files.clear()
            }}
          />
        </div>
      )}
    </div>
  )
}

const Message = memo(function Message({ message: m, onFeedback }: { message: LiveMessage; onFeedback: (id: string, feedback: ChatFeedback) => void }) {
  const { copy, bot: botName } = useSupportChat()
  const feedback = useCallback((next: ChatFeedback) => onFeedback(m.id, next), [m.id, onFeedback])
  if (m.from === 'system') return <ChatMessage role="system" content={m.text} />
  if (m.from === 'user')
    return (
      <ChatMessage role="user" avatar={<UserAvatar />} timestamp={m.at} content={m.text || undefined} copyable={false}>
        {m.attachments && <MessageAttachments attachments={m.attachments} mine />}
      </ChatMessage>
    )
  const bot = m.from === 'bot'
  const typing = m.status === 'typing'
  const rateable = bot && m.answer && !m.status
  return (
    <ChatMessage
      role="assistant"
      name={bot ? botName : m.agent!.name}
      avatar={bot ? <BotAvatar /> : <PersonAvatar agent={m.agent!} />}
      timestamp={m.at}
      content={typing ? undefined : (m.stream ?? m.text)}
      streaming={m.status !== undefined}
      incomplete={m.incomplete}
      copyable={bot && m.answer}
      feedback={rateable ? (m.feedback ?? null) : undefined}
      onFeedbackChange={rateable ? feedback : undefined}
      footer={m.attachments && <MessageAttachments attachments={m.attachments} />}
    >
      {typing && <ChatTypingIndicator variant="dots" label={copy.typing(bot ? botName : m.agent!.first)} />}
    </ChatMessage>
  )
})
