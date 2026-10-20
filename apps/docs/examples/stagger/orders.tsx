'use client'

import { Stagger, type StaggerOrder } from '@youj/motion'

const ORDERS: StaggerOrder[] = ['start', 'end', 'center', 'random']

export default function StaggerOrders() {
  return (
    <div className="grid grid-cols-2 gap-x-12 gap-y-8 sm:grid-cols-4 sm:gap-x-8">
      {ORDERS.map((order) => (
        <figure key={order} className="flex flex-col items-center gap-3">
          {/* The same 25 tiles each time. Only the order of their cues changes. */}
          <Stagger aria-hidden order={order} variant="scale" inView={false} className="grid grid-cols-5 gap-1">
            {Array.from({ length: 25 }, (_, i) => (
              <div key={i} className="size-5 rounded-[5px] bg-accent" />
            ))}
          </Stagger>
          <figcaption className="font-mono text-xs text-fg-muted">{order}</figcaption>
        </figure>
      ))}
    </div>
  )
}
