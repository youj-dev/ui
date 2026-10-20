'use client'

import type { ReactNode } from 'react'
import { Alert, AlertAction, AlertDescription } from '../../../components/ui/alert'
import { Button } from '../../../components/ui/button'
import { CardContent } from '../../../components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../../components/ui/empty'
import { Skeleton } from '../../../components/ui/skeleton'
import { Eyebrow } from '../../../components/ui/typography'
import { WEEKS, type StreaksCopy } from './data'

/* What the card's body shows while the items load, fail to load or are none:
 * the same bands as the real one (the item's run, its weeks of dots, today's
 * list) as skeletons, or the message in the body's room. */

interface StreaksPlaceholderProps {
  state: 'loading' | 'error' | 'empty'
  copy: StreaksCopy
  error?: string
  onRetry?: () => void
  empty?: ReactNode
}

function Row() {
  return (
    <li className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
      <Skeleton className="size-9 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="hidden h-1.5 w-24 rounded-full sm:block" />
      <Skeleton className="h-8 w-24 rounded-md" />
    </li>
  )
}

export function StreaksPlaceholder({ state, copy, error, onRetry, empty }: StreaksPlaceholderProps) {
  if (state === 'loading') {
    return (
      <>
        <CardContent className="flex flex-col gap-5">
          <span className="sr-only">{copy.loadingLabel}</span>
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-5 w-20 shrink-0 rounded-full" />
          </div>
          <div className="flex flex-col gap-4">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-2.5 w-full" />
            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="h-14 rounded-xl" />
              <Skeleton className="h-14 rounded-xl" />
              <Skeleton className="h-14 rounded-xl" />
            </div>
          </div>
        </CardContent>
        <CardContent aria-hidden className="flex flex-col gap-4">
          <Skeleton className="h-3 w-24" />
          <div className="grid grid-flow-col grid-rows-7 gap-0.75 ps-9" style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))` }}>
            {Array.from({ length: WEEKS * 7 }, (_, i) => (
              <span key={i} className="grid aspect-square place-items-center">
                <Skeleton className="size-3/5 rounded-full" />
              </span>
            ))}
          </div>
        </CardContent>
        <CardContent aria-hidden className="-my-1 flex min-h-0 flex-1 flex-col gap-3 overflow-hidden py-1">
          <Eyebrow>{copy.today}</Eyebrow>
          <ul className="-mx-3 flex flex-col gap-1 sm:-mx-4">
            <Row />
            <Row />
            <Row />
          </ul>
        </CardContent>
      </>
    )
  }
  return (
    <CardContent className="grid min-h-0 flex-1 place-items-center">
      {state === 'error' ? (
        <Alert variant="danger">
          <AlertDescription>{error ?? copy.errorTitle}</AlertDescription>
          {onRetry && (
            <AlertAction>
              <Button size="sm" variant="outline" onClick={onRetry}>
                {copy.retry}
              </Button>
            </AlertAction>
          )}
        </Alert>
      ) : (
        (empty ?? (
          <Empty className="size-full rounded-lg border border-dashed border-line">
            <EmptyHeader>
              <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
              <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ))
      )}
    </CardContent>
  )
}
