'use client'

import { DotMatrixWave } from '@youj/motion/backgrounds'

export default function DotMatrixWaveDemo() {
  return (
    <section className="relative isolate flex min-h-[400px] w-full flex-col items-center justify-center overflow-hidden px-6 py-12 text-center rounded-2xl border border-line bg-canvas mx-auto max-w-[calc(100%-2rem)] sm:max-w-[calc(100%-4rem)]">
      <DotMatrixWave />
      <div aria-hidden className="absolute inset-0 bg-radial from-canvas from-20% via-canvas/60 via-40% to-transparent to-70%" />
      <p className="relative mb-4 rounded-full border border-line bg-surface/70 youj-allow-glass px-3 py-1 text-xs font-medium text-fg-muted backdrop-blur-md">
        Youj 2.0 is here
      </p>
      <p className="relative max-w-md text-3xl font-semibold tracking-tight text-balance text-fg sm:text-4xl">Built to the last pixel</p>
      <p className="relative mt-3 max-w-sm text-sm text-pretty text-fg-muted">
        An interface toolkit for teams who notice the details. Click anywhere in the field to send a ripple.
      </p>
    </section>
  )
}
