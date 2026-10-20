'use client'

import { useState } from 'react'
import { ArrowUpIcon } from '@youj/icons'

const DEPLOYS = [
  { id: 'dpl_8f2k', branch: 'main', minutes: 4 },
  { id: 'dpl_7h1c', branch: 'feat/pricing', minutes: 38 },
  { id: 'dpl_6a9x', branch: 'fix/og-image', minutes: 125 },
  { id: 'dpl_5b0q', branch: 'chore/deps', minutes: 1440 },
]

const ago = (m: number) => (m < 60 ? `${m}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`)

export default function IconsSort() {
  // The arrow is a state icon: up ↔ down. It follows the sort, it doesn't decide it.
  const [newestFirst, setNewestFirst] = useState(true)
  const rows = [...DEPLOYS].sort((a, b) => (newestFirst ? a.minutes - b.minutes : b.minutes - a.minutes))

  return (
    <table className="w-full max-w-md border-separate border-spacing-0 overflow-hidden rounded-xl border border-line bg-surface text-sm">
      <thead>
        <tr className="text-start text-xs text-fg-muted">
          <th scope="col" className="border-b border-line px-4 py-2.5 text-start font-medium">
            Deployment
          </th>
          <th scope="col" aria-sort={newestFirst ? 'descending' : 'ascending'} className="border-b border-line px-2 py-1.5 text-end font-medium">
            <button
              type="button"
              onClick={() => setNewestFirst(!newestFirst)}
              className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-fg-muted transition-colors duration-(--yj-duration-fast) ease-standard hover:bg-raised hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              Updated
              {/* Newest first reads as "down": the arrow folds to point down. */}
              <ArrowUpIcon active={newestFirst} size={14} strokeWidth={2} />
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((d) => (
          <tr key={d.id}>
            <td className="border-b border-line px-4 py-2.5 [tr:last-child>&]:border-b-0">
              <span className="font-medium text-fg">{d.branch}</span>
              <span className="ms-2 font-mono text-xs text-fg-muted">{d.id}</span>
            </td>
            <td className="border-b border-line px-4 py-2.5 text-end text-fg-muted tabular-nums [tr:last-child>&]:border-b-0">{ago(d.minutes)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
