'use client'

import { useEffect, useEffectEvent } from 'react'

/* Content a page keeps folded (a Reference row, an inactive Examples tab) opens
 * for the element a link points at. The hash (a link, the browser's history, the
 * address bar) and this event (the TOC popover, which knows its target) both
 * land in `reveal`, and so does a first render with a hash. */

const REVEAL_EVENT = 'docs:reveal'

/** Ask folded content to open for `target`. */
export function revealTarget(target: HTMLElement | null) {
  if (target) window.dispatchEvent(new CustomEvent(REVEAL_EVENT, { detail: target }))
}

/** Reveal what the current hash points at: for a navigation that doesn't fire `hashchange` (the router's). */
export function revealHash() {
  revealTarget(hashTarget())
}

function hashTarget() {
  const id = decodeURIComponent(window.location.hash.slice(1))
  return id ? document.getElementById(id) : null
}

/** Calls `reveal` with the element a hash or a `revealTarget` names, when there is one. */
export function useReveal(reveal: (target: HTMLElement) => void) {
  const onReveal = useEffectEvent(reveal)
  useEffect(() => {
    const fromHash = () => {
      const target = hashTarget()
      if (target) onReveal(target)
    }
    const fromEvent = (event: Event) => onReveal((event as CustomEvent<HTMLElement>).detail)
    fromHash()
    window.addEventListener('hashchange', fromHash)
    window.addEventListener(REVEAL_EVENT, fromEvent)
    return () => {
      window.removeEventListener('hashchange', fromHash)
      window.removeEventListener(REVEAL_EVENT, fromEvent)
    }
  }, [])
}
