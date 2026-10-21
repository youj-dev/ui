'use client'

import { useId, useMemo, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { FolderIcon, PlusIcon, SearchIcon } from '@youj/icons'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardHeader, CardTitle } from '../../components/ui/card'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../../components/ui/empty'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Skeleton } from '../../components/ui/skeleton'
import { cn, relativeTimeFormat } from '../../lib/utils'
import { DEFAULT_COPY, DEMO_NOW, PROJECTS, STATUSES, type PreviewListCopy, type PreviewListItem, type PreviewListLook, type PreviewListSort, type PreviewListStatus } from './preview-list/data'
import { PreviewRow, type PreviewListView } from './preview-list/row'
import { LOOKS } from './preview-list/thumb'

/* A list of things with a preview (the demo: a workspace's projects): a search,
 * a sort and a create button over a list of rows. Each row is a picture (a
 * drawn placeholder in one of your `looks` unless the item brings its own
 * `thumbnail`), its name and status, where to find it, who created it and
 * when, and its latest activity (the demo's: branch, short hash, message),
 * with Details as the one primary action and Visit, Activity and Settings as
 * icon buttons. Search looks through names, locations, labels, references,
 * messages and creators; sort is latest activity, name or newest.
 * The list scrolls inside a card of one height, so searching never resizes it.
 * Times are relative to `now`. Wire `onCreate` and `onOpen` to your router.
 * It is built for the compact layout density (ui.css), taken from the page;
 * embedded too, it stops at its natural width unless `fill`. */

interface PreviewListProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the card in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (1024px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the card's strings, to rewrite or translate. */
  copy?: Partial<PreviewListCopy>
  /** Formats the relative times (BCP 47). Default: the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The items, in any order: the sort places them. */
  items?: PreviewListItem[]
  /** The values `status` can hold, with their dot. Default: live, building, failed, paused. */
  statuses?: PreviewListStatus[]
  /** The pages the placeholder picture can draw. Default: landing page, docs, dashboard, store. */
  looks?: PreviewListLook[]
  /** The icon before an item's locations. Default: a globe. */
  locationIcon?: ReactNode
  /** The icon before an item's latest activity. Default: a branch. */
  latestIcon?: ReactNode
  /** The moment relative times count to (a date, a date-time string or a timestamp). Default: a fixed demo moment. */
  now?: Date | string | number
  /** How it opens. Default 'activity'. */
  defaultSort?: PreviewListSort
  /** Called with the new sort after every change. */
  onSortChange?: (sort: PreviewListSort) => void
  /** Called by Create project. */
  onCreate?: () => void
  /** Called by Details, Activity and Settings, with the item and which one. */
  onOpen?: (project: PreviewListItem, view: PreviewListView) => void
  /** Shows skeleton rows in the list's place. */
  loading?: boolean
  /** A message in place of the list when loading failed. */
  error?: ReactNode
  /** Called by the error's Try again. */
  onRetry?: () => void
  /** Replaces the empty state shown when there are no projects. */
  empty?: ReactNode
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 86400],
  ['month', 30 * 86400],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
]

const time = (value: Date | string | number) => new Date(value).getTime()

function PreviewList({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  locale: localeProp,
  items = PROJECTS,
  statuses = STATUSES,
  looks = LOOKS,
  locationIcon,
  latestIcon,
  now = DEMO_NOW,
  defaultSort = 'activity',
  onSortChange,
  onCreate,
  onOpen,
  loading = false,
  error,
  onRetry,
  empty,
  className,
  ...rest
}: PreviewListProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const locale = useLocale(localeProp)
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<PreviewListSort>(defaultSort)

  const relative = useMemo(() => relativeTimeFormat(locale, { numeric: 'auto', style: 'short' }), [locale])
  const ago = (iso: string) => {
    const seconds = Math.round((time(iso) - time(now)) / 1000)
    const [unit, size] = UNITS.find(([, s]) => Math.abs(seconds) >= s) ?? ['minute', 60]
    return relative.format(Math.round(seconds / size), unit)
  }

  const sorters: Record<PreviewListSort, (a: PreviewListItem, b: PreviewListItem) => number> = {
    activity: (a, b) => time(b.latest.at) - time(a.latest.at),
    name: (a, b) => a.name.localeCompare(b.name, locale),
    created: (a, b) => time(b.createdAt) - time(a.createdAt),
  }
  const needle = query.trim().toLowerCase()
  const shown = items
    .filter((p) => !needle || [p.name, ...p.locations, p.createdBy.name, p.latest.label, p.latest.ref, p.latest.message].some((text) => text.toLowerCase().includes(needle)))
    .sort(sorters[sort])
  const sorts = [
    { value: 'activity', label: copy.sortActivity },
    { value: 'name', label: copy.sortName },
    { value: 'created', label: copy.sortCreated },
  ]
  const open = (project: PreviewListItem, view: PreviewListView) => onOpen?.(project, view)

  const card = (
    <Card data-slot="preview-list" className={cn('@container w-full gap-0 overflow-hidden py-0 text-fg', !embedded && !fill && 'max-w-5xl')}>
      <CardHeader className="pt-(--card-spacing) pb-(--ui--panel-y)">
        <CardTitle className="flex items-baseline gap-2">
          <Title id={titleId}>{copy.title}</Title>
          <span className="text-ui font-normal text-fg-muted tabular-nums">{copy.count(shown.length, items.length)}</span>
        </CardTitle>
        <CardAction className="flex flex-wrap items-center justify-end gap-2 self-center">
          <InputGroup className="w-full @xl:w-56">
            <InputGroupAddon>
              <SearchIcon aria-hidden size={16} />
            </InputGroupAddon>
            <InputGroupInput type="search" aria-label={copy.searchLabel} placeholder={copy.searchPlaceholder} value={query} onChange={(event) => setQuery(event.target.value)} />
          </InputGroup>
          <Select
            items={sorts}
            value={sort}
            onValueChange={(value) => {
              setSort(value as PreviewListSort)
              onSortChange?.(value as PreviewListSort)
            }}
          >
            <SelectTrigger variant="soft" aria-label={copy.sortLabel} className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sorts.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => onCreate?.()}>
            <PlusIcon size={16} />
            {copy.create}
          </Button>
        </CardAction>
      </CardHeader>

      {/* One height whatever the list holds: it scrolls here, and the empty states take the same room. */}
      <div className="h-120 overflow-y-auto border-t border-line px-(--ui--panel-x) yj-scrollbar">
        {loading ? (
          <div aria-busy className="flex flex-col divide-y divide-line">
            <span className="sr-only">{copy.loading}</span>
            {[0, 1, 2].map((i) => (
              <div key={i} className="grid grid-cols-[--spacing(28)_minmax(0,1fr)] gap-x-4 py-4 @2xl:grid-cols-[--spacing(44)_minmax(0,1fr)]">
                <Skeleton className="aspect-[176/104] w-full rounded-lg" />
                <div className="flex flex-col gap-2.5 pt-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-56" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <Empty className="h-full">
            <EmptyHeader>
              <EmptyTitle>{error}</EmptyTitle>
            </EmptyHeader>
            {onRetry && (
              <EmptyContent>
                <Button variant="secondary" onClick={onRetry}>
                  {copy.retry}
                </Button>
              </EmptyContent>
            )}
          </Empty>
        ) : items.length === 0 ? (
          (empty ?? (
            <Empty className="h-full">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FolderIcon />
                </EmptyMedia>
                <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
                <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ))
        ) : shown.length === 0 ? (
          <Empty className="h-full">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchIcon />
              </EmptyMedia>
              <EmptyTitle>{copy.noMatchTitle}</EmptyTitle>
              <EmptyDescription>{copy.noMatchDescription(query.trim())}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {shown.map((project) => (
              <PreviewRow key={project.id} Heading={embedded ? 'h3' : 'h2'} project={project} copy={copy} statuses={statuses} looks={looks} locationIcon={locationIcon} latestIcon={latestIcon} ago={ago} onOpen={open} />
            ))}
          </ul>
        )}
      </div>
    </Card>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-5xl', className)}>
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

export { PreviewList, type PreviewListProps }
export type { PreviewListCopy, PreviewListItem, PreviewListLook, PreviewListSort, PreviewListStatus, PreviewListView }
