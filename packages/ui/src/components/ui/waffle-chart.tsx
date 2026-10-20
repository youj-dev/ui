'use client'

import { useId, useMemo, useRef, useState, type ComponentProps, type CSSProperties, type KeyboardEvent } from 'react'
import { useInView } from 'motion/react'
import { useComponentLabels, waffleChartLabels } from '@youj/core/labels'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import { cn, numberFormat, seriesColor } from '../../lib/utils'

/* A whole in countable cells: each cell is one unit (`unit` sets how much),
 * colored by its part, so shares read as areas you could count. Square cells
 * by default, hexagons with `shape="hex"`.
 * - Layout: `rows` fills the grid from the top-start corner, part after part,
 *   row by row; `cluster` gathers the filled cells into a round patch at the
 *   grid's center, each part a wedge of it, with empty cells around. In RTL
 *   the cells mirror (they hold no text).
 * - Legend: each part's swatch, name and share. Hovering or focusing a part
 *   (in the legend, or a cell of it) lights its cells and quiets the rest.
 * - Keyboard: the legend is one tab stop; the arrow keys walk the parts,
 *   Home and End go to the first and last, Escape lets go.
 * - Semantics: a named group described by a summary (how many parts, their
 *   total and the largest); the legend is a list whose items are named with
 *   their value and share. The cells are decorative.
 * - Motion: when it scrolls into view the cells fill in order (along the rows,
 *   or outward from the center for a cluster) over the deliberate token. New
 *   data recolors the cells that change in the same order; lighting a part
 *   fades the others on the fast token.
 * - Reduced motion: drawn in place; changes land at once. */

type WaffleChartTone = 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

interface WaffleChartItem {
  id: string
  name: string
  /** How much of the whole is this part's; it fills `value / unit` cells, rounded. */
  value: number
  /** Default: its color in `config`, else the chart colors in order. */
  tone?: WaffleChartTone
}

interface WaffleChartProps extends Omit<ComponentProps<'div'>, 'children'> {
  items: readonly WaffleChartItem[]
  /** How much one cell counts for. Default 1. */
  unit?: number
  /** Cells across. Default 20. */
  columns?: number
  /** Cells down. Default: enough to hold every filled cell, with room around a cluster. */
  rows?: number
  /** Default 'square'. */
  shape?: 'square' | 'hex'
  /** `rows` fills from the top-start corner, row by row; `cluster` gathers the cells at the center, each part a wedge. Default 'rows'. */
  layout?: 'rows' | 'cluster'
  /** Formats values in the legend's spoken text and the summary. Default: the locale's number format. */
  formatValue?: (value: number) => string
  /** Accessible name of the chart. Default: the labels' "Waffle chart". */
  label?: string
  /** Show the legend under the cells. Default true. */
  legend?: boolean
  /** A ChartConfig shared with your other charts: an item whose id is a key takes its color, so one series matches across chart types. */
  config?: Readonly<Record<string, { color?: string }>>
}

const CHART_TONES: WaffleChartTone[] = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5']
/** A square cell's pitch and size, and a hexagon's circumradius, in viewBox units. */
const PITCH = 10
const SQUARE = 8.4
const HEX_R = PITCH / Math.sqrt(3)
const HEX_SIZE = HEX_R * 0.86

interface Cell {
  x: number
  y: number
  /** The index of the part it belongs to, or -1 if empty. */
  part: number
  /** Its place in the fill order. */
  order: number
}

function WaffleChart({
  items,
  unit = 1,
  columns = 20,
  rows: rowsProp,
  shape = 'square',
  layout = 'rows',
  formatValue,
  label,
  legend = true,
  config,
  className,
  style,
  ...props
}: WaffleChartProps) {
  const k = useYouj()
  const locale = useLocale()
  const labels = useComponentLabels(waffleChartLabels)
  const summaryId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const legendRefs = useRef<(HTMLLIElement | null)[]>([])
  const inView = useInView(rootRef, { once: true, amount: 0.3 })
  const shown = k.reduced || inView
  const [active, setActive] = useState<string>()
  const [focus, setFocus] = useState(0)

  const format = useMemo(() => formatValue ?? numberFormat(locale).format, [formatValue, locale])
  const percent = useMemo(() => {
    const whole = numberFormat(locale, { style: 'percent', maximumFractionDigits: 0 })
    const fine = numberFormat(locale, { style: 'percent', maximumFractionDigits: 1 })
    return (share: number) => (share < 0.1 ? fine : whole).format(share)
  }, [locale])

  const parts = useMemo(
    () =>
      items
        .filter((item) => item.value > 0)
        .map((item, i) => ({
          item,
          tone: item.tone ?? (config?.[item.id]?.color ? undefined : CHART_TONES[i % CHART_TONES.length]),
          color: seriesColor(item.tone, config, item.id, i, 'var(--color-fg)'),
          count: Math.round(item.value / (unit > 0 ? unit : 1)),
        })),
    [items, unit, config],
  )
  const total = parts.reduce((sum, p) => sum + p.item.value, 0)
  const filled = parts.reduce((sum, p) => sum + p.count, 0)
  const cols = Math.max(1, Math.round(columns))
  const rows = Math.max(1, Math.round(rowsProp ?? Math.ceil((layout === 'cluster' ? filled * 1.8 : filled) / cols)), Math.ceil(filled / cols))
  const hex = shape === 'hex'

  const { cells, width, height } = useMemo(() => {
    const stepY = hex ? HEX_R * 1.5 : PITCH
    const grid = Array.from({ length: rows * cols }, (_, i) => {
      const r = Math.floor(i / cols)
      const c = i % cols
      return { x: c * PITCH + PITCH / 2 + (hex && r % 2 ? PITCH / 2 : 0), y: r * stepY + (hex ? HEX_R : PITCH / 2) }
    })
    const width = cols * PITCH + (hex && rows > 1 ? PITCH / 2 : 0)
    const height = hex ? (rows - 1) * stepY + 2 * HEX_R : rows * PITCH
    // Which grid cells fill, in fill order, then which part each one takes.
    if (layout === 'cluster') {
      const cx = width / 2
      const cy = height / 2
      const near = grid
        .map((p, i) => ({ i, d: Math.hypot(p.x - cx, p.y - cy) }))
        .sort((a, b) => a.d - b.d || a.i - b.i)
        .slice(0, filled)
      // Wedges: the patch's cells by angle, clockwise from the top.
      const angle = (i: number) => (Math.atan2(grid[i]!.y - cy, grid[i]!.x - cx) + Math.PI * 2.5) % (Math.PI * 2)
      const byDistance = near.map((n) => n.i)
      const order = [...byDistance].sort((a, b) => angle(a) - angle(b))
      const rank = new Map(byDistance.map((i, n) => [i, n]))
      const partOf = new Map<number, number>()
      let n = 0
      parts.forEach((p, part) => {
        for (let j = 0; j < p.count; j++) partOf.set(order[n++]!, part)
      })
      return {
        width,
        height,
        cells: grid.map((p, i): Cell => ({ ...p, part: partOf.get(i) ?? -1, order: rank.get(i) ?? filled })),
      }
    }
    const bounds: number[] = []
    let sum = 0
    for (const p of parts) bounds.push((sum += p.count))
    return {
      width,
      height,
      cells: grid.map((p, i): Cell => {
        const part = i < filled ? bounds.findIndex((b) => i < b) : -1
        return { ...p, part, order: i }
      }),
    }
  }, [rows, cols, hex, layout, parts, filled])

  const lit = parts.findIndex((p) => p.item.id === active)
  const current = Math.min(focus, Math.max(0, parts.length - 1))
  const largest = parts.reduce<(typeof parts)[number] | undefined>((best, p) => (!best || p.item.value > best.item.value ? p : best), undefined)
  const spread = k.reduced ? 0 : k.ms('deliberate')
  const step = filled ? spread / filled : 0

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    let next = -1
    if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = parts.length - 1
    else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = Math.min(parts.length - 1, current + 1)
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = Math.max(0, current - 1)
    else if (event.key === 'Escape') {
      setActive(undefined)
      return
    } else return
    event.preventDefault()
    setFocus(next)
    legendRefs.current[next]?.focus()
  }

  const hexPath = (x: number, y: number) =>
    `${[-90, -30, 30, 90, 150, 210]
      .map((deg, i) => {
        const a = (deg * Math.PI) / 180
        return `${i ? 'L' : 'M'}${(x + HEX_SIZE * Math.cos(a)).toFixed(2)},${(y + HEX_SIZE * Math.sin(a)).toFixed(2)}`
      })
      .join('')}Z`

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label={label ?? labels.waffleChart}
      aria-describedby={largest ? summaryId : undefined}
      data-slot="waffle-chart"
      className={cn(
        'own:flex w-full min-w-0 flex-col gap-4',
        // An empty cell: a faint ink on light surfaces, recessed to the canvas in the dark.
        '[--waffle-chart-off:color-mix(in_oklab,var(--color-canvas)_calc(100%*var(--yj-dark)),color-mix(in_oklab,var(--color-fg)_7%,transparent))]',
        className,
      )}
      style={style}
      {...props}
    >
      {!largest ? (
        <div
          data-slot="waffle-chart-empty"
          className="own:grid aspect-[2/1] place-items-center own:rounded-md border border-dashed border-line own:text-ui own:text-fg-muted"
        >
          {labels.noData}
        </div>
      ) : (
        <>
          <svg aria-hidden data-slot="waffle-chart-cells" viewBox={`0 0 ${width} ${height}`} className="own:block h-auto w-full rtl:-scale-x-100">
            {cells.map((cell, i) => {
              const part = cell.part >= 0 ? parts[cell.part] : undefined
              const on = shown && part !== undefined
              const quiet = lit >= 0 && cell.part !== lit
              const delay = Math.round(cell.order * step)
              const common = {
                'data-slot': 'waffle-chart-cell',
                'data-state': on ? 'on' : 'off',
                'data-tone': part?.tone,
                onPointerEnter: part ? () => setActive(part.item.id) : undefined,
                onPointerLeave: part ? () => setActive(undefined) : undefined,
                className: cn(
                  !k.reduced && 'transition-[fill,opacity] yj-duration-fast ease-standard',
                  on ? 'fill-(--waffle-chart-tone)' : 'fill-(--waffle-chart-off)',
                  on && quiet && 'opacity-25',
                ),
                style: {
                  '--waffle-chart-tone': part?.color,
                  transitionDelay: delay ? `${delay}ms, 0ms` : undefined, // youj-allow: the fill waits its turn in the deliberate token's wave; the fade for a lit part never waits
                } as CSSProperties,
              }
              return hex ? (
                <path key={i} d={hexPath(cell.x, cell.y)} {...common} />
              ) : (
                <rect key={i} x={cell.x - SQUARE / 2} y={cell.y - SQUARE / 2} width={SQUARE} height={SQUARE} rx={1.4} {...common} />
              )
            })}
          </svg>
          {legend && (
            <ul
              data-slot="waffle-chart-legend"
              className="own:flex flex-wrap gap-x-4 gap-y-2"
              onKeyDown={onKeyDown}
              onBlur={() => setActive(undefined)}
            >
              {parts.map((p, i) => {
                const share = p.item.value / total
                return (
                  <li
                    key={p.item.id}
                    ref={(el) => {
                      legendRefs.current[i] = el
                    }}
                    tabIndex={i === current ? 0 : -1}
                    aria-label={labels.treemapItem(p.item.name, format(p.item.value), percent(share), false)}
                    data-slot="waffle-chart-legend-item"
                    data-active={lit === i || undefined}
                    data-tone={p.tone}
                    onFocus={() => {
                      setFocus(i)
                      setActive(p.item.id)
                    }}
                    onPointerEnter={() => setActive(p.item.id)}
                    onPointerLeave={() => setActive(undefined)}
                    className={cn(
                      'own:flex items-center gap-2 own:rounded-sm own:px-1.5 own:py-0.5 own:text-ui-sm outline-none focus-ring',
                      'transition-[background-color,opacity] yj-duration-fast ease-standard',
                      lit === i && 'bg-band',
                      lit >= 0 && lit !== i && 'opacity-50',
                    )}
                    style={{ '--waffle-chart-tone': p.color } as CSSProperties}
                  >
                    <span
                      aria-hidden
                      data-slot="waffle-chart-swatch"
                      className={cn('size-2.5 shrink-0 bg-(--waffle-chart-tone)', hex ? 'own:rounded-full' : 'own:rounded-xs')}
                    />
                    <span data-slot="waffle-chart-legend-name" className="own:text-fg">
                      {p.item.name}
                    </span>
                    <span data-slot="waffle-chart-legend-share" className="own:font-mono own:text-fg-muted own:tabular-nums">
                      {percent(share)}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
          <p id={summaryId} data-slot="waffle-chart-summary" className="sr-only">
            {labels.treemapSummary(parts.length, format(total), largest.item.name, percent(largest.item.value / total))}
          </p>
        </>
      )}
    </div>
  )
}

export { WaffleChart, type WaffleChartItem, type WaffleChartProps, type WaffleChartTone }
