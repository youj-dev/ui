import { useCallback, useRef, useSyncExternalStore } from 'react'
import { useNow } from '../../../hooks/use-now'

const noSubscribe = () => () => {}

/* The event's time: `from` on the server and in the hydration render, so
 * both agree; once mounted it ticks on from there in real time (with no
 * `from`, it's the browser's clock). `read` gives the time for a new event. */
export function useEventClock(from: number | undefined, fallback: number, running: boolean) {
  const wall = useNow(running ? 1000 : 0)
  // Taken once per `from`, client-side only: null on the server and while hydrating.
  const taken = useRef<{ from: number | undefined; offset: number } | null>(null)
  const offset = useSyncExternalStore(
    noSubscribe,
    () => (taken.current?.from === from && taken.current ? taken.current : (taken.current = { from, offset: from === undefined ? 0 : from - Date.now() })).offset,
    () => null,
  )
  const read = useCallback(() => Date.now() + (offset ?? 0), [offset])
  // Never before `from`: the first tick can read the wall a moment before the offset was taken.
  return { now: wall === null || offset === null ? (from ?? fallback) : Math.max(wall + offset, from ?? -Infinity), read }
}
