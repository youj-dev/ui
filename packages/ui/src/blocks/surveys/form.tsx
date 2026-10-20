'use client'

import { useEffect, useId, useRef, useState, type HTMLAttributes, type ReactNode } from 'react'
import { ThemeScope, useYouj, type ThemeInput } from '@youj/core'
import { PresenceItem, PresenceList } from '@youj/motion'
import { AsyncButton } from '../../components/ui/async-button'
import { Button } from '../../components/ui/button'
import { Progress } from '../../components/ui/progress'
import { cn } from '../../lib/utils'
import { BrandMark } from './conversational/parts'
import { ProblemSummary } from './form/summary'
import {
  answered,
  asked,
  demo,
  designTheme,
  otherText,
  problem,
  QUESTION_COPY,
  SURVEY,
  wait,
  type Survey,
  type SurveyAnswer,
  type SurveyAnswers,
} from './question/data'
import { useSeed } from './question/flow'
import { Done } from './question/review'
import { QuestionView } from './question/view'

/* A survey on one page: every question in a numbered column, the way people
 * fill in a form they can see the end of. Logic still applies: a question an
 * answer reveals rises into its place while the ones below glide down, and
 * one it hides fades out and the rest close up, renumbered; the bar at the top
 * counts what's answered of what's asked. Enter in a question moves on to the
 * next one. Send checks every answer: each problem is said under its question
 * and gathered in a summary at the top, which takes focus and links to each
 * one. A failed send keeps every answer and says so; the thanks takes the
 * page's place. The page holds still while all this happens: the questions
 * scroll inside it, under a header that stays. Reduced motion: questions
 * appear and go in place.
 *
 * Pass your `survey`, keep the answers with `value`/`onValueChange`, send
 * them through `onSubmit`; every string is in `copy`. */

const DEFAULT_COPY = {
  ...QUESTION_COPY,
  pick: 'Choose an answer.',
  progress: 'Progress',
  /** In the header: "4 of 11 answered". */
  answered: (count: number, total: number) => `${count} of ${total} answered`,
  /** The summary's title when the send finds problems. */
  problemsTitle: 'There’s a problem with your answers',
  /** One problem in the summary, linking to its question: "Question 3: Choose an answer." */
  problemLink: (number: number, message: string) => `Question ${number}: ${message}`,
  send: 'Send answers',
  sending: 'Sending…',
  sent: 'Sent',
  failed: 'Couldn’t send',
  /** On Send while answers have problems. */
  checkAnswers: 'Check your answers',
  failedTitle: 'Your answers didn’t send',
  failedDescription: 'Nothing is lost. Try again in a moment.',
  again: 'Start over',
}

type SurveyFormCopy = typeof DEFAULT_COPY

/** What Send rejects with when answers have problems: the button says so instead of "Couldn’t send". */
const BLOCKED = new Error('blocked')

interface SurveyFormProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'defaultValue' | 'onSubmit'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Hosted inside another page: a panel of fixed height with an `h2` (each question an `h3`) instead of the whole screen. Default false. */
  embedded?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<SurveyFormCopy>
  /** The survey: its questions, logic, ending and design. Default: Tern's product survey. */
  survey?: Survey
  /** The answers, controlled: pair it with `onValueChange` (to save a draft and resume it). */
  value?: SurveyAnswers
  /** The answers to start from, when the block owns them. */
  defaultValue?: SurveyAnswers
  /** Called with every answer as it changes. */
  onValueChange?: (answers: SurveyAnswers) => void
  /** Sends the answers to the questions that were asked; reject to keep them and say so. Default: a short demo wait. */
  onSubmit?: (answers: SurveyAnswers) => Promise<unknown> | unknown
  /** The product, in the header. Default: Tern. */
  brand?: { name: string; logo?: ReactNode }
  /** A respondent's id, so randomized options keep their order across visits. */
  seed?: string
}

function SurveyForm({
  theme,
  embedded = false,
  copy: copyProp,
  survey = SURVEY,
  value,
  defaultValue,
  onValueChange,
  onSubmit,
  brand = { name: 'Tern' },
  seed: seedProp,
  className,
  ...rest
}: SurveyFormProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const k = useYouj()
  const seed = useSeed(seedProp)
  const id = useId()
  const [own, setOwn] = useState<SurveyAnswers>(defaultValue ?? {})
  const answers = value ?? own
  const path = asked(survey.questions, answers)
  const [others, setOthers] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      survey.questions.flatMap((q) => (q.type === 'choice' && q.other ? [[q.id, !!otherText(q, (value ?? defaultValue)?.[q.id])]] : [])),
    ),
  )
  // Problems show once a send has been tried, and each clears as its question is answered.
  const [tried, setTried] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const problems = path.flatMap((q, i) => {
    const message = tried ? problem(q, answers[q.id], copy, !!others[q.id]) : undefined
    return message ? [{ id: q.id, number: i + 1, message }] : []
  })
  const count = path.filter((q) => answered(answers[q.id])).length

  const region = useRef<HTMLDivElement>(null)
  const summary = useRef<HTMLDivElement>(null)
  const [focusSummary, setFocusSummary] = useState(0)
  useEffect(() => {
    if (!focusSummary) return
    region.current?.scrollTo?.({ top: 0, behavior: 'smooth' })
    summary.current?.focus({ preventScroll: true })
  }, [focusSummary])
  useEffect(() => {
    region.current?.scrollTo?.({ top: 0 })
  }, [done])

  const answer = (qid: string, next: SurveyAnswer | undefined, otherOpen?: boolean) => {
    const all = { ...answers }
    if (next === undefined) delete all[qid]
    else all[qid] = next
    if (value === undefined) setOwn(all)
    onValueChange?.(all)
    if (otherOpen !== undefined) setOthers((open) => ({ ...open, [qid]: otherOpen }))
  }

  const questionEl = (qid: string) => document.getElementById(`${id}-${qid}`)
  /** Enter in a question: focus the next one's first control. */
  const onward = (qid: string) => {
    const next = path[path.findIndex((q) => q.id === qid) + 1]
    const el = next && questionEl(next.id)
    const target = el?.querySelector<HTMLElement>(
      '[data-yj-autofocus], [role=radio][tabindex="0"], [role=radio]:not([tabindex]), input, button, textarea, [tabindex="0"]',
    )
    target?.focus()
    el?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })
  }

  const send = async () => {
    setTried(true)
    setFailure(null)
    const blocked = path.some((q) => problem(q, answers[q.id], copy, !!others[q.id]))
    if (blocked) {
      setFocusSummary((n) => n + 1)
      throw BLOCKED
    }
    const sent = Object.fromEntries(path.filter((q) => answered(answers[q.id])).map((q) => [q.id, answers[q.id]!]))
    try {
      await (onSubmit ? onSubmit(sent) : demo('SurveyForm: onSubmit', 1100))
    } catch (cause) {
      setFailure(cause instanceof Error && cause.message ? cause.message : copy.failedDescription)
      throw cause
    }
    await wait(k.ms('slow')) // lint-blocks-allow: lets Send show its check before the thanks replaces the page
    setDone(true)
  }

  const restart = () => {
    if (value === undefined) setOwn({})
    onValueChange?.({})
    setOthers({})
    setTried(false)
    setDone(false)
  }

  const Title = embedded ? 'h2' : 'h1'
  const Heading = embedded ? 'h3' : 'h2'
  const ending = survey.ending ?? { title: copy.doneTitle, description: copy.doneDescription }
  const Root = embedded ? 'section' : 'main'

  const page = (
    <Root
      aria-labelledby={`${id}-title`}
      {...rest}
      className={cn(
        '@container flex flex-col overflow-hidden bg-canvas text-fg',
        embedded ? 'h-160 w-full rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line shadow-sm' : 'h-dvh',
        className,
      )}
    >
      <header className="relative flex shrink-0 items-center justify-between gap-4 border-b border-line px-5 py-3 @3xl:px-8">
        <div className="flex min-w-0 items-center gap-3">
          {!embedded && <BrandMark brand={brand} />}
          <span className={cn('truncate text-ui font-medium', embedded ? 'text-fg' : 'border-s border-line ps-3 text-fg-muted')}>{survey.title}</span>
        </div>
        {!done && <span className="shrink-0 font-mono text-ui-sm text-fg-muted tabular-nums">{copy.answered(count, path.length)}</span>}
        <Progress
          value={done ? 100 : (count / Math.max(1, path.length)) * 100}
          aria-label={copy.progress}
          getAriaValueText={() => copy.answered(count, path.length)}
          tone="accent"
          className="absolute inset-x-0 -bottom-px [&_[data-slot=progress-track]]:h-0.5 [&_[data-slot=progress-track]]:rounded-none [&_[data-slot=progress-track]]:bg-transparent"
        />
      </header>
      {/* The page holds still: questions come and go, and scroll, inside this region. */}
      <div ref={region} className="min-h-0 flex-1 overflow-y-auto yj-scrollbar">
        {done ? (
          <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col justify-center px-5 py-10 @3xl:px-8">
            <Done heading={Title} title={ending.title} description={ending.description} size="lg">
              <Button variant="ghost" className="-ms-3" onClick={restart}>
                {copy.again}
              </Button>
            </Done>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-2xl px-5 pt-10 pb-16 @3xl:px-8">
            <div className="flex flex-col gap-2 pb-8">
              <Title id={`${id}-title`} className="text-3xl leading-tight font-semibold tracking-tight text-balance">
                {survey.title}
              </Title>
              {survey.description && <p className="text-ui-lg text-pretty text-fg-muted">{survey.description}</p>}
            </div>
            <ProblemSummary ref={summary} problems={problems} title={copy.problemsTitle} link={copy.problemLink} target={(qid) => `${id}-${qid}`} />
            <PresenceList as="ol" className="flex flex-col">
              {path.map((question, index) => (
                <PresenceItem key={question.id} id={`${id}-${question.id}`} className="scroll-mt-6 border-t border-line py-8">
                  <QuestionView
                    question={question}
                    answer={answers[question.id]}
                    otherOpen={!!others[question.id]}
                    error={problems.find((p) => p.id === question.id)?.message}
                    heading={Heading}
                    copy={copy}
                    seed={seed}
                    number={index + 1}
                    onAnswer={(next, otherOpen) => answer(question.id, next, otherOpen)}
                    onSubmit={() => onward(question.id)}
                  />
                </PresenceItem>
              ))}
            </PresenceList>
            <div className="flex flex-col items-start gap-3 border-t border-line pt-8">
              {failure && (
                <p role="alert" className="text-ui text-danger-text">
                  {copy.failedTitle}. {failure}
                </p>
              )}
              <AsyncButton
                size="lg"
                onAction={send}
                pendingLabel={copy.sending}
                successLabel={copy.sent}
                errorLabel={(error) => (error === BLOCKED ? copy.checkAnswers : copy.failed)}
              >
                {copy.send}
              </AsyncButton>
            </div>
          </div>
        )}
      </div>
    </Root>
  )

  const designed = survey.design ? <ThemeScope theme={designTheme(survey.design)}>{page}</ThemeScope> : page
  return theme ? <ThemeScope theme={theme}>{designed}</ThemeScope> : designed
}

export { SurveyForm, DEFAULT_COPY as SURVEY_FORM_COPY }
export type { Survey, SurveyAnswer, SurveyAnswers, SurveyFormCopy, SurveyFormProps }
