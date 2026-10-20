'use client'

import { useSyncExternalStore, type ReactNode } from 'react'
import { ClockIcon, CornerDownLeftIcon } from '@youj/icons'
import { Kbd } from '../../../components/ui/kbd'
import { cn } from '../../../lib/utils'
import type { Survey } from '../question/data'

/* The pieces around the questions: the welcome a link opens on, the hint
 * beside the action (Enter, or ⌘↵ in a long answer), and the product's mark. */

const subscribeNothing = () => () => {}
const isApple = () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)

interface WelcomeProps {
  survey: Survey
  /** The title's heading, on a page of its own; embedded, the card's header already names the survey. */
  heading?: 'h1'
  /** "Takes about 3 min". */
  length: string
}

export function Welcome({ survey, heading: Heading, length }: WelcomeProps) {
  return (
    <div className="flex flex-col items-start gap-4">
      {Heading ? (
        <Heading
          data-yj-step-heading
          tabIndex={-1}
          className="rounded-sm text-3xl leading-tight font-semibold tracking-tight text-balance text-fg outline-none @2xl:text-4xl"
        >
          {survey.title}
        </Heading>
      ) : null}
      {survey.description && (
        <p
          data-yj-step-heading={Heading ? undefined : ''}
          tabIndex={Heading ? undefined : -1}
          className={cn('max-w-xl text-pretty text-fg-muted outline-none', Heading ? 'text-ui-lg @2xl:text-lg' : 'text-ui')}
        >
          {survey.description}
        </p>
      )}
      <span className="flex items-center gap-1.5 text-ui-sm text-fg-muted">
        <ClockIcon size={14} aria-hidden />
        {length}
      </span>
    </div>
  )
}

interface EnterHintProps {
  /** A long answer: ⌘↵ (Ctrl+↵) goes on, since Enter makes a new line. */
  long: boolean
  pressEnter: string
  pressModEnter: string
  className?: string
}

/** Beside the action: how to go on from the keyboard. Hidden on touch, where there's no Enter to press. */
export function EnterHint({ long, pressEnter, pressModEnter, className }: EnterHintProps) {
  const apple = useSyncExternalStore(subscribeNothing, isApple, () => true)
  return (
    <span aria-hidden className={cn('items-center gap-1.5 text-ui-sm text-fg-muted touch:hidden', className)}>
      {long ? (
        <>
          {/* A key combination reads left to right in any language. */}
          <span dir="ltr" className="inline-flex items-center gap-1">
            <Kbd>{apple ? '⌘' : 'Ctrl'}</Kbd>
            <Kbd>
              <CornerDownLeftIcon size={12} className="rtl:-scale-x-100" />
            </Kbd>
          </span>
          {pressModEnter}
        </>
      ) : (
        <>
          {pressEnter}
          <Kbd>
            <CornerDownLeftIcon size={12} className="rtl:-scale-x-100" />
          </Kbd>
        </>
      )}
    </span>
  )
}

/** The product's mark and name, at the page's start. */
export function BrandMark({ brand }: { brand: { name: string; logo?: ReactNode } }) {
  return (
    <span className="flex min-w-0 items-center gap-2 text-ui font-semibold text-fg">
      {brand.logo ?? (
        <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-md bg-fg text-ui-xs font-bold text-canvas">
          {brand.name.charAt(0)}
        </span>
      )}
      <span className="truncate">{brand.name}</span>
    </span>
  )
}
