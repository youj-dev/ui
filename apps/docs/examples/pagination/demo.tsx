'use client'

import { useState, type MouseEvent } from 'react'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  paginationRange,
} from '@youj/react'

const PER_PAGE = 5
const TOTAL = 320
const PAGES = Math.ceil(TOTAL / PER_PAGE)
const ACTORS = ['Ada Lovelace', 'Grace Hopper', 'Priya Raman', 'Kenji Sato', 'Sara Okafor']
const ACTIONS = ['deployed', 'rolled back', 'renamed', 'rotated a token for', 'changed the domain of']
const PROJECTS = ['web', 'docs', 'api-gateway', 'billing', 'status-page']

// A page of the audit log, derived from its number so every page is stable.
function events(page: number) {
  return Array.from({ length: PER_PAGE }, (_, j) => {
    const i = (page - 1) * PER_PAGE + j
    return { id: i, actor: ACTORS[(i * 7) % 5]!, action: ACTIONS[(i * 3) % 5]!, project: PROJECTS[(i * 2 + 1) % 5]!, age: `${page + j}h` }
  })
}

export default function PaginationDemo() {
  const [page, setPage] = useState(3)
  // Real hrefs keep the pages linkable. On click, page in place instead.
  const go = (next: number) => (event: MouseEvent) => {
    event.preventDefault()
    setPage(Math.min(Math.max(next, 1), PAGES))
  }
  const first = (page - 1) * PER_PAGE + 1

  return (
    <div className="@container w-full max-w-2xl overflow-hidden rounded-xl border border-line bg-surface">
      <ul className="divide-y divide-line">
        {events(page).map((event) => (
          <li key={event.id} className="flex items-center gap-3 px-4 py-2.5 text-ui">
            <span className="min-w-0 flex-1 truncate text-fg-muted">
              <span className="font-medium text-fg">{event.actor}</span> {event.action}{' '}
              <span className="font-mono text-ui-sm text-fg">{event.project}</span>
            </span>
            <span className="text-ui-sm text-fg-muted tabular-nums">{event.age}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-col items-center gap-2 border-t border-line px-4 py-2.5 @lg:flex-row @lg:justify-between">
        <p className="shrink-0 text-ui-sm text-fg-muted tabular-nums">
          Showing {first}–{first + PER_PAGE - 1} of {TOTAL}
        </p>
        <Pagination aria-label="Audit log pages" className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href={`?page=${page - 1}`} disabled={page === 1} onClick={go(page - 1)} />
            </PaginationItem>
            {paginationRange(page, PAGES).map((item) =>
              typeof item === 'number' ? (
                <PaginationItem key={item}>
                  <PaginationLink href={`?page=${item}`} isActive={item === page} aria-label={`Page ${item}`} onClick={go(item)}>
                    {item}
                  </PaginationLink>
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationEllipsis />
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <PaginationNext href={`?page=${page + 1}`} disabled={page === PAGES} onClick={go(page + 1)} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
