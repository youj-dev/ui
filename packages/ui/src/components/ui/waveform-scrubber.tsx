'use client'

import { useLayoutEffect, useMemo, useRef, useState, type ComponentProps, type PointerEvent } from 'react'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import { Slider as SliderPrimitive } from '@base-ui/react/slider'
import { useInView } from 'motion/react'
import { useSoundCue } from '@youj/core'
import { useComponentLabels, waveformScrubberLabels } from '@youj/core/labels'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, numberFormat } from '../../lib/utils'

/* Where you are in a recording, drawn as its sound: a bar per slice of the
 * loudness samples you pass (no audio decoding here), played bars in ink and
 * the rest dim, chapter starts as ticks with their titles above, and a ruler
 * of minutes underneath. Drag anywhere or use the keys to scrub (a Base UI
 * slider underneath: arrows step, Page Up and Page Down step ten times as
 * far, Home and End jump to the ends); hovering shows the time and chapter
 * under the pointer. With `clip` it becomes a range: two handles in the
 * accent bracket the part to share and the rest dims.
 * - Motion: on first view the bars rise from the midline in a pass from the
 *   start (the deliberate token across the whole wave). The playhead moves
 *   with the value, never eased, so it stays under the finger.
 * - Sound: crossing into another chapter while scrubbing plays a `tick`.
 * - Reduced motion: the bars are drawn in place.
 * - Time runs left to right in every script, like a tape, so the wave keeps
 *   its direction under RTL; the text around it follows the page. */

interface WaveformChapter {
  /** Where it starts, in seconds. */
  start: number
  title: string
}

interface WaveformScrubberProps extends Omit<ComponentProps<'div'>, 'children' | 'defaultValue' | 'onChange'> {
  /** Loudness samples from 0 to 1, spread evenly over the recording; resampled to the bars that fit. */
  peaks: readonly number[]
  /** The recording's length, in seconds. */
  duration: number
  /** The playhead, in seconds (controlled). */
  value?: number
  defaultValue?: number
  onValueChange?: (seconds: number) => void
  /** When a drag or key press ends: the moment to seek a real player. */
  onValueCommitted?: (seconds: number) => void
  chapters?: readonly WaveformChapter[]
  /** A range to clip, in seconds (controlled): the handles show and the rest dims. `null` for none. */
  clip?: readonly [number, number] | null
  onClipChange?: (range: [number, number]) => void
  /** Seconds per arrow key (a clip's handles move by the second). Default 5. */
  step?: number
  /** How many bars. Default: as many as fit, one every 5px. */
  bars?: number
  /** The playhead's accessible name. Default: the labels' "Seek". */
  label?: string
  /** Default: the YoujProvider locale. */
  locale?: string
  disabled?: boolean
  /** With sound on, scrubbing across a chapter start plays `tick`. Default true. */
  sound?: boolean
}

const PITCH = 5
const f = (n: number) => Math.round(n * 100) / 100

/** A time as a clock reads it, in the locale's digits: 0:42, 12:34, 1:02:10. */
function formatTimecode(seconds: number, locale?: string) {
  const whole = Math.max(0, Math.round(seconds))
  const two = numberFormat(locale, { minimumIntegerDigits: 2, useGrouping: false })
  const one = numberFormat(locale, { useGrouping: false })
  const h = Math.floor(whole / 3600)
  const m = Math.floor((whole % 3600) / 60)
  const s = whole % 60
  return h ? `${one.format(h)}:${two.format(m)}:${two.format(s)}` : `${one.format(m)}:${two.format(s)}`
}

/** `count` bars from the samples: each takes the loudest sample in its slice, so short peaks survive. */
function resample(peaks: readonly number[], count: number) {
  if (!peaks.length || count <= 0) return []
  return Array.from({ length: count }, (_, i) => {
    const from = Math.floor((i / count) * peaks.length)
    const to = Math.max(from + 1, Math.floor(((i + 1) / count) * peaks.length))
    let peak = 0
    for (let j = from; j < to; j++) peak = Math.max(peak, peaks[j] ?? 0)
    return Math.min(1, Math.max(0, peak))
  })
}

/** The window a clip is edited in: the clip with room either side (at least a minute), kept inside the recording. */
function windowFor(clip: readonly [number, number], span: number): [number, number] {
  const half = Math.max(60, (clip[1] - clip[0]) * 2)
  const mid = (clip[0] + clip[1]) / 2
  const width = Math.min(span, half * 2)
  // On a whole second, so the handles' one-second steps land on whole seconds.
  const start = Math.floor(Math.min(Math.max(0, mid - width / 2), span - width))
  return [start, start + width]
}

const chapterAt = (chapters: readonly WaveformChapter[], t: number) => {
  let index = -1
  chapters.forEach((c, i) => {
    if (t >= c.start) index = i
  })
  return index
}

function WaveformScrubber({
  peaks,
  duration,
  value,
  defaultValue = 0,
  onValueChange,
  onValueCommitted,
  chapters = [],
  clip,
  onClipChange,
  step = 5,
  bars: barsProp,
  label,
  locale: localeProp,
  disabled,
  sound = true,
  className,
  style,
  ...props
}: WaveformScrubberProps) {
  const k = useYouj()
  const labels = useComponentLabels(waveformScrubberLabels)
  const locale = useLocale(localeProp)
  const cue = useSoundCue()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })
  const shown = k.reduced || inView
  const [position, setPosition] = useControllableState(value, defaultValue)
  const [hover, setHover] = useState<number | null>(null)

  // Bars to fit the width: one every PITCH px, measured once laid out.
  const [fit, setFit] = useState(120)
  useLayoutEffect(() => {
    const el = ref.current
    if (barsProp || !el) return
    const measure = () => {
      const width = el.getBoundingClientRect().width
      if (width > 0) setFit(Math.max(24, Math.floor(width / PITCH)))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [barsProp])
  const span = Math.max(1, duration)
  const clipping = !!clip
  // While clipping, the wave zooms to a window round the clip, set when the
  // clip starts so the handles stay put under the pointer.
  const zoom = useRef<[number, number] | null>(null)
  if (!clip) zoom.current = null
  else zoom.current ??= windowFor(clip, span)
  const [v0, v1] = zoom.current ?? [0, span]
  const view = Math.max(1, v1 - v0)

  // One bar per slice of the view; never more bars than there are samples in it.
  const from = Math.floor((v0 / span) * peaks.length)
  const to = Math.max(from + 1, Math.ceil((v1 / span) * peaks.length))
  const count = Math.min(barsProp ?? fit, to - from)
  const heights = useMemo(() => resample(peaks.slice(from, to), count), [peaks, from, to, count])
  const path = useMemo(() => heights.map((h, i) => `M${f(i + 0.5)} ${f(50 - (4 + h * 42))}V${f(50 + 4 + h * 42)}`).join(''), [heights])

  const at = (t: number) => Math.min(100, Math.max(0, ((t - v0) / view) * 100))
  const playhead = Math.min(span, Math.max(0, position))
  const current = chapterAt(chapters, playhead)
  const time = (t: number) => formatTimecode(t, locale)
  const total = time(span)

  const seek = (next: number) => {
    const prev = chapterAt(chapters, playhead)
    setPosition(next)
    onValueChange?.(next)
    if (sound && chapters.length && chapterAt(chapters, next) !== prev) cue('tick')
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    if (box.width > 0) setHover(v0 + Math.min(1, Math.max(0, (e.clientX - box.left) / box.width)) * view)
  }

  // The ruler: minor and major ticks to suit the span on show (minutes and ten minutes for an episode, seconds for a clip).
  const [minor, major] = view > 3 * 3600 ? [900, 3600] : view > 3600 ? [300, 1800] : view > 600 ? [60, 600] : view > 180 ? [10, 60] : [5, 30]
  const ticks: number[] = []
  for (let t = Math.ceil(v0 / minor) * minor; t <= v1; t += minor) ticks.push(t)
  const visible = (c: WaveformChapter, i: number) => (chapters[i + 1]?.start ?? span) > v0 && c.start < v1

  const layer = (tone: string, clipPath: string, extra?: string) => (
    <svg
      aria-hidden
      viewBox={`0 0 ${Math.max(1, heights.length)} 100`}
      preserveAspectRatio="none"
      className={cn('pointer-events-none absolute inset-0 size-full overflow-visible', extra)}
      style={{ clipPath }}
    >
      <path d={path} className={tone} strokeWidth={3} strokeLinecap="round" vectorEffect="non-scaling-stroke" fill="none" />
    </svg>
  )

  const thumb = (index: number | undefined, name: string, kind: 'playhead' | 'start' | 'end') => (
    <SliderPrimitive.Thumb
      key={kind}
      index={index}
      aria-label={name}
      getAriaValueText={(_, v) =>
        kind === 'playhead' ? labels.waveformPosition(time(v), total, chapters[chapterAt(chapters, v)]?.title) : labels.waveformPosition(time(v), total)
      }
      data-slot={kind === 'playhead' ? 'waveform-playhead' : 'waveform-handle'}
      data-kind={kind}
      className="group/thumb z-10 own:flex h-[calc(100%+0.75rem)] w-5 justify-center outline-none focus-ring-within"
    >
      {kind === 'playhead' ? (
        <>
          <span aria-hidden className="h-full w-0.5 rounded-full bg-accent" />
          <span aria-hidden className="absolute -top-1 size-2.5 rounded-full bg-accent ring-2 ring-surface transition-[scale] yj-duration-fast ease-enter group-data-dragging/thumb:scale-125" />
        </>
      ) : (
        <span
          aria-hidden
          className={cn(
            'relative h-full w-1.5 bg-accent transition-[width] yj-duration-fast ease-standard group-data-dragging/thumb:w-2',
            kind === 'start' ? 'rounded-s-full' : 'rounded-e-full',
          )}
        >
          <span className="absolute inset-y-1/3 left-1/2 w-px -translate-x-1/2 bg-on-accent/70 youj-allow-tint" />
        </span>
      )}
    </SliderPrimitive.Thumb>
  )

  const hoverChapter = hover !== null ? chapters[chapterAt(chapters, hover)] : undefined

  return (
    <DirectionProvider direction="ltr">
      <div
        ref={ref}
        dir="ltr"
        data-slot="waveform-scrubber"
        data-clipping={clipping || undefined}
        data-reduced-motion={k.reduced || undefined}
        className={cn('@container/waveform own:flex w-full min-w-0 flex-col gap-2 select-none', className)}
        style={style}
        {...props}
      >
        {chapters.length > 0 && (
          <div aria-hidden data-slot="waveform-chapters" className="relative h-4">
            {chapters.map((c, i) => {
              const end = chapters[i + 1]?.start ?? span
              if (!visible(c, i)) return null
              return (
                <span
                  key={`${c.start}-${c.title}`}
                  data-slot="waveform-chapter"
                  data-current={i === current || undefined}
                  className={cn(
                    'absolute top-0 truncate ps-1.5 pe-1 own:text-ui-xs own:leading-4 transition-colors yj-duration-fast ease-standard',
                    'own:font-(family-name:--yj-label-font) own:tracking-(--yj-label-tracking) own:[text-transform:var(--yj-label-case)]',
                    // In a narrow wave only the chapter playing keeps its title, from the start, in full.
                    i === current ? 'own:text-fg @max-md/waveform:left-0! @max-md/waveform:w-full!' : 'own:text-fg-muted own:@max-md/waveform:hidden',
                  )}
                  style={{ left: `${at(c.start)}%`, width: `${at(end) - at(c.start)}%` }}
                >
                  <span dir="auto">{c.title}</span>
                </span>
              )
            })}
          </div>
        )}

        <SliderPrimitive.Root
          key={clipping ? 'clip' : 'seek'}
          value={clip ? [...clip] : playhead}
          min={v0}
          max={v1}
          step={clipping ? 1 : step}
          largeStep={clipping ? 10 : step * 10}
          minStepsBetweenValues={clipping ? 1 : undefined}
          disabled={disabled}
          thumbAlignment="center"
          locale={locale}
          onValueChange={(next) => {
            if (Array.isArray(next)) onClipChange?.([next[0]!, next[1]!])
            else seek(next)
          }}
          onValueCommitted={(next) => {
            if (!Array.isArray(next)) onValueCommitted?.(next)
          }}
          data-slot="waveform-slider"
          className="relative"
        >
          <SliderPrimitive.Control
            data-slot="waveform-control"
            className={cn('relative h-16 touch-none', disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer')}
            onPointerMove={onPointerMove}
            onPointerLeave={() => setHover(null)}
          >
            <SliderPrimitive.Track data-slot="waveform-track" className="relative h-full w-full">
              {/* On first view the wave rises from the midline as it's revealed from the start. */}
              <div
                aria-hidden
                data-slot="waveform-bars"
                className={cn(
                  'absolute inset-0 origin-center transition-[clip-path,scale] yj-duration-deliberate ease-enter',
                  shown ? '[clip-path:inset(0_0_0_0)]' : 'scale-y-[0.3] [clip-path:inset(0_100%_0_0)]',
                )}
              >
                {layer(clipping ? 'stroke-line' : 'stroke-line-strong', 'none')}
                {!clipping && hover !== null && hover > playhead && layer('stroke-line-strong', `inset(0 ${100 - at(hover)}% 0 0)`)}
                {!clipping && layer('stroke-fg', `inset(0 ${100 - at(playhead)}% 0 0)`)}
                {clip && layer('stroke-accent', `inset(0 ${100 - at(clip[1])}% 0 ${at(clip[0])}%)`)}
              </div>
              {chapters.slice(1).filter((c) => c.start > v0 && c.start < v1).map((c) => (
                <span
                  key={c.start}
                  aria-hidden
                  data-slot="waveform-chapter-tick"
                  className="absolute -top-1.5 -bottom-1.5 w-px -translate-x-1/2 bg-fg-subtle"
                  style={{ left: `${at(c.start)}%` }}
                />
              ))}
              <SliderPrimitive.Indicator
                data-slot="waveform-range"
                className={cn('rounded-sm', clipping ? 'h-full bg-accent-subtle' : 'own:hidden')}
              />
              {hover !== null && !clipping && (
                <span aria-hidden data-slot="waveform-hover" className="pointer-events-none absolute inset-y-0 w-px bg-line-strong" style={{ left: `${at(hover)}%` }}>
                  <span className="absolute -top-2 left-1/2 own:flex -translate-x-1/2 -translate-y-full items-baseline gap-1.5 rounded-md bg-overlay px-2 py-1 own:text-ui-xs whitespace-nowrap own:text-fg shadow-sm-soft">
                    <span data-slot="waveform-value" className="own:tabular-nums">
                      {time(hover)}
                    </span>
                    {hoverChapter && <span className="max-w-40 truncate own:text-fg-muted">{hoverChapter.title}</span>}
                  </span>
                </span>
              )}
              {clip
                ? [thumb(0, labels.waveformClipStart, 'start'), thumb(1, labels.waveformClipEnd, 'end')]
                : thumb(undefined, label ?? labels.waveformSeek, 'playhead')}
            </SliderPrimitive.Track>
          </SliderPrimitive.Control>
        </SliderPrimitive.Root>

        <div aria-hidden data-slot="waveform-ruler" className="@container/ruler relative h-5">
          {ticks.map((t) => {
            const big = t % major === 0
            return (
              <span
                key={t}
                className={cn('absolute top-0 w-px -translate-x-1/2', big ? 'h-2 bg-fg-subtle' : 'h-1 bg-fg-subtle')}
                style={{ left: `${at(t)}%` }}
              />
            )
          })}
          <span data-slot="waveform-time" className="absolute start-0 top-2.5 own:text-ui-xs own:leading-none own:text-fg-muted own:tabular-nums">
            {time(v0)}
          </span>
          {ticks
            .filter((t) => t % major === 0 && at(t) > 7 && at(t) < 93)
            .map((t) => (
              <span
                key={`l${t}`}
                data-slot="waveform-time"
                className={cn(
                  'absolute top-2.5 -translate-x-1/2 own:text-ui-xs own:leading-none own:text-fg-muted own:tabular-nums',
                  // On a narrow ruler (under 24rem) 7% is less than a label: one near an end would print over the end's time.
                  (at(t) < 16 || at(t) > 84) && 'own:@max-sm/ruler:hidden',
                )}
                style={{ left: `${at(t)}%` }}
              >
                {time(t)}
              </span>
            ))}
          <span data-slot="waveform-time" className="absolute end-0 top-2.5 own:text-ui-xs own:leading-none own:text-fg-muted own:tabular-nums">
            {time(v1)}
          </span>
        </div>
      </div>
    </DirectionProvider>
  )
}

export { formatTimecode, WaveformScrubber, type WaveformChapter, type WaveformScrubberProps }
