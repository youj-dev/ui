import type { ReactNode } from 'react'
import { Alert, AlertAction, AlertDescription } from '../../../components/ui/alert'
import { Button } from '../../../components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../../components/ui/empty'
import { Skeleton } from '../../../components/ui/skeleton'
import type { ArcGlobeCopy } from './data'

/* What stands in for the globe and the lists while the data loads, fails or
 * is empty: the same two columns, so the card keeps its size. */

interface PlaceholderProps {
  loading: boolean
  error?: string
  onRetry?: () => void
  empty?: ReactNode
  /** There are no places. */
  none: boolean
  copy: ArcGlobeCopy
}

export function Placeholder({ loading, error, onRetry, empty, none, copy }: PlaceholderProps) {
  if (loading)
    return (
      <>
        <div className="flex min-w-0 flex-col items-center gap-2">
          <div className="relative aspect-square w-full max-w-136">
            <span className="sr-only">{copy.loadingLabel}</span>
            {/* The globe's own shape: its rim and a graticule, with the pole held by a skeleton. */}
            <svg aria-hidden viewBox="0 0 100 100" fill="none" className="absolute inset-0 size-full overflow-visible">
              <circle cx={50} cy={50} r={44} vectorEffect="non-scaling-stroke" className="stroke-line-strong" />
              {[
                [44, 14],
                [44, 30],
                [14, 44],
                [30, 44],
              ].map(([rx, ry]) => (
                <ellipse
                  key={`${rx}-${ry}`}
                  cx={50}
                  cy={50}
                  rx={rx}
                  ry={ry}
                  strokeDasharray="2 4"
                  vectorEffect="non-scaling-stroke"
                  className="stroke-line"
                />
              ))}
            </svg>
            <Skeleton className="absolute top-1/2 left-1/2 size-[10%] -translate-1/2 rounded-full" />
          </div>
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex min-w-0 flex-col gap-5">
          {[5, 6].map((rows) => (
            <div key={rows} className="flex flex-col gap-2">
              <Skeleton className="h-3 w-24" />
              {Array.from({ length: rows }, (_, i) => (
                <Skeleton key={i} className="h-7 w-full" />
              ))}
            </div>
          ))}
        </div>
      </>
    )
  if (error)
    return (
      <div className="grid aspect-square w-full place-items-center md:col-span-full md:aspect-auto md:min-h-135">
        <Alert variant="danger">
          <AlertDescription>{error}</AlertDescription>
          {onRetry && (
            <AlertAction>
              <Button size="sm" variant="outline" onClick={onRetry}>
                {copy.retry}
              </Button>
            </AlertAction>
          )}
        </Alert>
      </div>
    )
  if (none)
    return (
      <div className="grid aspect-square w-full md:col-span-full md:aspect-auto md:min-h-135">
        {empty ?? (
          <Empty className="rounded-lg border border-dashed border-line">
            <EmptyHeader>
              <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
              <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    )
  return null
}
