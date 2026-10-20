'use client'

import { useId, useLayoutEffect, useMemo, useRef, useState, type ComponentProps, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { Meter as MeterPrimitive } from '@base-ui/react/meter'
import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip'
import { AnimatePresence, m, useInView } from 'motion/react'
import { MotionFeatures, useSoundCue } from '@youj/core'
import { laneMeterLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale, useDirection } from '@youj/core/lib/youj/provider'
import { cn, numberFormat, toneColor } from '../../lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

/* Load across the lanes of a queue or a pipeline (queued, running, failed,
 * done) as stacked rows of countable cells. Every lane has the same number of
 * cells, so the rows form one ruled grid and compare at a glance: a label at
 * the start, the cells, the value at the end (with the lane's own capacity
 * muted, "24 / 32") and an optional action. On a narrow container each lane
 * stacks: label and value over a full-width row of cells.
 * - Scale: a lane with its own `max` (worker slots, queue size) fills against
 *   it; the others share the meter's `max` (default: the largest of them).
 *   Any value above zero keeps one cell lit; only a full lane lights them all.
 * - Items: a lane with `items` lights one cell per item. With `onItemAction`
 *   each is a button (one tab stop per lane, arrow keys, Home and End) with a
 *   tooltip, and a removed item shrinks out while the rest glide over.
 * - Motion: on first view the cells light in order at a constant rate (the
 *   deliberate token over the row), lane after lane; a new value lights or
 *   darkens the cells between the edge on screen and the new one. An
 *   `active` lane carries a light across its lit cells while it's on screen.
 * - Reduced motion: cells lit in place, no traveling light, items change at
 *   once. */

type LaneTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

interface LaneItem {
  id: string
  /** Its name, e.g. a job id: shown in its tooltip and spoken with the action. */
  label: string
  /** A second line in the tooltip: "Timeout after 30 s". */
  detail?: string
}

interface Lane {
  id: string
  /** The visible name at the start: "Running". */
  label: ReactNode
  value: number
  /** The lane's own capacity (worker slots, queue size): shown as "24 / 32" and spoken "24 of 32". Default: the meter's `max`. */
  max?: number
  /** The lit cells' color. Default `neutral` (the ink). */
  tone?: LaneTone
  /** Work in progress: a light travels across the lit cells. */
  active?: boolean
  /** Individual items, one cell each (e.g. failed jobs). With `onItemAction` each is a button. */
  items?: readonly LaneItem[]
  /** An end slot beside the value, e.g. a "Retry all" button. */
  action?: ReactNode
}

interface LaneMeterProps extends Omit<ComponentProps<'div'>, 'children'> {
  lanes: readonly Lane[]
  /** The scale shared by lanes without their own `max`. Default: the largest of their values. */
  max?: number
  /** Cells per lane. Default 32. */
  segments?: number
  /** Makes each item cell a button that calls this. */
  onItemAction?: (item: LaneItem, lane: Lane) => void
  /** The items' action, spoken with each ("Retry job-8f2a"). Default: the labels' "Retry". */
  itemActionLabel?: string
  /** Intl.NumberFormat options for the values. Default: plain counts. */
  format?: Intl.NumberFormatOptions
  /** Default: the YoujProvider locale. */
  locale?: string
  /** The meter's accessible name. Default: the labels' "Queue load". */
  label?: string
  /** With sound on, an item action plays `tap`. `false` keeps it silent. Default true. */
  sound?: boolean
}

const GAP = 3
// Unlit cells: a tint of the ink over whatever the meter sits on (9% light, 7% dark), so they read on a card and on the page alike.
const OFF = 'bg-[color-mix(in_oklab,var(--color-fg)_calc(9%-2%*var(--yj-dark)),transparent)]'
const VOICE = 'own:font-(family-name:--yj-label-font) own:tracking-(--yj-label-tracking) own:[text-transform:var(--yj-label-case)]'

const toneFill = (tone: LaneTone) => toneColor(tone, 'color-mix(in oklab, var(--color-fg) 75%, transparent)')

/** Lit cells for a fraction: any share above zero keeps one, only a full lane lights them all. */
function litCells(fraction: number, cells: number) {
  if (!(fraction > 0)) return 0
  if (fraction >= 1) return cells
  return Math.min(cells - 1, Math.max(1, Math.round(fraction * cells)))
}

const now = () => (typeof performance === 'undefined' ? 0 : performance.now())

function LaneMeter({
  lanes,
  max,
  segments = 32,
  onItemAction,
  itemActionLabel,
  format,
  locale: localeProp,
  label,
  sound = true,
  className,
  ...props
}: LaneMeterProps) {
  const k = useYouj()
  const labels = useComponentLabels(laneMeterLabels)
  const locale = useLocale(localeProp)
  const cue = useSoundCue()
  const ref = useRef<HTMLDivElement>(null)
  const seen = useInView(ref, { once: true, amount: 0.4 })
  const visible = useInView(ref)
  const [handle] = useState(() => TooltipPrimitive.createHandle<{ lane: string; item: string }>())
  const cells = Math.max(1, Math.round(segments))

  const number = useMemo(() => numberFormat(locale, format), [locale, format])
  const shared = max ?? Math.max(0, ...lanes.filter((l) => l.max === undefined).map((l) => l.value))
  const hasAction = lanes.some((l) => l.action != null)
  const findItem = (payload?: { lane: string; item: string }) => {
    const lane = lanes.find((l) => l.id === payload?.lane)
    return lane?.items?.find((i) => i.id === payload?.item)
  }

  return (
    <MotionFeatures features="max">
      <div
        ref={ref}
        role="group"
        aria-label={props['aria-labelledby'] ? undefined : (label ?? labels.laneMeter)}
        data-slot="lane-meter"
        data-reduced-motion={k.reduced || undefined}
        className={cn('@container/lane-meter w-full min-w-0', className)}
        {...props}
      >
        <div
          data-slot="lane-meter-lanes"
          className={cn(
            'own:grid grid-cols-[minmax(0,1fr)] gap-x-4 gap-y-4',
            '@min-[30rem]/lane-meter:gap-y-3.5',
            hasAction
              ? '@min-[30rem]/lane-meter:grid-cols-[minmax(3.5rem,max-content)_minmax(0,1fr)_max-content_auto]'
              : '@min-[30rem]/lane-meter:grid-cols-[minmax(3.5rem,max-content)_minmax(0,1fr)_max-content]',
          )}
        >
          {lanes.map((lane, index) => (
            <LaneRow
              key={lane.id}
              lane={lane}
              index={index}
              cells={cells}
              scale={lane.max ?? shared}
              number={number}
              locale={locale}
              format={format}
              shown={k.reduced || seen}
              glowing={visible && !k.reduced}
              onItemAction={onItemAction}
              actionLabel={itemActionLabel ?? labels.retry}
              spoken={labels}
              handle={handle}
              onAct={() => sound && cue('tap')}
            />
          ))}
        </div>
      </div>
      <Tooltip handle={handle}>
        {({ payload }) => {
          const item = findItem(payload as { lane: string; item: string } | undefined)
          return item ? (
            <TooltipContent data-slot="lane-meter-tooltip" className="flex-col items-start gap-0.5 own:py-1.5">
              <span data-slot="lane-meter-tooltip-label" className="own:font-mono">
                {item.label}
              </span>
              {item.detail && (
                <span data-slot="lane-meter-tooltip-detail" className="own:font-normal opacity-75">
                  {item.detail}
                </span>
              )}
            </TooltipContent>
          ) : null
        }}
      </Tooltip>
    </MotionFeatures>
  )
}

interface LaneRowProps {
  lane: Lane
  index: number
  cells: number
  scale: number
  number: Intl.NumberFormat
  locale: string
  format?: Intl.NumberFormatOptions
  shown: boolean
  glowing: boolean
  onItemAction?: (item: LaneItem, lane: Lane) => void
  actionLabel: string
  spoken: { laneOf: (value: string, max: string) => string; laneItemAction: (action: string, item: string) => string }
  handle: TooltipPrimitive.Handle<{ lane: string; item: string }>
  onAct: () => void
}

function LaneRow({ lane, index, cells, scale, number, locale, format, shown, glowing, onItemAction, actionLabel, spoken, handle, onAct }: LaneRowProps) {
  const k = useYouj()
  const rtl = useDirection() === 'rtl'
  const labelId = useId()
  const itemRefs = useRef(new Map<string, HTMLButtonElement>())
  const [activeId, setActiveId] = useState<string>()

  const items = lane.items
  const overflow = items !== undefined && items.length > cells
  const visibleItems = items ? items.slice(0, overflow ? cells - 1 : cells) : []
  const interactive = Boolean(onItemAction) && visibleItems.length > 0
  const target = items ? visibleItems.length + (overflow ? 1 : 0) : litCells(scale > 0 ? lane.value / scale : 0, cells)
  const lit = shown ? target : 0

  // Where the lit edge is on screen: the last sweep's start plus the cells it
  // has crossed since, so a new value sweeps on from there (as SegmentedMeter).
  const step = k.reduced ? 0 : k.ms('deliberate') / cells
  const sweep = useRef({ from: lit, to: lit, at: 0 })
  const { from: prevFrom, to: prevTo, at } = sweep.current
  const crossed = step && at ? Math.floor((now() - at) / step) : Infinity
  const edge = prevTo >= prevFrom ? Math.min(prevTo, prevFrom + crossed) : Math.max(prevTo, prevFrom - crossed)
  const from = lit === prevTo ? prevFrom : edge
  // The first fill runs lane after lane; later sweeps start at once.
  const lead = at === 0 && !k.reduced ? index * k.stagger('base') * 1000 : 0
  useLayoutEffect(() => {
    if (lit !== sweep.current.to) sweep.current = { from, to: lit, at: now() }
  })
  const delayAt = (i: number) =>
    lead + (lit > from && i >= from && i < lit ? (i - from) * step : lit < from && i >= lit && i < from ? (from - 1 - i) * step : 0)

  const tone = lane.tone ?? 'neutral'
  const value = number.format(lane.value)
  const current = visibleItems.some((i) => i.id === activeId) ? activeId : visibleItems[0]?.id
  const focusItem = (id: string | undefined) => {
    if (!id) return
    setActiveId(id)
    itemRefs.current.get(id)?.focus()
  }
  const act = (item: LaneItem, i: number) => {
    // The item is about to leave: hand focus to its neighbor first, so it isn't dropped on the page.
    const neighbour = visibleItems[i + 1] ?? visibleItems[i - 1]
    if (neighbour && itemRefs.current.get(item.id) === document.activeElement) focusItem(neighbour.id)
    onAct()
    onItemAction?.(item, lane)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const ids = visibleItems.map((i) => i.id)
    const at = ids.indexOf(current ?? '')
    const next =
      event.key === (rtl ? 'ArrowLeft' : 'ArrowRight')
        ? Math.min(ids.length - 1, at + 1)
        : event.key === (rtl ? 'ArrowRight' : 'ArrowLeft')
          ? Math.max(0, at - 1)
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? ids.length - 1
              : -1
    if (next < 0) return
    event.preventDefault()
    focusItem(ids[next])
  }

  // The traveling light: a soft band masked to the cells and clipped to the lit ones.
  const litWidth = `(${lit} * (100% + ${GAP}px) / ${cells} - ${GAP}px)`
  const period = `calc((100% + ${GAP}px) / ${cells})`
  const cell = `calc((100% + ${GAP}px) / ${cells} - ${GAP}px)`
  const mask = `repeating-linear-gradient(to right, var(--color-fg) 0 ${cell}, transparent ${cell} ${period})`

  const cellClass = 'min-w-0 flex-1 own:rounded-[2px]'
  const offCount = cells - (interactive ? visibleItems.length + (overflow ? 1 : 0) : 0)

  return (
    <div
      data-slot="lane-meter-lane"
      data-tone={tone}
      data-active={lane.active || undefined}
      className={cn(
        'own:grid items-center gap-x-3 gap-y-2',
        lane.action != null ? 'grid-cols-[minmax(0,1fr)_auto_auto]' : 'grid-cols-[minmax(0,1fr)_auto]',
        '@min-[30rem]/lane-meter:col-span-full @min-[30rem]/lane-meter:grid-cols-subgrid @min-[30rem]/lane-meter:gap-x-4',
      )}
      style={{ '--lane-tone': toneFill(tone) } as CSSProperties}
    >
      <MeterPrimitive.Root
        value={Math.min(lane.max ?? scale, Math.max(0, lane.value))}
        min={0}
        max={Math.max(lane.max ?? scale, 1)}
        locale={locale}
        format={format ?? {}}
        getAriaValueText={(formatted) => (lane.max !== undefined ? spoken.laneOf(formatted, number.format(lane.max)) : formatted)}
        data-slot="lane-meter-meter"
        className="col-span-full row-start-1 own:grid min-w-0 grid-cols-subgrid items-center"
      >
        <MeterPrimitive.Label id={labelId} data-slot="lane-meter-label" className={cn('col-start-1 min-w-0 truncate own:text-ui-sm own:text-fg-muted', VOICE)}>
          {lane.label}
        </MeterPrimitive.Label>
        <span
          data-slot="lane-meter-value"
          className="col-start-2 justify-self-end own:font-mono own:text-ui-lg own:text-fg own:tabular-nums @min-[30rem]/lane-meter:col-start-3"
        >
          {value}
          {lane.max !== undefined && (
            <span data-slot="lane-meter-max" className="own:text-fg-muted">
              {' / '}
              {number.format(lane.max)}
            </span>
          )}
        </span>
      </MeterPrimitive.Root>

      <div
        data-slot="lane-meter-track"
        role={interactive ? 'group' : undefined}
        aria-labelledby={interactive ? labelId : undefined}
        aria-hidden={interactive ? undefined : true}
        onKeyDown={interactive ? onKeyDown : undefined}
        className={cn(
          'relative col-span-full row-start-2 own:flex h-2.5 min-w-0 gap-0.75',
          '@min-[30rem]/lane-meter:col-span-1 @min-[30rem]/lane-meter:col-start-2 @min-[30rem]/lane-meter:row-start-1',
        )}
      >
        {interactive ? (
          <>
            <AnimatePresence mode="popLayout">
              {visibleItems.map((item, i) => (
                <TooltipTrigger
                  key={item.id}
                  handle={handle}
                  payload={{ lane: lane.id, item: item.id }}
                  delay={0}
                  closeDelay={0}
                  render={
                    <m.button
                      type="button"
                      ref={(el: HTMLButtonElement | null) => {
                        if (el) itemRefs.current.set(item.id, el)
                        else itemRefs.current.delete(item.id)
                      }}
                      tabIndex={item.id === current ? 0 : -1}
                      aria-label={spoken.laneItemAction(actionLabel, item.label)}
                      data-slot="lane-meter-item"
                      onFocus={() => setActiveId(item.id)}
                      onClick={() => act(item, i)}
                      layout={k.reduced ? false : 'position'}
                      initial={{ opacity: 0, scale: 0.4 }}
                      animate={{ opacity: shown ? 1 : 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.4 }}
                      transition={{
                        layout: k.spring('smooth'),
                        opacity: k.reduced ? { type: false } : { ...k.tween('fast', 'enter'), delay: delayAt(i) / 1000 },
                        scale: k.reduced ? { type: false } : k.tween('fast', 'enter'),
                      }}
                      className={cn(
                        cellClass,
                        'relative bg-(--lane-tone) outline-none focus-ring focus-visible:z-10',
                        // A 24px-tall hit area over a narrow cell, reaching to the middle of each gap, so neighbors' areas never overlap.
                        "before:absolute before:-inset-x-[1.5px] before:-inset-y-[7px] before:content-['']",
                        'transition-[scale,filter] yj-duration-fast ease-standard hover:scale-y-150 hover:brightness-110 focus-visible:scale-y-150',
                      )}
                    />
                  }
                />
              ))}
            </AnimatePresence>
            {overflow && <span data-slot="lane-meter-cell" data-state="on" data-overflow="" className={cn(cellClass, 'bg-(--lane-tone) opacity-60')} />}
            {Array.from({ length: Math.max(0, offCount) }, (_, i) => (
              <span key={`off-${i}`} aria-hidden data-slot="lane-meter-cell" data-state="off" className={cn(cellClass, OFF)} />
            ))}
          </>
        ) : (
          Array.from({ length: cells }, (_, i) => {
            const on = i < lit
            const delay = delayAt(i)
            return (
              <span
                key={i}
                data-slot="lane-meter-cell"
                data-state={on ? 'on' : 'off'}
                className={cn(cellClass, 'transition-[background-color] yj-duration-fast ease-standard', on ? 'bg-(--lane-tone)' : OFF)}
                style={delay ? { transitionDelay: `${Math.round(delay)}ms` } : undefined}
              />
            )
          })
        )}
        {lane.active && glowing && lit > 0 && (
          <span
            aria-hidden
            data-slot="lane-meter-glint"
            className="pointer-events-none absolute inset-0 overflow-hidden rtl:-scale-x-100"
            style={{ clipPath: `inset(0 calc(100% - ${litWidth}) 0 0)`, maskImage: mask, WebkitMaskImage: mask }}
          >
            <span data-slot="lane-meter-glint-band" className="absolute inset-0 animate-shimmer bg-linear-to-r from-transparent via-[color-mix(in_oklab,var(--lane-tone)_40%,color-mix(in_oklab,var(--color-fg)_calc(100%*var(--yj-dark)),var(--color-surface)))] to-transparent" />
          </span>
        )}
      </div>

      {lane.action != null && (
        <div data-slot="lane-meter-action" className="col-start-3 row-start-1 own:flex items-center justify-end @min-[30rem]/lane-meter:col-start-4">
          {lane.action}
        </div>
      )}
    </div>
  )
}

export { LaneMeter, type Lane, type LaneItem, type LaneMeterProps, type LaneTone }
