import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { functionalUpdate, type Updater } from '@tanstack/react-table'

/**
 * The latest value, for handlers and effects: written after each commit, never
 * during render, so a discarded render can't leak into it.
 */
export function useLatest<T>(value: T) {
  const ref = useRef(value)
  useLayoutEffect(() => {
    ref.current = value
  })
  return ref
}

/**
 * One slice of grid state, controlled or not: a defined `controlled` value
 * wins and the setter only reports; otherwise the slice lives here. The setter
 * takes TanStack updaters (values or functions), and successive updates in one
 * event compose against the latest value, not the render's.
 */
export function useSlice<T>(controlled: T | undefined, onChange: ((value: T) => void) | undefined, initial: T) {
  const [internal, setInternal] = useState(initial)
  const value = controlled !== undefined ? controlled : internal
  const latest = useRef(value)
  const isControlled = useRef(controlled !== undefined)
  const report = useRef(onChange)
  useLayoutEffect(() => {
    latest.current = value
    isControlled.current = controlled !== undefined
    report.current = onChange
  })

  const set = useCallback((updater: Updater<T>) => {
    const next = functionalUpdate(updater, latest.current)
    if (Object.is(next, latest.current)) return
    latest.current = next
    if (!isControlled.current) setInternal(next)
    report.current?.(next)
  }, [])

  return [value, set] as const
}

/** Runs `effect` when `value` changes, never on mount (nor on a strict-mode remount): announcements report changes, not the first state. */
export function useOnChange<T>(value: T, effect: () => void) {
  const previous = useRef(value)
  useEffect(() => {
    if (Object.is(previous.current, value)) return
    previous.current = value
    effect()
    // Only the value decides.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only the value decides
  }, [value])
}
