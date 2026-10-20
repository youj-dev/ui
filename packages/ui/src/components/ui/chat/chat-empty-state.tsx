'use client'

import type { ComponentProps, ReactNode } from 'react'
import { Reveal, TextSplit } from '@youj/motion'
import { SparklesIcon } from '@youj/icons/components/youj/icons/sparkles'
import { cn } from '../../../lib/utils'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../empty'
import { ChatSuggestions, type ChatSuggestion } from './chat-suggestions'

/* A new conversation: a greeting and a few ways in. It is the Empty
 * primitive (the icon tile over plates that fan out as it appears), with the
 * greeting rising in word by word from behind its line (motion's TextSplit,
 * masked), the description fading in after it, and the suggestions staggering
 * in last. One arrival, in order, then stillness. Screen readers get the
 * greeting whole. Reduced motion: all of it in place at once. */

export interface ChatEmptyStateProps extends Omit<ComponentProps<'div'>, 'onSelect'> {
  /** Revealed word by word, read whole. */
  greeting: string
  description?: ReactNode
  /** The tile's icon. Default: youj's SparklesIcon. */
  icon?: ReactNode
  suggestions?: ChatSuggestion[]
  onSelect?: (prompt: string, suggestion: ChatSuggestion) => void
  /** Default 'cards'. */
  suggestionsLayout?: 'chips' | 'cards'
}

function ChatEmptyState({
  greeting,
  description,
  icon,
  suggestions,
  onSelect,
  suggestionsLayout = 'cards',
  className,
  children,
  ...props
}: ChatEmptyStateProps) {
  const words = greeting.split(/\s+/).filter(Boolean).length
  return (
    <Empty data-slot="chat-empty-state" className={cn('gap-8', className)} {...props}>
      <EmptyHeader className="max-w-md gap-2">
        <EmptyMedia variant="icon">{icon ?? <SparklesIcon />}</EmptyMedia>
        <EmptyTitle className="text-[1.5rem] leading-8 tracking-[-0.02em]">
          <TextSplit as="span" by="words" variant="rise" mask inView={false}>
            {greeting}
          </TextSplit>
        </EmptyTitle>
        {description && (
          <EmptyDescription className="text-ui-lg">
            <Reveal as="span" variant="fade" inView={false} delay={words}>
              {description}
            </Reveal>
          </EmptyDescription>
        )}
      </EmptyHeader>
      {suggestions && onSelect && (
        <ChatSuggestions suggestions={suggestions} onSelect={onSelect} layout={suggestionsLayout} delay={words + 2} className="max-w-xl" />
      )}
      {children}
    </Empty>
  )
}

export { ChatEmptyState }
