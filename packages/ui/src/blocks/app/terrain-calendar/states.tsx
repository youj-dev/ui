'use client'

import type { ReactNode } from 'react'
import { Alert, AlertAction, AlertDescription } from '../../../components/ui/alert'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '../../../components/ui/empty'
import { Kbd } from '../../../components/ui/kbd'
import { Skeleton } from '../../../components/ui/skeleton'
import { Stat, StatBars, StatGroup, StatNote, StatValue } from '../../../components/ui/stat-card'
import { cn } from '../../../lib/utils'
import type { TerrainCalendarCopy } from './data'
import { frameOf } from './geometry'

/* What stands in for the stats and the terrain's card while the days load,
 * fail to load or are none, at the size of the real ones: the same tiles and
 * card, with skeleton figures and a skeleton landscape (a column per week) while
 * loading, a dash for each figure beside the message otherwise. */

export type TerrainState = 'loading' | 'error' | 'empty'

/** Weeks the placeholder draws, as long as the demo's half year. */
const WEEKS = 24

/** The three tiles at the real ones' height: a hidden copy of a tile's parts holds the room, with skeleton figures or a dash over it. */
export function StatsPlaceholder({ state, copy }: { state: TerrainState; copy: TerrainCalendarCopy }) {
  const loading = state === 'loading'
  const labels = [copy.week('—'), copy.streak, copy.peak]
  return (
    <StatGroup aria-label={copy.title} aria-busy={loading || undefined} className="grid-cols-1 sm:grid-cols-3">
      {labels.map((label, i) => (
        <Stat key={label} label={label}>
          <div className="relative flex flex-col gap-1">
            <div aria-hidden className="invisible flex flex-col gap-1">
              <StatValue value={0} />
              <StatNote>&nbsp;</StatNote>
              {i === 0 && <StatBars data={Array.from({ length: WEEKS }, () => 1)} />}
            </div>
            {loading ? (
              <div aria-hidden className="absolute inset-0 flex flex-col gap-1">
                <Skeleton className="h-7 w-28" />
                <Skeleton className="h-4 w-36" />
                {i === 0 && <Skeleton className="mt-1 flex-1" />}
              </div>
            ) : (
              <span data-slot="stat-value" className="absolute top-0 start-0 text-2xl leading-[1.1] font-semibold text-fg-subtle">
                —
              </span>
            )}
          </div>
        </Stat>
      ))}
    </StatGroup>
  )
}

/** A landscape of skeleton columns: one per week, rolling like a ridge. */
function Ridge() {
  return (
    <div aria-hidden className="absolute inset-x-[4%] bottom-[10%] top-[10%] flex items-end gap-[1.5%]">
      {Array.from({ length: WEEKS }, (_, i) => (
        <Skeleton
          key={i}
          className="flex-1 rounded-xs"
          style={{ height: `${28 + 52 * Math.abs(Math.sin(i * 0.55 + 0.6)) * (0.6 + 0.4 * Math.cos(i * 0.21))}%` }}
        />
      ))}
    </div>
  )
}

interface CardPlaceholderProps {
  state: TerrainState
  copy: TerrainCalendarCopy
  error?: string
  onRetry?: () => void
  empty?: ReactNode
}

/** The terrain's card with the drawing's room and the readout's column held. */
export function CardPlaceholder({ state, copy, error, onRetry, empty }: CardPlaceholderProps) {
  const frame = frameOf(7, WEEKS)
  return (
    <Card className="gap-0 overflow-hidden py-0 text-fg">
      <CardHeader className="border-b border-line py-4">
        <CardTitle>{copy.terrain}</CardTitle>
        <CardDescription>
          <span aria-hidden className="text-fg-subtle">
            —
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 py-(--card-spacing) lg:grid-cols-[minmax(0,1fr)_--spacing(64)] lg:items-center">
        <div className="relative w-full" style={{ aspectRatio: `${frame.width} / ${frame.height}` }}>
          {state === 'loading' && (
            <>
              <span className="sr-only">{copy.loadingLabel}</span>
              <Ridge />
            </>
          )}
          {state === 'error' && (
            <div className="absolute inset-0 grid place-items-center">
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
            </div>
          )}
          {state === 'empty' && (
            <div className="absolute inset-0 grid">
              {empty ?? (
                <Empty className="rounded-lg border border-dashed border-line">
                  <EmptyHeader>
                    <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
                    <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </div>
          )}
        </div>
        <div aria-hidden className={cn('hidden flex-col gap-3 lg:flex', state !== 'loading' && 'invisible')}>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-2 w-full" />
        </div>
      </CardContent>
      <CardFooter className="flex-wrap justify-between gap-x-6 gap-y-3">
        <div className="me-auto flex items-center gap-2 text-ui-sm text-fg-muted">
          <span className="font-mono">0</span>
          <Skeleton className="h-1.5 w-24 rounded-full" />
          <span className="font-mono">—</span>
        </div>
        <div aria-label={copy.hintsLabel} className="hidden items-center gap-3 text-ui-sm text-fg-muted sm:flex">
          <span className="flex items-center gap-1.5">
            <Kbd>←</Kbd>
            <Kbd>→</Kbd>
            {copy.hints.weeks}
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            {copy.hints.days}
          </span>
        </div>
      </CardFooter>
    </Card>
  )
}
