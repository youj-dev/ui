'use client'

import { useId, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { AsyncButton } from '../../components/ui/async-button'
import { Badge, BadgeDot } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { FlowLanes } from '../../components/ui/flow-lanes'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { Skeleton } from '../../components/ui/skeleton'
import { StatDelta, StatValue } from '../../components/ui/stat-card'
import { Eyebrow } from '../../components/ui/typography'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, numberFormat } from '../../lib/utils'
import {
  DEFAULT_COPY,
  POLICY,
  ROUTES,
  SHARES,
  STRATEGIES,
  THROUGHPUT,
  demo,
  type RoutingFlowCopy,
  type RoutingFlowFallback,
  type RoutingFlowFormats,
  type RoutingFlowPolicy,
  type RoutingFlowRoute,
  type RoutingFlowShares,
  type RoutingFlowStrategy,
  type RoutingFlowTone,
} from './routing-flow/data'
import { Routes } from './routing-flow/routes'

/* How a stream is routed across the places it can go, and what that costs.
 * The blended cost leads, in mono, with how far the draft moves it from the
 * live policy and the throughput, slow time and failure rate it blends to.
 * The strategy switch (your own strategies; the demo has Cost, Balanced and
 * Quality) reshapes the split: the figure rolls, and FlowLanes redraws the
 * source's fan, each route's stream as dense as its share. Below, the routes
 * as a table (share, typical / slow time, cost, failures), each row lighting
 * its lane, and the fallback rule as a sentence. Any change makes a draft:
 * the head's badge turns, the foot says so, and Deploy policy (`onDeploy`)
 * makes it the next live version; Revert drops it. While your data loads the
 * figures, the flow and the table are skeletons; an error with Retry or no
 * routes takes the flow's place, and the rest keeps its room.
 * Embedded, it stops at its natural width unless `fill`.
 * Reduced motion: the figures, the fan and its particles are drawn in place. */

interface RoutingFlowProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (576px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate; `currency` prices the routes. */
  copy?: Partial<RoutingFlowCopy>
  /** Formats costs, rates and shares (BCP 47). Default: the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The routes the flow can be sent to. */
  routes?: RoutingFlowRoute[]
  /** The ways to weigh a choice, in the switch's order. Default: Cost, Balanced, Quality. */
  strategies?: RoutingFlowStrategy[]
  /** Each strategy's split of the flow: strategy id, then route id. */
  shares?: RoutingFlowShares
  /** Units a second through the source, split by the shares. */
  throughput?: number
  /** How the figures are written; each replaces its default whole. Default: the demo's currency, seconds and percents. */
  formats?: RoutingFlowFormats
  /** The failure rate (0–1) from which a route's rate turns warning-colored. Default 0.01. */
  failWarnAt?: number
  /** Skeletons in place of the figures, the flow and the table while your data loads. Default false. */
  loading?: boolean
  /** Shown in place of the flow when it fails to load, with Retry when `onRetry` is set; the headline shows a dash. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** Replaces the message when there are no routes. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
  /** The live policy: its version, strategy and fallback. The card's draft starts from it. */
  policy?: RoutingFlowPolicy
  /** The draft's strategy, when your app owns it; pair with `onStrategyChange`. */
  strategy?: string
  /** The draft's strategy at first, when the card owns it. Default: the live policy's. */
  defaultStrategy?: string
  /** Called when the strategy switch moves. */
  onStrategyChange?: (strategy: string) => void
  /** Deploys the draft; the card awaits it, then shows it live as the next version. */
  onDeploy?: (policy: RoutingFlowPolicy) => Promise<unknown> | unknown
}

const sameFallback = (a: RoutingFlowFallback, b: RoutingFlowFallback) => a.enabled === b.enabled && a.from === b.from && a.to === b.to

function RoutingFlow({
  theme,
  embedded = true,
  fill = false,
  className,
  copy: copyProp,
  locale: localeProp,
  routes = ROUTES,
  strategies = STRATEGIES,
  shares = SHARES,
  throughput = THROUGHPUT,
  formats,
  failWarnAt = 0.01,
  loading = false,
  error,
  onRetry,
  empty,
  policy = POLICY,
  strategy: strategyProp,
  defaultStrategy,
  onStrategyChange,
  onDeploy,
  ...rest
}: RoutingFlowProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const { announce, announcer } = useAnnouncer()
  const [live, setLive] = useState(policy)
  const [strategy, setStrategyState] = useControllableState(strategyProp, defaultStrategy ?? policy.strategy)
  const [fallback, setFallback] = useState(live.fallback)
  const [active, setActive] = useState<string | null>(null)

  // A strategy's split, normalized, and what it blends to.
  const splitOf = (id: string) => {
    const raw = routes.map((r) => Math.max(0, shares[id]?.[r.id] ?? 0))
    const sum = raw.reduce((x, y) => x + y, 0)
    return Object.fromEntries(routes.map((r, i) => [r.id, sum ? raw[i]! / sum : 0])) as Record<string, number>
  }
  const blend = (split: Record<string, number>, pick: (r: RoutingFlowRoute) => number) => routes.reduce((sum, r) => sum + (split[r.id] ?? 0) * pick(r), 0)
  const split = splitOf(strategy)
  const cost = blend(split, (r) => r.cost)
  const liveCost = blend(splitOf(live.strategy), (r) => r.cost)
  const changed = strategy !== live.strategy || !sameFallback(fallback, live.fallback)

  const costOptions = formats?.cost ?? { style: 'currency', currency: copy.currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }
  const resolved = {
    cost: costOptions,
    time: formats?.time ?? { minimumFractionDigits: 2, maximumFractionDigits: 2 },
    rate: formats?.rate ?? { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 },
    throughput: formats?.throughput ?? { maximumFractionDigits: 0 },
  } satisfies Required<RoutingFlowFormats>
  const money = numberFormat(locale, resolved.cost)
  const count = numberFormat(locale, resolved.throughput)
  const time = numberFormat(locale, resolved.time)
  const rate = numberFormat(locale, resolved.rate)

  // What the card shows in place of its figures and its flow.
  const status = loading ? 'loading' : error ? 'error' : routes.length === 0 ? 'empty' : 'ready'
  const ready = status === 'ready'
  const lanes = routes.length || 4
  const dash = <span className="text-fg-subtle">—</span>

  const setStrategy = (next: string) => {
    setStrategyState(next)
    onStrategyChange?.(next)
    announce(copy.announceStrategy(strategies.find((s) => s.id === next)?.label ?? next, money.format(blend(splitOf(next), (r) => r.cost))))
  }
  const revert = () => {
    setStrategy(live.strategy)
    setFallback(live.fallback)
  }
  const deploy = async () => {
    const next: RoutingFlowPolicy = { version: live.version + 1, strategy, fallback }
    await (onDeploy ? onDeploy(next) : demo('RoutingFlow: onDeploy', 900))
    setLive(next)
    announce(copy.announceDeployed(next.version))
  }
  const failure = (error: unknown) => (error instanceof Error && error.message ? error.message : copy.failed)

  // The flow's room: the height its lanes would take, so the card keeps its size.
  const room = 'flex items-center [--flow-lanes-pitch:calc(var(--spacing)*(8_-_var(--ui--compact,0)))]'
  const roomStyle = { height: `calc(var(--flow-lanes-pitch) * ${lanes})` }
  const flow = loading ? (
    <div className={cn(room, 'flex-col items-stretch')} style={roomStyle}>
      <span className="sr-only">{copy.loadingLabel}</span>
      {Array.from({ length: lanes }, (_, i) => (
        <div key={i} aria-hidden className="flex flex-1 items-center gap-3">
          <Skeleton className="h-0.5 flex-1 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  ) : error ? (
    <div className={cn(room, 'justify-center')} style={roomStyle}>
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
  ) : routes.length === 0 ? (
    <div className={cn(room, 'grid')} style={roomStyle}>
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
    <FlowLanes
      source={copy.source}
      label={copy.flow}
      lanes={routes.map((r) => ({ id: r.id, label: r.name, value: (split[r.id] ?? 0) * throughput, tone: r.tone }))}
      active={active}
      onActiveChange={setActive}
      formatValue={(v) => copy.rate(count.format(v))}
      locale={locale}
    />
  )

  const card = (
    <Card className={cn('w-full overflow-hidden text-fg', !embedded && !fill && 'max-w-xl')}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription>{copy.pool}</CardDescription>
        <CardAction>
          {loading ? (
            <Skeleton className="h-5 w-14 rounded-full" />
          ) : (
            !error && (
              <Badge variant={changed ? 'warning' : 'success'}>
                <BadgeDot />
                {changed ? copy.draft : copy.live}
              </Badge>
            )
          )}
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <Eyebrow>
              {ready ? `${copy.blended} · ${changed ? copy.changed : copy.sameAsLive}` : copy.blended}
            </Eyebrow>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              {ready ? (
                <StatValue value={cost} from={cost} format={costOptions} locale={locale} unit={copy.perMillion} />
              ) : loading ? (
                <span className="flex h-8.25 items-center">
                  <Skeleton className="h-6.5 w-36" />
                </span>
              ) : (
                <span className="flex h-8.25 items-center text-2xl font-semibold">{dash}</span>
              )}
              {ready && changed && liveCost > 0 && (
                <StatDelta value={(cost - liveCost) / liveCost} invert locale={locale}>
                  {copy.vsLive}
                </StatDelta>
              )}
            </div>
            <Eyebrow className="tabular-nums">
              {ready ? (
                copy.facts(count.format(throughput), time.format(blend(split, (r) => r.time.slow)), rate.format(blend(split, (r) => r.failRate)))
              ) : loading ? (
                <Skeleton className="h-[1lh] w-56" />
              ) : (
                <span className="block h-[1lh]" />
              )}
            </Eyebrow>
          </div>
          <SegmentedControl variant="pill" size="sm" aria-label={copy.strategy} value={strategy} onValueChange={setStrategy}>
            {strategies.map((s) => (
              <SegmentedControlItem key={s.id} value={s.id}>
                {s.label}
              </SegmentedControlItem>
            ))}
          </SegmentedControl>
        </div>
        {flow}
      </CardContent>

      <CardContent>
        <Routes
          routes={routes}
          shares={split}
          fallback={fallback}
          onFallbackChange={setFallback}
          active={active}
          onActiveChange={setActive}
          copy={copy}
          locale={locale}
          formats={resolved}
          warnAt={failWarnAt}
          status={loading ? 'loading' : ready ? 'ready' : 'blank'}
          rows={lanes}
          heading={embedded ? 'h3' : 'h2'}
        />
      </CardContent>

      <CardFooter className="flex-wrap justify-between gap-3">
        <span className="tabular-nums">
          {ready ? (
            <>
              {copy.policy(live.version)}
              {changed && ` · ${copy.unsaved}`}
            </>
          ) : loading ? (
            <Skeleton className="h-[1lh] w-24" />
          ) : null}
        </span>
        <div className="ms-auto flex gap-2">
          <Button variant="outline" size="sm" disabled={!ready || !changed} onClick={revert}>
            {copy.revert}
          </Button>
          <AsyncButton size="sm" disabled={!ready || !changed} onAction={deploy} pendingLabel={copy.deploying} successLabel={copy.deployed} errorLabel={failure}>
            {copy.deploy}
          </AsyncButton>
        </div>
      </CardFooter>
      {announcer}
    </Card>
  )

  const view = embedded ? (
    <section data-slot="routing-flow" aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-xl', className)}>
      {card}
    </section>
  ) : (
    <main
      data-slot="routing-flow"
      aria-labelledby={titleId}
      {...rest}
      className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}
    >
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { RoutingFlow, type RoutingFlowProps }
export type { RoutingFlowCopy, RoutingFlowFallback, RoutingFlowFormats, RoutingFlowPolicy, RoutingFlowRoute, RoutingFlowShares, RoutingFlowStrategy, RoutingFlowTone }
