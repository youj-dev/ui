import type { ReactNode } from 'react'
import { Alert, AlertAction, AlertDescription } from '../../../components/ui/alert'
import { Button } from '../../../components/ui/button'
import { CardContent } from '../../../components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../../components/ui/empty'
import { Skeleton } from '../../../components/ui/skeleton'
import type { ItineraryCopy } from './data'

/** The body's room, the pass and the days together, so loading, an error and an empty trip keep the card's size. */
const ROOM = 'min-h-150'

/** The pass and the day strip drawn as skeletons: codes and a route line over a stub, then six days and two plans. */
function ItineraryLoading({ copy }: { copy: ItineraryCopy }) {
  return (
    <>
      <CardContent>
        <span className="sr-only">{copy.loadingLabel}</span>
        <div aria-hidden className="flex h-64 flex-col justify-between rounded-xl bg-well px-5 pt-4 pb-4">
          <div className="flex justify-between gap-6">
            <div className="flex flex-col gap-2.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-36" />
            </div>
            <div className="flex flex-col items-end gap-2.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-40" />
            </div>
          </div>
          <div className="flex items-center gap-5">
            <Skeleton className="h-9 w-20" />
            <span className="flex-1 border-t border-dashed border-line-strong" />
            <Skeleton className="h-9 w-20" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>
      </CardContent>
      <CardContent className="flex flex-col gap-5">
        <div aria-hidden className="flex h-21 items-stretch gap-2 rounded-full bg-band px-4 py-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex flex-1 flex-col justify-center gap-1.5">
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-5 w-6" />
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
        <div aria-hidden className="flex h-49 flex-col gap-3">
          <Skeleton className="h-5 w-56" />
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="size-8 rounded-full" />
              <span className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-3 w-32" />
              </span>
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
          ))}
        </div>
      </CardContent>
    </>
  )
}

function ItineraryError({ message, onRetry, copy }: { message: string; onRetry?: () => void; copy: ItineraryCopy }) {
  return (
    <CardContent className={`grid place-items-center ${ROOM}`}>
      <Alert variant="danger">
        <AlertDescription>{message}</AlertDescription>
        {onRetry && (
          <AlertAction>
            <Button size="sm" variant="outline" onClick={onRetry}>
              {copy.retry}
            </Button>
          </AlertAction>
        )}
      </Alert>
    </CardContent>
  )
}

function ItineraryEmpty({ empty, copy }: { empty?: ReactNode; copy: ItineraryCopy }) {
  return (
    <CardContent className={`grid ${ROOM}`}>
      {empty ?? (
        <Empty className="rounded-lg border border-dashed border-line">
          <EmptyHeader>
            <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
            <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </CardContent>
  )
}

export { ItineraryEmpty, ItineraryError, ItineraryLoading }
