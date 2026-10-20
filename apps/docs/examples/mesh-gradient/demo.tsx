'use client'

import { MeshGradient } from '@youj/motion/backgrounds'

export default function MeshGradientDemo() {
  return (
    <section className="relative isolate flex min-h-[380px] w-full flex-col items-center justify-center overflow-hidden px-6 text-center rounded-2xl border border-line bg-canvas mx-auto max-w-[calc(100%-2rem)] sm:max-w-[calc(100%-4rem)]">
      <MeshGradient />
      <p className="relative mb-4 rounded-full border border-line bg-surface/60 youj-allow-glass px-3 py-1 text-xs font-medium text-fg-muted backdrop-blur-md">
        Realtime sync, now in every plan
      </p>
      <h2 className="relative max-w-md text-3xl font-semibold tracking-tight text-balance text-fg sm:text-4xl">
        The workspace that moves as fast as you think
      </h2>
      <p className="relative mt-3 max-w-sm text-sm text-pretty text-fg-muted">
        Move the pointer over it: the field leans toward you.
      </p>
    </section>
  )
}
