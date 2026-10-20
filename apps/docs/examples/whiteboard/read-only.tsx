'use client'

import { Whiteboard, type WhiteboardScene } from '@youj/react'

const REVIEW: WhiteboardScene = {
  shapes: [
    { id: 'api', type: 'rectangle', color: 'ink', width: 'medium', x: 40, y: 40, w: 140, h: 64 },
    { id: 'api-t', type: 'text', color: 'ink', width: 'medium', x: 82, y: 60, text: 'API' },
    { id: 'queue', type: 'rectangle', color: 'ink', width: 'medium', x: 260, y: 40, w: 140, h: 64 },
    { id: 'queue-t', type: 'text', color: 'ink', width: 'medium', x: 290, y: 60, text: 'Queue' },
    { id: 'a1', type: 'arrow', color: 'ink', width: 'medium', x1: 190, y1: 72, x2: 250, y2: 72 },
    { id: 'note', type: 'text', color: 'amber', width: 'thin', x: 240, y: 130, text: 'Retries back off here' },
    { id: 'a2', type: 'arrow', color: 'amber', width: 'thin', x1: 320, y1: 125, x2: 330, y2: 110 },
  ],
}

export default function WhiteboardReadOnly() {
  return <Whiteboard value={REVIEW} readOnly height={280} label="Queue design" className="max-w-3xl" />
}
