'use client'

import { useEffect, useState } from 'react'
import type { LiveCursorUser } from '@youj/react'

/** A simulated collaborator: a loop they wander (in fractions of the surface) and lines they type. */
export interface Walker extends Omit<LiveCursorUser, 'x' | 'y' | 'message'> {
  cx: number
  cy: number
  rx: number
  ry: number
  /** Loops per minute. */
  pace: number
  phase: number
  lines?: string[]
}

/** Stands in for the socket: everyone's position every `interval` ms, as sparse as a real feed, while `active`. */
export function useWalkers(walkers: Walker[], interval = 140, active = true) {
  const [users, setUsers] = useState<LiveCursorUser[]>(() => walkers.map((w) => place(w, 0)))
  useEffect(() => {
    if (!active) return
    const start = performance.now()
    const id = setInterval(() => setUsers(walkers.map((w) => place(w, (performance.now() - start) / 1000))), interval)
    return () => clearInterval(id)
  }, [walkers, interval, active])
  return users
}

function place({ cx, cy, rx, ry, pace, phase, lines, ...user }: Walker, seconds: number): LiveCursorUser {
  const angle = ((seconds * pace) / 60 + phase) * Math.PI * 2
  let message: string | undefined
  const line = lines?.[Math.floor(seconds / 7) % (lines.length + 1)]
  const into = seconds % 7
  if (line && into < 5) message = line.slice(0, Math.ceil((into / 2.5) * line.length))
  return { ...user, x: cx + rx * Math.sin(angle), y: cy + ry * Math.sin(angle * 2 + 0.6), message: message || undefined }
}
