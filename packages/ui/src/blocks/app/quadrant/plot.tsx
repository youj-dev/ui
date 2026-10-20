'use client'

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { useInView } from 'motion/react'
import { useYouj } from '@youj/core'
import { cn } from '../../../lib/utils'
import { GROUPS, TONES, groupOf, nearest, type Group, type Item, type Measure, type QuadrantCopy } from './data'

/* The field: four tinted corners split by two dashed lines, each with a handle on its axis that drags
 * (pointer, or the arrow keys as a slider) and recolours the bubbles as it passes them. Bubbles stand where
 * their items are, as big as their size, in their group's colour; with Movement on, a faint ring marks where
 * each stood last period and a line runs from it. The bubbles are one tab stop: an arrow key goes to the
 * nearest bubble that way, Home and End to the lowest and highest across, Enter picks one when the app
 * listens. The measures read left to right and bottom to top in either direction of text. Reduced motion:
 * bubbles and lines move in place. */

interface PlotProps {
  items: Item[]
  x: Measure
  y: Measure
  thresholds: [number, number]
  onThresholds: (next: [number, number], done: boolean) => void
  /** The group picked in the chips: the rest step back. */
  group: Group | null
  movement: boolean
  /** Movement just turned on: bubbles start from last period. */
  replay: boolean
  active: string | null
  onActive: (id: string | null) => void
  onSelect?: (item: Item) => void
  radius: (item: Item) => number
  label: (item: Item) => string
  figure: { x: (v: number) => string; y: (v: number) => string }
  copy: QuadrantCopy
}

/** Which split a handle drags: x for a horizontal handle, y for a vertical one (its `data-orientation`). */
const axisOf = (event: PointerEvent<HTMLElement>) => (event.currentTarget.dataset.orientation === 'vertical' ? 'y' : 'x')
const pct = (t: number) => `${(t * 100).toFixed(3)}%`
const SPRING = 'calc(var(--yj-duration-spring)*var(--yj-motion,1)) var(--ease-spring)'
const QUICK = 'calc(var(--yj-duration-fast)*var(--yj-motion,1)) var(--ease-standard)'
/** A bubble moves and grows on the CSS spring; its colour, fade and ring change quickly. */
const MOVES = [`translate ${SPRING}`, `scale ${SPRING}`, `background-color ${QUICK}`, `opacity ${QUICK}`, `box-shadow ${QUICK}`]
/** Each group's corner of the field. */
const CORNER: Record<Group, string> = { 'high-high': 'top-1.5 end-2 text-end', 'low-high': 'top-1.5 start-2', 'low-low': 'bottom-1.5 start-2', 'high-low': 'bottom-1.5 end-2 text-end' }

function Plot({ items, x, y, thresholds, onThresholds, group, movement, replay, active, onActive, onSelect, radius, label, figure, copy }: PlotProps) {
  const k = useYouj()
  const field = useRef<HTMLDivElement>(null)
  const [chosen, setCursor] = useState(items[0]?.id ?? '')
  const cursor = items.some((i) => i.id === chosen) ? chosen : (items[0]?.id ?? '')
  // The first time the field is seen the bubbles rise, left to right; after that, changes don't wait.
  const inView = useInView(field, { once: true, amount: 0.3 })
  const shown = k.reduced || inView
  const [settled, setSettled] = useState(k.reduced)
  useEffect(() => {
    if (!shown || settled) return
    const done = setTimeout(() => setSettled(true), k.ms('deliberate') + k.ms('slow'))
    return () => clearTimeout(done)
  }, [shown, settled, k])
  const rank = new Map([...items].sort((a, b) => a.x - b.x).map((item, i) => [item.id, i]))
  const delay = (item: Item) => (shown && !settled && !k.reduced ? ` ${Math.round(((rank.get(item.id) ?? 0) * k.ms('deliberate')) / Math.max(1, items.length))}ms` : '')
  const [dragging, setDragging] = useState<'x' | 'y' | null>(null)
  const tx = x.at(thresholds[0])
  const ty = 1 - y.at(thresholds[1])
  const place = (item: Item, then = false) => {
    const at = then && item.previous ? item.previous : item
    return { left: x.at(at.x), top: 1 - y.at(at.y) }
  }

  // Dragging a split: the pointer's place on the field, as a value rounded to read.
  const drag = (axis: 'x' | 'y', event: PointerEvent, done = false) => {
    const box = field.current?.getBoundingClientRect()
    if (!box || box.width === 0) return
    const t = axis === 'x' ? (event.clientX - box.left) / box.width : 1 - (event.clientY - box.top) / box.height
    const value = (axis === 'x' ? x : y).round((axis === 'x' ? x : y).from(Math.min(1, Math.max(0, t))))
    onThresholds(axis === 'x' ? [value, thresholds[1]] : [thresholds[0], value], done)
  }
  const handle = {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId)
      setDragging(axisOf(event))
      drag(axisOf(event), event)
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => dragging === axisOf(event) && drag(dragging, event),
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      if (dragging !== axisOf(event)) return
      setDragging(null)
      drag(dragging, event, true)
    },
    onPointerCancel: () => setDragging(null),
  }
  const step = (axis: 'x' | 'y') => (event: KeyboardEvent) => {
    const m = axis === 'x' ? x : y
    const now = thresholds[axis === 'x' ? 0 : 1]
    const up = ['ArrowUp', 'ArrowRight', 'PageUp'].includes(event.key)
    const next =
      event.key === 'Home' ? m.domain[0]
      : event.key === 'End' ? m.domain[1]
      : ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'PageUp', 'PageDown'].includes(event.key) ? m.step(now, up, event.shiftKey || event.key.startsWith('Page'))
      : undefined
    if (next === undefined) return
    event.preventDefault()
    onThresholds(axis === 'x' ? [next, thresholds[1]] : [thresholds[0], next], true)
  }

  // The nearest bubble in the direction of an arrow key, on screen: along it, plus twice the distance across.
  const keys = (event: KeyboardEvent) => {
    const from = items.find((i) => i.id === cursor)
    const box = field.current?.getBoundingClientRect()
    if (!from || !box) return
    const dir = ({ ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] } as Record<string, [number, number]>)[event.key]
    let next: Item | undefined
    if (dir) next = nearest(items, from, dir, (item) => place(item), box.width || 1, box.height || 1)
    else if (event.key === 'Home' || event.key === 'End') {
      next = [...items].sort((a, b) => a.x - b.x)[event.key === 'Home' ? 0 : items.length - 1]
    } else if ((event.key === 'Enter' || event.key === ' ') && onSelect) {
      event.preventDefault()
      return onSelect(from)
    } else if (event.key === 'Escape') return onActive(null)
    else return
    event.preventDefault()
    if (!next) return
    setCursor(next.id)
    field.current?.querySelector<HTMLElement>(`[data-yj-item="${next.id}"]`)?.focus()
  }

  const lit = items.find((i) => i.id === active)
  const tint = (g: Group) => `color-mix(in oklab, ${TONES[g]} ${group === null ? 7 : group === g ? 13 : 3}%, var(--color-surface))`
  const pill = 'absolute z-10 rounded-full border border-line bg-overlay px-1.5 text-ui-xs leading-5 font-medium text-fg tabular-nums shadow-xs outline-hidden focus-ring touch-none'

  return (
    <div dir="ltr" data-slot="quadrant-plot" className="relative h-full min-h-56 select-none [--axis-x:--spacing(6)] [--axis-y:--spacing(11)]">
      {/* The axes' labels: across under the field, up beside it. */}
      <div aria-hidden className="absolute start-(--axis-y) end-2 bottom-0 h-(--axis-x) text-ui-xs text-fg-muted tabular-nums">
        {/* A label steps aside while a split's handle is over it. */}
        {x.ticks.map((t) => (
          <span key={t.value} className={cn('absolute top-1 -translate-x-1/2 transition-opacity ease-standard yj-duration-fast', Math.abs(x.at(t.value) - tx) < 0.07 && 'opacity-0')} style={{ left: pct(x.at(t.value)) }}>
            {figure.x(t.value)}
          </span>
        ))}
      </div>
      <div aria-hidden className="absolute start-0 top-2 bottom-(--axis-x) w-(--axis-y) text-ui-xs text-fg-muted tabular-nums">
        {y.ticks
          .filter((t) => t.major)
          .map((t) => (
            <span key={t.value} className={cn('absolute end-2 translate-y-1/2 transition-opacity ease-standard yj-duration-fast', Math.abs(1 - y.at(t.value) - ty) < 0.06 && 'opacity-0')} style={{ bottom: pct(y.at(t.value)) }}>
              {figure.y(t.value)}
            </span>
          ))}
      </div>
      <div ref={field} className="absolute start-(--axis-y) end-2 top-2 bottom-(--axis-x) [container-type:size]">
        {(['high-high', 'low-high', 'low-low', 'high-low'] as const).map((g) => (
          <div
            key={g}
            aria-hidden
            className="absolute transition-[background-color] ease-standard yj-duration-fast"
            style={{ backgroundColor: tint(g), left: g.startsWith('high') ? pct(tx) : 0, width: pct(g.startsWith('high') ? 1 - tx : tx), top: g.endsWith('high') ? 0 : pct(ty), height: pct(g.endsWith('high') ? ty : 1 - ty) }}
          />
        ))}
        {x.ticks.map((t) => (
          <span key={`x${t.value}`} aria-hidden className="absolute inset-y-0 w-px bg-line-subtle" style={{ left: pct(x.at(t.value)) }} />
        ))}
        {y.ticks.map((t) => (
          <span key={`y${t.value}`} aria-hidden className={cn('absolute inset-x-0 h-px', t.major ? 'bg-line' : 'bg-line-subtle')} style={{ bottom: pct(y.at(t.value)) }} />
        ))}
        {GROUPS.map((g) => (
          <span key={g} aria-hidden className={cn('absolute flex items-center gap-1 text-ui-xs font-medium text-fg-muted', CORNER[g])}>
            <span className="size-1.5 rounded-full" style={{ backgroundColor: TONES[g] }} />
            {copy.groups[g]}
          </span>
        ))}
        {/* The splits: a dashed line each, with a wide target to drag. */}
        <div aria-hidden className="absolute inset-y-0 z-[1] w-3 -translate-x-1/2 cursor-ew-resize touch-none" style={{ left: pct(tx) }} data-orientation="horizontal" {...handle}>
          <span className="absolute inset-y-0 start-1/2 border-s border-dashed border-line-strong" />
        </div>
        <div aria-hidden className="absolute inset-x-0 z-[1] h-3 -translate-y-1/2 cursor-ns-resize touch-none" style={{ top: pct(ty) }} data-orientation="vertical" {...handle}>
          <span className="absolute inset-x-0 top-1/2 border-t border-dashed border-line-strong" />
        </div>
        {lit && (
          <>
            <span aria-hidden className="pointer-events-none absolute bottom-0 border-s border-line-strong" style={{ left: pct(place(lit).left), top: pct(place(lit).top) }} />
            <span aria-hidden className="pointer-events-none absolute start-0 border-t border-line-strong" style={{ top: pct(place(lit).top), width: pct(place(lit).left) }} />
          </>
        )}
        {movement && (
          <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full overflow-visible">
            {items.map((item) =>
              item.previous ? (
                <line
                  key={item.id}
                  x1={place(item, true).left * 100}
                  y1={place(item, true).top * 100}
                  x2={place(item).left * 100}
                  y2={place(item).top * 100}
                  stroke={TONES[groupOf(item.x, item.y, thresholds)]}
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                  strokeOpacity={0.6}
                  className={cn('transition-opacity ease-standard yj-duration-slow', replay && 'opacity-0', group && groupOf(item.x, item.y, thresholds) !== group && 'opacity-15')}
                />
              ) : null,
            )}
          </svg>
        )}
        {movement &&
          items.map((item) =>
            item.previous ? (
              <span
                key={`was-${item.id}`}
                aria-hidden
                className={cn('pointer-events-none absolute size-1.5 -translate-1/2 rounded-full border border-fg-muted transition-opacity ease-standard yj-duration-fast', group && groupOf(item.x, item.y, thresholds) !== group && 'opacity-15')}
                style={{ left: pct(place(item, true).left), top: pct(place(item, true).top) }}
              />
            ) : null,
          )}
        <div role="group" aria-label={copy.points} onKeyDown={keys}>
          {items.map((item) => {
            const g = groupOf(item.x, item.y, thresholds)
            const at = place(item, replay && movement)
            const r = radius(item)
            return (
              <button
                key={item.id}
                type="button"
                data-yj-item={item.id}
                data-yj-group={g}
                data-active={active === item.id || undefined}
                tabIndex={cursor === item.id ? 0 : -1}
                aria-label={label(item)}
                className={cn(
                  'absolute start-0 top-0 rounded-full outline-hidden focus-ring before:absolute before:-inset-1 before:rounded-full',
                  'shadow-[0_0_0_1.5px_var(--color-surface)] data-active:z-10 data-active:shadow-[0_0_0_1.5px_var(--color-surface),0_0_0_3px_var(--color-fg)]',
                  group !== null && g !== group && 'opacity-20',
                  !onSelect && 'cursor-default',
                )}
                style={
                  {
                    width: r * 2,
                    height: r * 2,
                    backgroundColor: `color-mix(in oklab, ${TONES[g]} 82%, transparent)`,
                    translate: `calc(${at.left * 100}cqw - 50%) calc(${at.top * 100}cqh - 50%)`,
                    scale: shown ? undefined : '0',
                    transition: replay ? 'none' : MOVES.map((t) => t + delay(item)).join(', '),
                  } as CSSProperties
                }
                onPointerEnter={() => onActive(item.id)}
                onPointerLeave={() => onActive(null)}
                onFocus={() => {
                  setCursor(item.id)
                  onActive(item.id)
                }}
                onBlur={() => onActive(null)}
                onClick={onSelect ? () => onSelect(item) : undefined}
              />
            )
          })}
        </div>
      </div>
      {/* The splits' handles, on the axes: sliders for the keyboard, grips for the pointer. */}
      <span
        role="slider"
        tabIndex={0}
        aria-label={copy.splitXName}
        aria-orientation="horizontal"
        aria-valuemin={x.domain[0]}
        aria-valuemax={x.domain[1]}
        aria-valuenow={thresholds[0]}
        aria-valuetext={copy.splitX(figure.x(thresholds[0]))}
        data-dragging={dragging === 'x' || undefined}
        className={cn(pill, 'bottom-0 -translate-x-1/2 cursor-ew-resize data-dragging:border-fg')}
        style={{ left: `calc(var(--axis-y) + (100% - var(--axis-y) - var(--spacing) * 2) * ${tx})` }}
        onKeyDown={step('x')}
        data-orientation="horizontal" {...handle}
      >
        {figure.x(thresholds[0])}
      </span>
      <span
        role="slider"
        tabIndex={0}
        aria-label={copy.splitYName}
        aria-orientation="vertical"
        aria-valuemin={y.domain[0]}
        aria-valuemax={y.domain[1]}
        aria-valuenow={thresholds[1]}
        aria-valuetext={copy.splitY(figure.y(thresholds[1]))}
        data-dragging={dragging === 'y' || undefined}
        className={cn(pill, 'start-0 -translate-y-1/2 cursor-ns-resize data-dragging:border-fg')}
        style={{ top: `calc(var(--spacing) * 2 + (100% - var(--spacing) * 2 - var(--axis-x)) * ${ty})` }}
        onKeyDown={step('y')}
        data-orientation="vertical" {...handle}
      >
        {figure.y(thresholds[1])}
      </span>
    </div>
  )
}

export { Plot }
