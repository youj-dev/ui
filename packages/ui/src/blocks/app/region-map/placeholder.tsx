import type { ReactNode } from 'react'
import { Alert, AlertAction, AlertDescription } from '../../../components/ui/alert'
import { Button } from '../../../components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../../components/ui/empty'
import { Skeleton } from '../../../components/ui/skeleton'
import type { RegionMapCopy } from './data'

/* What stands in for the map while the data loads, fails or is empty: the
 * map's own aspect, so the card keeps its size. */

interface MapPlaceholderProps {
  loading: boolean
  error?: string
  onRetry?: () => void
  empty?: ReactNode
  /** There is nothing to draw. */
  none: boolean
  copy: RegionMapCopy
}

/** Where the skeleton regions sit, as percentages of the map. */
const REGIONS_AT = [
  [14, 36],
  [24, 40],
  [32, 80],
  [48, 28],
  [53, 33],
  [75, 40],
  [81, 46],
  [88, 78],
] as const

export function MapPlaceholder({ loading, error, onRetry, empty, none, copy }: MapPlaceholderProps) {
  if (loading)
    return (
      <div className="relative aspect-[120/45] w-full">
        <span className="sr-only">{copy.loadingLabel}</span>
        {/* The map's dot grid, with a few regions held by skeletons. */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(var(--color-line-strong) 1.2px, transparent 1.6px)',
            backgroundSize: 'calc(100% / 120) calc(100% / 45)',
          }}
        />
        {REGIONS_AT.map(([x, y]) => (
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

/** The table's place: ten rows tall, with skeleton rows while loading. */
export function TablePlaceholder({ loading }: { loading: boolean }) {
  return (
    <div aria-hidden className="flex h-120 flex-col justify-between px-5 py-6 sm:px-6">
      {loading && Array.from({ length: 10 }, (_, i) => <Skeleton key={i} className="h-5 w-full" />)}
    </div>
  )
}
