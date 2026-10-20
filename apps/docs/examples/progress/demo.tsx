'use client'

import { useEffect, useState } from 'react'
import { FileTextIcon, FilmIcon, ImageIcon } from '@youj/icons'
import { Button, Progress, ProgressLabel, ProgressValue } from '@youj/react'

// Uneven chunks, like a real network. The spring turns each step into a glide.
const FILES = [
  { name: 'brand-guidelines.pdf', Icon: FileTextIcon, chunks: [9, 4, 12, 7, 3, 10] },
  { name: 'hero@2x.png', Icon: ImageIcon, chunks: [14, 18, 6, 21, 11] },
  { name: 'launch-film.mp4', Icon: FilmIcon, chunks: [3, 1, 4, 2, 5, 2] },
]

const uploaded = (chunks: number[], tick: number) =>
  Math.min(100, Array.from({ length: tick }, (_, i) => chunks[i % chunks.length]!).reduce((sum, n) => sum + n, 0))

export default function ProgressDemo() {
  const [tick, setTick] = useState(0)
  const values = FILES.map((file) => uploaded(file.chunks, tick))
  const done = values.every((v) => v === 100)

  useEffect(() => {
    if (done) return
    const id = setInterval(() => setTick((t) => t + 1), 420)
    return () => clearInterval(id)
  }, [done])

  return (
    <div className="w-full max-w-md rounded-xl border border-line bg-surface p-2">
      {FILES.map(({ name, Icon }, i) => (
        <div key={name} className="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-band text-fg-muted">
            <Icon size={16} />
          </span>
          <Progress value={values[i]!} className="gap-y-1.5">
            <ProgressLabel className="min-w-0 truncate">{name}</ProgressLabel>
            <ProgressValue />
          </Progress>
        </div>
      ))}
      <div className="flex items-center justify-between border-t border-line px-3 pt-2.5 pb-1">
        <p role="status" className="text-ui-sm text-fg-muted">
          {done ? 'All files uploaded.' : ''}
        </p>
        <Button size="sm" variant="ghost" onClick={() => setTick(0)}>
          Restart
        </Button>
      </div>
    </div>
  )
}
