'use client'

import { type ComponentProps, type ReactNode, useEffect, useId, useState } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { MoreHorizontalIcon } from '@youj/icons'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { Badge, BadgeDot } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu'
import { LaneMeter, type Lane } from '../../components/ui/lane-meter'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { Skeleton } from '../../components/ui/skeleton'
import { Eyebrow } from '../../components/ui/typography'
import { useAnnouncer } from '../../hooks/use-announcer'
import { cn, numberFormat } from '../../lib/utils'
import { DEFAULT_COPY, QUEUES, SLOTS_PER_WORKER, demo, type QueueMonitorCopy, type QueueMonitorItem, type QueueMonitorQueue } from './queue-monitor/data'
import { Throughput } from './queue-monitor/throughput'
import { useLiveQueue } from './queue-monitor/use-live-queue'

/* A queue as an instrument card. A segmented track picks the queue; its
 * throughput leads (jobs a minute, in mono, with the half hour's trace in a
 * well and two waits as ruled rows), then its load as a LaneMeter: the
 * backlog against the queue's size, the busy slots against the workers'
 * (with a light traveling across them while the queue runs), each failed
 * job as a cell you can retry on its own, and the hour's finished jobs.
 * Retrying moves jobs back into the backlog: the failed cell shrinks out, the
 * rest glide over and the backlog's edge steps on. Switching queues sweeps
 * every lane to the new values. Pause stops the queue (the status line starts
 * counting); Scale workers adds a worker's slots through Button onAction.
 * Without `queues` the demo's drift once a second under a "Demo data"
 * badge; pass yours (and the callbacks) from your API and they show as given.
 * Loading, an error with Retry and an empty list take the figures' place at
 * their size. It is built for the compact layout density (ui.css), taken from the page;
 * embedded, it sits at the elevation of the cards beside it and stops at its
 * natural width unless `fill`. Reduced motion: every value is drawn in place. */

interface QueueMonitorProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (640px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<QueueMonitorCopy>
  /** Every queue's figures now, in the tabs' order; re-render with fresh ones to keep it live. Default: four demo queues that drift on their own. */
  queues?: QueueMonitorQueue[]
  /** The id of the queue shown first. Default: the first one. */
  defaultQueue?: string
  /** Drift the demo queues' figures once a second, as a live queue would (your `queues` never drift). Default true. */
  live?: boolean
  /** Retries failed jobs (one, or all of them). Default: nothing to call; the jobs move back to the backlog. */
  onRetryFailed?: (items: QueueMonitorItem[], queue: string) => unknown
  /** Adds a worker; resolve when it's serving. Default: a short demo wait. */
  onScale?: (queue: string, workers: number) => Promise<unknown> | unknown
  /** Shows a dashed "Demo data" badge while the card runs on its demo queues (no `queues` passed). Default true. */
  demoMarker?: boolean
  /** Formats its numbers and dates (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** Writes the figures. `count`: Intl.NumberFormat options for the lanes' values (default plain compact counts); `rate`: the throughput's number; `age`: a wait or age given in seconds, and the time since the queue last moved. Default: the locale's number and seconds. */
  format?: { count?: Intl.NumberFormatOptions; rate?: (n: number) => string; age?: (seconds: number) => string }
  /** Skeletons in place of the figures while your queues load. Default false. */
  loading?: boolean
  /** Shown in place of the figures when they fail to load, with Retry when `onRetry` is set. */
  error?: string
  /** Loads the queues again after an `error`. */
  onRetry?: () => void
  /** Replaces the message when `queues` is empty. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
}

function QueueMonitor({ theme, embedded = true, fill = false, copy: copyProp, queues: queuesProp, defaultQueue, live = true, onRetryFailed, onScale, demoMarker = true, locale, format, loading = false, error, onRetry, empty, className, ...rest }: QueueMonitorProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const { announce, announcer } = useAnnouncer()
  const [picked, setQueueId] = useState(defaultQueue)
  const [paused, setPaused] = useState(false)
  // Without your queues it runs the demo's, drifting and marked as such; yours show as given.
  const simulated = queuesProp === undefined
  const all = queuesProp ?? QUEUES
  const queueId = all.some((q) => q.id === picked) ? picked! : (all[0]?.id ?? '')
  const [shown, update] = useLiveQueue(all, queueId, simulated && live && !paused)
  // Nothing to read while loading, after an error or with no queues.
  const queue = loading || error ? undefined : shown
  const state = loading ? 'loading' : error ? 'error' : !shown ? 'empty' : 'ready'
  // Seconds since the queue last moved: counted while it's paused.
  const [idle, setIdle] = useState(0)
  useEffect(() => {
    if (!paused) return
    const timer = setInterval(() => setIdle((s) => s + 1), 1000)
    return () => clearInterval(timer)
  }, [paused])

  const slots = queue ? queue.workers * (queue.slotsPerWorker ?? SLOTS_PER_WORKER) : 0
  const ago = format?.age ? format.age(idle) : numberFormat(copy.locale, { style: 'unit', unit: 'second', unitDisplay: 'narrow' }).format(idle)
  const [before, after = ''] = copy.updated.split('{ago}')
  const togglePause = () => {
    setIdle(0)
    setPaused((p) => !p)
  }
  const retry = (jobs: QueueMonitorItem[]) => {
    if (!jobs.length || !queue) return
    const ids = new Set(jobs.map((j) => j.id))
    update((q) => ({ ...q, failed: q.failed.filter((j) => !ids.has(j.id)), queued: Math.min(q.capacity, q.queued + jobs.length) }))
    announce(jobs.length === 1 ? copy.retrying(jobs[0]!.id) : copy.retryingAll(jobs.length))
    onRetryFailed?.(jobs, queueId)
  }

  const lanes: Lane[] = queue
    ? [
        { id: 'queued', label: copy.queued, value: queue.queued, max: queue.capacity, tone: queue.queued >= queue.capacity * 0.9 ? 'warning' : 'neutral' },
        { id: 'running', label: copy.running, value: queue.running, max: slots, tone: 'accent', active: !paused },
        {
          id: 'failed',
          label: copy.failed,
          value: queue.failed.length,
          tone: 'danger',
          items: queue.failed.map((job) => ({ id: job.id, label: job.id, detail: job.error })),
          action: (
            <Button size="xs" variant="secondary" disabled={queue.failed.length === 0} onClick={() => retry(queue.failed)}>
              {copy.retryAll}
            </Button>
          ),
        },
        { id: 'done', label: copy.done, value: queue.done, max: queue.target, tone: 'success' },
      ]
    : []

  // The figures' room when there are none to show: the lanes' own rows, so the card keeps its size.
  const placeholder = (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-x-4 gap-y-4 pb-0.5 @min-[30rem]:grid-cols-[auto_minmax(0,1fr)_auto]">
      {[copy.queued, copy.running, copy.failed, copy.done].map((label, i) => (
        <div key={i} className="grid items-center gap-x-3 gap-y-2 @min-[30rem]:col-span-full @min-[30rem]:grid-cols-subgrid">
          <span className="truncate text-ui-sm text-fg-muted font-(family-name:--yj-label-font) tracking-(--yj-label-tracking) [text-transform:var(--yj-label-case)]">{label}</span>
          <Skeleton className="h-2.5 w-full" />
          <span className="justify-self-end text-ui-lg">
            <Skeleton className="h-5 w-14" />
          </span>
        </div>
      ))}
    </div>
  )
  const lanesView =
    state === 'loading' ? (
      <div className="@container/lane-meter">
        <span className="sr-only">{copy.loadingLabel}</span>
        {placeholder}
      </div>
    ) : state === 'error' || state === 'empty' ? (
      <div className="@container/lane-meter grid">
        <div aria-hidden className="invisible col-start-1 row-start-1">
          {placeholder}
        </div>
        <div className="col-start-1 row-start-1 grid content-center">
          {state === 'error' ? (
            <Alert variant="danger">
              <AlertDescription>{error}</AlertDescription>
              {onRetry && (
                <AlertAction>
                  <Button size="sm" variant="outline" onClick={onRetry}>
                    {copy.retry}
                  </Button>
                </AlertAction>
              )}
            </Alert>
          ) : (
            (empty ?? (
              <Empty className="rounded-lg border border-dashed border-line">
                <EmptyHeader>
                  <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
                  <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ))
          )}
        </div>
      </div>
    ) : (
      <LaneMeter
        label={copy.load}
        lanes={lanes}
        locale={copy.locale}
        format={format?.count ?? { notation: 'compact', maximumFractionDigits: 1 }}
        itemActionLabel={copy.retry}
        onItemAction={(item) => retry(queue!.failed.filter((j) => j.id === item.id))}
      />
    )

  const card = (
    <Card className={cn('w-full text-fg', !embedded && !fill && 'max-w-160', !embedded && 'shadow-lg')}>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Title id={titleId}>{copy.title}</Title>
          {simulated && demoMarker && (
            <Badge variant="outline" data-slot="demo-marker" className="border-dashed border-line-strong">
              {copy.demoData}
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="tabular-nums">
          {queue ? copy.subtitle(queue.label, queue.workers) : loading ? <Skeleton className="inline-block h-4 w-32 align-middle" /> : <span className="text-fg-subtle">—</span>}
        </CardDescription>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={copy.more} disabled={!queue} />}>
              <MoreHorizontalIcon size={15} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={togglePause}>{paused ? copy.resumeQueue : copy.pauseQueue}</DropdownMenuItem>
              <DropdownMenuItem
                disabled={!queue || queue.queued === 0}
                onClick={() => {
                  update((q) => ({ ...q, queued: 0 }))
                  announce(copy.drained)
                }}
              >
                {copy.drain}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <Eyebrow>{copy.queue}</Eyebrow>
          <Badge variant={paused ? 'secondary' : 'success'} data-state={paused ? 'paused' : 'live'}>
            <BadgeDot />
            {paused ? copy.paused : copy.live}
          </Badge>
        </div>
        {queue ? (
          <SegmentedControl aria-label={copy.queue} value={queueId} onValueChange={(next) => setQueueId(next)} className="w-full">
            {all.map((q) => (
              // shape: tabs that share a narrow phone row trim their padding; the control's own padding or case sits on a more specific selector than a className, so `!` wins; kept because moving it into the recipe layer must not change what shows
              <SegmentedControlItem key={q.id} value={q.id} className="min-w-0 flex-1 font-mono max-sm:px-1.5! max-sm:text-ui-sm">
                <span className="truncate">{q.label}</span>
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        ) : (
          <div aria-hidden className="flex w-full gap-1 rounded-lg bg-band p-0.5">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className={cn('h-8 flex-1', !loading && 'opacity-0')} />
            ))}
          </div>
        )}
      </CardContent>

      <CardContent>
        <Throughput queue={queue} loading={loading} copy={copy} format={format} />
      </CardContent>

      <CardContent>{lanesView}</CardContent>

      <CardFooter className="flex-wrap">
        <p aria-live="off" className="text-ui-sm text-fg-muted tabular-nums">
          {paused ? (
            <>
              {before}
              <span className="normal-case">{ago}</span>
              {after}
            </>
          ) : (
            copy.justNow
          )}
        </p>
        <div className="ms-auto flex gap-2">
          <Button variant="secondary" onClick={togglePause} disabled={!queue}>
            {paused ? copy.resume : copy.pause}
          </Button>
          <AsyncButton
            disabled={!queue}
            pendingLabel={copy.scaling}
            successLabel={copy.scaled}
            onAction={async () => {
              if (!queue) return
              const workers = queue.workers + 1
              await (onScale ? onScale(queueId, workers) : demo('QueueMonitor: onScale', 900))
              update((q) => ({ ...q, workers: q.workers + 1 }))
              announce(copy.scaledTo(workers))
            }}
          >
            {copy.scale}
          </AsyncButton>
        </div>
      </CardFooter>
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-160', className)}>
      {card}
      {announcer}
    </section>
  ) : (
    <main aria-labelledby={titleId} {...rest} className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}>
      {card}
      {announcer}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { QueueMonitor, type QueueMonitorProps }
export type { QueueMonitorCopy, QueueMonitorItem, QueueMonitorQueue }
