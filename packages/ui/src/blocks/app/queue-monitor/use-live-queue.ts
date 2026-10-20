import { useCallback, useEffect, useRef, useState } from 'react'
import { SLOTS_PER_WORKER, type QueueMonitorQueue } from './data'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/**
 * The shown queue, drifting once a second while it's live, as a real one
 * would: the backlog and the busy slots wobble, the hour's finished jobs move,
 * the throughput trace steps on every few seconds and, now and then, a job
 * fails. Deterministic (driven by the tick, not Math.random), and it only
 * runs in the browser, after mount.
 */
export function useLiveQueue(initial: QueueMonitorQueue[], id: string, live: boolean) {
  const [queues, setQueues] = useState(initial)
  // Fresh figures from the app replace what's shown (and any change made here since).
  const [source, setSource] = useState(initial)
  if (source !== initial) {
    setSource(initial)
    setQueues(initial)
  }
  const tick = useRef(0)

  useEffect(() => {
    if (!live) return
    const timer = setInterval(() => {
      const t = ++tick.current
      setQueues((all) => {
        const q = all.find((x) => x.id === id)
        if (!q) return all
        const slots = q.workers * (q.slotsPerWorker ?? SLOTS_PER_WORKER)
        const rate = q.throughput.at(-1) ?? 0
        const wobble = (phase: number) => Math.round(Math.sin(t * 1.7 + phase) * 2 + Math.cos(t * 0.6 + phase))
        const failed =
          t % 13 === 0 && q.failed.length < 12
            ? [...q.failed, { id: `job-${((t * 7919 + q.queued) % 0xffffff).toString(16).padStart(6, '0')}`, error: 'Timeout after 30 s' }]
            : q.failed
        return all.map((x) =>
          x.id !== id
            ? x
            : {
            ...q,
            queued: clamp(q.queued + wobble(1) * Math.max(1, Math.round(q.capacity / 160)), 0, q.capacity),
            running: clamp(q.running + wobble(2), Math.min(1, slots), slots),
            done: clamp(q.done + wobble(3) * Math.max(1, Math.round(rate / 90)) + 1, 0, q.target),
            throughput: t % 3 === 0 ? [...q.throughput.slice(1), Math.max(0, Math.round(rate * (1 + wobble(4) / 60)))] : q.throughput,
            failed,
          },
        )
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [id, live])

  const update = useCallback((change: (queue: QueueMonitorQueue) => QueueMonitorQueue) => setQueues((all) => all.map((q) => (q.id === id ? change(q) : q))), [id])
  return [queues.find((q) => q.id === id) ?? queues[0], update] as const
}
