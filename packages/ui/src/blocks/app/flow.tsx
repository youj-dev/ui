'use client'

import { useId, useMemo, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { Skeleton } from '../../components/ui/skeleton'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, numberFormat } from '../../lib/utils'
import { Chart, GAP, HEIGHT, toneOf } from './flow/chart'
import { DEFAULT_COPY, DEMO, DEMO_RANGES, NODES, STAGES, type FlowCopy, type FlowNode, type FlowPath, type FlowRange, type FlowTone } from './flow/data'
import { layout } from './flow/layout'
import { Transitions } from './flow/table'

/* Where things go. A population through its stages as a sankey: each node
 * as tall as the people through it, each path a ribbon of its own in its
 * first node's colour all the way to the end, so a source can be followed
 * past the first step. Point at a node (or focus it: one tab stop, arrows
 * along and across the stages) and every path through it lights, with its
 * split in the line above; press it to keep it lit. Point at a ribbon and
 * its one path lights, start to end. Over the chart, at rest, how the last
 * stage splits. A new range morphs every ribbon and bar from where it is,
 * and View data swaps the picture for the step-to-step table in the same
 * room. Feed it `stages`, `nodes` and `paths` (each a route through the
 * stages and how many took it); the range is `range` with
 * `onRangeChange`, the pinned node `selected` with `onSelectedChange`;
 * every string is in `copy`. Built for the compact layout density, taken
 * from the page; embedded, it keeps its natural width unless `fill`, and
 * the chart scrolls sideways when it's narrower than 35rem. It keeps its
 * size in every state. Reduced motion: the flow is drawn in place. */

interface FlowProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (768px at 100% scale). Default false. */
  fill?: boolean
  /** The title's level. Default: 2 when embedded, else 1. */
  headingLevel?: 1 | 2 | 3
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<FlowCopy>
  /** Formats every figure (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The stages' names, first to last. Default: the demo's Source, Plan and Outcome. */
  stages?: string[]
  /** The nodes, each in its stage, in the order they stack. Default: the demo's sources, plans and outcomes. */
  nodes?: FlowNode[]
  /** The routes through the stages and how many took each. Default: the demo's trials for the range shown. */
  paths?: FlowPath[]
  /** Intl.NumberFormat options for every figure. Default: whole numbers. */
  format?: Intl.NumberFormatOptions
  /** The ranges the switch offers, each `{ id, label, name? }`; fewer than two hides it. Default: 7, 30 and 90 days with the demo's paths, none with yours. */
  ranges?: FlowRange[]
  /** The id of the range shown, controlled: pair it with `onRangeChange`. Default: uncontrolled. */
  range?: string
  /** The id of the range shown first, uncontrolled. Default: the first of your `ranges`, else `30d`. */
  defaultRange?: string
  /** Called with the id of the range picked; answer with its `paths`. */
  onRangeChange?: (range: string) => void
  /** The node kept lit, controlled (`null` for none): pair it with `onSelectedChange`. Default: uncontrolled. */
  selected?: string | null
  /** The node kept lit first, uncontrolled. Default: none. */
  defaultSelected?: string | null
  /** Called with the node pressed, or `null` when it's let go. */
  onSelectedChange?: (id: string | null) => void
  /** A skeleton in place of the chart while your data loads. Default false. */
  loading?: boolean
  /** Shown in place of the chart when the data fails to load, with Retry when `onRetry` is set. Default: none. */
  error?: ReactNode
  /** Retries after an `error`. Default: none. */
  onRetry?: () => void
  /** Replaces the message when nothing has flowed. Default: `copy.empty` and `copy.emptyDescription`. */
  empty?: ReactNode
}

const WHOLE: Intl.NumberFormatOptions = { maximumFractionDigits: 0 }
/** The demo's paths for a range id, none for one of your own. */
const NO_PATHS: FlowPath[] = []
const demoPaths = (id: string) => (DEMO as Partial<Record<string, FlowPath[]>>)[id]
type Hover = { node: string } | { path: number } | null

function Flow({
  theme,
  embedded = true,
  fill = false,
  headingLevel,
  copy: copyProp,
  locale,
  stages: stagesProp,
  nodes: nodesProp,
  paths: pathsProp,
  format = WHOLE,
  ranges: rangesProp,
  range: rangeProp,
  defaultRange: defaultRangeProp,
  onRangeChange,
  selected: selectedProp,
  defaultSelected = null,
  onSelectedChange,
  loading = false,
  error,
  onRetry,
  empty,
  className,
  ...rest
}: FlowProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const titleId = useId()
  const summaryId = useId()
  const regionId = useId()
  const Title = `h${headingLevel ?? (embedded ? 2 : 1)}` as 'h1' | 'h2' | 'h3'
  const { announce, announcer } = useAnnouncer()
  const demo = pathsProp === undefined
  const stages = stagesProp ?? STAGES
  const nodes = nodesProp ?? NODES
  const ranges = rangesProp ?? (demo ? DEMO_RANGES : [])
  const [range, setRange] = useControllableState(rangeProp, defaultRangeProp ?? rangesProp?.[0]?.id ?? '30d')
  const current = ranges.find((r) => r.id === range) ?? DEMO_RANGES.find((r) => r.id === range)
  const rangeName = current?.name ?? current?.label ?? ''
  const paths = pathsProp ?? demoPaths(range) ?? NO_PATHS
  const [selected, setSelected] = useControllableState(selectedProp, defaultSelected)
  const [hover, setHover] = useState<Hover>(null)
  const [table, setTable] = useState(false)

  const flow = useMemo(() => layout(nodes, paths, stages.length, HEIGHT, GAP), [nodes, paths, stages.length])
  const tones = useMemo(() => {
    const first = nodes.filter((n) => n.stage === 0)
    return new Map(nodes.map((n): [string, FlowTone] => [n.id, n.tone ?? (n.stage === 0 ? (`chart-${(first.indexOf(n) % 5) + 1}` as FlowTone) : 'neutral')]))
  }, [nodes])
  const number = useMemo(() => numberFormat(copy.locale, format), [copy.locale, format])
  const percent = useMemo(() => numberFormat(copy.locale, { style: 'percent', maximumFractionDigits: 1 }), [copy.locale])
  const count = (value: number) => copy.count(number.format(value), value)
  const share = (value: number) => percent.format(value / (flow.total || 1))

  const boxes = [...flow.boxes.values()]
  const ends = boxes.filter((b) => b.node.stage === stages.length - 1 && b.value > 0)
  /** Where a node's people went next, or for the last stage where they came from: [node, value] pairs, largest first. */
  const split = (id: string) => {
    const box = flow.boxes.get(id)!
    const onward = flow.pieces.filter((p) => p.from === id)
    const by = new Map<string, number>()
    if (onward.length) for (const p of onward) by.set(p.to, (by.get(p.to) ?? 0) + p.value)
    else if (box.node.stage > 0) for (const p of flow.paths) if (p.steps.includes(id)) by.set(p.steps[0]!, (by.get(p.steps[0]!) ?? 0) + p.value)
    return { onward: onward.length > 0, parts: [...by.entries()].sort((a, b) => b[1] - a[1]) }
  }
  const nameOf = (id: string) => flow.boxes.get(id)?.node.label ?? id
  const describe = (id: string) => {
    const box = flow.boxes.get(id)!
    const { onward, parts } = split(id)
    const words = parts.map(([to, value]) => copy.part(nameOf(to), number.format(value), percent.format(value / (box.value || 1)))).join(', ')
    return copy.node(box.node.label, stages[box.node.stage] ?? '', count(box.value), share(box.value), parts.length ? (onward ? copy.onward : copy.from)(words) : '')
  }

  const focus = hover && 'node' in hover ? hover.node : hover ? null : selected
  const lit = hover && 'path' in hover ? new Set([hover.path]) : focus && flow.boxes.has(focus) ? new Set(flow.paths.flatMap((p, i) => (p.steps.includes(focus) ? [i] : []))) : null
  const dot = (id: string) => toneOf(tones.get(id) ?? 'neutral')
  const readout: { key: string; color: string; label: string; value: string }[] =
    hover && 'path' in hover && flow.paths[hover.path]
      ? [{ key: 'path', color: dot(flow.paths[hover.path]!.steps[0]!), label: flow.paths[hover.path]!.steps.map(nameOf).join(copy.arrow), value: `${count(flow.paths[hover.path]!.value)} · ${share(flow.paths[hover.path]!.value)}` }]
      : focus && flow.boxes.has(focus)
        ? [
            { key: focus, color: dot(focus), label: nameOf(focus), value: `${count(flow.boxes.get(focus)!.value)} · ${share(flow.boxes.get(focus)!.value)}` },
            ...split(focus).parts.map(([id, value]) => ({ key: `part-${id}`, color: dot(id), label: nameOf(id), value: percent.format(value / (flow.boxes.get(focus)!.value || 1)) })),
          ]
        : ends.map((b) => ({ key: b.node.id, color: dot(b.node.id), label: b.node.label, value: share(b.value) }))

  const pickRange = (next: string) => {
    setRange(next)
    setHover(null)
    onRangeChange?.(next)
    const total = demo ? demoPaths(next)?.reduce((t, p) => t + p.value, 0) : undefined
    const picked = ranges.find((r) => r.id === next)
    announce(copy.announcement(picked?.name ?? picked?.label ?? '', total === undefined ? '' : count(total)))
  }
  const pin = (id: string | null) => {
    setSelected(id)
    onSelectedChange?.(id)
  }

  const state = loading ? (
    <div className="flex h-full flex-col gap-2">
      <span className="sr-only">{copy.loading}</span>
      <Skeleton className="h-4 w-full rounded-sm" />
      <Skeleton className="flex-1 rounded-lg" />
    </div>
  ) : error ? (
    <div className="grid h-full place-items-center">
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
  ) : flow.total === 0 ? (
    (empty ?? (
      <Empty className="h-full rounded-lg border border-dashed border-line">
        <EmptyHeader>
          <EmptyTitle>{copy.empty}</EmptyTitle>
          <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    ))
  ) : null

  const body = (
    <div className="flex flex-col gap-3">
      <p aria-hidden data-slot="flow-readout" className="flex h-5 min-w-0 items-center gap-x-3 overflow-hidden text-ui-sm whitespace-nowrap">
        {!state &&
          readout.map((r, i) => (
            <span key={r.key} className={cn('inline-flex min-w-0 items-center gap-1.5', i === 0 ? 'shrink' : 'shrink-0')}>
              <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: r.color }} />
              <span className={cn('truncate', i === 0 ? 'font-medium text-fg' : 'text-fg-muted')}>{r.label}</span>
              <span className="shrink-0 text-fg-muted tabular-nums">{r.value}</span>
            </span>
          ))}
      </p>
      <div id={regionId} className="relative" style={{ height: HEIGHT + 28 }}>
        {state ?? (
          <>
            <p id={summaryId} className="sr-only">
              {copy.summary(count(flow.total), boxes.filter((b) => b.node.stage === 0 && b.value > 0).length, ends.map((b) => `${b.node.label} ${share(b.value)}`).join(', '))}
            </p>
            {table ? (
              <div role="region" aria-label={copy.table(rangeName)} tabIndex={0} className="h-full overflow-auto rounded-sm outline-hidden yj-scrollbar focus-ring">
                <Transitions layout={flow} caption={copy.table(rangeName)} figure={(v) => number.format(v)} percent={(v) => percent.format(v)} copy={copy} />
              </div>
            ) : (
              <div role="figure" aria-label={copy.chart} aria-describedby={summaryId} data-slot="flow-chart" className="h-full overflow-x-auto overflow-y-hidden yj-scrollbar">
                <div className="min-w-140">
                  <Chart
                    stages={stages}
                    layout={flow}
                    tones={tones}
                    lit={lit}
                    pinned={selected}
                    onNode={(id) => setHover(id === null ? null : { node: id })}
                    onPath={(index) => setHover(index === null ? null : { path: index })}
                    onPin={pin}
                    figure={(v) => number.format(v)}
                    label={describe}
                    copy={copy}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <div className={cn('flex h-6 items-center', state && 'invisible')}>
        <Button variant="ghost" size="xs" className="-ms-2" aria-expanded={table} aria-controls={regionId} onClick={() => setTable((open) => !open)}>
          {table ? copy.hideData : copy.viewData}
        </Button>
      </div>
    </div>
  )

  const card = (
    <Card className={cn('w-full gap-4 text-fg', !embedded && !fill && 'max-w-3xl')}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription>{copy.description(rangeName)}</CardDescription>
        {ranges.length > 1 && (
          <CardAction>
            <SegmentedControl variant="pill" size="sm" aria-label={copy.range} value={range} onValueChange={pickRange}>
              {ranges.map((r) => (
                <SegmentedControlItem key={r.id} value={r.id} aria-label={r.name ? `${r.label}, ${r.name}` : r.label} className="px-2.5">
                  {r.label}
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
          </CardAction>
        )}
      </CardHeader>
      <CardContent aria-busy={loading || undefined}>{body}</CardContent>
      {announcer}
    </Card>
  )

  const root = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-3xl', className)}>
      {card}
    </section>
  ) : (
    <main aria-labelledby={titleId} {...rest} className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}>
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{root}</ThemeScope> : root
}

export { Flow, type FlowProps, type FlowCopy, type FlowNode, type FlowPath, type FlowRange, type FlowTone }
