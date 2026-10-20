'use client'

import type { ReactNode } from 'react'
import { Alert, AlertAction, AlertDescription } from '../../../components/ui/alert'
import { Button } from '../../../components/ui/button'
import { CardContent } from '../../../components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../../components/ui/empty'
import { Skeleton } from '../../../components/ui/skeleton'
import { Eyebrow } from '../../../components/ui/typography'
import { cn } from '../../../lib/utils'
import type { IntervalTimerCopy } from './data'

/** The well behind the item at hand and the rest countdown. */
export const WELL =
  'rounded-xl bg-[color-mix(in_oklab,var(--color-canvas)_calc(45%*var(--yj-dark)),color-mix(in_oklab,var(--color-fg)_3%,transparent))] p-4 sm:p-5'

/* What the card's body shows while the intervals load, fail to load or are
 * none: the ring's own shape (a track of arcs) beside the well and the
 * logger as skeletons, or the message in the same room, with the real body's
 * size held either way. */

interface TimerPlaceholderProps {
  state: 'loading' | 'error' | 'empty'
  copy: IntervalTimerCopy
  error?: string
  onRetry?: () => void
  empty?: ReactNode
}

export function TimerPlaceholder({ state, copy, error, onRetry, empty }: TimerPlaceholderProps) {
  const loading = state === 'loading'
  // The body is laid out the same way in every state; only the message shows over it, and it is the skeletons that hide.
  const hide = loading ? undefined : 'invisible'
  return (
    <>
      <CardContent className="relative grid items-center gap-8 md:grid-cols-[minmax(0,--spacing(76))_minmax(0,1fr)] md:gap-10">
        {loading && <span className="sr-only">{copy.loadingLabel}</span>}
        <div aria-hidden className={cn('relative mx-auto aspect-square w-full max-w-76', hide)}>
          <div className="absolute inset-0 rounded-full border-[10px] border-dashed border-line-strong opacity-50" />
          <div className="absolute inset-[30%] grid place-items-center">
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <div aria-hidden className={cn('flex min-w-0 flex-col gap-4', hide)}>
          <div className={cn(WELL, 'flex flex-col gap-4')}>
            <div className="flex items-baseline justify-between gap-3">
              <Eyebrow>{copy.now}</Eyebrow>
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-end justify-between gap-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-10 w-24" />
            </div>
            <Skeleton className="h-2.5 w-full" />
          </div>
          <div className="flex items-center gap-3 px-1">
            <Eyebrow>{copy.next}</Eyebrow>
            <Skeleton className="size-2 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-10" />
          </div>
        </div>
        {!loading && (
          <div className="absolute inset-0 grid place-items-center p-6">
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
          </div>
        )}
      </CardContent>

      <CardContent aria-hidden className={hide}>
        <div className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-3">
            <Eyebrow>{copy.logLabel}</Eyebrow>
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="grid gap-x-10 gap-y-5 md:grid-cols-[minmax(0,--spacing(76))_minmax(0,1fr)]">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-x-2 gap-y-3">
              <Skeleton className="h-14" />
              <span className="w-3" />
              <Skeleton className="h-14" />
              <Skeleton className="col-span-3 h-control" />
            </div>
            <div className="flex h-24.5 flex-col gap-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
          </div>
        </div>
      </CardContent>
    </>
  )
}
