'use client'

import { WarpGrid } from '@youj/motion/backgrounds'

export default function WarpGridDemo() {
  return (
    <section className="relative isolate flex min-h-[400px] w-full flex-col items-center justify-center overflow-hidden px-6 py-12 text-center rounded-2xl border border-line bg-canvas mx-auto max-w-[calc(100%-2rem)] sm:max-w-[calc(100%-4rem)]">
      <WarpGrid />
      {/* A soft pool of canvas under the copy, so the field never crosses the text. */}
      <div aria-hidden className="absolute inset-0 bg-radial from-canvas from-15% via-canvas/50 via-35% to-transparent to-65%" />
      <p className="relative mb-4 rounded-full border border-line bg-surface/70 youj-allow-glass px-3 py-1 text-xs font-medium text-fg-muted backdrop-blur-md">
        Built to carry weight
      </p>
      <p className="relative max-w-md text-3xl font-semibold tracking-tight text-balance text-fg sm:text-4xl">Space bends around what matters</p>
      <p className="relative mt-3 max-w-sm text-sm text-pretty text-fg-muted">
        Point at anything and the whole grid leans in. Let go and it settles back to the middle and breathes.
      </p>
    </section>
  )
}
