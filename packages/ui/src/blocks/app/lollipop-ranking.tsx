'use client'

import { useId, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { SearchIcon } from '@youj/icons'
import { Alert, AlertAction, AlertDescription } from '../../components/ui/alert'
import { Badge, BadgeDot } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../components/ui/empty'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Skeleton } from '../../components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, dateTimeFormat, numberFormat } from '../../lib/utils'
import { RankingChart } from './lollipop-ranking/ranking-chart'
import {
  DEFAULT_COPY,
  ITEMS,
  STATUSES,
  UPDATED,
  demo,
  statusOf,
  type LollipopRankingAlert,
  type LollipopRankingCopy,
  type LollipopRankingItem,
  type LollipopRankingStatus,
  type LollipopRankingTone,
} from './lollipop-ranking/data'
import { RankingTable } from './lollipop-ranking/ranking-table'

/* Where a set of things stands against a line, ranked: error budgets, school
 * attendance, supplier ratings. The items as a table (name over its detail,
 * target and period; owner; 90 days as a sparkline in the status ink; the
 * value, signed and sortable; when it crosses the line; the alert), with
 * status tabs that count each status, a search and a group filter. Beside it,
 * the index: every item as a dot on a stem from zero, sorted from the lowest
 * to the highest, in its status ink. Picking a row picks its
 * dot and the other way round (`value`, `onValueChange`); the panel names the
 * picked item with its value, target, period and owner. The head counts the
 * items, those in the first status and the raised alerts; the foot what is
 * shown and when the figures were updated, with Open (`onOpen`) and New
 * (`onCreate`). Loading holds the table and the index as skeletons, and an
 * error with Retry or the empty message sits over them, at their own size.
 * The table scrolls in a region of fixed height, so filtering never resizes
 * the card; a narrow card folds columns and puts the index under the table.
 * Embedded, it stops at its natural width unless `fill`.
 * Reduced motion: the stems and dots are drawn in place. */

interface LollipopRankingProps extends Omit<ComponentProps<'section'>, 'children' | 'title' | 'defaultValue'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (1152px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<LollipopRankingCopy>
  /** Formats values, targets, days and the update time (BCP 47). Default: the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The ranked items. */
  items?: LollipopRankingItem[]
  /** The bands an item can fall in, from the lowest value up: each with its label, color and where it ends. Default: Exhausted, At risk, Healthy. */
  statuses?: LollipopRankingStatus[]
  /** The index's scale, as the lowest and highest value. Default [-1, 1]. */
  domain?: readonly [number, number]
  /** When the figures were updated, an ISO date-time, shown in UTC. */
  updatedAt?: string
  /** The picked item's id, when your app owns it; pair with `onValueChange`. */
  value?: string | null
  /** The item picked at first. Default: the lowest. */
  defaultValue?: string | null
  onValueChange?: (id: string | null) => void
  /** Opens the picked item. */
  onOpen?: (id: string) => Promise<unknown> | unknown
  /** Starts a new item. */
  onCreate?: () => Promise<unknown> | unknown
  /** Skeletons in place of the table and the index while your data loads. Default false. */
  loading?: boolean
  /** Shown over the table and the index when they fail to load, with Retry when `onRetry` is set. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** Replaces the message when there are no items. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
}

function LollipopRanking({
  theme,
  embedded = true,
  fill = false,
  className,
  copy: copyProp,
  locale: localeProp,
  items = ITEMS,
  statuses = STATUSES,
  domain = [-1, 1],
  updatedAt = UPDATED,
  value: valueProp,
  defaultValue,
  onValueChange,
  onOpen,
  onCreate,
  loading = false,
  error,
  onRetry,
  empty,
  ...rest
}: LollipopRankingProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const Section = embedded ? 'h3' : 'h2'
  const lowest = [...items].sort((a, b) => a.value - b.value)[0]?.id ?? null
  const [selected, setSelected] = useControllableState(valueProp, defaultValue === undefined ? lowest : defaultValue)
  const [filter, setFilter] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('all')
  const [sort, setSort] = useState<'ascending' | 'descending'>('ascending')

  const count = numberFormat(locale)
  const filters = ['all', ...statuses.map((st) => st.id)]
  const idOf = (item: LollipopRankingItem) => statusOf(item, statuses)?.id
  const groups = [...new Set(items.map((item) => item.group))].sort()
  const needle = query.trim().toLocaleLowerCase(locale)
  const matching = items.filter(
    (item) => (group === 'all' || item.group === group) && (!needle || `${item.name} ${item.detail}`.toLocaleLowerCase(locale).includes(needle)),
  )
  const counts = Object.fromEntries(
    filters.map((f) => [f, f === 'all' ? matching.length : matching.filter((item) => idOf(item) === f).length]),
  ) as Record<string, number>
  const shown = matching
    .filter((item) => filter === 'all' || idOf(item) === filter)
    .sort((a, b) => (sort === 'ascending' ? a.value - b.value : b.value - a.value))
  const flagged = items.filter((item) => idOf(item) === statuses[0]?.id).length
  const raised = items.filter((item) => item.alert === 'raised').length
  const muted = items.filter((item) => item.alert === 'muted').length
  const updated = dateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'UTC',
  }).format(new Date(updatedAt))
  const covered = loading || !!error || items.length === 0
  const figure = (value: string, width = 'w-6') =>
    loading ? <Skeleton className={cn('inline-block h-4 align-middle', width)} /> : error ? '—' : value

  const select = (id: string) => {
    setSelected(id)
    onValueChange?.(id)
  }

  const card = (
    <Card className={cn('w-full overflow-hidden text-fg', !embedded && !fill && 'max-w-6xl')}>
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription className="tabular-nums">
          {loading ? (
            <Skeleton className="inline-block h-4 w-32 align-middle" />
          ) : error ? (
            '—'
          ) : (
            copy.summary(count.format(items.length), count.format(flagged))
          )}
        </CardDescription>
        {!loading && !error && raised > 0 && (
          <CardAction>
            <Badge variant="danger" className="tabular-nums">
              <BadgeDot />
              {copy.raised(count.format(raised))}
            </Badge>
          </CardAction>
        )}
      </CardHeader>

      <CardContent className="@container/lr">
        <Tabs value={filter} onValueChange={(next) => setFilter(next as string)} className="gap-4">
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
            <TabsList aria-label={copy.filters} className="max-w-full overflow-x-auto yj-scrollbar">
              {filters.map((f) => (
                <TabsTrigger key={f} value={f}>
                  {f === 'all' ? copy.all : statuses.find((st) => st.id === f)?.label}
                  <Badge variant="secondary" size="sm" className="tabular-nums">
                    {figure(count.format(counts[f] ?? 0), 'w-3')}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="flex w-full flex-wrap items-center gap-2 @2xl/lr:w-auto">
              <InputGroup className="h-control-sm min-w-0 flex-1 @2xl/lr:w-60 @2xl/lr:flex-none">
                <InputGroupAddon>
                  <SearchIcon />
                </InputGroupAddon>
                <InputGroupInput
                  type="search"
                  aria-label={copy.search}
                  placeholder={copy.searchPlaceholder}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </InputGroup>
              <Select
                items={[{ value: 'all', label: copy.allGroups }, ...groups.map((t) => ({ value: t, label: t }))]}
                value={group}
                onValueChange={(next) => next && setGroup(next as string)}
              >
                <SelectTrigger size="sm" aria-label={copy.group}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="all">{copy.allGroups}</SelectItem>
                  {groups.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {/* One panel, the current tab's: the table and the index filter in place, so the card never resizes. */}
          <div className="relative">
            <TabsContent
              value={filter}
              aria-hidden={covered || undefined}
              inert={covered || undefined}
              className={cn(
                'grid gap-5 @4xl/lr:grid-cols-[minmax(0,1fr)_calc(var(--spacing)*88)] @4xl/lr:gap-0',
                covered && 'invisible',
                items.length === 0 && 'min-h-120',
              )}
            >
              <div className="min-w-0 @4xl/lr:pe-5">
                <RankingTable
                  items={shown}
                  statuses={statuses}
                  selected={selected}
                  onSelect={select}
                  sort={sort}
                  onSortChange={setSort}
                  copy={copy}
                  locale={locale}
                />
              </div>
              <div className="min-w-0 border-t border-line pt-5 @4xl/lr:h-120 @4xl/lr:border-s @4xl/lr:border-t-0 @4xl/lr:ps-5 @4xl/lr:pt-0">
                <RankingChart
                  items={shown}
                  statuses={statuses}
                  domain={domain}
                  selected={selected}
                  onSelect={select}
                  copy={copy}
                  locale={locale}
                  heading={Section}
                />
              </div>
            </TabsContent>
            {loading && (
              <div className="pointer-events-none absolute inset-0 grid gap-5 @4xl/lr:grid-cols-[minmax(0,1fr)_calc(var(--spacing)*88)] @4xl/lr:gap-0">
                <span className="sr-only">{copy.loadingLabel}</span>
                <div className="flex min-w-0 flex-col @4xl/lr:pe-5">
                  <Skeleton className="mb-3 h-3 w-full" />
                  {Array.from({ length: 8 }, (_, i) => (
                    <div key={i} className="flex h-13 shrink-0 items-center gap-4 border-t border-line py-2">
                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <Skeleton className="h-3.5 w-3/5" />
                        <Skeleton className="h-3 w-2/5" />
                      </div>
                      <Skeleton className="hidden size-6 shrink-0 rounded-full @2xl/lr:block" />
                      <Skeleton className="hidden h-6 w-28 shrink-0 @lg/lr:block" />
                      <Skeleton className="h-4 w-12 shrink-0" />
                    </div>
                  ))}
                </div>
                <div className="flex min-w-0 flex-col gap-3 border-t border-line pt-5 @4xl/lr:h-120 @4xl/lr:border-s @4xl/lr:border-t-0 @4xl/lr:ps-5 @4xl/lr:pt-0">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-4 w-4/5" />
                  <div className="flex min-h-56 flex-1 flex-col justify-between py-2">
                    {Array.from({ length: 9 }, (_, i) => (
                      <div key={i} className="flex h-3 items-center">
                        <Skeleton
                          className="h-0.5 rounded-full"
                          style={{ width: `${20 + ((i * 37) % 55)}%`, marginInlineStart: `${i < 4 ? 10 : 45}%` }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {!loading && error && (
              <div className="absolute inset-0 grid place-items-center">
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
            )}
            {!loading && !error && items.length === 0 && (
              <div className="absolute inset-0 grid">
                {empty ?? (
                  <Empty className="rounded-lg border border-dashed border-line">
                    <EmptyHeader>
                      <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
                      <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </div>
            )}
          </div>
        </Tabs>
      </CardContent>

      <CardFooter className="flex-wrap justify-between gap-3">
        <span className="tabular-nums">
          {loading ? (
            <Skeleton className="inline-block h-4 w-64 align-middle" />
          ) : error ? (
            '—'
          ) : (
            <>
              {copy.showing(count.format(shown.length), count.format(items.length), count.format(muted))} · {copy.updated(updated)}
            </>
          )}
        </span>
        <div className="ms-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={covered || !selected}
            onClick={() => selected && (onOpen ? onOpen(selected) : demo('LollipopRanking: onOpen', 0))}
          >
            {copy.open}
          </Button>
          <Button size="sm" disabled={loading} onClick={() => (onCreate ? onCreate() : demo('LollipopRanking: onCreate', 0))}>
            {copy.create}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-6xl', className)}>
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

export { LollipopRanking, type LollipopRankingProps }
export type { LollipopRankingAlert, LollipopRankingCopy, LollipopRankingItem, LollipopRankingStatus, LollipopRankingTone }
