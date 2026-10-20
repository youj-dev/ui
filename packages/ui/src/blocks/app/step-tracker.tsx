'use client'

import { useId, useMemo, useRef, useState, type HTMLAttributes, type ReactNode } from 'react'
import { useInView } from 'motion/react'
import { ThemeScope, useLocale, useYouj, type ThemeInput } from '@youj/core'
import { RotateCcwIcon } from '@youj/icons'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { Skeleton } from '../../components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { useAnnouncer } from '../../hooks/use-announcer'
import { cn, dateTimeFormat, numberFormat } from '../../lib/utils'
import { DEFAULT_COPY, demo, ITEMS, STAGES, stageOf, type StepTrackerCopy, type StepTrackerItem, type StepTrackerStage } from './step-tracker/data'
import { detailRows, StepDetail } from './step-tracker/detail'
import { Rail } from './step-tracker/rail'
import { StepSummary } from './step-tracker/summary'
import { useJourney } from './step-tracker/use-journey'

/* The road something takes through a fixed run of stages, replayed live, the
 * way a good carrier page shows a parcel: who it's for and one headline in
 * light type (on its way, done, stopped) with the latest scan under it, the
 * total, the time it took and the attempts beside it, then the road on one
 * hairline, one stop per stage (`stages`: ordered, packed, shipped, through
 * customs, out for delivery and delivered, by default). When the card comes
 * into view the item rides the line scan by scan, and the headline and the
 * scan crossfade as it goes. A stop that needed a second try sends it round a
 * small retry loop and back; one that failed ends the road, and the rest is
 * dashed out. Pick any stop (arrows move along the road) and the strip under
 * the rail, its caret gliding to that stop, shows its place, time and facts.
 * Nothing changes size as it moves: the strip keeps the rows the data needs
 * at most, and times fade into room already kept. Pick another item from the
 * tabs, or replay this one. Swap `items` and `stages` for your own road and
 * the demo wait for your API with `onNotify`; loading, an error with Retry
 * and no items at all keep the card's size. Reduced motion: every road is
 * shown finished, and changes happen in place. It is built for the compact
 * layout density (ui.css), taken from the page; embedded, it keeps its
 * natural width unless `fill`. */

interface StepTrackerProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (768px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<StepTrackerCopy>
  /** Formats numbers and dates (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The stops of the road, in order, each with its name and headline. Every item has one scan per stage. Default: ordered, packed, shipped, customs, out for delivery, delivered. */
  stages?: StepTrackerStage[]
  /** The items to choose from, each with its scans. Default: one delivered on the retry, one straight through, one returned to sender. */
  items?: StepTrackerItem[]
  /** The item shown first, by id. Default: the first. */
  defaultItem?: string
  /** Emails the customer their tracking link; resolve when it's sent. Default: a short demo wait. */
  onNotify?: (item: StepTrackerItem) => Promise<unknown> | unknown
  /** Skeletons in the card's shape while your data loads. Default false. */
  loading?: boolean
  /** Shown in place of the items when they fail to load, with Retry when `onRetry` is set. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** Replaces the message when there are no items. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
}

const DAY = 86_400_000

interface Shell {
  Title: 'h1' | 'h2'
  titleId: string
  embedded: boolean
  fill: boolean
  copy: StepTrackerCopy
}

/** The card around every state: its title, the replay and footer actions it is given, and the body. */
function Frame({ shell, action, footer, children }: { shell: Shell; action: ReactNode; footer: ReactNode; children: ReactNode }) {
  const { Title, titleId, embedded, fill, copy } = shell
  return (
    <Card className={cn('w-full text-fg', !embedded && !fill && 'max-w-3xl')}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription>{copy.subtitle}</CardDescription>
        <CardAction>{action}</CardAction>
      </CardHeader>
      <CardContent>{children}</CardContent>
      <CardFooter className="flex-wrap gap-3">{footer}</CardFooter>
    </Card>
  )
}

/** Loading, error and empty take the room the road does: tabs, summary, rail and strip. */
function Placeholder({ state, copy, error, onRetry, empty }: { state: 'loading' | 'error' | 'empty'; copy: StepTrackerCopy; error?: string; onRetry?: () => void; empty?: ReactNode }) {
  if (state === 'loading')
    return (
      <div className="flex flex-col gap-5" aria-busy>
        <span className="sr-only" role="status">
          {copy.loadingLabel}
        </span>
        <Skeleton className="h-control-sm w-72 max-w-full" />
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 pt-0.5">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-44" />
          </div>
          <div className="flex gap-8">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="relative grid grid-cols-6 pb-1">
            <div aria-hidden className="absolute inset-x-[calc(100%/12)] top-3 border-t border-dashed border-line-strong" />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="relative flex flex-col items-center gap-1.5 pt-1.5">
                <Skeleton className="size-3 rounded-full" />
                <Skeleton className="h-3.5 w-12 max-sm:hidden" />
                <Skeleton className="h-3 w-9 max-sm:hidden" />
              </div>
            ))}
          </div>
          <Skeleton className="h-28 rounded-lg" />
        </div>
      </div>
    )
  const room = 'grid min-h-81.5 place-items-center'
  if (state === 'error')
    return (
      <div className={room}>
        <Alert variant="danger" className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
          {onRetry && (
            <AlertAction>
              <Button size="sm" variant="outline" onClick={onRetry}>
                {copy.retry}
              </Button>
            </AlertAction>
          )}
        </Alert>
      </div>
    )
  return (
    <div className="grid min-h-81.5">
      {empty ?? (
        <Empty className="rounded-lg border border-dashed border-line">
          <EmptyHeader>
            <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
            <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )
}

function StepTracker({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  locale,
  stages = STAGES,
  items = ITEMS,
  defaultItem,
  onNotify,
  loading = false,
  error,
  onRetry,
  empty,
  className,
  ...rest
}: StepTrackerProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const titleId = useId()
  const shell: Shell = { Title: embedded ? 'h2' : 'h1', titleId, embedded, fill, copy }
  const state = loading ? 'loading' : error ? 'error' : items.length === 0 ? 'empty' : null

  const card = state ? (
    <Frame
      shell={shell}
      action={
        <Button variant="ghost" size="sm" disabled>
          <RotateCcwIcon size={14} />
          {copy.replay}
        </Button>
      }
      footer={
        <>
          <div className="me-auto min-w-0 text-ui-sm text-fg-muted">{state === 'loading' ? <Skeleton className="h-4 w-48" /> : <span className="text-fg-subtle">—</span>}</div>
          <Button variant="ghost" size="sm" disabled>
            {copy.handlerSite}
          </Button>
          <Button variant="outline" size="sm" disabled>
            {copy.notify}
          </Button>
        </>
      }
    >
      <Placeholder state={state} copy={copy} error={error} onRetry={onRetry} empty={empty} />
    </Frame>
  ) : (
    <Live shell={shell} stages={stages} items={items} defaultItem={defaultItem} onNotify={onNotify} />
  )

  const page = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-3xl', className)}>
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
  return theme ? <ThemeScope theme={theme}>{page}</ThemeScope> : page
}

function Live({ shell, stages, items, defaultItem, onNotify }: { shell: Shell; stages: StepTrackerStage[]; items: StepTrackerItem[]; defaultItem?: string; onNotify?: StepTrackerProps['onNotify'] }) {
  const { copy } = shell
  const k = useYouj()
  const detailId = useId()
  const { announce, announcer } = useAnnouncer()
  const [current, setCurrent] = useState(defaultItem ?? items[0]?.id ?? '')
  const item = items.find((s) => s.id === current) ?? items[0]!
  const [run, setRun] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const area = useRef<HTMLDivElement>(null)
  const seen = useInView(area, { once: true, amount: 0.35 })

  const rows = useMemo(() => detailRows(items), [items])
  const format = useMemo(() => {
    const money = numberFormat(copy.locale, { style: 'currency', currency: item.currency })
    const days = numberFormat(copy.locale, { style: 'unit', unit: 'day', unitDisplay: 'long' })
    // On the rail, a weekday and a time: what a tracking page shows at a glance.
    const scan = dateTimeFormat(copy.locale, { weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'UTC' })
    const stamp = dateTimeFormat(copy.locale, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZone: 'UTC',
      timeZoneName: 'short',
    })
    const start = Date.parse(item.created)
    return {
      money: (amount: number) => money.format(amount),
      days: (ms: number) => days.format(Math.round(ms / DAY)),
      scan: (msAfter: number) => scan.format(start + msAfter),
      when: (msAfter: number) => stamp.format(start + msAfter),
    }
  }, [copy.locale, item.created, item.currency])

  const stopped = item.scans.find((s) => s.outcome === 'failed')
  const outcome = () =>
    stopped ? copy.stopped(stageOf(stages, stopped.id).label, item.stopReason ?? '') : copy.completed(item.scans.at(-1)?.place ?? item.place)
  const view = useJourney(item, run, seen, {
    missed: (attempt) => announce(copy.attemptFailed(attempt.code.replace(/_/g, ' '))),
    retried: (attempts) => announce(copy.completedOnRetry(attempts)),
    returned: () => announce(outcome()),
    finished: () => {
      if (!stopped) announce(outcome())
    },
  })
  // The detail follows the item along the rail until someone picks a stage.
  const selected = picked ?? view.at

  // An attempt that failed before the retry: the stage shows that try, not how it ended.
  const missAt = (i: number) => (view.states[i] === 'failed' && item.scans[i]!.outcome === 'ok' ? item.scans[i]!.attempts?.find((a) => !a.ok) : undefined)
  const figure = (i: number) => (missAt(i) ? copy.missedNote : (item.scans[i]!.place ?? ''))
  const time = (i: number) => format.scan(missAt(i)?.at ?? item.scans[i]!.at)

  const replay = () => {
    setPicked(null)
    setRun((r) => r + 1)
    if (k.reduced) announce(outcome())
  }
  const choose = (id: string) => {
    setCurrent(id)
    setPicked(null)
  }

  return (
    <Frame
      shell={shell}
      action={
        <Button variant="ghost" size="sm" aria-label={copy.replayLabel(item.ref)} onClick={replay}>
          <RotateCcwIcon size={14} />
          {copy.replay}
        </Button>
      }
      footer={
        <>
          {/* A div, not a status line: the handler and reference read as text in every look. */}
          <div className="me-auto min-w-0 truncate text-ui-sm text-fg-muted tabular-nums">
            {item.handler} · {item.id}
          </div>
          <Button variant="ghost" size="sm">
            {copy.handlerSite}
          </Button>
          <AsyncButton variant="outline" size="sm" disabled={item.outcome === 'stopped'} onAction={() => (onNotify ? onNotify(item) : demo('StepTracker: onNotify', 900))} pendingLabel={copy.notifying}>
            {copy.notify}
          </AsyncButton>
        </>
      }
    >
      <div ref={area}>
        <Tabs value={item.id} onValueChange={(value) => choose(String(value))}>
          <TabsList aria-label={copy.items} className="max-w-full">
            {items.map((s) => (
              <TabsTrigger key={s.id} value={s.id} className="gap-2">
                <span aria-hidden className={cn('size-1.5 shrink-0 rounded-full', s.outcome === 'stopped' ? 'bg-danger' : 'bg-success')} />
                <bdi className="tabular-nums">
                  <span aria-hidden className="text-fg-subtle">
                    #
                  </span>
                  {s.ref}
                </bdi>
                {/* A place, not a label: it keeps its case and face in a theme that sets tabs in capitals. */}
                <span className="font-sans font-normal tracking-normal normal-case text-fg-muted max-sm:hidden">{s.place}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          {items.map((s) => (
            <TabsContent key={s.id} value={s.id} className="@container/track flex flex-col gap-5 pt-5">
              {/* Only the chosen item's panel has content, so a panel on its way out never doubles the road. */}
              {s.id === item.id && (
                <>
                  <StepSummary item={item} stages={stages} view={view} copy={copy} format={format} />
                  <div className="flex flex-col gap-2">
                    <Rail item={item} stages={stages} view={view} selected={selected} onSelect={setPicked} copy={copy} time={time} figure={figure} controls={detailId} />
                    <StepDetail id={detailId} item={item} stages={stages} index={selected} state={view.states[selected] ?? 'pending'} copy={copy} when={format.when} rows={rows} />
                  </div>
                </>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
      {announcer}
    </Frame>
  )
}

export { StepTracker, type StepTrackerProps }
