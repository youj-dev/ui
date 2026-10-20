'use client'

import { useId, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { AsyncButton } from '../../components/ui/async-button'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { Skeleton } from '../../components/ui/skeleton'
import { useAnnouncer } from '../../hooks/use-announcer'
import { cn, numberFormat } from '../../lib/utils'
import { DEFAULT_COPY, PROGRESS, STOPS, demo, type LoopRouteCopy } from './loop-route/data'
import { stopStates, type LoopRouteStop, type LoopRouteStopState } from './loop-route/loop'
import { RouteMap } from './loop-route/map'

/* A vehicle's loop through its stops. The map draws the route as a loop with
 * the stops on it: done in success, the next one ringed in the accent, the
 * rest hollow, and the vehicle as a disc with a slow ring where it is now.
 * In the middle, which loop this is, what is on board and the next
 * stop with its time. Under it the stops still to come, each with what it
 * gets and when the vehicle arrives. Skip stop leaves the next one out of
 * this loop; Rush delivery sends the vehicle straight there. Loading, an
 * error with Retry and a loop with no stops take the map's place at its size. The map is
 * decorative: the list says every stop. Reduced motion: the ring holds still.
 * It is built for the compact layout density (ui.css), taken from the page;
 * embedded too, it stops at its natural width unless `fill`. */

interface LoopRouteProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (384px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<LoopRouteCopy>
  /** Formats its numbers (BCP 47). Default: the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The stops on the loop, in any order: their `position` places them. */
  stops?: LoopRouteStop[]
  /** How far round the loop the vehicle is, 0–1: stops at or behind it are done. */
  progress?: number
  /** Which loop it is on, "3 of 8". Default 3 of 8; `null` hides it. */
  loop?: { number: number; of: number } | null
  /** How long a full loop takes, in minutes unless `format.time` says otherwise. Default 18. */
  loopTime?: number
  /** Called by Skip stop, with the stop left out of this loop. */
  onSkip?: (stop: LoopRouteStop) => void
  /** Called by Rush delivery with the next stop; resolve when the vehicle is on its way. Default: a short demo wait. */
  onRush?: (stop: LoopRouteStop) => Promise<unknown> | unknown
  /** How its times read. `time` formats minutes (default: the locale's number and "min"). */
  format?: { time?: (minutes: number) => string }
  /** Skeletons in place of the map and the list while your data loads. Default false. */
  loading?: boolean
  /** Shown in place of the map when it fails to load, with Retry when `onRetry` is set. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** Replaces the message when there are no stops. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
}

function LoopRoute({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  locale: localeProp,
  stops = STOPS,
  progress = PROGRESS,
  loop = { number: 3, of: 8 },
  loopTime = 18,
  onSkip,
  onRush,
  format,
  loading = false,
  error,
  onRetry,
  empty,
  className,
  ...rest
}: LoopRouteProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const SectionTitle = embedded ? 'h3' : 'h2'
  const { announce, announcer } = useAnnouncer()
  const count = numberFormat(locale)
  const formatTime = format?.time ?? ((n: number) => copy.minutes(count.format(n)))
  const [skipped, setSkipped] = useState<ReadonlySet<string>>(new Set())
  const [rushed, setRushed] = useState<string | null>(null)

  const states = stopStates(stops, progress, skipped)
  const ahead = [...stops].sort((a, b) => a.position - b.position).filter((s) => states.get(s.id) === 'next' || states.get(s.id) === 'upcoming')
  const next = ahead[0]
  const done = stops.filter((s) => states.get(s.id) === 'done').length
  const aboard = ahead.reduce((sum, s) => sum + s.cargo, 0)
  const rushing = next !== undefined && rushed === next.id
  const noFigures = loading || !!error || stops.length === 0
  // The map's room: the same shape it draws in, so the card keeps its size.
  const frame = 'aspect-[370/180] w-full'

  const rush = async () => {
    if (!next) return
    await (onRush ? onRush(next) : demo('LoopRoute: onRush', 1000))
    setRushed(next.id)
    announce(copy.announceRushed(next.name))
  }

  const card = (
    <Card data-slot="loop-route" className={cn('w-full gap-0 overflow-hidden py-0 text-fg', !embedded && !fill && 'max-w-sm')}>
      <CardHeader className="py-(--card-spacing)">
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription className="tabular-nums">{copy.subtitle(copy.vehicle, formatTime(loopTime))}</CardDescription>
        <CardAction>
          {/* A sentence, not a label: it keeps its case in a theme that sets badges in capitals. */}
          {loading ? (
            <Skeleton className="h-6 w-20" />
          ) : (
            !noFigures && (
              <Badge variant={rushing ? 'warning' : 'success'} size="lg" className="font-sans text-ui tracking-normal normal-case">
                {rushing ? copy.rushing : copy.onRoute}
              </Badge>
            )
          )}
        </CardAction>
      </CardHeader>

      <div className="border-t border-line px-(--ui--panel-x) py-(--ui--panel-y)">
        {loading ? (
          <div className={cn(frame, 'relative')}>
            <span className="sr-only">{copy.loadingLabel}</span>
            {/* The track: a Skeleton ring as thick and as large as the loop's own, its middle cut out. */}
            <Skeleton className="absolute top-[13.61%] start-[12.57%] h-[72.78%] w-[74.86%] rounded-[14.98%/31.7%]" />
            <div aria-hidden className="absolute top-[17.5%] start-[14.46%] h-[65%] w-[71.08%] rounded-[13.1%/29.5%] bg-surface" />
          </div>
        ) : error ? (
          <div className={cn(frame, 'grid place-items-center')}>
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
          </div>
        ) : stops.length === 0 ? (
          <div className={cn(frame, 'grid')}>
            {empty ?? (
              <Empty className="rounded-lg border border-dashed border-line">
                <EmptyHeader>
                  <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
                  <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </div>
        ) : (
          <RouteMap stops={stops} states={states} progress={progress} label={copy.mapLabel(done, stops.length, aboard)}>
            <div className="flex flex-col items-center gap-1 text-center">
              {loop && <span className="text-ui-sm text-fg-muted tabular-nums">{copy.loop(loop.number, loop.of)}</span>}
              <span className="text-ui font-medium tabular-nums">{copy.onBoard(count.format(aboard), aboard)}</span>
              {next && <span className="mt-1 rounded-chip bg-accent-subtle px-2.5 py-0.5 text-ui font-medium text-accent-text tabular-nums">{copy.nextTag(next.name, formatTime(next.eta))}</span>}
            </div>
          </RouteMap>
        )}
      </div>

      <section aria-labelledby={`${titleId}-next`} className="flex flex-col gap-1 border-t border-line px-(--ui--panel-x) pt-(--ui--panel-head-y) pb-(--ui--panel-y)">
        <SectionTitle id={`${titleId}-next`} className="text-ui-sm font-normal text-fg-muted">
          {copy.upNext}
        </SectionTitle>
        {/* Room for three stops whatever is left: skipping never resizes the card. */}
        <ul className="-mx-2 flex h-33 flex-col overflow-y-auto yj-scrollbar">
          {loading &&
            [0, 1, 2].map((i) => (
              <li key={i} className="flex items-center gap-3 px-2 py-2">
                <Skeleton className="size-2 shrink-0 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-14" />
              </li>
            ))}
          {!noFigures && ahead.length === 0 && <li className="px-2 py-2 text-ui text-fg-muted">{copy.none}</li>}
          {(noFigures ? [] : ahead).map((stop, i) => (
            <li key={stop.id} className={cn('flex items-center gap-3 rounded-surface px-2 py-2 text-ui', i === 0 && 'bg-selected')}>
              <span aria-hidden className={cn('size-2 shrink-0 rounded-full border', i === 0 ? 'border-accent bg-accent' : 'border-fg-subtle')} />
              <span className="min-w-0 flex-1 truncate font-medium">
                {stop.name}
                <span className="sr-only">, {i === 0 ? copy.state.next : copy.state.upcoming}</span>
              </span>
              <span className="text-fg-muted tabular-nums">{copy.cargo(count.format(stop.cargo), stop.cargo)}</span>
              <span className={cn('w-14 text-end tabular-nums', i === 0 ? 'font-medium text-accent-text' : 'text-fg-muted')}>
                {i === 0 && rushing ? copy.rush : copy.eta(formatTime(stop.eta))}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="flex gap-3 border-t border-line px-(--ui--panel-x) py-(--ui--panel-foot-y)">
        <Button
          variant="secondary"
          className="flex-1"
          disabled={!next || noFigures}
          onClick={() => {
            if (!next) return
            setSkipped((prev) => new Set(prev).add(next.id))
            onSkip?.(next)
            announce(copy.announceSkipped(next.name))
          }}
        >
          {copy.skip}
        </Button>
        <AsyncButton className="flex-1" disabled={!next || noFigures || rushing} onAction={rush} pendingLabel={copy.rushingNow} successLabel={copy.rushed}>
          {copy.rushDelivery}
        </AsyncButton>
      </footer>
      {announcer}
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-sm', className)}>
      {card}
    </section>
  ) : (
    <main aria-labelledby={titleId} {...rest} className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}>
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { LoopRoute, type LoopRouteProps }
export type { LoopRouteCopy, LoopRouteStop, LoopRouteStopState }
