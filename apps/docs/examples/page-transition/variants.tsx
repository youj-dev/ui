'use client'

import { useId, useState, type KeyboardEvent } from 'react'
import { cn } from '@youj/core'
import { PageTransition, type PageDirection, type PageVariant } from '@youj/motion/interactions'

const VARIANTS: PageVariant[] = ['fade-through', 'slide', 'clip-reveal', 'curtain']
const TABS = [
  { name: 'Overview', rows: [0.9, 0.62, 0.78] },
  { name: 'Activity', rows: [0.55, 0.85, 0.4, 0.7] },
  { name: 'Settings', rows: [0.72, 0.5] },
]

/** Arrow keys, Home and End move the selection within a radio group or tab list, and focus follows. */
function roving(e: KeyboardEvent<HTMLElement>, index: number, count: number, select: (i: number) => void) {
  const keys: Record<string, number> = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: count - 1 }
  const next = keys[e.key]
  if (next === undefined) return
  e.preventDefault()
  const i = (next + count) % count
  select(i)
  ;(e.currentTarget.parentElement?.children[i] as HTMLElement | undefined)?.focus()
}

export default function PageTransitionVariants() {
  const id = useId()
  const [variant, setVariant] = useState<PageVariant>('slide')
  const [tab, setTab] = useState(0)
  const [direction, setDirection] = useState<PageDirection>('forward')
  const selectTab = (i: number) => {
    // Tabs to the right go forward and tabs to the left go back, so a slide travels the right way.
    setDirection(i >= tab ? 'forward' : 'back')
    setTab(i)
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4">
      <div role="radiogroup" aria-label="Transition" className="flex flex-wrap justify-center gap-1 rounded-lg border border-line bg-canvas p-0.5">
        {VARIANTS.map((v, i) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={variant === v}
            tabIndex={variant === v ? 0 : -1}
            onClick={() => setVariant(v)}
            onKeyDown={(e) => roving(e, i, VARIANTS.length, (n) => setVariant(VARIANTS[n]!))}
            className={cn(
              'rounded-md px-2.5 py-1 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-accent',
              variant === v ? 'bg-surface text-fg shadow-xs' : 'text-fg-muted hover:text-fg',
            )}
          >
            {v}
          </button>
        ))}
      </div>
      <div className="w-full overflow-hidden rounded-2xl border border-line bg-surface">
        <div role="tablist" aria-label="Project" className="flex gap-1 border-b border-line p-1.5">
          {TABS.map((t, i) => (
            <button
              key={t.name}
              id={`${id}-tab-${i}`}
              type="button"
              role="tab"
              aria-selected={tab === i}
              aria-controls={`${id}-panel`}
              tabIndex={tab === i ? 0 : -1}
              onClick={() => selectTab(i)}
              onKeyDown={(e) => roving(e, i, TABS.length, selectTab)}
              className="rounded-md px-3 py-1.5 text-sm text-fg-muted outline-none aria-selected:bg-raised aria-selected:text-fg focus-visible:ring-2 focus-visible:ring-accent"
            >
              {t.name}
            </button>
          ))}
        </div>
        {/* Keyed by variant, so switching variants starts clean. */}
        <PageTransition key={variant} routeKey={TABS[tab]!.name} variant={variant} direction={direction} className="h-44">
          <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${tab}`} className="h-full bg-surface p-5">
            <p className="text-sm font-medium text-fg">{TABS[tab]!.name}</p>
            <div className="mt-4 space-y-2.5">
              {TABS[tab]!.rows.map((w, i) => (
                <div key={i} className="h-2 rounded-full bg-raised" style={{ width: `${w * 100}%` }} />
              ))}
            </div>
          </div>
        </PageTransition>
      </div>
    </div>
  )
}
