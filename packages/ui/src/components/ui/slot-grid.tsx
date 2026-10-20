'use client'

import { useEffect, useId, useRef, useState, type ComponentProps, type CSSProperties, type KeyboardEvent } from 'react'
import { Toggle as TogglePrimitive } from '@base-ui/react/toggle'
import { DirectionProvider } from '@base-ui/react/direction-provider'
import { ToggleGroup as ToggleGroupPrimitive } from '@base-ui/react/toggle-group'
import { m, useInView } from 'motion/react'
import { MotionFeatures, useSoundCue } from '@youj/core'
import { SlidingIndicator } from '@youj/motion'
import { CheckIcon } from '@youj/icons'
import { slotGridLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale, useDirection } from '@youj/core/lib/youj/provider'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, dateTimeFormat } from '../../lib/utils'
import { useResizeMeasure } from '../../hooks/use-resize-measure'

/* A week of bookable times as a grid you can read at a glance: a column per
 * day, a row per start time, and in every cell a run of pips, one per place
 * (up to eight), lit for the places still free. A slot with only a few left
 * lights its pips in the warning tone, a full one is hatched and dark, and a
 * time the day doesn't offer is a dash. The picked slot is the lit key, in
 * ink (like the primary pill it leads to); the viewer's own booking carries
 * a check.
 * - Keyboard: the grid is one tab stop. Arrows move between days and times
 *   (left and right mirrored in RTL), Home and End jump to a row's ends,
 *   Ctrl+Home and Ctrl+End to the grid's; Enter or Space picks a slot.
 * - Narrow: under 36rem (or with layout="day") it shows one day at a time,
 *   under a track of the week's days, each with a bar of how much of it is
 *   still free; left and right step the day there too.
 * - Motion: on first view the cells come in as a wave from the first slot
 *   (the deliberate token across the grid); a new day slides in from the side
 *   it lies on. Picking lights the cell on the fast token.
 * - Reduced motion: drawn in place; days swap without the slide. */

interface SlotGridSlot {
  id: string
  /** When it starts. */
  start: Date | number
  /** Places still free. */
  left: number
  /** Places in all. */
  capacity: number
  /** The viewer's own booking: drawn with a check, and not picked again. */
  mine?: boolean
}

type SlotState = 'open' | 'few' | 'full' | 'closed' | 'mine'

interface SlotGridProps extends Omit<ComponentProps<'div'>, 'children' | 'defaultValue'> {
  slots: readonly SlotGridSlot[]
  /** The first day shown. Default: the day of the earliest slot. */
  start?: Date | number
  /** Days shown. Default 7. */
  days?: number
  /** The rows, as start times in minutes after midnight. Default: every start time among the slots. */
  times?: readonly number[]
  /** The picked slot's id (controlled); `null` for none. */
  value?: string | null
  /** The slot picked at first. Default none. */
  defaultValue?: string | null
  onValueChange?: (id: string, slot: SlotGridSlot) => void
  /** A slot with this many places left or fewer counts as few. Default 2. */
  fewAt?: number
  /** `week` is the grid, `day` one day under a day picker; `auto` picks by the room there is. Default `auto`. */
  layout?: 'auto' | 'week' | 'day'
  /** Show the legend under the grid. Default true. */
  legend?: boolean
  /** The grid's accessible name. Default: the labels' "Available times". */
  label?: string
  /** Default: the YoujProvider locale. */
  locale?: string
  /** With sound on, picking a slot plays `select`. Default true. */
  sound?: boolean
}

const DAY = 86_400_000
const PIPS = 8
const VOICE = 'own:font-(family-name:--yj-label-font) own:tracking-(--yj-label-tracking) own:[text-transform:var(--yj-label-case)]'
const OFF = 'bg-[color-mix(in_oklab,var(--color-canvas)_calc(100%*var(--yj-dark)),color-mix(in_oklab,var(--color-fg)_12%,transparent))]'
const WELL =
  'bg-[color-mix(in_oklab,var(--color-canvas)_calc(45%*var(--yj-dark)),color-mix(in_oklab,var(--color-fg)_calc(4%+2%*var(--yj-dark)),transparent))]'
const HATCH = 'bg-[repeating-linear-gradient(135deg,color-mix(in_oklab,var(--color-fg)_9%,transparent)_0_1.5px,transparent_1.5px_5px)]'
const PIP_ON: Record<SlotState, string> = { open: 'bg-fg', few: 'bg-warning', full: '', closed: '', mine: 'bg-success' }
const COUNT: Record<SlotState, string> = {
  open: 'own:text-fg-muted',
  few: 'own:text-warning-text',
  full: 'own:text-fg-subtle',
  closed: '',
  mine: 'own:text-success-text',
}

const midnight = (t: number) => {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}
const minuteOf = (t: number) => {
  const d = new Date(t)
  return d.getHours() * 60 + d.getMinutes()
}

/** Pips for a slot: one per place up to eight, lit in proportion to the places left (at least one while any is). */
function Pips({ slot, state, picked }: { slot?: SlotGridSlot; state: SlotState; picked: boolean }) {
  if (!slot) return null
  const count = Math.max(1, Math.min(PIPS, slot.capacity))
  const lit = slot.left <= 0 ? 0 : Math.max(1, Math.round((slot.left / Math.max(1, slot.capacity)) * count))
  return (
    <span aria-hidden data-slot="slot-grid-pips" className="own:flex h-2.5 gap-[3px]">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          data-slot="slot-grid-pip"
          data-state={i < lit ? 'on' : 'off'}
          className={cn(
            'w-1 rounded-[1.5px] transition-[background-color] yj-duration-fast ease-standard',
            i < lit ? (picked ? 'bg-canvas' : PIP_ON[state]) : picked ? 'bg-band' : OFF,
          )}
        />
      ))}
    </span>
  )
}

function SlotGrid({
  slots,
  start,
  days = 7,
  times,
  value,
  defaultValue = null,
  onValueChange,
  fewAt = 2,
  layout = 'auto',
  legend = true,
  label,
  locale: localeProp,
  sound = true,
  className,
  ref,
  ...props
}: SlotGridProps) {
  const direction = useDirection()
  const k = useYouj()
  const labels = useComponentLabels(slotGridLabels)
  const locale = useLocale(localeProp)
  const cue = useSoundCue()
  const hintId = useId()
  const root = useRef<HTMLDivElement>(null)
  const cells = useRef(new Map<string, HTMLDivElement>())
  const inView = useInView(root, { once: true, amount: 0.2 })
  const shown = k.reduced || inView
  const [picked, setPicked] = useControllableState(value, defaultValue)

  // Which view: measured, so a narrow card gets the day view whatever the viewport.
  const [narrow, setNarrow] = useState(false)
  useResizeMeasure(
    root,
    (el) => {
      // A box with no width isn't laid out yet (or is hidden): keep the view it has.
      const width = el.getBoundingClientRect().width
      if (layout === 'auto' && width > 0) setNarrow(width < 576)
    },
    [layout],
  )
  const dayView = layout === 'day' || (layout === 'auto' && narrow)

  const first = midnight(+(start ?? Math.min(...slots.map((s) => +s.start))))
  const dayList = Array.from({ length: days }, (_, i) => {
    const d = new Date(first)
    d.setDate(d.getDate() + i)
    return d.getTime()
  })
  const rows = times ? [...times] : [...new Set(slots.map((s) => minuteOf(+s.start)))].sort((a, b) => a - b)
  const byKey = new Map<string, SlotGridSlot>()
  for (const slot of slots) {
    const t = +slot.start
    const d = dayList.findIndex((day, i) => t >= day && t < (dayList[i + 1] ?? day + DAY))
    if (d >= 0) byKey.set(`${d}:${minuteOf(t)}`, slot)
  }
  const at = (d: number, r: number) => byKey.get(`${d}:${rows[r]}`)
  const stateOf = (slot?: SlotGridSlot): SlotState =>
    !slot ? 'closed' : slot.mine ? 'mine' : slot.left <= 0 ? 'full' : slot.left <= fewAt ? 'few' : 'open'
  const pickable = (slot?: SlotGridSlot) => !!slot && !slot.mine && slot.left > 0
  const coordsOf = (id: string | null) => {
    for (let d = 0; d < dayList.length; d++) for (let r = 0; r < rows.length; r++) if (id && at(d, r)?.id === id) return { d, r }
    return undefined
  }
  const firstOpen = () => {
    for (let d = 0; d < dayList.length; d++) for (let r = 0; r < rows.length; r++) if (pickable(at(d, r))) return { d, r }
    return { d: 0, r: 0 }
  }

  const [active, setActive] = useState<{ d: number; r: number }>()
  const home = coordsOf(picked) ?? firstOpen()
  const focusAt = active ?? home
  const [day, setDay] = useState(home.d)
  const [slide, setSlide] = useState(0)
  const pendingFocus = useRef(false)

  // The first pass washes the grid in; after it, cells change on their own.
  const [intro, setIntro] = useState(!k.reduced)
  useEffect(() => {
    if (!inView || !intro) return
    const timer = setTimeout(() => setIntro(false), k.ms('deliberate') + k.ms('base'))
    return () => clearTimeout(timer)
  }, [inView, intro, k])
  const wave = k.reduced ? 0 : k.ms('deliberate') / Math.max(1, dayList.length + rows.length)

  const long = dateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' })
  const weekday = (f: 'short' | 'narrow') => dateTimeFormat(locale, { weekday: f })
  const dayNum = dateTimeFormat(locale, { day: 'numeric' })
  const clock = (minute: number) =>
    dateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(
      new Date(2000, 0, 1, Math.floor(minute / 60), minute % 60),
    )
  const words: Record<SlotState, (slot?: SlotGridSlot) => string> = {
    open: (s) => labels.slotGridLeft(s!.left),
    few: (s) => labels.slotGridLeft(s!.left),
    full: () => labels.slotGridFull,
    closed: () => labels.slotGridClosed,
    mine: () => labels.slotGridMine,
  }

  const pick = (slot?: SlotGridSlot) => {
    if (!slot || !pickable(slot) || slot.id === picked) return
    setPicked(slot.id)
    onValueChange?.(slot.id, slot)
    if (sound) cue('select')
  }
  const showDay = (next: number) => {
    if (next === day || next < 0 || next >= dayList.length) return
    setSlide(next > day ? 1 : -1)
    setDay(next)
  }

  const focusCell = (d: number, r: number) => {
    setActive({ d, r })
    if (dayView && d !== day) {
      showDay(d)
      pendingFocus.current = true
    } else cells.current.get(`${d}:${r}`)?.focus()
  }
  useEffect(() => {
    if (!pendingFocus.current || !active) return
    pendingFocus.current = false
    cells.current.get(`${active.d}:${active.r}`)?.focus()
  })

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const cell = (e.target as HTMLElement).closest<HTMLElement>('[data-slot=slot-grid-cell]')
    if (!cell) return
    const d = Number(cell.dataset.day)
    const r = Number(cell.dataset.row)
    const rtl = getComputedStyle(e.currentTarget).direction === 'rtl'
    const last = { d: dayList.length - 1, r: rows.length - 1 }
    let next: { d: number; r: number } | undefined
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') next = { d: d + ((e.key === 'ArrowRight') !== rtl ? 1 : -1), r }
    else if (e.key === 'ArrowDown') next = { d, r: r + 1 }
    else if (e.key === 'ArrowUp') next = { d, r: r - 1 }
    else if (e.key === 'Home') next = e.ctrlKey ? { d: 0, r: 0 } : { d: dayView ? d : 0, r: dayView ? 0 : r }
    else if (e.key === 'End') next = e.ctrlKey ? last : { d: dayView ? d : last.d, r: dayView ? last.r : r }
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      pick(at(d, r))
      return
    }
    if (!next) return
    e.preventDefault()
    if (next.d < 0 || next.r < 0 || next.d > last.d || next.r > last.r) return
    focusCell(next.d, next.r)
  }

  const cell = (d: number, r: number, wide: boolean) => {
    const slot = at(d, r)
    const state = stateOf(slot)
    const isPicked = !!slot && slot.id === picked
    const key = `${d}:${r}`
    const tab = focusAt.d === d && focusAt.r === r
    return (
      <div
        key={key}
        ref={(node) => {
          if (node) cells.current.set(key, node)
          else cells.current.delete(key)
        }}
        role="gridcell"
        tabIndex={tab ? 0 : -1}
        aria-selected={pickable(slot) || isPicked ? isPicked : undefined}
        aria-disabled={!pickable(slot) || undefined}
        aria-label={labels.slotGridCell(long.format(dayList[d]!), clock(rows[r]!), words[state](slot))}
        data-slot="slot-grid-cell"
        data-state={state}
        data-picked={isPicked || undefined}
        data-day={d}
        data-row={r}
        onClick={() => {
          setActive({ d, r })
          pick(slot)
        }}
        onFocus={() => setActive({ d, r })}
        className={cn(
          'group/cell relative own:flex min-w-0 rounded-[calc(var(--radius-lg)+1px)] outline-none select-none focus-ring',
          'transition-[background-color,color,opacity,translate,scale] yj-duration-fast ease-standard',
          wide ? 'h-12 items-center gap-3 own:px-3.5' : 'h-14 flex-col justify-between own:px-2.5 own:py-2',
          state === 'closed' && 'items-center justify-center',
          // One fill each, so no two background utilities compete: the lit key, your own booking, or the well.
          isPicked
            ? 'bg-fg own:text-canvas shadow-sm-soft'
            : state === 'mine'
              ? 'bg-success-subtle'
              : state !== 'closed' && cn(WELL, pickable(slot) && 'hover:bg-hover'),
          state === 'full' && HATCH,
          pickable(slot) && 'cursor-pointer active:scale-[0.98] reduced:active:scale-100',
          !shown && 'translate-y-1 opacity-0',
        )}
        style={intro && !wide ? { transitionDelay: `${Math.round((d + r) * wave)}ms` } : undefined}
      >
        {state === 'closed' ? (
          <span aria-hidden className="h-px w-3 bg-fg-subtle" />
        ) : (
          <>
            {state === 'mine' ? (
              <CheckIcon aria-hidden size={14} className="own:text-success-text" />
            ) : (
              <Pips slot={slot} state={state} picked={isPicked} />
            )}
            <span
              aria-hidden
              dir="auto"
              data-slot="slot-grid-value"
              className={cn(
                'truncate own:text-ui-sm own:leading-none own:tabular-nums',
                isPicked ? 'own:text-canvas' : COUNT[state],
                wide && 'own:ms-auto',
              )}
            >
              {state === 'mine' ? labels.slotGridMine : words[state](slot)}
            </span>
          </>
        )}
      </div>
    )
  }

  const legendRow = legend && (
    <div
      aria-hidden
      data-slot="slot-grid-legend"
      className="own:flex flex-wrap items-center justify-end gap-x-4 gap-y-1.5 own:text-ui-sm own:text-fg-muted"
    >
      {(
        [
          ['open', labels.slotGridOpen, 'bg-fg'],
          ['few', labels.slotGridFew, 'bg-warning'],
          ['full', labels.slotGridFull, OFF],
        ] as const
      ).map(([id, word, tone]) => (
        <span key={id} className="own:flex items-center gap-1.5">
          <span className="own:flex h-2.5 gap-[3px]">
            {[0, 1, 2].map((i) => (
              <span key={i} className={cn('w-1 rounded-[1.5px]', id === 'few' && i > 0 ? OFF : tone)} />
            ))}
          </span>
          {word}
        </span>
      ))}
    </div>
  )

  const hint = (
    <span id={hintId} className="sr-only">
      {labels.slotGridHint}
    </span>
  )

  return (
    <MotionFeatures>
      <div
        ref={(node) => {
          root.current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
        }}
        data-slot="slot-grid"
        data-layout={dayView ? 'day' : 'week'}
        data-reduced-motion={k.reduced || undefined}
        className={cn('own:flex w-full min-w-0 flex-col gap-4', className)}
        style={{ '--slot-cols': `repeat(${dayList.length}, minmax(0, 1fr))` } as CSSProperties}
        {...props}
      >
        {hint}
        {dayView ? (
          <>
            <DirectionProvider direction={direction}>
              <ToggleGroupPrimitive
                aria-label={labels.slotGridDays}
                value={[String(day)]}
                onValueChange={(next) => {
                  if (next[0] !== undefined) showDay(Number(next[0]))
                }}
                data-slot="slot-grid-days"
                className={cn('relative isolate grid grid-cols-(--slot-cols) gap-0.5 rounded-xl own:p-0.5', WELL)}
              >
                {dayList.map((t, d) => {
                  const daySlots = rows.map((_, r) => at(d, r)).filter((s): s is SlotGridSlot => !!s)
                  const open = daySlots.filter(pickable).length
                  const capacity = daySlots.reduce((sum, s) => sum + s.capacity, 0)
                  const free = daySlots.reduce((sum, s) => sum + (s.mine ? 0 : Math.max(0, s.left)), 0)
                  return (
                    <TogglePrimitive
                      key={t}
                      value={String(d)}
                      aria-label={`${long.format(t)}, ${labels.slotGridOpenCount(open)}`}
                      data-slot="slot-grid-day-key"
                      className="relative z-10 own:flex min-w-0 flex-col items-center gap-1 rounded-[calc(var(--radius-xl)-2px)] own:px-1 own:pt-2 own:pb-2.5 outline-none focus-ring"
                    >
                      <span data-slot="slot-grid-day" className={cn('own:text-ui-xs own:text-fg-muted', VOICE)}>
                        {weekday('narrow').format(t)}
                      </span>
                      <span data-slot="slot-grid-date" className="own:text-ui-lg own:leading-none own:font-medium own:text-fg own:tabular-nums">
                        {dayNum.format(t)}
                      </span>
                      {/* How much of the day is still free: a short rule, dark when nothing is. */}
                      <span aria-hidden className={cn('h-[3px] w-5 overflow-hidden rounded-full', OFF)}>
                        <span
                          className={cn('own:block h-full rounded-full', open ? 'bg-fg-subtle' : '')}
                          style={{ width: `${capacity ? Math.max(open ? 12 : 0, (free / capacity) * 100) : 0}%` }}
                        />
                      </span>
                    </TogglePrimitive>
                  )
                })}
                <SlidingIndicator
                  match="[data-pressed]"
                  data-slot="slot-grid-day-indicator"
                  className="rounded-[calc(var(--radius-xl)-2px)] bg-key shadow-sm-soft inset-ring-(length:--yj-stroke-width) inset-ring-(--ui--fill-edge)"
                />
              </ToggleGroupPrimitive>
            </DirectionProvider>
            <div
              role="grid"
              aria-label={label ?? labels.slotGrid}
              aria-describedby={hintId}
              data-slot="slot-grid-grid"
              className="overflow-hidden"
              onKeyDown={onKeyDown}
            >
              <m.div
                key={day}
                role="rowgroup"
                className="flex flex-col gap-1.5"
                initial={k.reduced || !slide ? false : { opacity: 0, x: 16 * slide * (direction === 'rtl' ? -1 : 1) }}
                animate={{ opacity: 1, x: 0 }}
                transition={k.reduced ? { type: false } : k.spring('snappy')}
                style={{ '--slide': slide } as CSSProperties}
              >
                <div role="row" className="sr-only">
                  <span role="columnheader">{long.format(dayList[day]!)}</span>
                </div>
                {rows.map((minute, r) => (
                  <div key={minute} role="row" data-slot="slot-grid-row" className="own:grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-2">
                    <span role="rowheader" data-slot="slot-grid-time" className="own:text-ui-sm own:text-fg-muted own:tabular-nums">
                      {clock(minute)}
                    </span>
                    {cell(day, r, true)}
                  </div>
                ))}
              </m.div>
            </div>
          </>
        ) : (
          <div
            role="grid"
            aria-label={label ?? labels.slotGrid}
            aria-describedby={hintId}
            data-slot="slot-grid-grid"
            className="own:flex flex-col gap-1.5"
            onKeyDown={onKeyDown}
          >
            <div role="row" className="own:grid grid-cols-[3.5rem_var(--slot-cols)] gap-1.5">
              <span role="columnheader" aria-hidden />
              {dayList.map((t) => (
                <span
                  key={t}
                  role="columnheader"
                  data-slot="slot-grid-day"
                  className={cn('own:flex items-baseline gap-1 px-1 own:text-ui-xs own:text-fg-muted', VOICE)}
                >
                  <span>{weekday('short').format(t)}</span>
                  <span className="own:text-fg own:tabular-nums">{dayNum.format(t)}</span>
                </span>
              ))}
            </div>
            {rows.map((minute, r) => (
              <div key={minute} role="row" data-slot="slot-grid-row" className="own:grid grid-cols-[3.5rem_var(--slot-cols)] gap-1.5">
                <span role="rowheader" data-slot="slot-grid-time" className="self-center own:text-ui-sm own:text-fg-muted own:tabular-nums">
                  {clock(minute)}
                </span>
                {dayList.map((_, d) => cell(d, r, false))}
              </div>
            ))}
          </div>
        )}
        {legendRow}
      </div>
    </MotionFeatures>
  )
}

export { SlotGrid, type SlotGridProps, type SlotGridSlot }
