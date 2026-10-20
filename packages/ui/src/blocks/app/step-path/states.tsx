'use client'

import type { ReactNode } from 'react'
import { Alert, AlertAction, AlertDescription } from '../../../components/ui/alert'
import { Button } from '../../../components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../../components/ui/empty'
import { Skeleton } from '../../../components/ui/skeleton'
import { cn } from '../../../lib/utils'
import type { StepPathCopy } from './data'

/* What the trail's room shows while the course loads, fails to load or has
 * no steps: a skeleton trail (a section's title and nodes winding down, a
 * title beside each) or the message, in the room the real trail scrolls in. */

interface PathPlaceholderProps {
  state: 'loading' | 'error' | 'empty'
  copy: StepPathCopy
  error?: string
  onRetry?: () => void
  empty?: ReactNode
}

/** Where each node sits along its row, as a share of the width: a gentle wind. */
const WIND = [50, 62, 70, 62, 50, 38, 30, 38]

export function PathPlaceholder({ state, copy, error, onRetry, empty }: PathPlaceholderProps) {
  return (
    <div className="relative h-136 overflow-hidden px-5 sm:px-6">
      {state === 'loading' && (
        <div aria-hidden className="my-6 flex flex-col gap-6">
          <span className="sr-only">{copy.loadingLabel}</span>
          {[0, 1].map((section) => (
            <div key={section} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-40" />
              </div>
              {WIND.slice(0, 4).map((at, i) => (
                <div key={i} className="flex items-center gap-4" style={{ paddingInlineStart: `${at - 30}%` }}>
                  <Skeleton className="size-14 shrink-0 rounded-full" />
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      {state !== 'loading' && (
        <div className={cn('absolute inset-0 grid place-items-center p-6')}>
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
    </div>
  )
}
