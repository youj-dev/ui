'use client'

import { useId, useRef, useState, type ComponentProps, type ElementType, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { ActivityIcon, CircleAlertIcon, UsersIcon } from '@youj/icons'
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from '../../components/ui/avatar'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardHeader, CardTitle } from '../../components/ui/card'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../../components/ui/empty'
import { SegmentedControl, SegmentedControlItem } from '../../components/ui/segmented-control'
import { useControllableState } from '../../hooks/use-controllable-state'
import { useVisible } from '../../hooks/use-visible'
import { cn, initials } from '../../lib/utils'
import { fold } from './feed/aggregate'
import {
  DEFAULT_COPY,
  DEMO_NOW,
  defaultFilters,
  defaultTypes,
  type ActivityFeedCopy,
  type ActivityFeedEvent,
  type ActivityFeedFilter,
  type ActivityFeedPerson,
  type ActivityFeedType,
} from './feed/data'
import { FeedList, RowSkeletons } from './feed/list'
import { useClock } from './feed/time'
import { useFeed } from './feed/use-feed'

/* A project's activity: what happened, by day, newest first, as one
 * sentence a row with what it carried under it. Repeats fold together
 * ("Mara, Theo and 3 others starred…", "Jonas pushed 5 commits"), filters
 * pick a kind (All, Comments, Changes, Code) and people. New events arrive
 * live; while you're reading (pointing, focused, scrolled down) they wait
 * behind an "N new" pill instead of pushing the rows under you. Show older
 * activity loads the next page. It's a WAI-ARIA feed: PageDown and PageUp
 * move between rows, Ctrl+End and Ctrl+Home leave it. Without `events` it
 * runs a demo whose events arrive every few seconds. Reduced motion: rows
 * appear in place. */

interface ActivityFeedProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`. Default true; `false` draws its own page around it. */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (640px at 100% scale). Default false. */
  fill?: boolean
  headingLevel?: 1 | 2 | 3
  locale?: string
  copy?: Partial<ActivityFeedCopy>
  /** The events, any order. Default: a product team's week, with new events arriving (a demo, marked). */
  events?: ActivityFeedEvent[]
  /** Your own types, or changes to the built-in ones (comment, status, priority, assign, label, commit, merge, deploy, create, star). */
  types?: Record<string, ActivityFeedType>
  /** The filters over the feed. Default: All, Comments, Changes, Code. */
  filters?: ActivityFeedFilter[]
  /** The filter on, when your app owns it; pair with `onFilterChange`. */
  filter?: string
  defaultFilter?: string
  onFilterChange?: (filter: string) => void
  /** Whether there's older activity to load. */
  hasMore?: boolean
  /** Loads the next page of older events: return them (they're appended), or pass them back in `events`. */
  onLoadMore?: () => Promise<ActivityFeedEvent[] | void> | ActivityFeedEvent[] | void
  /** Shows the Live mark. Default: true while the demo runs. */
  live?: boolean
  now?: Date | number
  loading?: boolean
  error?: ReactNode
  onRetry?: () => void
  /** Shown when there are no events at all. */
  empty?: ReactNode
  demoMarker?: boolean
  /** Renders the targets' links: your router's Link. Default `'a'`. */
  linkComponent?: ElementType
  /** Classes for its parts: `list` is the region the rows scroll in (its height, 576px at 100%, holds the card's size as filters, arrivals and older pages change what's in it). */
  classNames?: { list?: string }
}

const FALLBACK: ActivityFeedType = { icon: ActivityIcon, label: '', verb: () => '' }

function ActivityFeed({
  theme,
  embedded = true,
  fill = false,
  headingLevel,
  locale: localeProp,
  copy: copyProp,
  events: eventsProp,
  types: typesProp,
  filters: filtersProp,
  filter: filterProp,
  defaultFilter = 'all',
  onFilterChange,
  hasMore,
  onLoadMore,
  live: liveProp,
  now: nowProp,
  loading = false,
  error,
  onRetry,
  empty,
  demoMarker = true,
  linkComponent = 'a',
  classNames,
  className,
  ...rest
}: ActivityFeedProps) {
  const locale = useLocale(localeProp ?? copyProp?.locale)
  const copy: ActivityFeedCopy = { ...DEFAULT_COPY, ...copyProp, locale }
  const titleId = useId()
  const root = useRef<HTMLElement>(null)
  const visible = useVisible(root)
  const simulated = eventsProp === undefined
  const { now, read } = useClock(nowProp !== undefined ? +nowProp : simulated ? DEMO_NOW : undefined)
  const [reading, setReading] = useState({ scrolled: false, pointer: false, focus: false })
  const [filter, setFilterState] = useControllableState(filterProp, defaultFilter)
  const [people, setPeople] = useState<string[]>([])
  const feed = useFeed({
    events: eventsProp,
    read,
    live: simulated && visible && !loading,
    reading: reading.scrolled || reading.pointer || reading.focus,
    copy,
    onLoadMore,
    hasMore,
  })
  const types = { ...defaultTypes(copy), ...typesProp }
  const filters = filtersProp ?? defaultFilters(copy)
  const level = headingLevel ?? (embedded ? 2 : 1)
  const Title = (['h1', 'h2', 'h3'] as const)[level - 1]!
  const live = liveProp ?? simulated

  const chosen = filters.find((f) => f.id === filter) ?? filters[0]
  const actors = [...new Map(feed.events.map((e) => [e.actor.id, e.actor])).values()].sort((a, b) => a.name.localeCompare(b.name, locale))
  const shown = feed.events.filter(
    (e) => (!chosen || chosen.types === 'all' || chosen.types.includes(e.type)) && (!people.length || people.includes(e.actor.id)),
  )
  const rows = fold(shown, types)
  const filtered = filter !== (filters[0]?.id ?? 'all') || people.length > 0
  const setFilter = (next: string) => {
    setFilterState(next)
    onFilterChange?.(next)
  }

  const face = (person: ActivityFeedPerson) => (
    <Avatar key={person.id} size="sm" className="size-5 ring-2 ring-surface">
      {person.avatar && <AvatarImage src={person.avatar} alt="" />}
      <AvatarFallback className="text-ui-xs">{initials(person.name)}</AvatarFallback>
    </Avatar>
  )
  const picked = actors.filter((a) => people.includes(a.id))

  const none = feed.events.length === 0
  // One height for the rows, their loading shapes, the error and the empty states: filtering never resizes the card.
  const region = cn('h-144', classNames?.list)
  const body = loading ? (
    <div className={cn(region, 'overflow-hidden')}>
      <RowSkeletons count={5} label={copy.loading} />
    </div>
  ) : error ? (
    <Empty className={cn(region, 'border-0 py-10')}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleAlertIcon />
        </EmptyMedia>
        <EmptyTitle>{copy.errorTitle}</EmptyTitle>
        <EmptyDescription>{error}</EmptyDescription>
      </EmptyHeader>
      {onRetry && (
        <EmptyContent>
          <Button variant="outline" size="sm" onClick={onRetry}>
            {copy.retry}
          </Button>
        </EmptyContent>
      )}
    </Empty>
  ) : (
    <FeedList
      className={region}
      rows={rows}
      types={types}
      fallbackType={FALLBACK}
      copy={copy}
      now={now}
      titleId={titleId}
      DayHeading={(['h2', 'h3', 'h4'] as const)[level - 1]!}
      linkComponent={linkComponent}
      held={feed.held}
      onReveal={feed.reveal}
      canLoadMore={feed.canLoadMore && !filtered}
      loadingMore={feed.loadingMore}
      loadError={feed.loadError}
      onLoadMore={() => void feed.loadMore()}
      onLeaveStart={() => root.current?.querySelector<HTMLElement>('[data-slot=feed-filters] [aria-pressed=true]')?.focus()}
      onReading={(part, on) => setReading((r) => (r[part] === on ? r : { ...r, [part]: on }))}
      empty={
        none && !filtered ? (
          (empty ?? (
            <Empty className="border-0 py-10">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ActivityIcon />
                </EmptyMedia>
                <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
                <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ))
        ) : (
          <Empty className="border-0 py-10">
            <EmptyHeader>
              <EmptyTitle>{copy.noMatchesTitle}</EmptyTitle>
              <EmptyDescription>{copy.noMatchesDescription}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPeople([])
                  setFilter(filters[0]?.id ?? 'all')
                }}
              >
                {copy.clearFilters}
              </Button>
            </EmptyContent>
          </Empty>
        )
      }
    />
  )

  const card = (
    <Card className={cn('w-full gap-0 overflow-clip pb-0', !embedded && !fill && 'max-w-160', !embedded && 'shadow-lg')}>
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Title id={titleId}>{copy.title}</Title>
          {live && (
            <span data-slot="feed-live" className="inline-flex items-center gap-1.5 text-ui-sm font-normal text-fg-muted">
              <span aria-hidden className="size-1.5 rounded-full bg-success" />
              {copy.live}
            </span>
          )}
          {simulated && demoMarker && (
            <Badge variant="outline" data-slot="demo-marker" className="border-dashed border-line-strong">
              {copy.demoData}
            </Badge>
          )}
        </CardTitle>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
              {picked.length ? <AvatarGroup className="-space-x-1.5">{picked.slice(0, 3).map(face)}</AvatarGroup> : <UsersIcon size={14} />}
              <span className="max-sm:sr-only">{picked.length ? copy.peopleCount(picked.length) : copy.everyone}</span>
              <span className="sr-only">: {copy.people}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-56">
              <DropdownMenuItem onClick={() => setPeople([])}>
                <UsersIcon />
                {copy.clearPeople}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {actors.map((person) => (
                <DropdownMenuCheckboxItem
                  key={person.id}
                  checked={people.includes(person.id)}
                  onCheckedChange={(on) => setPeople((list) => (on ? [...list, person.id] : list.filter((p) => p !== person.id)))}
                  closeOnClick={false}
                >
                  {face(person)}
                  {person.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <div className="border-b border-line px-(--card-spacing) pb-3">
        <SegmentedControl variant="pill" data-slot="feed-filters" aria-label={copy.filters} value={chosen?.id} onValueChange={setFilter}>
          {filters.map((f) => (
            <SegmentedControlItem key={f.id} value={f.id}>
              {f.label}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      </div>
      {body}
      <p role="status" className="sr-only">
        {feed.message}
      </p>
    </Card>
  )

  const view = embedded ? (
    <section ref={root} aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-160', className)}>
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

export {
  ActivityFeed,
  type ActivityFeedProps,
  type ActivityFeedCopy,
  type ActivityFeedEvent,
  type ActivityFeedFilter,
  type ActivityFeedPerson,
  type ActivityFeedType,
}
