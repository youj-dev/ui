'use client'

import { useEffect, useId, useMemo, useRef, useState, type HTMLAttributes, type KeyboardEvent, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import type { IllustrationSlot } from '@youj/illustrations'
import { PlusIcon } from '@youj/icons'
import { AppPage } from '../../components/ui/app-page'
import { Button } from '../../components/ui/button'
import { Drawer, DrawerContent } from '../../components/ui/drawer'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../../components/ui/resizable'
import { ScrollArea } from '../../components/ui/scroll-area'
import { toast, Toaster } from '../../components/ui/toast'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { useIsMobile } from '../../hooks/use-mobile'
import { cn } from '../../lib/utils'
import {
  BRAND,
  DEFAULT_COPY,
  moneyFormat,
  NOW,
  REQUESTS,
  type FeatureRequest,
  type ListDetailBrand,
  type ListDetailAsker,
  type ListDetailCopy,
  type ListDetailItem,
  type ListDetailStatus,
  type SortBy,
  type Status,
} from './list-detail/data'
import { DetailEmpty, RequestDetail } from './list-detail/detail'
import { RequestList } from './list-detail/list'

/* Canopy's feature requests, as a list beside the request you're reading.
 * The list is the team's priority order: drag a row by its grip, or hold
 * Alt and press an arrow, and it moves (with the move announced). ↑/↓ walk
 * the list and the detail follows; Enter moves into the detail, and Escape
 * there comes back to the row. Sort by votes or newest to read the list
 * another way (reordering waits for priority again), or search it. The
 * divider between the panes drags, and takes arrows once focused. On a
 * phone the list fills the screen and a request opens in a drawer from the
 * bottom. Pass your own `requests`, wire `onStatusChange`, `onReorder`,
 * `onReply`, `onMerge` and `onCreate`; every string is in `copy`. It is built
 * for the compact layout density (ui.css), taken from the page. Reduced motion:
 * rows jump into place and the detail changes without its rise. */

interface ListDetailProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** A theme to force on the block. Default: none, so it inherits the app's (YoujProvider or a ThemeScope around it). */
  theme?: ThemeInput
  /** A page in your app's frame: the shared page header (AppPage) and the frame's gutter, across the whole width, with no top bar of its own. Default true; `false` draws its own page (the top bar and the full-height panes). */
  embedded?: boolean
  /** The requests, in priority order. */
  requests?: FeatureRequest[]
  /** The request open at first, or null for none. Default: the top of the list. */
  defaultSelected?: string | null
  /** The picture while no request is open: a scene from the illustrations by id, or your own node. Default: the idea bulb. */
  illustration?: IllustrationSlot
  /** The open request's id (controlled), or null for none. Pair with `onSelectedChange`. Default: uncontrolled, from `defaultSelected`. */
  selected?: string | null
  /** Called with the id of the request that opens. Default: none. */
  onSelectedChange?: (id: string | null) => void
  /** Saves a request's new status (and the old one again on Undo). The page shows it at once and rolls back, with the error's message, if this rejects. Default: none, the change stays in the page. */
  onStatusChange?: (request: FeatureRequest, status: Status) => Promise<unknown> | unknown
  /** Saves the new priority order, every id, after a drag or Alt+arrow. Default: none. */
  onReorder?: (ids: string[]) => Promise<unknown> | unknown
  /** "Reply to askers"; a rejection's message shows as an error toast. Default: a toast saying a reply is being drafted. */
  onReply?: (request: FeatureRequest) => Promise<unknown> | unknown
  /** "Merge"; a rejection's message shows as an error toast. Default: a toast asking which request to merge into. */
  onMerge?: (request: FeatureRequest) => Promise<unknown> | unknown
  /** The top bar's "New request". Default: none. */
  onCreate?: () => Promise<unknown> | unknown
  /** Any of the page's strings, to rewrite or translate. Default: the English demo copy. */
  copy?: Partial<ListDetailCopy>
  /** "Now", in ms, for the requests' ages ("3d ago"), so server and browser agree. Default: the demo's fixed time. */
  now?: number
  /** Skeleton rows in place of the list while the requests load. Default false. */
  loading?: boolean
  /** Replaces the empty list shown when there are no requests. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
  /** Replaces the list with an error panel; a string is its message. Default: none. */
  error?: ReactNode
  /** Adds a retry button to the error panel. Default: none. */
  onRetry?: () => void
  /** The product in the standalone top bar. Default: Canopy, with its letter mark. */
  brand?: ListDetailBrand
  /** Formats votes and money. Default: the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The askers' revenue currency. Default 'USD'. */
  currency?: string
  /** The title's heading level. Default 1. */
  headingLevel?: 1 | 2 | 3
  /** Classes for the page's root element, merged with its own. Default: none. */
  className?: string
}

const matches = (request: FeatureRequest, query: string, status: string) =>
  [request.title, request.area, status, ...request.askers.map((a) => a.company)].some((text) => text.toLowerCase().includes(query))

function ListDetail({
  theme,
  embedded = true,
  requests: initial = REQUESTS,
  defaultSelected,
  illustration,
  selected: selectedProp,
  onSelectedChange,
  onStatusChange,
  onReorder,
  onReply,
  onMerge,
  onCreate,
  copy: copyProp,
  now = NOW,
  loading = false,
  empty,
  error,
  onRetry,
  brand = BRAND,
  locale: localeProp,
  currency = 'USD',
  headingLevel = 1,
  className,
  ...rest
}: ListDetailProps) {
  const locale = useLocale(localeProp)
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const money = useMemo(() => moneyFormat(locale, currency), [locale, currency])
  const titleId = useId()
  const detailTitleId = useId()
  const Title = (`h${headingLevel}`) as 'h1' | 'h2' | 'h3'
  const mobile = useIsMobile()
  const { announce, announcer } = useAnnouncer()
  const [requests, setRequests] = useState(initial)
  const [order, setOrder] = useState(() => initial.map((r) => r.id))
  const [sort, setSort] = useState<SortBy>('priority')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedInner] = useControllableState<string | null>(selectedProp, defaultSelected === undefined ? (initial[0]?.id ?? null) : defaultSelected)
  const setSelectedId = (id: string | null) => {
    setSelectedInner(id)
    if (id !== selectedId) onSelectedChange?.(id)
  }
  const [drawer, setDrawer] = useState(false)
  const detailRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const focusTitle = useRef(false)

  const byId = useMemo(() => new Map(requests.map((r) => [r.id, r])), [requests])
  const selected = selectedId ? byId.get(selectedId) : undefined
  const q = query.trim().toLowerCase()
  const shown = useMemo(() => {
    const list = order.map((id) => byId.get(id)!).filter((r) => !q || matches(r, q, copy.statuses[r.status]))
    if (sort === 'votes') return [...list].sort((a, b) => b.votes - a.votes)
    if (sort === 'newest') return [...list].sort((a, b) => b.createdAt - a.createdAt)
    return list
  }, [order, byId, q, sort, copy.statuses])
  const sortable = sort === 'priority' && !q

  // Enter on a row: the detail's title takes focus once it has rendered.
  useEffect(() => {
    if (!focusTitle.current) return
    focusTitle.current = false
    titleRef.current?.focus()
  })

  const open = (id: string) => {
    setSelectedId(id)
    if (mobile) setDrawer(true)
    else if (id === selectedId) titleRef.current?.focus()
    else focusTitle.current = true
  }
  const nudge = (id: string, step: -1 | 1) => {
    const i = order.indexOf(id)
    const j = i + step
    if (j < 0 || j >= order.length) return
    const next = [...order]
    next.splice(i, 1)
    next.splice(j, 0, id)
    reorder(next)
    announce(copy.moved(byId.get(id)?.title ?? id, j + 1, next.length))
  }
  // Runs your handler; a rejection's message shows as an error toast. True when it went through.
  const run = async (action: () => unknown) => {
    try {
      await action()
      return true
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : String(reason))
      return false
    }
  }
  const reorder = (ids: string[]) => {
    const before = order
    setOrder(ids)
    if (onReorder) void run(() => onReorder(ids)).then((ok) => ok || setOrder(before))
  }
  const changeStatus = async (request: FeatureRequest, from: Status, to: Status) => {
    setRequests((list) => list.map((r) => (r.id === request.id ? { ...r, status: to } : r)))
    const ok = await run(() => onStatusChange?.({ ...request, status: from }, to))
    if (!ok) setRequests((list) => list.map((r) => (r.id === request.id ? { ...r, status: from } : r)))
    return ok
  }
  const setStatus = async (request: FeatureRequest, status: Status) => {
    if (!(await changeStatus(request, request.status, status))) return
    toast.success(copy.statusChanged(copy.statuses[status], request.title), {
      action: { label: copy.undo, onClick: () => void changeStatus(request, status, request.status) },
    })
  }
  const merge = (r: FeatureRequest) => (onMerge ? void run(() => onMerge(r)) : toast(copy.mergePrompt(r.title)))
  const reply = (r: FeatureRequest) => (onReply ? void run(() => onReply(r)) : toast(copy.replyDraft(r.askers.length), { description: r.title }))

  // Escape inside the detail goes back to its row in the list.
  const onDetailKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape' || !selectedId || !detailRef.current?.contains(event.target as Node)) return
    document.querySelector<HTMLElement>(`[data-request="${CSS.escape(selectedId)}"]`)?.focus()
  }

  const detail = selected ? (
    <RequestDetail request={selected} titleRef={titleRef} titleId={detailTitleId} onStatus={setStatus} onMerge={merge} onReply={reply} copy={copy} now={now} locale={locale} money={money} />
  ) : (
    <DetailEmpty illustration={illustration} copy={copy} />
  )

  const list = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-baseline justify-between gap-3 px-4 pt-4 pb-1">
        {!embedded && (
          <Title id={titleId} className="text-lg font-semibold tracking-tight text-fg">
            {copy.title}
          </Title>
        )}
        <span className="ms-auto font-mono text-ui-sm text-fg-muted tabular-nums">{shown.length}</span>
      </div>
      <RequestList
        requests={shown}
        selectedId={selectedId}
        sort={sort}
        query={query}
        sortable={sortable}
        onSort={setSort}
        onQuery={setQuery}
        onOrder={reorder}
        onNudge={nudge}
        onSelect={setSelectedId}
        onOpen={open}
        tapOpens={mobile}
        copy={copy}
        now={now}
        loading={loading}
        empty={requests.length === 0}
        emptySlot={empty}
        error={error}
        onRetry={onRetry}
      />
    </div>
  )

  const panes = mobile ? (
    <>
      {list}
      <Drawer open={drawer && selected !== undefined} onOpenChange={setDrawer}>
        <DrawerContent aria-labelledby={detailTitleId} className="max-h-[92dvh]">
          <div className="px-5 pt-3 pb-8">{detail}</div>
        </DrawerContent>
      </Drawer>
    </>
  ) : (
    <ResizablePanelGroup orientation="horizontal">
      <ResizablePanel id="requests" defaultSize="24rem" minSize="18rem" maxSize="50%" className="bg-surface">
        {list}
      </ResizablePanel>
      <ResizableHandle aria-label={copy.resizeList} />
      <ResizablePanel id="request" minSize="40%">
        <div ref={detailRef} onKeyDown={onDetailKey} className="h-full">
          <ScrollArea className="h-full" aria-label={copy.detailRegion}>
            <div className="mx-auto w-full max-w-2xl px-(--ui--panel-x) py-8 lg:px-10">{detail}</div>
          </ScrollArea>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )

  if (embedded) {
    const page = (
      <AppPage
        {...rest}
        // The list is named by the page's title.
        title={<span id={titleId}>{copy.title}</span>}
        actions={
          <Button size="sm" onClick={onCreate && (() => void run(onCreate))}>
            <PlusIcon size={16} /> {copy.newRequest}
          </Button>
        }
        headingLevel={headingLevel}
        width="fill"
        className={cn('text-fg', className)}
      >
        <div className="h-160 overflow-hidden rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line bg-canvas">{panes}</div>
        {announcer}
        <Toaster />
      </AppPage>
    )
    return theme ? <ThemeScope theme={theme}>{page}</ThemeScope> : page
  }
  return (
    <ThemeScope theme={theme}>
      <div {...rest} className={cn('flex h-dvh flex-col bg-canvas text-fg', className)}>
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface px-4">
          {brand.logo ?? (
            <span aria-hidden className="grid size-7 place-items-center rounded-md bg-accent text-ui-sm font-semibold text-on-accent">
              {brand.name.charAt(0)}
            </span>
          )}
          <span className="font-semibold tracking-tight">{brand.name}</span>
          <span aria-hidden className="text-fg-muted">/</span>
          <span className="truncate text-fg-muted">{copy.section}</span>
          <Button size="sm" className="ms-auto" onClick={onCreate && (() => void run(onCreate))}>
            <PlusIcon size={16} /> {copy.newRequest}
          </Button>
        </header>
        <main aria-labelledby={titleId} className="min-h-0 flex-1">
          {panes}
        </main>
        {announcer}
        <Toaster />
      </div>
    </ThemeScope>
  )
}

export { ListDetail, type ListDetailProps, type ListDetailCopy, type ListDetailItem, type ListDetailAsker, type ListDetailStatus, type ListDetailBrand, type FeatureRequest }
