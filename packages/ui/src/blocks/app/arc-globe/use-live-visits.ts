'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { nextVisit, seeded, type ArcGlobePlace, type ArcGlobeVisit } from './data'

/** How many visits the feed and the still keep. */
const KEEP = 8

interface Landed {
  /** Newest first. */
  settled: ArcGlobeVisit[]
  /** Landed per place since the stream started. */
  added: Record<string, number>
  count: number
  /** Secondary units those made. */
  units: number
}

/**
 * The demo's visit stream: while `running`, a visit every `every` ms. A new
 * visit goes straight to the subscribers (the globe throws it) without a
 * render. `flight` ms later it lands, and landed visits reach the figures
 * together, at most once per `batch` ms: one render for a handful of visits,
 * so the counters roll to a new figure every couple of seconds instead of
 * churning. Stops with `running`; visits in the air still land. Swap it for
 * your own feed.
 */
export function useLiveVisits(places: ArcGlobePlace[], running: boolean, every: number, flight: number, batch: number, given?: ArcGlobeVisit[]) {
  const [landed, setLanded] = useState<Landed>({ settled: [], added: {}, count: 0, units: 0 })
  const random = useRef(seeded(7))
  const next = useRef(1)
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>())
  const listeners = useRef(new Set<(visit: ArcGlobeVisit) => void>())
  const pending = useRef<ArcGlobeVisit[]>([])
  const thrown = useRef(new Set<number>())

  const subscribe = useCallback((listener: (visit: ArcGlobeVisit) => void) => {
    listeners.current.add(listener)
    return () => {
      listeners.current.delete(listener)
    }
  }, [])

  const after = useCallback((ms: number, run: () => void) => {
    const timer = setTimeout(() => {
      timers.current.delete(timer)
      run()
    }, ms)
    timers.current.add(timer)
  }, [])

  useEffect(() => {
    if (!running || !places.length || given) return
    const flush = () => {
      const visits = pending.current
      pending.current = []
      setLanded((state) => {
        const added = { ...state.added }
        for (const visit of visits) added[visit.from] = (added[visit.from] ?? 0) + 1
        const units = visits.reduce((sum, visit) => sum + visit.weight, state.units)
        return { settled: [...visits.reverse(), ...state.settled].slice(0, KEEP), added, count: state.count + visits.length, units }
      })
    }
    const launch = () => {
      const visit = nextVisit(places, random.current, next.current++, Date.now())
      for (const listener of listeners.current) listener(visit)
      after(flight, () => {
        // The first visit to land after a quiet spell opens the batch window.
        if (!pending.current.length) after(batch, flush)
        pending.current.push({ ...visit, at: Date.now() })
      })
    }
    launch()
    const id = setInterval(launch, every)
    return () => clearInterval(id)
  }, [places, running, every, flight, batch, after, given])

  // Your own visits: each new one is thrown across the globe as it comes in.
  useEffect(() => {
    if (!given || !running) return
    for (const visit of given) {
      if (thrown.current.has(visit.id)) continue
      thrown.current.add(visit.id)
      for (const listener of listeners.current) listener(visit)
    }
  }, [given, running])

  useEffect(() => {
    const all = timers.current
    return () => {
      for (const timer of all) clearTimeout(timer)
    }
  }, [])

  return given ? { settled: given, added: {}, count: 0, units: 0, subscribe } : { ...landed, subscribe }
}
