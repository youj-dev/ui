'use client'

import { useId, useRef } from 'react'
import { ArrowRightIcon } from '@youj/icons'
import { CursorFollower } from '@youj/motion/interactions'

const WORK = [
  { slug: 'northwind', title: 'Northwind', kind: 'Brand system', tone: 'bg-[radial-gradient(120%_90%_at_20%_10%,color-mix(in_oklch,var(--color-accent)_45%,transparent),transparent_65%)]' },
  { slug: 'halcyon', title: 'Halcyon', kind: 'Product site', tone: 'bg-[radial-gradient(120%_90%_at_80%_90%,color-mix(in_oklch,var(--color-accent)_40%,transparent),transparent_60%)]' },
  { slug: 'parallel', title: 'Parallel', kind: 'iOS app', tone: 'bg-[linear-gradient(135deg,var(--color-raised)_30%,color-mix(in_oklch,var(--color-accent)_35%,var(--color-raised)))]' },
]

export default function CursorFollowerScope() {
  const id = useId()
  const gallery = useRef<HTMLDivElement>(null)

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      {/* The follower owns the gallery and hides the native cursor there. The form below is outside its scope. */}
      <div ref={gallery} className="rounded-2xl border border-line bg-surface p-4">
        <CursorFollower scope={gallery} hideNativeCursor />
        <p className="text-sm font-medium text-fg">Selected work</p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {WORK.map((w) => (
            <a key={w.slug} href={`#${w.slug}`} data-cursor="media" className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent">
              <span className={`block aspect-[4/3] rounded-lg border border-line bg-raised ${w.tone}`} />
              <span className="mt-2 block truncate text-xs font-medium text-fg">{w.title}</span>
              <span className="block truncate text-xs text-fg-muted">{w.kind}</span>
            </a>
          ))}
        </div>
      </div>
      <form onSubmit={(e) => e.preventDefault()} className="rounded-2xl border border-line bg-surface p-4">
        <p className="text-sm font-medium text-fg">Start a project</p>
        <p className="mt-0.5 text-xs text-fg-muted">Leave your email and we’ll write back within two days.</p>
        <div className="mt-3 flex gap-2">
          <label htmlFor={id} className="sr-only">
            Email
          </label>
          <input
            id={id}
            type="email"
            placeholder="you@company.com"
            className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-canvas px-3 text-sm text-fg outline-none placeholder:text-fg-muted focus-visible:ring-2 focus-visible:ring-accent"
          />
          <button
            type="submit"
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg bg-fg px-4 text-sm font-medium text-canvas outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Send
            <ArrowRightIcon size={15} />
          </button>
        </div>
      </form>
    </div>
  )
}
