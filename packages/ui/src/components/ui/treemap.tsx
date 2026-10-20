'use client'

import { useId, useMemo, useRef, useState, type ComponentProps, type CSSProperties, type KeyboardEvent } from 'react'
import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip'
import { AnimatePresence, m, useInView } from 'motion/react'
import { MotionFeatures } from '@youj/core'
import { treemapLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import { cn, numberFormat, toneColor } from '../../lib/utils'
import { useResizeMeasure } from '../../hooks/use-resize-measure'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

/* How a whole divides: each part is a cell whose area is its value, laid out
 * squarified (Bruls, Huizing & van Wijk), so cells stay close to square and
 * compare by eye. Largest first, from the top-start corner; in RTL the map
 * mirrors. A wide strip by default (`aspect`, 3.5:1), square-cornered cells
 * a step above the surface, edged with the line token.
 * - Labels: name and value (mono) where the cell has room, the name alone
 *   in a smaller one, nothing in a sliver. Every cell keeps its tooltip.
 * - Highlight: `highlight` ids are tinted and outlined in their tone (the
 *   accent unless the item sets one); an item's tone alone tints it faintly.
 * - Keyboard: one tab stop. Arrow keys move to the nearest cell in that
 *   direction, as laid out; Home and End go to the largest and smallest.
 *   Focus or hover shows the name, value and share.
 * - Semantics: a named group holding a list (largest first), each item named
 *   with its value, share and highlight, and a summary as its description.
 * - Motion: cells fade in largest first when the map scrolls into view; new
 *   data re-lays the map on the smooth spring (FLIP, so only transforms
 *   move), cells that leave fade out and new ones fade in. Highlights change
 *   color on the fast token.
 * - Reduced motion: drawn in place; changes land at once. */

type TreemapTone = 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

interface TreemapItem {
  id: string
  name: string
  /** Sets the cell's area. Items at zero or below are left out. */
  value: number
  /** Tints the cell, and colors it when highlighted. Default: neutral, or the accent when highlighted. */
  tone?: TreemapTone
}

interface TreemapProps extends Omit<ComponentProps<'div'>, 'children'> {
  items: readonly TreemapItem[]
  /** Ids of the items to highlight. */
  highlight?: string | readonly string[]
  /** Formats values in cells, the tooltip and the spoken text. Default: the locale's number format. */
  formatValue?: (value: number) => string
  /** Accessible name of the map. Default: the labels' "Treemap". */
  label?: string
  /** Space between cells, in px. Default 4. */
  gap?: number
  /** Width to height. Default 3.5, a wide strip; a height class wins over it. */
  aspect?: number
}

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/** The worst aspect ratio in a row of areas laid along `side`. */
function worst(row: number[], sum: number, side: number) {
  const s2 = side * side
  const sum2 = sum * sum
  return Math.max((s2 * Math.max(...row)) / sum2, sum2 / (s2 * Math.min(...row)))
}

/** Squarified layout of descending areas (which sum to w × h) into the box. */
function squarify(areas: number[], box: Rect): Rect[] {
  const out: Rect[] = []
  let { x, y, w, h } = box
  let i = 0
  while (i < areas.length) {
    const side = Math.min(w, h)
    const row = [areas[i]!]
    let sum = areas[i]!
    let j = i + 1
    while (j < areas.length && worst([...row, areas[j]!], sum + areas[j]!, side) <= worst(row, sum, side)) {
      row.push(areas[j]!)
      sum += areas[j]!
      j++
    }
    // The row runs along the shorter side, as a strip `thickness` deep.
    const thickness = side > 0 ? sum / side : 0
    let offset = 0
    for (const area of row) {
      const length = thickness > 0 ? area / thickness : 0
      out.push(w >= h ? { x, y: y + offset, w: thickness, h: length } : { x: x + offset, y, w: length, h: thickness })
      offset += length
    }
    if (w >= h) {
      x += thickness
      w -= thickness
    } else {
      y += thickness
      h -= thickness
    }
    i = j
  }
  return out
}

const toneInk = (tone: TreemapTone) =>
  tone === 'accent' || tone === 'success' || tone === 'warning' || tone === 'danger' ? `var(--color-${tone}-text)` : 'var(--color-fg)'

/** Before the map is measured (and on the server) it lays out for this box. */
const FALLBACK = { w: 700, h: 200 }
/** A cell's inline padding and borders, and the rough advance of one label character, in px. */
const CELL_PADDING = 22
const CHAR_WIDTH = 7.4

const ARROWS: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }

/** The nearest rect in a direction: overlapping on the cross axis first, then by distance. */
function nearest(from: DOMRect, rects: (DOMRect | undefined)[], [dx, dy]: [number, number]) {
  let best = -1
  let bestScore = Infinity
  rects.forEach((r, i) => {
    if (!r || r === from) return
    const primary = dx > 0 ? r.left - from.right : dx < 0 ? from.left - r.right : dy > 0 ? r.top - from.bottom : from.top - r.bottom
    if (primary < -1) return
    const [a0, a1, b0, b1] = dx ? [r.top, r.bottom, from.top, from.bottom] : [r.left, r.right, from.left, from.right]
    const apart = Math.max(0, Math.max(a0, b0) - Math.min(a1, b1))
    const drift = Math.abs((a0 + a1) / 2 - (b0 + b1) / 2)
    const score = primary + apart * 4 + drift * 0.01
    if (score < bestScore) {
      bestScore = score
      best = i
    }
  })
  return best
}

function Treemap({ items, highlight, formatValue, label, gap = 4, aspect, className, style, ...props }: TreemapProps) {
  const k = useYouj()
  const locale = useLocale()
  const labels = useComponentLabels(treemapLabels)
  const summaryId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const cellRefs = useRef(new Map<string, HTMLDivElement>())
  const inView = useInView(rootRef, { once: true, amount: 0.3 })
  const shown = k.reduced || inView
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  const [active, setActive] = useState<string>()
  const [handle] = useState(() => TooltipPrimitive.createHandle<string>())

  useResizeMeasure(listRef, (el) => {
    const { width, height } = el.getBoundingClientRect()
    setSize((s) => (s && Math.abs(s.w - width) < 0.5 && Math.abs(s.h - height) < 0.5 ? s : { w: width, h: height }))
  })

  const format = useMemo(() => formatValue ?? numberFormat(locale).format, [formatValue, locale])
  const percent = useMemo(() => {
    const whole = numberFormat(locale, { style: 'percent', maximumFractionDigits: 0 })
    const fine = numberFormat(locale, { style: 'percent', maximumFractionDigits: 1 })
    return (share: number) => (share < 0.1 ? fine : whole).format(share)
  }, [locale])

  const lit = useMemo(() => new Set(typeof highlight === 'string' ? [highlight] : (highlight ?? [])), [highlight])
  const { cells, total } = useMemo(() => {
    const parts = items.filter((item) => item.value > 0).sort((a, b) => b.value - a.value)
    const sum = parts.reduce((acc, item) => acc + item.value, 0)
    const { w, h } = size && size.w > 0 && size.h > 0 ? size : FALLBACK
    // Laid out in a box one gap larger, so every cell gives up one gap and
    // the outer cells still meet the map's edges.
    const box = { x: 0, y: 0, w: w + gap, h: h + gap }
    const rects =
      sum > 0
        ? squarify(
            parts.map((item) => (item.value / sum) * box.w * box.h),
            box,
          )
        : []
    return {
      total: sum,
      cells: parts.map((item, i) => {
        const r = rects[i]!
        const cw = Math.max(0, r.w - gap)
        const ch = Math.max(0, r.h - gap)
        // A label shows only where it reads: the whole name (or ten characters
        // of a long one) must fit, and the value beside it for the second line.
        const fits = (text: string, least = text.length) => CELL_PADDING + Math.min(text.length, least) * CHAR_WIDTH <= cw
        const room = fits(item.name, 10) && ch >= 26 ? (fits(format(item.value)) && ch >= 44 ? 'full' : 'name') : 'none'
        return {
          item,
          share: item.value / sum,
          style: { insetInlineStart: `${(r.x / w) * 100}%`, top: `${(r.y / h) * 100}%`, width: `${(cw / w) * 100}%`, height: `${(ch / h) * 100}%` },
          room,
        }
      }),
    }
  }, [items, size, gap, format])

  const current = cells.some((c) => c.item.id === active) ? active : cells[0]?.item.id

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = cells.findIndex((c) => c.item.id === current)
    let next = -1
    if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = cells.length - 1
    else if (ARROWS[event.key] && index >= 0) {
      const rects = cells.map((c) => cellRefs.current.get(c.item.id)?.getBoundingClientRect())
      if (!rects[index]) return
      next = nearest(rects[index], rects, ARROWS[event.key]!)
    } else return
    event.preventDefault()
    if (next < 0 || next === index) return
    const id = cells[next]!.item.id
    setActive(id)
    cellRefs.current.get(id)?.focus()
  }

  const largest = cells[0]
  const byId = (id: string | undefined) => cells.find((c) => c.item.id === id)

  return (
    <MotionFeatures features="max">
      <div
        ref={rootRef}
        role="group"
        aria-label={label ?? labels.treemap}
        aria-describedby={largest ? summaryId : undefined}
        data-slot="treemap"
        data-reduced-motion={k.reduced || undefined}
        className={cn('relative aspect-[7/2] w-full min-w-0', className)}
        style={aspect ? { aspectRatio: aspect, ...style } : style}
        {...props}
      >
        {cells.length === 0 && (
          <div
            data-slot="treemap-empty"
            className="absolute inset-0 own:grid place-items-center own:rounded-[min(var(--radius-md),6px)] border border-dashed border-line own:text-ui own:text-fg-muted"
          >
            {labels.noData}
          </div>
        )}
        <div ref={listRef} role={cells.length ? 'list' : undefined} data-slot="treemap-list" className="absolute inset-0" onKeyDown={onKeyDown}>
          <AnimatePresence>
            {cells.map((cell, i) => {
              const on = lit.has(cell.item.id)
              const tone = cell.item.tone ?? (on ? 'accent' : 'neutral')
              return (
                <TooltipTrigger
                  key={cell.item.id}
                  handle={handle}
                  payload={cell.item.id}
                  delay={0}
                  closeDelay={0}
                  render={
                    <m.div
                      ref={(el: HTMLDivElement | null) => {
                        if (el) cellRefs.current.set(cell.item.id, el)
                        else cellRefs.current.delete(cell.item.id)
                      }}
                      role="listitem"
                      tabIndex={cell.item.id === current ? 0 : -1}
                      aria-label={labels.treemapItem(cell.item.name, format(cell.item.value), percent(cell.share), on)}
                      data-slot="treemap-cell"
                      data-highlighted={on || undefined}
                      data-tone={cell.item.tone ?? (on ? 'accent' : undefined)}
                      onFocus={() => setActive(cell.item.id)}
                      layout={!k.reduced}
                      initial={k.reduced ? false : { opacity: 0 }}
                      animate={{ opacity: shown ? 1 : 0 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        layout: k.spring('smooth'),
                        opacity: k.reduced ? { type: false } : { ...k.tween('base', 'enter'), delay: i * k.stagger('tight') },
                      }}
                      style={{ ...cell.style, '--treemap-tone': toneColor(tone), '--treemap-ink': toneInk(tone) } as CSSProperties}
                      className={cn(
                        // Square cells: a data mark, not a tile, so the radius stays at a hair in any theme.
                        'absolute own:flex min-w-0 flex-col items-start gap-0.5 overflow-hidden own:rounded-[min(var(--radius-xs),2px)] border own:px-2.5 own:py-2 own:text-start outline-none',
                        'transition-[background-color,border-color,color] yj-duration-fast ease-standard',
                        'focus-ring focus-visible:z-10 focus-visible:outline-offset-1',
                        on
                          ? [
                              'border-(--treemap-tone) own:text-(--treemap-ink)',
                              // A stronger tint in the dark, where a faint one sinks into the surface.
                              'bg-[color-mix(in_oklab,var(--treemap-tone)_calc(14%_+_14%_*_var(--yj-dark)),transparent)]',
                              'hover:bg-[color-mix(in_oklab,var(--treemap-tone)_calc(19%_+_14%_*_var(--yj-dark)),transparent)]',
                            ]
                          : cell.item.tone
                            ? [
                                'border-[color-mix(in_oklab,var(--treemap-tone)_30%,var(--color-chart-quiet))] bg-[color-mix(in_oklab,var(--treemap-tone)_9%,transparent)]',
                                'hover:bg-[color-mix(in_oklab,var(--treemap-tone)_14%,transparent)]',
                              ]
                            : // A step above whatever surface it sits on, edged at 3:1 so each tile reads as its own mark.
                              'border-(--color-chart-quiet) bg-hover hover:bg-hover',
                      )}
                    />
                  }
                >
                  {cell.room !== 'none' && (
                    <m.span layout={k.reduced ? false : 'position'} data-slot="treemap-cell-label" className="own:flex min-w-0 max-w-full flex-col">
                      <span data-slot="treemap-cell-name" className="truncate own:font-mono own:text-ui-sm">
                        {cell.item.name}
                      </span>
                      {cell.room === 'full' && (
                        <span
                          data-slot="treemap-cell-value"
                          className={cn('truncate own:font-mono own:text-ui-sm own:tabular-nums', on ? 'own:text-current' : 'own:text-fg-muted')}
                        >
                          {format(cell.item.value)}
                        </span>
                      )}
                    </m.span>
                  )}
                </TooltipTrigger>
              )
            })}
          </AnimatePresence>
        </div>
        {largest && (
          <p id={summaryId} data-slot="treemap-summary" className="sr-only">
            {labels.treemapSummary(cells.length, format(total), largest.item.name, percent(largest.share))}
          </p>
        )}
      </div>
      <Tooltip handle={handle}>
        {({ payload }) => {
          const cell = byId(payload as string | undefined)
          return cell ? (
            <TooltipContent data-slot="treemap-tooltip" className="flex-col items-start gap-0.5 own:py-1.5">
              <span data-slot="treemap-tooltip-name">{cell.item.name}</span>
              <span data-slot="treemap-tooltip-value" className="own:font-mono own:font-normal own:tabular-nums opacity-75">
                {format(cell.item.value)} · {labels.shareOfTotal(percent(cell.share))}
              </span>
            </TooltipContent>
          ) : null
        }}
      </Tooltip>
    </MotionFeatures>
  )
}

export { Treemap, type TreemapItem, type TreemapProps, type TreemapTone }
