'use client'

import { useState, type ReactNode } from 'react'
import { AsyncButton } from '../../../components/ui/async-button'
import { Button } from '../../../components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { Field, FieldLabel } from '../../../components/ui/field'
import { Input } from '../../../components/ui/input'
import { NumberInput } from '../../../components/ui/number-input'
import { SegmentedControl, SegmentedControlItem } from '../../../components/ui/segmented-control'
import { cn } from '../../../lib/utils'
import { Stage } from '../question/stage'
import type { SurveyBuilderCopy, SurveyDeployment, SurveySegment } from './data'
import { Live } from './live'
import { WhereStep } from './publish-where'

/* Publish, in two steps and a result. Where: the channel (a link, an embed,
 * or in-app) as three cards, then what that channel needs: the link's
 * address and who may answer; the embed's layout; the in-app segment, the
 * share of it that's asked (with the reach in people), when it appears and
 * whether once. When: it opens now or at a date and time, and closes never,
 * on a date, or after a number of responses. Publish hands it all to
 * `onPublish`; a rejection stays on the step and says why. Then the live
 * view: the link to copy, the share card, the embed's snippet. The steps
 * travel the way you go in a body that keeps its height. */

export type PublishStep = 'where' | 'when' | 'live'

interface PublishDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  step: PublishStep
  onStepChange: (step: PublishStep) => void
  deployment: SurveyDeployment
  onDeploymentChange: (deployment: SurveyDeployment) => void
  /** Runs the publish; resolves with the live link. */
  onPublish: () => Promise<unknown>
  /** The live link, once published. */
  url: string | null
  segments: SurveySegment[]
  /** Formats the reach. */
  number: Intl.NumberFormat
  /** A real QR code for the share card, drawn by the app's own library. Default: QR-like art. */
  qrCode?: (url: string) => ReactNode
  copy: SurveyBuilderCopy
}

export function PublishDialog({
  open,
  onOpenChange,
  step,
  onStepChange,
  deployment: d,
  onDeploymentChange,
  onPublish,
  url,
  segments,
  number,
  qrCode,
  copy,
}: PublishDialogProps) {
  const [failure, setFailure] = useState<string | null>(null)
  const set = (patch: Partial<SurveyDeployment>) => onDeploymentChange({ ...d, ...patch })
  const publish = async () => {
    setFailure(null)
    try {
      await onPublish()
    } catch (cause) {
      setFailure(cause instanceof Error && cause.message ? cause.message : copy.publishFailed)
      throw cause
    }
  }

  const where = <WhereStep deployment={d} set={set} segments={segments} number={number} copy={copy} />

  const close = d.close
  const when = (
    <div className="flex flex-col gap-6">
      <h3 data-yj-step-heading tabIndex={-1} className="sr-only">
        {copy.stepWhen}
      </h3>
      <Field>
        <FieldLabel>{copy.start}</FieldLabel>
        <SegmentedControl
          variant="pill"
          value={d.start === null ? 'now' : 'later'}
          onValueChange={(v) => set({ start: v === 'now' ? null : (d.start ?? '') })}
          className="w-full *:flex-1"
        >
          <SegmentedControlItem value="now">{copy.startNow}</SegmentedControlItem>
          <SegmentedControlItem value="later">{copy.startLater}</SegmentedControlItem>
        </SegmentedControl>
        {d.start !== null && (
          <Input type="datetime-local" aria-label={copy.startAt} value={d.start} onChange={(e) => set({ start: e.target.value })} />
        )}
      </Field>
      <Field>
        <FieldLabel>{copy.close}</FieldLabel>
        <SegmentedControl
          variant="pill"
          value={close.kind}
          onValueChange={(kind) =>
            set({ close: kind === 'date' ? { kind, date: '' } : kind === 'responses' ? { kind, responses: 500 } : { kind: 'never' } })
          }
          className="w-full *:flex-1"
        >
          <SegmentedControlItem value="never">{copy.closeNever}</SegmentedControlItem>
          <SegmentedControlItem value="date">{copy.closeDate}</SegmentedControlItem>
          <SegmentedControlItem value="responses">{copy.closeResponses}</SegmentedControlItem>
        </SegmentedControl>
        {close.kind === 'date' && (
          <Input
            type="date"
            aria-label={copy.closeDateLabel}
            value={close.date}
            onChange={(e) => set({ close: { kind: 'date', date: e.target.value } })}
          />
        )}
        {close.kind === 'responses' && (
          <NumberInput
            aria-label={copy.responsesLabel}
            value={close.responses}
            min={1}
            step={50}
            onValueChange={(n) => set({ close: { kind: 'responses', responses: n ?? 1 } })}
          />
        )}
      </Field>
      {failure && (
        <p role="alert" className="text-ui text-danger-text">
          {failure}
        </p>
      )}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{step === 'live' ? copy.share : copy.publishTitle}</DialogTitle>
          <DialogDescription>{step === 'live' ? copy.liveDescriptions[d.channel] : copy.publishDescription}</DialogDescription>
        </DialogHeader>
        {step !== 'live' && (
          <ol className="flex items-center gap-2 text-ui-sm" aria-label={copy.publishTitle}>
            {(['where', 'when'] as const).map((s, i) => (
              <li
                key={s}
                aria-current={step === s ? 'step' : undefined}
                className={cn('flex items-center gap-1.5', step === s ? 'text-fg' : 'text-fg-subtle')}
              >
                <span
                  className={cn(
                    'grid size-5 place-items-center rounded-full font-mono text-ui-xs',
                    step === s ? 'bg-fg text-canvas' : 'border border-line',
                  )}
                >
                  {i + 1}
                </span>
                {s === 'where' ? copy.stepWhere : copy.stepWhen}
                {i === 0 && <span aria-hidden className="ms-1 h-px w-6 bg-line" />}
              </li>
            ))}
          </ol>
        )}
        {/* The body keeps one height from step to step; a long one scrolls inside it. */}
        <div className="h-104 overflow-y-auto yj-scrollbar">
          <Stage step={step} direction={step === 'where' ? -1 : 1}>
            {step === 'where' ? where : step === 'when' ? when : <Live deployment={d} url={url ?? ''} qrCode={qrCode} copy={copy} />}
          </Stage>
        </div>
        <DialogFooter>
          {step === 'where' && (
            <Button onClick={() => onStepChange('when')} className="sm:ms-auto">
              {copy.continue}
            </Button>
          )}
          {step === 'when' && (
            <>
              <Button variant="ghost" onClick={() => onStepChange('where')}>
                {copy.back}
              </Button>
              <AsyncButton
                onAction={publish}
                pendingLabel={copy.publishing}
                successLabel={copy.published}
                errorLabel={copy.publishFailed}
                className="sm:ms-auto"
              >
                {copy.publish}
              </AsyncButton>
            </>
          )}
          {step === 'live' && (
            <Button onClick={() => onOpenChange(false)} className="sm:ms-auto">
              {copy.done}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
