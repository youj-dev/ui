'use client'

import { useEffect, useState } from 'react'
import { ContentSwap } from '@youj/motion'
import { RefreshIcon } from '@youj/icons'
import { Skeleton } from '@youj/react'

const INVOICES = [
  { client: 'Acme Corp', detail: 'INV-2041 · Due Oct 12', amount: '$4,200.00', initials: 'AC' },
  { client: 'Globex', detail: 'INV-2040 · Paid Sep 28', amount: '$1,180.00', initials: 'GL' },
  { client: 'Initech', detail: 'INV-2039 · Paid Sep 21', amount: '$860.00', initials: 'IN' },
  { client: 'Umbrella', detail: 'INV-2038 · Overdue 4 days', amount: '$2,975.50', initials: 'UM' },
]

// Shaped like the rows it stands in for, so the swap reads as the same list resolving.
function InvoicesSkeleton() {
  return (
    <div className="flex flex-col gap-3.5 p-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-3 w-14" />
        </div>
      ))}
    </div>
  )
}

export default function ContentSwapDemo() {
  const [loading, setLoading] = useState(true)
  const [run, setRun] = useState(0)

  // Stands in for a fetch: every run shows the skeleton, then the data.
  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 1200)
    return () => clearTimeout(t)
  }, [run])

  return (
    <div className="flex min-h-[250px] w-full max-w-md flex-col">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
          <p className="text-sm font-medium text-fg">Recent invoices</p>
          <button
            type="button"
            onClick={() => setRun((r) => r + 1)}
            className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-fg-muted outline-none transition-colors yj-duration-fast ease-standard hover:bg-raised hover:text-fg focus-visible:ring-2 focus-visible:ring-accent"
          >
            <RefreshIcon size={13} />
            Refetch
          </button>
        </div>
        <ContentSwap loading={loading} fallback={<InvoicesSkeleton />} loadingLabel="Loading invoices">
          <ul className="flex flex-col gap-3.5 p-4">
            {INVOICES.map(({ client, detail, amount, initials }) => (
              <li key={client} className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-full bg-raised text-[11px] font-medium text-fg-muted">{initials}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-fg">{client}</p>
                  <p className="text-xs text-fg-muted">{detail}</p>
                </div>
                <span className="font-mono text-sm text-fg tabular-nums">{amount}</span>
              </li>
            ))}
          </ul>
        </ContentSwap>
      </div>
    </div>
  )
}
