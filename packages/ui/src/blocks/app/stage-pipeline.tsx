'use client'

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore, type ComponentProps } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { CopyIcon, MoreHorizontalIcon, RotateCcwIcon } from '@youj/icons'
import { Badge, BadgeDot } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu'
import { StageRail, type Stage } from '../../components/ui/stage-rail'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useVisible } from '../../hooks/use-visible'
import { cn, numberFormat } from '../../lib/utils'
import { DEFAULT_COPY, RUN, STAGES, demo, type StagePipelineCopy, type StagePipelineLevel, type StagePipelineLine, type StagePipelineLog, type StagePipelineRun, type StagePipelineScript, type StagePipelineState } from './stage-pipeline/data'
import { LogWell } from './stage-pipeline/log-well'

/* A run through ordered stages as an instrument card: what is being run and
 * where it's going, then its stages on a StageRail (each stage's duration
 * ticks in mono while it runs, its cells fill toward its usual time), and
 * under it the selected stage's log, tailing: it follows the newest line
 * until you scroll up or pause, then counts what arrives. The selection
 * follows the running stage until you pick one. When every stage passes,
 * Promote puts the result out; Roll back returns to the previous one. The
 * demo replays a run a line a beat, under a "Demo data" badge; pass your
 * system's `progress` (re-rendered as it moves) and wire `onRerun`,
 * `onPromote` and `onRollBack` to your API. The demo is a deploy; a batch
 * on a production line or an article through editing reads the same, with
 * the stages, lines and words yours. Reduced motion: the rail and log
 * change in place.
 * It is built for the compact layout density (ui.css), taken from the page;
 * embedded too, it stops at its natural width unless `fill`. */

interface StagePipelineProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (640px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<StagePipelineCopy>
  /** What is being run. Default: the demo deploy. */
  run?: StagePipelineRun
  /** The demo's stages and what each prints, replayed a line a beat. Default: build, test and deploy. */
  stages?: StagePipelineScript[]
  /** Your run as it stands: each stage's status, timing and printed lines. Pass it, and re-render as the run moves, to show a real run instead of the replay. Default: none (the demo replays `stages`). */
  progress?: StagePipelineStage[]
  /** Starts the run again. Default: the demo replays from the start. */
  onRerun?: () => Promise<unknown> | unknown
  /** Shows a dashed "Demo data" badge while the card replays its demo run (no `progress` passed). Default true. */
  demoMarker?: boolean
  /** Puts the finished run out (the release, the batch, the article); resolve when it's done. Default: a short demo wait. */
  onPromote?: () => Promise<unknown> | unknown
  /** Returns to what came before; resolve when it's back. Default: a short demo wait. */
  onRollBack?: () => Promise<unknown> | unknown
  /** Formats durations and counts. Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** Writes a duration in ms for the total and the log's stamps. Default: minutes and seconds ("1:48"). */
  format?: { duration?: (ms: number) => string }
}

/** A stage as it stands: StageRail's status and timing, with the log lines it has printed. */
interface StagePipelineStage extends Stage {
  lines: StagePipelineLog[]
}

/** The demo prints one log line per beat. */
const BEAT = 900
/** Where the demo opens: the first stage done in 96% of its usual time, the second 19/32 of the way through its own and five lines in, the rest waiting. */
const OPENING = { done: 1, printed: 5, finished: 0.96, progress: 19 / 32 }

const spread = (script: StagePipelineScript, count: number, over: number) =>
  script.lines.slice(0, count).map((line, i) => ({
    ...line,
    id: `${script.id}-${i}`,
    at: Math.round(((i + 1) / (count + 1)) * over),
  }))

const tookOf = (script: StagePipelineScript) => Math.round(script.estimate * OPENING.finished)
const elapsedOf = (script: StagePipelineScript) => Math.round(script.estimate * OPENING.progress)

function openingStages(scripts: StagePipelineScript[]): StagePipelineStage[] {
  const now = Date.now()
  return scripts.map((script, i) =>
    i < OPENING.done
      ? {
          id: script.id,
          name: script.name,
          estimate: script.estimate,
          status: 'passed',
          duration: tookOf(script),
          lines: spread(script, script.lines.length, tookOf(script)),
        }
      : i === OPENING.done
        ? {
            id: script.id,
            name: script.name,
            estimate: script.estimate,
            status: 'running',
            startedAt: now - elapsedOf(script),
            lines: spread(script, OPENING.printed, elapsedOf(script)),
          }
        : {
            id: script.id,
            name: script.name,
            estimate: script.estimate,
            status: 'queued',
            lines: [],
          },
  )
}

/** One beat of the demo: the running stage prints its next line, and passes, fails or hands over when its script runs out. */
function advance(stages: StagePipelineStage[], scripts: StagePipelineScript[], now: number): StagePipelineStage[] {
  const index = stages.findIndex((s) => s.status === 'running')
  if (index < 0) return stages
  const stage = stages[index]!
  const script = scripts[index]!
  const next = script.lines[stage.lines.length]
  const elapsed = now - (stage.startedAt ?? now)
  if (!next) {
    return stages.map((s, i) =>
      i === index ? { ...s, status: 'passed', duration: elapsed } : i === index + 1 ? { ...s, status: 'running', startedAt: now } : s,
    )
  }
  const lines = [...stage.lines, { ...next, id: `${stage.id}-${stage.lines.length}`, at: elapsed }]
  if (next.fails)
    return stages.map((s, i) => (i === index ? { ...s, lines, status: 'failed', duration: elapsed } : i > index ? { ...s, status: 'skipped' } : s))
  return stages.map((s, i) => (i === index ? { ...s, lines } : s))
}

function stateOf(stages: StagePipelineStage[], outcome: StagePipelineState | null): StagePipelineState {
  if (outcome) return outcome
  if (stages.some((s) => s.status === 'failed')) return 'failed'
  return stages.every((s) => s.status === 'passed') ? 'passed' : 'running'
}

const TONE: Record<StagePipelineState, 'warning' | 'success' | 'danger' | 'secondary' | 'default'> = {
  running: 'default',
  passed: 'success',
  failed: 'danger',
  promoted: 'success',
  rolledBack: 'secondary',
}

/* The calmer finish the card puts on StageRail through its slots: each
 * stage's meter one smooth rounded bar (the track holds the empty part, the
 * lit cells butt together) and its duration in the text face. */
const SOFT = cn(
  '[&_[data-slot=stage-rail-track]]:h-1.5 [&_[data-slot=stage-rail-track]]:gap-0 [&_[data-slot=stage-rail-track]]:overflow-hidden [&_[data-slot=stage-rail-track]]:rounded-full [&_[data-slot=stage-rail-track]]:bg-well',
  '[&_[data-slot=stage-rail-cell]]:-me-px [&_[data-slot=stage-rail-cell]]:rounded-none [&_[data-slot=stage-rail-cell][data-state=off]]:bg-transparent',
  '[&_[data-slot=stage-rail-value]]:font-sans',
  '[&_[data-slot=stage-rail-label]]:font-sans [&_[data-slot=stage-rail-label]]:tracking-normal [&_[data-slot=stage-rail-label]]:normal-case',
)

/** The time, refreshed every second while `active`; null until it first ticks (and on the server). */
function useClock(active: boolean) {
  const snapshot = useRef<number | null>(null)
  const subscribe = useCallback(
    (notify: () => void) => {
      if (!active) return () => {}
      snapshot.current = Date.now()
      notify()
      const tick = setInterval(() => {
        snapshot.current = Date.now()
        notify()
      }, 1000)
      return () => clearInterval(tick)
    },
    [active],
  )
  return useSyncExternalStore(subscribe, () => snapshot.current, () => null)
}

function StagePipeline({ theme, embedded = true, fill = false, copy: copyProp, run = RUN, stages: scripts = STAGES, progress, onRerun, onPromote, onRollBack, demoMarker = true, locale, format, className, ...rest }: StagePipelineProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const titleId = useId()
  const logId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const { announce, announcer } = useAnnouncer()
  // Without your progress it replays the demo run, marked as such; yours shows as given.
  const simulated = progress === undefined
  const [played, setStages] = useState(() => openingStages(scripts))
  const stages = progress ?? played
  const [outcome, setOutcome] = useState<StagePipelineState | null>(null)
  const [picked, setPicked] = useState<string>()
  const [startedAt, setStartedAt] = useState(() => Date.now() - (scripts[0] ? tookOf(scripts[0]) : 0) - (scripts[1] ? elapsedOf(scripts[1]) : 0))
  const root = useRef<HTMLElement>(null)
  const visible = useVisible(root)
  const now = useClock(visible)
  const state = stateOf(stages, outcome)
  const running = stages.find((s) => s.status === 'running')

  useEffect(() => {
    if (!visible || !simulated) return
    const beat = setInterval(() => setStages((list) => advance(list, scripts, Date.now())), BEAT)
    return () => clearInterval(beat)
  }, [scripts, simulated, visible])

  // The log follows the running stage until someone picks one.
  const selected = stages.find((s) => s.id === picked) ?? running ?? stages.find((s) => s.status === 'failed') ?? stages.at(-1)!
  // The stage the run is on: the running one, the one that failed, or the last once all have passed.
  const at = stages.findIndex((s) => s.status === 'running' || s.status === 'failed')
  const current = at < 0 ? stages.filter((s) => s.status === 'passed').length : at + 1
  const hintId = useId()
  const hint = state === 'running' ? copy.promoteAfter(stages.at(-1)?.name ?? '') : state === 'failed' ? copy.promoteBlocked : null
  const total = stages.reduce((sum, s) => sum + (s.status === 'running' ? (now ?? 0) - (s.startedAt ?? now ?? 0) : (s.duration ?? 0)), 0)
  const began = simulated ? startedAt : Math.min(...stages.map((s) => s.startedAt ?? Infinity))
  const ago = now === null || !Number.isFinite(began) ? null : Math.max(0, Math.round((now - began) / 60_000))
  const [before, after = ''] = copy.started.split('{ago}')
  const duration = format?.duration ?? clock
  const minutes = numberFormat(copy.locale, {
    style: 'unit',
    unit: 'minute',
    unitDisplay: 'narrow',
  })

  const rerun = () => {
    if (!simulated) {
      void (onRerun ? onRerun() : demo('StagePipeline: onRerun', 0))
      return
    }
    onRerun?.()
    setStages(
      openingStages(scripts).map((s, i) =>
        i === 0
          ? {
              ...s,
              status: 'running',
              startedAt: Date.now(),
              duration: undefined,
              lines: [],
            }
          : { ...s, status: 'queued', startedAt: undefined, lines: [] },
      ),
    )
    setOutcome(null)
    setPicked(undefined)
    setStartedAt(Date.now())
  }

  const card = (
    <Card className={cn('w-full', !embedded && !fill && 'max-w-160', !embedded && 'shadow-lg')}>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Title id={titleId}>{copy.title(run.name)}</Title>
          {simulated && demoMarker && (
            <Badge variant="outline" data-slot="demo-marker" className="border-dashed border-line-strong">
              {copy.demoData}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>{copy.subtitle(run.id, run.target)}</CardDescription>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={copy.more} />}>
              <MoreHorizontalIcon size={15} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={rerun}>
                <RotateCcwIcon size={14} /> {copy.rerun}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  await navigator.clipboard?.writeText(run.id)
                  announce(copy.copied)
                }}
              >
                <CopyIcon size={14} /> {copy.copyRun}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
          <Badge variant={TONE[state]}>
            <BadgeDot />
            {copy.state[state]}
          </Badge>
          <p className="min-w-0 flex-1 basis-56 truncate text-ui-lg font-medium text-fg">{run.summary}</p>
        </div>
        <dl className="grid gap-x-10 gap-y-2 sm:grid-cols-2">
          {[
            {
              label: copy.stageLabel,
              value: copy.stageOf(current, stages.length),
            },
            { label: copy.total, value: now === null ? '—' : duration(total) },
            { label: copy.revision, value: run.revision, code: true },
            { label: copy.source, value: run.source },
          ].map((row: { label: string; value: string; code?: boolean }, i) => (
            <div key={i} className="flex min-w-0 items-baseline justify-between gap-3">
              <dt className="truncate text-ui-sm text-fg-muted">{row.label}</dt>
              <dd className={cn('text-ui text-fg tabular-nums', row.code && 'font-mono text-ui-sm')}>{row.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>

      <CardContent className={SOFT}>
        <StageRail stages={stages} value={selected.id} onValueChange={setPicked} controls={logId} locale={copy.locale} />
      </CardContent>

      <CardContent>
        <LogWell key={selected.id} id={logId} stage={selected.name} status={selected.status} lines={selected.lines} copy={copy} stamp={format?.duration} />
      </CardContent>

      <CardFooter className="flex-wrap">
        <p className="me-auto min-w-0 text-ui-sm text-fg-muted tabular-nums">
          {ago === null ? (
            copy.runner(run.runner)
          ) : (
            <>
              {before}
              <span className="normal-case">{minutes.format(ago)}</span>
              {after} · {copy.runner(run.runner)}
            </>
          )}
        </p>
        <div className="ms-auto flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
          {hint && (
            <span id={hintId} className="text-ui-sm text-fg-muted">
              {hint}
            </span>
          )}
          <div className="flex gap-2">
            <AsyncButton
              variant="secondary"
              disabled={state !== 'passed' && state !== 'promoted'}
              pendingLabel={copy.rollingBack}
              successLabel={copy.rolledBack}
              onAction={async () => {
                await (onRollBack ? onRollBack() : demo('StagePipeline: onRollBack', 1100))
                setOutcome('rolledBack')
                announce(copy.announceRolledBack)
              }}
            >
              {copy.rollBack}
            </AsyncButton>
            <AsyncButton
              disabled={state !== 'passed'}
              aria-describedby={hint ? hintId : undefined}
              pendingLabel={copy.promoting}
              successLabel={copy.promoted}
              onAction={async () => {
                await (onPromote ? onPromote() : demo('StagePipeline: onPromote', 1200))
                setOutcome('promoted')
                announce(copy.announcePromoted)
              }}
            >
              {copy.promote}
            </AsyncButton>
          </div>
        </div>
      </CardFooter>
      {announcer}
    </Card>
  )

  const view = embedded ? (
    <section ref={root} aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-160', className)}>
      {card}
    </section>
  ) : (
    <main
      ref={root}
      aria-labelledby={titleId}
      {...rest}
      className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}
    >
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

/** A running total as m:ss (h:mm:ss past an hour), in mono. */
function clock(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const mm = String(Math.floor((s % 3600) / 60)).padStart(h ? 2 : 1, '0')
  const ss = String(s % 60).padStart(2, '0')
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

export { StagePipeline, type StagePipelineProps, type StagePipelineStage }
export type { StagePipelineCopy, StagePipelineLevel, StagePipelineLine, StagePipelineLog, StagePipelineRun, StagePipelineScript, StagePipelineState }
