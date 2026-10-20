import { useEffect, useRef, useState } from 'react'
import type { SegmentedRingInterval } from '../../../components/ui/segmented-ring'

/** The timer's clock: seconds elapsed, running or paused, with skip and more rest. Swap it for your own timer. */
export function useTimer(initial: SegmentedRingInterval[], start: number) {
  const [intervals, setIntervals] = useState(initial)
  const [elapsed, setElapsed] = useState(start)
  const [running, setRunning] = useState(false)
  const total = intervals.reduce((sum, i) => sum + i.duration, 0)
  const finished = elapsed >= total

  // A frame loop while running, so the ring moves smoothly; it stops at the end.
  const last = useRef<number | null>(null)
  useEffect(() => {
    if (!running) return
    let frame = requestAnimationFrame(function tick(now) {
      const dt = last.current === null ? 0 : (now - last.current) / 1000
      last.current = now
      setElapsed((t) => Math.min(total, t + dt))
      frame = requestAnimationFrame(tick)
    })
    return () => {
      cancelAnimationFrame(frame)
      last.current = null
    }
  }, [running, total])
  if (finished && running) setRunning(false)

  let from = 0
  const spans = intervals.map((interval) => {
    const span = { interval, from, to: from + interval.duration }
    from = span.to
    return span
  })
  const index = finished ? intervals.length - 1 : Math.max(0, spans.findIndex((s) => elapsed < s.to))
  const current = spans[index]!

  return {
    intervals,
    elapsed,
    running,
    finished,
    total,
    index,
    current,
    toggle: () => (finished ? (setElapsed(0), setRunning(true)) : setRunning((r) => !r)),
    /** On to the start of the next interval. */
    skip: () => setElapsed((t) => Math.min(total, spans.find((s) => s.to > t)?.to ?? total)),
    /** Stretches the interval running now. */
    extend: (seconds: number) => setIntervals((list) => list.map((interval, i) => (i === index ? { ...interval, duration: interval.duration + seconds } : interval))),
  }
}
