export interface OnScreenOptions {
  /** IntersectionObserver rootMargin, to count a little beyond the viewport as on screen. */
  rootMargin?: string
  /** Also report the starting state right away (on screen unless the tab is hidden), instead of waiting for the first change. */
  immediate?: boolean
}

/**
 * Reports whether `el` is on screen in a visible tab: it intersects the viewport
 * and the document isn't hidden. Where IntersectionObserver is missing the element
 * counts as on screen, so only tab visibility applies. `onChange` runs when the
 * answer changes; returns the cleanup.
 *
 * This file ships in the `youj-core` registry item (registry/core.json) so copied
 * players, backgrounds and icons find it: keep it listed there under the same path.
 */
export function observeOnScreen(el: Element, onChange: (onScreen: boolean) => void, { rootMargin, immediate }: OnScreenOptions = {}): () => void {
  let intersecting = true
  let last: boolean | undefined
  const report = () => {
    const next = intersecting && !document.hidden && document.visibilityState !== 'hidden'
    if (next === last) return
    last = next
    onChange(next)
  }
  const io =
    typeof IntersectionObserver === 'undefined'
      ? undefined
      : new IntersectionObserver(
          (entries) => {
            const entry = entries[entries.length - 1]
            if (!entry) return
            intersecting = entry.isIntersecting
            report()
          },
          rootMargin ? { rootMargin } : undefined,
        )
  io?.observe(el)
  document.addEventListener('visibilitychange', report)
  if (immediate || !io) report()
  return () => {
    io?.disconnect()
    document.removeEventListener('visibilitychange', report)
  }
}
