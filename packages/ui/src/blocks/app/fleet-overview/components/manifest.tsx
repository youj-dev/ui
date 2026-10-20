'use client'

import { useMemo, useState } from 'react'
import { PresenceItem, PresenceList } from '@youj/motion'
import { Badge } from '../../../../components/ui/badge'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  paginationRange,
} from '../../../../components/ui/pagination'
import { manifest } from '../data'
import type { Tracked } from '../model'

const PER_PAGE = 6

export function Manifest({ ship }: { ship: Tracked }) {
  const containers = useMemo(() => manifest(ship), [ship])
  const [page, setPage] = useState(1)
  const pages = Math.ceil(containers.length / PER_PAGE)
  const rows = containers.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const go = (next: number) => (event: { preventDefault: () => void }) => {
    event.preventDefault()
    setPage(Math.min(Math.max(next, 1), pages))
  }
  return (
    <div className="flex flex-col gap-3">
      {/* Keyed by page: a new page is one swap, not six exits and six entries. */}
      <PresenceList key={page} aria-label={`Containers, page ${page} of ${pages}`} className="flex flex-col divide-y divide-line rounded-lg border border-line">
        {rows.map((c) => (
          <PresenceItem key={c.id} className="flex items-center gap-3 px-3 py-2">
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="font-mono text-[11.5px] tracking-wide text-fg">{c.id}</span>
              <span className="truncate text-ui-sm text-fg-muted">
                {c.size} · {c.cargo}
              </span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-0.5">
              <span className="text-ui-sm text-fg tabular-nums">{c.weight.toFixed(1)} t</span>
              {c.hold ? <Badge variant="warning">{c.state}</Badge> : <span className="text-ui-xs text-fg-muted">{c.state}</span>}
            </span>
          </PresenceItem>
        ))}
      </PresenceList>
      <div className="flex items-center justify-between gap-2">
        <span className="text-ui-sm text-fg-muted tabular-nums">
          {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, containers.length)} of {containers.length}
        </span>
        <Pagination aria-label="Manifest pages" className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href={`#page-${page - 1}`} disabled={page === 1} onClick={go(page - 1)} className="[&>span]:sr-only" />
            </PaginationItem>
            {paginationRange(page, pages, 0).map((item) =>
              typeof item === 'number' ? (
                <PaginationItem key={item}>
                  <PaginationLink href={`#page-${item}`} isActive={item === page} aria-label={`Page ${item}`} onClick={go(item)}>
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
              <PaginationNext href={`#page-${page + 1}`} disabled={page === pages} onClick={go(page + 1)} className="[&>span]:sr-only" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
