'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ComponentType, type CSSProperties } from 'react'
import { BookOpenIcon, CheckIcon, CopyIcon } from '@youj/icons'
import { Stage } from '@/components/site/stage'
import { EXPLORE_TILES, type ExploreId } from './tiles'

/* A tile's live piece: nothing on the server (the tile draws a light stand-in there), and its code, one chunk per tile,
 * fetched while the browser is idle after load and mounted a screen before the tile arrives. When it has painted it marks its stage `data-live`, which fades the stand-in
 * out. The orb's WebGL lives only while its tile is on screen: that tile leaves when it scrolls away and comes back
 * when it returns. */

const Ready = createContext<() => void>(() => {})

/** A tile's module, its default export marked ready once it has mounted. */
function live(load: () => Promise<{ default: ComponentType }>) {
  return dynamic(
    () =>
      load().then(({ default: Tile }) => {
        function Shown() {
          const ready = useContext(Ready)
          useLayoutEffect(() => ready(), [ready])
          return <Tile />
        }
        return Shown
      }),
    { ssr: false },
  )
}

/** Each tile's chunk, by id: the same import mounting and prefetching share, so a prefetched chunk mounts at once. */
const LOADERS: Record<ExploreId, () => Promise<{ default: ComponentType }>> = {
  voice: () => import('./tile-voice'),
  rings: () => import('./tile-rings'),
  slide: () => import('./tile-slide'),
  hold: () => import('./tile-hold'),
  flap: () => import('./tile-flap'),
  capsule: () => import('./tile-capsule'),
  units: () => import('./tile-units'),
  hierarchy: () => import('./tile-hierarchy'),
  waffle: () => import('./tile-waffle'),
  loader: () => import('./tile-loader'),
  icons: () => import('./tile-icons'),
  share: () => import('./tile-share'),
  chart: () => import('./tile-chart'),
  scene: () => import('./tile-scene'),
  cursors: () => import('./tile-cursors'),
  breakdown: () => import('./tile-breakdown'),
  dial: () => import('./tile-dial'),
  signature: () => import('./tile-signature'),
  gauge: () => import('./tile-gauge'),
  miniature: () => import('./tile-miniature'),
  heatmap: () => import('./tile-heatmap'),
  compare: () => import('./tile-compare'),
  wheel: () => import('./tile-wheel'),
  scrub: () => import('./tile-scrub'),
  glass: () => import('./tile-glass'),
  radar: () => import('./tile-radar'),
  clock: () => import('./tile-clock'),
  diff: () => import('./tile-diff'),
}

const TILES = Object.fromEntries(Object.entries(LOADERS).map(([id, load]) => [id, live(load)])) as Record<ExploreId, ComponentType>

/**
 * Fetch every tile's chunk ahead of time, one after another, once the page has loaded and the browser is idle: the
 * section's code is cached before anyone scrolls to it, without touching the first paint. Skipped when the visitor
 * asked to save data or is on a slow connection, where the tiles still load as they near the screen.
 */
function usePrefetchTiles() {
  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
    if (connection?.saveData || /2g/.test(connection?.effectiveType ?? '')) return
    let canceled = false
    const run = () => {
      const queue = Object.values(LOADERS)
      const next = (): void => {
        const load = queue.shift()
        if (!load || canceled) return
        load().then(next, next)
      }
      next()
    }
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1))
    const start = () => idle(run, { timeout: 4000 })
    if (document.readyState === 'complete') start()
    else window.addEventListener('load', start, { once: true })
    return () => {
      canceled = true
      window.removeEventListener('load', start)
    }
  }, [])
}

/** Tiles that leave when they scroll away: the orb's WebGL context is only kept while it's seen. */
const WHILE_SEEN: ReadonlySet<ExploreId> = new Set(['voice'])

function ExploreLive({ id }: { id: ExploreId }) {
  const root = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const el = root.current
    if (!el || typeof IntersectionObserver === 'undefined') return setNear(true)
    const seen = WHILE_SEEN.has(id)
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setNear(true)
          if (!seen) observer.disconnect()
        } else if (seen) {
          setNear(false)
          setReady(false)
        }
      },
      { rootMargin: seen ? '0px' : '100% 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [id])

  useEffect(() => {
    root.current?.parentElement?.toggleAttribute('data-live', near && ready)
  }, [near, ready])

  const Tile = TILES[id]
  return (
    <div ref={root} className="explore-live">
      {near && (
        <Ready.Provider value={() => setReady(true)}>
          <Tile />
        </Ready.Provider>
      )}
    </div>
  )
}

/** The `npx youj add` name a tile's piece installs by, read from its docs link; none for the icon set and miniatures. */
function installName(href: string) {
  const [path, query = ''] = href.split('?')
  const hash = href.split('#')[1]
  if (hash && path!.startsWith('/docs/components/button')) return hash
  if (path!.startsWith('/docs/')) return path!.split('#')[0]!.split('/').pop()
  const id = new URLSearchParams(query).get('id') ?? new URLSearchParams(query).get('scene')
  if (path === '/loaders' && id) return `loader-${id}`
  if (path === '/illustrations' && id) return `illustration-${id}`
  return undefined
}

/** One tile: the live piece, usable as it is; on hover its name shows as a pill at the bottom start and its links as icon pills at the bottom end. */
function ExploreTile({ tile }: { tile: (typeof EXPLORE_TILES)[number] }) {
  const [copied, setCopied] = useState(false)
  const name = installName(tile.href)
  const copy = () => {
    if (!name) return
    void navigator.clipboard?.writeText(`npx youj add ${name}`).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    })
  }
  return (
    <article aria-labelledby={`explore-${tile.id}`} className="group/tile site-card explore-tile">
      <Stage className="explore-stage">
        <span aria-hidden data-ph={tile.ph} className="explore-ph" />
        <ExploreLive id={tile.id} />
      </Stage>
      <h3 id={`explore-${tile.id}`} className="explore-name">
        {tile.name}
      </h3>
      <div className="explore-actions">
        {name && (
          <button type="button" onClick={copy} aria-label={copied ? 'Copied' : `Copy npx youj add ${name}`} className="explore-icon">
            {copied ? <CheckIcon size={19} strokeWidth={1.75} /> : <CopyIcon size={19} strokeWidth={1.75} />}
          </button>
        )}
        <Link prefetch={false} href={tile.href} aria-label={`View docs: ${tile.name}`} className="explore-icon">
          <BookOpenIcon size={19} strokeWidth={1.75} />
        </Link>
      </div>
    </article>
  )
}

/**
 * The bento, a client component with no props: the page's payload carries one reference to it, not twenty tiles'
 * markup (the HTML has them all). Each tile is the live piece, full bleed; its name and docs link wait on a veil that
 * shows on hover or when its link has focus. Each repeated part wears one class (`explore-*`, styles/site.css), so
 * twenty tiles don't spell their utilities out in the HTML.
 */
export function ExploreGrid() {
  usePrefetchTiles()
  return (
    <ul className="explore-grid mt-12 md:mt-14">
      {EXPLORE_TILES.map((tile) => (
        <li key={tile.id} data-size={tile.size} className="explore-item" style={{ '--area': tile.id } as CSSProperties}>
          <ExploreTile tile={tile} />
        </li>
      ))}
    </ul>
  )
}
