'use client'

import { useEffect, useId, useRef, type HTMLAttributes, type ReactNode } from 'react'
import { ThemeScope, type ThemeInput } from '@youj/core'
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, ChevronDownIcon, ChevronUpIcon } from '@youj/icons'
import { AsyncButton } from '../../components/ui/async-button'
import { Button } from '../../components/ui/button'
import { Progress } from '../../components/ui/progress'
import { cn } from '../../lib/utils'
import { BrandMark, EnterHint, Welcome } from './conversational/parts'
import {
  answered,
  designTheme,
  minutes,
  QUESTION_COPY,
  SURVEY,
  type Survey,
  type SurveyAnswer,
  type SurveyAnswers,
  type SurveyQuestion,
} from './question/data'
import { useSurveyFlow } from './question/flow'
import { Done, Review } from './question/review'
import { Stage } from './question/stage'
import { QuestionView } from './question/view'

/* A survey asked one question at a time, as fast as the keyboard: a letter
 * for each choice, a digit for each point of a scale or face, Y or N, Enter
 * to go on (⌘↵ in a long answer), and a single pick goes on by itself after a
 * beat. It opens on a welcome with the survey's title and how long it takes,
 * then each question fills the screen in large type, travelling in from below
 * as the last lifts away (back reverses it) while focus lands in it; the
 * hairline at the top fills as you go, counting only the questions this
 * person's answers lead to. It ends on a review of every answer, each with an
 * Edit that returns here once it's answered, then the send and the thanks. A
 * failed send keeps every answer and says so. On a phone the action sits at
 * the bottom of the screen, in the thumb's reach, clear of the home indicator.
 * `embedded` sets it in a card inside another page. Reduced motion: the
 * questions swap in place.
 *
 * Pass your `survey` (the same definition the builder writes), keep the
 * answers with `value`/`onValueChange` to resume later, and send them through
 * `onSubmit`; every string is in `copy`. */

const DEFAULT_COPY = {
  ...QUESTION_COPY,
  /** Where the survey is: "3 of 7". */
  position: (index: number, total: number) => `${index} of ${total}`,
  /** Read out when a question appears: "Question 3 of 7". */
  questionLabel: (index: number, total: number) => `Question ${index} of ${total}`,
  progress: 'Progress',
  /** On the welcome: how long it takes. */
  length: (minutes: number) => `Takes about ${minutes} min`,
  start: 'Start',
  back: 'Back',
  /** Names the up and down arrows at the page's corner. */
  navigate: 'Move between questions',
  previous: 'Previous question',
  next: 'Next question',
  ok: 'OK',
  skip: 'Skip',
  toReview: 'Review answers',
  backToReview: 'Back to review',
  /** The hint beside OK. */
  pressEnter: 'press Enter',
  pressModEnter: 'to continue',
  reviewTitle: 'Check your answers',
  reviewDescription: 'Change anything before you send it.',
  edit: 'Edit',
  /** The Edit link, read out with the question it changes. */
  editLabel: (question: string) => `Edit your answer to “${question}”`,
  send: 'Send answers',
  sending: 'Sending…',
  sent: 'Sent',
  failed: 'Couldn’t send',
  failedTitle: 'Your answers didn’t send',
  failedDescription: 'Nothing is lost. Try again in a moment.',
  again: 'Start over',
}

type ConversationalSurveyCopy = typeof DEFAULT_COPY

interface ConversationalSurveyProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'defaultValue' | 'onSubmit'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Hosted inside another page: a card with an `h2` (each question an `h3`) instead of the whole screen. Default false. */
  embedded?: boolean
  /** Take the whole width it's given, embedded, instead of stopping at its natural width (640px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<ConversationalSurveyCopy>
  /** Formats answers in the review (lists, dates) (BCP 47). Default: the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The survey: its questions, logic, ending and design. Default: Tern's product survey. */
  survey?: Survey
  /** The answers, controlled: pair it with `onValueChange` (to save progress and resume it). */
  value?: SurveyAnswers
  /** The answers to start from, when the block owns them. A survey resumed with answers skips the welcome. */
  defaultValue?: SurveyAnswers
  /** Called with every answer as it changes. */
  onValueChange?: (answers: SurveyAnswers) => void
  /** Sends the answers to the questions that were asked; reject to keep them and say so. Default: a short demo wait. */
  onSubmit?: (answers: SurveyAnswers) => Promise<unknown> | unknown
  /** Open on a welcome with the title and how long it takes. Default true. */
  welcome?: boolean
  /** End on a review of every answer before sending. Default true; without it, the last question sends. */
  review?: boolean
  /** A single pick goes on by itself after a beat. Default true. */
  autoAdvance?: boolean
  /** The product, at the top of the page. Default: Tern. */
  brand?: { name: string; logo?: ReactNode }
  /** A respondent's id, so randomized options keep their order across visits. */
  seed?: string
}

function ConversationalSurvey({
  theme,
  embedded = false,
  fill = false,
  copy: copyProp,
  locale,
  survey = SURVEY,
  value,
  defaultValue,
  onValueChange,
  onSubmit,
  welcome = true,
  review = true,
  autoAdvance = true,
  brand = { name: 'Tern' },
  seed,
  className,
  ...rest
}: ConversationalSurveyProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const flow = useSurveyFlow({
    survey,
    value,
    defaultValue,
    onValueChange,
    onSubmit,
    action: 'ConversationalSurvey: onSubmit',
    welcome,
    review,
    autoAdvance,
    copy,
    locale,
    seed,
  })
  const { view, current, index, total, path } = flow
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const Heading = embedded ? 'h3' : 'h2'
  const size = embedded ? 'default' : 'lg'
  const long = current?.type === 'text' && !!current.long
  const ending = survey.ending ?? { title: copy.doneTitle, description: copy.doneDescription }
  // Each view starts at the top of the region it scrolls in.
  const region = useRef<HTMLDivElement>(null)
  useEffect(() => {
    region.current?.scrollTo?.({ top: 0 })
  }, [view])

  const body = (
    <Stage step={view} direction={flow.direction}>
      {view === 'welcome' ? (
        <Welcome survey={survey} heading={embedded ? undefined : 'h1'} length={copy.length(minutes(path))} />
      ) : current ? (
        <QuestionView
          question={current}
          answer={flow.answers[current.id]}
          otherOpen={!!flow.others[current.id]}
          error={flow.error}
          heading={Heading}
          copy={copy}
          seed={flow.seed}
          size={size}
          number={
            embedded ? undefined : (
              <span className="inline-flex items-center gap-1 text-accent-text">
                {index}
                <ArrowRightIcon size={14} className="rtl:-scale-x-100" />
              </span>
            )
          }
          onAnswer={(next: SurveyAnswer | undefined, otherOpen?: boolean) => flow.answer(current.id, next, otherOpen)}
          onPicked={flow.onPicked}
          onSubmit={flow.next}
        />
      ) : view === 'review' ? (
        <Review
          questions={path}
          answers={flow.answers}
          format={flow.format}
          heading={Heading}
          copy={copy}
          failure={flow.failure}
          onEdit={flow.edit}
          size={size}
        />
      ) : (
        <Done heading={Heading} title={ending.title} description={ending.description} size={size} />
      )}
    </Stage>
  )

  const optional = current?.required === false && !answered(flow.answers[current.id])
  const primary =
    view === 'done' ? null : view === 'welcome' ? (
      <Button size={embedded ? 'default' : 'lg'} onClick={flow.start}>
        {copy.start}
        <ArrowRightIcon size={15} className="rtl:-scale-x-100" />
      </Button>
    ) : flow.sends ? (
      <AsyncButton
        size={embedded ? 'default' : 'lg'}
        onAction={flow.submit}
        pendingLabel={copy.sending}
        successLabel={copy.sent}
        errorLabel={copy.failed}
      >
        {copy.send}
      </AsyncButton>
    ) : (
      <Button size={embedded ? 'default' : 'lg'} onClick={flow.next}>
        {flow.returning && !flow.missing ? copy.backToReview : optional ? copy.skip : flow.last && review ? copy.toReview : copy.ok}
        {!optional && !(flow.last && review) && !flow.returning && <CheckIcon size={15} aria-hidden />}
      </Button>
    )
  const hint = current && !flow.sends && (
    <EnterHint long={long} pressEnter={copy.pressEnter} pressModEnter={copy.pressModEnter} className="hidden @lg:flex" />
  )
  const canGoBack = view !== 'welcome' && view !== 'done'
  const status = (
    <span role="status" className="sr-only">
      {current ? copy.questionLabel(index, total) : ''}
    </span>
  )

  let shell: ReactNode
  if (embedded) {
    shell = (
      <article
        aria-labelledby={titleId}
        {...rest}
        className={cn(
          '@container flex h-136 w-full flex-col overflow-clip rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line bg-surface text-fg shadow-sm',
          !fill && 'max-w-160',
          className,
        )}
      >
        <header className="relative flex shrink-0 items-start justify-between gap-4 px-(--ui--panel-x) py-(--ui--panel-head-y)">
          <Title id={titleId} className="min-w-0 text-ui-lg font-semibold tracking-tight">
            {survey.title}
          </Title>
          {view !== 'done' && view !== 'welcome' && (
            <span aria-hidden className="shrink-0 pt-0.5 font-mono text-ui-sm text-fg-muted tabular-nums">
              {copy.position(index, total)}
            </span>
          )}
          <Progress
            value={flow.progress}
            aria-label={copy.progress}
            getAriaValueText={() => copy.questionLabel(index, total)}
            className={hairline('absolute inset-x-0 bottom-0')}
          />
        </header>
        {/* The card keeps its height from question to question; a long one scrolls inside. */}
        <div ref={region} className="min-h-0 flex-1 overflow-y-auto yj-scrollbar">
          <div className="flex min-h-full flex-col justify-center px-(--ui--panel-x) py-(--ui--panel-y)">{body}</div>
        </div>
        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-line px-(--ui--panel-x) pt-3 pb-(--ui--panel-foot-y)">
          {view === 'done' ? (
            <Button variant="ghost" className="-ms-2" onClick={flow.restart}>
              {copy.again}
            </Button>
          ) : (
            <>
              <Button variant="ghost" className="-ms-2" disabled={!canGoBack} onClick={flow.back}>
                <ArrowLeftIcon size={15} className="rtl:-scale-x-100" />
                {copy.back}
              </Button>
              <div className="flex items-center gap-3">
                {hint}
                {primary}
              </div>
            </>
          )}
        </footer>
        {status}
      </article>
    )
  } else {
    shell = (
      <main {...rest} className={cn('@container relative flex h-dvh flex-col overflow-hidden bg-canvas text-fg', className)}>
        <header className="flex shrink-0 items-center justify-between gap-4 px-5 py-4 @3xl:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <BrandMark brand={brand} />
            {view !== 'welcome' && (
              <h1 className="hidden truncate border-s border-line ps-3 text-ui font-medium text-fg-muted @lg:block">{survey.title}</h1>
            )}
          </div>
          {current && (
            <span aria-hidden className="font-mono text-ui-sm text-fg-muted tabular-nums">
              {copy.position(index, total)}
            </span>
          )}
        </header>
        {/* The screen holds still: each question takes the space between the header and the foot, and a long one scrolls inside it. */}
        <div ref={region} className="min-h-0 flex-1 overflow-y-auto yj-scrollbar">
          <div className="flex min-h-full flex-col px-5 pt-6 pb-10 @lg:justify-center @3xl:px-8">
            <div className="mx-auto w-full max-w-2xl">
              {body}
              {primary && (
                // The action sits at the end, its hint just before it; the question reads from the start.
                <div className="mt-8 hidden items-center justify-end gap-4 @lg:flex">
                  {hint}
                  {primary}
                </div>
              )}
              {view === 'done' && (
                <Button variant="ghost" className="-ms-3 mt-6" onClick={flow.restart}>
                  {copy.again}
                </Button>
              )}
            </div>
          </div>
        </div>
        {primary && (
          // On a phone the action sits at the screen's foot, in the thumb's reach and clear of the home indicator.
          <div className="flex shrink-0 items-center gap-3 border-t border-line px-5 pt-3 pb-[max(--spacing(3),env(safe-area-inset-bottom))] @lg:hidden">
            {canGoBack && (
              <Button variant="outline" size="icon-lg" aria-label={copy.back} onClick={flow.back} className="shrink-0">
                <ArrowLeftIcon size={16} className="rtl:-scale-x-100" />
              </Button>
            )}
            <div className="flex flex-1 *:flex-1">{primary}</div>
          </div>
        )}
        {canGoBack && (
          <nav
            aria-label={copy.navigate}
            className="absolute end-5 bottom-5 hidden overflow-hidden rounded-button border border-line bg-surface shadow-sm @lg:flex"
          >
            <Button
              variant="ghost"
              size="icon"
              // shape: the two keys are halves of the nav's one frame, which rounds their ends
              className="rounded-none"
              aria-label={copy.previous}
              disabled={index <= 1 && view !== 'review'}
              onClick={flow.back}
            >
              <ChevronUpIcon size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              // shape: the two keys are halves of the nav's one frame, which rounds their ends
              className="rounded-none border-s border-line"
              aria-label={copy.next}
              disabled={!current}
              onClick={flow.next}
            >
              <ChevronDownIcon size={16} />
            </Button>
          </nav>
        )}
        {status}
      </main>
    )
  }

  const designed = survey.design ? <ThemeScope theme={designTheme(survey.design)}>{shell}</ThemeScope> : shell
  return theme ? <ThemeScope theme={theme}>{designed}</ThemeScope> : designed
}

/** The progress as a hairline: a 2px track, square, on the line colour. */
const hairline = (className: string) =>
  cn('[&_[data-slot=progress-track]]:h-0.5 [&_[data-slot=progress-track]]:rounded-none [&_[data-slot=progress-track]]:bg-line', className)

export { ConversationalSurvey, DEFAULT_COPY as CONVERSATIONAL_SURVEY_COPY }
export type { ConversationalSurveyCopy, ConversationalSurveyProps, Survey, SurveyAnswer, SurveyAnswers, SurveyQuestion }
