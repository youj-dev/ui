'use client'

import { useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { useYouj, type EasingToken } from '@youj/core'

/* When an explorer's results change (a search, a filter), its cards move
 * rather than pop: the ones leaving fade and shrink away where they stood
 * (clones, since the real ones are gone by then), the ones staying slide from
 * where they were to where they are now (FLIP), and the ones arriving fade
 * and rise in, a few frames apart, the last no later than a short cap. Only
 * cards on screen take part, so 511 icons cost what 30 do. A change that
 * comes hard on the last one (typing), a big one (a new page more than a
 * move), a grid scrolled away from its top (a new result set starts there) and
 * reduced motion land at once.
 *
 * The grid renders what this returns: on a change it shows the old results for
 * one more render, long enough to measure them and clone the leavers, then the
 * new ones, which it measures and animates before the browser paints either.
 * Cards carry `data-id`; WAAPI does the moving (transform and opacity only). */

/** Cards on screen that may take part; more than that arrives at once. */
const MAX = 48
/** A change this soon after the last one (ms) lands at once: typing shouldn't animate every key. */
const QUICK = 220
/** Arriving cards start this far apart (ms), the last no later than CAP. */
const STEP = 16
const CAP = 140

type Spot = { x: number; y: number; width: number; height: number }

const sameIds = (a: readonly { id: string }[], b: readonly { id: string }[]) => a.length === b.length && a.every((item, i) => item.id === b[i]!.id)

/** Without the Web Animations API (an old browser, a test's DOM) results simply swap. */
const canAnimate = () => typeof Element !== 'undefined' && typeof Element.prototype.animate === 'function'

/** The cards inside `box` that are on screen in `view`, with where they are relative to `box`. */
function onScreen(box: HTMLElement, view: HTMLElement) {
  const origin = box.getBoundingClientRect()
  const viewport = view.getBoundingClientRect()
  const out: { el: HTMLElement; id: string; spot: Spot }[] = []
  for (const el of box.querySelectorAll<HTMLElement>('[data-id]')) {
    const r = el.getBoundingClientRect()
    if (r.bottom <= viewport.top || r.top >= viewport.bottom) continue
    out.push({ el, id: el.dataset.id!, spot: { x: r.left - origin.left, y: r.top - origin.top, width: r.width, height: r.height } })
  }
  return out
}

export function useResultMotion<T extends { id: string }>(items: T[], grid: RefObject<HTMLElement | null>, scroller: RefObject<HTMLElement | null>): T[] {
  const k = useYouj()
  const [shown, setShown] = useState(items)
  const before = useRef<Map<string, Spot> | null>(null)
  const last = useRef(0)
  const running = useRef(new Set<Animation>())
  const curve = (token: EasingToken) => `cubic-bezier(${k.ease(token).join(', ')})`
  const track = (animation: Animation) => {
    running.current.add(animation)
    animation.finished.then(
      () => running.current.delete(animation),
      () => running.current.delete(animation),
    )
  }

  // The old results are still on screen: measure them, send the leavers off as clones, then show the new ones.
  // biome-ignore lint/correctness/useExhaustiveDependencies: deps are chosen by hand
  useLayoutEffect(() => {
    if (items === shown) return
    // The same cards (a list rebuilt with nothing new in it) change nothing on screen.
    if (sameIds(items, shown)) return
    const now = performance.now()
    const quick = now - last.current < QUICK
    last.current = now
    for (const animation of running.current) animation.finish()
    running.current.clear()
    before.current = null
    const box = grid.current
    const view = scroller.current
    if (!k.reduced && !quick && canAnimate() && box && view && view.scrollTop < 1) {
      const cards = onScreen(box, view)
      const next = new Set(items.map((item) => item.id))
      if (cards.length && cards.length <= MAX) {
        before.current = new Map(cards.map((c) => [c.id, c.spot]))
        for (const card of cards) if (!next.has(card.id)) leave(card.el, card.spot, box)
      }
    }
    setShown(items)
  }, [items])

  // The new results are laid out and not yet painted: slide the stayers from where they were, bring the arrivals in.
  // biome-ignore lint/correctness/useExhaustiveDependencies: deps are chosen by hand
  useLayoutEffect(() => {
    const was = before.current
    before.current = null
    const box = grid.current
    const view = scroller.current
    if (!was || !box || !view) return
    const moving: { el: HTMLElement; dx: number; dy: number }[] = []
    const arriving: HTMLElement[] = []
    for (const card of onScreen(box, view)) {
      const from = was.get(card.id)
      const dx = from ? from.x - card.spot.x : 0
      const dy = from ? from.y - card.spot.y : 0
      // A card that stays near where it was slides there; one from far across the grid arrives instead, so cards never cross the page over each other.
      if (!from || Math.abs(dy) > card.spot.height * 1.25 || Math.abs(dx) > card.spot.width * 2.5) arriving.push(card.el)
      else if (Math.abs(dx) + Math.abs(dy) > 0.5) moving.push({ el: card.el, dx, dy })
    }
    if (moving.length + arriving.length > MAX) return
    for (const { el, dx, dy } of moving) {
      track(el.animate([{ translate: `${dx}px ${dy}px` }, { translate: '0 0' }], { duration: k.ms('base'), easing: curve('standard') }))
    }
    // Arrivals come in as the leavers clear, a few frames apart.
    const lead = k.ms('instant') / 2
    arriving.forEach((el, i) => {
      track(
        el.animate([{ opacity: 0, translate: '0 8px', scale: 0.98 }, { opacity: 1, translate: '0 0', scale: 1 }], {
          duration: k.ms('base'),
          easing: curve('enter'),
          delay: lead + Math.min(i * STEP, CAP),
          fill: 'backwards',
        }),
      )
    })
  }, [shown])

  /** A leaving card's clone, where it stood, fading and shrinking away under the new layout; gone once it has. */
  function leave(el: HTMLElement, spot: Spot, box: HTMLElement) {
    const ghost = el.cloneNode(true) as HTMLElement
    ghost.removeAttribute('data-id')
    ghost.removeAttribute('data-index')
    ghost.removeAttribute('role')
    ghost.removeAttribute('tabindex')
    ghost.setAttribute('aria-hidden', 'true')
    ghost.inert = true
    Object.assign(ghost.style, {
      position: 'absolute',
      left: `${spot.x}px`,
      top: `${spot.y}px`,
      width: `${spot.width}px`,
      height: `${spot.height}px`,
      margin: '0',
      pointerEvents: 'none',
    })
    // First in the grid, so it paints under the cards taking its place.
    box.insertBefore(ghost, box.firstChild)
    const animation = ghost.animate([{ opacity: 1, scale: 1 }, { opacity: 0, scale: 0.94 }], { duration: k.ms('fast'), easing: curve('standard'), fill: 'forwards' })
    track(animation)
    animation.finished.then(
      () => ghost.remove(),
      () => ghost.remove(),
    )
  }

  return shown
}
