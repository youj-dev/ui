'use client'

import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'

/** The title over the grid and a line under it. */
export function GridHeading({ id, as: Heading, title, description }: { id: string; as: 'h1' | 'h2' | 'h3' | 'h4'; title: ReactNode; description?: ReactNode }) {
  return (
    <header data-slot="data-grid-header" className="flex min-w-0 flex-col gap-0.5">
      <Heading id={id} className="text-ui-lg font-semibold tracking-tight text-balance text-fg">
        {title}
      </Heading>
      {description && <p className="text-ui-sm text-pretty text-fg-muted">{description}</p>}
    </header>
  )
}

/**
 * Watches the scroll area's edges: `data-overflow-start`/`-end` while columns
 * hide under a side (the pinned columns' shadows read them), `data-scrolled`
 * once rows pass under the header, and the view's width for detail panels.
 * Written only when they change: a custom property or an attribute on the
 * scroll area restyles everything inside it, so a scroll frame writes nothing.
 * `schedule` re-checks after a render (sizes and pinning change the width).
 */
export function useScrollEdges(scrollRef: RefObject<HTMLDivElement | null>, cards: boolean) {
  const schedule = useRef<() => void>(() => {})
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let frame = 0
    let width = ''
    const flag = (name: string, on: boolean) => {
      if (el.hasAttribute(name) !== on) el.toggleAttribute(name, on)
    }
    const measure = () => {
      frame = 0
      const max = el.scrollWidth - el.clientWidth
      const x = Math.abs(el.scrollLeft)
      flag('data-overflow-start', x > 0.5)
      flag('data-overflow-end', max - x > 0.5)
      flag('data-scrolled', el.scrollTop > 0.5)
      const next = `${el.clientWidth}px`
      if (next !== width) el.style.setProperty('--dg-view-w', (width = next))
    }
    const update = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    measure()
    schedule.current = update
    el.addEventListener('scroll', update, { passive: true })
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update)
    observer?.observe(el)
    return () => {
      cancelAnimationFrame(frame)
      schedule.current = () => {}
      el.removeEventListener('scroll', update)
      observer?.disconnect()
    }
  }, [scrollRef, cards])
  return schedule
}

/**
 * The frame's height, held from its first paint unless the app sizes the
 * table with `height`: a search, a filter, a shorter page, another
 * density or an empty state never resize the block; rows scroll inside it.
 * It follows the UI scale.
 */
export function useSteadyHeight(frameRef: RefObject<HTMLDivElement | null>, sized: boolean, scale: number) {
  const [held, setHeld] = useState<{ height: number; scale: number }>()
  useLayoutEffect(() => {
    if (sized || held) return
    const height = frameRef.current?.offsetHeight
    if (!height) return
    const frame = requestAnimationFrame(() => setHeld({ height, scale }))
    return () => cancelAnimationFrame(frame)
  })
  return sized || !held ? undefined : (held.height * scale) / held.scale
}
