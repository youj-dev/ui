'use client'

import { useEffect, useId, useMemo, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { ChevronRightIcon } from '@youj/icons'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { Skeleton } from '../../components/ui/skeleton'
import { StatValue } from '../../components/ui/stat-card'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, numberFormat } from '../../lib/utils'
import { DEFAULT_COPY, ITEMS, type BreakdownCopy, type BreakdownItem } from './breakdown/data'
import { Donut } from './breakdown/donut'
import { List } from './breakdown/list'
import { build, find, trail, type Node } from './breakdown/tree'

/* How a total splits, and what each part holds. A ring and a ranked bar
 * list show one level, largest first, the tail past the top five folded
 * into Other; pointing at a part in either lights it in both, and the ring's
 * hole rolls to its figure and share. Press a part that has parts of its
 * own (Other too) and the ring zooms into it: the part opens round the
 * ring, its neighbours slip out at the top and its own parts fade in where
 * they lie inside it, while the list's rows rise in. The breadcrumb, or
 * Escape in the list, goes back up, and the ring runs the same move in
 * reverse; it is one animated window over the whole tree, so a reversal
 * mid-flight continues from where it is. Each part carries its change on
 * the period before. Feed it `items` (each with `children` to drill into)
 * and `format`; the level shown is `path` (with `onPathChange`), and a
 * last-level part calls `onItemSelect`. Every string is in `copy`. It lays
 * out by its own width: the ring above the list, beside it from 32rem.
 * Built for the compact layout density, taken from the page; embedded, it
 * keeps its natural width unless `fill`. Reduced motion: levels swap in
 * place. */

interface BreakdownProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (672px at 100% scale). Default false. */
  fill?: boolean
  /** The title's level. Default: 2 when embedded, else 1. */
  headingLevel?: 1 | 2 | 3
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<BreakdownCopy>
  /** Formats every figure (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The parts of the total, each with its own `children` to drill into. Default: the demo's revenue by region, country and plan. */
  items?: BreakdownItem[]
  /** How many parts a level shows before the rest fold into Other. Default 5. */
  top?: number
  /** Intl.NumberFormat options for every figure. Default: compact US dollars to three digits with the demo's data, else compact numbers. */
  format?: Intl.NumberFormatOptions
  /** The level shown, as the ids from the top down (`other` for a folded rest), controlled: pair it with `onPathChange`. */
  path?: string[]
  /** The level shown first, uncontrolled. Default: the top. */
  defaultPath?: string[]
  /** Called with the path after a zoom in or out. */
  onPathChange?: (path: string[]) => void
  /** A last-level part is pressed (it has no parts to open). Default: those parts aren't buttons. */
  onItemSelect?: (item: BreakdownItem, path: string[]) => void
  /** Skeletons in place of the ring and the list while your data loads. Default false. */
  loading?: boolean
  /** Shown in place of the breakdown when it fails to load, with Retry when `onRetry` is set. Default: none. */
  error?: ReactNode
  /** Retries after an `error`. Default: none. */
  onRetry?: () => void
  /** Replaces the message when there's nothing to split. Default: `copy.empty` and `copy.emptyDescription`. */
  empty?: ReactNode
}

const COMPACT: Intl.NumberFormatOptions = { notation: 'compact', maximumSignificantDigits: 3 }
const DEMO_FORMAT: Intl.NumberFormatOptions = { style: 'currency', currency: 'USD', notation: 'compact', maximumSignificantDigits: 3 }

function Breakdown({
  theme,
  embedded = true,
  fill = false,
  headingLevel,
  copy: copyProp,
  locale,
  items: itemsProp,
  top = 5,
  format: formatProp,
  path: pathProp,
  defaultPath = [],
  onPathChange,
  onItemSelect,
  loading = false,
  error,
  onRetry,
  empty,
  className,
  ...rest
}: BreakdownProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const titleId = useId()
  const Title = `h${headingLevel ?? (embedded ? 2 : 1)}` as 'h1' | 'h2' | 'h3'
  const { announce, announcer } = useAnnouncer()
  const items = itemsProp ?? ITEMS
  const format = formatProp ?? (itemsProp === undefined ? DEMO_FORMAT : COMPACT)
  const [path, setPath] = useControllableState(pathProp, defaultPath)
  const [hovered, setHovered] = useState<string | null>(null)

  const root = useMemo(() => build(items, top, copy.all, copy.other), [items, top, copy.all, copy.other])
  const focus = find(root, path)
  const crumbs = trail(focus)
  const figure = useMemo(() => numberFormat(copy.locale, format).format, [copy.locale, format])
  const percent = numberFormat(copy.locale, { style: 'percent', maximumFractionDigits: 1 })
  const lit = focus.children.find((c) => c.key === hovered)

  // After a zoom from the keyboard, focus lands in the new level: its first row going in, the row you came from going out.
  const list = useRef<HTMLDivElement>(null)
  const land = useRef<string | null>(null)
  useEffect(() => {
    const key = land.current
    land.current = null
    if (key === null) return
    const rows = [...(list.current?.querySelectorAll<HTMLElement>('[data-slot=breakdown-list] [data-yj-key]') ?? [])]
    ;(rows.find((row) => row.dataset.yjKey === key) ?? rows.find((row) => row.tagName === 'BUTTON'))?.focus()
  }, [focus.key])

  const go = (node: Node, from?: Node) => {
    const within = list.current?.parentElement?.contains(document.activeElement) ?? false
    land.current = within ? (from?.key ?? '') : null
    setPath(node.path)
    setHovered(null)
    onPathChange?.(node.path)
    announce(copy.opened(node.parent ? node.label : copy.all, figure(node.value), node.children.length))
  }
  const open = (node: Node) => node.children.length > 0 && go(node)
  const up = (to: Node) => go(to, crumbs[crumbs.indexOf(to) + 1])

  const share = (node: Node) => percent.format(node.value / (focus.value || 1))
  const center = (
    <div className="flex min-w-0 flex-col items-center gap-0.5">
      <StatValue value={lit?.value ?? focus.value} format={format} locale={copy.locale} size="sm" />
      <span className="max-w-full truncate text-ui-xs text-fg-muted">{lit ? `${lit.label} · ${share(lit)}` : focus.parent ? focus.label : copy.total}</span>
    </div>
  )

  // The loading shapes take the room of what they stand for: the path, then the ring beside the list's height.
  const body = loading ? (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-5 w-24 rounded-md" />
      <div className="grid items-center gap-x-8 gap-y-5 @lg/breakdown:grid-cols-[--spacing(44)_minmax(0,1fr)]">
        <span className="sr-only">{copy.loading}</span>
        <Skeleton className="mx-auto aspect-square w-44 rounded-full" />
        <div className="flex h-56 flex-col justify-center gap-2">
          {[0.9, 0.7, 0.55, 0.4, 0.3].map((w) => (
            <Skeleton key={w} className="h-7 rounded-md" style={{ width: `${w * 100}%` }} />
          ))}
        </div>
      </div>
    </div>
  ) : error ? (
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
  ) : root.children.length === 0 ? (
    (empty ?? (
      <Empty className="rounded-lg border border-dashed border-line">
        <EmptyHeader>
          <EmptyTitle>{copy.empty}</EmptyTitle>
          <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    ))
  ) : (
    <div className="flex flex-col gap-4">
      <nav aria-label={copy.path}>
        <ol className="flex min-w-0 flex-wrap items-center gap-0.5 text-ui-sm">
          {crumbs.map((node, i) => (
            <li key={node.key} className="flex min-w-0 items-center gap-0.5">
              {i < crumbs.length - 1 ? (
                <button type="button" onClick={() => up(node)} className="truncate rounded-sm px-1 text-fg-muted outline-hidden transition-colors yj-duration-fast ease-standard hover:text-fg focus-ring">
                  {node.parent ? node.label : copy.all}
                </button>
              ) : (
                <span aria-current="location" className="truncate px-1 font-medium text-fg">
                  {node.parent ? node.label : copy.all}
                </span>
              )}
              {i < crumbs.length - 1 && <ChevronRightIcon size={13} trigger="none" className="shrink-0 text-fg-subtle rtl:-scale-x-100" />}
            </li>
          ))}
        </ol>
      </nav>
      <div ref={list} className="grid items-center gap-x-8 gap-y-5 @lg/breakdown:grid-cols-[--spacing(44)_minmax(0,1fr)]">
        <Donut focus={focus} hovered={hovered} onHover={setHovered} onOpen={open} className="mx-auto w-44 @lg/breakdown:w-full">
          {center}
        </Donut>
        {/* Every level's rows share one height (five rows at 100%), so drilling in or out never resizes the card. */}
        <div className="yj-scrollbar -m-1 h-58.25 overflow-y-auto p-1">
          <List
            focus={focus}
            hovered={hovered}
            onHover={setHovered}
            onOpen={open}
            onUp={() => focus.parent && up(focus.parent)}
            onSelect={onItemSelect ? (node) => node.item && onItemSelect(node.item, node.path) : undefined}
            figure={figure}
            copy={copy}
          />
        </div>
      </div>
    </div>
  )

  const card = (
    <Card className={cn('w-full gap-4 text-fg', !embedded && !fill && 'max-w-168')}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent aria-busy={loading || undefined} className="@container/breakdown">
        {body}
      </CardContent>
      {announcer}
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-168', className)}>
      {card}
    </section>
  ) : (
    <main aria-labelledby={titleId} {...rest} className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}>
      {card}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export { Breakdown, type BreakdownProps, type BreakdownCopy, type BreakdownItem }
