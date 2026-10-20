'use client'

import { useId, useMemo, useState, type ComponentProps, type ReactNode } from 'react'
import { Counter } from '@youj/motion'
import { ThemeScope, useLocale, useYouj, type ThemeInput } from '@youj/core'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { Skeleton } from '../../components/ui/skeleton'
import { Switch } from '../../components/ui/switch'
import { Toggle } from '../../components/ui/toggle'
import { useLiveRegion } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, numberFormat } from '../../lib/utils'
import { DEFAULT_COPY, GROUPS, ITEMS, THRESHOLDS, TONES, X, Y, groupOf, measure, median, type QuadrantAxis, type QuadrantCopy, type QuadrantGroup, type QuadrantItem } from './quadrant/data'
import { List } from './quadrant/list'
import { Plot } from './quadrant/plot'

/* How two measures relate. Items as bubbles on two measures (the demo:
 * accounts by weekly active seats and revenue, a log scale up, bubbles by
 * seats), split by two lines into four groups, each its own colour and
 * name. The chips over it are the legend, the counts and a filter: press
 * one and the rest step back while the list beside the field keeps only
 * that group. Drag a split line or its handle (or step it with the arrow
 * keys) and the bubbles change colour as it passes them, the counts roll,
 * and when you stop the counts are spoken. Movement draws where each item
 * stood last period, the bubbles gliding from there, and the list says who
 * changed group. Point at a bubble or a row and both light; the bubbles are
 * one tab stop with arrow keys to the nearest bubble that way. Feed it
 * `items` (two figures each, a size and last period's place), the axes'
 * `x` and `y` (format, `log` scale, domain) and the split as `thresholds`
 * with `onThresholdsChange`; `onItemSelect` makes items pickable; every
 * string is in `copy`. Built for the compact layout density, taken from
 * the page; embedded, it keeps its natural width unless `fill`, the list
 * beside the field from 40rem, under it below. It keeps its size in every
 * state. Reduced motion: bubbles, lines and figures land in place. */

interface QuadrantProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (768px at 100% scale). Default false. */
  fill?: boolean
  /** The title's level. Default: 2 when embedded, else 1. */
  headingLevel?: 1 | 2 | 3
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<QuadrantCopy>
  /** Formats every figure (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The items, each with its two figures, a size and where it stood last period. Default: the demo's 36 accounts. */
  items?: QuadrantItem[]
  /** The measure across: its format, scale and ends. Default: the demo's percent of seats, 0 to 100, with the demo's items; else linear whole numbers. */
  x?: QuadrantAxis
  /** The measure up. Default: the demo's revenue on a log scale, with the demo's items; else linear whole numbers. */
  y?: QuadrantAxis
  /** Where the two lines split the measures, controlled: pair it with `onThresholdsChange`. Default: uncontrolled. */
  thresholds?: [number, number]
  /** Where they split first, uncontrolled. Default: the demo's 55% and $5K, else the medians. */
  defaultThresholds?: [number, number]
  /** Called as a line is dragged or stepped. */
  onThresholdsChange?: (thresholds: [number, number]) => void
  /** The group shown alone, controlled (`null` for all): pair it with `onGroupChange`. Default: uncontrolled. */
  group?: QuadrantGroup | null
  /** The group shown alone first, uncontrolled. Default: all. */
  defaultGroup?: QuadrantGroup | null
  /** Called with the group picked, or `null` for all. */
  onGroupChange?: (group: QuadrantGroup | null) => void
  /** Whether last period's places show, controlled: pair it with `onMovementChange`. Default: uncontrolled. */
  movement?: boolean
  /** Whether they show first, uncontrolled. Default false. */
  defaultMovement?: boolean
  /** Called when Movement is switched. */
  onMovementChange?: (movement: boolean) => void
  /** An item is pressed (a bubble or a row). Default: items aren't pickable. */
  onItemSelect?: (item: QuadrantItem) => void
  /** Skeletons in place of the field and the list while your data loads. Default false. */
  loading?: boolean
  /** Shown in place of the field when the data fails to load, with Retry when `onRetry` is set. Default: none. */
  error?: ReactNode
  /** Retries after an `error`. Default: none. */
  onRetry?: () => void
  /** Replaces the message when there are no items. Default: `copy.empty` and `copy.emptyDescription`. */
  empty?: ReactNode
}

const PLAIN: QuadrantAxis = {}

function Quadrant({
  theme,
  embedded = true,
  fill = false,
  headingLevel,
  copy: copyProp,
  locale,
  items: itemsProp,
  x: xProp,
  y: yProp,
  thresholds: thresholdsProp,
  defaultThresholds,
  onThresholdsChange,
  group: groupProp,
  defaultGroup = null,
  onGroupChange,
  movement: movementProp,
  defaultMovement = false,
  onMovementChange,
  onItemSelect,
  loading = false,
  error,
  onRetry,
  empty,
  className,
  ...rest
}: QuadrantProps) {
  const k = useYouj()
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const titleId = useId()
  const Title = `h${headingLevel ?? (embedded ? 2 : 1)}` as 'h1' | 'h2' | 'h3'
  const { politeRef, announce } = useLiveRegion()
  const demo = itemsProp === undefined
  const items = itemsProp ?? ITEMS
  const xAxis = xProp ?? (demo ? X : PLAIN)
  const yAxis = yProp ?? (demo ? Y : PLAIN)
  const xm = useMemo(() => measure(items.flatMap((i) => (i.previous ? [i.x, i.previous.x] : [i.x])).concat(items.length ? [] : [0, 1]), xAxis), [items, xAxis])
  const ym = useMemo(() => measure(items.flatMap((i) => (i.previous ? [i.y, i.previous.y] : [i.y])).concat(items.length ? [] : [0, 1]), yAxis), [items, yAxis])
  // Until a line is moved the split is the default, so items that arrive after the first render still get their medians.
  const [split, setThresholds] = useControllableState<[number, number] | null>(thresholdsProp, defaultThresholds ?? null)
  const thresholds = split ?? (demo ? THRESHOLDS : ([median(items.map((i) => i.x), xm), median(items.map((i) => i.y), ym)] as [number, number]))
  const [group, setGroup] = useControllableState(groupProp, defaultGroup)
  const [movement, setMovement] = useControllableState(movementProp, defaultMovement)
  const [replay, setReplay] = useState(false)
  const [active, setActive] = useState<string | null>(null)
  const moves = items.some((i) => i.previous)

  const fx = useMemo(() => numberFormat(copy.locale, xAxis.format ?? { maximumFractionDigits: 0 }), [copy.locale, xAxis.format])
  const fy = useMemo(() => numberFormat(copy.locale, yAxis.format ?? { maximumFractionDigits: 0 }), [copy.locale, yAxis.format])
  const count = numberFormat(copy.locale)
  const figure = { x: (v: number) => fx.format(v), y: (v: number) => fy.format(v) }
  const of = (item: QuadrantItem, at: [number, number] = thresholds) => groupOf(item.x, item.y, at)
  const was = (item: QuadrantItem) => (item.previous ? groupOf(item.previous.x, item.previous.y, thresholds) : undefined)
  const counts = (at: [number, number]) => GROUPS.map((g) => [g, items.filter((i) => of(i, at) === g).length] as const)
  const spoken = (at: [number, number]) => counts(at).map(([g, n]) => copy.chip(copy.groups[g], count.format(n))).join(', ')
  const sizes = items.map((i) => i.size ?? 0)
  const [s0, s1] = [Math.min(...sizes), Math.max(...sizes)]
  const radius = (item: QuadrantItem) => (s1 > s0 ? 4 + 10 * Math.sqrt(((item.size ?? s0) - s0) / (s1 - s0)) : 6)
  const moved = (item: QuadrantItem) => {
    const before = was(item)
    return movement && before && before !== of(item) ? copy.movedFrom(copy.groups[before]) : ''
  }
  const label = (item: QuadrantItem) =>
    copy.point(item.label, figure.x(item.x), figure.y(item.y), item.size === undefined ? '' : count.format(item.size), copy.groups[of(item)], moved(item))

  const changeThresholds = (next: [number, number], done: boolean) => {
    setThresholds(next)
    onThresholdsChange?.(next)
    if (done) announce(copy.counts(spoken(next)), { delay: 500 })
  }
  const pickGroup = (next: QuadrantGroup | null) => {
    setGroup(next)
    onGroupChange?.(next)
  }
  const switchMovement = (on: boolean) => {
    setMovement(on)
    onMovementChange?.(on)
    if (!on || k.reduced) return
    // Bubbles start where they stood last period, then glide to now.
    setReplay(true)
    requestAnimationFrame(() => requestAnimationFrame(() => setReplay(false)))
  }

  const lit = items.find((i) => i.id === active)
  const listed = items.filter((i) => group === null || of(i) === group).sort((a, b) => b.y - a.y)
  const heading = group === null ? copy.all : copy.list(copy.groups[group])
  const state = loading ? (
    <div className="grid h-full gap-4 @xl/quadrant:grid-cols-[minmax(0,1fr)_--spacing(60)]">
      <span className="sr-only">{copy.loading}</span>
      <Skeleton className="h-full rounded-lg" />
      <div className="hidden flex-col gap-2 @xl/quadrant:flex">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-8 rounded-md" />
        ))}
      </div>
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
  ) : items.length === 0 ? (
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
      <div role="group" aria-label={copy.filter} data-slot="quadrant-groups" className={cn('flex flex-wrap gap-1.5', state && 'invisible')}>
        {counts(thresholds).map(([g, n]) => (
          <Toggle key={g} variant="outline" size="sm" pressed={group === g} onPressedChange={(on) => pickGroup(on ? g : null)} aria-label={copy.chip(copy.groups[g], count.format(n))} className="gap-2 px-2.5">
            <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: TONES[g] }} />
            <span aria-hidden className="text-fg">{copy.groups[g]}</span>
            <Counter aria-hidden value={n} from={n} mode="roll" locale={copy.locale} inView={false} className="text-fg-muted tabular-nums" />
          </Toggle>
        ))}
      </div>
      <p aria-hidden data-slot="quadrant-readout" className="flex h-5 min-w-0 items-center gap-x-3 overflow-hidden text-ui-sm whitespace-nowrap text-fg-muted tabular-nums">
        {state ? null : lit ? (
          <>
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: TONES[of(lit)] }} />
              <span className="truncate font-medium text-fg">{lit.label}</span>
            </span>
            <span>{copy.yValue(figure.y(lit.y))}</span>
            <span>{copy.xValue(figure.x(lit.x))}</span>
            {lit.size !== undefined && <span>{copy.sizeValue(count.format(lit.size))}</span>}
            {moved(lit) && <span className="truncate">{moved(lit)}</span>}
          </>
        ) : (
          <>
            <span>→ {copy.x}</span>
            <span>↑ {copy.y}</span>
            {s1 > s0 && <span>● {copy.size}</span>}
          </>
        )}
      </p>
      <div className="h-124 @xl/quadrant:h-72">
        {state ?? (
          <div className="grid h-full grid-rows-[minmax(0,1fr)_--spacing(48)] gap-4 @xl/quadrant:grid-cols-[minmax(0,1fr)_--spacing(60)] @xl/quadrant:grid-rows-1">
            <div role="figure" aria-label={copy.chart} aria-describedby={`${titleId}-summary`} className="min-h-0">
              <p id={`${titleId}-summary`} className="sr-only">
                {copy.summary(count.format(items.length), spoken(thresholds))}
              </p>
              <Plot
                items={items}
                x={xm}
                y={ym}
                thresholds={thresholds}
                onThresholds={changeThresholds}
                group={group}
                movement={movement && moves}
                replay={replay}
                active={active}
                onActive={setActive}
                onSelect={onItemSelect}
                radius={radius}
                label={label}
                figure={figure}
                copy={copy}
              />
            </div>
            <List heading={heading} items={listed} groupOf={of} movedFrom={moved} active={active} onActive={setActive} onSelect={onItemSelect} figure={figure} />
          </div>
        )}
      </div>
    </div>
  )

  const card = (
    <Card className={cn('w-full gap-4 text-fg', !embedded && !fill && 'max-w-3xl')}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription>{copy.description(count.format(items.length))}</CardDescription>
        {moves && (
          <CardAction>
            <label className="flex h-control-sm items-center gap-2 text-ui-sm text-fg-muted">
              <Switch size="sm" checked={movement} onCheckedChange={switchMovement} />
              {copy.movement}
            </label>
          </CardAction>
        )}
      </CardHeader>
      <CardContent aria-busy={loading || undefined} className="@container/quadrant">
        {body}
      </CardContent>
      <div ref={politeRef} role="status" className="sr-only" />
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

export { Quadrant, type QuadrantProps, type QuadrantCopy, type QuadrantItem, type QuadrantGroup, type QuadrantAxis }
