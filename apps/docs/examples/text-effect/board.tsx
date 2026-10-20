'use client'

import { useEffect, useState } from 'react'
import { useYouj } from '@youj/core'
import { TextEffect } from '@youj/motion'

const PAGES = [
  [
    ['08:15', 'LONDON', 'BOARDING'],
    ['08:32', 'PARIS NORD', 'ON TIME'],
    ['08:47', 'BRUXELLES', 'DELAYED'],
  ],
  [
    ['08:32', 'PARIS NORD', 'BOARDING'],
    ['08:47', 'BRUXELLES', 'EXP 09:02'],
    ['09:05', 'AMSTERDAM', 'ON TIME'],
  ],
]

export default function TextEffectBoard() {
  const k = useYouj()
  const [page, setPage] = useState(0)

  // Turn the page on the token grid, so Speed reaches the timeline too.
  useEffect(() => {
    const timer = setInterval(() => setPage((p) => (p + 1) % PAGES.length), k.ms('deliberate') * 9)
    return () => clearInterval(timer)
  }, [k])

  return (
    <section aria-label="Departures" className="rounded-xl border border-line bg-surface p-4 font-mono text-sm text-warning sm:text-base">
      <ul className="flex flex-col gap-1.5">
        {PAGES[page]!.map(([time, to, status], row) => (
          <li key={row} className="flex gap-2">
            {/* Padded to a fixed number of tiles, so the board never changes size. */}
            <TextEffect effect="split-flap" inView={false} text={time!} />
            <TextEffect effect="split-flap" inView={false} text={to!.padEnd(10)} />
            <TextEffect effect="split-flap" inView={false} text={status!.padEnd(9)} />
          </li>
        ))}
      </ul>
    </section>
  )
}
