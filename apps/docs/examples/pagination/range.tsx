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

function Pager({ label, pageCount, initial, siblings }: { label: string; pageCount: number; initial: number; siblings?: number }) {
  const [page, setPage] = useState(initial)
  const go = (next: number) => (event: MouseEvent) => {
    event.preventDefault()
    setPage(Math.min(Math.max(next, 1), pageCount))
  }
  return (
    <Pagination aria-label={label}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href={`?page=${page - 1}`} disabled={page === 1} onClick={go(page - 1)} />
        </PaginationItem>
        {/* Once pages are skipped, always the same number of slots: the control keeps its width while you page. */}
        {paginationRange(page, pageCount, siblings).map((item) =>
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
          <PaginationNext href={`?page=${page + 1}`} disabled={page === pageCount} onClick={go(page + 1)} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

export default function PaginationRange() {
  return (
    <div className="flex flex-col gap-6">
      {/* Few pages: every page shows. */}
      <Pager label="Release pages" pageCount={5} initial={2} />
      {/* Many: the first and last stay around the current page. No siblings beside it (the default is one each side), so it fits a phone. */}
      <Pager label="Invoice pages" pageCount={240} initial={120} siblings={0} />
    </div>
  )
}
