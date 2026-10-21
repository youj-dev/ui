'use client'

import type { ReactNode } from 'react'
import { CheckIcon } from '@youj/icons'
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert'
import { Button } from '../../../components/ui/button'
import { cn } from '../../../lib/utils'
import { readable, type AnswerFormat, type QuestionCopy, type SurveyAnswers, type SurveyQuestion } from './data'

/* The last steps: every question this person was asked with their answer,
 * each with an Edit that goes back to it (and, once it's answered again,
 * comes back here), then the send; and the thanks once it's sent. */

interface ReviewCopy extends QuestionCopy {
  reviewTitle: string
  reviewDescription: string
  edit: string
  editLabel: (question: string) => string
  failedTitle: string
}

interface ReviewProps {
  questions: SurveyQuestion[]
  answers: SurveyAnswers
  format: AnswerFormat
  heading: 'h1' | 'h2' | 'h3' | 'h4'
  copy: ReviewCopy
  /** Why the last send failed. */
  failure: string | null
  onEdit: (id: string) => void
  size?: 'default' | 'lg'
}

const titleClass = (size: 'default' | 'lg') =>
  cn(
    'rounded-sm font-semibold tracking-tight text-pretty text-fg outline-none',
    size === 'lg' ? 'text-2xl leading-tight @2xl:text-3xl' : 'text-xl leading-snug',
  )

export function Review({ questions, answers, format, heading: Heading, copy, failure, onEdit, size = 'default' }: ReviewProps) {
  return (
    <div className="@container flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Heading data-yj-step-heading tabIndex={-1} className={titleClass(size)}>
          {copy.reviewTitle}
        </Heading>
        <p className="text-ui text-fg-muted">{copy.reviewDescription}</p>
      </div>
      <ul className="flex flex-col divide-y divide-line border-y border-line">
        {questions.map((question) => {
          const answer = readable(question, answers[question.id], format, copy)
          return (
            <li key={question.id} className="flex items-start justify-between gap-4 py-3">
              <dl className="flex min-w-0 flex-col gap-0.5">
                <dt className="text-ui-sm text-pretty text-fg-muted">{question.title}</dt>
                <dd className={answer ? 'text-ui break-words whitespace-pre-line text-fg' : 'text-ui text-fg-subtle'}>{answer ?? copy.skipped}</dd>
              </dl>
              <Button
                variant="link"
                size="sm"
                className="h-auto shrink-0 px-0 pt-0.5"
                aria-label={copy.editLabel(question.title)}
                onClick={() => onEdit(question.id)}
              >
                {copy.edit}
              </Button>
            </li>
          )
        })}
      </ul>
      {failure && (
        <Alert variant="danger">
          <AlertTitle>{copy.failedTitle}</AlertTitle>
          <AlertDescription>{failure}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

interface DoneProps {
  heading: 'h1' | 'h2' | 'h3' | 'h4'
  title: string
  description?: string
  size?: 'default' | 'lg'
  children?: ReactNode
  className?: string
}

/** The thanks: a check that draws itself, the ending's title and words. */
export function Done({ heading: Heading, title, description, size = 'default', children, className }: DoneProps) {
  return (
    <div className={cn('flex flex-col items-start gap-4 py-2', className)}>
      <span className={cn('grid place-items-center rounded-full bg-success-subtle text-success-text', size === 'lg' ? 'size-12' : 'size-10')}>
        <CheckIcon size={size === 'lg' ? 24 : 20} strokeWidth={2.25} trigger="mount" />
      </span>
      <div className="flex flex-col gap-1.5">
        <Heading data-yj-step-heading tabIndex={-1} className={titleClass(size)}>
          {title}
        </Heading>
        {description && <p className={cn('max-w-md text-pretty text-fg-muted', size === 'lg' ? 'text-ui-lg' : 'text-ui')}>{description}</p>}
      </div>
      {children}
    </div>
  )
}
