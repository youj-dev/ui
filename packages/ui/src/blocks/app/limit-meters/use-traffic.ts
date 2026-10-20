'use client'

import { useEffect, useRef, useState } from 'react'
import { seeded, type LimitMetersLimiter } from './data'

/* Demo traffic against one limiter, so the bucket has something to meter:
 * requests arrive around the limiter's average rate, now and then in a
 * burst the size of its batch, and spend tokens from a bucket that refills
 * at limit ÷ 60 a second. What the bucket can't cover is refused (a 429).
 * Swap it for your gateway's numbers: the block only reads `bucket`, `volume`,
 * `refusals` and `accepted`. */

/** How often the demo traffic arrives, in ms of wall time. */
const TICK = 250

interface Bucket {
  /** Tokens when last measured… */
  value: number
  /** …at this `Date.now()` time; undefined until the traffic starts. */
  at?: number
}

interface Traffic {
  bucket: Bucket
  /** Requests a minute, smoothed. */
  volume: number
  /** Requests refused (HTTP 429) in each five minutes of the last hour; the last slot is now. */
  refusals: number[]
  /** The share of the last hour's requests let through. */
  accepted: number
  /** Sends `count` requests at once. */
  send: (count: number) => void
  /** Fills the bucket. */
  refill: () => void
}

/** The demo's traffic while `simulate`; otherwise the limiter's own figures, unchanged. */
function useTraffic(limiter: LimitMetersLimiter, limit: number, capacity: number, timeScale: number, simulate: boolean): Traffic {
  const rate = limit / 60
  const start = Math.round(capacity * 0.7)
  const [bucket, setBucket] = useState<Bucket>({ value: start })
  const [volume, setVolume] = useState(limiter.volume)
  const [refusals, setRefusals] = useState(limiter.refusals)
  const [hour, setHour] = useState(() => ({ total: limiter.volume * 60, refused: limiter.refusals.reduce((a, b) => a + b, 0) }))
  const live = useRef({ value: start, at: 0 })

  // A new limiter starts its own traffic.
  const [shown, setShown] = useState(limiter.id)
  if (shown !== limiter.id) {
    setShown(limiter.id)
    setBucket({ value: start })
    setVolume(limiter.volume)
    setRefusals(limiter.refusals)
    setHour({ total: limiter.volume * 60, refused: limiter.refusals.reduce((a, b) => a + b, 0) })
  }

  const levelAt = (time: number) => Math.min(capacity, live.current.value + (rate * Math.max(0, time - live.current.at)) / 1000 / timeScale)

  const spend = (count: number, time: number) => {
    const level = levelAt(time)
    const taken = Math.min(count, Math.floor(level))
    live.current = { value: level - taken, at: time }
    setBucket(live.current)
    return count - taken
  }

  const refuse = (refused: number, count: number) => {
    setHour((h) => ({ total: h.total + count, refused: h.refused + refused }))
    if (refused) setRefusals((slots) => [...slots.slice(0, -1), (slots.at(-1) ?? 0) + refused])
  }

  const running = useRef('')
  useEffect(() => {
    if (!simulate) return
    const random = seeded([...limiter.id].reduce((sum, c) => sum * 31 + c.charCodeAt(0), 7))
    // A new limiter starts from its own level; a new limit carries the bucket on.
    if (running.current !== limiter.id) live.current = { value: start, at: Date.now() }
    running.current = limiter.id
    let last = Date.now()
    const id = setInterval(() => {
      const time = Date.now()
      const seconds = (time - last) / 1000 / timeScale
      last = time
      if (document.hidden) return
      // Around the average, jittered by how bursty the client is, and now and then a batch.
      const expected = (limiter.volume / 60) * seconds * (1 + limiter.spikiness * (random() * 2 - 1) * 0.8)
      const batch = random() < limiter.spikiness * 0.05 ? Math.round(limiter.burst * (0.8 + random() * 0.6)) : 0
      const count = Math.max(0, Math.floor(expected + random())) + batch
      const refused = spend(count, time)
      refuse(refused, count)
      setVolume((r) => r * 0.92 + (count / Math.max(seconds, 0.001)) * 60 * 0.08)
    }, TICK)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps -- restarts for a new limiter, limit or speed; its traffic settings are read by id
  }, [limiter.id, limit, capacity, timeScale, simulate])

  if (!simulate) {
    const total = limiter.volume * 60
    const refused = limiter.refusals.reduce((a, b) => a + b, 0)
    const none = () => {}
    return {
      bucket: { value: Math.min(capacity, limiter.tokens ?? capacity) },
      volume: limiter.volume,
      refusals: limiter.refusals,
      accepted: total ? 1 - refused / total : 1,
      send: none,
      refill: none,
    }
  }

  return {
    bucket,
    volume,
    refusals,
    accepted: hour.total ? 1 - hour.refused / hour.total : 1,
    send: (count) => {
      const refused = spend(count, Date.now())
      refuse(refused, count)
    },
    refill: () => {
      live.current = { value: capacity, at: Date.now() }
      setBucket(live.current)
    },
  }
}

export { useTraffic, type Traffic }
