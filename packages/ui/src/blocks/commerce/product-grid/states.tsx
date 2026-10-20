'use client'

import type { ReactNode } from 'react'
import { AlertTriangleIcon, HeartIcon, SearchIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../../../components/ui/empty'
import { Skeleton } from '../../../components/ui/skeleton'
import { cn } from '../../../lib/utils'
import type { ProductGridCopy } from './data'

/* The grid's other states: loading keeps its shape (the wide tile included), an error says why with a retry, no
 * matches (or nothing saved) offers a way out, and a long catalog ends in Load more with how far through it is. */

export function GridSkeleton({ wide }: { wide: boolean }) {
  return (
    <div aria-hidden className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className={cn('flex flex-col gap-3', wide && i === 0 && 'col-span-2')}>
          <Skeleton className={cn('rounded-xl', wide && i === 0 ? 'aspect-[4/3] md:aspect-auto md:flex-1' : 'aspect-[4/5]')} />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ))}
    </div>
  )
}

interface GridMessageProps {
  icon: ReactNode
  title: string
  description: ReactNode
  action?: { label: string; onClick: () => void }
}

export function GridMessage({ icon, title, description, action }: GridMessageProps) {
  return (
    <Empty className="border border-dashed border-line py-16">
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action && (
        <EmptyContent>
          <Button variant="outline" onClick={action.onClick}>
            {action.label}
          </Button>
        </EmptyContent>
      )}
    </Empty>
  )
}

export const errorMessage = (copy: ProductGridCopy, error: ReactNode, onRetry?: () => void) => (
  <GridMessage icon={<AlertTriangleIcon />} title={copy.errorTitle} description={error} action={onRetry && { label: copy.retry, onClick: onRetry }} />
)

export const emptyMessage = (copy: ProductGridCopy, nothingSaved: boolean, onClear: () => void) =>
  nothingSaved ? (
    <GridMessage
      icon={<HeartIcon />}
      title={copy.savedEmptyTitle}
      description={copy.savedEmptyDescription}
      action={{ label: copy.showAll, onClick: onClear }}
    />
  ) : (
    <GridMessage
      icon={<SearchIcon />}
      title={copy.emptyTitle}
      description={copy.emptyDescription}
      action={{ label: copy.clearFilters, onClick: onClear }}
    />
  )

export function LoadMore({ copy, shown, total, onLoadMore }: { copy: ProductGridCopy; shown: number; total: number; onLoadMore: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 pt-2">
      <p className="text-ui-sm text-fg-muted tabular-nums">{copy.showing(shown, total)}</p>
      <div aria-hidden className="h-0.5 w-40 overflow-hidden rounded-full bg-band">
        <div
          className="h-full origin-left bg-accent transition-transform yj-duration-slow ease-standard rtl:origin-right"
          style={{ transform: `scaleX(${shown / total})` }}
        />
      </div>
      <Button variant="outline" onClick={onLoadMore}>
        {copy.loadMore}
      </Button>
    </div>
  )
}
