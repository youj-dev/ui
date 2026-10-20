'use client'

import { useId, type HTMLAttributes, type ReactNode } from 'react'
import { ThemeScope, type ThemeInput } from '@youj/core'
import { ArrowLeftIcon, ArrowRightIcon, ClockIcon } from '@youj/icons'
import { AsyncButton } from '../../components/ui/async-button'
import { Button } from '../../components/ui/button'
import { cn } from '../../lib/utils'
import { BrandMark } from './conversational/parts'
import { DeckStack } from './deck/stack'
import { answered, designTheme, minutes, QUESTION_COPY, SURVEY, type Survey, type SurveyAnswers } from './question/data'
import { useSurveyFlow } from './question/flow'
import { Done } from './question/review'
import { QuestionView } from './question/view'

/* A survey for the phone in your hand: a deck of question cards. The card on
 * top holds one question with answers as large as a thumb; the cards still
 * ahead peek out below it, fewer as you go. Throw the card towards the
 * reading start to go on, the other way to go back, or use the two buttons at
 * the foot of the screen, where the thumb rests (clear of the home
 * indicator). A pick goes on by itself after a beat. Segments along the top
 * fill as you go, one per question this person will be asked. The deck keeps
 * its size; a long question scrolls inside its card. On a wide screen it
 * stands in the middle at a phone's width. Reduced motion: the cards cross-fade.
 *
 * Pass your `survey`, keep the answers with `value`/`onValueChange`, send them
 * through `onSubmit`; every string is in `copy`. */

const DEFAULT_COPY = {
  ...QUESTION_COPY,
  pick: 'Choose an answer to go on.',
  /** Where the survey is: "3 of 7". */
  position: (index: number, total: number) => `${index} of ${total}`,
  questionLabel: (index: number, total: number) => `Question ${index} of ${total}`,
  progress: 'Progress',
  /** On the first card: how long it takes. */
  length: (minutes: number) => `Takes about ${minutes} min`,
  start: 'Start',
  back: 'Back',
  next: 'Next',
  skip: 'Skip',
  send: 'Send answers',
  sending: 'Sending…',
  sent: 'Sent',
  failed: 'Couldn’t send',
  failedTitle: 'Your answers didn’t send',
  failedDescription: 'Nothing is lost. Try again in a moment.',
  /** Under the deck, on touch: how to move through it. */
  swipeHint: 'Swipe a card to go on or back',
  again: 'Start over',
}

type SurveyDeckCopy = typeof DEFAULT_COPY

interface SurveyDeckProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'defaultValue' | 'onSubmit'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Hosted inside another page: a panel of a phone's size with an `h2` (each question an `h3`) instead of the whole screen. Default false. */
  embedded?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<SurveyDeckCopy>
  /** Formats answers (BCP 47). Default: the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The survey: its questions, logic, ending and design. Default: Tern's product survey. */
  survey?: Survey
  value?: SurveyAnswers
  defaultValue?: SurveyAnswers
  onValueChange?: (answers: SurveyAnswers) => void
  /** Sends the answers to the questions that were asked; reject to keep them and say so. Default: a short demo wait. */
  onSubmit?: (answers: SurveyAnswers) => Promise<unknown> | unknown
  /** Deal a first card with the title and how long it takes. Default true. */
  welcome?: boolean
  /** A single pick goes on by itself after a beat. Default true. */
  autoAdvance?: boolean
  /** The product, at the top. Default: Tern. */
  brand?: { name: string; logo?: ReactNode }
  seed?: string
}

function SurveyDeck({
  theme,
  embedded = false,
  copy: copyProp,
  locale,
  survey = SURVEY,
  value,
  defaultValue,
  onValueChange,
  onSubmit,
  welcome = true,
  autoAdvance = true,
  brand = { name: 'Tern' },
  seed,
  className,
  ...rest
}: SurveyDeckProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const flow = useSurveyFlow({
    survey,
    value,
    defaultValue,
    onValueChange,
    onSubmit,
    action: 'SurveyDeck: onSubmit',
    welcome,
    review: false,
    autoAdvance,
    copy,
    locale,
    seed,
  })
  const { view, current, index, total, path } = flow
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const Heading = embedded ? 'h3' : 'h2'
  const ending = survey.ending ?? { title: copy.doneTitle, description: copy.doneDescription }
  const optional = current?.required === false && !answered(flow.answers[current.id])
  const ahead = view === 'done' ? 0 : view === 'welcome' ? path.length : path.length - index

  // A throw goes on (the welcome starts, a question goes on when its answer allows) or back.
  const onThrow =
    view === 'done'
      ? undefined
      : (way: 1 | -1) => {
          if (way === -1) {
            if (view === 'welcome') return false
            flow.back()
            return true
          }
          if (view === 'welcome') {
            flow.start()
            return true
          }
          if (flow.sends) return false
          return flow.next()
        }

  const Root = embedded ? 'section' : 'main'
  const deck = (
    <Root
      aria-labelledby={titleId}
      {...rest}
      className={cn(
        '@container flex flex-col overflow-hidden bg-canvas text-fg',
        embedded ? 'h-180 w-full max-w-md rounded-[min(var(--radius-2xl),var(--ui--panel-radius-max))] border border-line shadow-sm' : 'h-dvh',
        className,
      )}
    >
      <header className="mx-auto flex w-full max-w-md shrink-0 flex-col gap-3 px-5 pt-4 pb-3">
        {/* One segment per question on this person's path, filling as they go. */}
        <div
          role="progressbar"
          aria-label={copy.progress}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={view === 'done' ? total : Math.max(0, index - 1)}
          aria-valuetext={current ? copy.questionLabel(index, total) : undefined}
          className="flex gap-1"
        >
          {path.map((q, i) => (
            <span
              key={q.id}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors yj-duration-base ease-standard',
                view === 'done' || i < index - 1 ? 'bg-fg' : i === index - 1 ? 'bg-accent' : 'bg-line',
              )}
            />
          ))}
        </div>
        <div className="flex items-center justify-between gap-3">
          <BrandMark brand={brand} />
          <Title id={titleId} className="sr-only">
            {survey.title}
          </Title>
          {current && (
            <span aria-hidden className="font-mono text-ui-sm text-fg-muted tabular-nums">
              {copy.position(index, total)}
            </span>
          )}
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col px-5 pt-2 pb-8">
        <DeckStack step={view} direction={flow.direction} ahead={Math.min(2, ahead)} onThrow={onThrow} className="min-h-0 flex-1">
          <div className="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto yj-scrollbar p-6">
            {view === 'welcome' ? (
              <div className="flex flex-1 flex-col justify-between gap-6">
                <span aria-hidden className="grid size-12 place-items-center rounded-2xl bg-accent text-xl font-semibold text-on-accent">
                  {brand.logo ?? brand.name.charAt(0)}
                </span>
                <div className="flex flex-col gap-3">
                  <p data-yj-step-heading tabIndex={-1} className="text-3xl leading-tight font-semibold tracking-tight text-balance outline-none">
                    {survey.title}
                  </p>
                  {survey.description && <p className="text-ui-lg text-pretty text-fg-muted">{survey.description}</p>}
                  <span className="flex items-center gap-1.5 text-ui-sm text-fg-muted">
                    <ClockIcon size={14} aria-hidden />
                    {copy.length(minutes(path))}
                  </span>
                </div>
              </div>
            ) : current ? (
              <QuestionView
                question={current}
                answer={flow.answers[current.id]}
                otherOpen={!!flow.others[current.id]}
                error={flow.error}
                heading={Heading}
                copy={copy}
                seed={flow.seed}
                size="lg"
                onAnswer={(next, otherOpen) => flow.answer(current.id, next, otherOpen)}
                onPicked={flow.onPicked}
                onSubmit={flow.next}
              />
            ) : (
              <div className="flex flex-1 flex-col justify-center">
                <Done heading={Heading} title={ending.title} description={ending.description} size="lg" />
              </div>
            )}
          </div>
        </DeckStack>
      </div>

      {/* The way on, where the thumb rests. */}
      <footer className="mx-auto flex w-full max-w-md shrink-0 flex-col gap-2 px-5 pb-[max(--spacing(4),env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-3">
          {view === 'done' ? (
            <Button size="lg" variant="outline" className="flex-1" onClick={flow.restart}>
              {copy.again}
            </Button>
          ) : (
            <>
              <Button variant="outline" size="icon-lg" aria-label={copy.back} disabled={view === 'welcome'} onClick={flow.back} className="shrink-0">
                <ArrowLeftIcon size={16} className="rtl:-scale-x-100" />
              </Button>
              {view === 'welcome' ? (
                <Button size="lg" className="flex-1" onClick={flow.start}>
                  {copy.start}
                  <ArrowRightIcon size={15} className="rtl:-scale-x-100" />
                </Button>
              ) : flow.sends ? (
                <AsyncButton
                  size="lg"
                  className="flex-1"
                  onAction={flow.submit}
                  pendingLabel={copy.sending}
                  successLabel={copy.sent}
                  errorLabel={copy.failed}
                >
                  {copy.send}
                </AsyncButton>
              ) : (
                <Button size="lg" variant={optional ? 'outline' : 'default'} className="flex-1" onClick={flow.next}>
                  {optional ? copy.skip : copy.next}
                  {!optional && <ArrowRightIcon size={15} className="rtl:-scale-x-100" />}
                </Button>
              )}
            </>
          )}
        </div>
        <p aria-hidden className="hidden text-center text-ui-sm text-fg-subtle touch:block">
          {copy.swipeHint}
        </p>
      </footer>
      <span role="status" className="sr-only">
        {current ? copy.questionLabel(index, total) : ''}
      </span>
    </Root>
  )

  const designed = survey.design ? <ThemeScope theme={designTheme(survey.design)}>{deck}</ThemeScope> : deck
  return theme ? <ThemeScope theme={theme}>{designed}</ThemeScope> : designed
}

export { SurveyDeck, DEFAULT_COPY as SURVEY_DECK_COPY }
export type { Survey, SurveyAnswers, SurveyDeckCopy, SurveyDeckProps }
