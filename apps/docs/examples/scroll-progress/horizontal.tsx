'use client'

import { useRef } from 'react'
import { ScrollProgress } from '@youj/motion'

const TEMPLATES = [
  { name: 'Commerce', stack: 'Next.js · Stripe' },
  { name: 'Docs', stack: 'MDX · Search' },
  { name: 'Blog', stack: 'Markdown · RSS' },
  { name: 'Dashboard', stack: 'Charts · Auth' },
  { name: 'Portfolio', stack: 'Images · Motion' },
  { name: 'Waitlist', stack: 'Forms · Email' },
  { name: 'Changelog', stack: 'Releases · Feeds' },
]

export default function ScrollProgressHorizontal() {
  const rail = useRef<HTMLUListElement>(null)

  return (
    <div className="w-full max-w-xl">
      <ul
        ref={rail}
        aria-label="Templates"
        tabIndex={0}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto rounded-xl pb-4 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        {TEMPLATES.map(({ name, stack }, i) => (
          <li key={name} className="w-44 shrink-0 snap-start overflow-hidden rounded-xl border border-line bg-surface">
            <div
              aria-hidden
              className="h-24 bg-raised"
              style={{ backgroundImage: `radial-gradient(90% 90% at ${15 + i * 12}% 20%, color-mix(in oklch, var(--color-accent) 32%, transparent), transparent 70%)` }}
            />
            <div className="p-3">
              <p className="text-sm font-medium text-fg">{name}</p>
              <p className="text-xs text-fg-muted">{stack}</p>
            </div>
          </li>
        ))}
      </ul>
      {/* axis="x" follows the rail's horizontal scroll. The track is a token-colored hairline. */}
      <div className="h-0.5 overflow-hidden rounded-full bg-line">
        <ScrollProgress container={rail} axis="x" label="Templates scrolled" />
      </div>
    </div>
  )
}
