'use client'

import { useRef } from 'react'
import { animate } from 'motion/react'
import { useYouj } from '@youj/core'
import { Counter } from '@youj/motion'
import { ArrowUpIcon } from '@youj/icons'
import { cn } from '../../../lib/utils'
import { Toggle } from '../../../components/ui/toggle'
import { useRoadmap } from './context'

/* The upvote: a Toggle (aria-pressed) named for the request, so its name
 * never changes with the count. Voting fills it with the accent, the arrow
 * lifts and lands on the settle spring, and the count rolls up a digit;
 * un-voting drains the fill and rolls it back. Every change starts from where
 * the last one is, so rapid toggling never jumps. The block announces the new
 * count. Reduced motion: the fill and number change in place. */

export function VoteButton({
  title,
  count,
  voted,
  onVote,
  layout = 'stack',
  className,
}: {
  title: string
  count: number
  voted: boolean
  onVote: (voted: boolean) => void
  /** 'stack' puts the count under the arrow (lists); 'row' beside it (the sheet, suggestions). */
  layout?: 'stack' | 'row'
  className?: string
}) {
  const k = useYouj()
  const { copy } = useRoadmap()
  const arrow = useRef<HTMLSpanElement>(null)

  const toggle = (next: boolean) => {
    onVote(next)
    const el = arrow.current
    if (!el || k.reduced) return
    if (next) {
      animate(el, { y: -4 }, k.tween('fast', 'exit')).then(() => animate(el, { y: 0 }, k.spring('settle')))
    } else {
      animate(el, { y: [null, 2, 0] }, k.tween('base', 'standard'))
    }
  }

  return (
    <Toggle
      variant="outline"
      pressed={voted}
      onPressedChange={toggle}
      aria-label={copy.upvote(title)}
      data-slot="vote-button"
      // shape: stacked, a vote counter is the arrow over the count, taller than a control
      className={cn(
        'relative z-10 h-auto shrink-0 gap-0.5 bg-surface font-semibold text-fg tabular-nums',
        'data-pressed:border-accent-line data-pressed:bg-accent-subtle data-pressed:text-accent-text hover:data-pressed:bg-accent-line',
        layout === 'stack' ? 'min-h-14 w-12 flex-col px-1 py-1.5 text-ui' : 'h-control gap-1.5 px-2.5 text-ui',
        className,
      )}
    >
      <span ref={arrow} aria-hidden className="grid place-items-center">
        <ArrowUpIcon trigger="none" size={layout === 'stack' ? 16 : 15} strokeWidth={2.25} />
      </span>
      <Counter aria-hidden mode="roll" value={count} from={count} inView={false} duration="base" ease="enter" />
    </Toggle>
  )
}
