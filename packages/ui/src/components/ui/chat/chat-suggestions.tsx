'use client'

import { chatSuggestionsLabels } from '@youj/core/labels'
import type { ComponentProps, ReactNode } from 'react'
import { Stagger } from '@youj/motion'
import { useComponentLabels } from '@youj/core/labels'
import { cn } from '../../../lib/utils'
import { Button } from '../button'

/* Prompt suggestions: a few good first moves, offered rather than imposed.
 * They arrive in sequence (motion's Stagger: each rises a few px and fades
 * in, one base step after the last), and picking one hands its prompt to
 * `onSelect`, typically to fill the composer and focus it. Chips wrap in a
 * row; cards sit in a two-column grid with a line of detail. Each is a real
 * button in a labeled group. Reduced motion: all at once, in place. */

export interface ChatSuggestion {
  /** What the chip says. */
  label: string
  /** What it puts in the composer. Default: the label. */
  prompt?: string
  /** A second line, shown in the cards layout. */
  description?: string
  /** Sits before the label. */
  icon?: ReactNode
}

export interface ChatSuggestionsProps extends Omit<ComponentProps<'div'>, 'onSelect' | 'children'> {
  suggestions: ChatSuggestion[]
  onSelect: (prompt: string, suggestion: ChatSuggestion) => void
  /** 'chips' wrap in a row; 'cards' form a two-column grid with descriptions. Default 'chips'. */
  layout?: 'chips' | 'cards'
  /** Names the group. Default "Suggested prompts". */
  label?: string
  /** Wait this many stagger steps before the first one arrives. Default 0. */
  delay?: number
}

function ChatSuggestions({ suggestions, onSelect, layout = 'chips', label, delay = 0, className, ...props }: ChatSuggestionsProps) {
  const labels = useComponentLabels(chatSuggestionsLabels)
  label ??= labels.chatSuggestions
  const cards = layout === 'cards'
  return (
    <div role="group" aria-label={label} data-slot="chat-suggestions" data-layout={layout} className={cn('w-full', className)} {...props}>
      <Stagger
        as="ul"
        itemAs="li"
        inView={false}
        variant="rise"
        step="base"
        delay={delay}
        className={cn(cards ? 'own:grid grid-cols-1 gap-2 sm:grid-cols-2' : 'own:flex flex-wrap justify-center gap-2')}
        itemClassName={cn(cards && 'own:flex')}
      >
        {suggestions.map((suggestion) => (
          <Button
            key={suggestion.label}
            variant="outline"
            size={cards ? 'default' : 'sm'}
            onClick={() => onSelect(suggestion.prompt ?? suggestion.label, suggestion)}
            className={cn(
              'own:bg-canvas own:text-fg',
              cards && 'h-auto w-full flex-col items-start gap-0.5 own:px-3.5 own:py-2.5 text-start whitespace-normal',
              '[&_svg]:text-fg-muted',
            )}
          >
            {cards ? (
              <>
                <span className="own:flex items-center gap-2 own:font-medium">
                  {suggestion.icon}
                  {suggestion.label}
                </span>
                {suggestion.description && <span className="own:text-ui-sm own:font-normal own:text-fg-muted">{suggestion.description}</span>}
              </>
            ) : (
              <>
                {suggestion.icon}
                {suggestion.label}
              </>
            )}
          </Button>
        ))}
      </Stagger>
    </div>
  )
}

export { ChatSuggestions }
