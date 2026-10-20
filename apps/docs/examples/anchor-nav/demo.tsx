'use client'

import { useRef } from 'react'
import { AnchorNav, type AnchorNavItem } from '@youj/react'

// Section ids must be unique on the page, so they carry a prefix.
const ITEMS: AnchorNavItem[] = [
  { id: 'guide-overview', label: 'Overview' },
  { id: 'guide-install', label: 'Installation' },
  { id: 'guide-npm', label: 'From npm', depth: 1 },
  { id: 'guide-registry', label: 'From the registry', depth: 1 },
  { id: 'guide-theming', label: 'Theming' },
  { id: 'guide-motion', label: 'Motion' },
  { id: 'guide-faq', label: 'FAQ' },
]

export default function AnchorNavDemo() {
  // The sections scroll inside this frame. On a docs page, leave scrollContainer out and it follows the window.
  const scroller = useRef<HTMLDivElement>(null)

  return (
    <div className="grid w-full max-w-2xl grid-cols-[minmax(0,1fr)_10.5rem] overflow-hidden rounded-xl border border-line bg-canvas shadow-xs max-sm:grid-cols-1">
      <div ref={scroller} role="region" aria-label="Sections" tabIndex={0} className="h-[22rem] overflow-y-auto px-5 py-4 focus-visible:outline-2 focus-visible:outline-focus">
        {ITEMS.map((item, i) => (
          <section
            key={item.id}
            id={item.id}
            className="flex flex-col gap-2 rounded-md pb-8 outline-none focus-visible:outline-2 focus-visible:outline-focus"
          >
            <p className={item.depth ? 'text-ui font-semibold text-fg' : 'text-ui-lg font-semibold tracking-tight text-fg'}>
              {item.label}
            </p>
            {Array.from({ length: i % 3 === 0 ? 2 : 1 }, (_, p) => (
              <p key={p} className="text-ui leading-relaxed text-fg-muted">
                Components compose from Base UI primitives and move through motion tokens, so Speed and reduced motion reach
                everything: overlays, indicators and the height of a list.
              </p>
            ))}
          </section>
        ))}
        <div className="h-40" />
      </div>
      <div className="border-s border-line p-4 max-sm:hidden">
        <AnchorNav items={ITEMS} scrollContainer={scroller} />
      </div>
    </div>
  )
}
