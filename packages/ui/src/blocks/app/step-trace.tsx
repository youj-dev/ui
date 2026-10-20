'use client'

import { useEffect, useId, useMemo, useRef, useState, type ComponentProps } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { CopyIcon, DownloadIcon, MoreHorizontalIcon, RotateCcwIcon } from '@youj/icons'
import { Badge, BadgeDot } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu'
import { FlowGraph, type FlowNode } from '../../components/ui/flow-graph'
import { Eyebrow } from '../../components/ui/typography'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useVisible } from '../../hooks/use-visible'
import { cn, numberFormat } from '../../lib/utils'
import { attemptAt, DEFAULT_COPY, KINDS, progressAt, RUN, schedule, START, statusAt, STEPS, demo, type StepTraceCopy, type StepTraceKind, type StepTraceRun, type StepTraceStep } from './step-trace/data'
import { StepDetail } from './step-trace/step-detail'

/* One run of an agent, as the graph of what it did: each tool call and model
 * call a step on a FlowGraph, laid out along what waits on what, lit by its
 * state as the run goes (the steps that can run in parallel do). Over it,
 * the run's state and four figures that count up with it: steps, elapsed,
 * tokens and cost. Pick a step and its detail opens under the graph: its
 * state, duration, tokens and cost in mono, the retry it needed, and what
 * went in and what came out as code, the draft streaming in while it's
 * written. One tool fails here (no preview to screenshot), so the step that
 * needed it is skipped and the rest carry on; the translation is left out by
 * the run's settings. When the run completes, Approve and publish releases
 * the draft. The run is a schedule played on a clock (`schedule`, `statusAt`):
 * swap it for your tracer's spans. It is built for the compact layout density
 * (ui.css), taken from the page; embedded too, it stops at its natural width
 * unless `fill`. Reduced motion: the graph and the figures
 * change in place, without the pulse or the flowing dashes. */

interface StepTraceProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2` (the open step an `h3`), without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (1152px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<StepTraceCopy>
  /** What ran and where, over the steps. */
  run?: StepTraceRun
  /** The kinds of step, with their labels, in the order they're listed. Default: LLM and tool. */
  kinds?: StepTraceKind[]
  /** Writes the run's figures. `size`: an amount a step handled (default compact counts in the summary, whole numbers in a step); `duration`: a time in milliseconds (default seconds to a tenth); `cost`: the step's cost (default US dollars). */
  format?: { size?: (value: number) => string; duration?: (ms: number) => string; cost?: (value: number) => string }
  /** Your run's steps, each after the steps it waits on, shown as given (re-render as the run moves). Default: a release-notes agent's eleven, replayed as a demo. */
  steps?: StepTraceStep[]
  /** Where the clock stands, in seconds into the run. Default: part-way through the demo's draft; with your `steps`, the end of the run. */
  start?: number
  /** The step open at first; `null` for none. Default: the draft. */
  defaultOpen?: string | null
  /** Play the demo run on (your `steps` don't play). Default true. */
  live?: boolean
  /** Shows a dashed "Demo data" badge while the card replays its demo run (no `steps` passed). Default true. */
  demoMarker?: boolean
  /** Publishes the draft; resolve when it's out. Default: a short demo wait. */
  onApprove?: () => Promise<unknown> | unknown
  /** Formats the run's figures and names (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** Classes for its parts: `detail` is the room under the graph the open step scrolls in (its height, 426px at 100%, holds the card's size as steps open, close and stream). */
  classNames?: { detail?: string }
}

/** The demo clock's tick, in milliseconds; the run plays in real time. */
const TICK = 250

function StepTrace({ theme, embedded = true, fill = false, copy: copyProp, run = RUN, kinds = KINDS, format, steps: ownSteps, start: startProp, defaultOpen = 'draft', live = true, onApprove, demoMarker = true, locale, classNames, className, ...rest }: StepTraceProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const titleId = useId()
  const detailId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const SectionTitle = embedded ? 'h3' : 'h2'
  const { announce, announcer } = useAnnouncer()
  // Without your steps it replays the demo run, marked as such; yours show as given.
  const simulated = ownSteps === undefined
  const steps = ownSteps ?? STEPS
  const plan = useMemo(() => schedule(steps), [steps])
  const end = Math.max(0, ...[...plan.values()].map((p) => p.end))
  const start = startProp ?? (simulated ? START : end)
  const [t, setT] = useState(start)
  // Your run's clock is the one you pass.
  if (!simulated && t !== start) setT(start)
  const root = useRef<HTMLElement>(null)
  const visible = useVisible(root)
  const [open, setOpen] = useState<string | null>(defaultOpen)
  const [published, setPublished] = useState(false)
  const done = t >= end

  useEffect(() => {
    if (!simulated || !live || done || !visible) return
    let last = performance.now()
    const id = setInterval(() => {
      const now = performance.now()
      const step = (now - last) / 1000
      last = now
      setT((v) => Math.min(end, v + step))
    }, TICK)
    return () => clearInterval(id)
  }, [simulated, live, done, end, visible])

  const statuses = new Map(steps.map((s) => [s.id, statusAt(plan.get(s.id)!, s, t)]))
  // Say what fails, and when the run is through, as it happens.
  const said = useRef(new Set<string>())
  useEffect(() => {
    for (const s of steps)
      if (statuses.get(s.id) === 'error' && !said.current.has(s.id)) {
        said.current.add(s.id)
        if (t > start) announce(copy.announceFailed(s.label))
      }
    if (done && !said.current.has('done') && t > start) {
      said.current.add('done')
      announce(copy.announceDone(steps.filter((s) => statuses.get(s.id) === 'error').length))
    }
  })

  const secondsFormat = numberFormat(copy.locale, { style: 'unit', unit: 'second', unitDisplay: 'narrow', minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const seconds = { format: (s: number) => (format?.duration ? format.duration(s * 1000) : secondsFormat.format(s)) }
  const compact = numberFormat(copy.locale, { notation: 'compact', maximumFractionDigits: 1 })
  const dollars = numberFormat(copy.locale, { style: 'currency', currency: 'USD', minimumFractionDigits: 3, maximumFractionDigits: 3 })
  const count = numberFormat(copy.locale)

  const kindOf = (id: string) => kinds.find((k) => k.id === id)
  const nodes: FlowNode[] = steps.map((s) => {
    const p = plan.get(s.id)!
    const status = statuses.get(s.id)!
    const meta = status === 'running' ? seconds.format(t - p.start) : status === 'ok' || status === 'retried' ? seconds.format(p.end - p.start) : status === 'error' ? s.error?.split(':')[0] : undefined
    return { id: s.id, label: s.label, kind: kindOf(s.kind)?.label ?? s.kind, status, meta, attempts: attemptAt(p, t) }
  })
  const edges = steps.flatMap((s) => s.after.map((from) => ({ from, to: s.id })))

  // The run's figures, counting up with the steps: a model call adds its tokens and cost as it streams.
  const finished = steps.filter((s) => !['queued', 'running'].includes(statuses.get(s.id)!)).length
  const spent = steps.reduce(
    (sum, s) => {
      const p = plan.get(s.id)!
      const status = statuses.get(s.id)!
      if (status === 'queued' || status === 'skipped') return sum
      const f = status === 'running' ? progressAt(p, t) : 1
      return { size: sum.size + (s.size ? s.size.input + s.size.output * f : 0), cost: sum.cost + (s.cost ?? 0) * f }
    },
    { size: 0, cost: 0 },
  )
  const failures = steps.filter((s) => statuses.get(s.id) === 'error')
  const state = done ? 'done' : 'running'
  const figures = [
    { label: copy.steps, value: copy.stepsOf(finished, steps.length) },
    { label: copy.elapsed, value: seconds.format(Math.min(t, end)) },
    { label: copy.size, value: (format?.size ?? compact.format)(Math.round(spent.size)) },
    { label: copy.cost, value: (format?.cost ?? dollars.format)(spent.cost) },
  ]
  const openStep = steps.find((s) => s.id === open)
  const names = new Intl.ListFormat(copy.locale, { type: 'conjunction' })

  const card = (
    <Card className={cn('w-full text-fg', !embedded && !fill && 'max-w-288')}>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Title id={titleId}>{copy.title}</Title>
          {simulated && demoMarker && (
            <Badge variant="outline" data-slot="demo-marker" className="border-dashed border-line-strong">
              {copy.demoData}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>{copy.subtitle(run.name, run.id)}</CardDescription>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={copy.more} />}>
              <MoreHorizontalIcon size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={async () => {
                  await navigator.clipboard?.writeText(run.id)
                  announce(copy.copied)
                }}
              >
                <CopyIcon size={14} /> {copy.copyId}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <DownloadIcon size={14} /> {copy.download}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
          <Badge variant={state === 'done' ? (failures.length ? 'warning' : 'success') : 'default'}>
            <BadgeDot />
            {copy.state[state]}
          </Badge>
          <p className="min-w-0 flex-1 basis-60 text-ui-lg text-fg">{run.task}</p>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          {figures.map((f, i) => (
            <div key={f.label} className={cn('flex min-w-0 flex-col gap-1', i % 2 === 1 && 'border-s border-line ps-4 sm:border-s-0 sm:ps-0', i > 0 && 'sm:border-s sm:border-line sm:ps-4')}>
              <Eyebrow render={<dt />} className="truncate">
                {f.label}
              </Eyebrow>
              <dd className="truncate font-mono text-xl font-medium tracking-tight text-fg tabular-nums">{f.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>

      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <Eyebrow>{copy.graph}</Eyebrow>
          {failures.length > 0 && (
            <Eyebrow className="text-danger-text tabular-nums">
              {copy.failed} · {count.format(failures.length)}
            </Eyebrow>
          )}
        </div>
        <FlowGraph nodes={nodes} edges={edges} value={open} onValueChange={setOpen} controls={detailId} label={copy.graph} locale={copy.locale} />
        {/* The open step has a room of its own: opening, switching and a draft streaming in never resize the card. */}
        <div className={cn('yj-scrollbar -mx-1 h-106.5 overflow-y-auto px-1 pt-2', classNames?.detail)}>
          {openStep ? (
            <StepDetail
              id={detailId}
              step={openStep}
              plan={plan.get(openStep.id)!}
              status={statuses.get(openStep.id)!}
              t={t}
              waitingOn={names.format(openStep.after.map((id) => steps.find((s) => s.id === id)?.label ?? id))}
              copy={copy}
              kind={kindOf(openStep.kind)}
              format={format}
              SectionTitle={SectionTitle}
              onClose={() => setOpen(null)}
            />
          ) : (
            <p className="flex h-full items-center justify-center rounded-xl border border-dashed border-line px-4 text-center text-ui-sm text-fg-muted">
              {copy.graphHint}
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex-wrap">
        <span className="me-auto min-w-0 truncate">{copy.footer(run.method, run.place)}</span>
        <div className="flex gap-2">
          {simulated && (
            <Button
              variant="secondary"
              onClick={() => {
                said.current.clear()
                setPublished(false)
                setT(0)
              }}
            >
              <RotateCcwIcon size={14} />
              {copy.replay}
            </Button>
          )}
          <AsyncButton
            disabled={!done || published}
            pendingLabel={copy.approving}
            successLabel={copy.approved}
            onAction={async () => {
              await (onApprove ? onApprove() : demo('StepTrace: onApprove', 900))
              setPublished(true)
              announce(copy.announcePublished)
            }}
          >
            {copy.approve}
          </AsyncButton>
        </div>
      </CardFooter>
      {announcer}
    </Card>
  )

  const view = embedded ? (
    <section ref={root} aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-288', className)}>
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

export { StepTrace, type StepTraceProps }
export type { StepTraceCopy, StepTraceKind, StepTraceRun, StepTraceStep }
