'use client'

import { Badge, Sparkline, StatCard, Whiteboard, type WhiteboardScene } from '@youj/react'

const SCENE: WhiteboardScene = {
  shapes: [
    { id: 'signups', type: 'embed', x: 0, y: 0, w: 240, h: 176, title: 'Sign-ups, this week' },
    { id: 'release', type: 'embed', x: 320, y: 0, w: 240, h: 112, title: 'Release' },
    { id: 'why', type: 'sticky', color: 'amber', width: 'medium', x: 320, y: 152, w: 240, h: 72, text: 'Spike lines up with the pricing page launch' },
    { id: 'k1', type: 'connector', color: 'amber', width: 'thin', from: { shape: 'why' }, to: { shape: 'signups' }, route: 'elbow' },
  ],
}

export default function WhiteboardEmbeds() {
  return (
    <Whiteboard
      defaultValue={SCENE}
      height={400}
      tools={['select', 'hand', 'sticky', 'connector', 'comment']}
      className="max-w-3xl"
      embeds={{
        signups: (
          <StatCard
            label="Sign-ups"
            value={1284}
            delta={0.18}
            comparison="vs last week"
            chart={<Sparkline data={[120, 132, 128, 141, 150, 238, 275]} className="h-8" />}
          />
        ),
        release: (
          <div className="flex h-full flex-col justify-center gap-2 rounded-xl bg-surface px-4 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="font-medium text-ui">v2.4 pricing</span>
              <Badge variant="success">Live</Badge>
            </div>
            <span className="text-fg-muted text-ui-sm">Shipped Tuesday, 09:40</span>
          </div>
        ),
      }}
    />
  )
}
