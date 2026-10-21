'use client'

import { type CSSProperties, type ReactNode } from 'react'
import { AnimatePresence, m, useIsPresent } from 'motion/react'
import { MotionFeatures, useYouj } from '@youj/core'
import { cn } from '../../../lib/utils'
import { stageOf, type StepTrackerCopy, type StepTrackerItem, type StepTrackerStage, type StepTrackerStepState } from './data'

/* The picked stage up close, in a recessed strip under the rail whose caret
 * glides to the stop it describes: the stage, where and when it was
 * scanned, then its facts as label and value on one line each (a missed
 * delivery adds its attempt, and while it waits for the retry that is all it
 * shows). A stage the parcel hasn't reached says so; one it never will says
 * where it stopped.
 * The strip never changes height: its rows are counted from the data (the
 * most any stage of any item needs), and a new stage crossfades into
 * the same rows, so nothing below it moves as the parcel does. Reduced
 * motion: the caret jumps and the stage changes in place. */

const TONE: Record<StepTrackerStepState, string> = {
  pending: 'border border-line-strong',
  active: 'border border-accent',
  done: 'bg-accent',
  failed: 'bg-danger',
  skipped: 'border border-dashed border-line-strong',
}

/** The rows the strip keeps for every stage: its facts and missed attempts, or a sentence and the attempts while a retry waits. */
export const detailRows = (items: StepTrackerItem[]) =>
  Math.max(
    1,
    ...items.flatMap((s) =>
      s.scans.map((stage) => {
        const misses = stage.attempts?.filter((a) => !a.ok).length ?? 0
        return Math.max(stage.facts.length, 1) + misses
      }),
    ),
  )

interface StepDetailProps {
  /** The panel the rail's stops control. */
  id: string
  item: StepTrackerItem
  stages: StepTrackerStage[]
  index: number
  state: StepTrackerStepState
  copy: StepTrackerCopy
  /** A moment after the order, as a date and time. */
  when: (msAfter: number) => string
  /** How many rows to keep (detailRows). */
  rows: number
  /** The stage's heading, one level under the block's title. */
  Heading: 'h2' | 'h3'
}

export function StepDetail({ id, item, stages, index, state, copy, when, rows, Heading }: StepDetailProps) {
  const k = useYouj()
  const last = item.scans.length - 1
  const body = <Body item={item} stages={stages} index={index} state={state} copy={copy} when={when} Heading={Heading} />
  return (
    <div
      id={id}
      data-slot="step-detail"
      className="relative rounded-lg bg-well px-4 py-3"
      style={{ '--n': item.scans.length, '--s': index / last, '--rows-n': rows, '--rows-w': Math.ceil(rows / 2), '--glide': `${k.reduced ? 0 : k.ms('slow')}ms` } as CSSProperties}
    >
      {/* The caret, under the stop it describes: placed like the rail's parcel, and mirrored with it in RTL. */}
      <span aria-hidden className="pointer-events-none absolute inset-x-[calc(100%/(var(--n)*2))] top-0 h-0 rtl:-scale-x-100">
        <span className="absolute inset-x-0 top-0 h-0 [translate:calc(var(--s)*100%)_0] transition-[translate] duration-(--glide) ease-standard">
          {/* youj-allow: physical side, the caret mirrors with its track (rtl:-scale-x-100) */}
          <span className="absolute top-0 left-0 size-2.5 -translate-1/2 rotate-45 rounded-xs bg-well" />
        </span>
      </span>
      {k.reduced ? (
        body
      ) : (
        <MotionFeatures>
          <div className="grid *:col-start-1 *:row-start-1">
            <AnimatePresence initial={false}>
              <Layer key={`${item.id}-${index}-${state}`}>{body}</Layer>
            </AnimatePresence>
          </div>
        </MotionFeatures>
      )}
    </div>
  )
}

/** One stage's content: it resolves in as the last one fades, in the same rows; on its way out it is hidden from assistive tech. */
function Layer({ children }: { children: ReactNode }) {
  const k = useYouj()
  const present = useIsPresent()
  return (
    <m.div
      aria-hidden={!present || undefined}
      inert={!present}
      initial={{ opacity: 0, filter: 'blur(2px)' }}
      animate={{ opacity: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' }, transition: k.tween('base', 'enter') }}
      exit={{ opacity: 0, transition: k.tween('fast', 'exit') }}
      className="min-w-0"
    >
      {children}
    </m.div>
  )
}

const ROWS = 'grid grid-cols-1 grid-flow-col grid-rows-[repeat(var(--rows-n),1lh)] gap-x-6 gap-y-1 text-ui-sm @lg/track:grid-cols-2 @lg/track:grid-rows-[repeat(var(--rows-w),1lh)]'

function Body({ item, stages, index, state, copy, when, Heading }: Omit<StepDetailProps, 'id' | 'rows'>) {
  const stage = item.scans[index]!
  const def = stageOf(stages, stage.id)
  const stopped = item.scans.find((s) => s.outcome === 'failed')
  // A missed delivery the stage will retry: its attempts so far, not how it ended.
  const interim = state === 'failed' && stage.outcome === 'ok'
  const reached = state === 'done' || (state === 'failed' && !interim)
  const misses = (stage.attempts ?? []).filter((a) => !a.ok)
  const at = interim ? misses[0]?.at : reached ? stage.at : undefined
  const message = interim ? copy.retrying : state === 'skipped' && stopped ? copy.skippedBecause(stageOf(stages, stopped.id).label) : state === 'active' ? copy.working : copy.notReached
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <span aria-hidden className={cn('size-2 shrink-0 rounded-full', TONE[state], interim && 'bg-warning')} />
        {def.icon && <def.icon size={16} />}
        <Heading className="shrink-0 text-ui font-medium text-fg">{def.label}</Heading>
        {(reached || interim) && stage.place && <span className="min-w-0 truncate text-ui-sm text-fg-muted">{stage.place}</span>}
        <span className="ms-auto shrink-0 ps-3 text-ui-sm text-fg-muted tabular-nums">{at === undefined ? copy.states[state] : when(at)}</span>
      </div>
      {reached ? (
        <dl className={ROWS}>
          {stage.facts.map(([label, value]) => (
            <Row key={label} label={label} title={value}>
              <span className="text-fg">{value}</span>
            </Row>
          ))}
          {misses.map((attempt, n) => (
            <Row key={n} label={copy.attempt(n + 1)} title={attempt.reason}>
              <span className="text-warning-text">{when(attempt.at)}</span>
              <span className="text-fg-muted"> · {attempt.reason}</span>
            </Row>
          ))}
        </dl>
      ) : (
        <div className={ROWS}>
          <p className={cn('col-span-full truncate', interim ? 'text-warning-text' : 'text-fg-muted')}>{message}</p>
          {interim && (
            <dl className="contents">
              {misses.map((attempt, n) => (
                <Row key={n} label={copy.attempt(n + 1)} title={attempt.reason}>
                  <span className="text-fg-muted">{attempt.reason}</span>
                </Row>
              ))}
            </dl>
          )}
        </div>
      )}
    </div>
  )
}

/** A label and its value on one line; a value too long for it ends in an ellipsis and shows whole on hover. */
function Row({ label, title, children }: { label: string; title: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-baseline gap-3">
      <dt className="w-20 shrink-0 truncate text-fg-muted">{label}</dt>
      <dd title={title} className="min-w-0 truncate">
        {children}
      </dd>
    </div>
  )
}
