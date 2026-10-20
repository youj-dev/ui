'use client'

import { useLayoutEffect, type RefObject } from 'react'

/** Runs `measure` with the element once it is laid out, then again each time its box resizes. Where there is no ResizeObserver (old browsers, some test runners) it measures once. `deps` are the effect's, as in `useLayoutEffect`. */
export function useResizeMeasure<T extends Element>(ref: RefObject<T | null>, measure: (el: T) => void, deps: unknown[] = []) {
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    measure(el)
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => measure(el))
    observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the caller's deps, passed through as useLayoutEffect's own
  }, deps)
}
