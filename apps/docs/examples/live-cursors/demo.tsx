'use client'

import { useRef, useState } from 'react'
import { LiveCursors, type LiveCursorPosition, type LiveCursorUser, PresenceAvatars, useLiveCursorsInput } from '@youj/react'
import { useWalkers, type Walker } from './simulate'

const TEAM: Walker[] = [
  { id: 'mira', name: 'Mira Chen', status: 'editing', cx: 0.26, cy: 0.45, rx: 0.1, ry: 0.2, pace: 4, phase: 0, selection: [{ x: 0.06, y: 0.12, width: 0.36, height: 0.76 }] },
  { id: 'jonas', name: 'Jonas Weber', status: 'editing', cx: 0.66, cy: 0.32, rx: 0.14, ry: 0.08, pace: 5, phase: 0.2 },
  { id: 'tomas', name: 'Tomás Ruiz', status: 'viewing', cx: 0.7, cy: 0.68, rx: 0.12, ry: 0.12, pace: 2.5, phase: 0.7, lines: ['Love this header', 'Can we try 24px?'] },
]

export default function LiveCursorsDemo() {
  // Simulated people; in an app, `users` comes from your realtime channel.
  const others = useWalkers(TEAM)
  const surface = useRef<HTMLDivElement>(null)
  // Your own pointer, as you'd send it; here it comes straight back as a cursor of its own.
  const [you, setYou] = useState<LiveCursorPosition | null>(null)
  useLiveCursorsInput(surface, setYou)
  const users: LiveCursorUser[] = you ? [...others, { id: 'you', name: 'You', color: 'var(--color-accent)', ...you }] : others

  return (
    <div className="flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
        <span className="text-ui font-semibold text-fg">Checkout redesign</span>
        <PresenceAvatars users={others} size="sm" />
      </div>
      <LiveCursors ref={surface} users={users} className="h-80 bg-canvas [background-image:radial-gradient(var(--color-line)_1px,transparent_1px)] [background-size:16px_16px]">
        <div className="absolute top-[12%] left-[6%] flex h-[76%] w-[36%] flex-col gap-2 rounded-xl border border-line bg-surface p-3">
          <div className="h-3 w-1/2 rounded-full bg-band" />
          <div className="h-20 rounded-lg bg-accent-subtle" />
          <div className="h-3 w-3/4 rounded-full bg-band" />
          <div className="mt-auto h-8 rounded-lg bg-accent" />
        </div>
        <div className="absolute top-[52%] left-[52%] h-[34%] w-[30%] rotate-1 rounded-md bg-warning-subtle p-3 text-ui-sm text-warning-text">Ship the new totals row?</div>
      </LiveCursors>
    </div>
  )
}
