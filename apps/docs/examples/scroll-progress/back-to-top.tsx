'use client'

import { useRef } from 'react'
import { useYouj } from '@youj/core'
import { ScrollProgress } from '@youj/motion'
import { ArrowUpIcon } from '@youj/icons'

const EVENTS = [
  'Ana Lima promoted b81e07d to production',
  'Build 1,284 passed in 38s',
  'Kenji Sato opened “Tighten cache headers”',
  'Preview ready for feat/pricing',
  'Sara Okafor rotated WEBHOOK_SECRET',
  'Edge config updated: checkout-v2 at 50%',
  'Build 1,283 failed: 2 type errors',
  'Jonas Weber rolled back to 4f2a91c',
  'Domain youj.io verified',
  'Preview ready for fix/og-images',
  'Priya Raman invited 3 teammates',
  'Build 1,282 passed in 41s',
]

export default function ScrollProgressBackToTop() {
  const k = useYouj()
  const feed = useRef<HTMLOListElement>(null)

  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-line bg-surface">
      <p className="border-b border-line px-4 py-2.5 text-xs font-medium text-fg-muted">Activity</p>
      <ol
        ref={feed}
        aria-label="Activity"
        tabIndex={0}
        className="h-60 divide-y divide-line overflow-y-auto pb-14 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none focus-visible:ring-inset"
      >
        {EVENTS.map((event) => (
          <li key={event} className="px-4 py-2.5 text-sm text-fg">
            {event}
          </li>
        ))}
      </ol>
      {/* The ring doubles as the button's outline: progress on the way down, a way back up. */}
      <div className="absolute end-3 bottom-3 grid size-10 place-items-center">
        <ScrollProgress variant="ring" container={feed} size={40} thickness={2.5} label="Activity scrolled" className="absolute inset-0" />
        <button
          type="button"
          aria-label="Back to top"
          onClick={() => feed.current?.scrollTo({ top: 0, behavior: k.reduced ? 'auto' : 'smooth' })}
          className="relative grid size-8 place-items-center rounded-full bg-raised text-fg shadow-sm transition-colors duration-(--yj-duration-fast) ease-standard hover:bg-canvas focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          {/* ArrowUpIcon is a state icon (up or down): hold it up rather than letting hover flip it. */}
          <ArrowUpIcon size={16} trigger="none" />
        </button>
      </div>
    </div>
  )
}
