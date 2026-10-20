'use client'

import { TextSplit } from '@youj/motion'

export default function TextSplitDemo() {
  return (
    <article className="w-full max-w-xl">
      {/* Three cues, one gesture: the kicker by character, the headline by measured line, the deck by word. */}
      <TextSplit as="p" by="chars" variant="fade" inView={false} className="font-mono text-xs tracking-[0.18em] text-accent uppercase">
        Launch week · Day 3
      </TextSplit>
      <TextSplit
        as="p"
        by="lines"
        mask
        inView={false}
        delay={1}
        duration="deliberate"
        className="mt-4 text-3xl leading-[1.1] font-semibold tracking-tight text-balance text-fg sm:text-4xl"
      >
        Every branch gets a preview you can share in seconds.
      </TextSplit>
      <TextSplit
        as="p"
        by="words"
        variant="blur-in"
        step="tight"
        inView={false}
        delay={14}
        className="mt-5 text-[15px] leading-relaxed text-fg-muted"
      >
        Previews build from every push with their own URL, logs and analytics, and promote to production without a rebuild.
      </TextSplit>
      <div className="mt-7 flex items-center gap-3 border-t border-line pt-5 text-sm text-fg-muted">
        <span aria-hidden className="grid size-8 place-items-center rounded-full bg-raised text-xs font-medium text-fg">
          PR
        </span>
        <span>Priya Raman · 4 min read</span>
      </div>
    </article>
  )
}
