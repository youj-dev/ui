'use client'

import { MagneticField } from '@youj/motion/backgrounds'

export default function MagneticFieldDemo() {
  return (
    <section className="relative isolate flex min-h-[400px] w-full flex-col items-center justify-center overflow-hidden px-6 py-12 text-center rounded-2xl border border-line bg-canvas mx-auto max-w-[calc(100%-2rem)] sm:max-w-[calc(100%-4rem)]">
      <MagneticField />
      {/* A soft pool of canvas under the copy, so the field never crosses the text. */}
      <div aria-hidden className="absolute inset-0 bg-radial from-canvas from-20% via-canvas/60 via-40% to-transparent to-70%" />
      <p className="relative mb-4 rounded-full border border-line bg-surface/70 youj-allow-glass px-3 py-1 text-xs font-medium text-fg-muted backdrop-blur-md">
        Live, all the time
      </p>
      <p className="relative max-w-md text-3xl font-semibold tracking-tight text-balance text-fg sm:text-4xl">Every signal, held in place</p>
      <p className="relative mt-3 max-w-sm text-sm text-pretty text-fg-muted">
        The field makes room for whatever you point at, then settles back. Press anywhere to shove it.
      </p>
    </section>
  )
}
