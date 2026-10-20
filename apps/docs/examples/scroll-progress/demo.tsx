'use client'

import { useRef } from 'react'
import { ScrollProgress } from '@youj/motion'

const SECTIONS = [
  [
    'Previews for every branch',
    'Every push builds its own preview with a stable URL, its own logs and its own analytics. Share it in the pull request, and reviewers see the change running, not a screenshot of it.',
    'Comments pin to the element they’re about, and they follow it across later pushes, so a thread never loses its place.',
  ],
  [
    'Promote without a rebuild',
    'A preview that passes review is promoted as it is. The bytes you tested are the bytes that ship, and promotion takes seconds instead of a full build.',
    'Promotion checks the same environment variables production uses, and it stops before anything goes live if one is missing.',
  ],
  [
    'Instant rollbacks',
    'Every production deployment stays warm. Rolling back points the domain at the previous one, so recovery is one click and no build at all.',
    'The rollback is recorded like a deploy, with who did it and why, so the incident timeline writes itself.',
  ],
  [
    'Edge config',
    'Flags and redirects are read at the edge in under a millisecond, and they change without a deploy.',
    'Every change is versioned. Diff two versions, or restore one, from the same page.',
  ],
]

export default function ScrollProgressDemo() {
  const article = useRef<HTMLDivElement>(null)

  return (
    <div className="w-full max-w-xl overflow-hidden rounded-xl border border-line bg-surface">
      <div className="relative flex items-center justify-between gap-4 border-b border-line px-5 py-3.5">
        <div className="min-w-0">
          <p className="text-[11px] tracking-[0.16em] text-fg-muted uppercase">Changelog</p>
          <p className="truncate text-sm font-semibold text-fg">What shipped in 2.4</p>
        </div>
        {/* Both track the article's own scroll container, not the page. The bar repeats the ring, so only the ring is exposed. */}
        <ScrollProgress variant="ring" container={article} size={28} thickness={2.5} label="Reading progress" />
        <div aria-hidden className="absolute inset-x-0 -bottom-px">
          <ScrollProgress container={article} />
        </div>
      </div>
      <div
        ref={article}
        role="region"
        aria-label="What shipped in 2.4"
        tabIndex={0}
        className="h-64 overflow-y-auto px-5 py-5 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none focus-visible:ring-inset"
      >
        {SECTIONS.map(([title, lead, detail], i) => (
          <section key={title} className={i > 0 ? 'mt-7' : undefined}>
            <p className="flex items-baseline gap-2.5 text-[15px] font-semibold text-fg">
              <span className="font-mono text-xs text-accent">0{i + 1}</span>
              {title}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">{lead}</p>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">{detail}</p>
          </section>
        ))}
      </div>
    </div>
  )
}
