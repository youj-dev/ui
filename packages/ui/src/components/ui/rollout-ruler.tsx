'use client'

import { useLayoutEffect, useMemo, useRef, type ComponentProps } from 'react'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import { Slider as SliderPrimitive } from '@base-ui/react/slider'
import { m, useInView } from 'motion/react'
import { MotionFeatures } from '@youj/core'
import { rolloutRulerLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale, useDirection } from '@youj/core/lib/youj/provider'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, numberFormat } from '../../lib/utils'

/* How far a feature has rolled out, read off a ruled track. The track is cut
 * into its stages (internal, beta, 10%, 50%, GA by default), each an equal
 * stretch, so the early cohorts get as much room as the late ones; the axis
 * under it says what each gate is worth. A playhead rides the value and snaps
 * to the gates: drag it, press anywhere on the ruler, or use the keyboard.
 * - Color tells the story: ticks already rolled out are lit in `tone` (the
 *   accent), the stretch to the next gate is the runway at a third of it, and
 *   the rest is dim. The gate the value sits on names itself in the tone.
 * - Motion: a step you take snaps the playhead on the snappy spring. A change
 *   from outside (a kill switch, a schedule) sweeps instead, the ticks going
 *   dark or lighting one after another at a constant rate with the playhead
 *   riding the front; the ruler sweeps up from zero as it scrolls into view.
 * - `readOnly` makes it a meter (no playhead knob); `size="sm"` is the bare
 *   track for a list row. The track runs from the inline start (right to left
 *   in RTL).
 * - Reduced motion: drawn at its value; changes jump. */

type RolloutTone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral'

interface RolloutStage {
  /** The share of users at this gate, 0–100. */
  value: number
  /** Named over its gate: "Beta". A numeric stage can use its percentage. */
  label: string
}

interface RolloutRulerProps extends Omit<ComponentProps<'div'>, 'defaultValue' | 'onChange' | 'children'> {
  /** The share rolled out, 0–100. Interactive, it's always a stage's value (or 0). */
  value?: number
  /** Default 0. */
  defaultValue?: number
  onValueChange?: (value: number) => void
  /** Called once a drag or key press ends, with the final value. */
  onValueCommitted?: (value: number) => void
  /** The gates, in any order. Default: Internal 1%, Beta 5%, 10%, 50% and GA 100%. */
  stages?: readonly RolloutStage[]
  /** A meter to read, without a playhead to move. Default false. */
  readOnly?: boolean
  disabled?: boolean
  /** `sm`: the bare track, no header, names or axis, for a list row. Default `default`. */
  size?: 'default' | 'sm'
  /** The lit ticks. Default `accent`. */
  tone?: RolloutTone
  /** The visible name over the track, and its accessible name. Default: the labels' "Rollout". */
  label?: string
  /** Minor intervals per stage. Default 10, or 5 at `sm`. */
  ticks?: number
  /** Default: the YoujProvider locale. */
  locale?: string
}

const TONE: Record<RolloutTone, string> = {
  accent: 'own:text-accent',
  success: 'own:text-success',
  warning: 'own:text-warning',
  danger: 'own:text-danger',
  neutral: 'own:text-fg',
}
const INK: Record<RolloutTone, string> = {
  accent: 'own:text-accent-text',
  success: 'own:text-success-text',
  warning: 'own:text-warning-text',
  danger: 'own:text-danger-text',
  neutral: 'own:text-fg',
}
const VOICE = 'own:font-(family-name:--yj-label-font) own:tracking-(--yj-label-tracking) own:[text-transform:var(--yj-label-case)]'

/** Where a value sits along the track, 0–1: each stage is an equal stretch, linear inside it. */
function positionOf(value: number, stops: readonly number[]) {
  const last = stops.length - 1
  if (last < 1) return 0
  if (value <= stops[0]!) return 0
  for (let i = 0; i < last; i++) {
    const [a, b] = [stops[i]!, stops[i + 1]!]
    if (value <= b) return (i + (b > a ? (value - a) / (b - a) : 1)) / last
  }
  return 1
}

/** The gate nearest a value, as an index into `stops`. */
const nearestStop = (value: number, stops: readonly number[]) =>
  stops.reduce((best, stop, i) => (Math.abs(stop - value) < Math.abs(stops[best]! - value) ? i : best), 0)

function RolloutRuler({
  value: valueProp,
  defaultValue = 0,
  onValueChange,
  onValueCommitted,
  stages: stagesProp,
  readOnly = false,
  disabled = false,
  size = 'default',
  tone = 'accent',
  label,
  ticks,
  locale: localeProp,
  className,
  ...props
}: RolloutRulerProps) {
  const direction = useDirection()
  const k = useYouj()
  const labels = useComponentLabels(rolloutRulerLabels)
  const locale = useLocale(localeProp)
  const rtl = useDirection() === 'rtl'
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const [value, setValue] = useControllableState(valueProp, defaultValue)
  const small = size === 'sm'
  const minor = Math.max(1, Math.round(ticks ?? (small ? 5 : 10)))

  const percent = useMemo(() => numberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }), [locale])
  const stages = useMemo(
    () =>
      [
        ...(stagesProp ?? [
          { value: 1, label: labels.rolloutInternal },
          { value: 5, label: labels.rolloutBeta },
          { value: 10, label: percent.format(0.1) },
          { value: 50, label: percent.format(0.5) },
          { value: 100, label: labels.rolloutGeneral },
        ]),
      ]
        .filter((s) => s.value > 0)
        .sort((a, b) => a.value - b.value),
    [stagesProp, labels, percent],
  )
  const stops = useMemo(() => [0, ...stages.map((s) => s.value)], [stages])
  const segments = stops.length - 1
  const name = label ?? labels.rollout

  const spoken = (v: number) => {
    const stage = stages.find((s) => s.value === v)
    const pct = percent.format(v / 100)
    if (v <= 0) return labels.rolloutOff
    return !stage || stage.label === pct ? pct : labels.rolloutStageAt(stage.label, pct)
  }

  // Shown at zero until the ruler scrolls into view, then swept up to its value.
  const at = k.reduced || inView ? positionOf(value, stops) : 0
  // A step the user takes snaps; any other change sweeps at a constant rate.
  const userStep = useRef(false)
  const last = useRef({ at, user: false })
  const from = last.current.at
  const user = at !== from ? userStep.current : last.current.user
  useLayoutEffect(() => {
    if (last.current.at !== at) last.current = { at, user: userStep.current }
    userStep.current = false
  })
  // Milliseconds to cross the whole track.
  const rate = k.reduced ? 0 : user ? k.ms('base') : k.ms('deliberate') * 1.6
  const travel = Math.abs(at - from) * rate

  const change = (index: number) => {
    const next = stops[index] ?? 0
    if (next === value) return
    userStep.current = true
    setValue(next)
    onValueChange?.(next)
  }

  const total = segments * minor
  const nextGate = stops.find((s) => positionOf(s, stops) > at + 1e-9)
  const runwayTo = nextGate === undefined ? at : positionOf(nextGate, stops)
  const current = stages.find((s) => Math.abs(positionOf(s.value, stops) - at) < 1e-9 && value === s.value)

  const ruler = (
    <div
      data-slot="rollout-ruler-track"
      aria-hidden
      className={cn(
        'relative rounded-[3px] bg-[color-mix(in_oklab,var(--color-canvas)_calc(55%*var(--yj-dark)),color-mix(in_oklab,var(--color-fg)_4%,transparent))]',
        small ? 'h-3' : 'h-7',
      )}
    >
      <div className={cn('absolute inset-y-0 overflow-clip [overflow-clip-margin:12px]', small ? 'inset-x-1' : 'inset-x-2')}>
        {Array.from({ length: total + 1 }, (_, i) => {
          const pos = i / total
          const gate = i % minor === 0
          const lit = pos <= at + 1e-9 && at > 0
          // The bare track leaves the runway out: in a list, the next gate is noise.
          const runway = !small && !lit && pos <= runwayTo + 1e-9
          const moving = pos > Math.min(from, at) && pos <= Math.max(from, at)
          const delay = moving && !k.reduced ? Math.abs(pos - from) * rate : 0
          return (
            <span
              key={i}
              data-slot="rollout-ruler-tick"
              data-gate={gate || undefined}
              data-zone={lit ? 'rolled-out' : runway ? 'runway' : 'idle'}
              className={cn(
                'absolute rounded-full bg-current transition-[color,opacity] yj-duration-fast ease-standard -translate-x-1/2 rtl:translate-x-1/2 reduced:transition-none',
                small ? (gate ? 'top-0.5 h-2 w-px' : 'top-1 h-1 w-px') : gate ? 'top-1 h-5 w-0.5' : 'top-2 h-3 w-px',
                lit || runway ? TONE[tone] : 'own:text-fg',
                lit ? (gate ? 'opacity-100' : 'opacity-60') : runway ? (gate ? 'opacity-45' : 'opacity-30') : gate ? 'opacity-35' : 'opacity-20',
              )}
              style={{ insetInlineStart: `${pos * 100}%`, ...(delay ? { transitionDelay: `${Math.round(delay)}ms` } : null) }}
            />
          )
        })}
        {/* The playhead: a full-width rail slid by the value (transform only), carrying the needle at its start. */}
        <m.span
          className="pointer-events-none absolute inset-0"
          initial={false}
          animate={{ x: `${(rtl ? -at : at) * 100}%` }}
          transition={k.reduced ? { type: false } : user ? k.spring('snappy') : { duration: travel / 1000, ease: 'linear' }}
        >
          <span
            data-slot="rollout-ruler-needle"
            className={cn(
              'absolute start-0 w-0.5 -translate-x-1/2 rounded-full bg-fg shadow-[0_0_0_2px_var(--color-surface)] rtl:translate-x-1/2',
              small ? '-inset-y-0.5' : '-inset-y-1.5',
            )}
          />
          {!readOnly && !small && (
            <span
              data-slot="rollout-ruler-knob"
              className={cn(
                'absolute start-0 top-1/2 h-9 w-3 -translate-x-1/2 -translate-y-1/2 rounded-[min(var(--radius-sm),5px)] bg-action shadow-sm-soft rtl:translate-x-1/2',
                'inset-ring inset-ring-(--ui--fill-edge) transition-[scale] yj-duration-fast ease-standard',
                'group-data-dragging/rollout:scale-110 reduced:transition-none',
                // The keyboard's ring, drawn on the knob the thumb stands for.
                'group-has-[:focus-visible]/rollout:outline-2 group-has-[:focus-visible]/rollout:outline-offset-2 group-has-[:focus-visible]/rollout:outline-focus',
                'after:absolute after:inset-x-0 after:inset-y-2.5 own:after:mx-auto after:w-px after:rounded-full after:bg-on-action/70 youj-allow-tint',
              )}
            />
          )}
        </m.span>
      </div>
    </div>
  )

  if (small) {
    return (
      <MotionFeatures>
        <div
          ref={ref}
          role="meter"
          aria-label={name}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          aria-valuetext={spoken(value)}
          data-slot="rollout-ruler"
          aria-disabled={disabled || undefined}
          data-size="sm"
          data-tone={tone}
          data-reduced-motion={k.reduced || undefined}
          className={cn('w-full min-w-16', className)}
          {...props}
        >
          {ruler}
        </div>
      </MotionFeatures>
    )
  }

  const gates = stages.map((stage) => ({ stage, pos: positionOf(stage.value, stops) }))
  const flags = (
    <div data-slot="rollout-ruler-stages" aria-hidden className="relative own:mx-2 h-4">
      {gates.map(({ stage, pos }) => {
        const passed = pos <= at + 1e-9 && at > 0
        const here = current === stage
        return (
          <span
            key={stage.value}
            data-slot="rollout-ruler-stage"
            data-current={here || undefined}
            data-passed={passed || undefined}
            className={cn(
              'absolute bottom-0 own:font-mono own:text-ui-xs own:leading-none whitespace-nowrap own:uppercase transition-colors yj-duration-fast ease-standard',
              pos >= 1 ? '-translate-x-full rtl:translate-x-full' : '-translate-x-1/2 rtl:translate-x-1/2',
              here ? cn(INK[tone], 'own:font-medium') : passed ? 'own:text-fg-muted' : 'own:text-fg-subtle',
            )}
            style={{ insetInlineStart: `${pos * 100}%` }}
          >
            {stage.label}
          </span>
        )
      })}
    </div>
  )
  const axis = (
    <div data-slot="rollout-ruler-axis" aria-hidden className="relative mx-2 mt-1.5 h-4 own:font-mono own:text-ui-xs text-fg-muted own:tabular-nums">
      {stops.map((stop, i) => {
        const pos = i / segments
        // A gate named by its own percentage already says it above the track.
        if (stages[i - 1]?.label === percent.format(stop / 100)) return null
        return (
          <span
            key={stop}
            className={cn(
              'absolute top-0 whitespace-nowrap',
              pos >= 1 ? '-translate-x-full rtl:translate-x-full' : pos > 0 && '-translate-x-1/2 rtl:translate-x-1/2',
            )}
            style={{ insetInlineStart: `${pos * 100}%` }}
          >
            <bdi>{percent.format(stop / 100)}</bdi>
          </span>
        )
      })}
    </div>
  )
  const stageName = value <= 0 ? labels.rolloutOff : current && current.label !== percent.format(value / 100) ? current.label : undefined
  const header = (
    <div data-slot="rollout-ruler-header" className="own:mb-3 own:flex min-w-0 items-baseline justify-between gap-3">
      <span data-slot="rollout-ruler-label" className={cn('min-w-0 truncate own:text-ui-sm own:text-fg-muted', VOICE)}>
        {name}
      </span>
      <span data-slot="rollout-ruler-value" aria-hidden className="own:flex shrink-0 items-baseline gap-2 own:font-mono own:tabular-nums">
        {stageName && <span className={cn('own:text-ui-sm own:uppercase', value > 0 ? INK[tone] : 'own:text-fg-muted')}>{stageName}</span>}
        <span className="own:text-xl own:leading-none own:font-medium own:tracking-tight own:text-fg">
          <bdi>{percent.format(value / 100)}</bdi>
        </span>
      </span>
    </div>
  )

  if (readOnly) {
    return (
      <MotionFeatures>
        <div
          ref={ref}
          role="meter"
          aria-label={name}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          aria-valuetext={spoken(value)}
          data-slot="rollout-ruler"
          data-size="default"
          data-tone={tone}
          data-reduced-motion={k.reduced || undefined}
          className={cn('own:flex w-full min-w-0 flex-col', className)}
          {...props}
        >
          {header}
          {flags}
          <div className="mt-1.5">{ruler}</div>
          {axis}
        </div>
      </MotionFeatures>
    )
  }

  return (
    <MotionFeatures>
      <DirectionProvider direction={direction}>
        <SliderPrimitive.Root
          ref={ref}
          value={nearestStop(value, stops)}
          min={0}
          max={segments}
          step={1}
          largeStep={1}
          disabled={disabled}
          thumbAlignment="center"
          locale={locale}
          onValueChange={(next) => change(Array.isArray(next) ? next[0]! : next)}
          onValueCommitted={(next) => onValueCommitted?.(stops[Array.isArray(next) ? next[0]! : next] ?? 0)}
          data-slot="rollout-ruler"
          aria-disabled={disabled || undefined}
          data-size="default"
          data-tone={tone}
          data-reduced-motion={k.reduced || undefined}
          className={cn('group/rollout own:flex w-full min-w-0 flex-col data-disabled:opacity-50', className)}
          {...(props as object)}
        >
          {header}
          {/* The control spans the names and the track, so a press anywhere on the instrument moves the playhead to the nearest gate. */}
          <SliderPrimitive.Control data-slot="rollout-ruler-control" className="relative cursor-pointer touch-pan-y select-none data-disabled:cursor-not-allowed">
            {flags}
            <div className="mt-1.5">{ruler}</div>
            <SliderPrimitive.Track className="pointer-events-none absolute inset-x-2 inset-y-0">
              <SliderPrimitive.Thumb
                data-slot="rollout-ruler-thumb"
                aria-label={name}
                getAriaValueText={(_, index) => spoken(stops[index] ?? 0)}
                className="h-full w-6 opacity-0"
              />
            </SliderPrimitive.Track>
          </SliderPrimitive.Control>
          {axis}
        </SliderPrimitive.Root>
      </DirectionProvider>
    </MotionFeatures>
  )
}

export { RolloutRuler, type RolloutRulerProps, type RolloutStage, type RolloutTone }
