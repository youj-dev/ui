'use client'

import { memo, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { useSearchParams } from 'next/navigation'
import { TooltipProvider } from '@youj/react'
import { indexIcons, searchIndex, type SearchIndex } from '@/components/icons/search'
import { inkColor } from '@/components/icons/settings'
import { SiteInk } from '@/components/showroom/site-ink'
import { ShowroomCard, ShowroomExplorer, ShowroomGrid } from '@/components/showroom/explorer'
import { useArrowStepping, useRevealHero } from '@/components/showroom/hooks'
import { DEFAULT_PRESENTATION } from '@/components/showroom/presentation'
import { ShowroomSearch, type SearchEntry, type ShowroomSearchHandle } from '@/components/showroom/search'
import type { ShowroomItem } from '@/components/showroom/thumb'
import { ViewfinderBar, ViewfinderStrip } from '@/components/showroom/viewfinder'
import type { ComponentDoc } from '@/lib/props'
import { colorsValue, GALLERY_LABEL, loopSeconds, type CategoryEntry, type LoaderEntry, type Look } from './catalog'
import { LoaderHero, type Tuning } from './hero'
import { prefetchLoader } from './live'
import { prefetchSurfaces } from './stage'
import { DEFAULT_QUERY, FLAGSHIP, parseQuery, serializeQuery, type LoadersQuery } from './query'
import { LoaderInk, LoaderThumb } from './thumb'

/* The loaders page (/loaders), on the showroom's shell (components/showroom): one loader on show in the hero
 * (./hero), live at the size it ships at in the screen it would live in, with its placard beside it; every loader in
 * the viewfinder's island on the stage's edge, and the search beside it (or `/`): by name, category, tag or what it
 * shows, narrowed to any categories; and every loader as a card under the hero (a card puts it on stage and brings
 * the hero back). A thumbnail in the strip, Previous and Next, or ← and → anywhere on the page put a loader on stage
 * (all of them, round and round). The size, loop, colors and label set in the placard stay as the loader changes;
 * the stage draws with them, the thumbnails wear the colors, and the code is written with them. Only the stage plays:
 * every thumbnail is its loader's still frame, drawn as it comes near (a card plays while it's pointed at), and each
 * loader is a chunk of its own. The loader on show is the query string (`?id=vortex`, what ⌘K's results link to), so
 * any loader is a link; `?strip=column|bar` stands the viewfinder elsewhere, for comparison. Everything is read from
 * the registry: a loader added there shows up here with nothing else to edit. */

/** What the placard holds until it's changed: a size the stage shows off (the code says it), a loop at its own tempo, the theme's colors and three labels taking turns. */
const DEFAULT_TUNING: Tuning = { size: 200, speed: 1, ink: 'default', accent: 'default', tone: 'mono', parts: ['default', 'default', 'default', 'default'], label: GALLERY_LABEL }

export interface LoaderShowroomProps {
  loaders: LoaderEntry[]
  categories: CategoryEntry[]
  /** The props every loader takes, for Use it (read on the server). */
  props: ComponentDoc
}

export function LoaderShowroom({ loaders: entries, categories, props }: LoaderShowroomProps) {
  const byId = useMemo(() => new Map(entries.map((e) => [e.id, e])), [entries])
  const titles = useMemo(() => new Map(categories.map((c) => [c.id, c.title])), [categories])
  const [query, setQuery] = useState<LoadersQuery>(DEFAULT_QUERY)
  const [ready, setReady] = useState(false)
  const [tuning, setTuning] = useState<Tuning>(DEFAULT_TUNING)
  const hero = useRef<HTMLElement>(null)
  const search = useRef<ShowroomSearchHandle>(null)

  // What the address says as of the page's last read or write, so a change made elsewhere (a ⌘K result) is told from its own.
  const written = useRef('')
  /** The address's state, with a loader the registry doesn't know left out (and so dropped from the address). */
  const read = useCallback(
    (search: string) => {
      const next = parseQuery(search)
      return next.id && !byId.has(next.id) ? { ...next, id: null } : next
    },
    [byId],
  )

  // The link's state, read before the first paint so a shared view never flashes the default one (and the words the
  // server drew for the flagship, hidden meanwhile for a link to another loader, show again: LOADER_LINK_SCRIPT).
  useLayoutEffect(() => {
    written.current = new URLSearchParams(window.location.search).toString()
    setQuery(read(window.location.search))
    setReady(true)
    document.documentElement.removeAttribute('data-loader-link')
  }, [read])

  // Written back as you go, replacing the entry: looking around isn't navigation.
  useEffect(() => {
    if (!ready) return
    const timer = setTimeout(() => {
      const search = serializeQuery(query)
      written.current = search
      const next = `${window.location.pathname}${search ? `?${search}` : ''}`
      if (next !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(window.history.state, '', next)
    }, 150)
    return () => clearTimeout(timer)
  }, [query, ready])

  // The loader on show, and the ones either side of it in the gallery's order, round and round.
  const entry = (query.id ? byId.get(query.id) : undefined) ?? byId.get(FLAGSHIP) ?? entries[0]!
  const at = entries.indexOf(entry)
  const select = useCallback((id: string) => setQuery((q) => ({ ...q, id })), [])
  const reveal = useRevealHero(hero, 'loader-name')
  // The latest reveal, so a card's handler stays the same function and a pick re-renders only the two cards it touches.
  const revealer = useRef(reveal)
  revealer.current = reveal
  const putOnStage = useCallback(
    (id: string) => {
      select(id)
      revealer.current()
    },
    [select],
  )

  // The strip's items: each loader draws its own still frame.
  const items = useMemo<ShowroomItem[]>(() => entries.map((e) => ({ id: e.id, label: e.title, draw: (square) => <LoaderThumb id={e.id} square={square} /> })), [entries])
  const prev = items[(at - 1 + items.length) % items.length]
  const next = items[(at + 1) % items.length]
  useArrowStepping({ prev, next, onStep: select })
  // The ones either side are a step away: their chunks come in while this one plays.
  useEffect(() => {
    if (!ready) return
    for (const near of [prev, next]) if (near) prefetchLoader(near.id)
  }, [ready, prev, next])
  // Where the strip stands (`?strip=`): floating on the stage by default, beside it, or in a bar under the hero.
  const presentation = query.strip ?? DEFAULT_PRESENTATION
  const strip = { label: 'Loaders', noun: 'loader', items, current: entry.id, prev, next, onSelect: select }

  // The search: forgiving of typos and prefixes, by name, export, tags, category and what each shows. Its index is
  // built the first time something is typed; until then every loader, in order, is the answer.
  const searchEntries = useMemo<SearchEntry[]>(
    () => entries.map((e, i) => ({ item: items[i]!, meta: `${titles.get(e.category) ?? e.category} · ${e.component}`, tags: e.tags, category: e.category })),
    [entries, items, titles],
  )
  const ids = useMemo(() => entries.map((e) => e.id), [entries])
  const index = useRef<SearchIndex<LoaderEntry> | null>(null)
  const find = useCallback(
    (q: string) => {
      if (!q) return ids
      index.current ??= indexIcons(entries, (e) => ({
        name: e.id,
        keywords: [e.title, e.component, e.technique, ...e.tags],
        category: `${e.category} ${titles.get(e.category) ?? ''}`.toLowerCase(),
        description: e.description,
      }))
      return searchIndex(index.current, q).map((e) => e.id)
    },
    [ids, entries, titles],
  )
  const chips = useMemo(() => categories.map((c) => ({ id: c.id, name: c.title })), [categories])

  // What isn't in the first screen waits for the page to be idle: the cards under the hero, and the context windows.
  const idle = useIdle(ready)
  useEffect(() => {
    if (idle) prefetchSurfaces()
  }, [idle])

  // The two colors as props: Default leaves `color` out (the text color) and `accentColor` (the theme's accent).
  const color = tuning.ink === 'default' ? undefined : inkColor(tuning.ink)
  const accentColor = tuning.accent === 'default' ? undefined : inkColor(tuning.accent)
  // Its colored parts: Mono (the default), its two colors alone, which the thumbnails wear too; or Theme, each part in its theme color unless picked (only the stage's loader: each loader's parts are its own).
  const themed = tuning.tone === 'theme'
  const colors = themed ? colorsValue(entry, tuning.parts.map((part) => (part === 'default' ? undefined : inkColor(part)))) : undefined
  const ink = useMemo(() => ({ ink: color, accent: accentColor, colors: undefined }), [color, accentColor])
  const look: Look = { size: tuning.size, cycle: loopSeconds(entry) / tuning.speed, ink: color, accent: accentColor, colors, label: tuning.label }
  const tune = useCallback((patch: Partial<Tuning>) => setTuning((t) => ({ ...t, ...patch })), [])

  return (
    <TooltipProvider>
      <LoaderInk.Provider value={ink}>
        <Suspense fallback={null}>
          <FollowAddress
            written={written}
            read={read}
            onChange={(next) => {
              setQuery(next)
              if (next.id) reveal()
            }}
          />
        </Suspense>

        <LoaderHero
          ref={hero}
          entry={entry}
          categoryTitle={titles.get(entry.category) ?? entry.category}
          index={at + 1}
          total={entries.length}
          tuning={tuning}
          onTuning={tune}
          look={look}
          props={props}
          onCategory={(id) => search.current?.open({ categories: [id] })}
          presentation={presentation}
          viewfinder={(orientation) => (
            <SiteInk ink={false}>
              <Strip orientation={orientation} {...strip} />
            </SiteInk>
          )}
          search={(placement) => (
            <SiteInk ink={false}>
              <Search ref={search} placement={placement} noun="loader" plural="loaders" entries={searchEntries} find={find} categories={chips} current={entry.id} onSelect={select} />
            </SiteInk>
          )}
        />
        {/* The cards are drawn in the browser, once the page is idle, so the page's HTML carries the heading alone. */}
        <ShowroomExplorer title="All loaders" titleId="loaders-explorer-title" count={entries.length} bar={
            presentation === 'bar' && (
              <SiteInk>
                <ViewfinderBar {...strip} items={ready ? items : []} />
              </SiteInk>
            )
          }>
          {idle && (
            <SiteInk>
              <Cards entries={entries} items={items} titles={titles} current={entry.id} onOpen={putOnStage} />
            </SiteInk>
          )}
        </ShowroomExplorer>
      </LoaderInk.Provider>
    </TooltipProvider>
  )
}

/* The strip, the search and the cards are memoized, so the panel's controls (a slider's every step) re-render none of
 * them, and a pick re-renders only what it changes. */
const Strip = memo(ViewfinderStrip)
const Search = memo(ShowroomSearch)

/** Every loader as a card under the hero; a pick re-renders the card it left and the one it lit. */
const Cards = memo(function Cards({
  entries,
  items,
  titles,
  current,
  onOpen,
}: {
  entries: LoaderEntry[]
  items: ShowroomItem[]
  titles: Map<string, string>
  current: string
  onOpen: (id: string) => void
}) {
  return (
    <ShowroomGrid
      id="loaders"
      label={`${entries.length} loaders`}
      items={items}
      renderItem={(it, i) => <Card item={it} current={it.id === current} meta={titles.get(entries[i]!.category) ?? ''} onOpen={onOpen} />}
    />
  )
})

const Card = memo(function Card({ item, current, meta, onOpen }: { item: ShowroomItem; current: boolean; meta: string; onOpen: (id: string) => void }) {
  return <ShowroomCard item={item} current={current} eager={false} meta={meta} href={`?id=${item.id}`} onOpen={onOpen} dots />
})

/** True once the page has gone idle after `ready` (or a moment after, where the browser has no idle callback). */
function useIdle(ready: boolean) {
  const [idle, setIdle] = useState(false)
  useEffect(() => {
    if (!ready || idle) return
    if (typeof window.requestIdleCallback === 'function') {
      const handle = window.requestIdleCallback(() => setIdle(true), { timeout: 1500 })
      return () => window.cancelIdleCallback(handle)
    }
    const timer = window.setTimeout(() => setIdle(true), 300)
    return () => window.clearTimeout(timer)
  }, [ready, idle])
  return idle
}

/** Follows the address when something else changes it (⌘K opening a loader while the page is open); its own writes are skipped. */
function FollowAddress({ written, read, onChange }: { written: RefObject<string>; read: (search: string) => LoadersQuery; onChange: (query: LoadersQuery) => void }) {
  // Null outside the app router (a test, a page without it): then there's nothing to follow.
  const search = useSearchParams()?.toString() ?? null
  useEffect(() => {
    if (search === null || search === written.current) return
    // The router can report the address it had before the page's own last write; only the live one is a change.
    if (search !== new URLSearchParams(window.location.search).toString()) return
    written.current = search
    onChange(read(search))
  }, [search, written, read, onChange])
  return null
}
