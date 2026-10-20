'use client'

import { useId, useMemo, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { useInView } from 'motion/react'
import { ThemeScope, useLocale, useYouj, type ThemeInput } from '@youj/core'
import { SearchIcon } from '@youj/icons'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { Input } from '../../components/ui/input'
import { Skeleton } from '../../components/ui/skeleton'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'
import { DEFAULT_COPY, SIDES, ROWS, type PairedBarsCopy, type PairedBarsRow, type PairedBarsSide } from './paired-bars/data'
import { makeScale, type ScaleKind } from './paired-bars/scale'
import { PairedBarsTable } from './paired-bars/table'

/* Two things side by side, row by row (two plans, two schools, two phones).
 * Every row is two bars on one axis, the numbers behind them, and optionally a
 * second figure for each side such as a price (an old figure stays beside the
 * new, struck through). The axis is log by default, so a row with a hundred
 * and one with forty thousand are both readable; `scale="linear"` draws it
 * from zero instead. Typing in the search narrows the rows by name, the bars
 * move to the new axis, and the rows under the pointer light. It shows
 * `visible` rows; View all shows every row in the same room and scrolls
 * inside it, so the card never changes size. It is a table: the numbers carry
 * each side's name, and the bars are for the eye. Built for the compact
 * layout density, taken from the page. Reduced motion: the bars land at their
 * length. */

interface PairedBarsProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (768px at 100% scale). Default false. */
  fill?: boolean
  /** The title's level. Default: 2 when embedded, else 1. */
  headingLevel?: 1 | 2 | 3
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<PairedBarsCopy>
  /** Formats the numbers and figures (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The two sides being compared, in the order of each row's `values` and `figures`. Default: the Starter and Team plans. */
  sides?: readonly [PairedBarsSide, PairedBarsSide]
  /** What is compared: a row each, with its own numbers and optional `format`. Default: a demo set of fictional models. */
  rows?: readonly PairedBarsRow[]
  /** The axis both bars share: `log` (default) or `linear`. */
  scale?: ScaleKind
  /** Intl.NumberFormat options for the numbers beside the bars, for any row without its own `format`. Default: whole numbers. */
  format?: Intl.NumberFormatOptions
  /** How many rows show before View all. Default 6. */
  visible?: number
  /** Every row shown, scrolling inside the same room (controlled). */
  expanded?: boolean
  /** Whether it opens with every row shown. Default false. */
  defaultExpanded?: boolean
  /** Called with the new state when View all or Show fewer is pressed. */
  onExpandedChange?: (expanded: boolean) => void
  /** Called with what is typed in the search. */
  onQueryChange?: (query: string) => void
  /** Content beside the search: a button, a menu. */
  actions?: ReactNode
  /** Skeletons in place of the table while your data loads. Default false. */
  loading?: boolean
  /** Shown in place of the table when it fails to load, with Retry when `onRetry` is set. Default: none. */
  error?: ReactNode
  /** Retries after an `error`. Default: none. */
  onRetry?: () => void
  /** Replaces the message when nothing matches the search or there are no rows. Default: `copy.empty` and `copy.emptyDescription`. */
  empty?: ReactNode
}

const ROW = 14
const HEAD = 10
const INTEGERS: Intl.NumberFormatOptions = { maximumFractionDigits: 0 }

function PairedBars({
  theme,
  embedded = true,
  fill = false,
  headingLevel,
  copy: copyProp,
  locale,
  sides = SIDES,
  rows = ROWS,
  scale: kind = 'log',
  format = INTEGERS,
  visible = 6,
  expanded: expandedProp,
  defaultExpanded = false,
  onExpandedChange,
  onQueryChange,
  actions,
  loading = false,
  error,
  onRetry,
  empty,
  className,
  ...rest
}: PairedBarsProps) {
  const copy: PairedBarsCopy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const k = useYouj()
  const titleId = useId()
  const Title = `h${headingLevel ?? (embedded ? 2 : 1)}` as 'h1' | 'h2' | 'h3'
  const root = useRef<HTMLElement>(null)
  const inView = useInView(root, { once: true, amount: 0.2 })
  const [expanded, setExpanded] = useControllableState(expandedProp, defaultExpanded)
  const [query, setQuery] = useState('')

  // One axis for the whole set, so searching moves the rows and never the scale.
  const scale = useMemo(
    () =>
      makeScale(
        rows.flatMap((r) => r.values),
        kind,
      ),
    [rows, kind],
  )
  const needle = query.trim().toLocaleLowerCase(copy.locale)
  const matches = needle ? rows.filter((r) => `${r.name} ${r.detail ?? ''}`.toLocaleLowerCase(copy.locale).includes(needle)) : rows
  const shownRows = expanded ? matches : matches.slice(0, visible)
  const canExpand = matches.length > visible

  // The room is the header and `visible` rows, whatever the search or the expansion.
  const room = `calc(var(--spacing) * ${HEAD + ROW * visible})`

  const toggle = () => {
    setExpanded(!expanded)
    onExpandedChange?.(!expanded)
  }

  const body = loading ? (
    <div className="flex flex-col gap-2" style={{ minHeight: room }}>
      <span className="sr-only">{copy.loading}</span>
      <Skeleton className="h-8 rounded-lg" />
      {Array.from({ length: visible }, (_, i) => (
        <Skeleton key={i} className="h-12 rounded-lg" />
      ))}
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
  ) : (
    <>
      <div className="flex items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <SearchIcon size={16} trigger="none" className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-fg-muted" />
          <Input
            type="search"
            aria-label={copy.search}
            placeholder={copy.search}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              onQueryChange?.(event.target.value)
            }}
            className="ps-9 shadow-none"
          />
        </div>
        <ul aria-hidden className="hidden items-center gap-4 text-ui-sm text-fg-muted @lg/paired-bars:flex">
          {sides.map((side, i) => (
            <li key={side.id} className="flex items-center gap-1.5">
              <span
                className="size-2 rounded-full"
                style={{ background: side.tone ? `var(--color-${side.tone})` : i === 0 ? 'var(--color-chart-2)' : 'var(--color-chart-1)' }}
              />
              {side.label}
            </li>
          ))}
        </ul>
        {actions}
      </div>
      <div
        role={expanded ? 'region' : undefined}
        aria-label={expanded ? copy.region : undefined}
        tabIndex={expanded ? 0 : undefined}
        data-slot="paired-bars-room"
        data-expanded={expanded || undefined}
        className={cn(
          'yj-scrollbar -mx-2 overflow-x-auto rounded-lg bg-inherit outline-hidden focus-ring',
          expanded ? 'overflow-y-auto' : 'overflow-y-hidden',
        )}
        style={{ height: room }}
      >
        {matches.length === 0 ? (
          (empty ?? (
            <Empty className="h-full">
              <EmptyHeader>
                <EmptyTitle>{copy.empty}</EmptyTitle>
                <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ))
        ) : (
          <PairedBarsTable
            sides={sides}
            rows={shownRows}
            scale={scale}
            kind={kind}
            copy={copy}
            format={format}
            shown={k.reduced || inView}
            reduced={k.reduced}
          />
        )}
      </div>
    </>
  )

  const card = (
    <Card className={cn('w-full overflow-hidden text-fg', !embedded && !fill && 'max-w-3xl')}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId} className="text-ui-lg font-medium">
            {copy.title}
          </Title>
        </CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent aria-busy={loading || undefined} className="@container/paired-bars flex flex-col gap-3">
        {body}
      </CardContent>
      {!loading && !error && (
        <CardFooter className="justify-between">
          <p role="status" className="text-ui-sm text-fg-muted tabular-nums">
            {copy.count(matches.length, rows.length)}
          </p>
          {canExpand && (
            <Button variant="ghost" size="sm" aria-expanded={expanded} onClick={toggle}>
              {expanded ? copy.showFewer : copy.viewAll(matches.length)}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  )

  const view = embedded ? (
    <section ref={root} aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-3xl', className)}>
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

export { PairedBars, type PairedBarsProps }
export type { PairedBarsBadge, PairedBarsCopy, PairedBarsFigure, PairedBarsRow, PairedBarsSide } from './paired-bars/data'
export type { ScaleKind } from './paired-bars/scale'
