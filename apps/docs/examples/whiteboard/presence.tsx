'use client'

import { useEffect, useState } from 'react'
import { Whiteboard, type WhiteboardCursor, type WhiteboardScene } from '@youj/react'

const SCENE: WhiteboardScene = {
  shapes: [
    { id: 'a', type: 'sticky', color: 'amber', width: 'medium', x: 0, y: 0, w: 180, h: 80, text: 'Research' },
    { id: 'b', type: 'sticky', color: 'blue', width: 'medium', x: 240, y: 0, w: 180, h: 80, text: 'Design' },
    { id: 'c', type: 'sticky', color: 'green', width: 'medium', x: 480, y: 0, w: 180, h: 80, text: 'Build' },
    { id: 'k1', type: 'connector', color: 'ink', width: 'thin', from: { shape: 'a' }, to: { shape: 'b' } },
    { id: 'k2', type: 'connector', color: 'ink', width: 'thin', from: { shape: 'b' }, to: { shape: 'c' } },
  ],
}

/** Two people moving around the board: in an app these come from your realtime layer. */
function useDemoCursors() {
  const [t, setT] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setT(performance.now() / 700), 60)
    return () => clearInterval(id)
  }, [])
  const cursors: WhiteboardCursor[] = [
    { id: 'ana', name: 'Ana', x: 90 + Math.cos(t / 2) * 120, y: 130 + Math.sin(t / 3) * 30 },
    { id: 'theo', name: 'Theo', x: 520 + Math.sin(t / 2.5) * 80, y: -40 + Math.cos(t / 2) * 20, message: t % 8 < 4 ? 'Moving Build here?' : undefined },
  ]
  return cursors
}

export default function WhiteboardPresence() {
  const cursors = useDemoCursors()
  const [mine, setMine] = useState<{ x: number; y: number } | null>(null)
  return (
    <div className="flex w-full max-w-3xl flex-col gap-2">
      <Whiteboard defaultValue={SCENE} defaultTool="select" height={340} cursors={cursors} onCursorMove={setMine} />
      <span className="font-mono text-fg-muted text-ui-xs">{mine ? `You: ${Math.round(mine.x)}, ${Math.round(mine.y)}` : 'Move over the board'}</span>
    </div>
  )
}
