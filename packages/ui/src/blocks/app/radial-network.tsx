'use client'

import { useId, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { RadialGraph, type RadialGraphNode } from '../../components/ui/radial-graph'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { Skeleton } from '../../components/ui/skeleton'
import { Eyebrow } from '../../components/ui/typography'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, numberFormat, toneColor } from '../../lib/utils'
import {
  CENTER,
  DEFAULT_COPY,
  KINDS,
  NODES,
  STATES,
  type RadialNetworkCenter,
  type RadialNetworkCopy,
  type RadialNetworkKind,
  type RadialNetworkNode,
  type RadialNetworkState,
} from './radial-network/data'

/* What one thing reaches, as a RadialGraph: the center in the middle, what
 * it touches one hop out and what those lead to on the next ring, each dot in
 * its kind's color. A state can give a node a solid or dashed ring in its
 * tone, with the link into it drawn the same way (the demo: compromised
 * things solid, at-risk ones dashed), so the path reads at a glance. The
 * header picks how many hops to show; the key names the states and kinds, and
 * the foot counts each counted state and the total reached within the hops
 * shown. Loading, an error with Retry and an empty graph take the graph's
 * place at its size. Every node's
 * name, state and note is in its tooltip (hover or keyboard).
 * Embedded, it stops at its natural width unless `fill`.
 * Reduced motion: the graph is drawn in place and folds land at once. */

interface RadialNetworkProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (448px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<RadialNetworkCopy>
  /** Formats the counts (BCP 47). Default: the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** Where it starts. */
  center?: RadialNetworkCenter
  /** Everything it reaches, each hanging from its `via` or from the center. */
  nodes?: RadialNetworkNode[]
  /** The kinds of things, with their colors, in the key's order. */
  kinds?: RadialNetworkKind[]
  /** The states a node can be in, with their rings, in the key's order. Default: compromised, at risk, clean. */
  states?: RadialNetworkState[]
  /** Formats the foot's counts. Default: the locale's number format. */
  format?: (value: number) => string
  /** Skeletons in place of the graph while your data loads. Default false. */
  loading?: boolean
  /** Shown in place of the graph when it fails to load, with Retry when `onRetry` is set. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** Replaces the message when there is nothing to draw. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
  /** How many hops to show, controlled. */
  hops?: number
  /** How many hops to show at first. Default: all of them. */
  defaultHops?: number
  /** Called with the hops picked in the header. */
  onHopsChange?: (hops: number) => void
}

/** The foot's figure colors, as literal classes for Tailwind. */
const INK = {
  accent: 'text-accent-text',
  info: 'text-info-text',
  success: 'text-success-text',
  warning: 'text-warning-text',
  danger: 'text-danger-text',
} as const

/** A state's mark in the key: the dot, with its ring in the state's tone. */
function StateMark({ state }: { state: RadialNetworkState }) {
  return (
    <svg aria-hidden width={14} height={14} viewBox="0 0 14 14" className="shrink-0">
      {state.ring && (
        <circle
          cx={7}
          cy={7}
          r={6}
          fill="none"
          stroke={`var(--color-${state.tone ?? 'danger'})`}
          strokeWidth={1.5}
          strokeDasharray={state.ring === 'dashed' ? '2 2' : undefined}
        />
      )}
      <circle cx={7} cy={7} r={state.ring ? 3.25 : 3} fill="var(--color-fg-subtle)" />
    </svg>
  )
}

function RadialNetwork({
  theme,
  embedded = true,
  fill = false,
  className,
  copy: copyProp,
  locale: localeProp,
  center = CENTER,
  nodes: nodesProp = NODES,
  kinds = KINDS,
  states = STATES,
  format,
  loading = false,
  error,
  onRetry,
  empty,
  hops: hopsProp,
  defaultHops,
  onHopsChange,
  ...rest
}: RadialNetworkProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const count = format ?? numberFormat(locale).format
  const stateOf = (id: string | undefined) => states.find((st) => st.id === id)
  const toneOf = (kind: string) => kinds.find((k) => k.id === kind)?.tone ?? 'neutral'

  // How far out each node is, to offer one choice per ring and count what the view shows.
  const byId = new Map(nodesProp.map((e) => [e.id, e]))
  const depthOf = (e: RadialNetworkNode, seen = 0): number => {
    const via = e.via ? byId.get(e.via) : undefined
    return via && seen < nodesProp.length ? depthOf(via, seen + 1) + 1 : 1
  }
  const deepest = Math.max(1, ...nodesProp.map((e) => depthOf(e)))
  const [hopsState, setHops] = useControllableState(hopsProp, defaultHops ?? deepest)
  const hops = Math.min(deepest, Math.max(1, hopsState))
  const inView = nodesProp.filter((e) => depthOf(e) <= hops)

  const nodes: RadialGraphNode[] = nodesProp.map((e) => {
    const st = stateOf(e.state)
    return { id: e.id, label: e.name, via: e.via, tone: toneOf(e.kind), ring: st?.ring, ringTone: st?.tone, state: st?.label, detail: e.note }
  })
  const centerState = stateOf(center.state)

  const stats = [
    ...states
      .filter((st) => st.count)
      .map((st) => ({ label: st.label, value: inView.filter((e) => e.state === st.id).length, ink: st.emphasis ? INK[st.tone ?? 'danger'] : 'text-fg' })),
    { label: copy.total, value: inView.length, ink: 'text-fg' },
  ]

  // The graph's room: the same square it draws in, so the card keeps its size.
  const frame = 'mx-auto aspect-square w-full max-w-sm'
  const graph = loading ? (
    <div className={cn(frame, 'relative')}>
      <span className="sr-only">{copy.loadingLabel}</span>
      <svg aria-hidden viewBox="0 0 320 320" className="absolute inset-0 size-full overflow-visible">
        {[67, 134].map((r) => (
          <circle key={r} cx={160} cy={160} r={r} fill="none" strokeDasharray="2 4" vectorEffect="non-scaling-stroke" className="stroke-line-strong" />
        ))}
      </svg>
      <Skeleton className="absolute top-1/2 left-1/2 size-[10.625%] -translate-1/2 rounded-full" />
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
  ) : nodesProp.length === 0 ? (
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
    <RadialGraph
      label={copy.graphLabel(center.name)}
      center={{
        id: center.id,
        label: center.name,
        short: center.short,
        tone: toneOf(center.kind),
        ring: centerState?.ring,
        ringTone: centerState?.tone,
        state: centerState?.label,
      }}
      nodes={nodes}
      hops={hops}
      className="mx-auto max-w-sm"
    />
  )

  const card = (
    <Card data-slot="radial-network" className={cn('w-full gap-0 overflow-hidden py-0 text-fg', !embedded && !fill && 'max-w-md')}>
      <CardHeader className="pt-(--card-spacing) pb-(--ui--panel-y)">
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription className="truncate">{copy.subtitle(center.name)}</CardDescription>
        <CardAction>
          {deepest > 1 && (
            <SegmentedControl
              variant="pill"
              aria-label={copy.hopsLabel}
              value={String(hops)}
              onValueChange={(value) => {
                setHops(Number(value))
                onHopsChange?.(Number(value))
              }}
            >
              {Array.from({ length: deepest }, (_, i) => i + 1).map((n) => (
                <SegmentedControlItem key={n} value={String(n)}>
                  {copy.hops(n)}
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
          )}
        </CardAction>
      </CardHeader>

      <div className="flex flex-col gap-4 border-t border-line px-(--ui--panel-x) py-(--ui--panel-y)">
        {graph}
        <div className="flex flex-col gap-2 text-ui-sm">
          <ul aria-label={copy.statesLabel} className="flex flex-wrap items-center gap-x-4 gap-y-1 text-fg-muted">
            {states.map((state) => (
              <li key={state.id} className="flex items-center gap-1.5">
                <StateMark state={state} />
                {state.label}
              </li>
            ))}
          </ul>
          <ul aria-label={copy.kindsLabel} className="flex flex-wrap items-center gap-x-4 gap-y-1 text-fg-muted">
            {kinds.map((kind) => (
              <li key={kind.id} className="flex items-center gap-1.5">
                <span aria-hidden className="size-2 rounded-xs" style={{ background: toneColor(kind.tone) }} />
                {kind.label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <footer className="border-t border-line">
        <dl className="grid" style={{ gridTemplateColumns: `repeat(${stats.length}, minmax(max-content, 1fr))` }}>
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={cn('flex min-w-0 flex-col gap-1 px-(--ui--panel-x) py-(--ui--panel-foot-y)', i > 0 && 'border-s border-line')}
            >
              <dt className="truncate">
                <Eyebrow>{stat.label}</Eyebrow>
              </dt>
              <dd className={cn('font-mono text-ui-lg tabular-nums', stat.ink)}>{loading ? <Skeleton className="h-5 w-8" /> : error ? <span className="text-fg-subtle">—</span> : count(stat.value)}</dd>
            </div>
          ))}
        </dl>
      </footer>
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

export { RadialNetwork, type RadialNetworkProps }
export type { RadialNetworkCenter, RadialNetworkCopy, RadialNetworkKind, RadialNetworkNode, RadialNetworkState }
