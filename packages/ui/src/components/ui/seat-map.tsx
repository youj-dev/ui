'use client'

import { AnimatePresence, m } from 'motion/react'
import { Fragment, useId, useLayoutEffect, useMemo, useRef, useState, type ComponentProps, type CSSProperties, type KeyboardEvent } from 'react'
import { MotionFeatures, useSoundCue } from '@youj/core'
import { CheckIcon } from '@youj/icons'
import { seatMapLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, numberFormat, toneColor } from '../../lib/utils'

/* A venue from above: the stage at the top, then rows of seats bending
 * gently round it, split by aisles, with the row's letter at both ends.
 * Every seat takes its price tier's color; taken seats are dimmed and
 * can't be picked; picked seats fill with their tier and spring in with a
 * check. Hovering or focusing a seat raises a chip over it with its row,
 * number, tier and price; the chip glides from seat to seat.
 * - Keyboard: the map is one grid, one tab stop. Arrows move seat to seat
 *   and row to row (skipping aisles), Home and End jump to a row's ends,
 *   Ctrl+Home and Ctrl+End to the first and last seat, and Space or Enter
 *   picks or lets go. Each seat is named "Row F, seat 12, €48, available"; a tier
 *   with no price names its seats without one and shows none in the chip or key.
 * - A venue plan is a physical map: it isn't mirrored in RTL, so seat 1
 *   stays where the venue put it; the text around it follows the page.
 * - Seats shrink with the room down to about 17px; past that the plan
 *   scrolls sideways instead, opening on its center, its edges fading by how
 *   far there is to go. Each seat's hit area fills the gaps around it, and a
 *   focused seat scrolls itself into view.
 * - Sound: toggleOn as a seat is picked, toggleOff as it's let go, error at
 *   the limit, each announced.
 * - Motion: the check springs in on the settle spring and the chip glides
 *   on the fast token. Reduced motion: both appear in place. */

type SeatTone = 'accent' | 'neutral' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

interface SeatMapTier {
  id: string
  /** "Stalls". */
  name: string
  /** In `currency`. Default: none, so no price is shown for the tier. */
  price?: number
  /** Default: the chart colors in turn. */
  tone?: SeatTone
}

interface SeatMapSeat {
  id: string
  /** The seat's number in its row. */
  number: number
  /** What its chip calls it, when row and number don't read right together: "14C". Default: the row's label and the number ("F7"). */
  label?: string
  /** The id of its price tier. */
  tier: string
  /** Sold or held by someone else. */
  unavailable?: boolean
}

interface SeatMapRow {
  id: string
  /** "F". */
  label: string
  seats: SeatMapSeat[]
}

interface SeatMapProps extends Omit<ComponentProps<'div'>, 'children' | 'defaultValue' | 'onChange'> {
  rows: SeatMapRow[]
  tiers: SeatMapTier[]
  /** Seat positions (1-based, counted along the row) after which an aisle runs. */
  aisles?: number[]
  /** The picked seats' ids. */
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
  /** How many seats can be picked. Default: no limit. */
  max?: number
  /** ISO 4217 code for the prices. Default EUR. */
  currency?: string
  /** Formats a tier's price. Default: `currency` in the locale, without decimals. */
  format?: (price: number) => string
  /** Default: the YoujProvider locale. */
  locale?: string
  /** Accessible name. Default: the labels' "Seat map". */
  label?: string
  /** The word on the stage, or false for no stage. Default: the labels' "Stage". */
  stage?: string | false
  /** Plays toggle cues as seats are picked and let go. Default true. */
  sound?: boolean
}

const TONES: SeatTone[] = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5']
const toneVar = (tone: SeatTone) => toneColor(tone, 'var(--color-fg-muted)')
/** Near-black ink in both modes, for the check on a filled seat. */
const INK = 'color-mix(in oklab, var(--color-canvas) calc(100% * var(--yj-dark)), var(--color-fg))'
/** Width of the scroller's edge fade, in px. */
const FADE = 28

/** Room from a point `x` along the grid to the plan's visible edges (less their fades), in px: keeps the chip in view. */
function room(view: HTMLElement, grid: HTMLElement, x: number) {
  const v = view.getBoundingClientRect()
  const b = grid.getBoundingClientRect()
  const start = view.scrollLeft
  const end = view.scrollWidth - view.clientWidth - start
  return { lo: v.left + Math.min(start, FADE) - b.left - x, hi: v.right - Math.min(end, FADE) - b.left - x }
}

function SeatMap({
  rows,
  tiers,
  aisles = [],
  value: valueProp,
  defaultValue,
  onValueChange,
  max,
  currency = 'EUR',
  format,
  locale: localeProp,
  label,
  stage,
  sound = true,
  className,
  style,
  ...props
}: SeatMapProps) {
  const k = useYouj()
  const labels = useComponentLabels(seatMapLabels)
  const locale = useLocale(localeProp)
  const cue = useSoundCue()
  const hintId = useId()
  const { announce, announcer } = useAnnouncer()
  const [value, setInner] = useControllableState<string[]>(valueProp, defaultValue ?? [])
  const setValue = (next: string[]) => (setInner(next), onValueChange?.(next))
  const picked = new Set(value)
  const refs = useRef(new Map<string, HTMLDivElement>())
  const grid = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<string>()
  const [inspect, setInspect] = useState<{ id: string; x: number; y: number; lo: number; hi: number }>()
  const viewport = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: 0, end: 0 })

  // A plan wider than its room scrolls: open it on its center (where the
  // stage is), and track how far there is to go each way for the fades.
  useLayoutEffect(() => {
    const el = viewport.current
    if (!el) return
    let raf = 0
    let centred = false
    const measure = () => {
      raf = 0
      const max = Math.max(el.scrollWidth - el.clientWidth, 0)
      if (max > 1 && !centred) {
        centred = true
        el.scrollLeft = max / 2
      }
      const start = Math.min(el.scrollLeft, max)
      setEdges((prev) => (Math.abs(prev.start - start) < 1 && Math.abs(prev.end - (max - start)) < 1 ? prev : { start, end: max - start }))
      // A chip that's up follows the scroll (a focused seat scrolls into view).
      const box = grid.current
      if (box) setInspect((prev) => prev && { ...prev, ...room(el, box, prev.x) })
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure)
    }
    measure()
    el.addEventListener('scroll', schedule, { passive: true })
    const resize = new ResizeObserver(schedule)
    resize.observe(el)
    if (el.firstElementChild) resize.observe(el.firstElementChild)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('scroll', schedule)
      resize.disconnect()
    }
  }, [])

  const money = useMemo(() => (format ? { format } : numberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 })), [format, locale, currency])
  const priceOf = (tier?: { price?: number }) => (tier?.price === undefined ? '' : money.format(tier.price))
  const tierOf = new Map(tiers.map((t, i) => [t.id, { ...t, color: toneVar(t.tone ?? TONES[i % TONES.length]!) }]))
  const columns = Math.max(0, ...rows.map((r) => r.seats.length))
  const seats = rows.flatMap((row) => row.seats.map((seat) => ({ row, seat })))
  const byId = new Map(seats.map((s) => [s.seat.id, s]))
  const first = seats.find((s) => !s.seat.unavailable) ?? seats[0]
  const tabStop = active && byId.has(active) ? active : (seats.find((s) => picked.has(s.seat.id))?.seat.id ?? first?.seat.id)
  const status = (seat: SeatMapSeat) => (picked.has(seat.id) ? labels.seatSelected : seat.unavailable ? labels.seatUnavailable : labels.seatAvailable)

  const toggle = (id: string) => {
    const hit = byId.get(id)
    if (!hit || hit.seat.unavailable) return
    const { row, seat } = hit
    if (picked.has(id)) {
      setValue(value.filter((v) => v !== id))
      if (sound) cue('toggleOff')
      announce(labels.seatRemoved(row.label, seat.number))
    } else if (max !== undefined && value.length >= max) {
      if (sound) cue('error')
      announce(labels.seatLimit(max))
    } else {
      setValue([...value, id])
      if (sound) cue('toggleOn')
      announce(labels.seatAdded(row.label, seat.number))
    }
  }

  const show = (id: string) => {
    const el = refs.current.get(id)
    const box = grid.current
    const view = viewport.current
    if (!el || !box || !view) return
    const a = el.getBoundingClientRect()
    const b = box.getBoundingClientRect()
    const x = a.left - b.left + a.width / 2
    setInspect({ id, x, y: a.top - b.top, ...room(view, box, x) })
  }

  const move = (id: string) => {
    setActive(id)
    const el = refs.current.get(id)
    el?.focus({ preventScroll: true })
    // Clear of the fades too (the seats' scroll margin), not just in view.
    el?.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: k.reduced ? 'auto' : 'smooth' })
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const id = (e.target as HTMLElement).dataset.seatId
    const hit = id ? byId.get(id) : undefined
    if (!hit) return
    const r = rows.indexOf(hit.row)
    const i = hit.row.seats.indexOf(hit.seat)
    let next: SeatMapSeat | undefined
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      return toggle(hit.seat.id)
    }
    if (e.key === 'ArrowRight') next = hit.row.seats[i + 1]
    else if (e.key === 'ArrowLeft') next = hit.row.seats[i - 1]
    else if (e.key === 'Home') next = e.ctrlKey ? rows[0]?.seats[0] : hit.row.seats[0]
    else if (e.key === 'End') next = e.ctrlKey ? rows.at(-1)?.seats.at(-1) : hit.row.seats.at(-1)
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const target = rows[r + (e.key === 'ArrowDown' ? 1 : -1)]
      // The same place along the row, or the nearest seat in a shorter one.
      next = target?.seats[Math.min(i, target.seats.length - 1)]
    }
    if (!next) return
    e.preventDefault()
    move(next.id)
  }

  const shown = inspect && byId.get(inspect.id)
  const shownTier = shown && tierOf.get(shown.seat.tier)

  return (
    <MotionFeatures>
      <div
        data-slot="seat-map"
        data-reduced-motion={k.reduced || undefined}
        className={cn('@container/seat-map own:flex w-full flex-col gap-5', className)}
        style={{ '--seat-columns': columns, '--seat-aisles': aisles.length, ...style } as CSSProperties}
        {...props}
      >
        <div
          ref={viewport}
          data-slot="seat-map-viewport"
          dir="ltr"
          data-overflow-start={edges.start > 1 || undefined}
          data-overflow-end={edges.end > 1 || undefined}
          className="yj-scrollbar own:-mb-2 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-2"
          style={
            edges.start > 1 || edges.end > 1
              ? {
                  maskImage: `linear-gradient(to right, transparent, black ${Math.min(edges.start, FADE)}px, black calc(100% - ${Math.min(edges.end, FADE)}px), transparent)`,
                }
              : undefined
          }
        >
          <div className="mx-auto own:flex w-max min-w-full flex-col gap-5">
            {stage !== false && (
              <div data-slot="seat-map-stage" aria-hidden className="relative own:mx-auto h-9 w-[min(78%,28rem)]">
                <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
                  <path
                    d="M2,2 H98 L94,15 Q50,26 6,15 Z"
                    vectorEffect="non-scaling-stroke"
                    strokeWidth={1}
                    className="fill-[color-mix(in_oklab,var(--color-fg)_calc(6%+3%*var(--yj-dark)),transparent)] stroke-[color-mix(in_oklab,var(--color-fg)_16%,transparent)]"
                  />
                </svg>
                <span className="absolute inset-x-0 top-[34%] -translate-y-1/2 text-center own:font-(family-name:--yj-label-font) own:text-ui-xs own:text-fg-muted own:tracking-[0.3em] own:[text-transform:var(--yj-label-case)]">
                  {stage ?? labels.seatMapStage}
                </span>
              </div>
            )}

            <div
              ref={grid}
              role="grid"
              aria-label={label ?? labels.seatMap}
              aria-describedby={hintId}
              aria-multiselectable
              dir="ltr"
              data-slot="seat-map-grid"
              className="relative own:mx-auto own:flex w-fit flex-col gap-[calc(var(--seat)*0.3)] pb-1 [--aisle:calc(var(--seat)*0.9)] [--seat-gap:calc(var(--seat)*0.18)] [--seat:clamp(1.0625rem,calc((100cqw-5rem-var(--seat-aisles)*1rem)/(var(--seat-columns)*1.18)),1.75rem)]"
              onKeyDown={onKeyDown}
              onPointerLeave={() => setInspect(undefined)}
              onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setInspect(undefined)}
            >
              <span id={hintId} className="sr-only">
                {labels.seatMapHint}
              </span>
              {rows.map((row) => (
                <div key={row.id} role="row" data-slot="seat-map-row" className="own:flex items-center gap-(--seat-gap)">
                  <span role="rowheader" aria-label={labels.seatRow(row.label)} data-slot="seat-map-row-label" className="w-5 shrink-0 text-center own:font-mono own:text-ui-xs own:text-fg-muted">
                    {row.label}
                  </span>
                  {row.seats.map((seat, i) => {
                    const tier = tierOf.get(seat.tier)
                    const on = picked.has(seat.id)
                    // Rows bend round the stage: seats rise toward the row's ends.
                    const reach = columns > 1 ? Math.abs(i - (row.seats.length - 1) / 2) / ((columns - 1) / 2) : 0
                    const aisle = aisles.includes(i + 1) && i < row.seats.length - 1
                    return (
                      <Fragment key={seat.id}>
                        <div
                          ref={(el) => void (el ? refs.current.set(seat.id, el) : refs.current.delete(seat.id))}
                          role="gridcell"
                          data-slot="seat-map-seat"
                          data-seat-id={seat.id}
                          data-state={on ? 'selected' : seat.unavailable ? 'unavailable' : 'available'}
                          aria-label={tier?.price === undefined ? `${labels.seatRow(row.label)}, ${labels.seatNumber(seat.number)}, ${status(seat)}` : labels.seatItem(row.label, seat.number, priceOf(tier), status(seat))}
                          aria-selected={on}
                          aria-disabled={seat.unavailable || undefined}
                          tabIndex={seat.id === tabStop ? 0 : -1}
                          onFocus={() => (setActive(seat.id), show(seat.id))}
                          onPointerEnter={() => show(seat.id)}
                          onClick={() => toggle(seat.id)}
                          className={cn(
                            'group/seat focus-ring relative own:grid size-(--seat) shrink-0 place-items-center rounded-t-[42%] rounded-b-[22%] outline-none scroll-mx-10',
                            // The hit area fills half the gap on each side, so the pointer never falls between seats.
                            'before:absolute before:-inset-x-[calc(var(--seat-gap)/2)] before:-inset-y-[calc(var(--seat)*0.15)]',
                            'transition-[background-color,box-shadow,scale] yj-duration-fast ease-standard reduced:transition-none',
                            seat.unavailable
                              ? 'cursor-not-allowed bg-[color-mix(in_oklab,var(--color-fg)_calc(6%+2%*var(--yj-dark)),transparent)] [background-image:repeating-linear-gradient(-45deg,color-mix(in_oklab,var(--color-fg)_9%,transparent)_0_1px,transparent_1px_4px)]'
                              : on
                                ? 'cursor-pointer bg-(--tier) shadow-[0_0_0_1px_var(--tier),0_0_14px_-2px_var(--tier)]'
                                : 'cursor-pointer bg-[color-mix(in_oklab,var(--tier)_26%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--tier)_55%,transparent)] hover:scale-110 hover:bg-[color-mix(in_oklab,var(--tier)_44%,transparent)]',
                          )}
                          style={{ '--tier': tier?.color, translate: `0 calc(var(--seat) * ${-(reach * reach * 0.45).toFixed(3)})` } as CSSProperties}
                        >
                          <AnimatePresence initial={false}>
                            {on && (
                              <m.span
                                key="check"
                                aria-hidden
                                className="grid place-items-center"
                                style={{ color: INK }}
                                initial={k.reduced ? false : { scale: 0.3, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={k.reduced ? undefined : { scale: 0.3, opacity: 0, transition: k.tween('fast', 'exit') }}
                                transition={k.reduced ? { type: false } : k.spring('settle')}
                              >
                                <CheckIcon size={12} strokeWidth={3} />
                              </m.span>
                            )}
                          </AnimatePresence>
                        </div>
                        {aisle && <span aria-hidden data-slot="seat-map-aisle" className="w-(--aisle) shrink-0" />}
                      </Fragment>
                    )
                  })}
                  <span aria-hidden data-slot="seat-map-row-label" className="w-5 shrink-0 text-center own:font-mono own:text-ui-xs own:text-fg-muted">
                    {row.label}
                  </span>
                </div>
              ))}

              <div
                aria-hidden
                data-slot="seat-map-inspector"
                className={cn(
                  'pointer-events-none absolute start-0 top-0 z-10 transition-[translate,opacity] yj-duration-fast ease-standard reduced:transition-none',
                  shown ? 'opacity-100' : 'opacity-0',
                )}
                style={{ translate: inspect ? `${inspect.x}px ${inspect.y - 8}px` : undefined }}
              >
                {shown && (
                  <>
                    <div
                      className="absolute bottom-[5px] own:flex w-max items-center gap-2.5 rounded-lg border border-line bg-overlay px-2.5 py-1.5 whitespace-nowrap shadow-md"
                      style={{ translate: `clamp(${inspect.lo}px, -50%, calc(${inspect.hi}px - 100%)) 0` }}
                    >
                      <span className="own:font-mono own:text-ui own:font-medium own:text-fg own:tabular-nums">
                        {shown.seat.label ?? `${shown.row.label}${shown.seat.number}`}
                      </span>
                      <span className="h-3.5 w-px bg-line" />
                      <span className="own:flex items-center gap-1.5 own:text-ui-sm own:text-fg-muted">
                        <span className="size-2 rounded-[2px]" style={{ background: shownTier?.color }} />
                        {shownTier?.name}
                      </span>
                      {shownTier?.price !== undefined && (
                        <span className={cn('own:font-mono own:text-ui-sm own:tabular-nums', shown.seat.unavailable ? 'own:text-fg-muted line-through' : 'own:text-fg')}>
                          {priceOf(shownTier)}
                        </span>
                      )}
                    </div>
                    <span className="absolute bottom-0 size-2.5 -translate-x-1/2 rotate-45 border-e border-b border-line bg-overlay" />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <ul data-slot="seat-map-legend" aria-hidden className="own:flex flex-wrap items-center justify-center gap-x-5 gap-y-2 own:text-ui-sm own:text-fg-muted">
          {tiers.map((t) => (
            <li key={t.id} className="flex items-center gap-2">
              <span className="size-3 rounded-t-[42%] rounded-b-[22%] bg-[color-mix(in_oklab,var(--tier)_26%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--tier)_55%,transparent)]" style={{ '--tier': tierOf.get(t.id)!.color } as CSSProperties} />
              {t.name}
              {t.price !== undefined && <span className="own:font-mono own:text-fg own:tabular-nums">{money.format(t.price)}</span>}
            </li>
          ))}
          <li className="flex items-center gap-2">
            <span className="size-3 rounded-t-[42%] rounded-b-[22%] bg-[color-mix(in_oklab,var(--color-fg)_calc(6%+2%*var(--yj-dark)),transparent)] [background-image:repeating-linear-gradient(-45deg,color-mix(in_oklab,var(--color-fg)_9%,transparent)_0_1px,transparent_1px_4px)]" />
            <span className="own:first-letter:uppercase">{labels.seatUnavailable}</span>
          </li>
        </ul>
        {announcer}
      </div>
    </MotionFeatures>
  )
}

export { SeatMap, type SeatMapProps, type SeatMapRow, type SeatMapSeat, type SeatMapTier, type SeatTone }
