'use client'

import { useRef, useState } from 'react'
import { LiveCursors, PresenceAvatars, useLiveCursorsInput, type LiveCursorPosition, type LiveCursorUser } from '@youj/react'
import { usePlaying } from '@/components/landing/use-loop'
import { useWalkers, type Walker } from '@/examples/live-cursors/simulate'
import { Demo } from './demo'

const TEAM: Walker[] = [
  {
    id: 'mira',
    name: 'Mira Chen',
    status: 'editing',
    cx: 0.27,
    cy: 0.46,
    rx: 0.1,
    ry: 0.2,
    pace: 4,
    phase: 0,
    selection: [{ x: 0.06, y: 0.12, width: 0.38, height: 0.74 }],
  },
  { id: 'jonas', name: 'Jonas Weber', status: 'editing', cx: 0.68, cy: 0.3, rx: 0.14, ry: 0.08, pace: 5, phase: 0.2 },
  {
    id: 'tomas',
    name: 'Tomás Ruiz',
    status: 'viewing',
    cx: 0.7,
    cy: 0.7,
    rx: 0.12,
    ry: 0.1,
    pace: 2.5,
    phase: 0.7,
    lines: ['Love this header', 'Can we try 24px?'],
  },
]

/** A small design board with three teammates moving, selecting and typing; your pointer joins them as You. Presence isn't announced: the people are simulated. */
export default function CursorsTile() {
  const board = useRef<HTMLDivElement>(null)
  const others = useWalkers(TEAM, 140, usePlaying(board))
  const [you, setYou] = useState<LiveCursorPosition | null>(null)
  useLiveCursorsInput(board, setYou)
  const users: LiveCursorUser[] = you ? [...others, { id: 'you', name: 'You', color: 'var(--color-accent)', ...you }] : others
  return (
    <Demo>
      <div className="explore-box size-full max-w-xl">
        <div className="flex size-full flex-col overflow-hidden rounded-xl border border-line bg-surface">
          <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
            <span className="truncate text-ui font-semibold text-fg">Checkout redesign</span>
            <PresenceAvatars users={others} size="sm" />
          </div>
          <LiveCursors
            ref={board}
            users={users}
            announce={false}
            className="min-h-0 flex-1 bg-canvas [background-image:radial-gradient(var(--color-line)_1px,transparent_1px)] [background-size:16px_16px]"
          >
            <div className="absolute top-[12%] left-[6%] flex h-[74%] w-[38%] flex-col gap-2 rounded-xl border border-line bg-surface p-3">
              <div className="h-3 w-1/2 rounded-full bg-band" />
              <div className="min-h-10 flex-1 rounded-lg bg-accent-subtle" />
              <div className="h-3 w-3/4 rounded-full bg-band" />
              <div className="h-8 rounded-lg bg-accent" />
            </div>
            <div className="absolute top-[54%] left-[52%] h-[30%] w-[32%] rotate-1 rounded-md bg-warning-subtle p-3 text-ui-sm text-warning-text">
              Ship the new totals row?
            </div>
          </LiveCursors>
        </div>
      </div>
    </Demo>
  )
}
