'use client'

import { useEffect, useState } from 'react'
import { Button, SegmentedRing, type SegmentedRingInterval } from '@youj/react'

const INTERVALS: SegmentedRingInterval[] = [
  { kind: 'warmup', duration: 30, label: 'Mobility' },
  ...['Jump squats', 'Burpees', 'Mountain climbers', 'Push-ups'].flatMap((label, i, all): SegmentedRingInterval[] => [
    { kind: 'work', duration: 20, label },
    ...(i < all.length - 1 ? [{ kind: 'rest', duration: 10 } as SegmentedRingInterval] : []),
  ]),
  { kind: 'cooldown', duration: 30, label: 'Stretch' },
]
const TOTAL = INTERVALS.reduce((sum, i) => sum + i.duration, 0)
const STARTS = INTERVALS.reduce<number[]>((acc, i) => [...acc, (acc.at(-1) ?? 0) + i.duration], [])

export default function SegmentedRingDemo() {
  // The ring keeps no clock of its own: run one, and pause or skip it by changing `elapsed`.
  const [elapsed, setElapsed] = useState(42)
  const [running, setRunning] = useState(false)
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setElapsed((t) => Math.min(TOTAL, t + 0.1)), 100)
    return () => clearInterval(id)
  }, [running])
  // The workout's over: the clock stops, and Restart is the one thing left to do.
  const done = elapsed >= TOTAL
  useEffect(() => {
    if (done) setRunning(false)
  }, [done])

  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-5">
      <SegmentedRing intervals={INTERVALS} elapsed={elapsed} />
      <div className="flex gap-2">
        <Button variant="secondary" disabled={done} onClick={() => setElapsed((t) => STARTS.find((s) => s > t) ?? TOTAL)}>
          Skip
        </Button>
        <Button onClick={() => (done ? (setElapsed(0), setRunning(true)) : setRunning((r) => !r))}>{running ? 'Pause' : done ? 'Restart' : 'Start'}</Button>
      </div>
    </div>
  )
}
