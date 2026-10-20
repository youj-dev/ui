'use client'

import { SparklesIcon } from '@youj/icons'
import { Aurora } from '@youj/motion/backgrounds'

export default function AuroraDemo() {
  return (
    // The curtains hang above the horizon, so the copy sits in the quiet lower part of the frame.
    <section className="relative isolate flex min-h-[420px] w-full flex-col items-center justify-end overflow-hidden px-6 pt-40 pb-12 text-center rounded-2xl border border-line bg-canvas mx-auto max-w-[calc(100%-2rem)] sm:max-w-[calc(100%-4rem)]">
      <Aurora />
      <p className="relative mb-4 inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/60 youj-allow-glass px-3 py-1 text-xs font-medium text-fg-muted backdrop-blur-md">
        <SparklesIcon size={14} />
        Youj Intelligence, in beta
      </p>
      <p className="relative max-w-md text-3xl font-semibold tracking-tight text-balance text-fg sm:text-4xl">
        Answers that arrive before the question
      </p>
      <p className="relative mt-3 max-w-sm text-sm text-pretty text-fg-muted">
        An assistant that reads your whole workspace and surfaces what matters, at the moment you need it.
      </p>
      <button
        type="button"
        className="relative mt-7 rounded-full bg-fg px-4 py-2 text-sm font-medium text-canvas focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none"
      >
        Join the beta
      </button>
    </section>
  )
}
