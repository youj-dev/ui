'use client'

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ComponentProps, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import { Slider as SliderPrimitive } from '@base-ui/react/slider'
import { useSoundCue } from '@youj/core'
import { MinusIcon, PlusIcon } from '@youj/icons'
import { trackTimelineLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { clamp, cn, numberFormat } from '../../lib/utils'
import { Button } from './button'
import { Toggle } from './toggle'
import { formatTimecode } from './waveform-scrubber'

/* Tracks of clips along a time ruler, for an edit: each track a lane in its
 * chart color, each clip a rounded bar holding the slice of the track's
 * sound it plays (bars from the loudness samples you pass; no decoding),
 * scaled by its gain. Drag a clip to move it, or its edges to trim it; both
 * snap to the other clips' edges and the playhead (hold Alt to place
 * freely), and a guide shows the edge they caught. Mute and solo sit on each
 * track's head, beside a level meter that reads the track at the playhead
 * while it plays. The playhead is a slider on the ruler; − and + (or Ctrl
 * or ⌘ and the wheel) zoom about it, and the lane follows it while playing.
 * - Keyboard: every clip is a tab stop. Arrows move it by `step`, Shift ten
 *   times as far, stopping at a snap point on the way; the selected clip's
 *   edges come next in the tab order, as sliders that trim it.
 * - Time runs left to right in every script, like a tape; the heads and the
 *   text follow the page.
 * - Motion: the level meters ease between readings on the fast token; drags
 *   and the playhead follow the pointer and the clock, never eased.
 * - Reduced motion: the meters jump to each reading. */

interface TimelineTrack {
  id: string
  name: string
  /** A short line under the name: "Voice memo", "DI". */
  caption?: string
  /** One of the five chart colors. Default: the track's place, wrapping. */
  color?: 1 | 2 | 3 | 4 | 5
  /** The track's source as loudness from 0 to 1, one sample every `resolution` seconds from its start. */
  peaks: readonly number[]
  muted?: boolean
  solo?: boolean
}

interface TimelineClip {
  id: string
  /** The track it plays on. */
  track: string
  name: string
  /** Where it sits on the timeline, in seconds. */
  start: number
  end: number
  /** Where in the track's source it begins, in seconds. Default 0. */
  offset?: number
  /** Gain in decibels, which scales its wave. Default 0. */
  gain?: number
}

interface TrackTimelineProps extends Omit<ComponentProps<'div'>, 'children' | 'defaultValue' | 'onChange'> {
  tracks: readonly TimelineTrack[]
  /** The clips (controlled): every move and trim reports the whole list. */
  clips: readonly TimelineClip[]
  onClipsChange?: (clips: TimelineClip[]) => void
  onTrackChange?: (id: string, change: { muted?: boolean; solo?: boolean }) => void
  /** The timeline's length, in seconds. */
  duration: number
  /** The playhead, in seconds (controlled). */
  position?: number
  defaultPosition?: number
  onPositionChange?: (seconds: number) => void
  /** The selected clip's id (controlled); `null` for none. */
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (id: string | null) => void
  /** Pixels per second (controlled). Default: the whole timeline in view, at least 8. */
  zoom?: number
  defaultZoom?: number
  onZoomChange?: (pxPerSecond: number) => void
  /** Seconds per sample in the tracks' peaks. Default 0.1. */
  resolution?: number
  /** Snap moves and trims to the other clips' edges and the playhead. Default true. */
  snap?: boolean
  /** Seconds an arrow key moves or trims a clip. Default 0.5. */
  step?: number
  /** While playing, the meters read the tracks at the playhead and the lane follows it. */
  playing?: boolean
  /** The timeline's accessible name. Default: the labels' "Timeline". */
  label?: string
  /** Default: the YoujProvider locale. */
  locale?: string
  /** With sound on, catching a snap point plays `tick`. Default true. */
  sound?: boolean
}

const ROW = 56
const RULER = 28
const MIN_CLIP = 0.5
const SNAP_PX = 8
const ZOOM_STEP = 1.5
const MIN_ZOOM = 2
const MAX_ZOOM = 96
const BAR = 3
/** Ticks and labels: a label every `major` seconds at least 64px apart, ticks every `minor`. */
const SCALES: [major: number, minor: number][] = [
  [1, 0.25],
  [2, 0.5],
  [5, 1],
  [10, 2],
  [15, 5],
  [30, 5],
  [60, 10],
  [120, 30],
  [300, 60],
]

const f = (n: number) => Math.round(n * 100) / 100

/** A time with its tenths, the way the timeline speaks it: 0:12.5, 1:04.0. */
function formatClipTime(seconds: number, locale?: string) {
  const t = Math.max(0, Math.round(seconds * 10) / 10)
  const whole = Math.floor(t)
  const tenth = numberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).formatToParts(t - whole + 10)
  const decimal = tenth.find((p) => p.type === 'decimal')?.value ?? '.'
  const digit = tenth.find((p) => p.type === 'fraction')?.value ?? '0'
  return `${formatTimecode(whole, locale)}${decimal}${digit}`
}

/** `count` bars for a slice of samples: each takes its loudest, so short peaks survive. */
function bars(peaks: readonly number[], from: number, to: number, count: number, scale: number) {
  const span = Math.max(1, to - from)
  return Array.from({ length: Math.max(1, count) }, (_, i) => {
    const a = from + Math.floor((i / count) * span)
    const b = Math.max(a + 1, from + Math.floor(((i + 1) / count) * span))
    let peak = 0
    for (let j = a; j < b; j++) peak = Math.max(peak, peaks[j] ?? 0)
    return Math.min(1, peak * scale)
  })
}

const gainScale = (db = 0) => 10 ** (db / 20)

interface Drag {
  id: string
  mode: 'move' | 'start' | 'end'
  x: number
  clip: TimelineClip
  pointer: number
}

function TrackTimeline({
  tracks,
  clips,
  onClipsChange,
  onTrackChange,
  duration,
  position,
  defaultPosition = 0,
  onPositionChange,
  value,
  defaultValue = null,
  onValueChange,
  zoom: zoomProp,
  defaultZoom,
  onZoomChange,
  resolution = 0.1,
  snap = true,
  step = 0.5,
  playing = false,
  label,
  locale: localeProp,
  sound = true,
  className,
  ...props
}: TrackTimelineProps) {
  const k = useYouj()
  const labels = useComponentLabels(trackTimelineLabels)
  const locale = useLocale(localeProp)
  const cue = useSoundCue()
  const hintId = useId()
  const { announce, announcer } = useAnnouncer()
  const scroller = useRef<HTMLDivElement>(null)
  const [playhead, setPlayhead] = useControllableState(position, defaultPosition)
  const [selected, setSelected] = useControllableState(value, defaultValue)
  const [fitZoom, setFitZoom] = useState<number | null>(null)
  const [ownZoom, setOwnZoom] = useState<number | null>(defaultZoom ?? null)
  const zoom = zoomProp ?? ownZoom ?? fitZoom ?? 12
  const [drag, setDrag] = useState<Drag | null>(null)
  const [guide, setGuide] = useState<number | null>(null)
  const width = Math.ceil(duration * zoom)
  const span = Math.max(1, duration)
  const time = (t: number) => formatClipTime(t, locale)
  const soloing = tracks.some((t) => t.solo)
  const audible = (t: TimelineTrack) => !t.muted && (!soloing || !!t.solo)
  const trackOf = useMemo(() => new Map(tracks.map((t, i) => [t.id, { track: t, index: i }])), [tracks])

  // Until someone zooms, the whole timeline fits the lane (never tighter than 8px a second).
  useLayoutEffect(() => {
    const el = scroller.current
    if (!el) return
    const measure = () => {
      const w = el.clientWidth
      if (w > 0) setFitZoom(Math.max(8, (w - 16) / span))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [span])

  const setZoom = (next: number, anchor?: number) => {
    const el = scroller.current
    const z = clamp(next, MIN_ZOOM, MAX_ZOOM)
    // Keep the anchor (the playhead, or the time under the pointer) where it is on screen.
    const at = anchor ?? playhead
    const screenX = el ? at * zoom - el.scrollLeft : 0
    if (zoomProp === undefined) setOwnZoom(z)
    onZoomChange?.(z)
    if (el) requestAnimationFrame(() => (el.scrollLeft = Math.max(0, at * z - screenX)))
  }

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const onWheel = (e: globalThis.WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      e.preventDefault()
      const box = el.getBoundingClientRect()
      const at = (el.scrollLeft + e.clientX - box.left) / zoom
      setZoom(zoom * Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0025)), at)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  })

  // Once laid out, the lane opens with the playhead in view, a third of the way in.
  const opened = useRef(false)
  useLayoutEffect(() => {
    const el = scroller.current
    if (opened.current || !el || fitZoom === null) return
    opened.current = true
    const x = playhead * zoom
    if (x > el.clientWidth - 24) el.scrollLeft = Math.max(0, x - el.clientWidth / 3)
  }, [fitZoom, playhead, zoom])

  // While playing, the lane turns the page when the playhead nears its end.
  useEffect(() => {
    const el = scroller.current
    if (!playing || !el) return
    const x = playhead * zoom
    if (x > el.scrollLeft + el.clientWidth - 32 || x < el.scrollLeft) el.scrollLeft = Math.max(0, x - 48)
  }, [playing, playhead, zoom])

  const seek = (t: number) => {
    const next = clamp(t, 0, duration)
    setPlayhead(next)
    onPositionChange?.(next)
  }
  const select = (id: string | null) => {
    if (id === selected) return
    setSelected(id)
    onValueChange?.(id)
  }

  /** The source's length for a clip, in seconds. */
  const sourceLength = (c: TimelineClip) => (trackOf.get(c.track)?.track.peaks.length ?? 0) * resolution

  /** A clip's room on its track: from the end of the clip before it to the start of the one after. */
  const room = (c: TimelineClip) => {
    const same = clips.filter((o) => o.track === c.track && o.id !== c.id)
    const before = Math.max(0, ...same.filter((o) => o.end <= c.start + 1e-6).map((o) => o.end))
    const after = Math.min(duration, ...same.filter((o) => o.start >= c.end - 1e-6).map((o) => o.start))
    return [before, after] as const
  }

  /** The times a moving edge may catch: every other clip's edges, the playhead and the ends. */
  const targets = (c: TimelineClip) => [0, duration, playhead, ...clips.filter((o) => o.id !== c.id).flatMap((o) => [o.start, o.end])]

  /** The nearest target within the snap distance of any of `edges`, as the shift to reach it. */
  const snapShift = (c: TimelineClip, edges: number[]) => {
    let best: { shift: number; at: number } | null = null
    const reach = SNAP_PX / zoom
    for (const t of targets(c))
      for (const e of edges) {
        const d = t - e
        if (Math.abs(d) <= reach && (!best || Math.abs(d) < Math.abs(best.shift))) best = { shift: d, at: t }
      }
    return best
  }

  /** Applies a move or trim of `delta` seconds, within the clip's room and its source, snapping unless told not to. */
  const change = (c: TimelineClip, mode: Drag['mode'], delta: number, snapping: boolean, through = false): { clip: TimelineClip; at: number | null } => {
    const [lo, hi] = room(c)
    const offset = c.offset ?? 0
    const length = c.end - c.start
    const source = sourceLength(c)
    let at: number | null = null
    if (mode === 'move') {
      let start = c.start + delta
      if (snapping) {
        if (through) {
          // A key press stops at the first snap point on its way.
          const passed = targets(c)
            .flatMap((t) => [t - c.start, t - c.end])
            .filter((d) => (delta > 0 ? d > 1e-6 && d < delta : d < -1e-6 && d > delta))
            .sort((a, b) => Math.abs(a) - Math.abs(b))[0]
          if (passed !== undefined) start = c.start + passed
        } else {
          const s = snapShift(c, [start, start + length])
          if (s) {
            start += s.shift
            at = s.at
          }
        }
      }
      start = clamp(start, lo, hi - length)
      return { clip: { ...c, start: f(start), end: f(start + length) }, at }
    }
    if (mode === 'start') {
      let start = c.start + delta
      if (snapping) {
        const s = through ? null : snapShift(c, [start])
        if (s) {
          start += s.shift
          at = s.at
        }
      }
      start = clamp(start, Math.max(lo, c.start - offset), c.end - MIN_CLIP)
      return { clip: { ...c, start: f(start), offset: f(offset + (start - c.start)) }, at }
    }
    let end = c.end + delta
    if (snapping) {
      const s = through ? null : snapShift(c, [end])
      if (s) {
        end += s.shift
        at = s.at
      }
    }
    end = clamp(end, c.start + MIN_CLIP, Math.min(hi, source ? c.start + (source - offset) : hi))
    return { clip: { ...c, end: f(end) }, at }
  }

  const commit = (next: TimelineClip) => onClipsChange?.(clips.map((c) => (c.id === next.id ? next : c)))

  const onPointerDown = (c: TimelineClip, mode: Drag['mode']) => (e: PointerEvent<HTMLElement>) => {
    if (e.button !== 0) return
    e.stopPropagation()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    select(c.id)
    setDrag({ id: c.id, mode, x: e.clientX, clip: c, pointer: e.pointerId })
  }
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (!drag || e.pointerId !== drag.pointer) return
    const { clip, at } = change(drag.clip, drag.mode, (e.clientX - drag.x) / zoom, snap && !e.altKey)
    if (at !== guide) {
      setGuide(at)
      if (at !== null && sound) cue('tick')
    }
    commit(clip)
  }
  const onPointerUp = () => {
    setDrag(null)
    setGuide(null)
  }

  const nudge = (c: TimelineClip, mode: Drag['mode']) => (e: KeyboardEvent<HTMLElement>) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!dir) {
      if (mode === 'move' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        select(c.id)
      }
      if (e.key === 'Escape' && selected) select(null)
      return
    }
    e.preventDefault()
    const { clip } = change(c, mode, dir * step * (e.shiftKey ? 10 : 1), snap, true)
    commit(clip)
    select(c.id)
    announce(labels.trackTimelineRange(time(clip.start), time(clip.end)))
  }

  const onZoomKeys = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return
    if (e.key === '+' || e.key === '=') setZoom(zoom * ZOOM_STEP)
    else if (e.key === '-' || e.key === '_') setZoom(zoom / ZOOM_STEP)
    else return
    e.preventDefault()
  }

  const [major, minor] = SCALES.find(([m]) => m * zoom >= 64) ?? SCALES.at(-1)!
  const ticks: number[] = []
  for (let t = 0; t <= duration + 1e-6; t += minor) ticks.push(Math.round(t * 100) / 100)

  const levelAt = (t: TimelineTrack) => {
    if (!playing || !audible(t)) return 0
    const c = clips.find((o) => o.track === t.id && playhead >= o.start && playhead < o.end)
    if (!c) return 0
    const i = Math.floor(((c.offset ?? 0) + playhead - c.start) / resolution)
    return Math.min(1, (t.peaks[i] ?? 0) * gainScale(c.gain))
  }

  return (
    <div
      data-slot="track-timeline"
      data-reduced-motion={k.reduced || undefined}
      data-dragging={drag ? drag.mode : undefined}
      role="group"
      aria-label={label ?? labels.trackTimeline}
      onKeyDown={onZoomKeys}
      className={cn('@container/timeline w-full min-w-0 overflow-hidden own:rounded-[min(var(--radius-xl),1rem)] border border-line own:bg-surface', className)}
      {...props}
    >
      <div className="own:grid grid-cols-[7.5rem_minmax(0,1fr)] @min-[36rem]/timeline:grid-cols-[11rem_minmax(0,1fr)]">
        {/* The heads: zoom over them, then a head per track. */}
        <div data-slot="track-timeline-heads" className="own:flex flex-col border-e border-line">
          <div data-slot="track-timeline-zoom" className="own:flex items-center gap-0.5 border-b border-line own:px-1.5" style={{ height: RULER }}>
            <Button variant="ghost" size="icon-xs" aria-label={labels.zoomOut} disabled={zoom <= MIN_ZOOM} onClick={() => setZoom(zoom / ZOOM_STEP)}>
              <MinusIcon size={13} />
            </Button>
            <Button variant="ghost" size="icon-xs" aria-label={labels.zoomIn} disabled={zoom >= MAX_ZOOM} onClick={() => setZoom(zoom * ZOOM_STEP)}>
              <PlusIcon size={13} />
            </Button>
          </div>
          {tracks.map((t, i) => {
            const level = levelAt(t)
            return (
              <div
                key={t.id}
                data-slot="track-timeline-track-head"
                data-muted={t.muted || undefined}
                data-solo={t.solo || undefined}
                className={cn('relative own:flex min-w-0 items-center gap-1 border-b border-line own:ps-3 own:pe-1.5 last:border-b-0 @min-[36rem]/timeline:gap-2', !audible(t) && 'opacity-60')}
                style={{ height: ROW, '--track': `var(--color-chart-${t.color ?? (i % 5) + 1})` } as CSSProperties}
              >
                <span aria-hidden className="absolute inset-y-2 start-0 w-[3px] rounded-e-full bg-(--track)" />
                <div className="own:flex min-w-0 flex-1 flex-col gap-1">
                  <span data-slot="track-timeline-track-name" className="truncate own:text-ui-sm own:leading-none own:font-medium own:text-fg">
                    {t.name}
                  </span>
                  {t.caption && (
                    <span data-slot="track-timeline-track-caption" className={cn('own:hidden truncate own:text-ui-xs own:leading-none own:@min-[36rem]/timeline:block', audible(t) ? 'own:text-fg-muted' : 'own:text-fg')}>
                      {t.caption}
                    </span>
                  )}
                </div>
                <Toggle
                  size="sm"
                  aria-label={labels.trackTimelineMute(t.name)}
                  pressed={!!t.muted}
                  onPressedChange={(muted) => onTrackChange?.(t.id, { muted })}
                  data-slot="track-timeline-mute"
                  // shape: a 24px M key beside its track's name, as a mixer has
                  className="size-6 min-w-0 own:px-0 font-mono text-ui-xs data-pressed:bg-warning-subtle data-pressed:text-warning-text"
                >
                  M
                </Toggle>
                <Toggle
                  size="sm"
                  aria-label={labels.trackTimelineSolo(t.name)}
                  pressed={!!t.solo}
                  onPressedChange={(solo) => onTrackChange?.(t.id, { solo })}
                  data-slot="track-timeline-solo"
                  // shape: a 24px S key beside its track's name, as a mixer has
                  className="size-6 min-w-0 own:px-0 font-mono text-ui-xs data-pressed:bg-accent-subtle data-pressed:text-accent-text"
                >
                  S
                </Toggle>
                {/* The level at the playhead, in ten cells from the foot. */}
                <span aria-hidden data-slot="track-timeline-meter" className="own:flex h-7 w-1 shrink-0 flex-col-reverse gap-px">
                  {Array.from({ length: 10 }, (_, cell) => (
                    <span
                      key={cell}
                      className={cn(
                        'min-h-0 flex-1 rounded-[1px] transition-colors yj-duration-fast ease-standard',
                        level * 10 > cell + 0.25 ? (cell >= 8 ? 'bg-warning' : 'bg-(--track)') : 'bg-well',
                      )}
                    />
                  ))}
                </span>
              </div>
            )
          })}
        </div>

        {/* The lane: time runs left to right in every script. */}
        <DirectionProvider direction="ltr">
          <div ref={scroller} dir="ltr" data-slot="track-timeline-lane" className="yj-scrollbar relative min-w-0 overflow-x-auto overflow-y-hidden">
            <div className="relative" style={{ width: width + 16 }}>
              <SliderPrimitive.Root
                value={clamp(playhead, 0, duration)}
                min={0}
                max={duration}
                step={0.1}
                largeStep={5}
                thumbAlignment="center"
                locale={locale}
                onValueChange={(v) => seek(Array.isArray(v) ? v[0]! : (v as number))}
                data-slot="track-timeline-ruler"
                className="relative border-b border-line"
                style={{ height: RULER, width }}
              >
                <SliderPrimitive.Control data-slot="track-timeline-ruler-control" className="relative h-full w-full cursor-pointer touch-none">
                  <SliderPrimitive.Track data-slot="track-timeline-ruler-track" className="relative h-full w-full">
                    {ticks.map((t) => {
                      const big = Math.abs(t / major - Math.round(t / major)) < 1e-6
                      return (
                        <span key={t} aria-hidden className={cn('absolute bottom-0 w-px', big ? 'h-2.5 bg-fg-subtle' : 'h-1 bg-fg-subtle')} style={{ left: t * zoom }}>
                          {big && t * zoom + 32 <= width + 16 && (
                            <span /* youj-allow: physical side, the lane is forced to dir="ltr" (time runs left to right) */ data-slot="track-timeline-time" className="absolute bottom-3 left-1 own:font-mono own:text-ui-xs own:leading-none own:text-fg-muted own:tabular-nums">
                              {formatTimecode(t, locale)}
                            </span>
                          )}
                        </span>
                      )
                    })}
                    <SliderPrimitive.Thumb
                      aria-label={labels.trackTimelinePlayhead}
                      getAriaValueText={(_, v) => labels.waveformPosition(time(v), time(duration))}
                      data-slot="track-timeline-playhead"
                      className="z-20 own:flex h-full w-4 justify-center outline-none focus-ring-within"
                    >
                      <span aria-hidden className="own:mt-auto h-3.5 w-2.5 rounded-t-[2px] rounded-b-[6px] bg-accent" />
                    </SliderPrimitive.Thumb>
                  </SliderPrimitive.Track>
                </SliderPrimitive.Control>
              </SliderPrimitive.Root>

              <div data-slot="track-timeline-tracks" className="relative" onPointerDown={() => select(null)}>
                {tracks.map((t, i) => {
                  const on = audible(t)
                  return (
                    <div
                      key={t.id}
                      role="group"
                      aria-label={t.name}
                      data-slot="track-timeline-track"
                      className="relative border-b border-line last:border-b-0"
                      style={{ height: ROW, '--track': `var(--color-chart-${t.color ?? (i % 5) + 1})` } as CSSProperties}
                    >
                      {clips
                        .filter((c) => c.track === t.id)
                        .sort((a, b) => a.start - b.start)
                        .map((c) => {
                          const isSelected = selected === c.id
                          const px = (c.end - c.start) * zoom
                          const count = Math.max(1, Math.floor((px - 12) / BAR))
                          const from = Math.floor((c.offset ?? 0) / resolution)
                          const to = Math.floor(((c.offset ?? 0) + c.end - c.start) / resolution)
                          const heights = bars(t.peaks, from, to, count, gainScale(c.gain))
                          const path = heights.map((h, j) => `M${f(j + 0.5)} ${f(50 - (6 + h * 42))}V${f(50 + 6 + h * 42)}`).join('')
                          const name = labels.trackTimelineClip(c.name, labels.trackTimelineRange(time(c.start), time(c.end)), t.name)
                          return [
                            <div
                              key={c.id}
                              role="button"
                              tabIndex={0}
                              aria-label={name}
                              aria-pressed={isSelected}
                              aria-describedby={hintId}
                              data-slot="track-timeline-clip"
                              data-selected={isSelected || undefined}
                              data-muted={!on || undefined}
                              onPointerDown={onPointerDown(c, 'move')}
                              onPointerMove={onPointerMove}
                              onPointerUp={onPointerUp}
                              onPointerCancel={onPointerUp}
                              onFocus={() => select(c.id)}
                              onKeyDown={nudge(c, 'move')}
                              className={cn(
                                'group/clip absolute inset-y-1.5 own:flex cursor-grab touch-none flex-col overflow-hidden own:rounded-[min(var(--radius-md),0.5rem)] border outline-none focus-ring select-none',
                                'transition-[background-color,border-color,box-shadow,opacity] yj-duration-fast ease-standard',
                                on
                                  ? 'border-[color-mix(in_oklab,var(--track)_45%,transparent)] own:bg-[color-mix(in_oklab,var(--track)_calc(14%+8%*var(--yj-dark)),var(--color-surface))]'
                                  : 'border-line-subtle own:bg-band',
                                isSelected && on && 'own:bg-[color-mix(in_oklab,var(--track)_calc(24%+10%*var(--yj-dark)),var(--color-surface))] own:ring-2 ring-(--track)',
                                isSelected && !on && 'own:ring-2 ring-line-strong',
                                drag?.id === c.id && 'z-10 cursor-grabbing own:shadow-lg',
                              )}
                              style={{ left: c.start * zoom, width: Math.max(4, px) }}
                            >
                              <span data-slot="track-timeline-clip-name" className={cn('truncate px-2 pt-1 own:font-mono own:text-ui-xs own:leading-4', on ? 'own:text-fg' : 'own:text-fg-muted')}>
                                {c.name}
                              </span>
                              <svg aria-hidden data-slot="track-timeline-wave" viewBox={`0 0 ${Math.max(1, heights.length)} 100`} preserveAspectRatio="none" className="pointer-events-none own:mx-1.5 own:mb-1 min-h-0 flex-1 overflow-visible">
                                <path
                                  d={path}
                                  strokeWidth={1.5}
                                  strokeLinecap="round"
                                  vectorEffect="non-scaling-stroke"
                                  fill="none"
                                  className={on ? 'stroke-[color-mix(in_oklab,var(--track)_calc(62%+38%*var(--yj-dark)),var(--color-fg))]' : 'stroke-line-strong'}
                                />
                              </svg>
                            </div>,
                            isSelected &&
                              (['start', 'end'] as const).map((edge) => (
                                <div
                                  key={`${c.id}-${edge}`}
                                  role="slider"
                                  tabIndex={0}
                                  aria-label={edge === 'start' ? labels.trackTimelineClipStart(c.name) : labels.trackTimelineClipEnd(c.name)}
                                  aria-valuemin={0}
                                  aria-valuemax={duration}
                                  aria-valuenow={edge === 'start' ? c.start : c.end}
                                  aria-valuetext={time(edge === 'start' ? c.start : c.end)}
                                  aria-orientation="horizontal"
                                  data-slot="track-timeline-handle"
                                  data-edge={edge}
                                  onPointerDown={onPointerDown(c, edge)}
                                  onPointerMove={onPointerMove}
                                  onPointerUp={onPointerUp}
                                  onPointerCancel={onPointerUp}
                                  onKeyDown={nudge(c, edge)}
                                  className="group/handle absolute inset-y-1.5 z-10 own:flex w-6 cursor-ew-resize touch-none justify-center outline-none focus-ring"
                                  style={{ left: (edge === 'start' ? c.start : c.end) * zoom - 12 }}
                                >
                                  <span aria-hidden className="own:my-2 w-1 rounded-full bg-(--track) shadow-sm transition-[width] yj-duration-fast ease-standard group-hover/handle:w-1.5" />
                                </div>
                              )),
                          ]
                        })}
                    </div>
                  )
                })}
              </div>

              {/* The playhead's line through the tracks, and the edge a drag caught. */}
              <span aria-hidden data-slot="track-timeline-playhead-line" className="pointer-events-none absolute bottom-0 z-10 w-px own:bg-accent" style={{ top: RULER - 4, left: clamp(playhead, 0, duration) * zoom }} />
              {guide !== null && (
                <span aria-hidden data-slot="track-timeline-snap" className="pointer-events-none absolute inset-y-0 z-20 w-px own:bg-fg" style={{ left: guide * zoom }}>
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 rounded-sm bg-fg px-1 own:font-mono own:text-[10px] own:leading-4 own:text-canvas own:tabular-nums">{time(guide)}</span>
                </span>
              )}
            </div>
          </div>
        </DirectionProvider>
      </div>
      <p id={hintId} className="sr-only">
        {labels.trackTimelineHint}
      </p>
      {announcer}
    </div>
  )
}

export { TrackTimeline, formatClipTime, type TrackTimelineProps, type TimelineClip, type TimelineTrack }
