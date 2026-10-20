'use client'

import { useLayoutEffect, useRef, type KeyboardEvent, type MouseEvent } from 'react'
import { PresenceItem, PresenceList } from '@youj/motion'
import { AsyncButton } from '../../../components/ui/async-button'
import { Kbd, KbdGroup } from '../../../components/ui/kbd'
import { Progress } from '../../../components/ui/progress'
import type { SearchItem } from './data'
import { PAGE_SIZE } from './model'
import { useSearchConfig } from './copy'
import { ResultCard } from './result-cards'

/* The ranked results. Filtering, sorting and loading more all go through
 * PresenceList: results that stop matching fade where they stand while the
 * rest glide into the gap, and new ones take their slot as the others make
 * room. ↑/↓ (and Home/End) move between results, Enter opens one, and ↑ on
 * the first returns to the search field. Load more holds its button pending,
 * then moves focus to the first new result so the keyboard picks up where
 * the reading left off. */

export const RESULT_LINKS = 'li:not([inert]) a[data-result]'

interface ResultListProps {
  titleAs: 'h3' | 'h4' | 'h5'
  items: SearchItem[]
  total: number
  words: string[]
  onOpen: (item: SearchItem, event: MouseEvent<HTMLAnchorElement>) => void
  onLoadMore: () => Promise<unknown>
  /** ↑ on the first result. */
  onExitTop: () => void
}

export function ResultList({ titleAs, items, total, words, onOpen, onLoadMore, onExitTop }: ResultListProps) {
  const { copy } = useSearchConfig()
  const root = useRef<HTMLDivElement>(null)
  const focusFrom = useRef<number | null>(null)

  useLayoutEffect(() => {
    const from = focusFrom.current
    if (from === null || items.length <= from) return
    focusFrom.current = null
    root.current?.querySelectorAll<HTMLElement>(RESULT_LINKS)[from]?.focus()
  }, [items.length])

  const onKeyDown = (event: KeyboardEvent) => {
    const links = [...(root.current?.querySelectorAll<HTMLElement>(RESULT_LINKS) ?? [])]
    const at = links.indexOf(event.target as HTMLElement)
    if (at < 0) return
    const to = { ArrowDown: at + 1, ArrowUp: at - 1, Home: 0, End: links.length - 1 }[event.key]
    if (to === undefined) return
    event.preventDefault()
    if (to < 0) onExitTop()
    else links[Math.min(to, links.length - 1)]?.focus()
  }

  return (
    <div ref={root} className="flex flex-col gap-4">
      <PresenceList aria-label={copy.results} onKeyDown={onKeyDown} className="-mx-3 flex flex-col gap-0.5 sm:-mx-4">
        {items.map((item) => (
          <PresenceItem key={item.id}>
            <ResultCard item={item} titleAs={titleAs} words={words} onOpen={onOpen} />
          </PresenceItem>
        ))}
      </PresenceList>
      <div className="flex flex-col items-center gap-3 border-t border-line pt-5">
        <Progress value={items.length} max={total} aria-label={copy.showingLabel(items.length, total)} className="w-40" />
        <p className="text-ui-sm text-fg-muted tabular-nums">
          {copy.showing(items.length, total)}
        </p>
        {items.length < total ? (
          <AsyncButton
            variant="outline"
            pendingLabel={copy.loadingMore}
            successLabel={copy.loaded}
            onAction={async () => {
              focusFrom.current = items.length
              await onLoadMore()
            }}
          >
            {copy.showMore(Math.min(PAGE_SIZE, total - items.length))}
          </AsyncButton>
        ) : (
          <p className="text-ui-sm text-fg-muted">{copy.everything}</p>
        )}
      </div>
      <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-ui-xs text-fg-muted max-sm:hidden">
        <span className="flex items-center gap-1.5">
          <KbdGroup>
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
          </KbdGroup>
          {copy.keyMove}
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd>↵</Kbd> {copy.keyOpen}
        </span>
        <span className="flex items-center gap-1.5">
          <Kbd>/</Kbd> {copy.keySearch}
        </span>
      </p>
    </div>
  )
}
