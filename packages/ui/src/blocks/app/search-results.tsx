'use client'

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ElementType, type HTMLAttributes, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { Collapse, ContentSwap, Counter, Reveal } from '@youj/motion'
import { SlidersIcon } from '@youj/icons'
import { AppPage } from '../../components/ui/app-page'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { toast, Toaster } from '../../components/ui/toast'
import { cn } from '../../lib/utils'
import { ActiveFilters, filterCount } from './search-results/active-filters'
import { Address } from './search-results/address'
import { BRAND, DEFAULT_COPY, SearchProvider, type SearchBrand, type SearchConfig, type SearchCopy } from './search-results/copy'
import { ITEMS, PEOPLE, POPULAR, RECENT, TODAY, demo, type SearchDocumentItem, type SearchItem, type SearchPerson, type SearchPersonItem, type SearchProjectItem, type SearchResultType } from './search-results/data'
import { Facets } from './search-results/facets'
import { FilterSheet } from './search-results/filter-sheet'
import { didYouMean, EMPTY_STATE, facetCounts, PAGE_SIZE, parseSearch, runSearch, terms, toSearch, unfilteredCount, type SearchState, type Sort } from './search-results/model'
import { QueryField } from './search-results/query-field'
import { RESULT_LINKS, ResultList } from './search-results/results'
import { NoResults, ResultsSkeleton, SearchError, StartState } from './search-results/states'

/* Kestrel's search: one field over the workspace's documents, people and
 * projects. The field suggests as you type (completions, recent searches and
 * results to jump to) and searches on Enter, with skeleton rows standing in
 * until results resolve (ContentSwap). Facets for type, owner, last updated
 * and tags carry live counts that tween as anything changes, and sit in a
 * Sheet on small screens; the filters in force are chips above the results.
 * Results have a layout per type, mark the query where it matches, and
 * animate as filters change (PresenceList). ↑/↓ walk the results and Enter
 * opens one; / focuses the field. The whole state is a query string, shown
 * under the title and reported through `onSearchChange`, so a router can own
 * it (`search` controls it). No query shows recent and popular searches; no
 * results offers a spelling fix or clearing the filters. Pass your own
 * `items` and `people` (or search on your server and hand back each page);
 * every string is in `copy`. Reduced motion: results, counts and chips
 * change in place.
 * It is built for the compact layout density (ui.css), taken from the page. */

interface SearchResultsProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** A theme to force on the block. Default: none, so it inherits the app's (YoujProvider or a ThemeScope around it). */
  theme?: ThemeInput
  /**
   * A page in your app's frame: the shared page header (AppPage) and the
   * frame's gutter, across the whole width, with no top bar of its own and no
   * / shortcut, so the app owns its keys. Default true; `false` draws its own
   * page (the top bar, a centered canvas and the / shortcut).
   */
  embedded?: boolean
  /** The search to start from, as a query string. Default "?q=onboarding". Same as `defaultSearch`, its earlier name. */
  initialSearch?: string
  /** The search to start from, uncontrolled, as a query string ("?q=sso&type=document"). Default "?q=onboarding". */
  defaultSearch?: string
  /** The search, controlled, as a query string: pair it with `onSearchChange` (your router's query). Default: uncontrolled. */
  search?: string
  /** Called with the query string each time the search changes: hand it to your router. */
  onSearchChange?: (search: string) => void
  /** Hold the loading state (skeleton rows), e.g. while your API answers. Default false. */
  loading?: boolean
  /** Called when a result is opened. Default: a toast. */
  onOpen?: (item: SearchItem) => void
  /** The index to search. Default: Kestrel's sample workspace. */
  items?: SearchItem[]
  /** Who owns the items, by id: names, faces and facets read from here. Default: Kestrel's people. */
  people?: Record<string, SearchPerson>
  /** Searches offered before typing and when nothing matches. Default: six demo searches. */
  popular?: string[]
  /** The recent searches at first. Default: three demo searches. */
  defaultRecent?: string[]
  /** Called with the recent searches whenever one is added or they're cleared. Default: none. */
  onRecentChange?: (recent: string[]) => void
  /** Loads the next page of results; resolve when it's in `items`. Called with the page number about to show. Default: a short demo wait. */
  onLoadMore?: (page: number) => Promise<unknown> | unknown
  /** The day items' `updated` (days before) counts from, so server and browser agree. Default: the demo's fixed day. */
  today?: Date | number
  /** Replaces the results with an error panel; a string is its message. Default: none. */
  error?: ReactNode
  /** Adds a retry button to the error panel. Default: none. */
  onRetry?: () => void
  /** Replaces the no-results state. Default: `copy.noResults` with a spelling fix and popular searches. */
  empty?: ReactNode
  /** Any of the page's strings, to rewrite or translate. Default: the English demo copy. */
  copy?: Partial<SearchCopy>
  /** The product in the top bar and in the strings that name it. Default: Kestrel. */
  brand?: SearchBrand
  /** Formats dates and local times. Default: the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The search page's address, shown and copied with the query string. Default 'kestrel.so/search'. */
  origin?: string
  /** Renders every result link (e.g. Next.js `Link`); it gets `href`, `onClick` and `className`. Default 'a'. */
  linkComponent?: ElementType
  /** A result's link. Default: its `href`. */
  getHref?: (item: SearchItem) => string
  /** The page heading's level; the results' headings follow it. Default 1. */
  headingLevel?: 1 | 2 | 3
  /** Classes for the page's root element, merged with its own. Default: none. */
  className?: string
}

type Level = 'h1' | 'h2' | 'h3' | 'h4' | 'h5'

function SearchResults({
  theme,
  embedded = true,
  initialSearch = '?q=onboarding',
  defaultSearch,
  search: searchProp,
  onSearchChange,
  loading = false,
  onOpen,
  items = ITEMS,
  people = PEOPLE,
  popular = POPULAR,
  defaultRecent = RECENT,
  onRecentChange,
  onLoadMore,
  today = TODAY,
  error,
  onRetry,
  empty,
  copy: copyProp,
  brand = BRAND,
  locale: localeProp,
  origin = 'kestrel.so/search',
  linkComponent = 'a',
  getHref = (item) => item.href,
  headingLevel = 1,
  className,
  ...rest
}: SearchResultsProps) {
  const locale = useLocale(localeProp)
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const titleId = useId()
  const level = headingLevel
  const Title = `h${level}` as Level
  const Heading = `h${level + 1}` as Level
  const controlled = searchProp !== undefined
  const [inner, setInner] = useState(() => parseSearch(defaultSearch ?? initialSearch, people))
  const state = useMemo(() => (controlled ? parseSearch(searchProp, people) : inner), [controlled, searchProp, people, inner])
  const latest = useRef(state)
  useLayoutEffect(() => {
    latest.current = state
  })
  const [draft, setDraft] = useState(state.q)
  const [recent, setRecentInner] = useState(defaultRecent)
  const [fetches, setFetches] = useState(0)
  const [landed, setLanded] = useState(0)
  const pending = fetches !== landed
  const [sheet, setSheet] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const column = useRef<HTMLDivElement>(null)

  const search = toSearch(state)
  const setState = (next: (s: SearchState) => SearchState) => {
    const from = latest.current
    const to = next(from)
    latest.current = to
    if (!controlled) setInner(to)
    if (toSearch(to) !== toSearch(from)) onSearchChange?.(toSearch(to))
  }
  const setRecent = (next: string[]) => {
    setRecentInner(next)
    onRecentChange?.(next)
  }

  // A query set from outside (the router) shows in the field.
  const [draftFor, setDraftFor] = useState(state.q)
  if (draftFor !== state.q) {
    setDraftFor(state.q)
    setDraft(state.q)
  }

  // A new query "fetches": skeletons until it lands. A newer query restarts the wait.
  useEffect(() => {
    if (!fetches) return
    const timer = setTimeout(() => setLanded(fetches), 650)
    return () => clearTimeout(timer)
  }, [fetches])

  useEffect(() => {
    if (embedded) return
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (event.key !== '/' || event.metaKey || event.ctrlKey || target.closest('input, textarea, select, [contenteditable=true]')) return
      event.preventDefault()
      input.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [embedded])

  const results = useMemo(() => runSearch(state, items, people), [state, items, people])
  const counts = useMemo(() => facetCounts(state, items, people), [state, items, people])
  const base = useMemo(() => facetCounts({ ...EMPTY_STATE, q: state.q }, items, people), [state.q, items, people])
  const shown = results.slice(0, state.page * PAGE_SIZE)
  const words = terms(state.q)
  const filters = filterCount(state)
  const busy = loading || pending
  const host = origin.split('/')[0]

  const update = (patch: Partial<SearchState>) => setState((s) => ({ ...s, ...patch, page: 1 }))
  const clearFilters = () => update({ types: [], owners: [], tags: [], updated: 'any' })
  const submit = (raw: string) => {
    const q = raw.trim()
    setDraft(q)
    update({ q })
    if (q) {
      setRecent([q, ...recent.filter((r) => r !== q)].slice(0, 5))
      setFetches((n) => n + 1)
    }
  }
  const open = (item: SearchItem) => (onOpen ? onOpen(item) : toast(copy.opening(item.title), { description: `${host}${getHref(item)}` }))
  const firstResult = () => column.current?.querySelector<HTMLElement>(RESULT_LINKS)?.focus()

  const config: SearchConfig = {
    copy,
    brand: brand.name,
    people,
    popular,
    items,
    today: typeof today === 'number' ? new Date(today) : today,
    locale,
    link: linkComponent,
    getHref,
  }

  const status = busy ? (
    copy.searching
  ) : state.q ? (
    <>
      <Counter value={results.length} from={results.length} format={{ maximumFractionDigits: 0 }} inView={false} duration="base" className="font-medium text-fg" />
      {` ${copy.resultsWord(results.length)}`}
      <span className="max-sm:sr-only">
        {copy.resultsFor}
        <span className="font-medium text-fg">“{state.q}”</span>
      </span>
    </>
  ) : (
    copy.typeToSearch
  )

  const body = error ? (
    <SearchError error={error} onRetry={onRetry} />
  ) : !state.q ? (
    <StartState recent={recent} onPick={submit} />
  ) : results.length === 0 ? (
    (empty ?? <NoResults q={state.q} fix={didYouMean(state.q, items, people)} hidden={filters ? unfilteredCount(state.q, items, people) : 0} onPick={submit} onClearFilters={clearFilters} />)
  ) : (
    <ResultList
      titleAs={`h${level + 2}` as 'h3' | 'h4' | 'h5'}
      items={shown}
      total={results.length}
      words={words}
      onOpen={(item, event) => {
        event.preventDefault()
        open(item)
      }}
      onLoadMore={async () => {
        const page = latest.current.page + 1
        await (onLoadMore ? onLoadMore(page) : demo('SearchResults: onLoadMore', 600))
        setState((s) => ({ ...s, page }))
      }}
      onExitTop={() => input.current?.focus()}
    />
  )

  const queryField = (
    <QueryField inputRef={input} draft={draft} onDraftChange={setDraft} onSubmit={submit} onJump={open} recent={recent} onClearRecent={() => setRecent([])} onExit={firstResult} />
  )

  const panes = (
    <>
      <div className="grid gap-8 lg:grid-cols-[--spacing(54)_minmax(0,1fr)]">
        <aside aria-label={copy.filters} className="max-lg:hidden">
          <div className="sticky top-6">
            {state.q ? <Facets state={state} counts={counts} base={base} onChange={update} /> : <p className="text-ui-sm text-fg-muted">{copy.filtersHint}</p>}
          </div>
        </aside>

        {/* The column holds the first results' height at an app's size: filters, their chips and more pages scroll in it. */}
        <div ref={column} className="flex h-334.75 min-w-0 flex-col gap-3">
          <Heading className="sr-only">{copy.results}</Heading>
          <div className="flex min-h-control items-center gap-2">
            <p role="status" className="me-auto min-w-0 truncate text-ui text-fg-muted">
              {status}
            </p>
            <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setSheet(true)} aria-label={filters ? copy.filtersApplied(filters) : copy.filters}>
              <SlidersIcon size={14} aria-hidden />
              {copy.filters}
              {filters > 0 && <Badge variant="solid">{filters}</Badge>}
            </Button>
            <Select items={copy.sorts} value={state.sort} onValueChange={(value) => value && update({ sort: value as Sort })}>
              <SelectTrigger size="sm" aria-label={copy.sortResults} className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {Object.entries(copy.sorts).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Collapse open={filters > 0}>
            <div className="pb-1">
              <ActiveFilters state={state} onChange={update} onClear={clearFilters} fallback={input} />
            </div>
          </Collapse>
          <div className="-mx-3 min-h-0 flex-1 overflow-y-auto px-3 yj-scrollbar sm:-mx-4 sm:px-4">
            <ContentSwap loading={busy && !error} fallback={<ResultsSkeleton />}>
              {body}
            </ContentSwap>
          </div>
        </div>
      </div>
    </>
  )

  const overlays = (
    <>
      <FilterSheet
        open={sheet}
        onOpenChange={setSheet}
        state={state}
        counts={counts}
        base={base}
        total={results.length}
        filters={filters}
        onChange={update}
        onClear={clearFilters}
      />
      <Toaster />
    </>
  )

  if (embedded) {
    const page = (
      <SearchProvider value={config}>
        <AppPage
          {...rest}
          // The results are named by the page's title.
          title={<span id={titleId}>{copy.title}</span>}
          actions={<div className="w-full min-w-0 sm:w-auto sm:max-w-136"><Address search={search} origin={origin} /></div>}
          headingLevel={headingLevel}
          width="fill"
          className={cn('text-fg', className)}
        >
          <div className="flex flex-col gap-6">
            {queryField}
            {panes}
          </div>
          {overlays}
        </AppPage>
      </SearchProvider>
    )
    return theme ? <ThemeScope theme={theme}>{page}</ThemeScope> : page
  }
  return (
    <ThemeScope theme={theme}>
      <SearchProvider value={config}>
        <div {...rest} className={cn('min-h-dvh w-full bg-canvas text-fg', className)}>
          <header className="border-b border-line bg-surface">
            <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 md:px-8">
              {brand.logo ?? (
                <span aria-hidden className="grid size-7 place-items-center rounded-md bg-accent text-ui-sm font-semibold text-on-accent">
                  {brand.name.charAt(0)}
                </span>
              )}
              <span className="font-semibold tracking-tight">{brand.name}</span>
              <span aria-hidden className="text-fg-muted">/</span>
              <span className="truncate text-fg-muted">{copy.section}</span>
            </div>
          </header>
          <main aria-labelledby={titleId} className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:px-8">
            <Reveal inView={false} variant="rise" className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
                <Title id={titleId} className="text-xl font-semibold tracking-tight text-fg">
                  {copy.title}
                </Title>
                <div className="w-full min-w-0 sm:w-auto sm:max-w-[min(--spacing(136),70%)]"><Address search={search} origin={origin} /></div>
              </div>
              {queryField}
            </Reveal>
            {panes}
          </main>
          {overlays}
        </div>
      </SearchProvider>
    </ThemeScope>
  )
}

export { SearchResults, type SearchResultsProps, type SearchCopy, type SearchBrand, type SearchItem, type SearchPerson, type SearchDocumentItem, type SearchPersonItem, type SearchProjectItem, type SearchResultType }
