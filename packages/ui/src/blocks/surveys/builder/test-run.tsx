'use client'

import { useState } from 'react'
import { ConversationalSurvey } from '../conversational'
import { SurveyDeck } from '../deck'
import { SurveyForm } from '../form'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { SegmentedControl, SegmentedControlItem } from '../../../components/ui/segmented-control'
import type { Survey, SurveyDesign } from '../question/data'
import type { SurveyBuilderCopy } from './data'

/* The whole survey, answered as people will: logic, validation, the review
 * and the thanks, in any of the three layouts its link can open in (the
 * design's, to begin with). Nothing sent here goes anywhere. Each layout is
 * the real block, so what's tested is what ships. */

const nowhere = () => undefined

interface TestRunProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  survey: Survey
  copy: SurveyBuilderCopy
}

export function TestRun({ open, onOpenChange, survey, copy }: TestRunProps) {
  const [layout, setLayout] = useState<NonNullable<SurveyDesign['layout']>>(survey.design?.layout ?? 'conversational')
  // The dialog's content unmounts when it closes, so each opening is a fresh run.
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{copy.testTitle}</DialogTitle>
          <DialogDescription>{copy.testDescription}</DialogDescription>
        </DialogHeader>
        {/* The dialog pads its body's rows; the control and the stage sit inside one, at their own size. */}
        <div className="flex flex-col gap-3">
          <SegmentedControl
            variant="pill"
            aria-label={copy.layout}
            value={layout}
            onValueChange={(v) => setLayout(v as typeof layout)}
            className="w-full *:flex-1 sm:w-fit"
          >
            {(['conversational', 'form', 'deck'] as const).map((l) => (
              <SegmentedControlItem key={l} value={l} className="px-3">
                {copy.layouts[l]}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
          <div className="grid h-[68dvh] place-items-center overflow-hidden rounded-xl border border-line p-3" key={layout}>
            {layout === 'form' ? (
              <SurveyForm embedded survey={survey} onSubmit={nowhere} className="h-full" />
            ) : layout === 'deck' ? (
              <SurveyDeck embedded survey={survey} onSubmit={nowhere} className="h-full" />
            ) : (
              <ConversationalSurvey embedded fill survey={survey} onSubmit={nowhere} className="h-full" />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
