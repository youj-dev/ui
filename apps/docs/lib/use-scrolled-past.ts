'use client'

import { useEffect, useState } from 'react'

/**
 * True once the page has scrolled past `height` (a CSS length) from its top.
 * An IntersectionObserver watches an invisible strip that tall at the top of
 * the document, so scrolling never reads `scrollY`: that read forced a style
 * and layout pass inside every scroll event, over whatever hover changes the
 * scroll had just caused.
 */
export function useScrolledPast(height: string): boolean {
  const [past, setPast] = useState(false)
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => entry && setPast(!entry.isIntersecting))
    observer.observe(stripFor(height))
    return () => observer.disconnect()
  }, [height])
  return past
}

/* One strip per height, kept for the next page: removing and re-adding a child
 * of <body> on every navigation restyled the whole page (sibling rules). */
const strips = new Map<string, HTMLElement>()

function stripFor(height: string) {
  let strip = strips.get(height)
  if (!strip?.isConnected) {
    strip = document.createElement('div')
    strip.setAttribute('aria-hidden', 'true')
    strip.style.cssText = `position:absolute;top:0;left:0;width:1px;height:${height};pointer-events:none;opacity:0`
    document.body.prepend(strip)
    strips.set(height, strip)
  }
  return strip
}
