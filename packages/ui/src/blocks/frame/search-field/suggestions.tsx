'use client'

import type { RefObject } from 'react'
import { useLabels } from '@youj/core'
import { SlidingIndicator } from '@youj/motion'
import { SearchXIcon } from '@youj/icons'
import { Kbd } from '../../../components/ui/kbd'
import { cn } from '../../../lib/utils'
import type { Page } from './pages'

/* The search field's suggestions: a listbox of pages floating under the
 * field, its active row marked by a highlight that glides as you arrow or
 * point, then the keys that drive it. With no match it says so instead. It
 * rises in on the fast token and is gone on the instant one; reduced motion
 * shows and hides it at once. Pressing in it never takes focus from the
 * field. */

interface SuggestionsProps {
  open: boolean
  rows: Page[]
  /** The active row's index. */
  current: number
  listId: string
  optionId: (page: string) => string
  listRef: RefObject<HTMLDivElement | null>
  /** Says there's no match. */
  empty: string
  /** Enter with no match searches everything (the field has `onSearch`). */
  searchable: boolean
  onActive: (index: number) => void
  onPick: (page: Page) => void
}

/** The label with the part the query matched set heavier. */
function Label({ page }: { page: Page }) {
  if (page.at < 0) return <>{page.label}</>
  const end = page.at + page.length
  return (
    <>
      {page.label.slice(0, page.at)}
      <span className="font-semibold">{page.label.slice(page.at, end)}</span>
      {page.label.slice(end)}
    </>
  )
}

function Suggestions({ open, rows, current, listId, optionId, listRef, empty, searchable, onActive, onPick }: SuggestionsProps) {
  const labels = useLabels()
  return (
    <div
      data-slot="frame-search-suggestions"
      data-open={open || undefined}
      onMouseDown={(event) => event.preventDefault()}
      className={cn(
        'absolute end-0 top-full z-50 mt-1.5 w-full min-w-72 origin-top overflow-hidden rounded-lg border border-line bg-overlay text-fg shadow-md',
        'max-md:inset-x-2 max-md:w-auto max-md:min-w-0',
        // Out on the instant token, hidden once it's gone; in on the fast one, and at once clickable.
        'invisible -translate-y-1 scale-[0.98] opacity-0 transition-[opacity,scale,translate,visibility] yj-duration-instant ease-exit',
        'data-open:visible data-open:translate-y-0 data-open:scale-100 data-open:opacity-100',
        'data-open:transition-[opacity,scale,translate] data-open:yj-duration-fast data-open:ease-enter',
      )}
    >
      {rows.length > 0 ? (
        <>
          <div
            ref={listRef}
            role="listbox"
            id={listId}
            aria-label={labels.pages}
            className="relative isolate max-h-80 scroll-py-1 overflow-y-auto overscroll-contain p-1 yj-scrollbar"
          >
            {rows.map((page, i) => {
              const Icon = page.icon
              return (
                <div
                  key={page.id}
                  id={optionId(page.id)}
                  role="option"
                  aria-selected={i === current}
                  // Read as "Atlas, Projects": the page, then where it lives.
                  aria-label={page.context ? `${page.label}, ${page.context}` : undefined}
                  onPointerMove={() => i !== current && onActive(i)}
                  onClick={() => onPick(page)}
                  className="group/option flex min-h-control cursor-default items-center gap-2.5 rounded-md px-2 text-ui text-fg select-none"
                >
                  {Icon ? (
                    <Icon
                      size={16}
                      strokeWidth={1.75}
                      className="shrink-0 text-fg-muted transition-colors yj-duration-fast ease-standard group-aria-selected/option:text-fg"
                    />
                  ) : (
                    <span className="size-4 shrink-0" />
                  )}
                  <span className="min-w-0 flex-1 truncate">
                    <Label page={page} />
                  </span>
                  {page.context && <span className="shrink-0 text-ui-sm text-fg-muted">{page.context}</span>}
                </div>
              )
            })}
            <SlidingIndicator match="[aria-selected=true]" className="rounded-md bg-hover" />
          </div>
          <div
            aria-hidden
            className="flex items-center gap-3 border-t border-line px-3 py-1.5 text-ui-xs text-fg-muted max-md:hidden pointer-coarse:hidden"
          >
            <span className="flex items-center gap-1">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              {labels.navigate}
            </span>
            <span className="flex items-center gap-1">
              <Kbd>↵</Kbd>
              {labels.open}
            </span>
            <span className="ms-auto flex items-center gap-1">
              <Kbd>esc</Kbd>
              {labels.close}
            </span>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-1 px-4 py-6 text-center">
          <SearchXIcon size={20} strokeWidth={1.5} className="mb-1 text-fg-muted" />
          <p className="text-ui font-medium text-fg">{empty}</p>
          {searchable && <p className="text-ui-sm text-fg-muted">{labels.searchEverything}</p>}
        </div>
      )}
    </div>
  )
}

export { Suggestions }
