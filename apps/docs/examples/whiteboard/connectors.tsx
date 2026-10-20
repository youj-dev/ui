'use client'

import { Whiteboard, type WhiteboardScene } from '@youj/react'

const SCENE: WhiteboardScene = {
  shapes: [
    { id: 'api', type: 'rectangle', color: 'ink', width: 'medium', x: 0, y: 40, w: 140, h: 64 },
    { id: 'api-t', type: 'text', color: 'ink', width: 'thin', x: 50, y: 62, text: 'API' },
    { id: 'queue', type: 'ellipse', color: 'blue', width: 'medium', x: 240, y: 32, w: 160, h: 80 },
    { id: 'queue-t', type: 'text', color: 'blue', width: 'thin', x: 296, y: 62, text: 'Queue' },
    { id: 'worker', type: 'sticky', color: 'green', width: 'medium', x: 500, y: 0, w: 160, h: 64, text: 'Worker A' },
    { id: 'worker-b', type: 'sticky', color: 'green', width: 'medium', x: 500, y: 112, w: 160, h: 64, text: 'Worker B' },
    { id: 'dlq', type: 'sticky', color: 'red', width: 'medium', x: 240, y: 200, w: 160, h: 64, text: 'Dead letters' },
    { id: 'k1', type: 'connector', color: 'ink', width: 'thin', from: { shape: 'api' }, to: { shape: 'queue' }, label: 'enqueue' },
    { id: 'k2', type: 'connector', color: 'ink', width: 'thin', from: { shape: 'queue' }, to: { shape: 'worker' }, route: 'elbow' },
    { id: 'k3', type: 'connector', color: 'ink', width: 'thin', from: { shape: 'queue' }, to: { shape: 'worker-b' }, route: 'elbow' },
    { id: 'k4', type: 'connector', color: 'red', width: 'thin', from: { shape: 'worker-b' }, to: { shape: 'dlq' }, route: 'elbow', label: 'after 5 tries' },
  ],
}

export default function WhiteboardConnectors() {
  return <Whiteboard defaultValue={SCENE} defaultTool="connector" height={400} className="max-w-3xl" />
}
