'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNow } from '../../../hooks/use-now'

export type RetryState = 'idle' | 'pending' | 'success' | 'error'

/**
 * Tries `onRetry` again on its own, waiting longer after each failure
 * (`delays` in seconds, the last one repeating; empty: only when asked), the
 * way a mail client reconnects. `retry` tries now and the schedule carries on
 * from there. `seconds` is the countdown to the next try, null while one runs,
 * after one worked or before the browser knows the time (so the server's
 * render and the hydration agree). Without delays the clock doesn't tick.
 */
export function useAutoRetry(onRetry: () => Promise<unknown> | unknown, delays: readonly number[]) {
  const now = useNow(delays.length ? 1000 : 0)
  const [state, setState] = useState<RetryState>('idle')
  const [failures, setFailures] = useState(0)
  const [due, setDue] = useState<number | null>(null)
  const action = useRef(onRetry)
  useEffect(() => {
    action.current = onRetry
  })

  const retry = useCallback(async () => {
    setDue(null)
    setState('pending')
    try {
      await action.current()
      setState('success')
    } catch {
      setFailures((n) => n + 1)
      setState('error')
    }
  }, [])

  const waiting = state === 'idle' || state === 'error'
  const delay = delays.length ? delays[Math.min(failures, delays.length - 1)]! : null
  // The next try is set once the browser knows the time, and again after each failure.
  if (waiting && delay !== null && now !== null && due === null) setDue(now + delay * 1000)

  useEffect(() => {
    if (due === null) return
    const timer = setTimeout(() => void retry(), Math.max(0, due - Date.now()))
    return () => clearTimeout(timer)
  }, [due, retry])

  const seconds = waiting && due !== null && now !== null ? Math.max(0, Math.ceil((due - now) / 1000)) : null
  return { state, retry, seconds }
}
