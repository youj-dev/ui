'use client'

import type { ReactNode } from 'react'
import { Avatar, AvatarFallback, Whiteboard, type WhiteboardPin, type WhiteboardScene } from '@youj/react'

const THREADS: Record<string, { who: string; text: string }[]> = {
  p1: [
    { who: 'Mara Lind', text: 'Can the hero say what it does in five words?' },
    { who: 'Theo Park', text: 'Trying “Your team’s plans, in one place”.' },
  ],
  p2: [{ who: 'Ana Ruiz', text: 'Pricing link goes to the old page.' }],
}

const SCENE: WhiteboardScene = {
  shapes: [
    { id: 'hero', type: 'rectangle', color: 'ink', width: 'medium', x: 0, y: 0, w: 520, h: 140 },
    { id: 'hero-t', type: 'text', color: 'ink', width: 'bold', x: 32, y: 40, text: 'Plan together' },
    { id: 'nav', type: 'sticky', color: 'blue', width: 'medium', x: 0, y: 180, w: 240, h: 72, text: 'Nav: Product, Pricing, Docs' },
    { id: 'cta', type: 'sticky', color: 'accent', width: 'medium', x: 280, y: 180, w: 240, h: 72, text: 'Start free trial' },
  ],
  pins: [
    { id: 'p1', shape: 'hero', x: 300, y: 28, author: 'Mara Lind' },
    { id: 'p2', shape: 'nav', x: 210, y: 10, author: 'Ana Ruiz', resolved: true },
  ],
}

function Thread({ pin, actions }: { pin: WhiteboardPin; actions: ReactNode }) {
  const replies = THREADS[pin.id] ?? []
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1 py-1.5 ps-3 pe-1.5">
        <span className="flex-1 font-medium text-ui-sm">
          {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
        </span>
        {actions}
      </div>
      <ol className="flex flex-col gap-3 px-3 pb-3">
        {replies.map((c) => (
          <li key={c.text} className="flex gap-2.5">
            <Avatar size="sm">
              <AvatarFallback>{c.who.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <span className="font-medium text-ui-sm">{c.who}</span>
              <span className="text-fg-muted text-ui-sm">{c.text}</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default function WhiteboardComments() {
  return (
    <Whiteboard
      defaultValue={SCENE}
      defaultTool="comment"
      height={380}
      className="max-w-3xl"
      pinContent={(pin, actions) => <Thread pin={pin} actions={actions} />}
    />
  )
}
