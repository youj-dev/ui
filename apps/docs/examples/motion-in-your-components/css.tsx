'use client'

import { useYouj } from '@youj/core'
import { ChevronRightIcon, GitBranchIcon } from '@youj/icons'

const DEPLOYMENTS = [
  { branch: 'main', commit: 'Tighten cache headers', age: '2m ago', status: 'Ready' },
  { branch: 'feat/pricing', commit: 'New pricing page', age: '18m ago', status: 'Ready' },
  { branch: 'fix/og-images', commit: 'OG images for blog posts', age: '1h ago', status: 'Canceled' },
]

export default function CssTransitions() {
  const k = useYouj()

  return (
    // data-reduced-motion lets the `reduced:` variant follow the provider, not just the OS.
    <ul data-reduced-motion={k.reduced || undefined} className="w-full max-w-md divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
      {DEPLOYMENTS.map((d) => (
        <li key={d.branch}>
          <button
            type="button"
            className="group flex w-full items-center gap-3 px-4 py-3 text-start transition-[background-color,scale] yj-duration-fast ease-standard hover:bg-raised focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none focus-visible:ring-inset active:scale-[0.99] active:yj-duration-instant reduced:active:scale-100"
          >
            <GitBranchIcon size={16} className="text-fg-muted" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-fg">{d.commit}</span>
              <span className="block text-xs text-fg-muted">
                {d.branch} · {d.age}
              </span>
            </span>
            <span className="text-xs text-fg-muted">{d.status}</span>
            {/* A CSS nudge toward where the row leads, in the reading direction. trigger="none" keeps
                the icon's own choreography out of it. */}
            <ChevronRightIcon
              size={16}
              trigger="none"
              className="text-fg-muted transition-transform yj-duration-fast ease-standard group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
            />
          </button>
        </li>
      ))}
    </ul>
  )
}
