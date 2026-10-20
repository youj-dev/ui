'use client'

import { useState } from 'react'
import { SlidingIndicator } from '@youj/motion'

const LINKS = ['Docs', 'Components', 'Templates', 'Changelog', 'Pricing']

export default function SlidingIndicatorHover() {
  const [current, setCurrent] = useState('Components')

  return (
    <div className="w-full max-w-xl rounded-xl border border-line bg-surface px-1">
      {/* Two indicators in one group. The pill follows the pointer and keyboard focus;
          the underline stays on the current page. Each finds its own target. */}
      <nav aria-label="Site" className="relative isolate flex gap-0.5 overflow-x-auto px-1 py-2 [scrollbar-width:none]">
        <SlidingIndicator follow="hover" />
        <SlidingIndicator variant="underline" className="translate-y-2 bg-accent" />
        {LINKS.map((label) => (
          <a
            key={label}
            href={`/${label.toLowerCase()}`}
            aria-current={current === label ? 'page' : undefined}
            onClick={(e) => {
              e.preventDefault()
              setCurrent(label)
            }}
            className={`inline-flex h-8 shrink-0 items-center rounded-md px-3 text-sm outline-none transition-colors yj-duration-fast ease-standard focus-visible:ring-2 focus-visible:ring-accent ${
              current === label ? 'text-fg' : 'text-fg-muted hover:text-fg'
            }`}
          >
            {label}
          </a>
        ))}
      </nav>
    </div>
  )
}
