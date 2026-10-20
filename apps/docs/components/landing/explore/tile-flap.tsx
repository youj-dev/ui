'use client'

import { useRef, useState } from 'react'
import { useYouj } from '@youj/core'
import { TextEffect } from '@youj/motion'
import { useLoop } from '@/components/landing/use-loop'
import { Demo } from './demo'

const PAGES = [
  [
    ['08:15', 'LONDON', 'BOARDING'],
    ['08:32', 'PARIS NORD', 'ON TIME'],
    ['08:47', 'BRUXELLES', 'DELAYED'],
    ['09:05', 'AMSTERDAM', 'ON TIME'],
    ['09:20', 'KÖLN', 'ON TIME'],
  ],
  [
    ['08:32', 'PARIS NORD', 'BOARDING'],
    ['08:47', 'BRUXELLES', 'EXP 09:02'],
    ['09:05', 'AMSTERDAM', 'ON TIME'],
    ['09:20', 'KÖLN', 'ON TIME'],
    ['09:42', 'FRANKFURT', 'ON TIME'],
  ],
  [
    ['08:47', 'BRUXELLES', 'BOARDING'],
    ['09:05', 'AMSTERDAM', 'ON TIME'],
    ['09:20', 'KÖLN', 'DELAYED'],
    ['09:42', 'FRANKFURT', 'ON TIME'],
    ['10:05', 'GENÈVE', 'ON TIME'],
  ],
]

/** A departures board on split-flap tiles, turning to the next page every few beats while it's seen. */
export default function FlapTile() {
  const k = useYouj()
  const root = useRef<HTMLElement>(null)
  const [page, setPage] = useState(0)
  useLoop(root, k.ms('deliberate') * 9, () => setPage((p) => (p + 1) % PAGES.length))
  return (
    <Demo>
      <div className="@container grid w-full justify-items-center">
        <section
          ref={root}
          aria-label="Departures"
          className="explore-flap rounded-2xl border border-line bg-surface p-4 font-mono text-[13px] text-warning shadow-xs sm:text-sm"
        >
          <ul className="flex flex-col gap-1.5">
            {PAGES[page]!.map(([time, to, status], row) => (
              <li key={row} className="flex gap-2">
                <TextEffect effect="split-flap" inView={false} text={time!} />
                <TextEffect effect="split-flap" inView={false} text={to!.padEnd(10)} />
                <TextEffect effect="split-flap" inView={false} text={status!.padEnd(9)} className="@max-[24rem]:hidden" />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Demo>
  )
}
