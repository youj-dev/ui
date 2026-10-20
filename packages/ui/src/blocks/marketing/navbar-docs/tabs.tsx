'use client'

import { useLayoutEffect, useRef, type CSSProperties, type ElementType, type MouseEvent } from 'react'
import { useYouj } from '@youj/core'
import { SlidingIndicator } from '@youj/motion'
import type { NavbarDocsSection } from './data'

/* The section tabs under the bar: links, the current one marked by an
 * underline that glides to it on the header's bottom edge, and a hover pill
 * that follows the pointer and keyboard focus. Too many for a phone, they
 * scroll sideways, each edge fading by how much lies beyond it, and the
 * current one is kept in sight (the row scrolls itself, never the page). */

/** How far the edges fade, in px, and the room kept around a tab scrolled into sight. */
const FADE = 24

interface SectionTabsProps {
  sections: NavbarDocsSection[]
  value: string
  onSelect: (id: string, event: MouseEvent<HTMLAnchorElement>) => void
  label: string
  Link: ElementType
}

export function SectionTabs({ sections, value, onSelect, label, Link }: SectionTabsProps) {
  const k = useYouj()
  const row = useRef<HTMLElement>(null)
  const moved = useRef(false)

  // Each edge fades by what lies beyond it; set on the element, so scrolling never re-renders.
  useLayoutEffect(() => {
    const el = row.current
    if (!el) return
    const fade = () => {
      const beyond = el.scrollWidth - el.clientWidth
      const start = Math.min(FADE, Math.abs(el.scrollLeft))
      const end = Math.min(FADE, Math.max(0, beyond - Math.abs(el.scrollLeft)))
      const rtl = getComputedStyle(el).direction === 'rtl'
      el.style.setProperty('--fade-left', `${rtl ? end : start}px`)
      el.style.setProperty('--fade-right', `${rtl ? start : end}px`)
    }
    fade()
    el.addEventListener('scroll', fade, { passive: true })
    const resize = new ResizeObserver(fade)
    resize.observe(el)
    return () => {
      el.removeEventListener('scroll', fade)
      resize.disconnect()
    }
  }, [])

  // Keep the current tab in sight: at once the first time, smoothly after.
  useLayoutEffect(() => {
    const first = !moved.current
    moved.current = true
    const el = row.current
    const tab = el?.querySelector<HTMLElement>('[aria-current=page]')
    if (!el || !tab || el.scrollWidth <= el.clientWidth) return
    const box = el.getBoundingClientRect()
    const at = tab.getBoundingClientRect()
    const pad = FADE + 8
    const delta = at.left - pad < box.left ? at.left - pad - box.left : at.right + pad > box.right ? at.right + pad - box.right : 0
    if (Math.abs(delta) >= 1) el.scrollBy({ left: delta, behavior: first || k.reduced ? 'auto' : 'smooth' })
  }, [value, k.reduced])

  return (
    <nav
      ref={row}
      aria-label={label}
      data-slot="navbar-docs-sections"
      style={{ '--fade-left': '0px', '--fade-right': '0px' } as CSSProperties}
      className="relative isolate -mb-px flex overflow-x-auto px-1.5 [scrollbar-width:none] [mask-image:linear-gradient(to_right,transparent,black_var(--fade-left),black_calc(100%_-_var(--fade-right)),transparent)] md:px-3 [&::-webkit-scrollbar]:hidden"
    >
      {sections.map((section) => (
        <Link
          key={section.id}
          href={section.href}
          aria-current={section.id === value ? 'page' : undefined}
          onClick={(event: MouseEvent<HTMLAnchorElement>) => onSelect(section.id, event)}
          className="relative inline-flex h-control-lg shrink-0 items-center rounded-xl px-3 text-ui font-medium whitespace-nowrap text-fg-muted transition-colors yj-duration-fast ease-standard select-none hover:text-fg focus-visible:outline-2 focus-visible:-outline-offset-6 focus-visible:outline-focus focus-visible:outline-solid aria-[current=page]:text-fg"
        >
          {section.label}
        </Link>
      ))}
      <SlidingIndicator follow="hover" className="bg-transparent before:absolute before:inset-1.5 before:rounded-md before:bg-hover" />
      <SlidingIndicator variant="underline" data-slot="navbar-docs-current" />
    </nav>
  )
}
