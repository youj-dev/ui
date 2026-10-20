import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { functionalUpdate, type Updater } from '@tanstack/react-table'

/**
 * One slice of table state, controlled or not: a defined `controlled` value
 * wins and the setter only reports; otherwise the slice lives here. The setter
 * takes TanStack updaters (values or functions) and reports the resolved
 * value, so a consumer can pass `setSorting` or a plain callback. Successive
 * updates in one event compose against the latest value, not the render's.
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
