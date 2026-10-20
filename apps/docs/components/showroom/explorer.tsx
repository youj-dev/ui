'use client'

import { memo, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { hasThumb, Thumbs, type ShowroomItem } from './thumb'
import { Stage } from '@/components/site/stage'
import { SiteInk } from './site-ink'

/**
 * The explorer under the hero: a section holding the sticky `bar` (a ViewfinderBar), if the area keeps its viewfinder
 * here rather than in the hero, over its `children` (a ShowroomGrid, or whatever the area lists its items in). Its
 * title is for assistive tech only, unless there's a `count`: then it's a heading over the grid, `All miniatures 62`.
 */
export function ShowroomExplorer({ title, titleId, count, bar, children }: { title: string; titleId: string; count?: number; bar?: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={titleId} className="border-t border-line">
      {bar}
      <h2 id={titleId} className={count === undefined ? 'sr-only' : 'gutter mx-auto flex max-w-[110rem] items-baseline gap-3 pt-10 type-title text-fg md:pt-14'}>
        {title}
        {/* The space is for assistive tech (`All loaders 228`); the gap draws it. */}
        {count !== undefined && (
          <>
            {' '}
            <span className="font-mono text-[13px] font-normal text-fg-subtle tabular-nums">{count}</span>
          </>
        )}
      </h2>
      {children}
    </section>
  )
}

/**
 * Every item as a card in the gallery's grid, at the hero's width. The page's ← and → leave it alone (it's
 * `data-showroom-grid`), so a card's arrows are the browser's.
 */
export function ShowroomGrid<T extends { id: string }>({
  id,
  label,
  items,
  renderItem,
}: {
  id?: string
  /** The list's accessible name: `62 objects`. */
  label: string
  items: T[]
  renderItem: (item: T, index: number) => ReactNode
}) {
  return (
    <ul
      data-showroom-grid=""
      id={id}
      aria-label={label}
      className="gallery-grid gutter mx-auto grid max-w-[110rem] grid-cols-2 pt-4 pb-12 sm:grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] md:pt-6 md:pb-16"
    >
      {items.map((item, i) => (
        // A card far from the view isn't styled, laid out or painted until it's scrolled near (it keeps its last height).
        // That clips its paint to the cell, so the cell reaches 4px past the card: room for the card's focus ring.
        <li key={item.id} data-item={item.id} className="-m-1 min-w-0 p-1 [contain-intrinsic-block-size:auto_16rem] [content-visibility:auto]">
          {renderItem(item, i)}
        </li>
      ))}
    </ul>
  )
}

export interface ShowroomCardProps {
  item: ShowroomItem
  /** On show in the hero: lit, and `On stage` in place of the meta. */
  current: boolean
  /** Its thumbnail loads at once (the first rows), not as it scrolls in. */
  eager: boolean
  /** A short word at the caption's end, and after the name for assistive tech: `tech`. */
  meta: string
  /** Where the card links (`?object=<id>`), so a modified click opens it in a tab. */
  href: string
  /** A plain click: put the item on show (and bring the hero back, useRevealHero). */
  onOpen: (id: string) => void
  /** The dotted ground under the thumbnail, matching a dotted hero plate. */
  dots?: boolean
}

/**
 * One item in the grid: its thumbnail in the site's light or dark on a stage, its name and meta; the whole card one
 * link, the list's card as everywhere else.
 * Memoized: a change of item re-renders only the card it lights and the one it leaves (give it a stable `onOpen`).
 */
export const ShowroomCard = memo(function ShowroomCard({ item, current, eager, meta, href, onOpen, dots }: ShowroomCardProps) {
  // The explorers' cards are ink at rest and take Youj's accent while pointed at or focused.
  const [lit, setLit] = useState(false)
  const light = dots ? { onPointerEnter: () => setLit(true), onPointerLeave: () => setLit(false), onFocus: () => setLit(true), onBlur: () => setLit(false) } : {}
  return (
    <div
      {...light}
      data-current={current || undefined}
      // Illustrations and loaders (the dotted ones) are one wash tile like the Blocks galleries; miniatures keep their own cream shots.
      data-gallery-tile={dots ? '' : undefined}
      data-paper-tile={dots ? undefined : ''}
      className={cn(
        'gallery-card site-card group/card data-current:border-accent-line',
      )}
    >
      <Stage className="gallery-stage relative aspect-[4/3]">
        {/* The hero plate's dotted ground (loaders, illustrations), clear close around the middle; a tile in light is one clean wash instead. */}
        {dots && <div aria-hidden className="dot-grid dots-edge pointer-events-none absolute inset-0" />}
        {hasThumb(item) ? (
          dots ? (
            <SiteInk ink={!lit}>
              <Thumbs item={item} eager={eager} />
            </SiteInk>
          ) : (
            <Thumbs item={item} eager={eager} />
          )
        ) : (
          <div className="grid size-full place-items-center font-mono text-[11px] tracking-wide text-fg-subtle uppercase">No thumbnail</div>
        )}
      </Stage>
      <div aria-hidden className="gallery-caption">
        <span className="gallery-title">{item.label}</span>
        {current ? (
          // A phone's card is narrow: the particle alone, so the name keeps its room.
          <span className="flex shrink-0 items-center gap-1.5 text-[11.5px] font-medium text-accent-text">
            <span className="particle size-[5px]" />
            <span className="max-sm:hidden">On stage</span>
          </span>
        ) : (
          <span className="gallery-meta font-mono text-[10.5px]! tracking-wide uppercase">{meta}</span>
        )}
      </div>
      <a
        href={href}
        className="gallery-link"
        aria-current={current || undefined}
        onClick={(e) => {
          if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
          e.preventDefault()
          onOpen(item.id)
        }}
      >
        <span className="sr-only">
          {item.label}, {meta}
          {current && ', on stage'}
        </span>
      </a>
    </div>
  )
})
