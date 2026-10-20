'use client'

import { useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { Reveal } from '@youj/motion'

export default function RevealPresence() {
  const [open, setOpen] = useState(true)

  return (
    <div className="flex h-52 w-full max-w-sm flex-col items-center justify-between">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg bg-fg px-4 py-2 text-sm font-medium text-canvas focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none"
      >
        {open ? 'Dismiss' : 'Deploy'}
      </button>
      <AnimatePresence>
        {open && (
          <Reveal key="toast" variant="rise" inView={false} role="status" className="flex w-full items-start gap-3 rounded-xl border border-line bg-surface p-4 shadow-sm">
            <span className="mt-1.5 size-2 shrink-0 rounded-[2px] bg-success" />
            <div>
              <p className="text-sm font-medium text-fg">Deployed to production</p>
              <p className="mt-0.5 text-xs text-fg-muted">youj-web · 4f2a91c · 38s</p>
            </div>
          </Reveal>
        )}
      </AnimatePresence>
    </div>
  )
}
