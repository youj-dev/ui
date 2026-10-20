'use client'

import { useId, useMemo, useRef, useState, type ComponentProps, type KeyboardEvent, type PointerEvent } from 'react'
import { m } from 'motion/react'
import { MotionFeatures } from '@youj/core'
import { MorphLabel } from '@youj/motion'
import { MoonIcon } from '@youj/icons/components/youj/icons/moon'
import { SunIcon } from '@youj/icons/components/youj/icons/sun'
import { useComponentLabels, worldClockLabels } from '@youj/core/labels'
import { useDirection, useLocale, useYouj } from '@youj/core/lib/youj/provider'
import { useLiveRegion } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { useNow } from '../../hooks/use-now'
import { clamp, cn, dateTimeFormat, listFormat, numberFormat, relativeTimeFormat } from '../../lib/utils'
import { Button } from './button'

/* Several time zones side by side, to find a time that works for everyone.
 * - A row per zone: its name, its offset from UTC and from the first row,
 *   the time there with a sun or a moon, and a strip of the first row's day,
 *   an hour per cell, colored by what that hour is there: working hours,
 *   the waking hours around them, or night. Where a zone's date turns over,
 *   a line marks it and the cell names the new day.
 * - The rows share one time axis: the first zone's day, midnight to
 *   midnight (23 or 25 hours on the days its clocks change). A cursor runs
 *   down all of them at the chosen moment, and every row reads that moment.
 *   Drag it, click a strip, or use the keys; it snaps to `step` minutes.
 *   With no moment chosen it follows the clock, and Now goes back to it.
 * - Where everyone is in working hours at once, a ring holds those hours
 *   across all rows, and the header says when.
 * - Pure Intl: offsets come from each zone's own clock at each moment, so
 *   every change of clocks lands where it does.
 * - Motion: the cursor glides on the snappy spring (it follows the pointer
 *   with no lag while dragged), and each time ticks over letter by letter.
 *   Reduced motion: the cursor jumps and the times change in place. */

type WorldClockPeriod = 'work' | 'evening' | 'night'

interface WorldClockZone {
  /** An IANA time zone: "Europe/London". */
  timeZone: string
  /** The row's name: a city, a person, or both ("Ada · London"). */
  label: string
  /** Working hours there, as local hours from 0 to 24: `[9, 17.5]` is 09:00 to 17:30. An overnight shift wraps (`[22, 6]`). Default `[9, 17]`. */
  workingHours?: [start: number, end: number]
}

interface WorldClockProps extends Omit<ComponentProps<'div'>, 'defaultValue' | 'onChange'> {
  /** The zones, one row each. The first is the reference: the axis is its day, and the others say how far they are from it. */
  zones: WorldClockZone[]
  /** The chosen moment. `null` follows the clock. Controlled. */
  value?: Date | number | null
  /** The moment chosen at first. Default `null`: the clock. */
  defaultValue?: Date | number | null
  /** Called with the chosen moment, or `null` when Now is pressed. */
  onValueChange?: (value: Date | null) => void
  /** The clock. Default: the device's, ticking every second once the page is live. */
  now?: Date | number
  /** Minutes the cursor snaps to and the arrow keys move by. Default 15. */
  step?: number
  /** 12- or 24-hour times. Default: the locale's. */
  hourCycle?: 12 | 24
  /** One line per zone and a slimmer strip, for a sidebar or a card. */
  compact?: boolean
  /** The accessible name of the whole. Default: the labels' "World clock". */
  label?: string
  /** Default: the YoujProvider locale. */
  locale?: string
}

const MINUTE = 60_000
const HOUR = 3_600_000
const DAY = 86_400_000
/** Waking hours outside work; the rest is night. */
const WAKE = 7
const SLEEP = 22
const WORK: [number, number] = [9, 17]
const VOICE = 'own:font-(family-name:--yj-label-font) own:tracking-(--yj-label-tracking) own:[text-transform:var(--yj-label-case)]'
const PERIOD_CLASS: Record<WorldClockPeriod, string> = {
  work: 'bg-accent-subtle own:text-accent-text',
  evening: 'bg-band own:text-fg-muted',
  night: 'bg-well own:text-fg-subtle',
}

/** The wall clock in `timeZone` at `t`: its date and time, and its offset from UTC in minutes. */
function wallClock(t: number, timeZone: string) {
  // Parsed, never shown: a fixed locale keeps the digits Latin and the order known.
  const parts = dateTimeFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' }).formatToParts(t)
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? 0)
  const year = get('year')
  const month = get('month')
  const day = get('day')
  const hour = get('hour') % 24
  const minute = get('minute')
  const date = Date.UTC(year, month - 1, day)
  return { date, hour, minute, hours: hour + minute / 60, offset: Math.round((date + hour * HOUR + minute * MINUTE - Math.floor(t / MINUTE) * MINUTE) / MINUTE) }
}

/** The first moment of the day that contains `t`, in `timeZone`: its midnight, or the moment after it where clocks skip it. */
function startOfDay(t: number, timeZone: string) {
  const { date } = wallClock(t, timeZone)
  let guess = date - wallClock(t, timeZone).offset * MINUTE
  for (let i = 0; i < 2; i++) guess = date - wallClock(guess, timeZone).offset * MINUTE
  for (let i = 0; i < 3 && wallClock(guess, timeZone).date < date; i++) guess += HOUR
  return guess
}

const within = (h: number, [from, to]: [number, number]) => (from <= to ? h >= from && h < to : h >= from || h < to)

function periodOf(hours: number, workingHours: [number, number]): WorldClockPeriod {
  if (within(hours, workingHours)) return 'work'
  return within(hours, [WAKE, SLEEP]) ? 'evening' : 'night'
}

/** Everything about the axis that only changes with its day: the cells, the day lines and the shared working hours. */
function buildDay(start: number, end: number, zones: WorldClockZone[], stepMs: number, locale: string) {
  const hours = Math.round((end - start) / HOUR)
  const rows = zones.map((zone) => {
    const work = zone.workingHours ?? WORK
    const weekday = dateTimeFormat(locale, { weekday: 'short', timeZone: zone.timeZone })
    const turns: number[] = []
    for (let next = startOfDay(startOfDay(start, zone.timeZone) + 26 * HOUR, zone.timeZone); next < end; next = startOfDay(next + 26 * HOUR, zone.timeZone)) {
      if (next > start) turns.push(next)
    }
    const cells = Array.from({ length: hours }, (_, i) => {
      const t = start + i * HOUR
      const turn = turns.find((b) => b >= t && b < t + HOUR)
      return { t, hour: wallClock(t, zone.timeZone).hour, period: periodOf(wallClock(t + HOUR / 2, zone.timeZone).hours, work), day: turn === undefined ? undefined : weekday.format(turn) }
    })
    return { cells, turns }
  })
  const overlap: [number, number][] = []
  for (let t = start; t < end; t += stepMs) {
    const all = zones.length > 0 && zones.every((zone) => within(wallClock(t, zone.timeZone).hours, zone.workingHours ?? WORK))
    if (!all) continue
    const last = overlap[overlap.length - 1]
    if (last && last[1] === t) last[1] = t + stepMs
    else overlap.push([t, t + stepMs])
  }
  return { hours, rows, overlap }
}

function WorldClock({
  zones,
  value: valueProp,
  defaultValue = null,
  onValueChange,
  now: nowProp,
  step = 15,
  hourCycle,
  compact = false,
  label,
  locale: localeProp,
  className,
  ...props
}: WorldClockProps) {
  const k = useYouj()
  const direction = useDirection()
  const labels = useComponentLabels(worldClockLabels)
  const locale = useLocale(localeProp)
  const clock = useNow(nowProp === undefined ? 1000 : 0)
  const now = nowProp === undefined ? clock : +nowProp
  const [chosen, setChosen] = useControllableState<number | null>(
    valueProp === undefined ? undefined : valueProp === null ? null : +valueProp,
    defaultValue === null ? null : +defaultValue,
  )
  const live = chosen === null
  const at = chosen ?? now
  const stepMs = Math.max(1, step) * MINUTE
  const reference = zones[0]?.timeZone ?? 'UTC'
  const start = at === null ? null : startOfDay(at, reference)
  const end = start === null ? null : startOfDay(start + 26 * HOUR, reference)
  const zonesKey = zones.map((z) => `${z.timeZone}:${z.workingHours ?? ''}`).join('|')
  // biome-ignore lint/correctness/useExhaustiveDependencies: zones is read through zonesKey, so an inline array doesn't rebuild the day every tick
  const day = useMemo(
    () => (start === null || end === null ? null : buildDay(start, end, zones, stepMs, locale)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- zones is read through zonesKey, so an inline array doesn't rebuild the day every tick
    [start, end, zonesKey, stepMs, locale],
  )

  const twelve = hourCycle ? hourCycle === 12 : ['h11', 'h12'].includes(dateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions().hourCycle ?? 'h23')
  const timeOf = (t: number, timeZone: string) =>
    dateTimeFormat(locale, { hour: twelve ? 'numeric' : '2-digit', minute: '2-digit', hourCycle: twelve ? 'h12' : 'h23', timeZone }).format(t)
  const hourNumber = numberFormat(locale)
  const relDay = relativeTimeFormat(locale, { numeric: 'auto' })
  const hoursAway = numberFormat(locale, { style: 'unit', unit: 'hour', unitDisplay: 'narrow', signDisplay: 'exceptZero', maximumFractionDigits: 2 })

  const dayWord = (t: number, timeZone: string) => {
    const diff = Math.round((wallClock(t, timeZone).date - wallClock(t, reference).date) / DAY)
    return diff === 0 ? '' : relDay.format(diff, 'day')
  }
  const placeTime = (t: number, zone: WorldClockZone) => labels.worldClockTime(timeOf(t, zone.timeZone), zone.label, dayWord(t, zone.timeZone))
  const summary = (t: number) => {
    const [first, ...rest] = zones
    if (!first) return ''
    const lead = placeTime(t, first)
    return rest.length ? labels.worldClockSummary(lead, listFormat(locale, { type: 'conjunction' }).format(rest.map((z) => placeTime(t, z)))) : lead
  }

  const { politeRef, announce } = useLiveRegion()
  const hintId = useId()
  const thumbRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  const commit = (next: number | null) => {
    if (next === chosen) return
    setChosen(next)
    onValueChange?.(next === null ? null : new Date(next))
    const t = next ?? now
    if (t !== null) announce(summary(t), { delay: 300 })
  }

  const fromPointer = (clientX: number) => {
    const track = trackRef.current
    if (!track || start === null || end === null) return null
    const box = track.getBoundingClientRect()
    let share = (clientX - box.left) / box.width
    if (direction === 'rtl') share = 1 - share
    const t = start + Math.round((clamp(share, 0, 1) * (end - start)) / stepMs) * stepMs
    return clamp(t, start, end - stepMs)
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || at === null) return
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    thumbRef.current?.focus({ preventScroll: true })
    setDragging(true)
    const t = fromPointer(event.clientX)
    if (t !== null) commit(t)
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    const t = fromPointer(event.clientX)
    if (t !== null) commit(t)
  }
  const endDrag = () => setDragging(false)

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (at === null || start === null || end === null) return
    const floor = start + Math.floor((at - start) / stepMs) * stepMs
    const ceil = start + Math.ceil((at - start) / stepMs) * stepMs
    const forward = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
    const back = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft'
    const by = event.shiftKey ? HOUR : stepMs
    const next =
      event.key === forward || event.key === 'ArrowUp' ? floor + by
      : event.key === back || event.key === 'ArrowDown' ? ceil - by
      : event.key === 'PageUp' ? floor + HOUR
      : event.key === 'PageDown' ? ceil - HOUR
      : event.key === 'Home' ? start
      : event.key === 'End' ? end - stepMs
      : undefined
    if (next === undefined) return
    event.preventDefault()
    commit(next)
  }

  const share = (t: number) => (start === null || end === null ? 0 : (t - start) / (end - start))
  const cursorShare = at === null ? 0 : share(at)
  const inOverlap = at !== null && !!day?.overlap.some(([a, b]) => at >= a && at < b)
  const rangeFormat = dateTimeFormat(locale, { hour: twelve ? 'numeric' : '2-digit', minute: '2-digit', hourCycle: twelve ? 'h12' : 'h23', timeZone: reference })
  const overlapText = !day
    ? ''
    : day.overlap.length
      ? labels.worldClockOverlap(listFormat(locale, { type: 'conjunction' }).format(day.overlap.map(([a, b]) => rangeFormat.formatRange(a, b))))
      : labels.worldClockNoOverlap
  const glide = k.reduced || dragging ? { type: false as const } : k.spring('snappy')
  const columns = compact ? 'minmax(9rem, 13rem) minmax(0, 1fr)' : 'minmax(11rem, 16rem) minmax(0, 1fr)'

  return (
    <MotionFeatures>
      <div
        role="group"
        aria-label={label ?? labels.worldClock}
        data-slot="world-clock"
        data-state={live ? 'live' : 'set'}
        data-yj-compact={compact || undefined}
        data-yj-overlap={inOverlap || undefined}
        className={cn('own:flex min-w-0 flex-col', compact ? 'own:gap-2' : 'own:gap-3', className)}
        {...props}
      >
        <div data-slot="world-clock-header" className="own:flex min-w-0 items-center justify-between gap-3">
          <p data-slot="world-clock-overlap-summary" className="own:flex min-w-0 items-center gap-2 own:text-ui-sm own:text-fg-muted">
            <span aria-hidden className={cn('size-2 shrink-0 rounded-full', day?.overlap.length ? 'bg-success' : 'bg-fg-subtle')} />
            <span className="truncate">{overlapText}</span>
          </p>
          <Button
            type="button"
            variant="outline"
            size={compact ? 'xs' : 'sm'}
            data-slot="world-clock-now"
            disabled={live}
            onClick={() => {
              commit(null)
              thumbRef.current?.focus({ preventScroll: true })
            }}
          >
            {labels.now}
          </Button>
        </div>

        <div data-slot="world-clock-scroll" className="yj-scrollbar own:-mx-1 overflow-x-auto own:px-1 own:pb-1">
          <div
            data-slot="world-clock-grid"
            className={cn('relative own:grid', compact ? 'min-w-120' : 'min-w-160')}
            style={{ gridTemplateColumns: columns, gridTemplateRows: `auto repeat(${Math.max(1, zones.length)}, auto)` }}
          >
            {/* The ruler: room for the cursor's handle over the strips. */}
            <div aria-hidden className="col-start-1 row-start-1" />
            <div aria-hidden data-slot="world-clock-ruler" className={cn('col-start-2 row-start-1', compact ? 'h-6' : 'h-8')} />

            <ul role="list" className="contents">
              {zones.map((zone, i) => {
                const wall = at === null ? undefined : wallClock(at, zone.timeZone)
                const period = wall ? periodOf(wall.hours, zone.workingHours ?? WORK) : undefined
                const daylight = wall ? wall.hours >= 6 && wall.hours < 18 : true
                const time = at === null ? '––:––' : timeOf(at, zone.timeZone)
                const away = wall && i > 0 && zones[0] ? (wall.offset - wallClock(at as number, reference).offset) / 60 : 0
                const gmt = at === null ? '' : (dateTimeFormat(locale, { timeZone: zone.timeZone, timeZoneName: 'shortOffset' }).formatToParts(at).find((p) => p.type === 'timeZoneName')?.value ?? '')
                const turn = at === null ? '' : dayWord(at, zone.timeZone)
                const date = at === null ? '' : dateTimeFormat(locale, { timeZone: zone.timeZone, weekday: 'short', day: 'numeric', month: 'short' }).format(at)
                const row = day?.rows[i]
                return (
                  <li
                    key={`${zone.timeZone}-${i}`}
                    data-slot="world-clock-zone"
                    data-state={period}
                    style={{ gridRow: i + 2, gridColumn: '1 / 3' }}
                    className={cn('own:grid grid-cols-subgrid items-center', compact ? 'own:py-1' : 'own:py-1.5', i > 0 && 'border-t border-line-subtle')}
                  >
                    <div data-slot="world-clock-info" className={cn('own:flex min-w-0 items-center own:pe-4', compact ? 'gap-2' : 'gap-3')}>
                      <span
                        aria-hidden
                        data-slot="world-clock-daylight"
                        data-state={daylight ? 'day' : 'night'}
                        className={cn('own:grid shrink-0 place-items-center own:rounded-full', compact ? 'size-5' : 'size-7', daylight ? 'own:bg-warning-subtle own:text-warning-text' : 'own:bg-well own:text-fg-muted')}
                      >
                        {daylight ? <SunIcon size={compact ? 12 : 14} /> : <MoonIcon size={compact ? 12 : 14} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="own:flex min-w-0 items-baseline justify-between gap-2">
                          <span data-slot="world-clock-label" className="truncate own:text-ui own:font-medium own:text-fg">
                            {zone.label}
                          </span>
                          <span data-slot="world-clock-time" className={cn('shrink-0 own:font-mono own:tabular-nums own:text-fg', compact ? 'own:text-ui' : 'own:text-ui-lg')}>
                            <span aria-hidden>
                              <MorphLabel value={time} mode="letters">
                                {time}
                              </MorphLabel>
                            </span>
                            <span className="sr-only">
                              {[time, turn, date, gmt, daylight ? labels.worldClockDaytime : labels.worldClockNight].filter(Boolean).join(', ')}
                            </span>
                          </span>
                        </div>
                        {!compact && (
                          <div aria-hidden className="own:flex min-w-0 items-baseline justify-between gap-2 own:text-ui-xs own:text-fg-muted">
                            <span data-slot="world-clock-offset" dir="ltr" className="truncate own:font-mono own:tabular-nums">
                              {[gmt, away ? hoursAway.format(away) : ''].filter(Boolean).join(' · ')}
                            </span>
                            <span data-slot="world-clock-date" className={cn('shrink-0', turn && cn('own:rounded-full own:bg-band own:px-1.5 own:text-fg', VOICE))}>
                              {turn || date}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div aria-hidden data-slot="world-clock-strip" className={cn('relative own:flex gap-px', compact ? 'h-5' : 'h-8')}>
                      {row
                        ? row.cells.map((cell) => (
                            <span
                              key={cell.t}
                              data-slot="world-clock-hour"
                              data-state={cell.period}
                              className={cn(
                                'own:grid min-w-0 flex-1 place-items-center overflow-hidden own:font-mono own:text-ui-xs own:tabular-nums first:rounded-s-md last:rounded-e-md',
                                PERIOD_CLASS[cell.period],
                                cell.day && 'own:font-semibold own:text-fg',
                              )}
                            >
                              {!compact && (cell.day ?? hourNumber.format(twelve ? cell.hour % 12 || 12 : cell.hour))}
                            </span>
                          ))
                        : Array.from({ length: 24 }, (_, h) => <span key={h} className="min-w-0 flex-1 bg-well first:rounded-s-md last:rounded-e-md" />)}
                      {row?.turns.map((t) => (
                        <span
                          key={t}
                          data-slot="world-clock-day-line"
                          className="absolute -inset-y-0.5 w-0.5 -translate-x-1/2 own:rounded-full own:bg-fg rtl:translate-x-1/2"
                          style={{ insetInlineStart: `${share(t) * 100}%` }}
                        />
                      ))}
                    </div>
                  </li>
                )
              })}
            </ul>

            {/* The track: the strips' column across every row. Clicks and drags here move the cursor. */}
            <div
              ref={trackRef}
              data-slot="world-clock-track"
              data-dragging={dragging || undefined}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              className={cn('relative col-start-2 touch-pan-y select-none', dragging ? 'own:cursor-grabbing' : 'own:cursor-ew-resize')}
              style={{ gridRow: '1 / -1' }}
            >
              {day?.overlap.map(([a, b]) => (
                <span
                  key={a}
                  aria-hidden
                  data-slot="world-clock-overlap"
                  className={cn('pointer-events-none absolute bottom-0 own:rounded-md own:ring-2 ring-success ring-inset', compact ? 'top-6' : 'top-8')}
                  style={{ insetInlineStart: `${share(a) * 100}%`, width: `${(share(b) - share(a)) * 100}%` }}
                />
              ))}
              {at !== null && (
                <m.div
                  data-slot="world-clock-cursor"
                  className="pointer-events-none absolute inset-y-0 w-0"
                  initial={false}
                  // left, not a transform of a full-width layer: a translated layer would widen the scroll area
                  animate={{ left: `${(direction === 'rtl' ? 1 - cursorShare : cursorShare) * 100}%` }}
                  transition={glide}
                >
                  <span aria-hidden className={cn('absolute start-0 bottom-0 w-0.5 -translate-x-1/2 rounded-full bg-fg rtl:translate-x-1/2', compact ? 'top-5' : 'top-7')} />
                  <div
                    ref={thumbRef}
                    role="slider"
                    tabIndex={0}
                    aria-label={labels.worldClockCursor}
                    aria-describedby={hintId}
                    aria-valuemin={0}
                    aria-valuemax={start === null || end === null ? 0 : Math.round((end - start) / MINUTE)}
                    aria-valuenow={start === null ? 0 : Math.round((at - start) / MINUTE)}
                    aria-valuetext={zones[0] ? `${dateTimeFormat(locale, { timeZone: reference, weekday: 'short', day: 'numeric', month: 'short' }).format(at)}, ${placeTime(at, zones[0])}` : undefined}
                    aria-keyshortcuts="ArrowLeft ArrowRight PageUp PageDown Home End"
                    data-slot="world-clock-handle"
                    data-state={live ? 'live' : 'set'}
                    onKeyDown={onKeyDown}
                    // Slides along its own width as the cursor crosses the day, so it never hangs past either end.
                    style={{ left: 0, translate: `${-(direction === 'rtl' ? 1 - cursorShare : cursorShare) * 100}% 0` }}
                    className={cn(
                      'focus-ring pointer-events-auto absolute top-0 rounded-full whitespace-nowrap transition-[translate] yj-duration-fast ease-standard own:font-mono own:tabular-nums own:font-medium',
                      live ? 'own:bg-accent own:text-on-accent' : 'own:bg-fg own:text-canvas',
                      compact ? 'own:px-1.5 own:text-ui-xs own:leading-5' : 'own:px-2 own:text-ui-xs own:leading-6',
                    )}
                  >
                    {zones[0] ? timeOf(at, reference) : ''}
                  </div>
                </m.div>
              )}
            </div>
          </div>
        </div>

        {!compact && (
          <ul aria-hidden data-slot="world-clock-legend" className="own:flex flex-wrap items-center gap-x-4 gap-y-1 own:text-ui-xs own:text-fg-muted">
            {(
              [
                ['work', labels.worldClockWorkingHours],
                ['evening', labels.worldClockOutsideHours],
                ['night', labels.worldClockNight],
              ] as const
            ).map(([period, text]) => (
              <li key={period} className="own:flex items-center gap-1.5">
                <span className={cn('size-2.5 rounded-sm', PERIOD_CLASS[period])} />
                {text}
              </li>
            ))}
            <li className="own:flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm ring-2 ring-success ring-inset" />
              {labels.worldClockEveryone}
            </li>
          </ul>
        )}

        <span id={hintId} className="sr-only">
          {labels.worldClockHint}
        </span>
        <div ref={politeRef} role="status" aria-live="polite" className="sr-only" />
      </div>
    </MotionFeatures>
  )
}

export { WorldClock, type WorldClockPeriod, type WorldClockProps, type WorldClockZone }
