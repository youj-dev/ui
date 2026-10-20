'use client'

import { useCallback, useDeferredValue, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { TooltipProvider } from '@youj/react'
import { indexIcons, searchIndex } from '@/components/icons/search'
import { ShowroomCard, ShowroomExplorer, ShowroomGrid } from '@/components/showroom/explorer'
import { useArrowStepping, useRevealHero, useShowroomSelection, writeParam } from '@/components/showroom/hooks'
import { DEFAULT_PRESENTATION, presentationOf } from '@/components/showroom/presentation'
import { ShowroomSearch, type SearchEntry } from '@/components/showroom/search'
import { ViewfinderBar, ViewfinderStrip } from '@/components/showroom/viewfinder'
import type { ComponentDoc } from '@/lib/props'
import { thumbsOf, type ShowroomMiniature } from './catalog'
import { MiniatureViewer } from './miniature-viewer'

/* The miniatures page (/miniatures): one viewport, one miniature on show in the hero (./miniature-viewer) with every
 * miniature in the viewfinder's island under it and a search beside that, on the showroom's shell
 * (components/showroom), and every miniature as a grid under the hero to browse (a card puts it on stage and brings the
 * hero back). The one on show is `?item=<id>`, the turntable when there's none. The page is prerendered, so
 * the address is read once it's in the browser (before its first paint after hydration); an address naming no
 * miniature loses its name. The server hands over the catalogue's metadata, so the client bundles none of it. Where the
 * viewfinder stands is `?strip=island` (the default: floating on the stage), `column` (beside it) or `bar` (a bar
 * under the hero), read with the item. */

/** On stage when the address names no miniature. */
const FLAGSHIP = 'turntable'
const PARAM = 'item'

export function MiniaturesShowroom({ miniatures, props }: { miniatures: ShowroomMiniature[]; /** The props every miniature takes, for Use it. */ props?: ComponentDoc }) {
  const items = useMemo(() => miniatures.map((m) => ({ id: m.id, label: m.name, thumbs: thumbsOf(m.id) })), [miniatures])
  const { index, item, prev, next, select } = useShowroomSelection({ items, param: PARAM, initial: null, fallback: FLAGSHIP })
  useArrowStepping({ prev, next, onStep: select })
  const hero = useRef<HTMLElement>(null)
  const reveal = useRevealHero(hero, 'miniature-name')

  // The search: by name, make and model, maker, what its keys do and what it is; each row names its model and keys.
  const entries = useMemo<SearchEntry[]>(
    () => miniatures.map((m, i) => ({ item: items[i]!, meta: `${m.model} · Study ${m.study}`, tags: m.keys.map((k) => k.label) })),
    [miniatures, items],
  )
  const searchable = useMemo(
    () => indexIcons(miniatures, (m) => ({ name: m.id, keywords: [m.name, m.model, m.maker, ...m.keys.map((k) => k.label)], description: m.description })),
    [miniatures],
  )
  const find = useCallback((q: string) => searchIndex(searchable, q).map((m) => m.id), [searchable])

  // The stage loads nothing until the address is read, so a link to another miniature never fetches the turntable first.
  const [addressRead, setAddressRead] = useState(false)
  const [presentation, setPresentation] = useState(DEFAULT_PRESENTATION)
  useLayoutEffect(() => {
    const address = new URLSearchParams(window.location.search)
    setPresentation(presentationOf(address.get('strip')) ?? DEFAULT_PRESENTATION)
    const named = address.get(PARAM)
    if (named && items.some((m) => m.id === named)) select(named)
    else if (named) writeParam(PARAM, null)
    setAddressRead(true)
  }, [])
  // The grid is under the fold: it's drawn after the hero has painted, in a render that gives way to input.
  const gridReady = useDeferredValue(addressRead)

  const putOnStage = useCallback(
    (id: string) => {
      select(id)
      reveal()
    },
    [select, reveal],
  )

  const meta = miniatures[index]
  if (!meta || !item) return null


  const strip = { label: 'Miniatures', noun: 'miniature', items, current: item.id, prev, next, onSelect: select }
  return (
    <TooltipProvider>
      <MiniatureViewer
        ref={hero}
        meta={meta}
        index={index + 1}
        total={miniatures.length}
        active={addressRead}
        presentation={presentation}
        props={props}
        viewfinder={(orientation) => <ViewfinderStrip orientation={orientation} {...strip} />}
        search={(placement) => (
          <ShowroomSearch placement={placement} noun="miniature" plural="miniatures" entries={entries} find={find} current={item.id} onSelect={select} />
        )}
      />
      {/* The cards are drawn in the browser, so the page's HTML carries the heading alone, not a hundred cards. */}
      <ShowroomExplorer title="All miniatures" titleId="miniatures-explorer-title" count={miniatures.length} bar={presentation === 'bar' && <ViewfinderBar {...strip} />}>
        {gridReady && (
          <ShowroomGrid
            id="miniatures"
            label={`${miniatures.length} miniatures`}
            items={items}
            renderItem={(it, i) => <ShowroomCard item={it} current={it.id === meta.id} eager={i < 10} meta={miniatures[i]!.model} href={`?${PARAM}=${it.id}`} onOpen={putOnStage} />}
          />
        )}
      </ShowroomExplorer>
    </TooltipProvider>
  )
}
