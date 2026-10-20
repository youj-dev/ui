'use client'

import type { ReactNode } from 'react'
import { Alert, AlertAction, AlertDescription } from '../../../components/ui/alert'
import { Button } from '../../../components/ui/button'
import { CardContent } from '../../../components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../../components/ui/empty'
import { Skeleton } from '../../../components/ui/skeleton'
import { Eyebrow } from '../../../components/ui/typography'
import { cn } from '../../../lib/utils'
import type { ProcedureCopy } from './data'

/* What the card's body shows while the procedure loads, fails to load or has
 * no inputs: the two bands of the real one (the ring and the yield; the
 * inputs beside the steps) as skeletons, or the message in their room, with
 * the body's size held either way. */

interface ProcedureBodyPlaceholderProps {
  state: 'loading' | 'error' | 'empty'
  copy: ProcedureCopy
  error?: string
  onRetry?: () => void
  empty?: ReactNode
}

export function ProcedureBodyPlaceholder({ state, copy, error, onRetry, empty }: ProcedureBodyPlaceholderProps) {
  const loading = state === 'loading'
  // Laid out the same way in every state; only the message shows over it, and it is the skeletons that hide.
  const hide = loading ? undefined : 'invisible'
  return (
    <>
      {loading && <span className="sr-only">{copy.loadingLabel}</span>}
      <CardContent aria-hidden className={cn('grid gap-8 md:grid-cols-[minmax(0,1fr)_--spacing(68)] md:items-center', hide)}>
        <div className="flex items-center justify-center gap-6">
          <div className="relative size-48 shrink-0">
            <div className="absolute inset-0 rounded-full border-[16px] border-dashed border-line-strong opacity-60" />
            <div className="absolute inset-[30%] grid place-items-center">
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
          <div className="hidden flex-col gap-3 lg:flex">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-4 w-28" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-3 gap-3">
            {[copy.prep, copy.cook, copy.level].map((label) => (
              <div key={label} className="flex min-w-0 flex-col gap-1">
                <Eyebrow>{label}</Eyebrow>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <Eyebrow>{copy.yield}</Eyebrow>
            <Skeleton className="h-control w-full" />
          </div>
          <Skeleton className="h-control w-full" />
        </div>
      </CardContent>

      <CardContent aria-hidden className={cn('grid gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-10', hide)}>
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex items-baseline justify-between gap-3">
            <Eyebrow>{copy.inputs}</Eyebrow>
            <Skeleton className="h-3 w-10" />
          </div>
          <div className="flex flex-col">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex min-h-11 items-center gap-3 border-t border-line py-2 first:border-t-0">
                <Skeleton className="size-4 shrink-0 rounded-xs" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <Eyebrow>{copy.steps}</Eyebrow>
          <div className="flex flex-col">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex gap-3.5 border-t border-line py-3 first:border-t-0 first:pt-0">
                <Skeleton className="h-4 w-5 shrink-0" />
                <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  {i % 2 === 0 && <Skeleton className="h-8 w-28 rounded-md" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      {/* The card is the positioned box: the message sits over the middle of its body. */}
      {!loading && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center px-(--card-spacing)">
          <div className="pointer-events-auto">
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
                <Empty className="rounded-lg border border-dashed border-line px-10 py-8">
                  <EmptyHeader>
                    <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
                    <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ))
            )}
          </div>
        </div>
      )}
    </>
  )
}
