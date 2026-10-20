import { useEffect, useRef, useState, type RefObject } from 'react'
import { observeOnScreen } from '@youj/core/lib/youj/on-screen'
import { observeThemeChange } from '@youj/core/lib/youj/theme/observe'

/** Whether the element is on screen in a visible tab. True where IntersectionObserver is unavailable. */
export function useInView(ref: RefObject<Element | null>) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    return observeOnScreen(el, setInView)
  }, [ref])
  return inView
}

/**
 * Calls `onChange` when the theme that applies to `ref` may have changed: a
 * `data-theme`, `data-yj-theme`, `data-yj-motion` or `class` flip on the element
 * or any ancestor, a new contract on a theme scope's inline style (or on
 * <html>'s), or the OS color scheme changing.
 */
export function useThemeChange(ref: RefObject<Element | null>, onChange: () => void) {
  const callback = useRef(onChange)
  callback.current = onChange
  useEffect(() => {
    const el = ref.current
    if (!el) return
    return observeThemeChange(el, () => callback.current())
  }, [ref])
}
