'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { timeOf } from './aggregate'
import { DEMO_ARRIVALS, DEMO_NOW, demo, demoEvents, demoOlder, type ActivityFeedCopy, type ActivityFeedEvent } from './data'

/* The feed's events and what's waiting. Anything newer than all seen so far
 * is an arrival: it's announced, and while someone is reading (pointing at
 * the feed, in it with the keyboard, or scrolled down) it's held back behind
 * the "N new" pill, so nothing moves under their eyes. Once they're back at
 * the top and away, held events come in by themselves. Older pages append
 * at the end. Without `events`, the demo's own arrive every few seconds. */

export interface FeedOptions {
  events: ActivityFeedEvent[] | undefined
  /** The time a demo arrival gets. */
  read: () => number
  /** The demo runs while this is true. */
  live: boolean
  reading: boolean
  copy: ActivityFeedCopy
  onLoadMore?: () => Promise<ActivityFeedEvent[] | void> | ActivityFeedEvent[] | void
  hasMore?: boolean
}

const failure = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback)

export function useFeed({ events, read, live, reading, copy, onLoadMore, hasMore }: FeedOptions) {
  const simulated = events === undefined
  const [own, setOwn] = useState<ActivityFeedEvent[]>(() => demoEvents(DEMO_NOW))
  const [older, setOlder] = useState<ActivityFeedEvent[]>([])
  const [page, setPage] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const source = events ?? own
  const all = older.length ? [...source, ...older.filter((e) => !source.some((s) => s.id === e.id))] : source

  // What's been seen, and what's held back: both follow the events as they change (set while rendering).
  const [seen, setSeen] = useState(() => ({ ids: new Set(all.map((e) => e.id)), newest: Math.max(-Infinity, ...all.map(timeOf)) }))
  const [held, setHeld] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const fresh = all.filter((e) => !seen.ids.has(e.id))
  if (fresh.length) {
    const arrivals = fresh.filter((e) => timeOf(e) >= seen.newest)
    setSeen({ ids: new Set([...seen.ids, ...fresh.map((e) => e.id)]), newest: Math.max(seen.newest, ...fresh.map(timeOf)) })
    if (arrivals.length) {
      if (reading) setHeld((list) => [...list, ...arrivals.map((e) => e.id)])
      // The same words twice are still spoken.
      setMessage((said) => (said === copy.announceNew(arrivals.length) ? `${said} ` : copy.announceNew(arrivals.length)))
    }
  }
  if (!reading && held.length) setHeld([])

  const latest = useRef(read)
  useLayoutEffect(() => {
    latest.current = read
  })
  // The demo's arrivals are scheduled each time it comes on screen; `own` is read only to skip the ones already in.
  // biome-ignore lint/correctness/useExhaustiveDependencies: see above
  useEffect(() => {
    if (!simulated || !live) return
    const timers = DEMO_ARRIVALS.filter((a) => !own.some((e) => e.id === a.event.id)).map((a) =>
      setTimeout(() => setOwn((list) => (list.some((e) => e.id === a.event.id) ? list : [{ ...a.event, time: latest.current() }, ...list])), a.after),
    )
    return () => timers.forEach(clearTimeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `own` is read only to skip arrivals already in
  }, [simulated, live])

  const canLoadMore = onLoadMore ? !!hasMore : simulated && page < 2
  const loadMore = async () => {
    if (loadingMore) return
    setLoadingMore(true)
    setLoadError(null)
    try {
      if (onLoadMore) {
        const more = await onLoadMore()
        if (Array.isArray(more)) setOlder((list) => [...list, ...more])
      } else {
        await demo('ActivityFeed: onLoadMore', 700)
        setOlder((list) => [...list, ...demoOlder(DEMO_NOW, page)])
        setPage((p) => p + 1)
      }
    } catch (error) {
      setLoadError(failure(error, copy.failed))
    } finally {
      setLoadingMore(false)
    }
  }

  return {
    simulated,
    events: held.length ? all.filter((e) => !held.includes(e.id)) : all,
    held: held.length,
    reveal: () => setHeld([]),
    message,
    canLoadMore,
    loadMore,
    loadingMore,
    loadError,
  }
}
