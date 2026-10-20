'use client'

import { useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from 'react'
import { useLocale } from '@youj/core/lib/youj/provider'
import { cn, numberFormat, toneColor } from '../../lib/utils'
import type { ShareBarTone } from './share-bar'

/* How a total splits, as rows: each part's color marker, its name (and a
 * line of detail), its value and its share of the total. It is the key to a
 * ShareBar with the same `parts` above it: both take the chart colors in
 * order, so a row and its segment match without naming tones.
 * - Pointing: hovering a row, or moving focus onto it, makes it the active
 *   part (`onActiveChange`), and the app passes that to the bar's `active` so
 *   the segment lights while the rest quiet. The rows are one tab stop; the
 *   arrow keys, Home and End move between them.
 * - Variants: `rows` on hairlines, the value at the end; `tiles` as small
 *   panels that lead with the value, for counts. `columns={2}` sets the rows
 *   side by side while each column can be 14rem wide.
 * - Semantics: a list; each row reads its name, value and share in order.
 *   The marker is decorative. */

type BreakdownListVariant = 'rows' | 'tiles'

interface BreakdownItem {
  label: ReactNode
  value: number
  /** Default: the chart colors in order, as ShareBar's parts. */
  tone?: ShareBarTone
  /** A muted line under the name: an account number, a source. */
  detail?: ReactNode
}

interface BreakdownListProps extends Omit<ComponentProps<'ul'>, 'children'> {
  items: readonly BreakdownItem[]
  /** What each share is out of. Default: the items' sum. */
  total?: number
  /** Intl.NumberFormat options for the values. */
  format?: Intl.NumberFormatOptions
  /** Default: the YoujProvider locale. */
  locale?: string
  /** `rows` (default) on hairlines, value at the end; `tiles` lead with the value, for counts. */
  variant?: BreakdownListVariant
  /** The marker's shape: a square swatch (default) or a bar the row's height. */
  marker?: 'swatch' | 'bar'
  /** Rows side by side while each column can be 14rem wide. Default 1. */
  columns?: 1 | 2
  /** Show each part's share of the total. Default true. */
  showShare?: boolean
  /** The pointed-at part, controlled. */
  active?: number | null
  /** Called with the row hovered or focused, and `null` when the pointer and focus leave. */
  onActiveChange?: (index: number | null) => void
}

function BreakdownList({
  items,
  total,
  format,
  locale: localeProp,
  variant = 'rows',
  marker = 'swatch',
  columns = 1,
  showShare = true,
  active: activeProp,
  onActiveChange,
  className,
  onPointerLeave,
  onBlur,
  ...props
}: BreakdownListProps) {
  const locale = useLocale(localeProp)
  const [own, setOwn] = useState<number | null>(null)
  const [stop, setStop] = useState(0)
  const rows = useRef<(HTMLLIElement | null)[]>([])
  const active = activeProp === undefined ? own : activeProp
  const whole = total ?? items.reduce((sum, item) => sum + Math.max(0, item.value), 0)
  const value = numberFormat(locale, format)
  const share = (v: number) => {
    const s = whole > 0 ? Math.max(0, v) / whole : 0
    return numberFormat(locale, { style: 'percent', maximumFractionDigits: s > 0 && s < 0.1 ? 1 : 0 }).format(s)
  }
  const point = (index: number | null) => {
    if (index === active) return
    setOwn(index)
    onActiveChange?.(index)
  }
  const tabStop = Math.min(stop, items.length - 1)

  const onKeyDown = (event: KeyboardEvent<HTMLLIElement>, index: number) => {
    const last = items.length - 1
    const next =
      event.key === 'ArrowDown' || event.key === 'ArrowRight'
        ? Math.min(last, index + 1)
        : event.key === 'ArrowUp' || event.key === 'ArrowLeft'
          ? Math.max(0, index - 1)
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : undefined
    if (next === undefined) return
    event.preventDefault()
    rows.current[next]?.focus()
  }

  const tiles = variant === 'tiles'

  return (
    <ul
      data-slot="breakdown-list"
      data-variant={variant}
      className={cn(
        'own:grid min-w-0 grid-cols-1',
        tiles ? 'own:gap-1.5' : 'own:gap-x-6',
        // Two columns while each can be 14rem wide; one below that.
        columns === 2 && 'grid-cols-[repeat(auto-fit,minmax(max(calc(var(--spacing)*56),calc(50%_-_var(--spacing)*3)),1fr))]',
        className,
      )}
      onPointerLeave={(event) => {
        if (!event.currentTarget.contains(document.activeElement)) point(null)
        onPointerLeave?.(event)
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) point(null)
        onBlur?.(event)
      }}
      {...props}
    >
      {items.map((item, i) => {
        const color = toneColor(item.tone ?? `chart-${(i % 5) + 1}`)
        const state = active == null ? undefined : active === i ? 'active' : 'inactive'
        return (
          <li
            key={i}
            ref={(el) => {
              rows.current[i] = el
            }}
            data-slot="breakdown-list-item"
            data-index={i}
            data-state={state}
            tabIndex={i === tabStop ? 0 : -1}
            onPointerEnter={() => point(i)}
            onFocus={() => {
              setStop(i)
              point(i)
            }}
            onKeyDown={(event) => onKeyDown(event, i)}
            className={cn(
              'own:flex min-w-0 items-center own:gap-3 own:text-ui focus-ring',
              'transition-[background-color] yj-duration-fast ease-standard',
              tiles
                ? 'own:rounded-lg own:bg-band own:p-2 own:pe-3 data-[state=active]:bg-selected'
                : cn(
                    'own:-mx-2 own:rounded-md own:px-2 own:py-2.5 data-[state=active]:bg-hover',
                    // Hairlines between rows, inset to the text, hidden under the hover panel.
                    'relative after:absolute after:inset-x-2 after:bottom-0 after:h-(--yj-stroke-width,1px) after:bg-line last:after:hidden data-[state=active]:after:hidden',
                  ),
            )}
          >
            {tiles ? (
              <span aria-hidden data-slot="breakdown-list-marker" className="own:flex size-8 shrink-0 items-center justify-center own:rounded-md own:bg-surface">
                <span className="size-2.5 own:rounded-full" style={{ backgroundColor: color }} />
              </span>
            ) : (
              <span
                aria-hidden
                data-slot="breakdown-list-marker"
                className={cn('shrink-0', marker === 'bar' ? 'own:w-1 self-stretch own:rounded-full' : 'size-2.5 own:rounded-[2px]')}
                style={{ backgroundColor: color }}
              />
            )}
            {tiles ? (
              <span className="own:flex min-w-0 flex-1 items-baseline own:gap-2">
                <span data-slot="breakdown-list-value" className="own:text-ui-lg own:font-medium own:text-fg own:tabular-nums">
                  {value.format(item.value)}
                </span>
                <span data-slot="breakdown-list-label" className="truncate own:text-fg-muted">
                  {item.label}
                </span>
              </span>
            ) : (
              <>
                <span className="own:flex min-w-0 flex-1 flex-col">
                  <span data-slot="breakdown-list-label" className="truncate own:text-fg">
                    {item.label}
                  </span>
                  {item.detail != null && (
                    <span data-slot="breakdown-list-detail" className="truncate own:text-ui-sm own:text-fg-muted">
                      {item.detail}
                    </span>
                  )}
                </span>
                <span data-slot="breakdown-list-value" className="shrink-0 own:font-mono own:font-medium own:text-fg own:tabular-nums">
                  {value.format(item.value)}
                </span>
              </>
            )}
            {showShare && (
              <span data-slot="breakdown-list-share" className="own:w-12 shrink-0 own:text-end own:font-mono own:text-ui-sm own:text-fg-muted own:tabular-nums">
                {share(item.value)}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export { BreakdownList, type BreakdownItem, type BreakdownListProps, type BreakdownListVariant }
