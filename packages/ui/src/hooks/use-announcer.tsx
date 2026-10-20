import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * A polite live region for changes a screen reader wouldn't otherwise hear
 * (a chip removed, a selection cleared, a tag moved). Render `announcer`
 * once, from the first render, since several screen readers ignore a live
 * region that arrives with its message already inside; then call
 * `announce(text)`. Saying the same thing twice is still announced.
 */
export function useAnnouncer() {
  const [message, setMessage] = useState('')
  const announce = useCallback((text: string) => setMessage((prev) => (prev === text ? `${text} ` : text)), [])
  const announcer = (
    <span role="status" aria-live="polite" className="sr-only">
      {message}
    </span>
  )
  return { announce, announcer }
}

/**
 * Live regions you render yourself, written straight to the node so
 * announcing never re-renders the component: attach `politeRef` and
 * `assertiveRef` to two `sr-only` elements (`role="status"`, `role="alert"`)
 * that exist from the first render. The node is cleared first, so the same
 * sentence twice is still spoken; `delay` coalesces a burst into its last
 * message.
 */
export function useLiveRegion() {
  const polite = useRef<HTMLDivElement>(null)
  const assertive = useRef<HTMLDivElement>(null)
  const timers = useRef<{ polite?: ReturnType<typeof setTimeout>; assertive?: ReturnType<typeof setTimeout> }>({})

  useEffect(() => {
    const pending = timers.current
    return () => {
      clearTimeout(pending.polite)
      clearTimeout(pending.assertive)
    }
  }, [])

  const announce = useCallback((message: string, options?: { assertive?: boolean; delay?: number }) => {
    const politeness = options?.assertive ? 'assertive' : 'polite'
    const node = (options?.assertive ? assertive : polite).current
    if (!node) return
    clearTimeout(timers.current[politeness])
    timers.current[politeness] = setTimeout(() => {
      node.textContent = ''
      timers.current[politeness] = setTimeout(() => {
        node.textContent = message
      }, 30)
    }, options?.delay ?? 0)
  }, [])

  return { politeRef: polite, assertiveRef: assertive, announce }
}
