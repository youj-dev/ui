'use client'

import { useEffect, useState } from 'react'
import { ContentSwap } from '@youj/motion'
import { Skeleton } from '@youj/react'

type Filter = 'All' | 'Paid' | 'Overdue'

const INVOICES = [
  { id: 'INV-2041', client: 'Acme Corp', amount: '$4,200.00', status: 'Open' },
  { id: 'INV-2040', client: 'Globex', amount: '$1,180.00', status: 'Paid' },
  { id: 'INV-2039', client: 'Initech', amount: '$860.00', status: 'Paid' },
  { id: 'INV-2038', client: 'Umbrella', amount: '$2,975.50', status: 'Overdue' },
  { id: 'INV-2037', client: 'Soylent', amount: '$640.00', status: 'Paid' },
]

export default function ContentSwapFilters() {
  const [filter, setFilter] = useState<Filter>('All')
  const [loading, setLoading] = useState(false)
  const rows = INVOICES.filter((i) => filter === 'All' || i.status === filter)

  // Each filter refetches: the skeleton comes back, then the new rows resolve in.
  useEffect(() => {
    if (!loading) return
    const t = setTimeout(() => setLoading(false), 900)
    return () => clearTimeout(t)
  }, [loading])

  return (
    <div className="flex min-h-[260px] w-full max-w-md flex-col">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-line bg-surface">
        <div role="group" aria-label="Filter invoices" className="flex gap-1 border-b border-line p-2">
          {(['All', 'Paid', 'Overdue'] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={filter === option}
              onClick={() => {
                if (option === filter) return
                setFilter(option)
                setLoading(true)
              }}
              className="h-7 rounded-md px-2.5 text-xs font-medium text-fg-muted outline-none transition-colors yj-duration-fast ease-standard hover:text-fg focus-visible:ring-2 focus-visible:ring-accent aria-pressed:bg-raised aria-pressed:text-fg"
            >
              {option}
            </button>
          ))}
        </div>
        {/* The box morphs between the skeleton's height and each result's, so the page below moves with it. */}
        <ContentSwap loading={loading} loadingLabel={`Loading ${filter.toLowerCase()} invoices`} fallback={<RowsSkeleton />}>
          <ul className="divide-y divide-line">
            {rows.map(({ id, client, amount, status }) => (
              <li key={id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="w-20 font-mono text-xs text-fg-muted">{id}</span>
                <span className="min-w-0 flex-1 truncate text-fg">{client}</span>
                <span className={`text-xs ${status === 'Overdue' ? 'text-danger' : 'text-fg-muted'}`}>{status}</span>
                <span className="w-20 text-end font-mono text-fg tabular-nums">{amount}</span>
              </li>
            ))}
          </ul>
        </ContentSwap>
      </div>
    </div>
  )
}

function RowsSkeleton() {
  return (
    <div className="divide-y divide-line">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  )
}
