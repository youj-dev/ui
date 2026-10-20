'use client'

import type { ReactNode } from 'react'
import { HistoryIcon, SearchIcon, TrendingUpIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../../../components/ui/empty'
import { Skeleton } from '../../../components/ui/skeleton'
import { useSearchConfig } from './copy'

/* What stands in for results: skeleton rows shaped like result cards while a
 * search runs, a start state before anything is searched (recent and popular
 * searches, one press away), and a no-results state that says why and offers
 * a way out: a spelling fix, dropping the filters, or a popular search. */

export function ResultsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-1">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex gap-3.5 px-3 py-3.5 sm:px-4">
          <Skeleton className={i % 3 === 1 ? 'size-10 rounded-full' : 'size-9 rounded-lg'} />
          <div className="flex flex-1 flex-col gap-2 pt-0.5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className={i % 2 ? 'h-4 w-1/2' : 'h-4 w-3/4'} />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

function Chips({ label, items, icon: Icon, onPick }: { label: string; items: string[]; icon: typeof SearchIcon; onPick: (q: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-ui-sm text-fg-muted">{label}</span>
      <ul aria-label={label} className="flex flex-wrap justify-center gap-1.5">
        {items.map((q) => (
          <li key={q}>
            <Button size="sm" variant="outline" onClick={() => onPick(q)}>
              <Icon size={14} aria-hidden className="text-fg-muted" />
              {q}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function StartState({ recent, onPick }: { recent: string[]; onPick: (q: string) => void }) {
  const { copy, brand, popular } = useSearchConfig()
  return (
    <Empty className="border border-dashed border-line py-14">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchIcon />
        </EmptyMedia>
        <EmptyTitle>{copy.startTitle(brand)}</EmptyTitle>
        <EmptyDescription>{copy.startDescription}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="max-w-lg gap-5">
        {recent.length > 0 && <Chips label={copy.recentSearches} items={recent} icon={HistoryIcon} onPick={onPick} />}
        {popular.length > 0 && <Chips label={copy.popular} items={popular.slice(0, 4)} icon={TrendingUpIcon} onPick={onPick} />}
      </EmptyContent>
    </Empty>
  )
}

interface NoResultsProps {
  q: string
  /** A nearby spelling with results. */
  fix: string | null
  /** Results the query has with no filters, when filters hide them all. */
  hidden: number
  onPick: (q: string) => void
  onClearFilters: () => void
}

export function NoResults({ q, fix, hidden, onPick, onClearFilters }: NoResultsProps) {
  const { copy, popular } = useSearchConfig()
  return (
    <Empty className="border border-dashed border-line py-14">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchIcon />
        </EmptyMedia>
        <EmptyTitle className="break-words">{copy.noResults(q)}</EmptyTitle>
        <EmptyDescription>
          {hidden > 0 ? copy.filtersHide(hidden) : fix ? copy.checkSpelling : copy.tryBroader}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="max-w-lg gap-5">
        {(fix || hidden > 0) && (
          <div className="flex flex-wrap justify-center gap-2">
            {fix && (
              <Button variant="outline" onClick={() => onPick(fix)}>
                {copy.didYouMean(fix)}
              </Button>
            )}
            {hidden > 0 && <Button onClick={onClearFilters}>{copy.clearFilters}</Button>}
          </div>
        )}
        {!hidden && popular.length > 0 && <Chips label={copy.popular} items={popular.slice(0, 4)} icon={TrendingUpIcon} onPick={onPick} />}
      </EmptyContent>
    </Empty>
  )
}

/** The search failed: what happened, and a retry when there is one. */
export function SearchError({ error, onRetry }: { error: ReactNode; onRetry?: () => void }) {
  const { copy } = useSearchConfig()
  return (
    <Empty role="alert" className="border border-dashed border-line py-14">
      <EmptyHeader>
        <EmptyTitle>{copy.errorTitle}</EmptyTitle>
        {typeof error === 'string' ? <EmptyDescription>{error}</EmptyDescription> : error === true ? null : error}
      </EmptyHeader>
      {onRetry && (
        <EmptyContent>
          <Button variant="outline" onClick={onRetry}>
            {copy.retry}
          </Button>
        </EmptyContent>
      )}
    </Empty>
  )
}
