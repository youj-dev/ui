'use client'

import { useId, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { MotionFeatures, ThemeScope, useYouj } from '@youj/core'
import { ArrowLeftIcon, CheckIcon, MonitorIcon, PlayIcon, SmartphoneIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { Progress } from '../../../components/ui/progress'
import { SegmentedControl, SegmentedControlItem } from '../../../components/ui/segmented-control'
import { cn } from '../../../lib/utils'
import { designTheme, type SurveyAnswer, type SurveyAnswers } from '../question/data'
import { useSeed } from '../question/flow'
import { Done } from '../question/review'
import { Stage } from '../question/stage'
import { QuestionView } from '../question/view'
import type { SurveyBuilderCopy } from './data'
import type { Builder } from './use-builder'

/* The selected question as respondents will see it, live while it's edited,
 * in the survey's own design, on a phone (operated by touch: larger targets,
 * no key hints) or a desktop screen (drawn at a desktop's width and scaled
 * to fit). Its answers are only the preview's; OK and Back step the editor
 * through the questions, and the questions travel as they do for
 * respondents. Switching device hands one frame over to the other. Test the
 * survey runs the whole of it, logic and all, in the layout it's published in. */

interface PreviewProps {
  builder: Builder
  copy: SurveyBuilderCopy
  onTest: () => void
  className?: string
}

export function Preview({ builder, copy, onTest, className }: PreviewProps) {
  const k = useYouj()
  const headingId = useId()
  const seed = useSeed()
  const [device, setDevice] = useState<'phone' | 'desktop'>('phone')
  const [answers, setAnswers] = useState<SurveyAnswers>({})
  const [others, setOthers] = useState<Record<string, boolean>>({})
  const { survey, selected } = builder
  const index = survey.questions.findIndex((q) => q.id === selected)
  const question = survey.questions[index]
  // The way the preview travels: on when the selection moved down the outline, back when it moved up.
  const [shown, setShown] = useState({ id: selected, at: index, direction: 1 as 1 | -1 })
  if (shown.id !== selected) setShown({ id: selected, at: index, direction: index === -1 || index > shown.at ? 1 : -1 })
  const ending = survey.ending?.title ? survey.ending : { title: copy.respondent.doneTitle, description: copy.respondent.doneDescription }
  const total = survey.questions.length
  const phone = device === 'phone'

  const screen = (
    <div className={cn('@container flex h-full flex-col bg-canvas text-fg', phone && 'pt-14 pb-7')}>
      <Progress
        value={question ? (index / Math.max(1, total)) * 100 : 100}
        aria-hidden
        tone="accent"
        className={cn(
          'shrink-0 [&_[data-slot=progress-track]]:h-0.5 [&_[data-slot=progress-track]]:rounded-none [&_[data-slot=progress-track]]:bg-line',
          phone && 'px-5 [&_[data-slot=progress-track]]:rounded-full',
        )}
      />
      <div className="flex shrink-0 items-center justify-between gap-2 px-5 py-3 text-ui-sm text-fg-muted">
        <span className="truncate font-medium text-fg">{survey.title}</span>
        {question && (
          <span className="font-mono tabular-nums">
            {index + 1} / {total}
          </span>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto yj-scrollbar">
        <div className={cn('flex min-h-full flex-col px-5 pt-4 pb-6', !phone && 'justify-center px-12')}>
          <Stage step={selected} direction={shown.direction} focus={false}>
            {question ? (
              <QuestionView
                question={question}
                answer={answers[question.id]}
                otherOpen={!!others[question.id]}
                heading="h3"
                copy={copy.respondent}
                seed={seed}
                size={phone ? 'default' : 'lg'}
                onAnswer={(next: SurveyAnswer | undefined, otherOpen?: boolean) => {
                  setAnswers((all) => ({ ...all, [question.id]: next as SurveyAnswer }))
                  if (otherOpen !== undefined) setOthers((open) => ({ ...open, [question.id]: otherOpen }))
                }}
              />
            ) : selected === 'ending' ? (
              <Done heading="h3" title={ending.title} description={ending.description} />
            ) : (
              <div className="flex flex-col gap-2">
                <h3 className="text-2xl leading-tight font-semibold tracking-tight text-balance">{survey.title}</h3>
                {survey.description && <p className="text-ui text-pretty text-fg-muted">{survey.description}</p>}
              </div>
            )}
          </Stage>
        </div>
      </div>
      {question && (
        <div className={cn('flex shrink-0 items-center gap-2 px-5 pt-3', phone ? 'pb-1' : 'border-t border-line pb-3')}>
          <Button
            variant="outline"
            size="icon"
            aria-label={copy.back}
            disabled={index === 0}
            onClick={() => builder.select(survey.questions[index - 1]!.id)}
          >
            <ArrowLeftIcon size={15} className="rtl:-scale-x-100" />
          </Button>
          <Button className="flex-1" onClick={() => builder.select(survey.questions[index + 1]?.id ?? 'ending')}>
            {copy.ok}
            <CheckIcon size={14} aria-hidden />
          </Button>
        </div>
      )}
    </div>
  )

  return (
    <aside aria-labelledby={headingId} className={cn('flex min-h-0 flex-col', className)}>
      <div className="flex shrink-0 items-center justify-between gap-2 px-4 pt-3 pb-2">
        <h2 id={headingId} className="text-ui font-semibold text-fg">
          {copy.previewLabel}
        </h2>
        <SegmentedControl variant="pill" aria-label={copy.device} value={device} onValueChange={(v) => setDevice(v as 'phone' | 'desktop')}>
          <SegmentedControlItem value="phone" aria-label={copy.phone} className="px-2.5">
            <SmartphoneIcon size={14} />
          </SegmentedControlItem>
          <SegmentedControlItem value="desktop" aria-label={copy.desktop} className="px-2.5">
            <MonitorIcon size={14} />
          </SegmentedControlItem>
        </SegmentedControl>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 pb-4">
        <MotionFeatures features="max">
          <AnimatePresence mode="popLayout" initial={false}>
            <m.div
              key={device}
              initial={{ opacity: 0, scale: k.reduced ? 1 : 0.94 }}
              animate={{ opacity: 1, scale: 1, transition: { scale: k.spring('smooth'), opacity: k.tween('base', 'enter') } }}
              exit={{ opacity: 0, scale: k.reduced ? 1 : 0.94, transition: k.tween('fast', 'exit') }}
              className={phone ? 'origin-center [zoom:0.68]' : 'overflow-hidden rounded-xl border border-line-strong bg-canvas shadow-lg'}
            >
              {phone ? (
                // The docs' phone, drawn the same: a 393 × 852 screen in a 6px bezel, with the island and the home indicator.
                <div className="relative rounded-[calc(var(--spacing)*14.6)] bg-[color-mix(in_oklab,var(--color-fg)_calc(72%_-_30%_*_var(--yj-dark)),var(--color-canvas))] p-1.5 shadow-2xl ring-1 ring-line-strong">
                  <div className="relative flex h-213 w-98.25 flex-col overflow-clip rounded-[calc(var(--spacing)*13.1)] bg-canvas text-fg">
                    <div
                      aria-hidden
                      className="pointer-events-none absolute start-1/2 top-2.75 z-10 h-9.25 w-31.5 -translate-x-1/2 rounded-full bg-[color-mix(in_oklab,var(--color-fg)_calc(85%_-_77%_*_var(--yj-dark)),var(--color-canvas))] rtl:translate-x-1/2"
                    />
                    <ThemeScope theme={designTheme(survey.design)} device="touch">
                      {screen}
                    </ThemeScope>
                    <div
                      aria-hidden
                      className="pointer-events-none absolute start-1/2 bottom-2 z-10 h-1.25 w-33.5 -translate-x-1/2 rounded-full bg-[color-mix(in_oklab,var(--color-fg)_80%,transparent)] rtl:translate-x-1/2"
                    />
                  </div>
                </div>
              ) : (
                // A desktop's screen, drawn at a desktop's width and scaled to fit, so its layout is the real one.
                <div className="h-150 w-240 [zoom:0.33]">
                  <ThemeScope theme={designTheme(survey.design)} device="pointer">
                    {screen}
                  </ThemeScope>
                </div>
              )}
            </m.div>
          </AnimatePresence>
        </MotionFeatures>
      </div>
      <div className="shrink-0 border-t border-line p-3">
        <Button variant="outline" className="w-full" onClick={onTest}>
          <PlayIcon size={14} />
          {copy.test}
        </Button>
      </div>
    </aside>
  )
}
