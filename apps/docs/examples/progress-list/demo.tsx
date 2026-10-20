'use client'

import { useEffect, useState } from 'react'
import { ProgressList, TransferSummary, type TransferItem } from '@youj/react'

const MB = 1_000_000

const FILES: TransferItem[] = [
  { id: 'film', name: 'launch-film-master.mov', size: 2310 * MB, transferred: 1402 * MB, rate: 18.9 * MB, status: 'active' },
  { id: 'still', name: 'hero-still-04.png', size: 14.6 * MB, transferred: 9.4 * MB, rate: 2.9 * MB, status: 'active' },
  { id: 'traces', name: 'eval-traces-0926.jsonl', size: 386 * MB, transferred: 243 * MB, status: 'failed', error: 'Connection reset at 63%' },
  { id: 'brand', name: 'brand-guidelines.key', size: 212 * MB, transferred: 81 * MB, status: 'paused' },
  { id: 'deck', name: 'q4-planning-deck.pdf', size: 38.2 * MB, transferred: 0, status: 'queued' },
  { id: 'review', name: 'q3-board-review.pdf', size: 48.2 * MB, transferred: 48.2 * MB, status: 'done' },
]

export default function ProgressListDemo() {
  const [items, setItems] = useState(FILES)

  // Your uploader's state goes here; this moves the active files every half second.
  useEffect(() => {
    const id = setInterval(
      () =>
        setItems((list) =>
          list.map((f) => {
            if (f.status !== 'active') return f
            const transferred = Math.min(f.size, f.transferred + (f.rate ?? 4 * MB) / 2)
            return transferred >= f.size ? { ...f, transferred, rate: undefined, status: 'done' } : { ...f, transferred }
          }),
        ),
      500,
    )
    return () => clearInterval(id)
  }, [])

  const set = (id: string, change: Partial<TransferItem>) => setItems((list) => list.map((f) => (f.id === id ? { ...f, ...change } : f)))

  return (
    <div className="flex w-full max-w-xl flex-col gap-6 rounded-2xl border border-line bg-surface p-5">
      <TransferSummary items={items} />
      <ProgressList
        items={items}
        max={4}
        onPause={(id) => set(id, { status: 'paused', rate: undefined })}
        onResume={(id) => set(id, { status: 'active', rate: 6 * MB })}
        onRetry={(id) => set(id, { status: 'active', rate: 8 * MB, error: undefined })}
        onCancel={(id) => setItems((list) => list.filter((f) => f.id !== id))}
      />
    </div>
  )
}
