'use client'

import { useMemo, useRef, type CSSProperties, type ReactNode } from 'react'
import { Slider as SliderPrimitive } from '@base-ui/react/slider'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import { useSoundCue } from '@youj/core'
import { gradientSliderLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale, useDirection } from '@youj/core/lib/youj/provider'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, numberFormat } from '../../lib/utils'

/* A value on a spectrum: how literal or inventive a model runs, how warm a
 * light, how hard a compressor pulls. The track is the spectrum itself, a
 * gradient drawn from the theme's own tokens (`spectrum`: the chart palette,
 * cool to warm; `accent`: the accent from faint to full; `status`: success
 * to danger, for real risk scales only), lit up to the thumb and dimmed past
 * it. The rail spans the thumb's travel, so color, ruler and zones agree. The thumb is a glass capsule that carries the
 * value in mono and picks up the color under it; a ruler of ticks runs
 * beneath, and the zones name the stretch the value sits in ("Literal",
 * "Balanced", "Exploratory"), the current one lit. Base UI's Slider does the
 * work: arrows step, Page Up/Down and Shift+arrows take large steps,
 * Home/End jump, and the value is spoken with its zone.
 * Motion: direct manipulation, so the thumb tracks the pointer 1:1 and keys
 * land at once; the glass swells a touch while held or focused (transform,
 * fast token) and the zone's name lights on the fast token as you cross into
 * it. Reduced motion: no swell, colors change at once. With sound on,
 * crossing into another zone plays `tick`. */

interface GradientSliderZone {
  /** The zone's name: "Balanced". */
  label: string
  /** The last value in the zone. The last zone runs to `max`, so it can leave this out. */
  to?: number
}

type Tone = 'spectrum' | 'accent' | 'status'

interface GradientSliderProps
  extends Omit<SliderPrimitive.Root.Props, 'value' | 'defaultValue' | 'onValueChange' | 'onValueCommitted' | 'children' | 'orientation' | 'thumbAlignment' | 'style'> {
  style?: CSSProperties
  value?: number
  defaultValue?: number
  onValueChange?: (value: number) => void
  /** Fires when a drag or key press ends: the moment to save. */
  onValueCommitted?: (value: number) => void
  /** A visible name over the track (an eyebrow in Bezel). It also names the thumb. */
  label?: ReactNode
  /** Names the thumb when there's no visible `label`. */
  'aria-label'?: string
  /** The named stretches of the range, in order: [{ label: 'Literal', to: 0.4 }, …]. The first and last read as its two ends. */
  zones?: GradientSliderZone[]
  /**
   * The gradient, from the theme’s tokens. `spectrum` (default): the chart palette, cool to warm, with no
   * judgment in it. `accent`: the accent from faint to full. `status`: success, warning, danger, only for a
   * scale whose far end really is a risk.
   */
  tone?: Tone
  /** How many divisions the ruler shows. Zone edges and the ends are major ticks. Default 10; 0 hides it. */
  ticks?: number
  /** Intl.NumberFormat options for the value in the thumb and as spoken. Default: two decimals below 10, whole numbers above. */
  format?: Intl.NumberFormatOptions
  /** With sound on (`YoujProvider`’s `sound`), crossing into another zone plays `tick`. `false` keeps it quiet. Default true. */
  sound?: boolean
}

/** A status ink lifted in light mode, where the inks are darkened for text: a track wants the hue, not the ink. */
const lift = (token: string, by: number) => `oklch(from var(${token}) calc(l + ${by} - ${by} * var(--yj-dark)) c h)` // youj-allow: a relative color of the status token, not a raw one

/* `spectrum` says nothing about good or bad: the theme’s chart palette from
 * its fifth color through its third to its second, which each preset keeps
 * cool to warm (Basalt: cyan, violet, pink). `status` is for real risk
 * scales, where the far end is a warning. */
const STOPS: Record<Tone, string[]> = {
  spectrum: ['var(--color-chart-5)', 'var(--color-chart-3)', 'var(--color-chart-2)'],
  status: [lift('--color-success', 0.2), lift('--color-warning', 0.2), lift('--color-danger', 0.1)],
  accent: ['color-mix(in oklab, var(--color-accent) 18%, var(--color-surface))', 'color-mix(in oklab, var(--color-accent) 58%, var(--color-surface))', 'var(--color-accent)'],
}

/** The color at `t` (0–1) along evenly spaced stops, as a CSS color-mix. */
function colorAt(stops: string[], t: number) {
  const span = stops.length - 1
  const i = Math.min(Math.floor(t * span), span - 1)
  const local = Math.round((t * span - i) * 100)
  return `color-mix(in oklab, ${stops[i + 1]} ${local}%, ${stops[i]})`
}

function zoneIndex(zones: GradientSliderZone[], value: number) {
  const i = zones.findIndex((zone) => zone.to === undefined || value <= zone.to)
  return i === -1 ? zones.length - 1 : i
}

function GradientSlider({
  value: valueProp,
  defaultValue,
  onValueChange,
  onValueCommitted,
  min = 0,
  max = 100,
  step = 1,
  label,
  'aria-label': ariaLabel,
  zones = [],
  tone = 'spectrum',
  ticks = 10,
  format: formatProp,
  locale: localeProp,
  sound = true,
  disabled,
  className,
  style,
  ...props
}: GradientSliderProps) {
  const direction = useDirection()
  const k = useYouj()
  const labels = useComponentLabels(gradientSliderLabels)
  const locale = useLocale(localeProp as string | undefined)
  const cue = useSoundCue()
  const rtl = useDirection() === 'rtl'
  const [value, setValue] = useControllableState(valueProp, defaultValue ?? min)
  const format = useMemo(
    () => formatProp ?? (max - min <= 10 ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : { maximumFractionDigits: 0 }),
    [formatProp, max, min],
  )
  const formatter = useMemo(() => numberFormat(locale, format), [locale, format])
  const stops = STOPS[tone]
  const t = max > min ? Math.min(1, Math.max(0, (value - min) / (max - min))) : 0
  const zone = zones.length ? zoneIndex(zones, value) : -1
  const lastZone = useRef(zone)

  // Zone widths as fractions of the range, for the labels' grid.
  const bounds = zones.map((z, i) => (i === zones.length - 1 ? max : Math.min(max, Math.max(min, z.to ?? max))))
  const widths = bounds.map((b, i) => Math.max(b - (i === 0 ? min : bounds[i - 1]!), (max - min) / 100))
  const majors = new Set(bounds.slice(0, -1).map((b) => Math.round(((b - min) / (max - min)) * 1000)))

  const vars = {
    '--gs-t': t,
    '--gs-color': colorAt(stops, t),
    '--gs-gradient': `linear-gradient(${rtl ? 'to left' : 'to right'}, ${stops.join(', ')})`,
    ...style,
  } as CSSProperties

  return (
    <DirectionProvider direction={direction}>
      <SliderPrimitive.Root
        data-slot="gradient-slider"
        data-tone={tone}
        data-reduced-motion={k.reduced || undefined}
        value={value}
        onValueChange={(next) => {
          const v = next as number
          setValue(v)
          onValueChange?.(v)
          const nextZone = zones.length ? zoneIndex(zones, v) : -1
          if (nextZone !== lastZone.current) {
            lastZone.current = nextZone
            if (sound) cue('tick')
          }
        }}
        onValueCommitted={(next) => onValueCommitted?.(next as number)}
        min={min}
        max={max}
        step={step}
        format={format}
        locale={locale}
        disabled={disabled}
        aria-disabled={disabled || undefined}
        thumbAlignment="edge"
        className={cn('own:flex w-full flex-col gap-2 [--gs-thumb:3.5rem] data-disabled:opacity-50', className)}
        style={vars}
        {...props}
      >
        {label !== undefined && (
          <SliderPrimitive.Label data-slot="gradient-slider-label" className="own:text-ui own:font-medium own:text-fg">
            {label}
          </SliderPrimitive.Label>
        )}
        <SliderPrimitive.Control
          data-slot="gradient-slider-control"
          className="relative own:flex own:h-9 w-full touch-none items-center select-none data-disabled:cursor-not-allowed own:touch:h-11"
        >
          <SliderPrimitive.Track data-slot="gradient-slider-track" className="relative own:h-2 w-full select-none">
            {/* The rail spans the thumb’s travel (centre at min to centre at max), so the colours, the ruler and the
                zones share one scale. The spectrum is dim past the thumb and lit up to it. */}
            <span aria-hidden data-slot="gradient-slider-rail" className="absolute inset-y-0 inset-x-[calc(var(--gs-thumb)/2)] rounded-full own:bg-band">
              <span className="absolute inset-0 rounded-[inherit] opacity-30 [background:var(--gs-gradient)]" />
              <span
                data-slot="gradient-slider-fill"
                className="absolute inset-0 rounded-[inherit] own:[background:var(--gs-gradient)]"
                style={{ clipPath: rtl ? 'inset(0 0 0 calc(100% - var(--gs-t) * 100%) round 999px)' : 'inset(0 calc(100% - var(--gs-t) * 100%) 0 0 round 999px)' }}
              />
            </span>
            <SliderPrimitive.Thumb
              data-slot="gradient-slider-thumb"
              aria-label={label === undefined ? ariaLabel : undefined}
              getAriaValueText={(formatted) => labels.gradientSliderValue(formatted, zones[zone]?.label)}
              className={cn(
                'group/thumb isolate own:grid own:h-7.5 w-(--gs-thumb) place-items-center rounded-full select-none focus-ring-within data-disabled:pointer-events-none',
                // Glass: a frosted slice of the surface over the track, edged in a hairline with a lit top, glowing in the color beneath.
                'own:bg-[color-mix(in_oklab,var(--color-surface)_62%,transparent)] backdrop-blur-md backdrop-saturate-150',
                'shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-fg)_14%,transparent),inset_0_1px_0_0_var(--ui--edge-highlight),0_10px_24px_-10px_var(--gs-color),0_2px_6px_-2px_color-mix(in_oklab,var(--color-canvas)_55%,transparent)]',
                'transition-[scale] yj-duration-fast ease-enter hover:scale-105 has-[:focus-visible]:scale-105 data-dragging:scale-105 reduced:scale-100',
                // A hit area past the glass, so the edges are easy to catch.
                'after:absolute after:-inset-x-1 after:-inset-y-2 touch:after:-inset-y-3',
              )}
            >
              <span aria-hidden data-slot="gradient-slider-value" className="own:font-mono own:text-ui-sm own:font-medium own:text-fg own:tabular-nums">
                {formatter.format(value)}
              </span>
            </SliderPrimitive.Thumb>
          </SliderPrimitive.Track>
        </SliderPrimitive.Control>

        {ticks > 0 && (
          <div aria-hidden data-slot="gradient-slider-ruler" className="relative own:mx-[calc(var(--gs-thumb)/2)] own:-mt-1 own:h-2">
            {Array.from({ length: ticks + 1 }, (_, i) => {
              const at = i / ticks
              const major = i === 0 || i === ticks || majors.has(Math.round(at * 1000))
              return (
                <span
                  key={i}
                  data-slot="gradient-slider-tick"
                  data-major={major || undefined}
                  className={cn('absolute top-0 w-px -translate-x-1/2 rtl:translate-x-1/2', major ? 'own:h-2 own:bg-fg-subtle' : 'own:h-1 own:bg-line-strong')}
                  style={{ insetInlineStart: `${at * 100}%` }}
                />
              )
            })}
          </div>
        )}

        {zones.length > 0 && (
          <div aria-hidden data-slot="gradient-slider-zones" className="@container own:mx-[calc(var(--gs-thumb)/2)] own:grid gap-2" style={{ gridTemplateColumns: widths.map((w) => `minmax(0, ${w}fr)`).join(' ') }}>
            {zones.map((z, i) => (
              <span
                key={z.label}
                data-slot="gradient-slider-zone"
                data-active={i === zone || undefined}
                className={cn(
                  'own:flex min-w-0 items-center own:text-ui-sm own:text-fg-muted transition-[color] yj-duration-fast ease-standard own:data-active:text-fg',
                  i === 0 ? 'justify-start' : i === zones.length - 1 ? 'justify-end' : 'justify-center',
                  // Too narrow for every name (under 24rem): only the lit zone keeps its name, in full.
                  i !== zone && '@max-sm:invisible',
                )}
              >
                {/* The lit zone’s dot hangs in the gutter, so the names keep their alignment. */}
                <span className={cn('relative', i > 0 && i < zones.length - 1 && 'min-w-0')}>
                  <span
                    className={cn(
                      'absolute top-1/2 -start-3 size-1.5 -translate-y-1/2 rounded-full bg-(--gs-color) transition-[opacity,scale] yj-duration-fast ease-enter',
                      i === zone ? 'opacity-100' : 'scale-50 opacity-0',
                    )}
                  />
                  {/* The end zones may reach past their stretch towards the middle rather than truncate: they name the ends. */}
                  <span className={cn('own:block whitespace-nowrap', i > 0 && i < zones.length - 1 && 'truncate @max-sm:overflow-visible')}>{z.label}</span>
                </span>
              </span>
            ))}
          </div>
        )}
      </SliderPrimitive.Root>
    </DirectionProvider>
  )
}

export { GradientSlider, type GradientSliderProps, type GradientSliderZone }
