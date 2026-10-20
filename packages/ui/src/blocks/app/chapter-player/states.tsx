import type { ReactNode } from 'react'
import { Alert, AlertAction, AlertDescription } from '../../../components/ui/alert'
import { Button } from '../../../components/ui/button'
import { CardContent } from '../../../components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../../components/ui/empty'
import { Skeleton } from '../../../components/ui/skeleton'
import type { ChapterPlayerCopy } from './data'

/** The wave as bars of varying height, like the sound it stands for. */
const BARS = Array.from({ length: 96 }, (_, i) => 0.25 + 0.75 * Math.abs(Math.sin(i * 0.47) * Math.cos(i * 0.13)))

/** The player and its chapters drawn as skeletons: the tile, title and clock, the wave, the transport, then the chapter rows. */
function ChapterPlayerLoading({ copy }: { copy: ChapterPlayerCopy }) {
  return (
    <>
      <CardContent>
        <span className="sr-only">{copy.loadingLabel}</span>
        <div aria-hidden className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Skeleton className="size-16 shrink-0 rounded-xl sm:size-20" />
            <div className="flex flex-1 flex-col gap-2.5">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3.5 w-24" />
            </div>
            <div className="flex flex-col items-end gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-3.5 w-14" />
            </div>
          </div>
          <div className="flex h-22 items-center justify-between gap-0.5">
            {BARS.map((h, i) => (
              <Skeleton key={i} className="w-0.5 shrink rounded-full" style={{ height: `${h * 100}%` }} />
            ))}
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-16 rounded-lg" />
            <Skeleton className="size-12 rounded-full" />
            <Skeleton className="h-9 w-16 rounded-lg" />
            <Skeleton className="ms-4 h-3 w-40 max-sm:hidden" />
            <Skeleton className="ms-auto h-9 w-20 rounded-lg" />
          </div>
        </div>
      </CardContent>
      <CardContent className="-my-1 min-h-0 flex-1 overflow-hidden py-1">
        <div aria-hidden className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3.5 w-16" />
          </div>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex min-h-(--ui--row) items-center gap-3 border-t border-line first:border-t-0">
              <Skeleton className="h-3.5 w-5" />
              <Skeleton className="h-4 w-48 max-w-full" />
              <Skeleton className="ms-auto h-3.5 w-10" />
            </div>
          ))}
        </div>
      </CardContent>
    </>
  )
}

function ChapterPlayerError({ message, onRetry, copy }: { message: string; onRetry?: () => void; copy: ChapterPlayerCopy }) {
  return (
    <CardContent className="grid min-h-0 flex-1 place-items-center">
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

function ChapterPlayerEmpty({ empty, copy }: { empty?: ReactNode; copy: ChapterPlayerCopy }) {
  return (
    <CardContent className="grid min-h-0 flex-1">
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

export { ChapterPlayerEmpty, ChapterPlayerError, ChapterPlayerLoading }
