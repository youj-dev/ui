'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { m } from 'motion/react'
import { cn, MotionFeatures, useYouj } from '@youj/core'
import { Collapse } from '@youj/motion'
import { XIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { AsyncButton } from '../../../components/ui/async-button'
import { Card, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Field, FieldLabel } from '../../../components/ui/field'
import { Textarea } from '../../../components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '../../../components/ui/toggle-group'
import { bandOf, type Band, type FeedbackCopy } from './data'
import { NpsScale } from './nps-scale'
import { NpsThanks } from './nps-thanks'

/* The survey in one card, two steps that fold into each other: each step is a
 * Collapse, so as one closes the other opens and the card's height morphs
 * between them. Picking a score opens the follow-up beneath the scale; its
 * question and quick reasons belong to the score's band and cross-fade when the
 * band changes (a 6 → 7 swaps them, a 7 → 8 doesn't). Sending holds the button
 * pending, then the thanks step takes the card and focus moves to its heading. */

export interface NpsAnswer {
  score: number
  reasons: string[]
  comment: string
}

interface NpsSurveyProps {
  /** Inline in a settings page: a titled card, no dismiss or snooze, and the answer can be changed after. */
  inline?: boolean
  /** Sends the answer. Resolve to show the thanks step. */
  onSubmit: (answer: NpsAnswer) => Promise<unknown>
  /** Closes the floating card: dismissed, snoozed or done after the thanks. */
  onClose?: (how: 'dismiss' | 'snooze' | 'done') => void
  /** Start with this score chosen (its follow-up open). */
  defaultScore?: number | null
  className?: string
  /** The promoter's invite action. */
  onInvite?: () => void
  copy: FeedbackCopy
  /** The product the survey asks about. */
  product: string
  /** The question's heading level; the inline card's title sits one above it. */
  level?: 3 | 4 | 5
}

function BandSwap({ band, children }: { band: Band; children: React.ReactNode }) {
  const k = useYouj()
  return (
    <MotionFeatures>
      <m.div
        key={band}
      initial={k.reduced ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={k.reduced ? { type: false } : k.tween('base', 'enter')}
      className="flex flex-col gap-3"
    >
        {children}
      </m.div>
    </MotionFeatures>
  )
}

function NpsSurvey({ inline = false, onSubmit, onClose, defaultScore = null, className, onInvite, copy, product, level }: NpsSurveyProps) {
  const questionId = useId()
  const followId = useId()
  const [step, setStep] = useState<'ask' | 'thanks'>('ask')
  const [score, setScore] = useState<number | null>(defaultScore)
  const [reasons, setReasons] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const band = score === null ? null : bandOf(score)
  // The follow-up keeps its band's words while it folds away.
  const [lastBand, setLastBand] = useState<Band>(band ?? 'passive')
  if (band && band !== lastBand) setLastBand(band)
  const shownBand = band ?? lastBand
  const follow = copy.followUp(product)[shownBand]
  const thanksHeading = useRef<HTMLHeadingElement>(null)
  const askHeading = useRef<HTMLHeadingElement>(null)
  const moved = useRef(false)

  useEffect(() => {
    if (!moved.current) return
    ;(step === 'thanks' ? thanksHeading : askHeading).current?.focus({ preventScroll: true })
  }, [step])

  const choose = (next: number) => {
    if (score !== null && bandOf(next) !== bandOf(score)) setReasons([])
    setScore(next)
  }

  const go = (next: 'ask' | 'thanks') => {
    moved.current = true
    setStep(next)
  }

  const Heading = `h${level ?? (inline ? 4 : 3)}` as 'h3' | 'h4' | 'h5'
  const CardHeading = `h${(level ?? 4) - 1}` as 'h2' | 'h3' | 'h4'

  return (
    <Card
      size="sm"
      role={inline ? undefined : 'region'}
      aria-label={inline ? undefined : copy.surveyLabel(product)}
      className={cn('gap-0 py-0', !inline && 'shadow-lg', className)}
    >
      {inline ? (
        <CardHeader className="border-b border-line pt-4">
          <CardTitle>
            <CardHeading>{copy.inlineTitle}</CardHeading>
          </CardTitle>
          <CardDescription>{copy.inlineDescription}</CardDescription>
        </CardHeader>
      ) : (
        <div className="flex h-11 items-center gap-2 ps-4 pe-2">
          <span aria-hidden className="size-1.5 rounded-full bg-accent" />
          <span className="text-ui-sm font-medium text-fg-muted">{step === 'ask' ? copy.askStatus : copy.sentStatus}</span>
          <Button variant="ghost" size="icon-sm" className="ms-auto" aria-label={copy.dismissSurvey} onClick={() => onClose?.('dismiss')}>
            <XIcon size={16} />
          </Button>
        </div>
      )}

      <Collapse open={step === 'ask'}>
        <div className={cn('flex flex-col px-4 pb-4', inline && 'pt-4')}>
          <Heading
            ref={askHeading}
            id={questionId}
            tabIndex={-1}
            className="mb-4 text-ui-lg leading-snug font-semibold tracking-tight text-fg outline-none"
          >
            {copy.question(product)}
          </Heading>
          <NpsScale value={score} onValueChange={choose} labelledBy={questionId} copy={copy} />

          <Collapse open={band !== null} id={followId}>
            <BandSwap band={shownBand}>
              <div className="flex flex-col gap-2 pt-5">
                <p id={`${followId}-q`} className="text-ui font-medium text-fg">
                  {follow.question}
                </p>
                <ToggleGroup
                  multiple
                  variant="outline"
                  size="sm"
                  aria-labelledby={`${followId}-q`}
                  value={reasons}
                  onValueChange={(next: unknown[]) => setReasons(next as string[])}
                  className="w-full flex-wrap"
                >
                  {follow.reasons.map((reason) => (
                    <ToggleGroupItem key={reason} value={reason} className="data-pressed:border-accent data-pressed:bg-accent-subtle data-pressed:text-fg">
                      {reason}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
              <Field>
                <FieldLabel>
                  {copy.addMore} <span className="font-normal text-fg-muted">{copy.optional}</span>
                </FieldLabel>
                <Textarea rows={2} className="min-h-16" maxLength={1000} placeholder={follow.placeholder} value={comment} onChange={(e) => setComment(e.target.value)} />
              </Field>
            </BandSwap>
          </Collapse>

          <div className="mt-4 flex items-center gap-2">
            {!inline && (
              <Button variant="ghost" size="sm" className="-ms-2" onClick={() => onClose?.('snooze')}>
                {copy.notNow}
              </Button>
            )}
            <AsyncButton
              size="sm"
              className="ms-auto"
              disabled={score === null}
              pendingLabel={copy.sending}
              successLabel={copy.sent}
              errorLabel={copy.sendFailed}
              onAction={async () => {
                await onSubmit({ score: score!, reasons, comment: comment.trim() })
                go('thanks')
              }}
            >
              {copy.send}
            </AsyncButton>
          </div>
        </div>
      </Collapse>

      <Collapse open={step === 'thanks'}>
        {score !== null && (
          <NpsThanks
            ref={thanksHeading}
            score={score}
            reasons={reasons}
            headingAs={Heading}
            onChange={inline ? () => go('ask') : undefined}
            onDone={inline ? undefined : () => onClose?.('done')}
            onInvite={onInvite}
            copy={copy}
            product={product}
          />
        )}
      </Collapse>
    </Card>
  )
}

export { NpsSurvey }
