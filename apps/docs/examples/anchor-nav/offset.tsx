'use client'

import { useRef } from 'react'
import { AnchorNav, type AnchorNavItem } from '@youj/react'

const ITEMS: AnchorNavItem[] = [
  { id: 'release-highlights', label: 'Highlights' },
  { id: 'release-breaking', label: 'Breaking changes' },
  { id: 'release-fixes', label: 'Fixes' },
  { id: 'release-upgrade', label: 'Upgrading' },
]

/** The sticky bar's height: a chosen section lands just below it, and the reading line starts there. */
const HEADER = 48

export default function AnchorNavOffset() {
  const scroller = useRef<HTMLDivElement>(null)

  return (
    <div className="grid w-full max-w-2xl grid-cols-[minmax(0,1fr)_10.5rem] overflow-hidden rounded-xl border border-line bg-canvas shadow-xs max-sm:grid-cols-1">
      <div ref={scroller} className="relative h-[20rem] overflow-y-auto">
        <div
          className="sticky top-0 z-10 flex items-center border-b border-line bg-canvas/85 youj-allow-glass px-5 text-ui font-medium text-fg [backdrop-filter:blur(12px)]"
          style={{ height: HEADER }}
        >
          Release notes · 2.4
        </div>
        <div className="px-5 pt-4">
          {ITEMS.map((item) => (
            <section key={item.id} id={item.id} className="flex flex-col gap-2 rounded-md pb-10 outline-none focus-visible:outline-2 focus-visible:outline-focus">
              <p className="text-ui-lg font-semibold tracking-tight text-fg">{item.label}</p>
              <p className="text-ui leading-relaxed text-fg-muted">
                Choose a link: the section lands under the bar instead of behind it, because the offset keeps that much room
                above it.
              </p>
            </section>
          ))}
          <div className="h-48" />
        </div>
      </div>
      <div className="border-s border-line p-4 max-sm:hidden">
        <AnchorNav items={ITEMS} title="Contents" scrollContainer={scroller} offset={HEADER + 16} />
      </div>
    </div>
  )
}
