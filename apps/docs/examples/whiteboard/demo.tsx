'use client'

import { Sparkline, StatCard, Whiteboard, type WhiteboardScene } from '@youj/react'

const FLOW: WhiteboardScene = {
  shapes: [
    { id: 'signup', type: 'sticky', color: 'blue', width: 'medium', x: 40, y: 72, w: 168, h: 96, text: 'Sign up\nEmail or Google' },
    { id: 'verify', type: 'sticky', color: 'accent', width: 'medium', x: 304, y: 72, w: 168, h: 96, text: 'Verify email\nLink valid 24h' },
    { id: 'workspace', type: 'sticky', color: 'green', width: 'medium', x: 568, y: 72, w: 168, h: 96, text: 'Create workspace\nName, invite team' },
    { id: 'expired', type: 'sticky', color: 'red', width: 'medium', x: 304, y: 264, w: 168, h: 80, text: 'Link expired\nResend and retry' },
    { id: 'c1', type: 'connector', color: 'ink', width: 'thin', from: { shape: 'signup' }, to: { shape: 'verify' }, route: 'elbow' },
    { id: 'c2', type: 'connector', color: 'ink', width: 'thin', from: { shape: 'verify' }, to: { shape: 'workspace' }, route: 'elbow', label: 'clicked' },
    { id: 'c3', type: 'connector', color: 'red', width: 'thin', from: { shape: 'verify' }, to: { shape: 'expired' }, route: 'elbow', label: 'after 24h' },
    { id: 'c4', type: 'connector', color: 'red', width: 'thin', from: { shape: 'expired' }, to: { shape: 'signup' }, route: 'elbow' },
    { id: 'activation', type: 'embed', x: 568, y: 232, w: 240, h: 172, title: 'Activation, last 30 days' },
    { id: 'note', type: 'text', color: 'amber', width: 'thin', x: 40, y: 380, text: 'Skip verify for SSO?' },
    {
      id: 'circle',
      type: 'pen',
      color: 'amber',
      width: 'medium',
      points: Array.from({ length: 34 }, (_, i) => {
        const a = (i / 30) * Math.PI * 2 - 0.6
        return [123 + Math.cos(a) * (102 + i * 0.6), 392 + Math.sin(a) * (26 + i * 0.2), 0.45 + 0.3 * Math.sin(i / 4)] as [number, number, number]
      }),
    },
  ],
  pins: [{ id: 'p1', shape: 'verify', x: 160, y: 4, author: 'Mara Lind', text: 'Could the link last 48 hours? Most retries come the next morning.' }],
}

const RATE = [52, 55, 54, 58, 57, 61, 60, 63, 62, 64]

export default function WhiteboardDemo() {
  return (
    <Whiteboard
      defaultValue={FLOW}
      height={480}
      className="max-w-4xl"
      embeds={{
        activation: (
          <StatCard
            label="Activated"
            value={0.64}
            format={{ style: 'percent' }}
            delta={0.04}
            comparison="vs last month"
            chart={<Sparkline data={RATE} className="h-8" />}
          />
        ),
      }}
    />
  )
}
