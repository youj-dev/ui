'use client'

import { memo, useEffect, useId, useRef, useState, type ComponentProps, type ReactNode, type Ref } from 'react'
import { Toolbar as ToolbarPrimitive } from '@base-ui/react/toolbar'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import { AlertTriangleIcon } from '@youj/icons/components/youj/icons/alert-triangle'
import { PencilIcon } from '@youj/icons/components/youj/icons/pencil'
import { RefreshIcon } from '@youj/icons/components/youj/icons/refresh'
import { SparklesIcon } from '@youj/icons/components/youj/icons/sparkles'
import { ThumbsUpIcon } from '@youj/icons/components/youj/icons/thumbs-up'
import { useYouj, useLocale, useDirection } from '@youj/core/lib/youj/provider'
import { useComponentLabels } from '@youj/core/labels'
import { chatMessageLabels } from '@youj/core/labels'
import { useNow } from '../../../hooks/use-now'
import { cn, initials } from '../../../lib/utils'
import { Avatar, AvatarFallback } from '../avatar'
import { Button } from '../button'
import { InputGroup, InputGroupAddon, InputGroupTextarea } from '../input-group'
import { Toggle } from '../toggle'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../tooltip'
import { ChatSources, type ChatSource } from './chat-citation'
import { InMessageContext, useChatList } from './chat-context'
import { ChatCopyButton } from './chat-copy-button'
import { useEnterToSubmit } from './chat-keys'
import { ChatMarkdown } from './chat-markdown'
import { markdownToPlainText } from './chat-markdown-parse'
import { readText, useChatText, type ChatText } from './chat-text-stream'

/* One message in a conversation.
 * - Assistant: an avatar and a header (name, time), then the answer as
 *   streamed markdown across the column. User: a bubble on the inline-end
 *   side under the same header, mirrored. System: a quiet centered notice
 *   between hairlines.
 * - In a ChatMessageList, consecutive messages from one author group: only
 *   the first shows its avatar and header (the others keep the header for
 *   screen readers), and they sit closer. The list decides; the message only
 *   carries `data-author`.
 * - Actions (copy with youj's CopyIcon → check, regenerate, good/bad
 *   response, edit for your own messages) sit in one toolbar: a single tab
 *   stop, arrow keys move within it. They show on hover and focus, always on
 *   touch screens and on the latest message, and never while it streams.
 * - An error shows under whatever arrived, with Retry, and is announced
 *   assertively; a finished assistant message is announced once, whole.
 * - Memoised: a message whose props are unchanged doesn't re-render when its
 *   list does. Stream `content` through a ChatTextSource and a token doesn't
 *   re-render the message either, only its text. Pass stable callbacks. */

export type ChatRole = 'user' | 'assistant' | 'system'
export type ChatFeedback = 'up' | 'down' | null

export interface ChatMessageProps extends Omit<ComponentProps<'article'>, 'role' | 'content' | 'children'> {
  role: ChatRole
  /** The author, shown and announced. Defaults: "Assistant", "You", "System". */
  name?: string
  /** A custom avatar, e.g. `<Avatar><AvatarImage src={…} /><AvatarFallback>AL</AvatarFallback></Avatar>`. */
  avatar?: ReactNode
  timestamp?: Date | string | number
  /** The text. Markdown for assistant messages, plain text otherwise. A ChatTextSource streams it. */
  content?: ChatText
  /** The assistant is still writing it: the text streams in, and actions wait until it's done. */
  streaming?: boolean
  /** Blocks before the text: reasoning, tool calls, attachments. */
  children?: ReactNode
  /** Blocks after the text: follow-ups, anything else. */
  footer?: ReactNode
  /** Where the answer came from: `[1]` in the text links to sources[0], and a row of chips follows the answer. */
  sources?: ChatSource[]
  /** The outline level for the answer's top heading. Default 2 (see ChatMarkdown). */
  headingLevel?: number
  /** Why the message failed. Shown under whatever arrived, with Retry when `onRetry` is set. */
  error?: string
  /** The answer was cut off (stopped): its unfinished end renders as it did while streaming. Implied by `error`. */
  incomplete?: boolean
  onRetry?: () => void
  /** Shows Regenerate on assistant messages. */
  onRegenerate?: () => void
  /** Good / bad response, controlled. Shows the pair when set or when `onFeedbackChange` is. */
  feedback?: ChatFeedback
  onFeedbackChange?: (feedback: ChatFeedback) => void
  /** Shows Edit on user messages and receives the new text. */
  onEdit?: (text: string) => void
  /** More actions after the built-in ones: ChatMessageAction elements. */
  actions?: ReactNode
  /** Offer Copy. Default true. */
  copyable?: boolean
  ref?: Ref<HTMLElement>
}

function Timestamp({ value }: { value: Date | string | number }) {
  const locale = useLocale()
  // The browser's time zone is only known once hydrated (useNow); until then, UTC.
  const zone = useNow(0) === null ? 'UTC' : undefined
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return (
    <time
      dateTime={date.toISOString()}
      title={zone ? undefined : date.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}
      className="own:text-ui-sm own:text-fg-muted own:tabular-nums"
    >
      {date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', timeZone: zone, timeZoneName: zone && 'short' })}
    </time>
  )
}

function DefaultAvatar({ role, name, streaming }: { role: ChatRole; name: string; streaming: boolean }) {
  return (
    <Avatar className="size-7">
      {role === 'assistant' ? (
        <AvatarFallback className="bg-fg text-canvas">
          {/* Twinkles while it writes. */}
          <SparklesIcon size={15} strokeWidth={1.75} trigger={streaming ? 'loop' : 'none'} />
        </AvatarFallback>
      ) : (
        <AvatarFallback>{initials(name)}</AvatarFallback>
      )}
    </Avatar>
  )
}

function ChatMessageImpl({
  role,
  name,
  avatar,
  timestamp,
  content,
  streaming = false,
  children,
  footer,
  sources,
  headingLevel,
  error,
  incomplete,
  onRetry,
  onRegenerate,
  feedback,
  onFeedbackChange,
  onEdit,
  actions,
  copyable = true,
  className,
  ...props
}: ChatMessageProps) {
  const labels = useComponentLabels(chatMessageLabels)
  name ??= { assistant: labels.chatAssistant, user: labels.chatYou, system: labels.chatSystem }[role]
  const headerId = useId()
  const list = useChatList()
  const [editing, setEditing] = useState(false)
  const editButton = useRef<HTMLButtonElement>(null)
  const returnFocus = useRef(false)

  // Announce the whole answer once it is complete, never token by token.
  const wasStreaming = useRef(streaming)
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs when streaming flips; content is read at the moment streaming ends, not tracked
  useEffect(() => {
    if (role !== 'assistant' || !list) return
    const text = () => markdownToPlainText(readText(content))
    if (streaming && !wasStreaming.current) list.announce(labels.chatResponding(name))
    if (!streaming && wasStreaming.current && !error) list.announce(`${name}: ${text()}`)
    wasStreaming.current = streaming
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs when streaming flips; content is read at the moment streaming ends, not tracked
  }, [streaming])

  // A message that arrives after the list mounted is new: announce it (history isn't).
  // biome-ignore lint/correctness/useExhaustiveDependencies: announces once, as the message mounts; later changes are announced by the effects above and below
  useEffect(() => {
    if (role !== 'assistant' || !list?.isSettled()) return
    if (error) list.announce(labels.chatResponseFailed(name, error), 'assertive')
    else if (streaming) list.announce(labels.chatResponding(name))
    else list.announce(`${name}: ${markdownToPlainText(readText(content))}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- announces once, as the message mounts; later changes are announced by the effects above and below
  }, [])

  const hadError = useRef(Boolean(error))
  useEffect(() => {
    if (error && !hadError.current) list?.announce(labels.chatResponseFailed(name, error), 'assertive')
    hadError.current = Boolean(error)
  }, [error, list, name, labels])

  useEffect(() => {
    if (editing || !returnFocus.current) return
    returnFocus.current = false
    editButton.current?.focus()
  }, [editing])

  const closeEditor = () => {
    returnFocus.current = true
    setEditing(false)
  }

  const author = `${role}:${name}`
  const header = (
    <header
      id={headerId}
      data-slot="chat-message-header"
      className={cn(
        'own:flex h-7 min-w-0 items-center gap-2',
        role === 'user' && 'flex-row-reverse',
        // Grouped under the author's previous message: still named for screen readers.
        'own:group-data-continued/message:sr-only',
      )}
    >
      <span className="truncate own:text-ui own:font-medium own:text-fg">{name}</span>
      {/* A space for the accessible name ("Youj 10:41"); flex drops it from the layout. */}{' '}
      {timestamp !== undefined && <Timestamp value={timestamp} />}
    </header>
  )

  if (role === 'system') {
    return (
      <article
        data-slot="chat-message"
        data-role="system"
        aria-labelledby={headerId}
        className={cn('group/message own:flex items-center gap-3 own:py-1 own:text-ui-sm own:text-fg-muted', className)}
        {...props}
      >
        <span aria-hidden className="h-px flex-1 bg-line" />
        <p className="max-w-[80%] text-center text-balance">
          <span id={headerId} className="sr-only">
            {name}
          </span>
          <UserText content={content} />
          {timestamp !== undefined && (
            <>
              <span aria-hidden> · </span>
              <Timestamp value={timestamp} />
            </>
          )}
        </p>
        <span aria-hidden className="h-px flex-1 bg-line" />
      </article>
    )
  }

  const showFeedback = role === 'assistant' && (feedback !== undefined || onFeedbackChange !== undefined)
  const toolbar = !streaming && !editing && (
    <MessageActions placement={role === 'user' ? 'beside' : 'below'}>
      {copyable && (
        <ChatCopyButton
          text={() => readText(content)}
          label={labels.copy}
          render={<ToolbarPrimitive.Button render={<Button variant="ghost" size="icon-sm" />} />}
        />
      )}
      {role === 'assistant' && onRegenerate && (
        <ChatMessageAction label={labels.chatRegenerate} onClick={onRegenerate}>
          <RefreshIcon size={16} strokeWidth={1.75} />
        </ChatMessageAction>
      )}
      {showFeedback && (
        <>
          <ChatMessageAction label={labels.chatGoodResponse} pressed={feedback === 'up'} onPressedChange={(on) => onFeedbackChange?.(on ? 'up' : null)}>
            <ThumbsUpIcon size={16} strokeWidth={1.75} active={feedback === 'up'} />
          </ChatMessageAction>
          <ChatMessageAction label={labels.chatBadResponse} pressed={feedback === 'down'} onPressedChange={(on) => onFeedbackChange?.(on ? 'down' : null)}>
            <ThumbsUpIcon size={16} strokeWidth={1.75} active={feedback === 'down'} className="rotate-180" />
          </ChatMessageAction>
        </>
      )}
      {role === 'user' && onEdit && (
        <ChatMessageAction label={labels.edit} onClick={() => setEditing(true)} ref={editButton}>
          <PencilIcon size={16} strokeWidth={1.75} />
        </ChatMessageAction>
      )}
      {actions}
    </MessageActions>
  )

  const errorRow = error && (
    <div
      data-slot="chat-message-error"
      className="own:flex flex-wrap items-center gap-x-2.5 gap-y-2 own:rounded-lg border own:border-danger-line own:bg-danger-subtle own:py-2 own:ps-3 own:pe-2 own:text-ui own:text-danger-text"
    >
      <AlertTriangleIcon size={16} strokeWidth={1.75} trigger="mount" className="shrink-0" />
      <span className="min-w-0 flex-1">{error}</span>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="own:text-fg">
          <RefreshIcon size={14} strokeWidth={1.75} />
          {labels.retry}
        </Button>
      )}
    </div>
  )

  return (
    <article
      data-slot="chat-message"
      data-role={role}
      data-author={author}
      data-streaming={streaming || undefined}
      data-status={error ? 'error' : streaming ? 'streaming' : undefined}
      aria-labelledby={headerId}
      aria-busy={streaming || undefined}
      className={cn('group/message own:flex gap-3', role === 'user' && 'flex-row-reverse', className)}
      {...props}
    >
      {/* Grouped messages keep the avatar's column, so text lines up down the group. */}
      <div className="shrink-0 group-data-continued/message:invisible">{avatar ?? <DefaultAvatar role={role} name={name} streaming={streaming} />}</div>
      <div className={cn('own:flex min-w-0 flex-1 flex-col gap-2', role === 'user' && 'items-end')}>
        {header}
        <InMessageContext.Provider value>{children}</InMessageContext.Provider>
        {role === 'assistant' ? (
          content !== undefined && (
            <ChatMarkdown
              content={content}
              streaming={streaming}
              incomplete={incomplete ?? Boolean(error)}
              sources={sources}
              headingLevel={headingLevel}
              className="own:text-ui-lg leading-6 text-fg"
            />
          )
        ) : editing ? (
          <MessageEditor
            defaultValue={readText(content)}
            onCancel={closeEditor}
            onSave={(text) => {
              closeEditor()
              onEdit?.(text)
            }}
          />
        ) : (
          content !== undefined && (
            // The bubble's actions sit in the free space beside it, so they
            // take no room from the conversation's rhythm, grouped or not.
            <div className="own:flex w-full flex-row-reverse items-end gap-1">
              <div
                data-slot="chat-message-bubble"
                className={cn(
                  'max-w-[min(85%,var(--spacing)*144)] min-w-0 own:rounded-2xl own:bg-hover own:px-3.5 own:py-2 own:text-ui-lg own:leading-6 whitespace-pre-wrap own:text-fg [overflow-wrap:anywhere]',
                  // Bubbles in a group tuck their corners in where they meet, on the author's side.
                  'own:group-data-[group=start]/message:rounded-ee-md',
                  'own:group-data-[group=middle]/message:rounded-se-md own:group-data-[group=middle]/message:rounded-ee-md',
                  'own:group-data-[group=end]/message:rounded-se-md',
                )}
              >
                <UserText content={content} />
              </div>
              {toolbar}
            </div>
          )
        )}
        {sources && sources.length > 0 && !streaming && <ChatSources sources={sources} className="mt-1" />}
        {footer}
        {errorRow}
        {role === 'assistant' && toolbar}
      </div>
    </article>
  )
}

function UserText({ content }: { content?: ChatText }) {
  return useChatText(content)
}

/** A message, memoised: it re-renders only when its own props change. */
const ChatMessage = memo(ChatMessageImpl)

/* ── Actions ────────────────────────────────────────────────────────────── */

function MessageActions({ placement, children }: { placement: 'below' | 'beside'; children: ReactNode }) {
  const direction = useDirection()
  const k = useYouj()
  const labels = useComponentLabels(chatMessageLabels)
  return (
    <TooltipProvider>
      <DirectionProvider direction={direction}>
        <ToolbarPrimitive.Root
          aria-label={labels.chatMessageActions}
          data-slot="chat-message-actions"
          data-reduced-motion={k.reduced || undefined}
          className={cn(
            'own:flex shrink-0 items-center gap-0.5',
            // Below an answer, the first icon's optical edge lines up with the text above.
            placement === 'below' && 'own:-ms-1.5',
            // Quiet until wanted: hover, focus inside, a touch screen, or the latest message.
            'opacity-0 transition-opacity yj-duration-fast ease-standard',
            'group-hover/message:opacity-100 has-focus-visible:opacity-100 touch:opacity-100 group-data-[latest]/message:opacity-100',
            'has-data-pressed:opacity-100',
          )}
        >
          {children}
        </ToolbarPrimitive.Root>
      </DirectionProvider>
    </TooltipProvider>
  )
}

export interface ChatMessageActionProps {
  /** The action's name and tooltip. */
  label: string
  children: ReactNode
  onClick?: () => void
  /** Makes it a toggle (aria-pressed), e.g. good response. */
  pressed?: boolean
  onPressedChange?: (pressed: boolean) => void
  disabled?: boolean
  ref?: Ref<HTMLButtonElement>
}

/** An icon action in a message's toolbar, with a tooltip. With `pressed` it is a toggle. */
function ChatMessageAction({ label, children, onClick, pressed, onPressedChange, disabled, ref }: ChatMessageActionProps) {
  const control =
    pressed === undefined ? (
      <Button variant="ghost" size="icon-sm" />
    ) : (
      <Toggle size="sm" pressed={pressed} onPressedChange={(next) => onPressedChange?.(next)} className="own:text-fg-muted" />
    )
  return (
    <Tooltip>
      <TooltipTrigger
        ref={ref}
        render={<ToolbarPrimitive.Button render={control} disabled={disabled} />}
        aria-label={label}
        onClick={onClick}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

/* ── Editing ────────────────────────────────────────────────────────────── */

function MessageEditor({ defaultValue, onCancel, onSave }: { defaultValue: string; onCancel: () => void; onSave: (text: string) => void }) {
  const labels = useComponentLabels(chatMessageLabels)
  const [value, setValue] = useState(defaultValue)
  const field = useRef<HTMLTextAreaElement>(null)
  const save = () => {
    const text = value.trim()
    if (text) onSave(text)
  }
  const enter = useEnterToSubmit(save)
  useEffect(() => {
    const el = field.current
    if (!el) return
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
  }, [])
  return (
    <InputGroup data-slot="chat-message-editor" className="w-full max-w-[min(100%,var(--spacing)*144)]">
      <InputGroupTextarea
        ref={field}
        aria-label={labels.chatEditMessage}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        {...enter}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            onCancel()
            return
          }
          enter.onKeyDown(event)
        }}
        className="min-h-12 text-ui-lg leading-6"
      />
      <InputGroupAddon align="block-end" className="justify-end gap-1.5">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          {labels.cancel}
        </Button>
        <Button size="sm" onClick={save} disabled={!value.trim()}>
          {labels.send}
        </Button>
      </InputGroupAddon>
    </InputGroup>
  )
}

export { ChatMessage, ChatMessageAction }
