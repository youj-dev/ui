'use client'

import { Slider as SliderPrimitive } from '@base-ui/react/slider'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import { animate, m, useMotionValue, useTransform, useVelocity, type AnimationPlaybackControls } from 'motion/react'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { MotionFeatures, useSoundCue } from '@youj/core'
import { useYouj, useLocale, useDirection } from '@youj/core/lib/youj/provider'
import { clamp, cn, toneColor } from '../../lib/utils'

/* Direct manipulation: the thumb tracks the pointer 1:1 and keyboard steps
 * land instantly, like a native range. The motion is in the thumb's halo,
 * which grows (transform + opacity only) on hover, focus and drag. Keyboard:
 * arrows step, Page Up/Down take large steps, Home/End jump to the ends.
 *
 * variant="liquid": a tube, a glass droplet for a thumb, and the filled part a
 * liquid. The thumb and the fill's extent stay direct; the liquid's surface is
 * what moves. Each value change leans it against the movement on `snappy`
 * (higher behind, as if the liquid lagged the thumb), and once the value rests
 * it swings back on `settle`, overshooting into a slosh; the curve's middle
 * swells with the lean's speed, a second wave riding the first. A light line
 * along the surface is the meniscus. Reduced motion: a still, level surface.
 * variant="ticks": a ruler for a value read off a scale (usage, a quota), its
 * ticks lit in `tone` up to a slim fader cap, a taller one every fifth;
 * horizontal only, and as direct as the default. */

interface SliderProps extends SliderPrimitive.Root.Props {
  /**
   * Names the thumb. Base UI names a thumb from a Field/Slider label, never
   * from the root's aria-label, so it is forwarded to the thumb here.
   */
  'aria-label'?: string
  /** One name per thumb for a range, e.g. ['Minimum price', 'Maximum price']. */
  thumbLabels?: string[]
  /** What a screen reader says for a thumb's value when `format` can't say it, e.g. with a unit. */
  getAriaValueText?: SliderPrimitive.Thumb.Props['getAriaValueText']
  /** `liquid` fills a tube with a liquid whose surface sloshes as the value changes, leaning with the drag's speed and settling on a spring. `ticks` reads the value off a ruler of fine ticks, lit up to the thumb (horizontal only). Default `default`. */
  variant?: 'default' | 'liquid' | 'ticks'
  /** The fill's color in the default and `ticks` variants: the accent, a chart color, a status or neutral. Default 'accent'. */
  tone?: SliderTone
  /** With `variant="ticks"`: how many ticks the ruler has, ends included. Default: one per step while that's at most 61, else 41. */
  ticks?: number
  /** With sound on (`YoujProvider`’s `sound`), the liquid slider plays `tick` as its value changes. `false` keeps this one silent. Default true. */
  sound?: boolean
}

type SliderTone = 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

/** The ruler: quiet ticks, and the same ticks in the tone clipped to the lit stretch. It spans the thumb's travel, so a tick lines up with its value. */
const SliderTicks = ({ count }: { count: number }) =>
  ['own:text-line-strong', 'own:text-(--slider-tone) [clip-path:inset(0_calc((1_-_var(--slider-hi))*100%_-_1px)_0_calc(var(--slider-lo)*100%_-_1px))] rtl:[clip-path:inset(0_calc(var(--slider-lo)*100%_-_1px)_0_calc((1_-_var(--slider-hi))*100%_-_1px))]'].map((ink) => (
    <span key={ink} aria-hidden className={cn('pointer-events-none absolute inset-x-0.75 inset-y-0 own:flex items-center justify-between', ink)}>
      {Array.from({ length: count }, (_, i) => <span key={i} data-slot="slider-tick" data-yj-major={i % 5 === 0 || undefined} className="own:h-3 own:w-px own:rounded-full own:bg-current own:data-yj-major:h-4.5" />)}
    </span>
  ))

/* The surface in a 100×100 box stretched over the fill: y is depth from the
 * top, x runs from the track's start (0) to the thumb (100). */
const LEVEL = 40
const LEAN = 32
const SWELL = 20

function surface(tilt: number, swell: number) {
  const back = LEVEL - tilt * LEAN
  const front = LEVEL + tilt * LEAN
  // A quadratic through (50, mid): its control point sits twice as far from the chord.
  const control = 2 * (LEVEL + swell * SWELL) - (back + front) / 2
  return `M0 ${back} Q50 ${control} 100 ${front}`
}

/** The liquid inside the indicator: leans with the value's speed and sloshes back once it rests. */
function LiquidFill({ position, vertical }: { position: number; vertical: boolean }) {
  const k = useYouj()
  const tilt = useMotionValue(0)
  const tiltSpeed = useVelocity(tilt)
  const last = useRef<{ at: number; position: number } | null>(null)
  const run = useRef<AnimationPlaybackControls | null>(null)
  const rest = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const now = performance.now()
    const prev = last.current
    last.current = { at: now, position }
    if (!prev || k.reduced) return
    // A keyboard step arrives alone, so its time is capped: it still makes a small wave.
    const dt = clamp((now - prev.at) / 1000, 1 / 60, 0.08)
    const speed = (position - prev.position) / dt
    const lean = Math.sign(speed) * Math.min(1, Math.sqrt(Math.abs(speed) * 0.3))
    run.current?.stop()
    run.current = animate(tilt, lean, k.spring('snappy'))
    clearTimeout(rest.current)
    // No new value for a few frames: the drag has rested, so the liquid swings back past level and settles.
    rest.current = setTimeout(() => {
      run.current = animate(tilt, 0, k.spring('settle'))
    }, 70)
  }, [position, k, tilt])

  useEffect(
    () => () => {
      clearTimeout(rest.current)
      run.current?.stop()
    },
    [],
  )

  const swell = useTransform(() => clamp(tiltSpeed.get() * 0.05, -1, 1))
  const line = useTransform(() => surface(tilt.get(), swell.get()))
  const body = useTransform(() => `${line.get()} L100 100 L0 100 Z`)
  const still = surface(0, 0)

  return (
    <svg
      aria-hidden
      data-slot="slider-liquid"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={cn('pointer-events-none absolute inset-0 own:size-full', !vertical && 'rtl:-scale-x-100')}
    >
      {/* Vertical: the same tube turned a quarter, so its start is at the bottom. */}
      <g transform={vertical ? 'rotate(-90 50 50)' : undefined}>
        <m.path d={k.reduced ? `${still} L100 100 L0 100 Z` : body} className="own:fill-accent" />
        <m.path
          d={k.reduced ? still : line}
          vectorEffect="non-scaling-stroke"
          className="fill-none own:stroke-[color-mix(in_oklab,var(--yj-light)_70%,transparent)] [stroke-width:1.5]"
        />
      </g>
    </svg>
  )
}

const LIQUID_TRACK = [
  'own:shadow-[inset_0_1px_2px_color-mix(in_oklab,var(--yj-shade)_22%,transparent)] own:inset-ring own:inset-ring-line-subtle',
  'own:data-[orientation=horizontal]:h-4 data-[orientation=vertical]:w-4',
]

// The glass droplet: a bright cap over a body that lets the liquid through, a light rim, a darker lower lip and a soft drop.
const LIQUID_KNOB = [
  'own:[background:radial-gradient(90%_70%_at_35%_18%,color-mix(in_oklab,var(--yj-light)_95%,transparent),transparent_62%),linear-gradient(to_bottom,color-mix(in_oklab,var(--yj-light)_82%,transparent),color-mix(in_oklab,var(--yj-light)_62%,transparent))]',
  'backdrop-blur-[1.5px] backdrop-saturate-[1.8]',
  'own:[box-shadow:inset_0_0_0_1px_color-mix(in_oklab,var(--yj-light)_70%,transparent),inset_0_-2px_3px_color-mix(in_oklab,var(--yj-shade)_14%,transparent),0_1px_2px_color-mix(in_oklab,var(--yj-shade)_22%,transparent),0_3px_8px_-2px_color-mix(in_oklab,var(--yj-shade)_28%,transparent)]',
  'before:absolute before:top-[14%] before:start-[22%] own:before:h-[24%] own:before:w-[36%] before:rounded-full own:before:bg-[color-mix(in_oklab,var(--yj-light)_92%,transparent)] before:blur-[0.5px]',
  'after:absolute after:inset-x-[20%] after:bottom-[10%] own:after:h-[28%] after:rounded-full own:after:bg-accent after:opacity-60 after:blur-[2px]',
]

const asArray = (v: number | readonly number[] | undefined) => (v === undefined ? undefined : typeof v === 'number' ? [v] : [...v])

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  'aria-label': ariaLabel,
  thumbLabels,
  getAriaValueText,
  variant = 'default',
  tone = 'accent',
  ticks,
  sound = true,
  onValueChange,
  orientation,
  step = 1,
  ...props
}: SliderProps) {
  const direction = useDirection()
  const k = useYouj()
  const cue = useSoundCue()
  const liquid = variant === 'liquid'
  const ruler = variant === 'ticks'
  const values = asArray(value) ?? asArray(defaultValue) ?? [min]
  // The liquid and the ruler follow the live value: the app's when controlled, else the last one Base UI reported.
  const [reported, setReported] = useState<number[] | undefined>(undefined)
  const live = asArray(value) ?? reported ?? values
  const fractions = live.map((v) => clamp((v - min) / (max - min || 1), 0, 1))
  const position = fractions.reduce((sum, f) => sum + f, 0)
  const steps = Math.round((max - min) / (step || 1)) + 1
  const tickCount = Math.max(2, Math.round(ticks ?? (steps <= 61 ? steps : 41)))
  // The lit stretch: from the start to a single thumb, or between a range's two.
  const [lo, hi] = fractions.length > 1 ? [Math.min(...fractions), Math.max(...fractions)] : [0, fractions[0] ?? 0]
  const ink = toneColor(tone, 'var(--color-fg-muted)')

  return (
    <DirectionProvider direction={direction}>
      <SliderPrimitive.Root
        data-slot="slider"
        data-variant={variant}
        data-tone={tone}
        data-reduced-motion={k.reduced || undefined}
        className={cn('data-[orientation=horizontal]:w-full own:data-[orientation=vertical]:h-full', className)}
        defaultValue={defaultValue}
        value={value}
        min={min}
        max={max}
        step={step}
        orientation={ruler ? 'horizontal' : orientation}
        thumbAlignment="edge"
        locale={useLocale()}
        onValueChange={(next, details) => {
          if ((liquid || ruler) && value === undefined) setReported(asArray(next))
          if (liquid && sound) cue('tick')
          onValueChange?.(next, details)
        }}
        {...props}
      >
        <SliderPrimitive.Control
          data-slot="slider-control"
          className={cn(
            'relative own:flex w-full touch-none items-center py-2 select-none touch:py-3',
            'data-disabled:cursor-not-allowed data-disabled:opacity-50',
            'own:data-[orientation=vertical]:h-full own:data-[orientation=vertical]:min-h-40 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col data-[orientation=vertical]:px-2 data-[orientation=vertical]:py-0',
            ruler && 'own:py-1 touch:py-2',
          )}
          // A tone other than the accent haloes in a wash of itself.
          style={{ '--slider-tone': ink, '--slider-halo': tone === 'accent' ? 'var(--color-accent-subtle)' : `color-mix(in oklab, ${ink} 18%, transparent)`, ...(ruler && { '--slider-lo': lo, '--slider-hi': hi }) } as CSSProperties}
        >
          <SliderPrimitive.Track
            data-slot="slider-track"
            className={cn(
              'relative grow select-none',
              ruler
                ? 'own:h-6 w-full'
                : 'rounded-full own:bg-well own:data-[orientation=horizontal]:h-1 data-[orientation=horizontal]:w-full own:data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1',
              liquid && LIQUID_TRACK,
            )}
          >
            {ruler && <SliderTicks count={tickCount} />}
            <SliderPrimitive.Indicator
              data-slot="slider-range"
              className={cn(
                'rounded-full select-none own:data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full',
                liquid ? 'overflow-hidden' : ruler ? 'own:hidden' : 'own:bg-(--slider-tone)',
              )}
            >
              {liquid && (
                <MotionFeatures>
                  <LiquidFill position={position} vertical={orientation === 'vertical'} />
                </MotionFeatures>
              )}
            </SliderPrimitive.Indicator>
            {values.map((_, index) => (
              <SliderPrimitive.Thumb
                data-slot="slider-thumb"
                key={index}
                index={values.length > 1 ? index : undefined}
                aria-label={thumbLabels?.[index] ?? ariaLabel}
                getAriaValueText={getAriaValueText}
                className={cn(
                  'relative isolate own:block shrink-0 rounded-full select-none focus-ring-within data-disabled:pointer-events-none',
                  liquid ? 'own:size-6' : ruler ? 'own:h-6 own:w-1.5' : 'own:size-4',
                  // Halo: a disc behind the face, grown by transform on the enter curve.
                  'before:absolute before:-inset-1.5 before:rounded-full own:before:bg-(--slider-halo)',
                  'before:scale-50 before:opacity-0 before:transition-[scale,opacity] before:yj-duration-fast before:ease-enter',
                  'hover:before:scale-100 hover:before:opacity-100 has-[:focus-visible]:before:scale-100 has-[:focus-visible]:before:opacity-100',
                  'data-dragging:before:scale-100 data-dragging:before:opacity-100',
                  'reduced:before:scale-100 reduced:before:transition-[opacity]',
                  'after:absolute after:-inset-2 touch:after:-inset-3',
                )}
              >
                <span
                  aria-hidden
                  data-slot="slider-thumb-knob"
                  className={cn('absolute inset-0 rounded-full', liquid ? LIQUID_KNOB : ruler ? 'own:bg-fg own:shadow-sm-soft' : 'own:border-2 own:border-(--slider-tone) own:bg-key own:shadow-sm-soft')}
                />
              </SliderPrimitive.Thumb>
            ))}
          </SliderPrimitive.Track>
        </SliderPrimitive.Control>
      </SliderPrimitive.Root>
    </DirectionProvider>
  )
}

export { Slider, type SliderProps, type SliderTone }
