'use client'

import { useEffect, useState } from 'react'
import { PAGES, seeded, type Snapshot } from './data'

/* Demo traffic for the card, a simulated second at a time: the people on
 * the site drift around a slow swell, each second adds page views to the
 * bucket filling now, and every `bucketSeconds` a new bucket opens and the
 * oldest goes. Each page's share drifts too, so the ranking changes now and
 * then. It runs only while `running` (not paused, the tab showing, the card
 * on screen) and follows the provider's speed. Swap it for your feed: the
 * card only reads a `Snapshot`. */

/** Wall-clock ms per simulated second at 1× speed. */
const TICK = 1000

interface State {
  second: number
  /** How busy the bucket filling now is against the swell: drawn as each bucket opens, so the bars differ. */
  burst: number
  current: number
  /** People each second, newest last, for the change over the strip's span. */
  history: number[]
  series: number[]
  bucket: number
  weights: number[]
}

function start(buckets: number, bucketSeconds: number): State {
  const random = seeded(17)
  const state: State = { second: 0, burst: 1, current: 1180, history: [], series: [0], bucket: 0, weights: PAGES.map((p) => p.weight) }
  // Run the model through the strip's span, so the card opens with a full strip.
  for (let i = 0; i < buckets * bucketSeconds - Math.round(bucketSeconds * 0.4); i++) step(state, random, buckets, bucketSeconds)
  return state
}

function step(s: State, random: () => number, buckets: number, bucketSeconds: number) {
  s.second += 1
  const swell = 1240 + 140 * Math.sin(s.second / 190) + 60 * Math.sin(s.second / 47)
  s.current = Math.max(0, s.current + (swell - s.current) * 0.06 + (random() - 0.5) * Math.sqrt(s.current) * 1.4)
  s.history = [...s.history.slice(-(buckets * bucketSeconds)), s.current]
  const views = Math.round(s.current * 0.046 * s.burst * (0.75 + random() * 0.5))
  if (s.second % bucketSeconds === 0) {
    s.burst = 0.62 + random() * 0.76
    s.series = [...s.series.slice(-(buckets - 1)), views]
    s.bucket += 1
  } else s.series = [...s.series.slice(0, -1), (s.series.at(-1) ?? 0) + views]
  s.weights = s.weights.map((w, i) => Math.max(0.01, w + (random() - 0.5) * 0.012 + (PAGES[i]!.weight - w) * 0.02))
}

function snapshot(s: State): Snapshot {
  const total = s.weights.reduce((a, b) => a + b, 0)
  const people = Math.round(s.current)
  return {
    current: people,
    previous: s.history[0] === undefined ? undefined : Math.round(s.history[0]),
    series: s.series,
    bucket: s.bucket,
    pages: PAGES.map((p, i) => ({ id: p.id, label: p.label, value: Math.round((people * s.weights[i]!) / total) })).sort((a, b) => b.value - a.value),
  }
}

/** The demo's live traffic while `simulate`, ticking while `running`; otherwise nothing runs. */
function useLive(simulate: boolean, running: boolean, timeScale: number, buckets: number, bucketSeconds: number): Snapshot | undefined {
  const [state, setState] = useState(() => (simulate ? start(buckets, bucketSeconds) : undefined))
  useEffect(() => {
    if (!simulate || !running) return
    const random = seeded(Date.now() % 100_000)
    const id = setInterval(() => {
      setState((s) => {
        const next = { ...(s ?? start(buckets, bucketSeconds)) }
        step(next, random, buckets, bucketSeconds)
        return next
      })
    }, TICK * timeScale)
    return () => clearInterval(id)
  }, [simulate, running, timeScale, buckets, bucketSeconds])
  return state ? snapshot(state) : undefined
}

export { useLive }
