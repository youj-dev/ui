'use client'

import { anchorNavLabels } from '@youj/core/labels'
import { useCallback, useEffect, useRef, useState, type ComponentProps, type MouseEvent, type ReactNode, type RefObject } from 'react'
import { SlidingIndicator } from '@youj/motion'
import { useComponentLabels } from '@youj/core/labels'
import { useYouj } from '@youj/core/lib/youj/provider'
import { cn } from '../../lib/utils'

/* A table of contents that follows the reader (a scrollspy). The section in
 * view is marked aria-current="location" and a bar on the list's start edge,
 * one motion SlidingIndicator, glides to it on the smooth spring. The section
 * in view is the last one whose top has passed a reading line a quarter of the
 * way down, below `offset` (the height of any sticky header); at the very
 * bottom of the page it is the last section.
 * Choosing a link scrolls smoothly to its section, instantly under reduced
 * motion, then moves focus there (without scrolling again) and updates the
 * URL hash; while that scroll runs the bar goes straight to the destination
 * instead of stepping through every section on the way. Wheel or touch input
 * mid-scroll hands control back to the reader. */

interface AnchorNavItem {
  /** The id of the section's element. */
  id: string
  label: ReactNode
  /** Nesting level, 0 for top-level sections. */
  depth?: number
}

interface AnchorNavProps extends Omit<ComponentProps<'nav'>, 'title'> {
  items: AnchorNavItem[]
  /** A caption above the list. Default "On this page"; `null` for none. */
  title?: ReactNode
  /** The element that scrolls the sections. Default: the page. */
  scrollContainer?: RefObject<HTMLElement | null>
  /** Space kept above a section: where a chosen one lands (clear a sticky header with it). Default 16. */
  offset?: number
}

function AnchorNav({
  items,
  title: titleProp,
  scrollContainer,
  offset = 16,
  className,
  'aria-label': label,
  ...props
}: AnchorNavProps) {
  const k = useYouj()
  const labels = useComponentLabels(anchorNavLabels)
  const title = titleProp === undefined ? labels.onThisPage : titleProp
  const [active, setActive] = useState(items[0]?.id)
  // The destination of a scroll we started, until that scroll settles.
  const target = useRef<string | null>(null)

  const scroller = useCallback(() => scrollContainer?.current ?? null, [scrollContainer])
  // Re-subscribe when the sections change, not whenever a new array arrives.
  const ids = items.map((item) => item.id).join(' ')

  useEffect(() => {
    const el = scroller()
    const source: HTMLElement | Window = el ?? window
    let raf = 0
    let settle: ReturnType<typeof setTimeout> | undefined

    const measure = () => {
      raf = 0
      if (target.current) return
      const top = el ? el.getBoundingClientRect().top : 0
      const atEnd = el
        ? el.scrollTop + el.clientHeight >= el.scrollHeight - 2
        : window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2
      // A section is reached once its top passes a line a quarter of the way
      // down the scroller (below the offset), where the eye is reading.
      const line = offset + (el ? el.clientHeight : window.innerHeight) / 4
      const list = ids.split(' ')
      let current = list[0]
      for (const id of list) {
        const section = document.getElementById(id)
        if (section && section.getBoundingClientRect().top - top <= line) current = id
      }
      if (atEnd && (el ? el.scrollTop : window.scrollY) > 0) current = list.at(-1) ?? current
      setActive(current)
    }
    const release = () => {
      clearTimeout(settle)
      if (!target.current) return
      target.current = null
      measure()
    }
    const onScroll = () => {
      // Browsers without scrollend: the scroll has settled once events stop.
      if (target.current) {
        clearTimeout(settle)
        settle = setTimeout(release, 150)
      }
      if (!raf) raf = requestAnimationFrame(measure)
    }
    const interrupt = () => {
      if (target.current) release()
    }

    measure()
    source.addEventListener('scroll', onScroll, { passive: true })
    source.addEventListener('scrollend', release)
    source.addEventListener('wheel', interrupt, { passive: true })
    source.addEventListener('touchstart', interrupt, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(settle)
      source.removeEventListener('scroll', onScroll)
      source.removeEventListener('scrollend', release)
      source.removeEventListener('wheel', interrupt)
      source.removeEventListener('touchstart', interrupt)
      window.removeEventListener('resize', onScroll)
    }
  }, [ids, offset, scroller])

  const go = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    const section = document.getElementById(id)
    if (!section || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
    event.preventDefault()
    const el = scroller()
    const top = el ? el.getBoundingClientRect().top : 0
    const distance = section.getBoundingClientRect().top - top - offset
    const behavior = k.reduced ? 'auto' : 'smooth'
    target.current = k.reduced || Math.abs(distance) < 1 ? null : id
    setActive(id)
    if (el) el.scrollTo({ top: el.scrollTop + distance, behavior })
    else window.scrollTo({ top: window.scrollY + distance, behavior })
    history.replaceState(null, '', `#${id}`)
    if (!section.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(section.tagName)) section.setAttribute('tabindex', '-1')
    section.focus({ preventScroll: true })
  }

  return (
    <nav
      data-slot="anchor-nav"
      data-reduced-motion={k.reduced || undefined}
      aria-label={label ?? (typeof title === 'string' ? title : labels.onThisPage)}
      className={cn('own:flex flex-col gap-2 own:text-ui', className)}
      {...props}
    >
      {title && <div className="own:text-ui-sm own:font-medium text-fg">{title}</div>}
      <ul className="relative isolate flex flex-col border-s border-line">
        {items.map((item) => (
          <li key={item.id} className="flex">
            <a
              href={`#${item.id}`}
              aria-current={item.id === active ? 'location' : undefined}
              onClick={(event) => go(event, item.id)}
              className={cn(
                'flex min-h-7 flex-1 items-center rounded-e-md py-1 pe-2 text-fg-muted',
                'transition-colors yj-duration-fast ease-standard hover:text-fg aria-[current=location]:text-fg',
                'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
                (item.depth ?? 0) === 0 ? 'ps-3' : (item.depth ?? 0) === 1 ? 'ps-6' : 'ps-9',
              )}
            >
              {item.label}
            </a>
          </li>
        ))}
        <SlidingIndicator
          data-slot="anchor-nav-indicator"
          match='[aria-current="location"]'
          className="bg-transparent before:absolute before:inset-y-1 before:-start-px before:w-0.5 before:rounded-full before:bg-accent"
        />
      </ul>
    </nav>
  )
}

export { AnchorNav }
export type { AnchorNavItem, AnchorNavProps }
