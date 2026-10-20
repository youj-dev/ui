'use client'

import type { Ref } from 'react'
import { Reveal, TextSplit } from '@youj/motion'
import { HeartIcon, PartyPopperIcon, PencilIcon, SparklesIcon, UserPlusIcon } from '@youj/icons'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { toast } from '../../../components/ui/toast'
import { bandOf, type FeedbackCopy } from './data'

/* The payoff: the band's icon plays its own entrance inside a badge that
 * scales up on the settle spring, the title rises in word by word, then the
 * body and the echo of what was said. A promoter gets the confetti and a way
 * to bring a teammate; a low score gets a heart, not a party. Reduced motion:
 * everything is simply there. */

const ICONS = { detractor: HeartIcon, passive: SparklesIcon, promoter: PartyPopperIcon }

interface NpsThanksProps {
  ref?: Ref<HTMLHeadingElement>
  score: number
  reasons: string[]
  headingAs: 'h3' | 'h4' | 'h5'
  /** Inline: go back and change the answer. */
  onChange?: () => void
  /** Floating: close the card. */
  onDone?: () => void
  /** The promoter's "Invite a teammate". Default: a toast saying the link was copied. */
  onInvite?: () => void
  copy: FeedbackCopy
  product: string
}

function NpsThanks({ ref, score, reasons, headingAs: Heading, onChange, onDone, onInvite, copy, product }: NpsThanksProps) {
  const band = bandOf(score)
  const { title, body } = copy.followUp(product)[band].thanks
  const Icon = ICONS[band]
  return (
    <div className="flex flex-col items-center gap-3 px-4 pt-3 pb-4 text-center">
      <Reveal inView={false} variant="scale" duration="base">
        <span aria-hidden className="grid size-12 place-items-center rounded-full bg-accent-subtle text-accent">
          <Icon trigger="mount" size={24} strokeWidth={2} />
        </span>
      </Reveal>
      <Heading ref={ref} tabIndex={-1} className="text-ui-lg leading-snug font-semibold tracking-tight text-balance text-fg outline-none">
        <TextSplit by="words" variant="rise" inView={false} delay={1}>
          {title}
        </TextSplit>
      </Heading>
      <Reveal inView={false} variant="rise" delay={3} className="flex flex-col items-center gap-3">
        <p className="max-w-80 text-ui text-balance text-fg-muted">{body}</p>
        <p className="flex flex-wrap justify-center gap-1.5">
          <Badge variant="secondary" className="tabular-nums">
            {copy.youSaid(score)}
          </Badge>
          {reasons.map((reason) => (
            <Badge key={reason} variant="outline">
              {reason}
            </Badge>
          ))}
        </p>
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          {band === 'promoter' && (
            <Button
              variant="outline"
              size="sm"
              onClick={onInvite ?? (() => toast.success(copy.inviteCopied, { description: copy.inviteCopiedDescription }))}
            >
              <UserPlusIcon size={16} /> {copy.invite}
            </Button>
          )}
          {onChange && (
            <Button variant="outline" size="sm" onClick={onChange}>
              <PencilIcon size={16} /> {copy.changeAnswer}
            </Button>
          )}
          {onDone && (
            <Button size="sm" onClick={onDone}>
              {copy.done}
            </Button>
          )}
        </div>
      </Reveal>
    </div>
  )
}

export { NpsThanks }
