'use client'

import { useEffect, useState } from 'react'
import { CONCURRENCY, TICK, type TransferListItem } from './data'

/* The demo's transfer engine: every tick the active files move by their
 * speed (with a little jitter, so the rate reads live), finished ones settle,
 * and queued ones start while there's a free slot. Swap it for your
 * uploader's state; the block only reads `files` and calls the actions. */

function step(files: TransferListItem[]): TransferListItem[] {
  const next = files.map((f) => {
    if (f.status !== 'active') return f
    const rate = f.speed * (0.82 + Math.random() * 0.36)
    const transferred = Math.min(f.size, f.transferred + (rate * TICK) / 1000)
    return transferred >= f.size ? { ...f, transferred, rate: undefined, status: 'done' as const } : { ...f, transferred, rate }
  })
  let free = CONCURRENCY - next.filter((f) => f.status === 'active').length
  return next.map((f) => (f.status === 'queued' && free-- > 0 ? { ...f, status: 'active' as const, rate: f.speed } : f))
}

export function useTransfers(initial: TransferListItem[], active = true) {
  const [files, setFiles] = useState(initial)
  // `active` false (the block is scrolled away or its tab is hidden) holds the transfers where they are.
  const moving = active && files.some((f) => f.status === 'active' || f.status === 'queued')

  useEffect(() => {
    if (!moving) return
    const id = setInterval(() => setFiles(step), TICK)
    return () => clearInterval(id)
  }, [moving])

  const update = (id: string, change: (f: TransferListItem) => TransferListItem) => setFiles((list) => list.map((f) => (f.id === id ? change(f) : f)))
  return {
    files,
    pause: (id: string) => update(id, (f) => ({ ...f, status: 'paused', rate: undefined })),
    resume: (id: string) => update(id, (f) => ({ ...f, status: 'queued' })),
    retry: (id: string) => update(id, (f) => ({ ...f, status: 'queued', error: undefined })),
    cancel: (id: string) => setFiles((list) => list.filter((f) => f.id !== id)),
    pauseAll: () => setFiles((list) => list.map((f) => (f.status === 'active' || f.status === 'queued' ? { ...f, status: 'paused', rate: undefined } : f))),
    resumeAll: () => setFiles((list) => list.map((f) => (f.status === 'paused' ? { ...f, status: 'queued' } : f))),
    cancelAll: () => setFiles((list) => list.filter((f) => f.status === 'done')),
  }
}
