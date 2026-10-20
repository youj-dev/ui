'use client'

import { useId, useMemo, useRef, useState, type ComponentProps, type CSSProperties, type KeyboardEvent, type MouseEvent } from 'react'
import { useInView } from 'motion/react'
import { milestoneRulerLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale, useDirection } from '@youj/core/lib/youj/provider'
import { useControllableState } from '../../hooks/use-controllable-state'
import { useNow } from '../../hooks/use-now'
import { useResizeMeasure } from '../../hooks/use-resize-measure'
import { clamp, cn, dateTimeFormat, toneColor } from '../../lib/utils'

/* A year (or any span of days) as a ruler of fine ticks, with each milestone
 * standing on it as a pin: a stem and a dot, taller for the major ones.
 * Shipped milestones are solid, upcoming ones hollow and those at risk in the
 * warning tone. A brighter tick and a dot under the ruler mark today, and the
 * ticks before it read a step darker than the ones after. Milestones too close
 * to tell apart share one pin with their count beside its dot.
 * - Callout: the shown milestone's card floats over the ruler with its date,
 *   status, title and one line of description, pointing at its pin. It shows
 *   the one under the pointer (anywhere along the ruler snaps to the nearest
 *   pin, and the ticks near the pointer stretch toward it), else the focused
 *   one, else the selected one.
 * - Keyboard: one tab stop, a horizontal listbox. Left and Right walk the
 *   pins (mirrored in RTL), Home and End go to the ends, and selection follows
 *   focus. A click or tap selects the nearest pin.
 * - Time runs from the inline start, right to left in RTL.
 * - Motion: the pins rise from the ruler left to right as it scrolls into
 *   view (deliberate token); the callout glides between pins and the ticks
 *   stretch on the fast token. Reduced motion: drawn in place, no stretch,
 *   the callout jumps. */

type MilestoneStatus = 'done' | 'upcoming' | 'at-risk'
type MilestoneRulerTone = 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'
type MilestoneDate = Date | string | number

interface Milestone {
  id: string
  /** The day it lands: "2026-11-26", a Date or ms. A date-only string is that calendar day in every time zone. */
  date: MilestoneDate
  title: string
  /** One line under the title in the callout. */
  description?: string
  /** Default: `done` before `today`, `upcoming` from it on. */
  status?: MilestoneStatus
  /** A taller pin, for the milestones that matter most. */
  major?: boolean
}

interface MilestoneRulerProps extends Omit<ComponentProps<'div'>, 'children' | 'defaultValue' | 'onChange'> {
  milestones: readonly Milestone[]
  /** The ruler's first day. Default: January 1 of today's year (or of the first milestone's). */
  start?: MilestoneDate
  /** The ruler's last day. Default: December 31 of the start's year. */
  end?: MilestoneDate
  /** Marked on the ruler, and splits done from upcoming. Default: the browser's clock once mounted (none on the server). */
  today?: MilestoneDate
  /** The selected milestone's id, shown when nothing is hovered or focused (controlled); `null` for none. */
  value?: string | null
  /** Default: the next milestone from today, else the last one. */
  defaultValue?: string | null
  onValueChange?: (id: string | null) => void
  /** The pins' color. At-risk milestones take the warning tone. Default `accent`. */
  tone?: MilestoneRulerTone
  /** Formats a day in the callout and the spoken names. Default: the locale's short month and day. */
  formatDate?: (date: Date) => string
  /** Default: the YoujProvider locale. */
  locale?: string
  /** Accessible name. Default: the labels' "Milestones". */
  label?: string
}

const DAY = 86_400_000
/** Pins closer than this many pixels share one. */
const STACK_GAP = 10
/** How far the pointer's stretch reaches either side, in px. */
const REACH = 40

const INK: Record<MilestoneRulerTone, string> = {
  accent: 'var(--color-accent-text)',
  neutral: 'var(--color-fg-muted)',
  success: 'var(--color-success-text)',
  warning: 'var(--color-warning-text)',
  danger: 'var(--color-danger-text)',
  'chart-1': 'var(--color-chart-1)',
  'chart-2': 'var(--color-chart-2)',
  'chart-3': 'var(--color-chart-3)',
  'chart-4': 'var(--color-chart-4)',
  'chart-5': 'var(--color-chart-5)',
}
const VOICE = 'own:font-(family-name:--yj-label-font) own:tracking-(--yj-label-tracking) own:[text-transform:var(--yj-label-case)]'

/** A calendar day as days since the epoch: a date-only string as written, anything else by its local date. */
function dayOf(input: MilestoneDate): number {
  if (typeof input === 'string') {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input)
    if (m) return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / DAY
  }
  const d = new Date(input)
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY
}
const yearOf = (day: number) => new Date(day * DAY).getUTCFullYear()

interface Pin {
  key: string
  items: (Milestone & { day: number; state: MilestoneStatus })[]
  /** 0–1 along the ruler. */
  at: number
  major: boolean
  state: MilestoneStatus
}

function MilestoneRuler({
  milestones,
  start,
  end,
  today: todayProp,
  value: valueProp,
  defaultValue,
  onValueChange,
  tone = 'accent',
  formatDate,
  locale: localeProp,
  label,
  className,
  style,
  ...props
}: MilestoneRulerProps) {
  const k = useYouj()
  const locale = useLocale(localeProp)
  const rtl = useDirection() === 'rtl'
  const labels = useComponentLabels(milestoneRulerLabels)
  const id = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const plotRef = useRef<HTMLDivElement>(null)
  const pinRefs = useRef(new Map<string, HTMLButtonElement>())
  const inView = useInView(rootRef, { once: true, amount: 0.3 })
  const risen = k.reduced || inView
  const clock = useNow(todayProp === undefined ? 60 * 60_000 : 0)
  const today = todayProp !== undefined ? dayOf(todayProp) : clock === null ? null : dayOf(clock)
  const [width, setWidth] = useState(0)
  useResizeMeasure(plotRef, (el) => setWidth(el.getBoundingClientRect().width))
  const [hovered, setHovered] = useState<string>()
  const [focused, setFocused] = useState<string>()
  const [pointer, setPointer] = useState<number>()

  const sorted = useMemo(() => milestones.map((m) => ({ ...m, day: dayOf(m.date) })).sort((a, b) => a.day - b.day), [milestones])
  // With no milestones and no today yet (the server, the hydration render), any year: the clock is read after mount.
  const first = start !== undefined ? dayOf(start) : Date.UTC(yearOf(today ?? sorted[0]?.day ?? 0), 0, 1) / DAY
  const last = end !== undefined ? dayOf(end) : Date.UTC(yearOf(first) + 1, 0, 1) / DAY - 1
  const span = Math.max(1, last - first + 1)
  /** A day's middle, 0–1 along the ruler. */
  const atDay = (day: number) => clamp((day + 0.5 - first) / span, 0, 1)
  /** A day's start (a tick's place), 0–1 along the ruler. */
  const edge = (day: number) => clamp((day - first) / span, 0, 1)
  const fmt = (day: number) => (formatDate ? formatDate(new Date(day * DAY)) : dateTimeFormat(locale, { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(day * DAY))
  const stateWord = (s: MilestoneStatus) => (s === 'done' ? labels.milestoneRulerDone : s === 'at-risk' ? labels.milestoneRulerAtRisk : labels.milestoneRulerUpcoming)

  // Pins: milestones within STACK_GAP pixels of the one before share a pin (400px before the ruler is measured).
  const pins = useMemo(() => {
    const px = (width || 400) / span
    const out: Pin[] = []
    for (const m of sorted) {
      const state: MilestoneStatus = m.status ?? (today !== null && m.day < today ? 'done' : 'upcoming')
      const item = { ...m, state }
      const prev = out[out.length - 1]
      if (prev && (m.day - prev.items[prev.items.length - 1]!.day) * px < STACK_GAP) prev.items.push(item)
      else out.push({ key: m.id, items: [item], at: clamp((m.day + 0.5 - first) / span, 0, 1), major: false, state })
    }
    for (const pin of out) {
      pin.major = pin.items.some((m) => m.major)
      pin.state = pin.items.some((m) => m.state === 'at-risk') ? 'at-risk' : pin.items.every((m) => m.state === 'done') ? 'done' : 'upcoming'
    }
    return out
  }, [sorted, width, span, today, first])

  const pinOf = (milestoneId: string | null | undefined) => (milestoneId ? pins.find((p) => p.items.some((m) => m.id === milestoneId)) : undefined)
  const fallback = defaultValue !== undefined ? defaultValue : (sorted.find((m) => today !== null && m.day >= today) ?? sorted[sorted.length - 1])?.id ?? null
  const [value, setValue] = useControllableState(valueProp, fallback)
  const selected = pinOf(value)
  const shown = pins.find((p) => p.key === hovered) ?? pins.find((p) => p.key === focused) ?? selected
  const focusKey = (pins.find((p) => p.key === focused) ?? selected ?? pins[0])?.key

  const select = (pin: Pin) => {
    const next = pin.items[0]!.id
    if (pin.items.some((m) => m.id === value)) return
    setValue(next)
    onValueChange?.(next)
  }
  const nearest = (event: MouseEvent<HTMLDivElement>) => {
    const rect = plotRef.current?.getBoundingClientRect()
    if (!rect || !rect.width) return undefined
    const x = rtl ? rect.right - event.clientX : event.clientX - rect.left
    setPointer(x)
    const at = x / rect.width
    return pins.reduce<Pin | undefined>((best, p) => (!best || Math.abs(p.at - at) < Math.abs(best.at - at) ? p : best), undefined)
  }
  const move = (index: number) => {
    const pin = pins[clamp(index, 0, pins.length - 1)]
    if (!pin) return
    pinRefs.current.get(pin.key)?.focus()
    select(pin)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = pins.findIndex((p) => p.key === focusKey)
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight'
    const back = rtl ? 'ArrowRight' : 'ArrowLeft'
    if (event.key === forward) move(index + 1)
    else if (event.key === back) move(index - 1)
    else if (event.key === 'Home') move(0)
    else if (event.key === 'End') move(pins.length - 1)
    else return
    event.preventDefault()
  }

  // The ruler: each month in four, its first tick taller, and a closing tick at the end.
  const months = useMemo(() => {
    const out: { from: number; to: number; month: number; year: number }[] = []
    const d = new Date(first * DAY)
    let cursor = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1) / DAY
    while (cursor <= last) {
      const c = new Date(cursor * DAY)
      const next = Date.UTC(c.getUTCFullYear(), c.getUTCMonth() + 1, 1) / DAY
      out.push({ from: Math.max(cursor, first), to: Math.min(next, last + 1), month: c.getUTCMonth(), year: c.getUTCFullYear() })
      cursor = next
    }
    return out
  }, [first, last])
  const parts = months.length > 24 ? 1 : months.length > 12 ? 2 : 4
  const ticks = [
    ...months.flatMap((m) => {
      const from = Date.UTC(m.year, m.month, 1) / DAY
      const to = Date.UTC(m.year, m.month + 1, 1) / DAY
      return Array.from({ length: parts }, (_, i) => ({ day: from + ((to - from) * i) / parts, major: i === 0 })).filter((t) => t.day >= first)
    }),
    { day: last + 1, major: true },
  ]
  // A month name needs about 28px (14px for the narrow letter under 22rem); past that, every other one, and so on.
  const monthWidth = (width || 400) / Math.max(1, months.length)
  const stride = Math.max(1, Math.ceil((width && width < 352 ? 14 : 28) / monthWidth))
  const multiYear = yearOf(first) !== yearOf(last)
  const monthName = (m: (typeof months)[number], style: 'short' | 'narrow') =>
    multiYear && m.month === 0 ? String(m.year) : dateTimeFormat(locale, { month: style, timeZone: 'UTC' }).format(Date.UTC(m.year, m.month, 1))

  const px = (at: number) => (width ? `${Math.round(at * width)}px` : `${at * 100}%`)
  const todayAt = today !== null && today >= first && today <= last ? atDay(today) : undefined
  const done = sorted.filter((m) => (m.status ?? (today !== null && m.day < today ? 'done' : 'upcoming')) === 'done').length
  const stretch = (x: number) => (pointer === undefined || k.reduced ? 1 : 1 + 0.9 * Math.max(0, Math.cos(Math.min(1, Math.abs(x - pointer) / REACH) * (Math.PI / 2))))
  const nameOf = (pin: Pin) =>
    pin.items.length === 1
      ? labels.milestoneRulerItem(pin.items[0]!.title, fmt(pin.items[0]!.day), stateWord(pin.items[0]!.state))
      : `${labels.milestoneRulerCount(pin.items.length)}: ${pin.items.map((m) => labels.milestoneRulerItem(m.title, fmt(m.day), stateWord(m.state))).join('; ')}`

  // The callout, kept inside the ruler: centered on its pin where there's room, its caret always on the pin.
  const glide = !k.reduced && 'transition-[inset-inline-start] yj-duration-fast ease-standard'
  const listed = shown ? (shown.items.length <= 2 ? shown.items : shown.items.slice(0, 1)) : []

  return (
    <div
      ref={rootRef}
      data-slot="milestone-ruler"
      className={cn('@container/milestone-ruler relative own:w-full min-w-0 select-none', className)}
      style={{ '--milestone-ruler-tone': toneColor(tone, 'var(--color-fg-muted)'), '--milestone-ruler-ink': INK[tone], ...style } as CSSProperties}
      {...props}
    >
      <div data-slot="milestone-ruler-callout-zone" className="relative h-20">
        {pins.length === 0 && (
          <p data-slot="milestone-ruler-empty" className="own:grid h-full place-items-center own:text-ui own:text-fg-muted">
            {labels.milestoneRulerEmpty}
          </p>
        )}
        {shown && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-2 [--milestone-ruler-l:clamp(0px,calc(var(--milestone-ruler-x)-var(--milestone-ruler-w)/2),calc(100%-var(--milestone-ruler-w)))] [--milestone-ruler-w:min(calc(var(--spacing)*56),100%)]"
            style={{ '--milestone-ruler-x': px(shown.at) } as CSSProperties}
          >
            <div
              data-slot="milestone-ruler-callout"
              data-yj-tone="overlay"
              data-status={shown.state}
              className={cn(
                'absolute start-(--milestone-ruler-l) bottom-0 own:flex w-(--milestone-ruler-w) flex-col gap-0.5 own:rounded-overlay border own:border-line own:bg-overlay own:px-3 own:py-2 own:text-fg shadow-md',
                glide,
              )}
            >
              <span className={cn('own:flex min-w-0 items-center gap-1.5 own:text-ui-xs own:text-fg-muted own:tabular-nums', VOICE)}>
                <Dot state={shown.state} className="size-2" />
                <span className="truncate">
                  {fmt(shown.items[0]!.day)}
                  {shown.items.length > 1 && shown.items[shown.items.length - 1]!.day !== shown.items[0]!.day && ` – ${fmt(shown.items[shown.items.length - 1]!.day)}`} ·{' '}
                  {shown.items.every((m) => m.state === shown.items[0]!.state) ? stateWord(shown.state) : labels.milestoneRulerCount(shown.items.length)}
                </span>
              </span>
              {shown.items.length === 1 ? (
                <>
                  <span className="truncate own:text-ui own:font-medium">{shown.items[0]!.title}</span>
                  {shown.items[0]!.description && <span className="truncate own:text-ui-sm own:text-fg-muted">{shown.items[0]!.description}</span>}
                </>
              ) : (
                <>
                  {listed.map((m) => (
                    <span key={m.id} className="own:flex min-w-0 items-center gap-1.5 own:text-ui own:font-medium">
                      <Dot state={m.state} className="size-1.5" />
                      <span className="truncate">{m.title}</span>
                    </span>
                  ))}
                  {shown.items.length > listed.length && (
                    <span className="own:text-ui-sm own:text-fg-muted">{labels.milestoneRulerMore(shown.items.length - listed.length)}</span>
                  )}
                </>
              )}
            </div>
            <span
              data-slot="milestone-ruler-caret"
              className={cn(
                'absolute start-[clamp(calc(var(--milestone-ruler-l)+var(--spacing)*3),var(--milestone-ruler-x),calc(var(--milestone-ruler-l)+var(--milestone-ruler-w)-var(--spacing)*3))] -bottom-1 own:-ms-1 size-2 rotate-45 border-e border-b own:border-line own:bg-overlay',
                glide,
              )}
            />
          </div>
        )}
      </div>

      <div
        ref={plotRef}
        data-slot="milestone-ruler-plot"
        className="relative h-16 cursor-col-resize touch-pan-y"
        onPointerMove={(event) => setHovered(nearest(event)?.key)}
        onPointerLeave={() => {
          setHovered(undefined)
          setPointer(undefined)
        }}
        onClick={(event) => {
          if ((event.target as Element).closest('[role=option]')) return
          const pin = nearest(event)
          if (pin) select(pin)
        }}
      >
        <div aria-hidden data-slot="milestone-ruler-ticks" className="absolute inset-x-0 bottom-0 h-5">
          {ticks.map((tick) => {
            const at = edge(tick.day)
            const past = todayAt !== undefined && at < todayAt
            return (
              <span
                key={tick.day}
                data-slot="milestone-ruler-tick"
                data-yj-major={tick.major || undefined}
                className={cn(
                  'absolute bottom-0 w-px origin-bottom own:rounded-full',
                  tick.major ? 'h-3.5' : 'h-2',
                  past ? 'own:bg-fg-subtle' : 'own:bg-line-strong',
                  !k.reduced && 'transition-transform yj-duration-fast ease-standard',
                )}
                style={{ insetInlineStart: px(at), transform: `scaleY(${stretch(at * width)})` }}
              />
            )
          })}
          {todayAt !== undefined && (
            <span
              data-slot="milestone-ruler-today"
              className="absolute bottom-0 h-5 w-0.5 own:-ms-px own:rounded-full own:bg-fg"
              style={{ insetInlineStart: px(todayAt) }}
            />
          )}
        </div>
        {pins.length > 0 && (
        <div
          role="listbox"
          aria-orientation="horizontal"
          aria-label={label ?? labels.milestoneRuler}
          aria-describedby={`${id}-summary`}
          data-slot="milestone-ruler-pins"
          onKeyDown={onKeyDown}
          className="absolute inset-0"
        >
          {pins.map((pin, i) => {
            const isShown = pin === shown
            const isSelected = pin === selected
            const stem = pin.major ? 'h-14' : 'h-9'
            return (
              <button
                key={pin.key}
                ref={(el) => {
                  if (el) pinRefs.current.set(pin.key, el)
                  else pinRefs.current.delete(pin.key)
                }}
                type="button"
                role="option"
                aria-selected={isSelected}
                aria-label={nameOf(pin)}
                aria-describedby={pin.items.some((m) => m.description) ? `${id}-${pin.key}` : undefined}
                tabIndex={pin.key === focusKey ? 0 : -1}
                data-slot="milestone-ruler-pin"
                data-status={pin.state}
                data-yj-major={pin.major || undefined}
                data-yj-shown={isShown || undefined}
                data-yj-count={pin.items.length > 1 ? pin.items.length : undefined}
                onFocus={() => setFocused(pin.key)}
                onBlur={() => setFocused(undefined)}
                onClick={() => select(pin)}
                className={cn('group/pin absolute bottom-0 own:-ms-2.5 own:flex w-5 flex-col items-center own:rounded-sm outline-none focus-ring', stem)}
                style={{ insetInlineStart: px(pin.at) }}
              >
                <span
                  className={cn('own:flex h-full flex-col items-center origin-bottom', !k.reduced && 'transition-transform yj-duration-deliberate ease-enter')}
                  style={{ transform: risen ? undefined : 'scaleY(0)', transitionDelay: risen && !k.reduced ? `${Math.round(i * 40)}ms` : undefined }}
                >
                  <span className="relative">
                    <Dot
                      state={pin.state}
                      className={cn(pin.major ? 'size-3' : 'size-2.5', !k.reduced && 'transition-transform yj-duration-fast ease-standard', isShown && 'scale-125')}
                    />
                    {pin.items.length > 1 && (
                      <span
                        aria-hidden
                        data-slot="milestone-ruler-count"
                        className="absolute -top-2 start-full own:ms-0.5 own:font-mono own:text-ui-xs own:leading-none own:font-medium own:tabular-nums own:text-(--milestone-ruler-ink)"
                      >
                        {pin.items.length}
                      </span>
                    )}
                  </span>
                  <span
                    className={cn(
                      'w-0.5 flex-1 own:rounded-full',
                      isShown ? 'own:bg-fg' : pin.state === 'at-risk' ? 'own:bg-warning' : 'bg-(--milestone-ruler-tone)',
                      pin.state === 'upcoming' && !isShown && 'opacity-60',
                      !k.reduced && 'transition-[background-color,opacity] yj-duration-fast ease-standard',
                    )}
                  />
                </span>
              </button>
            )
          })}
        </div>
        )}
      </div>

      <div aria-hidden data-slot="milestone-ruler-axis" className="relative own:mt-1.5 h-6 own:text-ui-xs own:text-fg-muted">
        {todayAt !== undefined && <span className="absolute top-0 own:-ms-0.5 size-1 own:rounded-full own:bg-fg" style={{ insetInlineStart: px(todayAt) }} />}
        {months.map((m, i) =>
          i % stride === 0 && m.to - m.from > 6 ? (
            <span
              key={`${m.year}-${m.month}`}
              data-slot="milestone-ruler-month"
              className={cn('absolute bottom-0 own:leading-none whitespace-nowrap -translate-x-1/2 rtl:translate-x-1/2', VOICE)}
              style={{ insetInlineStart: px(edge((m.from + m.to) / 2)) }}
            >
              {/* youj-allow: fixed size, a container query can't read the scale */}
              <span className="own:@max-[22rem]/milestone-ruler:hidden">{monthName(m, 'short')}</span>
              {/* youj-allow: fixed size, a container query can't read the scale */}
              <span className="own:hidden own:@max-[22rem]/milestone-ruler:inline">{monthName(m, 'narrow')}</span>
            </span>
          ) : null,
        )}
      </div>

      <div className="sr-only">
        <p id={`${id}-summary`}>{labels.milestoneRulerSummary(sorted.length, done)}</p>
        {pins.map((pin) =>
          pin.items.some((m) => m.description) ? (
            <p key={pin.key} id={`${id}-${pin.key}`}>
              {pin.items
                .map((m) => m.description)
                .filter(Boolean)
                .join('; ')}
            </p>
          ) : null,
        )}
      </div>
    </div>
  )
}

/** A pin's head: solid when done, hollow when upcoming, in the warning tone when at risk. */
function Dot({ state, className }: { state: MilestoneStatus; className?: string }) {
  return (
    <span
      data-slot="milestone-ruler-dot"
      className={cn(
        'own:block shrink-0 own:rounded-full',
        state === 'upcoming'
          ? 'border-[1.5px] border-(--milestone-ruler-tone) own:bg-surface'
          : state === 'at-risk'
            ? 'own:bg-warning'
            : 'bg-(--milestone-ruler-tone)',
        className,
      )}
    />
  )
}

export { MilestoneRuler, type Milestone, type MilestoneDate, type MilestoneRulerProps, type MilestoneRulerTone, type MilestoneStatus }
