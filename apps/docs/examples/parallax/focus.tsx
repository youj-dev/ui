'use client'

import { useRef } from 'react'
import { useYouj } from '@youj/core'
import { Parallax } from '@youj/motion'

const RELEASES = [
  { version: '2.4', title: 'Previews for every branch', date: 'Sep 12' },
  { version: '2.3', title: 'Instant rollbacks', date: 'Aug 21' },
  { version: '2.2', title: 'Edge config', date: 'Jul 30' },
  { version: '2.1', title: 'Webhooks, signed', date: 'Jul 02' },
  { version: '2.0', title: 'A new build pipeline', date: 'Jun 10' },
]

export default function ParallaxFocus() {
  const k = useYouj()
  const frame = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={frame}
      role="region"
      aria-label="Releases"
      tabIndex={0}
      className="relative h-[300px] w-full max-w-sm overflow-y-auto rounded-xl border border-line bg-canvas focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
    >
      <ol className="space-y-3 px-5 py-28">
        {RELEASES.map(({ version, title, date }) => (
          <li key={version} className="relative">
            {/* Three stops, peaking mid-frame. The glow fades; the text never does. With nothing
                moving, a glow on every card would mean nothing, so it's left out. */}
            {!k.reduced && (
              <Parallax
                container={frame}
                input={[0, 0.5, 1]}
                opacity={[0, 1, 0]}
                aria-hidden
                className="absolute -inset-1 rounded-2xl bg-accent-line blur-md"
              />
            )}
            <Parallax
              container={frame}
              input={[0, 0.5, 1]}
              scale={[0.94, 1, 0.94]}
              className="relative flex items-center gap-4 rounded-xl border border-line bg-surface p-4"
            >
              <span className="font-mono text-sm text-accent">{version}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">{title}</span>
              <span className="text-xs text-fg-muted">{date}</span>
            </Parallax>
          </li>
        ))}
      </ol>
    </div>
  )
}
