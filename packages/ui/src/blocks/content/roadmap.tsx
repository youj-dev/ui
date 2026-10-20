'use client'

import { useId, useMemo, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Counter, Reveal } from '@youj/motion'
import { FilterIcon, LightbulbIcon, PlusIcon } from '@youj/icons'
import { AppPage } from '../../components/ui/app-page'
import { Button, buttonVariants } from '../../components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../../components/ui/empty'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { toast, Toaster } from '../../components/ui/toast'
import { ToggleGroup, ToggleGroupItem } from '../../components/ui/toggle-group'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn } from '../../lib/utils'
import { RoadmapContext } from './roadmap/context'
import { CATEGORIES, ME, REQUESTS, ROADMAP_COPY, sortRequests, TODAY, votesLabel, demo, type Category, type Comment, type RoadmapCopy, type RoadmapRequest, type Sort, type Status } from './roadmap/data'
import { RequestList } from './roadmap/request-list'
import { RequestSheet } from './roadmap/request-sheet'
import { RoadmapBoard } from './roadmap/roadmap-board'
import { SubmitDialog } from './roadmap/submit-dialog'

/* Relay's public roadmap and feature-request board. Requests list with an
 * upvote on each row: pressing it fills the key with the accent, lifts the
 * arrow and rolls the count (Counter), and a polite live region says the new
 * count. Votes never re-sort the list under your cursor; only a sort or filter
 * change does, and rows glide to their new slots (PresenceList). Filter by
 * status and area, sort by Trending, Top or New. A row opens a Sheet with the
 * request, its vote, a status history (Timeline) and comments with a
 * composer. "Submit a request" opens a Dialog that surfaces similar requests
 * as you type, so you can vote instead of posting a duplicate. The Roadmap tab
 * lays Planned, In progress and Shipped side by side, read-only, and its
 * cards arrive through PresenceList each time it opens. Reduced motion: votes,
 * lists and views change in place.
 *
 * Pass your `requests`, `categories` and `brand`, and keep your feedback
 * store in step through `onVote`, `onSubmit` and `onComment`; every string
 * is in `copy`. */


type View = 'requests' | 'roadmap'
type StatusFilter = 'all' | Status
type CategoryFilter = 'all' | Category

/** What `onSubmit` receives. */
interface RoadmapDraft {
  title: string
  body: string
  category: Category
}

interface RoadmapProps extends Omit<ComponentProps<'div'>, 'children' | 'onSubmit'> {
  /** A theme to force on the block. Default: none, so it inherits the app's (YoujProvider or a ThemeScope around it). */
  theme?: ThemeInput
  /** A page in your app's frame: the shared page header (AppPage) and the frame's gutter, with no top bar or eyebrow of its own (Submit a request moves to the header's actions). Default true; `false` draws its own page (the top bar and a centered canvas). */
  embedded?: boolean
  /** The requests to show. Default: Relay's board. Pass [] for the empty board. */
  requests?: readonly RoadmapRequest[]
  /** The view, controlled: pair it with `onViewChange`. */
  view?: View
  /** The view it opens on, when the page owns it. Default 'requests'. */
  defaultView?: View
  onViewChange?: (view: View) => void
  /** The areas, key to name; a request's `category` is a key. Default: Relay's five. */
  categories?: Record<string, string>
  /** The requests the reader has already voted for. Default: none. */
  defaultVoted?: string[]
  /** Saves a vote (`true`) or its removal (`false`). */
  onVote?: (request: RoadmapRequest, voted: boolean) => void
  /** Posts a new request; reject to keep the dialog open. Default: a short demo wait. Without it, a toast confirms the post. */
  onSubmit?: (draft: RoadmapDraft) => Promise<unknown> | unknown
  /** Posts a comment; reject to keep the draft. Default: a short demo wait. */
  onComment?: (request: RoadmapRequest, body: string) => Promise<unknown> | unknown
  /** The product in the top bar: `{ name, logo? }`. Default: Relay. */
  brand?: { name: string; logo?: ReactNode }
  /** The changelog link in the top bar; `null` hides it. Default '#changelog'. */
  changelogHref?: string | null
  /** The signed-in reader's name, on what they post. Default 'You'. */
  viewer?: string
  /** Today, as YYYY-MM-DD: new posts' date, and which dates drop their year. Default: the demo's day. */
  today?: string
  /** A BCP 47 locale for dates and counts. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale?: string
  /** Any of the board's strings, to rewrite or translate. */
  copy?: Partial<RoadmapCopy>
}

function Roadmap({
  theme,
  embedded = true,
  requests: initial = REQUESTS,
  view: viewProp,
  defaultView = 'requests',
  onViewChange,
  categories = CATEGORIES,
  defaultVoted,
  onVote,
  onSubmit,
  onComment = () => demo('Roadmap: onComment', 500),
  brand = { name: 'Relay' },
  changelogHref = '#changelog',
  viewer = ME,
  today = TODAY,
  locale: localeProp,
  copy: copyProp,
  className,
  ...rest
}: RoadmapProps) {
  const locale = useLocale(localeProp)
  const copy = useMemo(() => ({ ...ROADMAP_COPY, ...copyProp }), [copyProp])
  const settings = useMemo(() => ({ copy, categories, locale, viewer, today }), [copy, categories, locale, viewer, today])
  const titleId = useId()
  const [requests, setRequests] = useState<RoadmapRequest[]>(() => [...initial])
  const [voted, setVoted] = useState<Set<string>>(() => new Set(defaultVoted))
  const [view, setOwnedView] = useControllableState(viewProp, defaultView)
  const setView = (next: View) => (setOwnedView(next), onViewChange?.(next))
  const statusItems = { all: copy.allStatuses, ...copy.status } as Record<StatusFilter, string>
  const categoryItems: Record<CategoryFilter, string> = { all: copy.allAreas, ...categories }
  const [status, setStatus] = useState<StatusFilter>('all')
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [sort, setSort] = useState<Sort>('trending')
  const [openId, setOpenId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [fresh, setFresh] = useState<string>()
  const { announce, announcer } = useAnnouncer()

  const countOf = (r: RoadmapRequest) => r.votes + (voted.has(r.id) ? 1 : 0)
  const total = requests.reduce((sum, r) => sum + countOf(r), 0)
  const shipped = requests.filter((r) => r.status === 'shipped').length
  const shown = sortRequests(
    requests.filter((r) => (status === 'all' || r.status === status) && (category === 'all' || r.category === category)),
    sort,
  )
  const selected = requests.find((r) => r.id === openId) ?? null

  const vote = (r: RoadmapRequest, next: boolean) => {
    setVoted((set) => {
      const copy = new Set(set)
      if (next) copy.add(r.id)
      else copy.delete(r.id)
      return copy
    })
    const n = r.votes + (next ? 1 : 0)
    announce((next ? copy.upvoted : copy.unvoted)(r.title, votesLabel(n, copy, locale)))
    onVote?.(r, next)
  }

  const open = (r: RoadmapRequest) => {
    setOpenId(r.id)
    setSheetOpen(true)
  }

  const clearFilters = () => {
    setStatus('all')
    setCategory('all')
  }

  const submit = async (draft: RoadmapDraft) => {
    await (onSubmit ? onSubmit(draft) : demo('Roadmap: onSubmit', 700))
    const id = `rq-${Date.now().toString(36)}`
    setRequests((list) => [
      { id, title: draft.title, body: draft.body || copy.noDetails, category: draft.category, status: 'review', votes: 0, recent: 0, author: viewer, history: [{ date: today, by: viewer }], comments: [] },
      ...list,
    ])
    setVoted((set) => new Set(set).add(id))
    clearFilters()
    setSort('new')
    setView('requests')
    setFresh(id)
    if (!onSubmit) toast.success(copy.postedTitle, { description: copy.postedDescription })
  }

  const submitButton = (
    <Button onClick={() => setSubmitting(true)} className="shrink-0">
      <PlusIcon size={15} aria-hidden /> {copy.submit}
    </Button>
  )

  const noRequests = (
    <Empty className="rounded-xl border border-dashed border-line py-14">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LightbulbIcon />
        </EmptyMedia>
        <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
        <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>{submitButton}</EmptyContent>
    </Empty>
  )

  const noMatches = (
    <Empty className="rounded-xl border border-dashed border-line py-14">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FilterIcon />
        </EmptyMedia>
        <EmptyTitle>{copy.noMatchesTitle}</EmptyTitle>
        <EmptyDescription>{copy.noMatches(status === 'all' ? undefined : copy.status[status], category === 'all' ? undefined : categories[category])}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" onClick={clearFilters}>
          {copy.clearFilters}
        </Button>
      </EmptyContent>
    </Empty>
  )

  const tabs = (
    <Tabs value={view} onValueChange={(next) => setView(next as View)}>
      <TabsList aria-label={copy.view}>
        <TabsTrigger value="requests">
          {copy.requestsTab} <span className="text-fg-muted tabular-nums">{requests.length}</span>
        </TabsTrigger>
        <TabsTrigger value="roadmap">{copy.roadmapTab}</TabsTrigger>
      </TabsList>

      {/* Both views hold the requests' height at 100%: switching to the roadmap never shrinks the page. */}
      <TabsContent value="requests" className="flex min-h-415.25 flex-col gap-3 pt-1">
        {requests.length === 0 ? (
          noRequests
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <Select items={statusItems} value={status} onValueChange={(value) => value && setStatus(value as StatusFilter)}>
                <SelectTrigger size="sm" aria-label={copy.statusFilter} className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusItems).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select items={categoryItems} value={category} onValueChange={(value) => value && setCategory(value as CategoryFilter)}>
                <SelectTrigger size="sm" aria-label={copy.areaFilter} className="w-full sm:w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryItems).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ToggleGroup
                variant="segmented"
                size="sm"
                aria-label={copy.sort}
                className="col-span-2 w-full sm:ms-auto sm:w-64"
                value={[sort]}
                onValueChange={(next: unknown[]) => next[0] && setSort(next[0] as Sort)}
              >
                {Object.entries(copy.sorts).map(([value, label]) => (
                  <ToggleGroupItem key={value} value={value}>
                    {label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            {shown.length > 0 ? <RequestList requests={shown} sort={sort} voted={voted} countOf={countOf} onVote={vote} onOpen={open} fresh={fresh} /> : noMatches}
          </>
        )}
      </TabsContent>

      <TabsContent value="roadmap" className="min-h-415.25 pt-1">
        <RoadmapBoard requests={requests} countOf={countOf} onOpen={open} heading="h2" />
      </TabsContent>
    </Tabs>
  )
  const stats = (
    <p className="text-ui-sm text-fg-muted tabular-nums">
      <Counter value={total} from={total} locale={locale} inView={false} duration="base" className="font-medium text-fg" />
      {copy.stats(requests.length, shipped)}
    </p>
  )

  const content = (
    <>
      {announcer}
      <Reveal inView={false} variant="rise" className="flex flex-wrap items-end gap-x-6 gap-y-4">
        <div className="flex min-w-0 flex-1 basis-80 flex-col gap-2">
          <p className="text-ui-sm font-medium text-accent-text">{copy.eyebrow}</p>
          <h1 id={titleId} className="text-2xl font-semibold tracking-tight text-balance text-fg md:text-3xl">
            {copy.title}
          </h1>
          <p className="max-w-prose text-ui text-pretty text-fg-muted">{copy.description}</p>
          {stats}
        </div>
        {submitButton}
      </Reveal>

      {tabs}
    </>
  )

  const overlays = (
    <>
      <RequestSheet
        request={selected}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        count={selected ? countOf(selected) : 0}
        voted={selected ? voted.has(selected.id) : false}
        onVote={(next) => selected && vote(selected, next)}
        onComment={async (body) => {
          if (!selected) return
          await onComment(selected, body)
          const comment: Comment = { id: `c-${Date.now().toString(36)}`, author: viewer, body, date: today }
          setRequests((list) => list.map((r) => (r.id === selected.id ? { ...r, comments: [...r.comments, comment] } : r)))
        }}
      />
      <SubmitDialog open={submitting} onOpenChange={setSubmitting} requests={requests} voted={voted} countOf={countOf} onVote={vote} onSubmit={submit} />
      <Toaster />
    </>
  )

  if (embedded) {
    const page = (
      <RoadmapContext.Provider value={settings}>
        <AppPage {...rest} title={copy.title} description={copy.description} actions={submitButton} className={cn('text-fg', className)}>
          {announcer}
          {stats}
          {tabs}
          {overlays}
        </AppPage>
      </RoadmapContext.Provider>
    )
    return theme ? <ThemeScope theme={theme}>{page}</ThemeScope> : page
  }
  return (
    <ThemeScope theme={theme}>
      <RoadmapContext.Provider value={settings}>
        <div className={cn('min-h-dvh bg-canvas text-fg', className)} {...rest}>
          <header className="border-b border-line bg-surface">
            <div className="mx-auto flex h-14 max-w-5xl items-center gap-2.5 px-4 md:px-8">
              {brand.logo ?? (
                <span aria-hidden className="grid size-7 place-items-center rounded-md bg-accent text-ui-sm font-bold text-on-accent">
                  {brand.name.slice(0, 1)}
                </span>
              )}
              <span className="font-semibold tracking-tight">{brand.name}</span>
              <span aria-hidden className="text-fg-muted">
                /
              </span>
              <span className="truncate text-fg-muted">{copy.brandSection}</span>
              {changelogHref !== null && (
                <a href={changelogHref} className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'ms-auto' })}>
                  {copy.changelog}
                </a>
              )}
            </div>
          </header>
          <main aria-labelledby={titleId} className="mx-auto flex max-w-5xl flex-col gap-7 px-4 py-8 md:px-8 md:py-12">
            {content}
          </main>
          {overlays}
        </div>
      </RoadmapContext.Provider>
    </ThemeScope>
  )
}

export { Roadmap, ROADMAP_COPY }
export type { Comment as RoadmapComment, RoadmapCopy, RoadmapDraft, RoadmapProps, RoadmapRequest, Status as RoadmapStatus }
