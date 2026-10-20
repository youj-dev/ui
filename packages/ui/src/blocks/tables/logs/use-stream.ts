import { useEffect, useMemo, useState } from 'react'
import { makeEvents, nextEvents, type LogsTableEvent } from './data'

/** How often the demo stream writes, and how much of it it keeps. */
const TICK = 1400
const KEEP = 1000
const NONE: ReadonlySet<string> = new Set()

/**
 * The stream behind the table. With no `events` it simulates one (seeded
 * history, then a few events every beat). Either way the table shows a
 * snapshot that follows the stream only while `following` (live, and read
 * from the top); otherwise new events wait, counted in `pending`, so what
 * you're reading never moves under you. Events that just arrived are `fresh`
 * for a moment.
 */
export function useStream(events: LogsTableEvent[] | undefined, following: boolean) {
  const simulated = events === undefined
  const [demo, setDemo] = useState(() => (simulated ? makeEvents() : []))
  useEffect(() => {
    if (!simulated) return
    const id = setInterval(() => setDemo((list) => [...list, ...nextEvents(list)].slice(-KEEP)), TICK)
    return () => clearInterval(id)
  }, [simulated])
  const source = events ?? demo

  const [shown, setShown] = useState(source)
  const [fresh, setFresh] = useState(NONE)
  if (following && shown !== source) {
    const before = new Set(shown.map((event) => event.id))
    setShown(source)
    setFresh(new Set(source.filter((event) => !before.has(event.id)).map((event) => event.id)))
  }
  // The glow lasts a beat, then the times settle back.
  useEffect(() => {
    if (fresh.size === 0) return
    const id = setTimeout(() => setFresh(NONE), TICK)
    return () => clearTimeout(id)
  }, [fresh])

  const pending = useMemo(() => {
    if (shown === source) return 0
    const seen = new Set(shown.map((event) => event.id))
    return source.reduce((n, event) => n + (seen.has(event.id) ? 0 : 1), 0)
  }, [shown, source])

  return { shown, pending, fresh, simulated }
}
