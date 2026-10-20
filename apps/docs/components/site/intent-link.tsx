'use client'

import { useSyncExternalStore, type ComponentProps, type MouseEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Router = ReturnType<typeof useRouter>

const seen = new Set<string>()

/* The page a click is on its way to, for the chrome that answers the click
 * before the page arrives (components/docs/pending-page.tsx). */
let pending: string | undefined
const subscribers = new Set<() => void>()
export function setPendingNav(path: string | undefined) {
  pending = path
  subscribers.forEach((f) => f())
}
export function usePendingNav() {
  return useSyncExternalStore(
    (f) => (subscribers.add(f), () => void subscribers.delete(f)),
    () => pending,
    () => undefined,
  )
}

/** Readers who asked for less data, or are on a slow link, get nothing ahead of time. */
export function frugal() {
  const c = (navigator as { connection?: { saveData?: boolean; effectiveType?: string } }).connection
  return !!c && (c.saveData === true || /2g/.test(c.effectiveType ?? ''))
}

/** Loads a route's data into the router once per visit (the router keeps it for staleTimes). */
export function prefetchRoute(router: Router, href: string) {
  if (seen.has(href) || frugal()) return
  seen.add(href)
  router.prefetch(href)
}

/**
 * A next/link that loads on intent, not on sight: nothing loads while it
 * scrolls past. A pointer resting on it (or focus, or a press) prefetches the
 * route, its data and its code, for the client router. Every click stays a
 * client navigation, so the header and the sidebars never re-render: only the
 * page changes. (A prerendered page taken with a real navigation arrives as a
 * new document, whose streamed chrome, the header's menus and the TOC,
 * appears a beat after the page.)
 */
export function IntentLink({ href, onPointerEnter, onPointerDown, onFocus, onClick, ...props }: ComponentProps<typeof Link>) {
  const router = useRouter()
  const url = typeof href === 'string' && href.startsWith('/') ? href : undefined
  const intent = () => url && prefetchRoute(router, url)

  return (
    <Link
      href={href}
      prefetch={false}
      onPointerEnter={(e) => (intent(), onPointerEnter?.(e))}
      onPointerDown={(e) => (intent(), onPointerDown?.(e))}
      onFocus={(e) => (intent(), onFocus?.(e))}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e)
        if (e.defaultPrevented || !url || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        const path = url.split(/[?#]/)[0]
        if (path !== location.pathname) setPendingNav(path)
      }}
      {...props}
    />
  )
}
