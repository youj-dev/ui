'use client'

import { useEffect, useId, useRef, useState, type ComponentProps, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { animate, type AnimationPlaybackControls } from 'motion/react'
import { CheckIcon } from '@youj/icons/components/youj/icons/check'
import { ChevronRightIcon } from '@youj/icons/components/youj/icons/chevron-right'
import { XIcon } from '@youj/icons/components/youj/icons/x'
import { useSoundCue } from '@youj/core'
import { AsyncAnnouncer, type AsyncState } from '@youj/motion'
import { useDirection, useYouj } from '@youj/core/lib/youj/provider'
import { useComponentLabels } from '@youj/core/labels'
import { slideToConfirmLabels } from '@youj/core/labels'
import { clamp, cn } from '../../lib/utils'
import { Spinner } from './spinner'

/* A confirmation that takes a deliberate gesture: drag the thumb along the
 * track to its end. It is a slider (the thumb's position is its value) with
 * an action at the end, so it's built as one: role="slider" on the thumb,
 * arrows/Home/End move it, and Enter at the end confirms. Short of the end it
 * springs back. The thumb follows the pointer 1:1; only the spring back and
 * the snap to the end are animated, on the provider's springs, so Speed and
 * reduced motion reach them. Once confirmed, `onConfirm` runs: the thumb
 * shows the spinner, then a check, and stays; a rejection shows a cross and
 * its message in the track, springs back and returns to rest. */

/** How far along the track (a fraction) a release confirms. */
const THRESHOLD = 0.9
/** One arrow key's step. */
const STEP = 0.1

type SlideToConfirmState = 'idle' | 'confirming' | 'confirmed' | 'error'

interface SlideToConfirmProps extends Omit<ComponentProps<'div'>, 'children' | 'onError'> {
  /**
   * The action, run once the thumb reaches the end. Return a promise to show
   * its progress: the thumb spins until it resolves, then shows a check and
   * stays confirmed. A rejection (or a throw) shows its message in the track,
   * springs the thumb back and lets the person try again.
   */
  onConfirm?: () => unknown
  /** The track's label and the thumb's name. Default "Slide to confirm". */
  label?: string
  /** Shown and announced while `onConfirm` runs. Default "Working…". */
  confirmingLabel?: string
  /** Shown and announced once confirmed. Default "Confirmed". */
  confirmedLabel?: string
  /**
   * Shown in the track and announced assertively when `onConfirm` rejects.
   * Default: the error's message, else "Something went wrong. Try again.". A
   * function gets what it rejected with.
   */
  errorLabel?: string | ((error: unknown) => string)
  /** How long an error shows before the track returns to rest, in ms. Default: 3 × the deliberate token. */
  resetAfter?: number
  /** Blocks the thumb and takes it out of the tab order. */
  disabled?: boolean
  /** `sm | default | lg`: 40, 48 or 56px tall. */
  size?: 'sm' | 'default' | 'lg'
  /** `default` (the accent) or `danger`, for an action that deletes or can't be undone. */
  tone?: 'default' | 'danger'
  /** With sound on (`YoujProvider`’s `sound`), passing the end ticks and the outcome sounds. `false` keeps it silent. Default true. */
  sound?: boolean
}

const sizes = {
  sm: '[--ui--slide-h:var(--spacing-control-lg)] own:text-ui',
  default: '[--ui--slide-h:calc(var(--spacing-control-lg)+--spacing(2))] own:text-ui',
  lg: '[--ui--slide-h:calc(var(--spacing-control-lg)+--spacing(4))] own:text-ui-lg',
}

const tones = {
  default: { fill: 'bg-accent-subtle', thumb: 'own:border-(--ui--fill-edge) own:bg-action own:text-on-action' },
  danger: { fill: 'bg-danger-subtle', thumb: 'own:border-(--ui--fill-edge) own:bg-danger own:text-on-accent' },
}

const feedback: Record<SlideToConfirmState, AsyncState> = { idle: 'idle', confirming: 'pending', confirmed: 'success', error: 'error' }

function SlideToConfirm({
  onConfirm,
  label,
  confirmingLabel,
  confirmedLabel,
  errorLabel,
  resetAfter,
  disabled = false,
  size = 'default',
  tone = 'default',
  sound = true,
  className,
  style,
  ...props
}: SlideToConfirmProps) {
  const k = useYouj()
  const labels = useComponentLabels(slideToConfirmLabels)
  const cue = useSoundCue()
  const rtl = useDirection() === 'rtl'
  const hintId = useId()
  const [value, setValue] = useState(0)
  const [state, setState] = useState<SlideToConfirmState>('idle')
  const [message, setMessage] = useState('')
  const [dragging, setDragging] = useState(false)
  const area = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; from: number; travel: number } | null>(null)
  const current = useRef(0)
  const spring = useRef<AnimationPlaybackControls>(undefined)
  const busy = useRef(false)
  const mounted = useRef(true)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      spring.current?.stop()
      clearTimeout(timer.current)
    }
  }, [])

  const set = (next: number) => {
    // Passing the end is a detent: it ticks once each way.
    if (sound && current.current < THRESHOLD !== next < THRESHOLD) cue('tick')
    current.current = next
    setValue(next)
  }
  // The spring back and the snap to the end; under reduced motion the thumb is just there.
  const settleTo = (target: number) => {
    spring.current?.stop()
    if (k.reduced) {
      current.current = target
      setValue(target)
      return
    }
    spring.current = animate(current.current, target, {
      ...k.spring(target === 1 ? 'snappy' : 'smooth'),
      onUpdate: (v) => {
        current.current = v
        setValue(v)
      },
    })
  }

  const locked = disabled || state === 'confirming' || state === 'confirmed'

  const confirm = () => {
    if (busy.current) return
    busy.current = true
    clearTimeout(timer.current)
    settleTo(1)
    setState('confirming')
    let work: Promise<unknown>
    try {
      work = Promise.resolve(onConfirm?.())
    } catch (error) {
      work = Promise.reject(error)
    }
    work.then(
      () => {
        if (!mounted.current) return
        setState('confirmed')
        if (sound) cue('success')
      },
      (error: unknown) => {
        if (!mounted.current) return
        busy.current = false
        setMessage(
          typeof errorLabel === 'function'
            ? errorLabel(error)
            : errorLabel || (error instanceof Error && error.message) || labels.somethingWentWrong,
        )
        setState('error')
        if (sound) cue('error')
        settleTo(0)
        timer.current = setTimeout(() => setState('idle'), resetAfter ?? k.ms('deliberate') * 3)
      },
    )
  }

  // A new attempt clears the last error's message from the track.
  const begin = () => {
    if (state !== 'error') return
    clearTimeout(timer.current)
    setState('idle')
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (locked || event.button !== 0 || !area.current) return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    spring.current?.stop()
    begin()
    drag.current = { x: event.clientX, from: current.current, travel: Math.max(1, area.current.clientWidth - event.currentTarget.offsetWidth) }
    setDragging(true)
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    set(clamp(d.from + ((event.clientX - d.x) * (rtl ? -1 : 1)) / d.travel, 0, 1))
  }
  const onPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    drag.current = null
    setDragging(false)
    if (event.type === 'pointerup' && current.current >= THRESHOLD) confirm()
    else settleTo(0)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (locked) return
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight'
    const back = rtl ? 'ArrowRight' : 'ArrowLeft'
    let next: number | undefined
    if (event.key === forward || event.key === 'ArrowUp') next = current.current + STEP
    else if (event.key === back || event.key === 'ArrowDown') next = current.current - STEP
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = 1
    else if (event.key === 'Enter' && current.current >= THRESHOLD) {
      event.preventDefault()
      confirm()
      return
    }
    if (next === undefined) return
    event.preventDefault()
    spring.current?.stop()
    begin()
    set(clamp(Math.round(next * 100) / 100, 0, 1))
  }

  const trackLabel = label ?? labels.slideToConfirm
  const shown = { idle: trackLabel, confirming: confirmingLabel ?? labels.working, confirmed: confirmedLabel ?? labels.confirmed, error: message }[state]
  const percent = Math.round(value * 100)
  const icon = size === 'lg' ? 20 : size === 'sm' ? 16 : 18

  return (
    <div
      data-slot="slide-to-confirm"
      data-size={size}
      data-tone={tone}
      data-state={state}
      data-dragging={dragging || undefined}
      data-disabled={disabled || undefined}
      className={cn(
        'relative own:flex h-(--ui--slide-h) w-full own:max-w-sm select-none [--ui--slide-thumb:calc(var(--ui--slide-h)-var(--spacing)*2)]',
        'own:rounded-control-lg own:bg-well own:p-1 own:inset-ring own:inset-ring-line',
        sizes[size],
        'data-disabled:opacity-50',
        className,
      )}
      style={{ ...style, '--ui--slide': value } as CSSProperties}
      {...props}
    >
      {/* Confirmed, the whole track takes the success fill, as an AsyncButton does. */}
      <span
        aria-hidden
        data-slot="slide-to-confirm-success"
        className={cn('absolute inset-0 rounded-[inherit] bg-success transition-opacity yj-duration-fast ease-standard', state === 'confirmed' ? 'opacity-100' : 'opacity-0')}
      />
      <div ref={area} className="relative @container own:flex-1 rounded-[calc(var(--radius-control-lg)-var(--spacing))]">
        {/* The fill runs from the start to the thumb's far edge, so the thumb pushes it along. */}
        <span
          aria-hidden
          data-slot="slide-to-confirm-fill"
          className={cn('absolute inset-y-0 start-0 rounded-[inherit] transition-opacity yj-duration-fast ease-standard', tones[tone].fill, state === 'confirmed' && 'opacity-0')}
          style={{ width: 'calc(var(--ui--slide-thumb) + var(--ui--slide) * (100% - var(--ui--slide-thumb)))' }}
        />
        <span
          aria-hidden
          data-slot="slide-to-confirm-label"
          className={cn(
            'absolute inset-y-0 own:flex items-center justify-center truncate own:font-medium transition-opacity yj-duration-fast ease-standard',
            // At rest the label sits clear of the thumb at the start; at the end, clear of it there.
            state === 'confirming' || state === 'confirmed' ? 'start-0 end-(--ui--slide-thumb)' : 'start-(--ui--slide-thumb) end-0',
            state === 'error' ? 'own:text-danger-text' : state === 'confirmed' ? 'own:text-on-accent' : 'own:text-fg-muted',
          )}
          // The label fades as the thumb passes over it.
          style={{ opacity: state === 'idle' ? clamp(1 - value * 1.6, 0, 1) : 1 }}
        >
          <span className="truncate own:px-3">{shown}</span>
        </span>
        <div
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-label={trackLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-valuetext={state === 'idle' || state === 'error' ? undefined : shown}
          aria-orientation="horizontal"
          aria-disabled={disabled || undefined}
          aria-readonly={state === 'confirming' || state === 'confirmed' || undefined}
          aria-describedby={hintId}
          data-slot="slide-to-confirm-thumb"
          className={cn(
            'relative own:grid size-(--ui--slide-thumb) shrink-0 place-items-center own:rounded-[calc(var(--radius-control-lg)-var(--spacing))] own:border own:shadow-sm-soft focus-ring',
            '[--ui--dir:1] rtl:[--ui--dir:-1] touch-none',
            state === 'confirmed' ? 'own:border-transparent own:bg-key own:text-success' : tones[tone].thumb,
            'transition-[background-color,color,border-color] yj-duration-fast ease-standard',
            locked ? 'cursor-default' : 'cursor-grab data-dragging:cursor-grabbing',
          )}
          data-dragging={dragging || undefined}
          style={{ translate: 'calc(var(--ui--slide) * (100cqw - 100%) * var(--ui--dir)) 0' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onLostPointerCapture={onPointerEnd}
          onKeyDown={onKeyDown}
          onBlur={() => {
            // A keyboard slide left short of the end goes back.
            if (!drag.current && !busy.current && current.current > 0) settleTo(0)
          }}
        >
          {/* One mark per state, stacked: each swaps in with a scale and fade. */}
          {(['idle', 'confirming', 'confirmed', 'error'] as const).map((mark) => (
            <span
              key={mark}
              aria-hidden
              data-slot="slide-to-confirm-mark"
              className={cn(
                'col-start-1 row-start-1 own:grid place-items-center transition-[opacity,scale] yj-duration-fast ease-standard',
                mark === state ? 'scale-100 opacity-100' : 'scale-75 opacity-0',
                mark === 'confirmed' && 'ease-spring [transition-duration:calc(var(--yj-duration-spring)*var(--yj-motion,1))]',
              )}
            >
              {mark === 'idle' && <ChevronRightIcon size={icon} className="rtl:-scale-x-100" />}
              {mark === 'confirming' && state === 'confirming' && <Spinner label={null} size={icon} />}
              {mark === 'confirmed' && <CheckIcon size={icon} />}
              {mark === 'error' && <XIcon size={icon} />}
            </span>
          ))}
        </div>
      </div>
      <span id={hintId} hidden>
        {labels.slideToConfirmHint}
      </span>
      <AsyncAnnouncer state={feedback[state]} pendingLabel={shown} successLabel={shown} errorLabel={shown} />
    </div>
  )
}

export { SlideToConfirm, type SlideToConfirmProps, type SlideToConfirmState }
