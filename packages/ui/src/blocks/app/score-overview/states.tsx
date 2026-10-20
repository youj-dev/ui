'use client'

import { Alert, AlertAction, AlertDescription } from '../../../components/ui/alert'
import { Button } from '../../../components/ui/button'
import { Skeleton } from '../../../components/ui/skeleton'
import { Eyebrow } from '../../../components/ui/typography'
import type { ScoreOverviewCopy, ScoreOverviewSeverity, ScoreOverviewTab } from './data'

/* What stands in for the card's data while it loads or fails: the score's
 * ring and figure as skeletons or a dash, and over the tab panels (one
 * height, 13rem) either skeletons in the shape of the open tab or the error
 * with Retry. */

interface ScoreFallbackProps {
  loading: boolean
  copy: Pick<ScoreOverviewCopy, 'score' | 'loadingLabel'>
}

function ScoreFallback({ loading, copy }: ScoreFallbackProps) {
  return (
    <>
      {loading ? (
        <Skeleton className="size-24 shrink-0 rounded-full" />
      ) : (
        <span aria-hidden className="grid size-24 shrink-0 place-items-center rounded-full border border-dashed border-line text-3xl text-fg-subtle">
          —
        </span>
      )}
      <div className="flex min-w-0 flex-col gap-1.5">
        <Eyebrow>{copy.score}</Eyebrow>
        {loading ? <Skeleton className="h-9 w-24" /> : <span className="text-4xl leading-[1.1] font-semibold text-fg-subtle">—</span>}
        {loading && <Skeleton className="h-4 w-28" />}
        {loading && <span className="sr-only">{copy.loadingLabel}</span>}
      </div>
    </>
  )
}

interface PanelStatesProps {
  loading: boolean
  error?: string
  onRetry?: () => void
  tab: ScoreOverviewTab
  severities: readonly ScoreOverviewSeverity[]
  copy: Pick<ScoreOverviewCopy, 'retry'>
}

function PanelStates({ loading, error, onRetry, tab, severities, copy }: PanelStatesProps) {
  if (loading) {
    return (
      <div className="pointer-events-none absolute inset-x-0 top-0 flex h-52 flex-col gap-2">
        {tab === 'trend' ? (
          <>
            <div className="flex items-center gap-3">
              {severities.map((sev) => (
                <Skeleton key={sev.id} className="h-3 w-14" />
              ))}
            </div>
            <Skeleton className="min-h-0 flex-1" />
          </>
        ) : (
          Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex h-10 shrink-0 items-center gap-2.5">
              <Skeleton className="h-4.5 w-11 shrink-0" />
              <Skeleton className="h-3.5 min-w-0 flex-1" />
              <Skeleton className="h-3.5 w-9 shrink-0" />
            </div>
          ))
        )}
      </div>
    )
  }
  if (!error) return null
  return (
    <div className="absolute inset-x-0 top-0 grid h-52 place-items-center">
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
}

export { PanelStates, ScoreFallback }
