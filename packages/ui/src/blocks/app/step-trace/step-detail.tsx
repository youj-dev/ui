'use client'

import type { ElementType } from 'react'
import { XIcon } from '@youj/icons'
import { Badge, BadgeDot } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { CodeBlock } from '../../../components/ui/code-block'
import type { FlowStatus } from '../../../components/ui/flow-graph'
import { Eyebrow } from '../../../components/ui/typography'
import { cn, numberFormat, toneColor } from '../../../lib/utils'
import { attemptAt, progressAt, type StepTraceCopy, type Planned, type StepTraceKind, type StepTraceStep } from './data'

interface StepDetailProps {
  id: string
  step: StepTraceStep
  plan: Planned
  status: FlowStatus
  /** Seconds into the run. */
  t: number
  /** The names of the steps it waits on. */
  waitingOn: string
  copy: StepTraceCopy
  /** The step's kind, if the run lists it. */
  kind?: StepTraceKind
  format?: { size?: (value: number) => string; duration?: (ms: number) => string; cost?: (value: number) => string }
  SectionTitle: ElementType
  onClose: () => void
}

/** Whether a payload is JSON (an object or a list); anything else is shown as plain text, or markdown from a step that streams. */
const json = (code: string) => /^\s*[{[]/.test(code)

/** Plain text wraps inside its block; code scrolls sideways. */
const WRAP = '[&_pre]:w-full [&_pre]:break-words [&_pre]:whitespace-pre-wrap'

const TONE: Record<FlowStatus, 'default' | 'success' | 'warning' | 'danger' | 'secondary'> = {
  queued: 'secondary',
  running: 'default',
  ok: 'success',
  retried: 'warning',
  error: 'danger',
  skipped: 'secondary',
}

/** The open step: its state and figures, then what went in and what came out, side by side on a wide card. */
function StepDetail({ id, step, plan, status, t, waitingOn, copy, kind, format, SectionTitle, onClose }: StepDetailProps) {
  const secondsFormat = numberFormat(copy.locale, { style: 'unit', unit: 'second', unitDisplay: 'narrow', minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const seconds = { format: (s: number) => (format?.duration ? format.duration(s * 1000) : secondsFormat.format(s)) }
  const intl = numberFormat(copy.locale)
  const count = { format: format?.size ?? intl.format }
  const attemptsCount = intl
  const dollars = numberFormat(copy.locale, { style: 'currency', currency: 'USD', minimumFractionDigits: 4, maximumFractionDigits: 4 })
  const spend = format?.cost ?? dollars.format
  const streams = kind?.streams ?? false
  const progress = progressAt(plan, t)
  const ran = status !== 'queued' && status !== 'skipped'
  const took = status === 'running' ? t - plan.start : plan.end - plan.start
  // A model call's output grows as it streams; the tokens and cost count up with it.
  const lines = step.output.split('\n')
  const streamed = status === 'running' && streams ? lines.slice(0, Math.max(1, Math.round(lines.length * progress))).join('\n') : step.output
  const out = step.size && (status === 'running' ? Math.round(step.size.output * progress) : step.size.output)

  const figures = [
    { label: copy.duration, value: ran ? seconds.format(took) : '—' },
    step.size && { label: copy.sizeInOut, value: ran ? `${count.format(step.size.input)} / ${count.format(out ?? 0)}` : '—' },
    step.cost !== undefined && { label: copy.cost, value: ran ? spend(step.cost * (status === 'running' ? progress : 1)) : '—' },
    step.attempts.length > 1 && { label: copy.attempts, value: attemptsCount.format(ran ? attemptAt(plan, t) : 0) },
  ].filter((f): f is { label: string; value: string } => !!f)

  const failed = status === 'error'
  const note =
    status === 'queued' ? copy.waiting(waitingOn) : status === 'skipped' ? (step.off ? copy.skippedOff : copy.skippedAfter) : status === 'running' && !streams ? copy.noOutput : null

  return (
    <section id={id} aria-labelledby={`${id}-title`} data-slot="step-trace-detail" className="flex flex-col gap-4">
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
        <SectionTitle id={`${id}-title`} dir="ltr" className="min-w-0 truncate font-mono text-ui-lg font-medium text-fg">
          {step.label}
        </SectionTitle>
        <Badge variant={TONE[status]}>
          <BadgeDot />
          {copy.status[status]}
        </Badge>
        <Eyebrow className={kind?.tone && 'flex items-center gap-1.5'}>
          {kind?.tone && <span aria-hidden className="size-2 rounded-xs" style={{ background: toneColor(kind.tone) }} />}
          {kind?.label ?? step.kind}
        </Eyebrow>
        <Button variant="ghost" size="icon-sm" aria-label={copy.closeStep} onClick={onClose} className="ms-auto">
          <XIcon size={15} />
        </Button>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
        {figures.map((f, i) => (
          <div key={f.label} className={cn('flex min-w-0 flex-col gap-1', i % 2 === 1 && 'border-s border-line ps-4 sm:border-s-0 sm:ps-0', i > 0 && 'sm:border-s sm:border-line sm:ps-4')}>
            <Eyebrow render={<dt />} className="truncate">
              {f.label}
            </Eyebrow>
            <dd className="truncate font-mono text-ui-lg text-fg tabular-nums">{f.value}</dd>
          </div>
        ))}
      </dl>

      {failed && step.error && (
        <p role="note" className="rounded-lg bg-danger-subtle px-3 py-2 font-mono text-ui-sm text-danger-text">
          {step.error}
        </p>
      )}
      {!failed && step.error && ran && attemptAt(plan, t) > 1 && (
        <p role="note" className="rounded-lg bg-warning-subtle px-3 py-2 font-mono text-ui-sm text-warning-text">
          {step.error}
        </p>
      )}

      <div className="grid min-w-0 gap-3 md:grid-cols-2">
        <CodeBlock code={step.input} language={json(step.input) ? 'json' : undefined} filename={copy.input} className={cn('min-w-0', !json(step.input) && WRAP)} sound={false} />
        {note || !streamed ? (
          <div className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-line px-4 text-center text-ui-sm text-fg-muted">{note ?? copy.noOutput}</div>
        ) : (
          <CodeBlock
            code={streamed}
            language={json(step.output) ? 'json' : streams ? 'md' : undefined}
            filename={copy.output}
            className={cn('min-w-0', failed && '[&_pre]:text-danger-text', !json(step.output) && !streams && WRAP)}
            sound={false}
            tail={status === 'running' ? <span aria-hidden className="ms-0.5 inline-block h-[1.1em] w-[0.5em] translate-y-[0.15em] bg-accent" /> : undefined}
          />
        )}
      </div>
    </section>
  )
}

export { StepDetail }
