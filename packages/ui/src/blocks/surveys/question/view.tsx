'use client'

import { useId, type KeyboardEvent, type ReactNode } from 'react'
import { FieldError } from '../../../components/ui/field'
import { cn } from '../../../lib/utils'
import { ChoiceAnswer } from './choice'
import type { QuestionCopy, SurveyAnswer, SurveyQuestion } from './data'
import { EmojiAnswer } from './faces'
import { DateAnswer, SliderAnswer, TextAnswer } from './inputs'
import { MatrixAnswer } from './matrix'
import { RankingAnswer } from './ranking'
import { RatingAnswer, ScaleAnswer, YesNoAnswer } from './scales'

/* One question as a respondent sees it: its title (the heading that names
 * the answer), its description, the answer in the control its type calls
 * for, and the problem, if any, said under it and read out. Enter goes on
 * from anywhere in it (⌘↵ or Ctrl+↵ in a long answer), except where Enter
 * already means something: a button (a ranking's grip picks its row up). Every block of
 * the family renders its questions through this, so they answer alike. */

interface QuestionViewProps {
  question: SurveyQuestion
  answer: SurveyAnswer | undefined
  /** A choice's "Other" is chosen, even before anything is typed in it. */
  otherOpen?: boolean
  error?: string | null
  heading: 'h1' | 'h2' | 'h3' | 'h4'
  copy: QuestionCopy
  /** Shuffles randomized options into this respondent's order. */
  seed: string
  /** `lg` for a question on a screen of its own. Default 'default'. */
  size?: 'default' | 'lg'
  /** Before the title: the question's number. */
  number?: ReactNode
  onAnswer: (answer: SurveyAnswer | undefined, otherOpen?: boolean) => void
  /** A deliberate pick on a question that takes one answer. */
  onPicked?: () => void
  /** Enter: go on. */
  onSubmit?: () => void
  /** Keep the problem's line even while there's none, so a message appearing never moves what's below. */
  reserve?: boolean
  className?: string
}

const nothing = () => {}

export function QuestionView({
  question,
  answer,
  otherOpen = false,
  error,
  heading: Heading,
  copy,
  seed,
  size = 'default',
  number,
  onAnswer,
  onPicked = nothing,
  onSubmit,
  reserve = false,
  className,
}: QuestionViewProps) {
  const id = useId()
  const titleId = `${id}-title`
  const descriptionId = `${id}-description`
  const errorId = `${id}-error`
  const limit = question.type === 'choice' && question.multiple && question.max ? copy.upTo(question.max) : undefined
  const optional = question.required === false
  const described = question.description || limit || optional
  const describedBy = [described && descriptionId, error && errorId].filter(Boolean).join(' ') || undefined

  const onKeyDownCapture = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onSubmit || event.key !== 'Enter' || event.shiftKey || event.altKey || event.nativeEvent.isComposing) return
    const target = event.target as HTMLElement
    if (target.tagName === 'BUTTON' && !target.matches('[role=radio], [role=checkbox]')) return
    if (target.tagName === 'TEXTAREA' && !event.metaKey && !event.ctrlKey) return
    event.preventDefault()
    event.stopPropagation()
    onSubmit()
  }

  const shared = {
    answer,
    onPicked,
    labelledBy: titleId,
    describedBy,
    invalid: !!error,
    copy,
    size,
    onAnswer: (next: SurveyAnswer | undefined) => onAnswer(next),
  }
  let body: ReactNode
  switch (question.type) {
    case 'choice':
      body = <ChoiceAnswer {...shared} question={question} otherOpen={otherOpen} onAnswer={onAnswer} seed={seed} />
      break
    case 'nps':
    case 'scale':
      body = <ScaleAnswer {...shared} question={question} />
      break
    case 'rating':
      body = <RatingAnswer {...shared} question={question} />
      break
    case 'emoji':
      body = <EmojiAnswer {...shared} question={question} />
      break
    case 'yesno':
      body = <YesNoAnswer {...shared} question={question} />
      break
    case 'slider':
      body = <SliderAnswer {...shared} question={question} />
      break
    case 'matrix':
      body = <MatrixAnswer {...shared} question={question} />
      break
    case 'ranking':
      body = <RankingAnswer {...shared} question={question} seed={seed} />
      break
    case 'date':
      body = <DateAnswer {...shared} question={question} />
      break
    default:
      body = <TextAnswer {...shared} question={question} />
  }

  return (
    <div
      data-slot="survey-question"
      className={cn('@container flex flex-col', size === 'lg' ? 'gap-6' : 'gap-4', className)}
      onKeyDownCapture={onKeyDownCapture}
    >
      <div className="flex flex-col gap-1.5">
        <Heading
          id={titleId}
          data-yj-step-heading
          tabIndex={-1}
          className={cn(
            'rounded-sm font-semibold tracking-tight text-pretty text-fg outline-none',
            size === 'lg' ? 'text-2xl leading-tight @2xl:text-3xl' : 'text-lg leading-snug',
          )}
        >
          {number !== undefined && (
            <span aria-hidden className="me-2 font-mono text-[0.75em] font-normal text-fg-subtle tabular-nums">
              {number}
            </span>
          )}
          {question.title}
        </Heading>
        {described && (
          <p id={descriptionId} className={cn('text-pretty text-fg-muted', size === 'lg' ? 'text-ui-lg' : 'text-ui')}>
            {[question.description, limit].filter(Boolean).join(' ')}
            {optional && (
              <span className={cn('text-fg-subtle', (question.description || limit) && 'before:mx-1.5 before:content-["·"]')}>{copy.optional}</span>
            )}
          </p>
        )}
      </div>
      {body}
      <div className={cn('text-center', reserve ? 'min-h-6' : 'empty:hidden')}>
        <FieldError id={errorId}>{error ?? undefined}</FieldError>
      </div>
    </div>
  )
}
