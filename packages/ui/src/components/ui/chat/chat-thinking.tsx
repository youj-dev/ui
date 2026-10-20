'use client'

import { chatThinkingLabels } from '@youj/core/labels'
import { useContext, useEffect, useId, useRef, useState, type ComponentProps, type RefObject } from 'react'
import { Collapse, MorphLabel } from '@youj/motion'
import { useComponentLabels } from '@youj/core/labels'
import { LightbulbIcon } from '@youj/icons/components/youj/icons/lightbulb'
import { LoaderDotsIcon } from '@youj/icons/components/youj/icons/loader-dots'
import { useYouj } from '@youj/core/lib/youj/provider'
import { cn } from '../../../lib/utils'
import { CollapsibleChevron } from '../collapsible'
import { InMessageContext, useChatList } from './chat-context'
import { ChatMarkdown } from './chat-markdown'
import { ChatStyles } from './chat-styles'
import type { ChatText } from './chat-text-stream'

/* The assistant at work before (and while) it answers.
 * - ChatTypingIndicator: "Thinking…" with a band of light sweeping across
 *   the letters, or three dots in a traveling wave. The sweep is transform
 *   only (a masked copy of the text rides a band that slides one way while
 *   the copy slides back), on 3 × deliberate, paused offscreen.
 * - ChatReasoning: the model's reasoning, streamed into a block that folds
 *   away (motion's Collapse) once the thinking is done, leaving "Thought for"
 *   and how long it took. It opens while streaming unless the reader has
 *   closed it, and the reader's choice then sticks.
 * Reduced motion: the text holds still (no sweep, no wave) and the block
 * opens and closes instantly. */

/** Pauses a CSS loop while its element is offscreen or the tab is hidden, via [data-paused]. */
function usePausedOffscreen(ref: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return
    let visible = true
    const sync = () => el.toggleAttribute('data-paused', !visible || document.hidden)
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true
      sync()
    })
    observer.observe(el)
    document.addEventListener('visibilitychange', sync)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', sync)
    }
  }, [ref, enabled])
}

/** Text with a band of light sweeping across it. */
function ShimmerText({ children: text, className }: { children: string; className?: string }) {
  const k = useYouj()
  const ref = useRef<HTMLSpanElement>(null)
  usePausedOffscreen(ref, !k.reduced)
  return (
    <span ref={ref} data-reduced-motion={k.reduced || undefined} className={cn('yj-chat-shimmer', className)}>
      <ChatStyles />
      {text}
      <span aria-hidden className="yj-chat-shimmer__band">
        <span className="yj-chat-shimmer__text">{text}</span>
      </span>
    </span>
  )
}

export interface ChatTypingIndicatorProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** 'shimmer' sweeps light across the label; 'dots' is three dots in a wave. Default 'shimmer'. */
  variant?: 'shimmer' | 'dots'
  /** Shown and announced. Default "Thinking…". */
  label?: string
}

/**
 * The assistant is working and nothing has arrived yet. In a
 * ChatMessageList it's announced once through the list (unless it sits in a
 * ChatMessage, which already said it's responding); on its own it is a
 * status region.
 */
function ChatTypingIndicator({ variant = 'shimmer', label, className, ...props }: ChatTypingIndicatorProps) {
  const labels = useComponentLabels(chatThinkingLabels)
  label ??= labels.chatThinking
  const list = useChatList()
  const inMessage = useContext(InMessageContext)
  // biome-ignore lint/correctness/useExhaustiveDependencies: announces once, when the indicator appears
  useEffect(() => {
    if (!inMessage) list?.announce(label)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- announces once, when the indicator appears
  }, [])
  return (
    <div
      role={list ? undefined : 'status'}
      data-slot="chat-typing-indicator"
      data-variant={variant}
      className={cn('own:flex h-7 items-center gap-2 own:text-ui own:text-fg-muted', className)}
      {...props}
    >
      {variant === 'dots' ? (
        <>
          <LoaderDotsIcon size={28} strokeWidth={1.75} className="own:-ms-1 own:text-fg-muted" />
          <span className="sr-only">{label}</span>
        </>
      ) : (
        <ShimmerText>{label}</ShimmerText>
      )}
    </div>
  )
}

export interface ChatReasoningProps extends Omit<ComponentProps<'div'>, 'content' | 'children'> {
  /** The reasoning, as markdown: a string, or a ChatTextSource streaming it. */
  content: ChatText
  /** Still thinking: the label sweeps and the text streams in. */
  streaming?: boolean
  /** How long the thinking took, in seconds: the folded label says so. */
  duration?: number
  /** Controlled. Uncontrolled, it is open while streaming and folds away when done, until the reader toggles it. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/** The model's reasoning in a disclosure: streaming while it thinks, folded away after. */
function ChatReasoning({ content, streaming = false, duration, open: openProp, onOpenChange, className, ...props }: ChatReasoningProps) {
  const id = useId()
  const labels = useComponentLabels(chatThinkingLabels)
  // Until the reader toggles it, the block follows the stream: open while thinking, closed after.
  const [chosen, setChosen] = useState<boolean | null>(null)
  const open = openProp ?? chosen ?? streaming
  const toggle = () => {
    setChosen(!open)
    onOpenChange?.(!open)
  }
  const label = streaming ? labels.chatThinking : duration !== undefined ? labels.chatThoughtFor(duration) : labels.chatReasoning
  return (
    <div data-slot="chat-reasoning" data-streaming={streaming || undefined} className={cn('own:flex flex-col', className)} {...props}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={toggle}
        className={cn(
          '-ms-1 inline-flex h-7 w-fit items-center gap-1.5 rounded-md px-1 own:text-ui text-fg-muted focus-ring',
          'transition-colors yj-duration-fast ease-standard hover:text-fg',
        )}
      >
        <LightbulbIcon size={14} strokeWidth={1.75} className="shrink-0" />
        <MorphLabel value={streaming ? 'thinking' : 'done'} contentClassName="gap-0">
          {streaming ? <ShimmerText>{label}</ShimmerText> : label}
        </MorphLabel>
        <CollapsibleChevron size={14} className="shrink-0 own:text-fg-subtle" />
      </button>
      <Collapse id={id} open={open}>
        {/* The rule and the padding sit inside the panel, so nothing is clipped while it folds. */}
        <div className="pt-1.5 pb-1">
          <div className="border-s-2 border-line ps-3.5">
            {/* Thinking is quieter than the answer: muted text, and a muted caret. */}
            <ChatMarkdown
              content={content}
              streaming={streaming}
              className="gap-2 own:text-ui leading-5 text-fg-muted [&_[data-slot=chat-caret]]:bg-fg-subtle"
            />
          </div>
        </div>
      </Collapse>
    </div>
  )
}

export { ChatReasoning, ChatTypingIndicator }
