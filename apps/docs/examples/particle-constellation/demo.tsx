'use client'

import { GitBranchIcon } from '@youj/icons'
import { ParticleConstellation } from '@youj/motion/backgrounds'

export default function ParticleConstellationDemo() {
  return (
    <section className="relative isolate flex min-h-[400px] w-full flex-col items-center justify-center overflow-hidden px-6 py-12 text-center rounded-2xl border border-line bg-canvas mx-auto max-w-[calc(100%-2rem)] sm:max-w-[calc(100%-4rem)]">
      <ParticleConstellation density={1.8} />
      {/* A soft pool of canvas under the copy, so the links never cross the text. */}
      <div aria-hidden className="absolute inset-0 bg-radial from-canvas from-25% via-canvas/70 via-45% to-transparent to-75%" />
      <p className="relative mb-4 inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/70 youj-allow-glass px-3 py-1 text-xs font-medium text-fg-muted backdrop-blur-md">
        <GitBranchIcon size={14} />
        Service graph, now live
      </p>
      <p className="relative max-w-md text-3xl font-semibold tracking-tight text-balance text-fg sm:text-4xl">
        See every dependency before it breaks
      </p>
      <p className="relative mt-3 max-w-sm text-sm text-pretty text-fg-muted">
        Move the pointer across the field: nearby links light up and the nodes gather around it.
      </p>
    </section>
  )
}
