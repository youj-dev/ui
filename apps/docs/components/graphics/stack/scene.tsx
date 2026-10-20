import { useEffect, useLayoutEffect, useState, type ReactNode, type RefObject } from 'react'
import { YoujProvider, ThemeScope, type ThemeInput } from '@youj/core'

/* What a pinned, lazily drawn stack scene (the homepage's hero) needs around
 * its LayerStack: whether the view is big enough to pin it on a scroll track,
 * when the page has settled enough for its heavier parts to start, and its
 * planes drawn as stills. */

/** Wide and tall enough for a stack to pin on its scroll track, with its copy above it. */
export const PIN_QUERY = '(min-width: 1024px) and (min-height: 760px)'

/** Pinned where the view fits it, and never under reduced motion: without the scroll link there's nothing to pin for. */
export function usePinned(reduced: boolean, query = PIN_QUERY) {
  const [fits, setFits] = useState(false)
  useLayoutEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setFits(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [query])
  return fits && !reduced
}

/** Runs `fn` once the main thread is idle, `timeout` ms at the latest (at once where there's no idle callback). Returns its cancel. */
export function idle(fn: () => void, timeout: number) {
  if (typeof window.requestIdleCallback !== 'function') {
    const id = window.setTimeout(fn, 1)
    return () => window.clearTimeout(id)
  }
  const id = window.requestIdleCallback(fn, { timeout })
  return () => window.cancelIdleCallback(id)
}

/** True once the page has loaded and gone idle while `ref` is near the screen: when a scene's heavier parts may start. */
export function useSettled(ref: RefObject<HTMLElement | null>) {
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let quiet = false
    let near = typeof IntersectionObserver === 'undefined'
    const check = () => quiet && near && setSettled(true)
    let cancel = () => {}
    const start = () => (cancel = idle(() => ((quiet = true), check()), 4000))
    if (document.readyState === 'complete') start()
    else window.addEventListener('load', start, { once: true })
    const io =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(([entry]) => ((near = !!entry?.isIntersecting), check()), { rootMargin: '50% 0px' })
    io?.observe(el)
    return () => {
      window.removeEventListener('load', start)
      cancel()
      io?.disconnect()
    }
  }, [ref])
  return settled
}

/** A plane as a still: in its theme, with nothing in it animating, so no layout animation ever runs inside the tipped rig. */
export function still(theme: ThemeInput, timeScale: number, node: ReactNode) {
  return (
    <ThemeScope theme={theme}>
      <YoujProvider timeScale={timeScale} reducedMotion="always">
        {node}
      </YoujProvider>
    </ThemeScope>
  )
}
