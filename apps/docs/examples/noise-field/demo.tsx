'use client'

import { ArrowRightIcon, GlobeIcon } from '@youj/icons'
import { NoiseField } from '@youj/motion/backgrounds'

export default function NoiseFieldDemo() {
  return (
    <section className="relative isolate flex min-h-[400px] w-full flex-col justify-center overflow-hidden px-8 py-12 sm:px-12 rounded-2xl border border-line bg-canvas mx-auto max-w-[calc(100%-2rem)] sm:max-w-[calc(100%-4rem)]">
      <NoiseField />
      {/* A quiet zone behind the copy: the survey fades out where the text sits. */}
      <div aria-hidden className="absolute inset-0 bg-linear-to-r from-canvas from-20% via-canvas/60 to-transparent to-80%" />
      <p className="relative mb-5 inline-flex w-fit items-center gap-1.5 rounded-full border border-line bg-surface/70 youj-allow-glass px-3 py-1 text-xs font-medium text-fg-muted backdrop-blur-md">
        <GlobeIcon size={14} />
        16 new edge regions
      </p>
      <p className="relative max-w-md text-3xl font-semibold tracking-tight text-balance text-fg sm:text-4xl">
        Route every request along the shortest path
      </p>
      <p className="relative mt-3 max-w-sm text-sm text-pretty text-fg-muted">
        Latency, load and failures, read like terrain and rebalanced before anyone notices.
      </p>
      <div className="relative mt-7 flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg bg-fg px-3.5 py-2 text-sm font-medium text-canvas focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none"
        >
          Deploy now
          <ArrowRightIcon size={15} />
        </button>
        <button
          type="button"
          className="rounded-lg border border-line bg-surface/70 youj-allow-glass px-3.5 py-2 text-sm font-medium text-fg backdrop-blur-md focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          See the network
        </button>
      </div>
    </section>
  )
}
