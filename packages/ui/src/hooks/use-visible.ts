import { useEffect, useState, type RefObject } from 'react'

/**
 * Whether the element is on screen and its tab is showing. A block's timers
 * and loops (a live clock, a simulated feed) run only then, so one scrolled
 * away or left in a background tab costs nothing.
 */
export function useVisible(ref: RefObject<Element | null>) {
  const [onScreen, setOnScreen] = useState(true)
  const [shown, setShown] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const sync = () => setShown(!document.hidden)
    sync()
    document.addEventListener('visibilitychange', sync)
    const observer = typeof IntersectionObserver === 'undefined' ? undefined : new IntersectionObserver(([entry]) => setOnScreen(entry?.isIntersecting ?? true))
    observer?.observe(el)
    return () => {
      document.removeEventListener('visibilitychange', sync)
      observer?.disconnect()
    }
  }, [ref])
  return onScreen && shown
}
