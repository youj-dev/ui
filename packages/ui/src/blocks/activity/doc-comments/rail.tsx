'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react'
import { useYouj } from '@youj/core'
import { cn } from '../../../lib/utils'
import { layoutRail } from './layout'

/* The rail beside the document. Where there's room (the block is at least
 * 48rem wide), each card floats level with its words, laid out by
 * layoutRail: the active card on its anchor and a step toward the text, the
 * rest pushed clear of it. The cards glide there on the CSS spring (a
 * transition, so a change mid-flight carries on from where a card is), and a
 * new card fades in where it lands. Positions are written straight onto the
 * cards, so typing in a reply moves its neighbours without re-rendering the
 * block. Narrower, the rail is a plain list under the document, in order.
 * Reduced motion: cards jump, nothing fades. */

export interface RailCard {
  id: string
  node: ReactNode
}

export function Rail({
  cards,
  active,
  doc: docRef,
  label,
  empty,
}: {
  cards: readonly RailCard[]
  active: string | null
  doc: RefObject<HTMLDivElement | null>
  label: string
  empty?: ReactNode
}) {
  const k = useYouj()
  const rail = useRef<HTMLOListElement>(null)
  const nodes = useRef(new Map<string, HTMLLIElement>())
  const order = cards.map((c) => c.id).join(' ')

  const place = useCallback(() => {
    const list = rail.current
    const text = docRef.current
    if (!list || !text) return
    const items = [...list.children].filter((el): el is HTMLLIElement => el instanceof HTMLLIElement && !!el.dataset.yjCard)
    const floating = items.length > 0 && getComputedStyle(items[0]!).position === 'absolute'
    if (!floating) {
      for (const el of items) el.style.translate = ''
      list.style.minHeight = ''
      return
    }
    // Anchors in the rail's own coordinates: it starts above the text (beside the header), which leaves cards room to move up.
    const top = list.getBoundingClientRect().top
    const rtl = getComputedStyle(list).direction === 'rtl'
    let last = 0
    const measured = items.map((el) => {
      const id = el.dataset.yjCard!
      const mark = text.querySelector(id === 'draft' ? '[data-yj-draft]' : `[data-yj-threads~="${id.replace(/["\\]/g, '\\$&')}"]`)
      // A card sits a few px above its line, so its first line of text meets the words.
      last = mark ? mark.getBoundingClientRect().top - top - 6 : last
      return { id, anchor: last, height: el.offsetHeight, el }
    })
    const tops = layoutRail(measured, active)
    let bottom = 0
    for (const { id, el, height } of measured) {
      const y = tops.get(id) ?? 0
      bottom = Math.max(bottom, y + height)
      const x = id === active ? (rtl ? 8 : -8) : 0
      const next = `${x}px ${y}px`
      if (el.style.translate === next) continue
      if (!el.dataset.yjPlaced) {
        // Its first place: no glide from the top. It fades in there instead.
        el.style.transition = 'none'
        el.style.translate = next
        void el.offsetHeight
        el.style.transition = ''
        el.dataset.yjPlaced = ''
        if (!k.reduced && list.dataset.yjPlaced !== undefined) {
          const easing = `cubic-bezier(${k.ease('enter').join(',')})` // youj-allow: the enter token's own curve, for a Web Animation
          el.animate({ opacity: [0, 1], scale: [0.98, 1] }, { duration: k.ms('base'), easing })
        }
      } else el.style.translate = next
    }
    list.style.minHeight = `${bottom}px`
    list.dataset.yjPlaced = ''
  }, [active, docRef, k])

  // After every render, before paint: the cards' places follow the text and each other.
  useLayoutEffect(() => {
    place()
  })

  // biome-ignore lint/correctness/useExhaustiveDependencies: `order` changes when cards come and go, and each new card needs observing
  useEffect(() => {
    const list = rail.current
    const text = docRef.current
    if (!list || !text || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => place())
    observer.observe(text)
    observer.observe(list)
    for (const el of nodes.current.values()) observer.observe(el)
    void document.fonts?.ready.then(() => place())
    return () => observer.disconnect()
  }, [place, order, docRef])

  return (
    <ol ref={rail} aria-label={label} data-slot="doc-rail" className="group/rail relative flex flex-col gap-3 @3xl:block">
      {cards.map((card) => (
        <li
          key={card.id}
          data-yj-card={card.id}
          ref={(el) => {
            if (el) nodes.current.set(card.id, el)
            else nodes.current.delete(card.id)
          }}
          className={cn(
            '@3xl:absolute @3xl:inset-x-0 @3xl:top-0',
            // Hidden until the first layout has placed it; after that it glides on the CSS spring.
            '@3xl:opacity-0 @3xl:group-data-yj-placed/rail:opacity-100',
            'transition-[translate] [transition-duration:calc(var(--yj-duration-spring)*var(--yj-motion,1))] [transition-timing-function:var(--ease-spring)]',
          )}
        >
          {card.node}
        </li>
      ))}
      {cards.length === 0 && empty}
    </ol>
  )
}
