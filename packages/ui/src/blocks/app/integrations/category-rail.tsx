'use client'

import { SlidingIndicator } from '@youj/motion'
import type { Category } from './data'

function CategoryRail({
  value,
  onChange,
  counts,
  across = false,
  categories,
  label,
  allLabel,
}: {
  value: Category | 'All'
  onChange: (next: Category | 'All') => void
  counts: Record<string, number>
  /** Always a row that scrolls across (embedded), not a column from lg up. */
  across?: boolean
  categories: Category[]
  label: string
  allLabel: string
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={across ? 'relative isolate flex gap-0.5 overflow-x-auto pb-1' : 'relative isolate flex gap-0.5 overflow-x-auto max-lg:pb-1 max-md:-mx-4 max-md:px-4 lg:flex-col'}
    >
      {['All', ...categories].map((c) => (
        <button
          key={c}
          type="button"
          aria-pressed={value === c}
          onClick={() => onChange(c)}
          className="focus-ring flex h-control shrink-0 items-center gap-3 rounded-md px-3 text-ui text-fg-muted transition-colors yj-duration-fast ease-standard hover:text-fg aria-pressed:font-medium aria-pressed:text-fg"
        >
          <span className="truncate">{c === 'All' ? allLabel : c}</span>
          <span className="ms-auto text-ui-xs tabular-nums text-fg-muted">{counts[c] ?? 0}</span>
        </button>
      ))}
      <SlidingIndicator className="rounded-md bg-hover" />
    </div>
  )
}

export { CategoryRail }
