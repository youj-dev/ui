'use client'

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { useDirection, useYouj } from '@youj/core'
import { useSiteTheme } from '@/lib/site-theme'

export type Scheme = 'light' | 'dark'

/** The item an id names, else the fallback's, else the first; null for none. */
export const pick = <T extends { id: string }>(items: T[], id: string | null, fallback?: string) =>
  (items.find((o) => o.id === id) ?? items.find((o) => o.id === fallback) ?? items[0])?.id ?? null

/** Names the item in the address (`?<param>=<id>`), or drops the name; replaces the entry, so Back leaves the page. */
export function writeParam(param: string, id: string | null) {
  const url = new URL(window.location.href)
  if (id) url.searchParams.set(param, id)
  else url.searchParams.delete(param)
  window.history.replaceState(window.history.state, '', url)
}

/**
 * The item on show, kept in the address as `?<param>=<id>` so a reload or a link keeps it: `initial` (what the
 * address named when the page was served), else `fallback`, else the first. An address naming no item loses its name.
 * `prev` and `next` go round: before the first comes the last, after the last the first (none for a single item).
 */
export function useShowroomSelection<T extends { id: string }>({
  items,
  param,
  initial,
  fallback,
}: {
  items: T[]
  param: string
  initial: string | null
  fallback?: string
}) {
  const [selected, setSelected] = useState(() => pick(items, initial, fallback))
  const index = items.findIndex((o) => o.id === selected)
  const n = items.length
  const prev = index >= 0 && n > 1 ? items[(index - 1 + n) % n] : undefined
  const next = index >= 0 && n > 1 ? items[(index + 1) % n] : undefined

  const select = useCallback(
    (id: string) => {
      setSelected(id)
      writeParam(param, id)
    },
    [param],
  )

  // Only the address the page was opened at, so no deps.
  useEffect(() => {
    if (initial && !items.some((o) => o.id === initial)) writeParam(param, null)
  }, [])

  return { selected, index, item: items[index], prev, next, select }
}

/** A key the arrows shouldn't take: a field, or a group that moves with them itself. */
export const ownsArrows = (target: Element) =>
  Boolean(target.closest('input, textarea, select, [contenteditable="true"], [role="toolbar"], [role="radiogroup"], [role="group"], [role="tablist"], [role="slider"], [role="menu"], [role="listbox"]'))

/**
 * ← and → (mirrored right to left) step to `prev` and `next` from anywhere on the page, except a field, a group that
 * moves with the arrows itself, or the explorer's grid; never with a modifier. A frame's document takes its own keys.
 */
export function useArrowStepping<T extends { id: string }>({ prev, next, onStep }: { prev: T | undefined; next: T | undefined; onStep: (id: string) => void }) {
  const direction = useDirection()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.metaKey || e.ctrlKey || e.shiftKey || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return
      if (e.target instanceof Element && (ownsArrows(e.target) || e.target.closest('[data-showroom-grid]'))) return
      const back = (e.key === 'ArrowLeft') !== (direction === 'rtl')
      const to = back ? prev : next
      if (!to) return
      e.preventDefault()
      onStep(to.id)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [prev, next, direction, onStep])
}

/**
 * Brings the hero back for an item picked below it: `reveal()` glides the page up to the hero (jumps under reduced
 * motion) and lands focus on the element `focusId` names (the item's name) once it has rendered.
 */
export function useRevealHero(hero: RefObject<HTMLElement | null>, focusId: string) {
  const k = useYouj()
  // Bumped by each reveal: focus moves once the new item is there.
  const [request, setRequest] = useState(0)
  useEffect(() => {
    if (request) document.getElementById(focusId)?.focus({ preventScroll: true })
  }, [request, focusId])
  // One function for the page's life, so a memoized card handed it doesn't re-render.
  const reduced = useRef(k.reduced)
  reduced.current = k.reduced
  return useCallback(() => {
    hero.current?.scrollIntoView({ behavior: reduced.current ? 'instant' : 'smooth', block: 'start' })
    setRequest((n) => n + 1)
  }, [hero])
}

/**
 * The stage's light or dark: the site's theme, live, unless the stage's own switch has overridden it for this item;
 * the override is dropped when the item or the site's theme changes. `mounted` is false until the site's theme is known.
 */
export function useStageScheme(itemId: string) {
  const site = useSiteTheme()
  const siteScheme: Scheme = site.dark ? 'dark' : 'light'
  const [override, setOverride] = useState<Scheme | null>(null)
  const [basis, setBasis] = useState({ id: itemId, site: siteScheme })
  const stale = basis.id !== itemId || basis.site !== siteScheme
  if (stale) {
    setBasis({ id: itemId, site: siteScheme })
    setOverride(null)
  }
  const scheme = (stale ? null : override) ?? siteScheme
  return { scheme, setScheme: setOverride, mounted: site.mounted }
}
