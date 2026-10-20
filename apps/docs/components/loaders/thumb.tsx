'use client'

import { createContext, memo, useContext, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { useLoader } from './live'

/* A loader's thumbnail, in the viewfinder's strip, the search's rows and the cards under the hero: its still frame,
 * the one it shows before its script runs, drawn once and held (one paused canvas, never on the ticker; under reduced
 * motion the kit's SVG still). Only the stage plays. The strip is three copies of every loader and the grid holds all
 * of them, so a thumbnail fetches its loader (a chunk of its own) and draws only once it's in view or near it. It's
 * sized to its box: about three fifths of its height, narrower for a wide one, whatever the box. Inked in the page's
 * two colors (LoaderInk), so the strip and the grid follow the panel's. */

/** The colors every thumbnail is inked in: the panel's `color` and `accentColor`, and its parts in Mono (the default) or the theme's colors (`colors="theme"`). */
export const LoaderInk = createContext<{ ink: string | undefined; accent: string | undefined; colors?: 'theme' }>({ ink: undefined, accent: undefined })

type Watcher = (near: boolean) => void

/** One observer per scroller (a strip's listbox, the search's list) or for the page, shared by its thumbnails. */
const observers = new Map<Element | null, { io: IntersectionObserver; watchers: Map<Element, Watcher> }>()

function watch(el: Element, onChange: Watcher) {
  const root = el.closest('[role=listbox]')
  let entry = observers.get(root)
  if (!entry) {
    const watchers = new Map<Element, Watcher>()
    const io = new IntersectionObserver((changes) => changes.forEach((c) => watchers.get(c.target)?.(c.isIntersecting)), { root, rootMargin: root ? '50%' : '50% 0px' })
    entry = { io, watchers }
    observers.set(root, entry)
  }
  entry.watchers.set(el, onChange)
  entry.io.observe(el)
  return () => {
    entry.io.unobserve(el)
    entry.watchers.delete(el)
    if (!entry.watchers.size) {
      entry.io.disconnect()
      observers.delete(root)
    }
  }
}

export const LoaderThumb = memo(function LoaderThumb({ id, square }: { id: string; square: boolean }) {
  const box = useRef<HTMLSpanElement>(null)
  const [near, setNear] = useState(false)
  useEffect(() => {
    const el = box.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    return watch(el, setNear)
  }, [])
  const { Component } = useLoader(near ? id : null)
  const { ink, accent, colors } = useContext(LoaderInk)
  return (
    <span
      ref={box}
      aria-hidden
      className={cn(
        'absolute inset-0 grid place-items-center overflow-hidden [container-type:size]',
        // On the surface a strip's square and a search row's are; a card's well is the list's stage.
        square ? '[--thumb-h:60cqh] [--thumb-w:86cqw] [--yj-anim-paper:var(--color-surface)]' : '[--thumb-h:50cqh] [--thumb-w:72cqw] [--yj-anim-paper:var(--color-canvas)]',
      )}
    >
      {Component && (
        <Component
          size={square ? 48 : 96}
          paused
          label={null}
          color={ink}
          accentColor={accent}
          colors={colors}
          // The drawing (the root's one span, with no label) sized to the thumbnail's box; important, so the kit's own height gives way.
          className="text-fg [&>span]:h-auto! [&>span]:w-[min(calc(var(--thumb-h)*var(--yj-anim-aspect)),var(--thumb-w))]!"
        />
      )}
    </span>
  )
})
