'use client'

import { useEffect, useRef, type CSSProperties, type KeyboardEvent } from 'react'
import { useYouj } from '@youj/core'
import { cn } from '../../../lib/utils'
import { stageOf, type StepTrackerCopy, type StepTrackerItem, type StepTrackerStage, type StepTrackerStepState } from './data'
import type { JourneyView } from './use-journey'

/* The parcel's road: six scans on one hairline. The line fills in the accent
 * up to where the parcel is (a `scale` on the slow token), and while the
 * journey plays the parcel rides it as a dot with a soft halo (a `translate`
 * on the same token), so the compositor moves both. A missed delivery sends
 * it round a small dashed loop hung under the stage and back in for the next
 * day's try; a refused stage turns the line the danger tone and dashes out
 * the rest. Under each stop sit its name and scan time, set small and light;
 * on a narrow card only the stops show and the detail below names the one
 * picked. Each stop is a button (one tab stop, arrows move along the road,
 * mirrored in RTL) that opens it in the detail. Nothing here changes size as
 * the parcel moves: times fade in where their room is already kept. */

const DOT: Record<StepTrackerStepState, string> = {
  pending: 'border-line-strong bg-surface',
  active: 'border-accent bg-surface',
  done: 'border-accent bg-accent',
  failed: 'border-danger bg-danger',
  skipped: 'scale-75 border-dashed border-line-strong bg-surface',
}

/** The retry loop, from the stage's stop: down, back under the rail, up behind the stop and into it again. */
const LOOP: [number, number][][] = [
  [
    [0, 0],
    [0, 10],
    [-7, 15],
    [-18, 15],
  ],
  [
    [-18, 15],
    [-29, 15],
    [-36, 10],
    [-36, 5],
  ],
  [
    [-36, 5],
    [-36, 1],
    [-32, 0],
    [-27, 0],
  ],
  [
    [-27, 0],
    [-18, 0],
    [-9, 0],
    [0, 0],
  ],
]

const LOOP_PATH = `M0 0 ${LOOP.map((c) => `C${c[1]!.join(' ')} ${c[2]!.join(' ')} ${c[3]!.join(' ')}`).join(' ')}`

/** Points along the loop, evenly in its parameter: close enough to even speed at this size. */
function loopFrames() {
  const frames: Keyframe[] = []
  LOOP.forEach((c, s) => {
    for (let i = s === 0 ? 0 : 1; i <= 8; i++) {
      const t = i / 8
      const u = 1 - t
      const w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t]
      const x = w.reduce((sum, wi, j) => sum + wi * c[j]![0], 0)
      const y = w.reduce((sum, wi, j) => sum + wi * c[j]![1], 0)
      frames.push({ transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)` })
    }
  })
  return frames
}

interface RailProps {
  item: StepTrackerItem
  stages: StepTrackerStage[]
  view: JourneyView
  selected: number
  onSelect: (index: number) => void
  copy: StepTrackerCopy
  /** Each stage's scan time and place, formatted. */
  time: (index: number) => string
  figure: (index: number) => string
  /** The detail's id. */
  controls: string
}

export function Rail({ item, stages, view, selected, onSelect, copy, time, figure, controls }: RailProps) {
  const k = useYouj()
  const scans = item.scans
  const last = scans.length - 1
  const retry = scans.findIndex((s) => s.attempts?.some((a) => !a.ok))
  const token = useRef<HTMLSpanElement>(null)
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const refused = view.states.some((s, i) => s === 'failed' && scans[i]!.outcome === 'failed')
  const alarm = view.states[view.at] === 'failed' || view.looping

  // Round the loop once each time the token takes it.
  useEffect(() => {
    const el = token.current
    if (!view.looping || !el || typeof el.animate !== 'function') return
    const easing = `cubic-bezier(${k.ease('standard').join(',')})` // youj-allow: the standard token's own curve, for a Web Animation
    const run = el.animate(loopFrames(), { duration: k.ms('deliberate') * 1.8, easing })
    return () => run.cancel()
  }, [view.looping, k])

  const move = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const rtl = getComputedStyle(e.currentTarget).direction === 'rtl'
    const next = rtl ? 'ArrowLeft' : 'ArrowRight'
    const prev = rtl ? 'ArrowRight' : 'ArrowLeft'
    const to = e.key === 'Home' ? 0 : e.key === 'End' ? last : e.key === next ? index + 1 : e.key === prev ? index - 1 : null
    if (to === null) return
    e.preventDefault()
    const target = Math.max(0, Math.min(last, to))
    onSelect(target)
    buttons.current[target]?.focus()
  }

  return (
    <div
      className="relative"
      style={{ '--n': scans.length, '--p': view.at / last, '--travel': `${k.reduced ? 0 : k.ms('deliberate')}ms` } as CSSProperties}
    >
      {/* From the first stop's centre to the last's; drawn left to right and mirrored as a whole in RTL. */}
      <div aria-hidden data-slot="step-rail" className="pointer-events-none absolute inset-x-[calc(100%/(var(--n)*2))] top-3 h-0 rtl:-scale-x-100">
        {scans.slice(1).map((s, i) => (
          <span
            key={s.id}
            style={{ '--a': i / last, '--b': 1 / last } as CSSProperties}
            className={cn(
              // youj-allow: physical side, the rail mirrors as a whole (rtl:-scale-x-100)
              'absolute top-0 left-[calc(var(--a)*100%)] w-[calc(var(--b)*100%)] -translate-y-1/2 border-t transition-[border-color] yj-duration-base ease-standard',
              view.states[i + 1] === 'skipped' ? 'border-dashed border-line-strong' : 'border-line',
            )}
          />
        ))}
        {/* The road travelled: one line scaled to the parcel's place. */}
        <span
          data-slot="step-progress"
          className={cn(
            'absolute inset-x-0 top-0 h-0.5 -translate-y-1/2 origin-left rounded-full [scale:var(--p)_1] transition-[scale,background-color] duration-(--travel) ease-standard',
            refused ? 'bg-danger' : 'bg-accent',
          )}
        />
        {retry >= 0 && (
          <svg
            data-slot="step-retry-loop"
            style={{ '--r': retry / last } as CSSProperties}
            className={cn(
              // youj-allow: physical side, the rail mirrors as a whole (rtl:-scale-x-100)
              'absolute top-0 left-[calc(var(--r)*100%)] size-px overflow-visible fill-none stroke-warning [stroke-dasharray:2_3] [stroke-linecap:round] transition-opacity duration-(--travel) ease-standard',
              view.retried ? 'opacity-100' : 'opacity-0',
            )}
          >
            <path d={LOOP_PATH} />
          </svg>
        )}
        {/* The parcel: a wrapper as long as the rail, translated by its share of it. */}
        <span className="absolute inset-x-0 top-0 h-0 [translate:calc(var(--p)*100%)_0] transition-[translate] duration-(--travel) ease-standard">
          <span
            ref={token}
            data-slot="step-token"
            className={cn(
              // youj-allow: physical side, the rail mirrors as a whole (rtl:-scale-x-100)
              'absolute top-0 left-0 size-3 -translate-1/2 rounded-full ring-4 transition-[opacity,background-color,box-shadow] yj-duration-base ease-standard',
              alarm ? 'bg-warning ring-warning-subtle' : 'bg-accent ring-accent-subtle',
              view.playing ? 'opacity-100' : 'opacity-0',
            )}
          />
        </span>
      </div>

      <ol aria-label={copy.journey(item.ref)} className="relative grid grid-cols-[repeat(var(--n),minmax(0,1fr))]">
        {scans.map((stage, i) => {
          const state = view.states[i] ?? 'pending'
          const reached = state === 'done' || state === 'failed'
          // A missed delivery the stage will retry is a warning, not the end of the road.
          const missed = state === 'failed' && stage.outcome === 'ok'
          const attempts = stage.attempts?.length ?? 0
          return (
            <li key={stage.id} className="flex min-w-0">
              <button
                ref={(el) => {
                  buttons.current[i] = el
                }}
                type="button"
                data-state={state}
                aria-pressed={i === selected}
                aria-controls={controls}
                aria-current={i === view.at ? 'step' : undefined}
                aria-label={[
                  stageOf(stages, stage.id).label,
                  copy.states[state],
                  reached ? time(i) : null,
                  state === 'done' && attempts > 1 ? copy.tries(attempts) : null,
                  reached ? figure(i) : null,
                ]
                  .filter(Boolean)
                  .join(', ')}
                tabIndex={i === selected ? 0 : -1}
                onClick={() => onSelect(i)}
                onFocus={() => onSelect(i)}
                onKeyDown={(e) => move(e, i)}
                className="group/stage relative flex min-h-6 w-full min-w-0 cursor-default flex-col items-center gap-0.5 rounded-md px-1 pt-8 pb-1 text-center focus-ring @max-lg/track:pt-6"
              >
                <span
                  aria-hidden
                  className={cn(
                    'absolute start-1/2 top-3 size-2.5 -translate-1/2 rounded-full border-2 transition-[background-color,border-color,scale] yj-duration-base ease-standard rtl:translate-x-1/2',
                    'group-hover/stage:scale-125',
                    missed ? 'border-warning bg-warning' : DOT[state],
                  )}
                />
                <span
                  className={cn(
                    'max-w-full truncate text-ui-sm transition-colors yj-duration-base ease-standard @max-lg/track:sr-only',
                    i === selected ? 'text-fg' : 'text-fg-muted group-hover/stage:text-fg',
                    state === 'skipped' && 'text-fg-subtle',
                  )}
                >
                  {stageOf(stages, stage.id).label}
                </span>
                <span
                  aria-hidden
                  className={cn(
                    'max-w-full truncate text-ui-xs text-fg-subtle tabular-nums transition-opacity yj-duration-base ease-standard @max-lg/track:hidden',
                    state === 'failed' && (missed ? 'text-warning-text' : 'text-danger-text'),
                    reached ? 'opacity-100' : 'opacity-0',
                  )}
                >
                  {/* A non-breaking space keeps the line's room before the scan. */}
                  <bdi>{reached ? time(i) : ' '}</bdi>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
