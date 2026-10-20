'use client'

import { useState, type MouseEvent } from 'react'
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@youj/react'

const PER_PAGE = 3
const RELEASES = [
  { version: '2.4.0', title: 'Faster cold starts for Functions', date: 'Sep 24' },
  { version: '2.3.2', title: 'Preview comments on renamed branches', date: 'Sep 17' },
  { version: '2.3.1', title: 'Spend limits per project', date: 'Sep 10' },
  { version: '2.3.0', title: 'Instant rollback from the CLI', date: 'Sep 3' },
  { version: '2.2.4', title: 'A region picker for storage', date: 'Aug 27' },
  { version: '2.2.3', title: 'Audit log export as CSV', date: 'Aug 20' },
  { version: '2.2.2', title: 'Custom domains on preview deployments', date: 'Aug 13' },
  { version: '2.2.1', title: 'Two-factor sign-in on every plan', date: 'Aug 6' },
  { version: '2.2.0', title: 'A build cache shared across branches', date: 'Jul 30' },
  { version: '2.1.2', title: 'Webhooks retry with backoff', date: 'Jul 23' },
  { version: '2.1.1', title: 'Search logs by request ID', date: 'Jul 16' },
  { version: '2.1.0', title: 'Environment variables per branch', date: 'Jul 9' },
]
const PAGES = Math.ceil(RELEASES.length / PER_PAGE)

export default function PaginationCompact() {
  const [page, setPage] = useState(2)
  const go = (next: number) => (event: MouseEvent) => {
    event.preventDefault()
    setPage(Math.min(Math.max(next, 1), PAGES))
  }

  return (
    <div className="w-full max-w-md overflow-hidden rounded-xl border border-line bg-surface">
      <ul className="divide-y divide-line">
        {RELEASES.slice((page - 1) * PER_PAGE, page * PER_PAGE).map((release) => (
          <li key={release.version} className="flex items-baseline gap-3 px-4 py-2.5 text-ui">
            <span className="w-11 shrink-0 font-mono text-ui-sm text-fg-muted">{release.version}</span>
            <span className="min-w-0 flex-1 truncate text-fg">{release.title}</span>
            <span className="shrink-0 text-ui-sm text-fg-muted tabular-nums">{release.date}</span>
          </li>
        ))}
      </ul>
      <Pagination aria-label="Changelog pages" className="border-t border-line px-2 py-1.5">
        <PaginationContent className="w-full justify-between">
          <PaginationItem>
            {/* A relabeled edge gets a name that starts with its visible text. */}
            <PaginationPrevious href={`?page=${page - 1}`} text="Newer" aria-label="Newer releases" disabled={page === 1} onClick={go(page - 1)} />
          </PaginationItem>
          {/* Paging in place: the new position is announced. */}
          <PaginationItem aria-live="polite" className="text-ui-sm text-fg-muted tabular-nums">
            Page {page} of {PAGES}
          </PaginationItem>
          <PaginationItem>
            <PaginationNext href={`?page=${page + 1}`} text="Older" aria-label="Older releases" disabled={page === PAGES} onClick={go(page + 1)} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
