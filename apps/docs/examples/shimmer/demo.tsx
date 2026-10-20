'use client'

import { Shimmer } from '@youj/motion'
import { SearchIcon } from '@youj/icons'
import { Kbd, KbdGroup } from '@youj/react'

export default function ShimmerDemo() {
  return (
    <div className="w-full max-w-md">
      {/* Hover or focus the field: the light lengthens and a bloom lifts along the edge. */}
      <Shimmer className="rounded-xl bg-surface">
        <label className="relative z-2 flex h-12 cursor-text items-center gap-3 px-4">
          <SearchIcon size={16} className="shrink-0 text-fg-muted" />
          <span className="sr-only">Search the docs or ask a question</span>
          <input
            placeholder="Search the docs or ask a question…"
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-muted"
          />
          <KbdGroup className="max-sm:hidden">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </label>
      </Shimmer>
      <p className="mt-3 text-center text-xs text-fg-muted">Answers cite the page they come from.</p>
    </div>
  )
}
