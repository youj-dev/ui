'use client'

import { useId, useState, type ComponentProps } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { AsyncButton } from '../../components/ui/async-button'
import { Badge } from '../../components/ui/badge'
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { SeverityTimeline, type SeverityEvent } from '../../components/ui/severity-timeline'
import { Stepper } from '../../components/ui/stepper'
import { Eyebrow } from '../../components/ui/typography'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { useNow } from '../../hooks/use-now'
import { cn, numberFormat, relativeTimeFormat } from '../../lib/utils'
import {
  CLOSED,
  DEFAULT_COPY,
  DEFAULT_STAGE,
  DEMO_NOW,
  DETAILS,
  SIGNALS,
  STAGES,
  STEPS,
  VERDICTS,
  demo,
  type CaseFileCopy,
  type CaseFileDetails,
  type CaseFileSignal,
  type CaseFileStage,
  type CaseFileStep,
  type CaseFileVerdict,
} from './case-file/data'
import { Verdict } from './case-file/verdict'

/* One case as a card: where it stands (the stages on a Stepper), the verdict
 * with how sure it is and the signals behind it as one split bar, and the
 * chain of events step by step on a SeverityTimeline, each step a node in its
 * source's color with its offset from the first, the ribbon showing the pace
 * and the step still running breathing at its live end. The primary action
 * finishes the current stage and moves the case on (a stage that `stops` ends
 * what was still running); Dismiss closes it as a false positive. The demo is
 * a security case in four stages; an insurance claim or a fraud review is the
 * same card with other `stages` and `verdicts`. Pass your own `details`,
 * `signals` and `steps`, `now` from your server so the ages hydrate, and own
 * the stage with `stage`/`onStageChange` if your app tracks it; every string
 * is in `copy`.
 * Embedded, it stops at its natural width unless `fill`.
 * Reduced motion: the stepper, bar and ribbon change in place. */

interface CaseFileProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (448px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<CaseFileCopy>
  /** Formats ages, times and shares (BCP 47). Default: the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The case: its reference, when it opened, who it is about and the verdict. */
  details?: CaseFileDetails
  /** The evidence behind the verdict, split by weight. */
  signals?: CaseFileSignal[]
  /** The chain of events, in any order: it is shown oldest first. */
  steps?: CaseFileStep[]
  /** The stages a case moves through, in order, each with the words of its action. Default: triage, investigate, contain, close. */
  stages?: CaseFileStage[]
  /** The verdicts a case can carry, with the tone of their badge. Default: malicious, suspicious, benign. */
  verdicts?: CaseFileVerdict[]
  /** Formats the chain's span, given in minutes. Default: the locale's short minutes ("470 min"). */
  formatSpan?: (minutes: number) => string
  /** The time the card renders at, which the server and the browser agree on. Default: the demo's fixed time with the demo steps; with your own, the browser's clock once mounted. */
  now?: Date | string | number
  /** Clock times in this zone, e.g. "UTC"; set it when you render on the server. Default: the browser's. */
  timeZone?: string
  /** The id of the stage the case is in, or `closed`, when your app owns it; pair with `onStageChange`. */
  stage?: string
  /** The stage at first, when the card owns it. Default: `contain` for the demo's stages, else the first stage. */
  defaultStage?: string
  /** Called with the new stage's id (`closed` after the last) once an action has run. */
  onStageChange?: (stage: string) => void
  /** Runs the current stage's action (given its id); the card awaits it, then moves on. */
  onAdvance?: (stage: string) => Promise<unknown> | unknown
  /** Closes the case as a false positive; the card awaits it. */
  onDismiss?: () => Promise<unknown> | unknown
}

/** A verdict's tone as a Badge variant (Badge has no info variant: the accent stands in). */
const BADGE = { danger: 'danger', warning: 'warning', success: 'success', info: 'default', neutral: 'secondary' } as const
const MINUTE = 60_000

function CaseFile({
  theme,
  embedded = true,
  fill = false,
  className,
  copy: copyProp,
  locale: localeProp,
  details = DETAILS,
  signals = SIGNALS,
  steps: stepsProp,
  stages: stagesProp,
  verdicts = VERDICTS,
  formatSpan,
  now: nowProp,
  timeZone,
  stage: stageProp,
  defaultStage,
  onStageChange,
  onAdvance,
  onDismiss,
  ...rest
}: CaseFileProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const titleId = useId()
  const verdictId = useId()
  const chainId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const Section = embedded ? 'h3' : 'h2'
  const { announce, announcer } = useAnnouncer()
  const stages = stagesProp ?? STAGES
  const steps = stepsProp ?? STEPS
  const live = useNow(nowProp === undefined && stepsProp ? MINUTE : 0)
  const sorted = [...steps].sort((a, b) => +new Date(a.at) - +new Date(b.at))
  const first = sorted.length ? +new Date(sorted[0]!.at) : +new Date(details.openedAt)
  const last = sorted.length ? +new Date(sorted[sorted.length - 1]!.at) : first
  const now = nowProp !== undefined ? +new Date(nowProp) : stepsProp ? (live ?? last) : +new Date(DEMO_NOW)

  const [stage, setStageState] = useControllableState(stageProp, defaultStage ?? (stagesProp ? (stages[0]?.id ?? CLOSED) : DEFAULT_STAGE))
  const [dismissed, setDismissed] = useState(false)
  const [containedAt, setContainedAt] = useState<number>()
  const found = stages.findIndex((s) => s.id === stage)
  const index = stage === CLOSED || found < 0 ? stages.length : found
  const current = stages[index]
  // Past the stage that stops it nothing is still running: the live steps end where it ran.
  const stopIndex = stages.findIndex((s) => s.stops)
  const halted = stopIndex >= 0 && index > stopIndex
  const haltedAt = containedAt ?? now
  const setStage = (next: string) => {
    setStageState(next)
    onStageChange?.(next)
  }

  const events: SeverityEvent[] = sorted.map((s) => {
    const at = +new Date(s.at)
    const running = s.ongoing && !halted
    return {
      id: s.id,
      at,
      title: s.title,
      tone: s.tone,
      detail: (
        <>
          {s.source} · <span className="font-mono">{s.entity}</span>
        </>
      ),
      ongoing: running || undefined,
      duration: s.ongoing && halted ? Math.max(0, haltedAt - at) : undefined,
    }
  })

  const minutes = numberFormat(locale, { style: 'unit', unit: 'minute', unitDisplay: 'short', maximumFractionDigits: 0 })
  const spanMinutes = Math.max(0, Math.round(((halted ? haltedAt : Math.max(now, last)) - first) / MINUTE))
  const span = (formatSpan ?? minutes.format)(spanMinutes)
  const age = (() => {
    const relative = relativeTimeFormat(locale, { numeric: 'auto' })
    const elapsed = Math.max(0, now - +new Date(details.openedAt))
    if (elapsed < 60 * MINUTE) return relative.format(-Math.round(elapsed / MINUTE), 'minute')
    if (elapsed < 24 * 60 * MINUTE) return relative.format(-Math.round(elapsed / (60 * MINUTE)), 'hour')
    return relative.format(-Math.round(elapsed / (24 * 60 * MINUTE)), 'day')
  })()

  const failure = (error: unknown) => (error instanceof Error && error.message ? error.message : copy.failed)

  const advance = async () => {
    if (!current) return
    await (onAdvance ? onAdvance(current.id) : demo('CaseFile: onAdvance', 700))
    const next = stages[index + 1]
    if (current.stops) setContainedAt(now)
    setStage(next?.id ?? CLOSED)
    announce(next ? copy.announceStage(next.label) : copy.announceClosed)
  }

  const dismiss = async () => {
    await (onDismiss ? onDismiss() : demo('CaseFile: onDismiss', 600))
    setDismissed(true)
    setStage(CLOSED)
    announce(copy.announceDismissed)
  }

  const verdict = verdicts.find((v) => v.id === details.verdict)

  const card = (
    <Card data-slot="case-file" className={cn('w-full gap-0 overflow-hidden py-0 text-fg', !embedded && !fill && 'max-w-md')}>
      <CardHeader className="py-(--card-spacing)">
        <CardTitle>
          <Title id={titleId}>{details.id}</Title>
        </CardTitle>
        <CardDescription className="truncate">
          {copy.opened(age)} · <span className="font-mono">{details.subject}</span>
        </CardDescription>
        <CardAction>
          {/* A sentence, not a label: it keeps its case in a theme that sets badges in capitals. */}
          <Badge
            variant={dismissed ? 'secondary' : BADGE[verdict?.tone ?? 'neutral']}
            size="lg"
            className="font-sans text-ui tracking-normal normal-case"
          >
            {dismissed ? copy.dismissed : (verdict?.label ?? details.verdict)}
          </Badge>
        </CardAction>
      </CardHeader>

      <div className="border-t border-line px-(--ui--panel-x) py-(--ui--panel-y)">
        <Stepper aria-label={copy.stagesLabel} current={index} steps={stages.map((s) => ({ id: s.id, title: s.label }))} />
      </div>

      <Verdict details={details} signals={signals} copy={copy} locale={locale} id={verdictId} heading={Section} />

      <section aria-labelledby={chainId} className="flex flex-col gap-2 border-t border-line px-(--ui--panel-x) py-(--ui--panel-y)">
        <div className="flex items-baseline justify-between gap-3">
          <Eyebrow id={chainId} render={<Section />}>
            {copy.chainTitle}
          </Eyebrow>
          <span className="font-mono text-ui-sm text-fg-muted tabular-nums">{span}</span>
        </div>
        <SeverityTimeline
          label={copy.chainTitle}
          events={events}
          start={first}
          end={halted ? haltedAt : undefined}
          now={now}
          locale={locale}
          timeZone={timeZone}
        />
      </section>

      <footer className="flex gap-3 border-t border-line px-(--ui--panel-x) py-(--ui--panel-foot-y)">
        <AsyncButton
          variant="secondary"
          className="flex-1"
          disabled={!current}
          onAction={dismiss}
          pendingLabel={copy.dismissing}
          errorLabel={failure}
        >
          {copy.dismiss}
        </AsyncButton>
        <AsyncButton
          className="flex-1"
          disabled={!current}
          onAction={advance}
          pendingLabel={current?.pending}
          successLabel={current?.done}
          errorLabel={failure}
        >
          {current ? current.action : copy.closed}
        </AsyncButton>
      </footer>
      {announcer}
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-md', className)}>
      {card}
    </section>
  ) : (
    <main
      aria-labelledby={titleId}
      {...rest}
      className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}
    >
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { CaseFile, type CaseFileProps }
export type { CaseFileCopy, CaseFileDetails, CaseFileSignal, CaseFileStage, CaseFileStep, CaseFileVerdict }
