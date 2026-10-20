import type { ReactNode } from 'react'
import { Alert, AlertAction, AlertDescription } from '../../../components/ui/alert'
import { Button } from '../../../components/ui/button'
import { CardContent } from '../../../components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../../components/ui/empty'
import { Skeleton } from '../../../components/ui/skeleton'
import type { TrackArrangerCopy } from './data'

/** The body's room, the transport, the lanes and the inspector together, so loading, an error and an empty project keep the card's size. */
const ROOM = 'min-h-114'

/** Where each lane's bars start and how long they run, as a share of the lane. */
const LANES: [number, number][] = [
  [0.16, 0.3],
  [0, 0.78],
  [0.16, 0.66],
  [0, 0.34],
]

/** The transport, the lanes with bars on them, then the inspector's fields, as skeletons. */
function TrackArrangerLoading({ copy }: { copy: TrackArrangerCopy }) {
  return (
    <>
      <CardContent className="flex flex-col gap-4">
        <span className="sr-only">{copy.loadingLabel}</span>
        <div aria-hidden className="flex items-center gap-4">
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="size-12 rounded-full" />
          <Skeleton className="h-8 w-36" />
          <Skeleton className="ms-auto h-8 w-20 rounded-lg" />
        </div>
        <div aria-hidden className="flex flex-col overflow-hidden rounded-lg border border-line">
          <div className="h-7 border-b border-line" />
          {LANES.map(([from, width], i) => (
            <div key={i} className="grid h-14 grid-cols-[--spacing(44)_minmax(0,1fr)] items-center border-b border-line last:border-b-0 max-sm:grid-cols-[--spacing(20)_minmax(0,1fr)]">
              <div className="flex flex-col gap-1.5 px-3">
                <Skeleton className="h-3.5 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
              <div className="relative h-full border-s border-line">
                <Skeleton className="absolute inset-y-1 rounded-md" style={{ insetInlineStart: `${from * 100}%`, width: `${width * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardContent>
        <div aria-hidden className="flex flex-col gap-4">
          <Skeleton className="h-4 w-48" />
          <div className="flex items-end gap-4">
            <Skeleton className="h-10 w-36 rounded-full" />
            <Skeleton className="h-10 w-36 rounded-full" />
            <Skeleton className="h-2 flex-1 rounded-full" />
            <Skeleton className="h-6 w-14" />
          </div>
        </div>
      </CardContent>
    </>
  )
}

function TrackArrangerError({ message, onRetry, copy }: { message: string; onRetry?: () => void; copy: TrackArrangerCopy }) {
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

function TrackArrangerEmpty({ empty, copy }: { empty?: ReactNode; copy: TrackArrangerCopy }) {
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

export { TrackArrangerEmpty, TrackArrangerError, TrackArrangerLoading }
