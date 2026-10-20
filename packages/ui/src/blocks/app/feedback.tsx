'use client'

import { useEffect, useId, useRef, useState, type HTMLAttributes, type ReactNode } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { MotionFeatures, ThemeScope, useYouj, type ThemeInput } from '@youj/core'
import { Reveal } from '@youj/motion'
import { Card, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { toast, Toaster } from '../../components/ui/toast'
import { cn } from '../../lib/utils'
import { BRAND, DEFAULT_COPY, demo, type Band, type FeedbackEntry, type FeedbackCopy, type FeedbackFollowUp, type FeedbackKind, type FeedbackKindCopy } from './feedback/data'
import { FeedbackForm } from './feedback/feedback-form'
import { FeedbackWidget } from './feedback/feedback-widget'
import { NpsSurvey, type NpsAnswer } from './feedback/nps-survey'
import { RoadmapPage } from './feedback/roadmap-page'

/* In-product feedback for Tern, two ways in.
 * - The NPS survey: a card that slides up into the inline-end corner a moment
 *   after the page settles, without taking focus. 0–10 is one radio group
 *   whose raised key glides to the score (digits jump to it); the follow-up
 *   question and its quick reasons change with the score's band, and the
 *   thanks step folds in with the band's icon playing and the title rising
 *   word by word. "Not now" snoozes and × dismisses, each with Undo in a toast;
 *   focus returns to the page when the card leaves.
 * - The widget: a floating Feedback button that opens a Popover with the type
 *   (bug, idea or praise, which re-words the prompt), the message (⌘↵ sends),
 *   an optional screenshot (FileUpload) and a pending → sent or failed state.
 * Embedded, both sit inline as cards in a settings page. Swap `onAnswer` and
 * `onSend` for your API; name your product with `brand`, rewrite any string
 * in `copy`, and pass your page as `children` to replace the demo behind the
 * survey. It is built for the compact layout density (ui.css), taken from the page.
 * Reduced motion: the card appears in place, the key jumps, and every
 * step changes without travel. */

interface FeedbackProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** A theme to force on the block. Default: none, so it inherits the app's (YoujProvider or a ThemeScope around it). */
  theme?: ThemeInput
  /**
   * A view inside another app (a settings page): a `section` named by an `h2`
   * with the survey and the form side by side as inline cards, and no page
   * height, width or padding, so the host lays it out. Default false.
   */
  embedded?: boolean
  /** Embedded: the section title's level; the cards' titles sit one below it. Default 2. */
  headingLevel?: 1 | 2 | 3
  /** Standalone: the floating NPS survey or the Feedback widget. Default 'survey'. */
  variant?: 'survey' | 'widget'
  /** The product the survey and form ask about, named in their copy (and the demo page's logo). Default: Tern. */
  brand?: { name: string; logo?: ReactNode }
  /** Sends a survey answer; a rejection shows "Couldn’t send" and keeps the answer. Default: a simulated request. */
  onAnswer?: (answer: NpsAnswer) => Promise<unknown> | unknown
  /** Sends a feedback message; resolve with a string to show it as the reference, reject to show its message. Default: a simulated request. */
  onSend?: (feedback: FeedbackEntry) => Promise<unknown> | unknown
  /** The promoter's "Invite a teammate" button. Default: a toast saying an invite link was copied. */
  onInvite?: () => void
  /** The floating survey closed: dismissed (×), snoozed ("Not now") or done after the thanks. */
  onSurveyClose?: (how: 'dismiss' | 'snooze' | 'done') => void
  /** Any of the block's strings, to rewrite or translate; the ones naming the product take `brand.name`. */
  copy?: Partial<FeedbackCopy>
  /** Standalone: your page, behind the floating survey or widget. Default: Tern's roadmap demo. */
  children?: ReactNode
  /** Start the survey with this score chosen. */
  defaultScore?: number
  /** Standalone survey: milliseconds before it slides in. Default 900. */
  delay?: number
}

interface Shared {
  onAnswer: (answer: NpsAnswer) => Promise<unknown>
  onInvite?: () => void
  copy: FeedbackCopy
  brand: { name: string; logo?: ReactNode }
}

function FloatingSurvey({ onAnswer, onInvite, onClose, copy, brand, defaultScore, delay, page }: Shared & { onClose?: FeedbackProps['onSurveyClose']; defaultScore?: number; delay: number; page: ReactNode }) {
  const k = useYouj()
  const [open, setOpen] = useState(false)
  const [round, setRound] = useState(0)
  const card = useRef<HTMLDivElement>(null)
  const main = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setOpen(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  const close = (how: 'dismiss' | 'snooze' | 'done') => {
    if (card.current?.contains(document.activeElement)) main.current?.focus({ preventScroll: true })
    setOpen(false)
    onClose?.(how)
    const reopen = { label: copy.undo, onClick: () => setOpen(true) }
    if (how === 'dismiss') toast(copy.dismissed, { description: copy.dismissedDescription, action: reopen })
    if (how === 'snooze') toast(copy.snoozed, { action: reopen })
    if (how === 'done') setRound((n) => n + 1)
  }

  return (
    <>
      {page === undefined ? (
        <RoadmapPage mainRef={main} brand={brand} />
      ) : (
        <div ref={(node) => void (main.current = node)} tabIndex={-1} className="outline-none">
          {page}
        </div>
      )}
      <MotionFeatures>
        <AnimatePresence>
          {open && (
            <m.div
            ref={card}
            key={round}
            initial={k.reduced ? { opacity: 1 } : { opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={k.reduced ? { opacity: 0, transition: { type: false } } : { opacity: 0, y: 12, scale: 0.98, transition: k.tween('fast', 'exit') }}
            transition={k.reduced ? { type: false } : k.spring('smooth')}
            className="fixed end-4 bottom-4 z-40 w-[min(26rem,calc(100vw-2rem))] origin-bottom"
          >
            <NpsSurvey onSubmit={onAnswer} onClose={close} onInvite={onInvite} copy={copy} product={brand.name} defaultScore={defaultScore} />
            </m.div>
          )}
        </AnimatePresence>
      </MotionFeatures>
    </>
  )
}

function Feedback({
  theme,
  embedded = false,
  headingLevel = 2,
  variant = 'survey',
  brand = BRAND,
  onAnswer: answerProp = () => demo('Feedback: onAnswer', 1100),
  onSend: sendProp = () => demo('Feedback: onSend', 1100),
  onInvite,
  onSurveyClose,
  defaultScore,
  delay = 900,
  copy: copyProp,
  children,
  className,
  ...rest
}: FeedbackProps) {
  const titleId = useId()
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const onAnswer = async (answer: NpsAnswer) => answerProp(answer)
  const onSend = async (feedback: FeedbackEntry) => sendProp(feedback)

  if (embedded) {
    const Title = `h${headingLevel}` as const
    const CardHeading = `h${headingLevel + 1}` as 'h2' | 'h3' | 'h4'
    const inner = (headingLevel + 2) as 3 | 4 | 5
    const view = (
      <section aria-labelledby={titleId} {...rest} className={cn('flex flex-col gap-5 text-fg', className)}>
        <Reveal inView={false} variant="rise" className="flex flex-col gap-1">
          <Title id={titleId} className="text-xl font-semibold tracking-tight">
            {copy.embeddedTitle}
          </Title>
          <p className="text-ui text-fg-muted">{copy.embeddedDescription(brand.name)}</p>
        </Reveal>
        <div className="grid items-start gap-5 lg:grid-cols-2">
          <NpsSurvey inline level={inner} onSubmit={onAnswer} onInvite={onInvite} copy={copy} product={brand.name} defaultScore={defaultScore} />
          <Card size="sm" className="gap-0 py-0">
            <CardHeader className="border-b border-line pt-4">
              <CardTitle>
                <CardHeading>{copy.formTitle}</CardHeading>
              </CardTitle>
              <CardDescription>{copy.formDescription}</CardDescription>
            </CardHeader>
            <div className="p-4">
              <FeedbackForm header={null} headingAs={`h${inner}`} onSend={onSend} copy={copy} product={brand.name} />
            </div>
          </Card>
        </div>
        <Toaster />
      </section>
    )
    return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
  }

  return (
    <ThemeScope theme={theme}>
      <div {...rest} className={cn('min-h-dvh bg-canvas text-fg', className)}>
        {variant === 'survey' ? (
          <FloatingSurvey onAnswer={onAnswer} onInvite={onInvite} onClose={onSurveyClose} copy={copy} brand={brand} defaultScore={defaultScore} delay={delay} page={children} />
        ) : (
          <>
            {children === undefined ? <RoadmapPage mainRef={null} brand={brand} /> : children}
            <FeedbackWidget onSend={onSend} copy={copy} product={brand.name} />
          </>
        )}
        <Toaster />
      </div>
    </ThemeScope>
  )
}

export {
  Feedback,
  type FeedbackProps,
  type FeedbackCopy,
  type FeedbackEntry,
  type FeedbackKind,
  type FeedbackKindCopy,
  type FeedbackFollowUp,
  type NpsAnswer,
  type Band as FeedbackBand,
}
