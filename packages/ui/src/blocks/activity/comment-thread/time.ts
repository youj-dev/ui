import { useRef, useSyncExternalStore } from 'react'
import { useNow } from '../../../hooks/use-now'
import { dateTimeFormat, relativeTimeFormat } from '../../../lib/utils'

const noSubscribe = () => () => {}
const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

export const toTime = (value: Date | number | string) => +new Date(value)

/* The block's clock. `from` is the time the first render shows (a `now`
 * prop, or the demo's fixed now): the server and the hydration render agree
 * on it, and once mounted it ticks on from there in real time. With no
 * `from`, it's the browser's clock, null until hydration (times then show
 * as dates in UTC, which both renders agree on). `read` is the exact time
 * for something new, in the same frame. */
export function useClock(from: number | undefined, refresh = 30_000): { now: number | null; read: () => number } {
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

/** "just now", "5m ago", "3h ago", "yesterday", "4d ago", then the date. Without a clock, the date in UTC. */
export function ago(time: number, now: number | null, locale: string, justNow: string): string {
  if (now === null) return dateTimeFormat(locale, { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(time)
  const diff = now - time
  if (diff < 45_000) return justNow
  const rtf = relativeTimeFormat(locale, { numeric: 'auto', style: 'narrow' })
  if (diff < HOUR) return rtf.format(-Math.max(1, Math.round(diff / MIN)), 'minute')
  if (diff < DAY) return rtf.format(-Math.round(diff / HOUR), 'hour')
  if (diff < 7 * DAY) return rtf.format(-Math.round(diff / DAY), 'day')
  const sameYear = new Date(time).getFullYear() === new Date(now).getFullYear()
  return dateTimeFormat(locale, sameYear ? { month: 'short', day: 'numeric' } : { year: 'numeric', month: 'short', day: 'numeric' }).format(time)
}

/** The full date and time, for a tooltip or a title. */
export const fullDate = (time: number, locale: string, utc = false) =>
  dateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', ...(utc && { timeZone: 'UTC' }) }).format(time)
