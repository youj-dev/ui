'use client'

import { memo, useEffect, useRef, useState } from 'react'
import type { SceneEntry } from './catalog'
import { SceneStill } from './scene-frame'

/* A scene in the viewfinder's strip: its finished frame (./scene-frame's SceneStill, markup after its first drawing),
 * cropped close in the square. The strip is three copies of every scene, over four hundred squares, and a few dozen
 * show at once: a square (or a card in the grid under the hero) carries its drawing only while it's in the strip's view or half a view either side of it. */

type Watcher = (near: boolean) => void

/** One observer per strip, shared by its squares. */
const observers = new Map<Element | null, { io: IntersectionObserver; watchers: Map<Element, Watcher> }>()

function watch(el: Element, onChange: Watcher) {
  const root = el.closest('[role=listbox]')
  let entry = observers.get(root)
  if (!entry) {
    const watchers = new Map<Element, Watcher>()
    const io = new IntersectionObserver((changes) => changes.forEach((c) => watchers.get(c.target)?.(c.isIntersecting)), { root, rootMargin: root ? '0px 50%' : '60% 0px' })
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

export const StripThumb = memo(function StripThumb({ scene, square = true }: { scene: SceneEntry; square?: boolean }) {
  const box = useRef<HTMLSpanElement>(null)
  const [near, setNear] = useState(false)
  useEffect(() => {
    const el = box.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    return watch(el, setNear)
  }, [])
  return (
    <span ref={box} aria-hidden className="absolute inset-0 grid place-items-center overflow-hidden">
      {near && <SceneStill scene={scene} className={square ? 'w-[132%] max-w-none shrink-0 translate-y-[3%]' : 'w-[74%] max-w-none shrink-0'} />}
    </span>
  )
})
