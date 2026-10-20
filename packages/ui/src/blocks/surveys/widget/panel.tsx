'use client'

import { useId, type HTMLAttributes, type ReactNode } from 'react'
import { m } from 'motion/react'
import { ArrowLeftIcon, ChevronDownIcon, XIcon } from '@youj/icons'
import { AsyncButton } from '../../../components/ui/async-button'
import { Button } from '../../../components/ui/button'
import { Card, CardAction, CardHeader, CardTitle } from '../../../components/ui/card'
import { Progress } from '../../../components/ui/progress'
import { cn } from '../../../lib/utils'
import { answered, type QuestionCopy, type Survey } from '../question/data'
import type { SurveyFlow } from '../question/flow'
import { Done } from '../question/review'
import { Stage } from '../question/stage'
import { QuestionView } from '../question/view'

/* The widget's card: the product's mark and the survey's title with Minimize
 * and ×, a hairline of progress, the question in a body of fixed height (so
 * the card never changes size between questions; a long one scrolls inside),
 * and a foot with where you are and the way on. The thanks takes the body's
 * place, and the foot offers Close. Escape inside it closes it. */

const MotionCard = m.create(Card)

export interface WidgetCopy extends QuestionCopy {
  position: (index: number, total: number) => string
  questionLabel: (index: number, total: number) => string
  progress: string
  minimize: string
  close: string
  back: string
  next: string
  skip: string
  send: string
  sending: string
  sent: string
  failed: string
  dismiss: string
}

interface WidgetPanelProps extends Omit<HTMLAttributes<HTMLElement>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  flow: SurveyFlow
  survey: Survey
  brand: { name: string; logo?: ReactNode }
  copy: WidgetCopy
  /** Shared with the folded pill, so one morphs into the other. */
  layoutId?: string
  onMinimize?: () => void
  onClose: () => void
}

export function WidgetPanel({ flow, survey, brand, copy, layoutId, onMinimize, onClose, className, ...rest }: WidgetPanelProps) {
  const titleId = useId()
  const { view, current, index } = flow
  // A follow-up that waits on this answer counts already, so the first question doesn't read "1 of 1".
  const total = flow.total + flow.pending
  const ending = survey.ending ?? { title: copy.doneTitle, description: copy.doneDescription }
  const optional = current?.required === false && !answered(flow.answers[current.id])

  return (
    <MotionCard
      layoutId={layoutId}
      size="sm"
      role="region"
      aria-labelledby={titleId}
      data-yj-tone="overlay"
      onKeyDown={(event) => {
        if (event.key !== 'Escape' || event.defaultPrevented) return
        event.stopPropagation()
        onClose()
      }}
      {...rest}
      className={cn('w-full gap-0 overflow-hidden rounded-t-2xl bg-overlay py-0 text-fg sm:rounded-2xl', className)}
    >
      <CardHeader className="relative items-center py-(--card-spacing)">
        <CardTitle className="flex min-w-0 items-center gap-2">
          {brand.logo ?? (
            <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-md bg-accent text-ui-xs font-bold text-on-accent">
              {brand.name.charAt(0)}
            </span>
          )}
          <h2 id={titleId} className="min-w-0 truncate">
            {survey.title}
          </h2>
        </CardTitle>
        <CardAction className="flex items-center gap-1 self-center">
          {onMinimize && (
            <Button variant="ghost" size="icon-sm" aria-label={copy.minimize} onClick={onMinimize}>
              <ChevronDownIcon size={16} />
            </Button>
          )}
          <Button variant="ghost" size="icon-sm" aria-label={copy.close} onClick={onClose}>
            <XIcon size={16} />
          </Button>
        </CardAction>
        <Progress
          value={flow.progress}
          aria-label={copy.progress}
          getAriaValueText={() => copy.questionLabel(Math.max(1, index), total)}
          tone="accent"
          className="absolute inset-x-0 bottom-0 [&_[data-slot=progress-track]]:h-0.5 [&_[data-slot=progress-track]]:rounded-none [&_[data-slot=progress-track]]:bg-line"
        />
      </CardHeader>
      {/* One size for every question: the body scrolls when one runs long. */}
      <div className="h-72 overflow-y-auto yj-scrollbar [mask-image:linear-gradient(to_bottom,black_88%,transparent)]">
        <div className="flex min-h-full flex-col justify-center px-4 py-4">
          <Stage step={view} direction={flow.direction}>
            {current ? (
              <QuestionView
                question={current}
                answer={flow.answers[current.id]}
                otherOpen={!!flow.others[current.id]}
                error={flow.error}
                heading="h3"
                copy={copy}
                seed={flow.seed}
                onAnswer={(next, otherOpen) => flow.answer(current.id, next, otherOpen)}
                onPicked={flow.onPicked}
                onSubmit={flow.next}
              />
            ) : (
              <Done heading="h3" title={ending.title} description={ending.description} className="gap-3 py-0" />
            )}
          </Stage>
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-line px-4 pt-2.5 pb-[max(--spacing(2.5),env(safe-area-inset-bottom))] sm:pb-2.5">
        {view === 'done' ? (
          <>
            <span />
            <Button size="sm" variant="outline" onClick={onClose}>
              {copy.dismiss}
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1">
              {index > 1 && (
                <Button variant="ghost" size="icon-sm" aria-label={copy.back} onClick={flow.back} className="-ms-2">
                  <ArrowLeftIcon size={15} className="rtl:-scale-x-100" />
                </Button>
              )}
              <span aria-hidden className="font-mono text-ui-sm text-fg-muted tabular-nums">
                {copy.position(Math.max(1, index), total)}
              </span>
            </div>
            {flow.sends ? (
              <AsyncButton size="sm" onAction={flow.submit} pendingLabel={copy.sending} successLabel={copy.sent} errorLabel={copy.failed}>
                {copy.send}
              </AsyncButton>
            ) : (
              <Button size="sm" variant={optional ? 'ghost' : 'default'} onClick={flow.next}>
                {optional ? copy.skip : copy.next}
              </Button>
            )}
          </>
        )}
      </div>
      <span role="status" className="sr-only">
        {current ? copy.questionLabel(index, total) : ''}
      </span>
    </MotionCard>
  )
}
