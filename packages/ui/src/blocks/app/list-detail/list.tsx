'use client'

import { useId, useLayoutEffect, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { ChevronUpIcon, SearchIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../../components/ui/input-group'
import { Kbd, KbdGroup } from '../../../components/ui/kbd'
import { ScrollArea } from '../../../components/ui/scroll-area'
import { Skeleton } from '../../../components/ui/skeleton'
import { SegmentedControl, SegmentedControlItem } from '../../../components/ui/segmented-control'
import { SortableList, SortableListHandle, SortableListItem } from '../../../components/ui/sortable-list'
import { cn } from '../../../lib/utils'
import { daysBetween, type FeatureRequest, type ListDetailCopy, type SortBy, type Status } from './data'

// Hollow: not started. Filled: moving or settled.
const dot: Record<Status, string> = {
  review: 'border-[1.5px] border-line-strong',
  planned: 'border-[1.5px] border-accent',
  building: 'bg-accent',
  shipped: 'bg-success',
  declined: 'bg-fg-subtle',
}

interface RequestListProps {
  requests: FeatureRequest[]
  selectedId: string | null
  sort: SortBy
  query: string
  /** Rows can be dragged (and moved with Alt+arrows): priority order, no search. */
  sortable: boolean
  onSort: (sort: SortBy) => void
  onQuery: (query: string) => void
  onOrder: (ids: string[]) => void
  /** Alt+↑/↓: one step up or down the priority order. */
  onNudge: (id: string, step: -1 | 1) => void
  onSelect: (id: string) => void
  /** Enter (or a tap on a phone): open it. */
  onOpen: (id: string) => void
  /** `true` when a tap should open, not only select (the detail is in a drawer). */
  tapOpens: boolean
  copy: ListDetailCopy
  now: number
  /** Skeleton rows in place of the list. */
  loading: boolean
  /** No requests at all (not a search with no match). */
  empty: boolean
  /** Replaces the empty state. */
  emptySlot?: ReactNode
  /** Replaces the list with an error panel. */
  error?: ReactNode
  onRetry?: () => void
}

/** The list pane: search and sort on top, the requests in a scroll area, the keys at the foot. */
export function RequestList({ requests, selectedId, sort, query, sortable, onSort, onQuery, onOrder, onNudge, onSelect, onOpen, tapOpens, copy, now, loading, empty, emptySlot, error, onRetry }: RequestListProps) {
  const hintId = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const refocus = useRef<string | null>(null)
  const ids = requests.map((r) => r.id)
  const stop = selectedId && ids.includes(selectedId) ? selectedId : ids[0]

  const focusRow = (id: string) => {
    refocus.current = id
    listRef.current?.querySelector<HTMLElement>(`[data-request="${CSS.escape(id)}"]`)?.focus()
  }
  // A row moved in the DOM (a nudge, a new sort) can drop focus; put it back.
  useLayoutEffect(() => {
    const id = refocus.current
    if (!id) return
    refocus.current = null
    const el = listRef.current?.querySelector<HTMLElement>(`[data-request="${CSS.escape(id)}"]`)
    if (el && document.activeElement !== el) el.focus()
  })

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, id: string) => {
    const i = ids.indexOf(id)
    const key = event.key
    if ((key === 'ArrowUp' || key === 'ArrowDown') && event.altKey) {
      if (!sortable) return
      event.preventDefault()
      refocus.current = id
      onNudge(id, key === 'ArrowUp' ? -1 : 1)
      return
    }
    const to = key === 'ArrowUp' ? ids[i - 1] : key === 'ArrowDown' ? ids[i + 1] : key === 'Home' ? ids[0] : key === 'End' ? ids[ids.length - 1] : undefined
    if (to !== undefined) {
      event.preventDefault()
      onSelect(to)
      focusRow(to)
    } else if (key === 'Enter') {
      event.preventDefault()
      onOpen(id)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-col gap-2.5 border-b border-line p-3">
        <InputGroup>
          <InputGroupAddon>
            <SearchIcon size={16} />
          </InputGroupAddon>
          <InputGroupInput type="search" aria-label={copy.search} placeholder={copy.search} value={query} onChange={(event) => onQuery(event.target.value)} />
        </InputGroup>
        <SegmentedControl aria-label={copy.sortBy} value={sort} onValueChange={(next) => onSort(next as SortBy)} className="w-full">
          {Object.entries(copy.sorts).map(([value, label]) => (
            <SegmentedControlItem key={value} value={value} className="flex-1">
              {label}
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      </div>

      <ScrollArea className="min-h-0 flex-1" viewportClassName="p-1.5">
        <div ref={listRef}>
          {error ? (
            <div role="alert" className="flex flex-col items-center gap-2 px-4 py-12 text-center">
              <p className="text-ui font-medium text-fg">{copy.errorTitle}</p>
              {typeof error === 'string' ? <p className="text-ui-sm text-fg-muted">{error}</p> : error === true ? null : error}
              {onRetry && (
                <Button variant="outline" size="sm" onClick={onRetry}>
                  {copy.retry}
                </Button>
              )}
            </div>
          ) : loading ? (
            <div role="status" aria-label={copy.loading} className="flex flex-col gap-1 p-1.5">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="flex flex-col gap-1.5 px-1.5 py-2">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : empty ? (
            (emptySlot ?? (
              <div className="flex flex-col items-center gap-1 px-4 py-12 text-center">
                <p className="text-ui font-medium text-fg">{copy.emptyTitle}</p>
                <p className="text-ui-sm text-fg-muted">{copy.emptyDescription}</p>
              </div>
            ))
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
              <p className="text-ui text-fg">{copy.noMatch(query)}</p>
              <Button variant="ghost" size="sm" onClick={() => onQuery('')}>
                {copy.clearSearch}
              </Button>
            </div>
          ) : (
            <SortableList aria-label={copy.title} value={ids} onValueChange={onOrder} disabled={!sortable} className="gap-0.5">
              {requests.map((request) => {
                const selected = request.id === selectedId
                const status = copy.statuses[request.status]
                const done = request.status === 'shipped' || request.status === 'declined'
                return (
                  <SortableListItem
                    key={request.id}
                    value={request.id}
                    textValue={request.title}
                    data-selected={selected || undefined}
                    className={cn(
                      'group/req gap-0.5 border-transparent bg-transparent p-0 ps-1',
                      'transition-[background-color,box-shadow,border-color,scale] hover:bg-hover data-selected:bg-selected',
                      'data-lifted:bg-surface data-dragging:bg-surface',
                      // The row's button draws its ring around the whole row, grip included.
                      'outline-focus has-[[data-request]:focus-visible]:outline-2 has-[[data-request]:focus-visible]:-outline-offset-2',
                    )}
                  >
                    {sortable && (
                      <SortableListHandle className="opacity-0 group-hover/req:opacity-100 group-data-selected/req:opacity-100 focus-visible:opacity-100 aria-pressed:opacity-100 pointer-coarse:opacity-100" />
                    )}
                    <button
                      type="button"
                      data-request={request.id}
                      tabIndex={request.id === stop ? 0 : -1}
                      aria-current={selected || undefined}
                      aria-describedby={hintId}
                      aria-haspopup={tapOpens ? 'dialog' : undefined}
                      onClick={() => (tapOpens ? onOpen(request.id) : onSelect(request.id))}
                      onKeyDown={(event) => onKeyDown(event, request.id)}
                      className={cn('flex min-w-0 flex-1 items-start gap-2.5 rounded-md py-2 pe-2.5 text-start outline-none', !sortable && 'ps-1.5')}
                    >
                      <span aria-hidden className={cn('mt-1.5 size-2 shrink-0 rounded-full', dot[request.status])} />
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className={cn('truncate text-ui font-medium', done ? 'text-fg-muted' : 'text-fg')}>{request.title}</span>
                        <span className="truncate text-ui-sm text-fg-muted">
                          {status} · {request.area} · {copy.ago(daysBetween(request.updatedAt, now))}
                        </span>
                      </span>
                      <span className="mt-0.5 flex shrink-0 items-center gap-0.5 font-mono text-ui-sm text-fg-muted tabular-nums">
                        <ChevronUpIcon size={12} active={false} aria-hidden />
                        {request.votes}
                        <span className="sr-only">{copy.votes}</span>
                      </span>
                    </button>
                  </SortableListItem>
                )
              })}
            </SortableList>
          )}
        </div>
      </ScrollArea>

      <p id={hintId} className="sr-only">
        {copy.hint(sortable)}
      </p>
      <div aria-hidden className="hidden flex-wrap items-center gap-x-3 gap-y-1 border-t border-line px-3 py-2 text-ui-xs text-fg-muted md:flex">
        <span className="flex items-center gap-1">
          <KbdGroup>
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
          </KbdGroup>
          {copy.keyMove}
        </span>
        <span className="flex items-center gap-1">
          <Kbd>↵</Kbd> {copy.keyOpen}
        </span>
        {sortable && (
          <span className="flex items-center gap-1">
            <KbdGroup>
              <Kbd>⌥</Kbd>
              <Kbd>↑↓</Kbd>
            </KbdGroup>
            {copy.keyReorder}
          </span>
        )}
      </div>
    </div>
  )
}
