'use client'

import { UsersIcon } from '@youj/icons'
import { Swarm } from '@youj/motion/backgrounds'

export default function SwarmDemo() {
  return (
    <section className="relative isolate flex min-h-[400px] w-full flex-col items-center justify-center overflow-hidden px-6 py-12 text-center rounded-2xl border border-line bg-canvas mx-auto max-w-[calc(100%-2rem)] sm:max-w-[calc(100%-4rem)]">
      <Swarm density={1.3} />
      {/* A soft pool of canvas under the copy, so the flock never crosses the text. */}
      <div aria-hidden className="absolute inset-0 bg-radial from-canvas from-25% via-canvas/70 via-45% to-transparent to-75%" />
      <p className="relative mb-4 inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/70 youj-allow-glass px-3 py-1 text-xs font-medium text-fg-muted backdrop-blur-md">
        <UsersIcon size={14} />
        Teams, in sync
      </p>
      <p className="relative max-w-md text-3xl font-semibold tracking-tight text-balance text-fg sm:text-4xl">
        Everyone moving the same way
      </p>
      <p className="relative mt-3 max-w-sm text-sm text-pretty text-fg-muted">
        Move the pointer across the field: the flock gathers around it and circles until you move on.
      </p>
    </section>
  )
}
