import { useRef, useSyncExternalStore } from 'react'
import { useNow } from '../../../hooks/use-now'
import { dateTimeFormat } from '../../../lib/utils'

const noSubscribe = () => () => {}

export const toTime = (value: Date | number | string) => +new Date(value)

/* The block's clock. `from` is the time the first render shows (a `now`
 * prop, or the demo's fixed now): the server and the hydration render agree
 * on it, and once mounted it ticks on from there in real time. With no
 * `from`, it's the browser's clock, null until hydration (times then show
 * in UTC, which both renders agree on). `read` is the exact time for
 * something new, in the same frame. */
export function useClock(from: number | undefined, refresh = 60_000): { now: number | null; read: () => number } {
  const wall = useNow(refresh)
  const taken = useRef<{ from: number | undefined; offset: number } | null>(null)
  const offset = useSyncExternalStore(
    noSubscribe,
    () => {
      if (!taken.current || taken.current.from !== from) taken.current = { from, offset: from === undefined ? 0 : from - Date.now() }
      return taken.current.offset
    },
    () => null,
  )
  const read = () => Date.now() + (offset ?? 0)
  if (wall === null || offset === null) return { now: from ?? null, read }
  return { now: Math.max(wall + offset, from ?? -Infinity), read }
}

/** The time of day ("2:14 PM"); in UTC until the browser's clock is known. */
export const clockTime = (time: number, locale: string, utc: boolean) =>
  dateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', ...(utc && { timeZone: 'UTC' }) }).format(time)

/** The day and the time ("Oct 9, 2:14 PM"), for what's said about a version. */
export const dateTime = (time: number, locale: string, utc: boolean) =>
  dateTimeFormat(locale, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', ...(utc && { timeZone: 'UTC' }) }).format(time)

/** Which day a version belongs to: Today, Yesterday, else its date. */
export function dayOf(time: number, now: number | null, locale: string, words: { today: string; yesterday: string }) {
  const start = (t: number) => (now === null ? new Date(t).setUTCHours(0, 0, 0, 0) : new Date(t).setHours(0, 0, 0, 0))
  const day = start(time)
  if (now !== null) {
    const today = start(now)
    if (day === today) return { day, label: words.today }
    if (day === start(today - 1)) return { day, label: words.yesterday }
  }
  return {
    day,
    label: dateTimeFormat(locale, { weekday: 'long', month: 'short', day: 'numeric', ...(now === null && { timeZone: 'UTC' }) }).format(time),
  }
}
