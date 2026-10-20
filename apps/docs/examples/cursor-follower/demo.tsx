'use client'

import { useRef } from 'react'
import { ArrowRightIcon } from '@youj/icons'
import { CursorFollower } from '@youj/motion/interactions'

const NAV = ['Work', 'Process', 'Journal']
const WORK = [
  { slug: 'northwind', title: 'Northwind', kind: 'Brand system', tone: 'bg-[radial-gradient(120%_90%_at_20%_10%,color-mix(in_oklch,var(--color-accent)_45%,transparent),transparent_65%)]' },
  { slug: 'halcyon', title: 'Halcyon', kind: 'Product site', tone: 'bg-[radial-gradient(120%_90%_at_80%_90%,color-mix(in_oklch,var(--color-accent)_40%,transparent),transparent_60%)]' },
  { slug: 'parallel', title: 'Parallel', kind: 'iOS app', tone: 'bg-[linear-gradient(135deg,var(--color-raised)_30%,color-mix(in_oklch,var(--color-accent)_35%,var(--color-raised)))]' },
]

export default function CursorFollowerDemo() {
  const scope = useRef<HTMLDivElement>(null)

  return (
    // The follower only draws while the pointer is inside `scope`. Targets opt in with data-cursor.
    <div ref={scope} className="@container w-full max-w-2xl">
      <CursorFollower scope={scope} />
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-medium text-fg">field/studio</span>
        <nav aria-label="Studio" className="flex items-center gap-5 text-sm text-fg-muted">
          {NAV.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              data-cursor="link"
              data-cursor-label={`See ${item.toLowerCase()}`}
              className="rounded-sm outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-accent"
            >
              {item}
            </a>
          ))}
        </nav>
      </div>
      <p data-cursor="text" className="mt-8 max-w-[18ch] text-3xl leading-tight font-semibold tracking-tight text-fg">
        We design software that feels inevitable.
      </p>
      <p data-cursor="text" className="mt-3 max-w-[48ch] text-sm leading-6 text-fg-muted">
        An independent studio for interface, motion and brand, from the first sketch to the last easing curve.
      </p>
      <button
        type="button"
        data-cursor="button"
        className="mt-5 inline-flex h-9 items-center gap-2 rounded-full bg-fg px-4 text-sm font-medium text-canvas outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
      >
        Start a project
        <ArrowRightIcon size={15} />
      </button>
      <div className="mt-8 grid grid-cols-3 gap-3">
        {WORK.map((w) => (
          <a key={w.slug} href={`#${w.slug}`} data-cursor="media" className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <span className={`block aspect-[4/3] rounded-xl border border-line bg-raised ${w.tone}`} />
            <span className="mt-2 flex items-baseline justify-between gap-2 text-sm">
              <span className="font-medium text-fg">{w.title}</span>
              <span className="truncate text-xs text-fg-muted max-sm:hidden">{w.kind}</span>
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}
