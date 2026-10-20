'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, type RefObject } from 'react'

/* What keeps unsaved changes from being lost, while the form is dirty:
 * - closing or reloading the tab asks first (the browser's own prompt);
 * - a link to another page of the app, anywhere outside the form, is held
 *   instead of followed, and `onBlocked` says so (with whether a key, not a
 *   pointer, pressed it). The click is caught before the app's router sees
 *   it, so this works with any router; once the form is clean again (saved
 *   or discarded), the held link is pressed again and goes where it went;
 * - ⌘S or Ctrl+S saves, from the form or from the page around it.
 * Links that open elsewhere (a new tab, a download, another site, a modifier
 * key, an anchor on this page) are left alone. */

interface GuardOptions {
  root: RefObject<HTMLElement | null>
  dirty: boolean
  /** Hold links and ask before the tab closes. ⌘S works either way. */
  guard: boolean
  onBlocked: (byKeyboard: boolean) => void
  onSave: () => void
}

export function useGuard({ root, dirty, guard, onBlocked, onSave }: GuardOptions) {
  const held = useRef<HTMLAnchorElement | null>(null)
  const latest = useRef({ onBlocked, onSave })
  useLayoutEffect(() => {
    latest.current = { onBlocked, onSave }
  })

  useEffect(() => {
    if (!dirty || !guard) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const link = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!link || root.current?.contains(link) || (link.target && link.target !== '_self') || link.hasAttribute('download')) return
      const to = new URL(link.href, window.location.href)
      const here = window.location
      if (to.origin !== here.origin || (to.pathname === here.pathname && to.search === here.search)) return
      event.preventDefault()
      event.stopPropagation()
      held.current = link
      latest.current.onBlocked(event.detail === 0)
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    // Capture on the document runs before a router's own click handler.
    document.addEventListener('click', onClick, true)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('click', onClick, true)
    }
  }, [dirty, guard, root])

  useEffect(() => {
    if (!dirty) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 's' || !(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return
      const active = document.activeElement
      if (active && active !== document.body && !root.current?.contains(active)) return
      event.preventDefault()
      latest.current.onSave()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [dirty, root])

  // Clean again with a link held: follow it.
  useEffect(() => {
    if (dirty || !held.current) return
    const link = held.current
    held.current = null
    if (link.isConnected) link.click()
  }, [dirty])

  /** Forget the held link: the person chose to stay. */
  const release = useCallback(() => {
    held.current = null
  }, [])
  return { release }
}
