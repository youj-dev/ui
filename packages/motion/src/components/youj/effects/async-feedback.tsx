'use client'

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { m, type TargetAndTransition } from 'motion/react'
import { useYouj, type Youj } from '@youj/core/lib/youj/provider'
import { useComponentLabels } from '@youj/core/lib/youj/use-component-labels'
import { asyncFeedbackLabels } from '@youj/core/labels'
import { MotionFeatures } from '@youj/core/lib/youj/features'
import { MorphLabel } from '../transitions/morph-label'

/* Feedback for async controls: idle → pending → success | error → idle.
 * - useAsyncAction runs the work. It guards synchronously, so a double click
 *   inside one frame can't start two actions, treats a synchronous throw as an
 *   error, and never updates state after unmount. A success holds off presses
 *   until it's back at idle (no double submit); an error can be retried at
 *   once, say after fixing the input, and the retry takes over from it.
 * - AsyncFeedback is what the control shows: the label morphs to a spinner,
 *   then to a drawn check or cross with its label; an error shakes with a
 *   decaying 4/3/2 px amplitude; success and error tint the surface.
 * - AsyncAnnouncer speaks it: pending and success politely, errors assertively.
 *   Render it next to the control, not inside it (a button flattens its content). */

export type AsyncState = 'idle' | 'pending' | 'success' | 'error'

export interface AsyncActionOptions {
  /** How long success / error hold before returning to idle, in ms. Default: 3 × the deliberate token. */
  resetAfter?: number
  /** Fires on every state change. */
  onStateChange?: (state: AsyncState) => void
}

/**
 * Runs async work and reports its state, with what the last run resolved with
 * (`result`) or rejected with (`error`), which a label can use. `run` is
 * ignored while an action is in flight or holding a success; an error can be
 * retried at once.
 */
export function useAsyncAction(onAction: () => unknown, { resetAfter, onStateChange }: AsyncActionOptions = {}) {
  const k = useYouj()
  const [state, setState] = useState<AsyncState>('idle')
  const [outcome, setOutcome] = useState<{ result?: unknown; error?: unknown }>({})
  const busy = useRef(false)
  const mounted = useRef(true)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const onStateChangeRef = useRef(onStateChange)
  onStateChangeRef.current = onStateChange

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      clearTimeout(timer.current)
    }
  }, [])

  const go = (next: AsyncState) => {
    if (!mounted.current) return
    setState(next)
    onStateChangeRef.current?.(next)
  }

  const settle = (outcome: 'success' | 'error') => {
    go(outcome)
    if (outcome === 'error') busy.current = false
    timer.current = setTimeout(() => {
      busy.current = false
      go('idle')
    }, resetAfter ?? k.ms('deliberate') * 3)
  }

  const run = () => {
    if (busy.current) return
    // A retry during the error hold: its reset to idle would land mid-action.
    clearTimeout(timer.current)
    busy.current = true
    go('pending')
    let work: Promise<unknown>
    try {
      work = Promise.resolve(onAction())
    } catch (error) {
      work = Promise.reject(error)
    }
    work.then(
      (result) => {
        if (mounted.current) setOutcome({ result })
        settle('success')
      },
      (error: unknown) => {
        if (mounted.current) setOutcome({ error })
        settle('error')
      },
    )
  }

  return { state, run, ...outcome }
}

export interface AsyncFeedbackProps {
  state: AsyncState
  /** What the control shows at rest. */
  children: ReactNode
  /** Shown instead of the spinner when motion is reduced. Default: the `working` label, "Working…". */
  pendingLabel?: string
  /** Shown next to the check. Default: the `done` label, "Done". */
  successLabel?: string
  /** Shown next to the cross. Default: the `failed` label, "Failed". */
  errorLabel?: string
  /** Replace the spinner, check or cross. */
  icons?: Partial<Record<'pending' | 'success' | 'error', ReactNode>>
  /** Wash the surface in success / danger while settled. Needs a `relative overflow-hidden` parent. Default true. */
  tint?: boolean
}

/** The visible half of async feedback. Place inside the control, ideally a `useMorphRoot` box. */
export function AsyncFeedback({
  state,
  children,
  pendingLabel,
  successLabel,
  errorLabel,
  icons,
  tint = true,
}: AsyncFeedbackProps) {
  const k = useYouj()
  const labels = useComponentLabels(asyncFeedbackLabels)
  pendingLabel ??= labels.working
  successLabel ??= labels.done
  errorLabel ??= labels.failed
  const scope = useRef<HTMLSpanElement>(null)

  // Precise decaying shake: 4 px, 3 px, 2 px, home. Keyed on state alone, so
  // only the transition into error shakes; before paint, so it starts on the
  // error's first frame. A plain Web Animation: it needs none of Motion's
  // engine, and the eased segments match Motion's per-keyframe easing.
  useLayoutEffect(() => {
    if (state !== 'error' || k.reduced || !scope.current?.animate) return
    const easing = `cubic-bezier(${k.ease('standard').join(',')})` // youj-allow: the standard ease token, serialized for WAAPI
    const shake = [0, -4, 4, -3, 3, -2, 0].map((x) => ({ transform: `translateX(${x}px)`, easing }))
    const animation = scope.current.animate(shake, { duration: k.ms('slow') })
    return () => animation.cancel()
  }, [state])

  const settled = state === 'success' || state === 'error'
  const content = {
    idle: children,
    // The spinner is aria-hidden: the label stays in the control's name.
    pending: k.reduced ? (
      pendingLabel
    ) : (
      icons?.pending ?? (
        <>
          <PendingMark />
          <span className="sr-only">{pendingLabel}</span>
        </>
      )
    ),
    success: (
      <>
        {icons?.success ?? <StatusMark kind="success" />}
        {successLabel}
      </>
    ),
    error: (
      <>
        {icons?.error ?? <StatusMark kind="error" />}
        {errorLabel}
      </>
    ),
  }[state]

  return (
    <MotionFeatures>
      {tint && (
        <>
          {/* State tints ride on opacity so nothing but compositing changes. Plain CSS, so they follow the state with Motion's engine absent too (YoujProvider's motion={false}). */}
          <span
            aria-hidden
            className="absolute inset-0 bg-success transition-opacity yj-duration-fast ease-standard"
            style={{ opacity: state === 'success' ? 1 : 0 }}
          />
          <span
            aria-hidden
            className="absolute inset-0 bg-danger transition-opacity yj-duration-fast ease-standard"
            style={{ opacity: state === 'error' ? 1 : 0 }}
          />
        </>
      )}
      <MorphLabel ref={scope} value={state} contentClassName={settled ? 'gap-1.5' : undefined}>
        {content}
      </MorphLabel>
    </MotionFeatures>
  )
}

export interface AsyncAnnouncerProps {
  state: AsyncState
  /** Default: the `working` label, "Working…". */
  pendingLabel?: string
  /** Default: the `done` label, "Done". */
  successLabel?: string
  /** Default: the `failed` label, "Failed". */
  errorLabel?: string
}

/** Live regions for async feedback: pending and success are polite, errors assertive. */
export function AsyncAnnouncer({
  state,
  pendingLabel,
  successLabel,
  errorLabel,
}: AsyncAnnouncerProps) {
  const labels = useComponentLabels(asyncFeedbackLabels)
  const message = {
    idle: '',
    pending: pendingLabel ?? labels.working,
    success: successLabel ?? labels.done,
    error: errorLabel ?? labels.failed,
  }[state]
  return (
    <>
      <span role="status" aria-live="polite" className="sr-only">
        {state === 'error' ? '' : message}
      </span>
      <span role="alert" aria-live="assertive" className="sr-only">
        {state === 'error' ? message : ''}
      </span>
    </>
  )
}

/** A quarter arc on a faint track, turning at a constant rate. */
function PendingMark() {
  const k = useYouj()
  return (
    <MotionFeatures>
      <m.svg
        aria-hidden
        viewBox="0 0 16 16"
        className="size-4"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, type: 'tween', ease: k.ease('linear'), duration: k.duration('deliberate') * 1.25 }}
      >
        <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
        <path d="M8 2a6 6 0 0 1 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </m.svg>
    </MotionFeatures>
  )
}

/* The success and error marks. Motion owns no icon set (@youj/icons is
 * built on motion, not the reverse), so the two marks are drawn here: the same
 * strokes as CheckIcon and a cross, on the icon grid (24, round caps, weight
 * from --yj-icon-weight). A stroke draws on with opacity riding along, so a
 * round cap never shows as a dot at length zero; reduced motion draws it
 * finished. The `icons` prop replaces either. */
const FULL_DRAW = 1.03
const STROKES = {
  success: ['M4 12.5 L9 17.5 L20 6.5'],
  error: ['M7 7 L17 17', 'M17 7 L7 17'],
}

function draw(k: Youj, kind: keyof typeof STROKES, index: number, settle: boolean): TargetAndTransition {
  if (k.reduced) return { pathLength: FULL_DRAW, opacity: 1, transition: { type: false } }
  // Success lands with the emphasized ease and a settle on scale (arrival); error draws its two strokes in quick succession, no overshoot.
  const token = kind === 'success' ? 'slow' : 'fast'
  const delay = index * k.stagger('base') * 2
  return {
    pathLength: [0, FULL_DRAW],
    opacity: [0, 1],
    ...(settle && { scale: [0.88, 1] }),
    transition: {
      pathLength: { ...k.tween(token, kind === 'success' ? 'emphasized' : 'enter'), delay },
      opacity: { ...k.tween('instant', 'linear'), delay },
      ...(settle && { scale: { ...k.spring('settle'), delay: k.duration('base') } }),
    },
  }
}

function StatusMark({ kind }: { kind: keyof typeof STROKES }) {
  const k = useYouj()
  // Success settles on scale after the draw: the one arrival that earns a bounce.
  const settle = kind === 'success' && !k.reduced
  return (
    <m.svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="youj-icon shrink-0"
      style={{ strokeWidth: 'calc(2 * var(--yj-icon-weight, 1))' }}
      data-icon={kind === 'success' ? 'check' : 'cross'}
      aria-hidden
      focusable="false"
    >
      {STROKES[kind].map((d, i) => (
        <m.path key={d} d={d} animate={draw(k, kind, i, settle)} style={settle ? { originX: 0.5, originY: 0.5, transformBox: 'view-box' } : undefined} />
      ))}
    </m.svg>
  )
}
