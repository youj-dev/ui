'use client'

import type { ReactNode } from 'react'
import { MorphLabel } from '@youj/motion'
import { cn } from '../../../lib/utils'
import { lastReached, stageOf, type StepTrackerCopy, type StepTrackerItem, type StepTrackerStage } from './data'
import type { JourneyView } from './use-journey'

/* Where the parcel is, said the way a carrier's page says it: who it's for,
 * one headline in light type (on its way, delivered, returned) with a dot in
 * its tone, and the latest scan under it. While the journey plays the
 * headline and the scan crossfade from stage to stage (MorphLabel), on one
 * line each, so nothing around them moves. Beside it, the order in three
 * quiet figures: its total, how long it took from order to door (or until it
 * was stopped) and how many delivery attempts it needed. */

interface StepSummaryProps {
  item: StepTrackerItem
  stages: StepTrackerStage[]
  view: JourneyView
  copy: StepTrackerCopy
  format: {
    /** A moment after the order, as a date and time. */
    when: (msAfter: number) => string
    money: (amount: number) => string
    days: (ms: number) => string
  }
}

export function StepSummary({ item, stages, view, copy, format }: StepSummaryProps) {
  const scans = item.scans
  const here = scans[view.at]!
  const state = view.states[view.at]
  const refused = state === 'failed' && here.outcome === 'failed'
  const missed = state === 'failed' && !refused
  // Over: the parcel has reached the end of its road (before the journey plays it waits at the order).
  const over = state === 'done' && view.at === lastReached(item)
  const headline = refused ? copy.outcome.stopped : missed ? copy.attemptMissed : over ? copy.outcome[item.outcome] : (stageOf(stages, here.id).now ?? stageOf(stages, here.id).label)
  const tone = refused ? 'bg-danger' : missed ? 'bg-warning' : over ? 'bg-success' : 'bg-accent'

  // The latest scan: this stage's once it's reached (a missed attempt's while it waits), else the one before.
  const scanned = view.states.reduce((last, s, i) => (s === 'done' || s === 'failed' ? i : last), 0)
  const scan = scans[scanned]!
  const miss = missed ? scan.attempts?.find((a) => !a.ok) : undefined
  const latest = copy.lastScan(format.when(miss?.at ?? scan.at), scan.place ?? '')

  const stopped = scans.find((s) => s.outcome === 'failed')
  // The attempts it took: the stop that was retried, else one for a road that ran to its end, none for one that stopped.
  const finished = scans.at(-1)!.outcome === 'ok'
  const tries = stopped || !finished ? 0 : (scans.find((s) => (s.attempts?.length ?? 0) > 1)?.attempts?.length ?? 1)

  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
      <div className="flex min-w-0 flex-col gap-1">
        <p className="truncate text-ui-sm text-fg-muted">
          {item.subject} · {item.place}
        </p>
        <p data-slot="step-status" className="flex min-w-0 items-center gap-2.5 text-xl font-normal tracking-tight text-fg">
          <span aria-hidden className={cn('size-2 shrink-0 rounded-full transition-colors yj-duration-base ease-standard', tone)} />
          <MorphLabel value={headline}>{headline}</MorphLabel>
        </p>
        <p className="text-ui-sm text-fg-muted tabular-nums">
          <MorphLabel value={latest}>{latest}</MorphLabel>
        </p>
      </div>
      <dl aria-label={copy.summary} className="flex flex-wrap gap-x-8 gap-y-2">
        <Figure label={copy.total}>{format.money(item.total)}</Figure>
        <Figure label={stopped ? copy.stoppedAfter : copy.doorToDoor}>{format.days((stopped ?? (finished ? scans.at(-1) : undefined))?.at ?? 0)}</Figure>
        <Figure label={copy.attempts}>
          {tries}
          {tries > 1 && <span className="text-warning-text"> · {copy.missed(tries - 1)}</span>}
          {!tries && <span className="text-fg-muted"> · {copy.neverOut}</span>}
        </Figure>
      </dl>
    </div>
  )
}

function Figure({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-ui-xs text-fg-muted">{label}</dt>
      <dd className="text-ui text-fg tabular-nums">
        <bdi>{children}</bdi>
      </dd>
    </div>
  )
}
