import type { ReactNode } from 'react'
import { Alert, AlertAction, AlertDescription } from '../../../components/ui/alert'
import { Button } from '../../../components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../../components/ui/empty'
import { Skeleton } from '../../../components/ui/skeleton'
import type { HubMapCopy } from './data'
import { GRID, SCANLINES } from './land'

/* What stands in for the map while the data loads, fails or is empty: the
 * map's own aspect, so the card keeps its size. */

interface MapPlaceholderProps {
  loading: boolean
  error?: string
  onRetry?: () => void
  empty?: ReactNode
  /** There is nothing to draw. */
  none: boolean
  copy: HubMapCopy
}

/** Where the skeleton hubs sit, as percentages of the map. */
const HUBS_AT = [
  [12, 28],
  [26, 45],
  [36, 82],
  [49, 30],
  [57, 62],
  [70, 40],
  [76, 55],
  [86, 76],
] as const

export function MapPlaceholder({ loading, error, onRetry, empty, none, copy }: MapPlaceholderProps) {
  if (loading)
    return (
      <div className="relative aspect-[120/45] w-full">
        <span className="sr-only">{copy.loadingLabel}</span>
        {/* The world's own scanlines, with a few hubs held by skeletons. */}
        <svg aria-hidden viewBox={`0 0 ${GRID.cols} ${GRID.rows}`} className="absolute inset-0 size-full overflow-visible">
          <g strokeLinecap="round" strokeWidth={0.46} className="stroke-line">
            {SCANLINES.map((row, r) => {
              let d = ''
              for (let i = 0; i < row.length; i += 2) d += `M${row[i]! + 0.5} ${r + 0.5}H${row[i + 1]! - 0.5}`
              return d ? <path key={r} d={d} /> : null
            })}
          </g>
        </svg>
        {HUBS_AT.map(([x, y]) => (
          // Geography, not reading order: the map stays west to east in RTL, so the place is physical.
          <Skeleton
            key={`${x}-${y}`}
            className="absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ left: `${x}%`, top: `${y}%` }}
          />
        ))}
      </div>
    )
  if (error)
    return (
      <div className="grid aspect-[120/45] w-full place-items-center">
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
      <div className="grid aspect-[120/45] w-full">
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

/** The panel's place: three columns of skeleton blocks while loading. */
export function DetailPlaceholder({ loading }: { loading: boolean }) {
  return (
    <div aria-hidden className="grid gap-x-6 gap-y-5 md:grid-cols-3">
      {loading &&
        [0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
    </div>
  )
}
