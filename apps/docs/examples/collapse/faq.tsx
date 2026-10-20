'use client'

import { useId, useState } from 'react'
import { Collapse } from '@youj/motion'
import { ChevronDownIcon } from '@youj/icons'

const FAQ = [
  { q: 'What counts as a seat?', a: 'Anyone who can sign in to the team. Guests with view-only links are free.' },
  {
    q: 'Can I change plans mid-cycle?',
    a: 'Yes. Upgrades are prorated to the day and apply at once. Downgrades take effect at the end of the billing period, so nobody loses access they paid for.',
  },
  { q: 'Do previews count toward usage?', a: 'Preview builds share your plan’s build minutes. Bandwidth for previews is free.' },
]

export default function CollapseFaq() {
  const id = useId()
  const [open, setOpen] = useState<number | null>(1)

  return (
    <div className="flex min-h-[250px] w-full max-w-lg flex-col">
      <div className="w-full max-w-lg divide-y divide-line rounded-xl border border-line bg-surface">
        {FAQ.map(({ q, a }, i) => (
          <div key={q}>
            <button
              type="button"
              id={`${id}-q${i}`}
              aria-expanded={open === i}
              aria-controls={`${id}-a${i}`}
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between gap-4 rounded-xl px-4 py-3 text-start text-sm font-medium text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
            >
              {q}
              <span className={`inline-flex shrink-0 text-fg-muted transition-transform yj-duration-base ease-standard ${open === i ? 'rotate-180' : ''}`}>
                <ChevronDownIcon size={16} trigger="none" />
              </span>
            </button>
            {/* One panel closes while the next opens, on the same curve, so the two moves read as one. */}
            <Collapse id={`${id}-a${i}`} role="region" aria-labelledby={`${id}-q${i}`} open={open === i}>
              <p className="px-4 pb-4 text-sm leading-6 text-fg-muted">{a}</p>
            </Collapse>
          </div>
        ))}
      </div>
    </div>
  )
}
