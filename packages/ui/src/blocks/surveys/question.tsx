'use client'

import { useEffect, useLayoutEffect, useRef, useState, type HTMLAttributes } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { MotionFeatures, ThemeScope, useYouj, type ThemeInput } from '@youj/core'
import { AsyncButton } from '../../components/ui/async-button'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { cn } from '../../lib/utils'
import {
  answered,
  demo,
  designTheme,
  HELPFUL,
  problem,
  QUESTION_COPY,
  type Survey,
  type SurveyAnswer,
  type SurveyAnswers,
  type SurveyCondition,
  type SurveyDesign,
  type SurveyLogic,
  type SurveyOption,
  type SurveyQuestion,
  type SurveyQuestionType,
} from './question/data'
import { useSeed } from './question/flow'
import { Done } from './question/review'
import { QuestionView } from './question/view'

/* One question, anywhere: a rating under an article, a poll in a sidebar, a
 * check-in after a support chat. It takes any question of the survey
 * definition and answers it with the same control every survey block uses:
 * a face, a scale, a choice, a ranking. A pick that needs nothing more (a
 * face, a point on a scale, a single choice, yes or no) sends itself after a
 * beat; the rest send with Send. The thanks rises in where the question was,
 * with a way back to change the answer. A failed send keeps the answer and
 * says why. Reduced motion: the thanks swaps in place.
 *
 * Its folder is the kit the other survey blocks share: the definition and
 * its logic (`data.ts`), the walk through it (`flow.ts`) and the question
 * renderers (`view.tsx` and the controls beside it). */

const DEFAULT_COPY = {
  ...QUESTION_COPY,
  send: 'Send',
  sending: 'Sending…',
  sent: 'Sent',
  failed: 'Couldn’t send',
  failedDescription: 'Nothing is lost. Try again in a moment.',
  doneTitle: 'Thanks for the feedback',
  doneDescription: 'It helps us make these pages better.',
  change: 'Change your answer',
}

type SurveyQuestionCardCopy = typeof DEFAULT_COPY

/** The types answered with one pick, which can send themselves. */
const ONE_PICK: SurveyQuestionType[] = ['emoji', 'nps', 'scale', 'rating', 'yesno']

interface SurveyQuestionCardProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'defaultValue' | 'onSubmit'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** The card alone, its title an `h2`. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (448px at 100% scale). Default false. */
  fill?: boolean
  /** The question. Default: how an article was, on five faces. */
  question?: SurveyQuestion
  /** The answer, controlled: pair it with `onValueChange`. */
  value?: SurveyAnswer
  /** The answer to start from, when the block owns it. */
  defaultValue?: SurveyAnswer
  /** Called with the answer as it changes. */
  onValueChange?: (answer: SurveyAnswer | undefined) => void
  /** Sends the answer; reject to keep it and say so. Default: a short demo wait. */
  onSubmit?: (answer: SurveyAnswer) => Promise<unknown> | unknown
  /** A pick that needs nothing more sends itself. Default true; `false` always waits for Send. */
  autoSubmit?: boolean
  /** The survey's design (an accent, corners, a typeface) to wear. Default: the app's look. */
  design?: SurveyDesign
  /** A respondent's id, so a randomized question's options keep their order. */
  seed?: string
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<SurveyQuestionCardCopy>
}

function SurveyQuestionCard({
  theme,
  embedded = true,
  fill = false,
  question = HELPFUL,
  value,
  defaultValue,
  onValueChange,
  onSubmit,
  autoSubmit = true,
  design,
  seed: seedProp,
  copy: copyProp,
  className,
  ...rest
}: SurveyQuestionCardProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const k = useYouj()
  const seed = useSeed(seedProp)
  const [own, setOwn] = useState<SurveyAnswer | undefined>(defaultValue)
  const answer = value ?? own
  const [otherOpen, setOtherOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [sent, setSent] = useState(false)

  const change = (next: SurveyAnswer | undefined, other?: boolean) => {
    if (value === undefined) setOwn(next)
    onValueChange?.(next)
    if (other !== undefined) setOtherOpen(other)
    setError(null)
    setStatus('idle')
  }

  const send = async (current = answer) => {
    const message = problem(question, current, copy, otherOpen)
    if (message || !answered(current)) {
      setError(message ?? copy.pick)
      return
    }
    setStatus('pending')
    try {
      await (onSubmit ? onSubmit(current!) : demo('SurveyQuestionCard: onSubmit', 700))
      setStatus('success')
      setSent(true)
    } catch (cause) {
      setStatus('error')
      setError(cause instanceof Error && cause.message ? cause.message : copy.failedDescription)
    }
  }

  // A pick that needs nothing more sends after a beat, long enough to see what was picked. The timer reads the latest answer.
  const oneTap = autoSubmit && ONE_PICK.includes(question.type)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const latestSend = useRef(send)
  useLayoutEffect(() => {
    latestSend.current = send
  })
  useEffect(() => () => clearTimeout(timer.current), [])
  const onPicked = () => {
    if (!oneTap) return
    clearTimeout(timer.current)
    timer.current = setTimeout(() => latestSend.current(), k.ms('slow') + k.ms('fast'))
  }
  const Title = embedded ? 'h2' : 'h1'
  // Sent: focus moves to the thanks, so it's heard.
  const thanks = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (sent) thanks.current?.querySelector<HTMLElement>('[data-yj-step-heading]')?.focus({ preventScroll: true })
  }, [sent])

  // The thanks takes the question's place in the same cell, so the card keeps its size between the two.
  const card = (
    <Card
      role="region"
      aria-label={question.title}
      {...(embedded ? rest : null)}
      className={cn('w-full text-fg', embedded ? 'shadow-sm' : 'shadow-lg', !fill && 'max-w-md', embedded && className)}
    >
      <CardContent className="grid">
        <MotionFeatures>
          <m.div
            aria-hidden={sent || undefined}
            inert={sent || undefined}
            animate={{ opacity: sent ? 0 : 1, y: sent && !k.reduced ? -8 : 0 }}
            transition={sent ? k.tween('fast', 'exit') : k.tween('base', 'enter')}
            className="col-start-1 row-start-1 flex flex-col gap-3"
          >
            <QuestionView
              question={question}
              answer={answer}
              otherOpen={otherOpen}
              error={error}
              heading={Title}
              copy={copy}
              seed={seed}
              onAnswer={change}
              onPicked={onPicked}
              onSubmit={() => send()}
            />
            {!oneTap && (
              <div className="flex justify-end">
                <AsyncButton status={status} pendingLabel={copy.sending} successLabel={copy.sent} errorLabel={copy.failed} onClick={() => send()}>
                  {copy.send}
                </AsyncButton>
              </div>
            )}
            {oneTap && (
              <span role="status" className="sr-only">
                {status === 'pending' ? copy.sending : ''}
              </span>
            )}
          </m.div>
          <AnimatePresence initial={false}>
            {sent && (
              <m.div
                ref={thanks}
                key="thanks"
                initial={{ opacity: 0, y: k.reduced ? 0 : 12 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    y: k.spring('smooth'),
                    opacity: {
                      ...k.tween('base', 'enter'),
                      delay: k.duration('instant'),
                    },
                  },
                }}
                exit={{ opacity: 0, transition: k.tween('instant', 'exit') }}
                className="col-start-1 row-start-1 flex flex-col justify-center"
              >
                <Done heading={Title} title={copy.doneTitle} description={copy.doneDescription} className="gap-3 py-0">
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto px-0"
                    onClick={() => {
                      setSent(false)
                      setStatus('idle')
                    }}
                  >
                    {copy.change}
                  </Button>
                </Done>
              </m.div>
            )}
          </AnimatePresence>
        </MotionFeatures>
      </CardContent>
    </Card>
  )

  const scoped = design ? <ThemeScope theme={designTheme(design)}>{card}</ThemeScope> : card
  const shell = embedded ? (
    scoped
  ) : (
    <main {...rest} className={cn('grid min-h-dvh w-full place-items-center bg-canvas px-4 py-10 text-fg', className)}>
      {scoped}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{shell}</ThemeScope> : shell
}

export { SurveyQuestionCard, DEFAULT_COPY as SURVEY_QUESTION_COPY }
export type {
  Survey,
  SurveyAnswer,
  SurveyAnswers,
  SurveyCondition,
  SurveyDesign,
  SurveyLogic,
  SurveyOption,
  SurveyQuestion,
  SurveyQuestionCardCopy,
  SurveyQuestionCardProps,
  SurveyQuestionType,
}
