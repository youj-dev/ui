'use client'

import { Suspense, useCallback, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { useSearchParams } from 'next/navigation'
import { TooltipProvider } from '@youj/react'
import { ShowroomCard, ShowroomExplorer, ShowroomGrid } from '@/components/showroom/explorer'
import { useArrowStepping, useRevealHero } from '@/components/showroom/hooks'
import { DEFAULT_PRESENTATION } from '@/components/showroom/presentation'
import { ShowroomSearch, type SearchEntry, type ShowroomSearchHandle } from '@/components/showroom/search'
import type { ShowroomItem } from '@/components/showroom/thumb'
import { SiteInk } from '@/components/showroom/site-ink'
import { ViewfinderBar, ViewfinderStrip } from '@/components/showroom/viewfinder'
import type { ComponentDoc } from '@/lib/props'
import { categoryEntries, indexScenes, sceneEntries, searchScenes, type BlockLink, type SceneDetail } from './catalog'
import { SceneHero } from './hero'
import { DEFAULT_QUERY, FLAGSHIP, parseQuery, serializeQuery, type ExplorerQuery } from './query'
import { StripThumb } from './strip-thumb'

/* The illustrations page, on the showroom's shell (components/showroom), one viewport: one scene on show in the hero
 * (./hero), live on a paper stage, in the screen it would live in or alone, with its placard beside it, and every scene
 * in the viewfinder's island under it, and every scene as a grid under the hero to browse. A thumbnail in the strip, Previous and Next, or ← and → anywhere on the page
 * put a scene on stage (all of them, round and round). The search beside the island (or `/`) finds a scene by name,
 * category, tag or what it shows, narrowed to any categories; a tag or the category in the placard opens it on that.
 * The scene on show is the query string (`?scene=coffee`), so any scene is a link, and ⌘K's result for a scene opens it
 * on stage; `?strip=column|bar` stands the viewfinder elsewhere, for comparison. Everything is read from the registry:
 * a scene added there shows up here with nothing else to edit. */

export interface IllustrationShowroomProps {
  details: Record<string, SceneDetail>
  blocks: BlockLink[]
  /** The props every scene takes, for Use it (read on the server). */
  props: ComponentDoc
}

export function IllustrationShowroom({ details, blocks, props }: IllustrationShowroomProps) {
  const scenes = useMemo(() => sceneEntries(details), [details])
  const categories = useMemo(() => categoryEntries(scenes), [scenes])
  const index = useMemo(() => indexScenes(scenes), [scenes])
  const byId = useMemo(() => new Map(scenes.map((s) => [s.id, s])), [scenes])
  const [query, setQuery] = useState<ExplorerQuery>(DEFAULT_QUERY)
  const [ready, setReady] = useState(false)
  const hero = useRef<HTMLElement>(null)
  const search = useRef<ShowroomSearchHandle>(null)

  // What the address says as of the page's last read or write, so a change made elsewhere (a ⌘K result) is told from its own.
  const written = useRef('')
  /** The address's state, with a scene the registry doesn't know left out (and so dropped from the address). */
  const read = useCallback((search: string) => {
    const next = parseQuery(search)
    return next.scene && !byId.has(next.scene) ? { ...next, scene: null } : next
  }, [byId])

  // The link's state, read before the first paint so a shared view never flashes the default one (and the words the
  // server drew for the flagship, hidden meanwhile for a link to another scene, show again: SCENE_LINK_SCRIPT).
  useLayoutEffect(() => {
    written.current = new URLSearchParams(window.location.search).toString()
    setQuery(read(window.location.search))
    setReady(true)
    document.documentElement.removeAttribute('data-scene-link')
  }, [read])
  // The grid is under the fold: it's drawn after the hero has painted, in a render that gives way to input.
  const gridReady = useDeferredValue(ready)

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

  // The scene on show, and the ones either side of it in the registry's order, round and round.
  const scene = (query.scene ? byId.get(query.scene) : undefined) ?? byId.get(FLAGSHIP) ?? scenes[0]!
  const at = scenes.indexOf(scene)
  const select = useCallback((id: string) => setQuery((q) => ({ ...q, scene: id })), [])
  const reveal = useRevealHero(hero, 'illustration-name')
  const putOnStage = useCallback(
    (id: string) => {
      select(id)
      reveal()
    },
    [select, reveal],
  )

  // The strip's items: each scene draws its own still frame in the page's theme.
  const items = useMemo<ShowroomItem[]>(() => scenes.map((s) => ({ id: s.id, label: s.name, draw: (square) => <StripThumb scene={s} square={square} /> })), [scenes])
  const prev = items[(at - 1 + items.length) % items.length]
  const next = items[(at + 1) % items.length]
  useArrowStepping({ prev, next, onStep: select })
  // Where the strip stands (`?strip=`): floating on the stage by default, beside it, or in a bar under the hero.
  const presentation = query.strip ?? DEFAULT_PRESENTATION
  const strip = { label: 'Scenes', noun: 'scene', items, current: scene.id, prev, next, onSelect: select }

  // The search: the registry's own ranking (names, tags, categories, what each shows), narrowed by category.
  const entries = useMemo<SearchEntry[]>(
    () => scenes.map((s, i) => ({ item: items[i]!, meta: `${s.categoryName} · ${s.component}`, tags: s.tags, category: s.category })),
    [scenes, items],
  )
  const find = useCallback((q: string) => searchScenes(index, q).map((s) => s.id), [index])

  return (
    <TooltipProvider>
      <Suspense fallback={null}>
        <FollowAddress
          written={written}
          read={read}
          onChange={(next) => {
            setQuery(next)
            if (next.scene) reveal()
          }}
        />
      </Suspense>

      <SceneHero
        ref={hero}
        scene={scene}
        index={at + 1}
        total={scenes.length}
        props={props}
        blocks={blocks}
        onCategory={(id) => search.current?.open({ categories: [id] })}
        presentation={presentation}
        viewfinder={(orientation) => (
          <SiteInk ink={false}>
            <ViewfinderStrip orientation={orientation} {...strip} />
          </SiteInk>
        )}
        search={(placement) => (
          <SiteInk ink={false}>
            <ShowroomSearch ref={search} placement={placement} noun="scene" plural="scenes" entries={entries} find={find} categories={categories} current={scene.id} onSelect={select} />
          </SiteInk>
        )}
      />
      {/* Its squares are drawn in the browser, so the page's HTML carries the bar alone, not four hundred empty squares. */}
      <ShowroomExplorer title="All illustrations" titleId="illustrations-explorer-title" count={scenes.length} bar={
          presentation === 'bar' && (
            <SiteInk>
              <ViewfinderBar {...strip} items={ready ? items : []} />
            </SiteInk>
          )
        }>
        {/* Drawn in the browser too: the page's HTML carries the heading, not every card. */}
        {gridReady && (
          <SiteInk>
          <ShowroomGrid
            id="illustrations"
            label={`${scenes.length} illustrations`}
            items={items}
            renderItem={(it, i) => <ShowroomCard item={it} current={it.id === scene.id} eager={false} meta={scenes[i]!.categoryName} href={`?scene=${it.id}`} onOpen={putOnStage} dots />}
          />
          </SiteInk>
        )}
      </ShowroomExplorer>
    </TooltipProvider>
  )
}

/** Follows the address when something else changes it (⌘K opening a scene while the page is open); its own writes are skipped. */
function FollowAddress({ written, read, onChange }: { written: RefObject<string>; read: (search: string) => ExplorerQuery; onChange: (query: ExplorerQuery) => void }) {
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
