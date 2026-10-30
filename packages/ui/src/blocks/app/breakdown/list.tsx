'use client'

import { useState, type CSSProperties, type KeyboardEvent } from 'react'
import { m } from 'motion/react'
import { MotionFeatures, useYouj } from '@youj/core'
import { ChevronRightIcon } from '@youj/icons'
import { StatDelta } from '../../../components/ui/stat-card'
import { cn, numberFormat } from '../../../lib/utils'
import type { BreakdownCopy } from './data'
import { toneColor } from './donut'
import type { Node } from './tree'

/* The level as a ranked bar list, the ring's words. Each part is a row with
 * its swatch, name, figure, share and change, over a bar as long as it is
 * against the largest; the ring's pointed part and the list's are one, so
 * pointing at either lights both. A part with parts of its own is a button
 * (its chevron says so) that zooms in; a last-level part is a button only
 * when the app listens (`onSelect`). Escape goes up a level. A new level's
 * rows rise in, a step apart; reduced motion swaps them in place. */

interface ListProps {
  focus: Node
  hovered: string | null
  onHover: (key: string | null) => void
  onOpen: (node: Node) => void
  onUp: () => void
  onSelect?: (node: Node) => void
  /** Formats a part's figure. */
  figure: (value: number) => string
  copy: BreakdownCopy
}

/** Whether focus arrived from the keyboard (where `:focus-visible` can't be asked, it did). */
function visible(el: Element) {
  try {
    return el.matches(':focus-visible')
  } catch {
    return true
  }
}

function List({ focus, hovered, onHover, onOpen, onUp, onSelect, figure, copy }: ListProps) {
  const k = useYouj()
  const percent = numberFormat(copy.locale, { style: 'percent', maximumFractionDigits: 1 })
  const top = Math.max(1, ...focus.children.map((c) => c.value))
  const total = focus.children.reduce((t, c) => t + c.value, 0) || 1
  // The first list is there at once; each new level's rows rise in.
  const [settled, setSettled] = useState(focus.key)
  const entering = !k.reduced && settled !== focus.key
  const keys = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !focus.parent) return
    event.preventDefault()
    onUp()
  }

  return (
    <MotionFeatures>
      <ul key={focus.key} aria-label={copy.list(focus.parent ? focus.label : copy.all)} data-slot="breakdown-list" className="flex min-w-0 flex-col gap-0.5" onKeyDown={keys}>
        {focus.children.map((node, i) => {
          const share = node.value / total
          const change = node.previous ? node.value / node.previous - 1 : undefined
          const changeWords = change === undefined || Math.abs(change) < 0.0005 ? '' : (change > 0 ? copy.up : copy.down)(percent.format(Math.abs(change)))
          const opens = node.children.length > 0
          const name = copy.item(node.label, figure(node.value), copy.share(percent.format(share)), changeWords) + (opens ? `. ${copy.drill(node.children.length)}` : '')
          const Row = opens || onSelect ? 'button' : 'div'
          return (
            <m.li
              key={node.key}
              initial={entering ? { opacity: 0, y: 6 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...k.tween('base', 'enter'), delay: i * k.stagger('tight') }}
              onAnimationComplete={() => setSettled(focus.key)}
            >
              <Row
                {...(Row === 'button' ? { type: 'button' as const, onClick: () => (opens ? onOpen(node) : onSelect?.(node)) } : {})}
                aria-label={Row === 'button' ? `${node.label} ${figure(node.value)} ${percent.format(share)}${change !== undefined ? ` ${percent.format(Math.abs(change))}` : ''}, ${name}` : undefined}
                data-yj-key={node.key}
                data-yj-lit={hovered === node.key || undefined}
                className={cn(
                  'group/row relative grid w-full grid-cols-[auto_minmax(0,1fr)_auto_--spacing(12)_--spacing(4)] items-center gap-x-2.5 rounded-md px-2 py-1.5 text-start text-ui-sm outline-hidden',
                  Row === 'button' && 'cursor-pointer focus-ring',
                )}
                style={{ '--tone': toneColor(node.tone), '--share': node.value / top } as CSSProperties}
                onPointerEnter={() => onHover(node.key)}
                onPointerLeave={() => onHover(null)}
                // Keyboard focus lights the part; focus that follows a click doesn't.
                onFocus={(event) => visible(event.currentTarget) && onHover(node.key)}
                onBlur={() => onHover(null)}
              >
                {/* The bar: as long as the part is against the largest, a quiet wash of its colour, stronger when lit. */}
                <span
                  aria-hidden
                  className={cn(
                    'absolute inset-y-0.5 start-0 w-full origin-left scale-x-(--share) rounded-[calc(var(--radius-md)-1px)] rtl:origin-right',
                    'bg-[color-mix(in_oklab,var(--tone)_8%,var(--color-surface))] transition-[background-color] yj-duration-fast ease-standard',
                    'group-data-yj-lit/row:bg-[color-mix(in_oklab,var(--tone)_17%,var(--color-surface))]',
                  )}
                />
                <span aria-hidden className="relative size-2.5 rounded-xs bg-(--tone)" />
                <span className="relative truncate text-fg">{node.label}</span>{' '}
                <span className="relative font-medium text-fg tabular-nums">{figure(node.value)}</span>{' '}
                <span className="relative flex flex-col items-end text-ui-xs leading-tight">
                  <span className="text-fg-muted tabular-nums">{percent.format(share)}</span>{' '}
                  {change !== undefined && <StatDelta value={change} locale={copy.locale} className="text-ui-xs" />}
                </span>
                <span
                  aria-hidden
                  className="relative grid place-items-center text-fg-subtle transition-[color,translate] yj-duration-fast ease-standard group-data-yj-lit/row:translate-x-0.5 group-data-yj-lit/row:text-fg reduced:translate-x-0 rtl:group-data-yj-lit/row:-translate-x-0.5"
                >
                  {opens && <ChevronRightIcon size={14} trigger="none" className="rtl:-scale-x-100" />}
                </span>
              </Row>
            </m.li>
          )
        })}
      </ul>
    </MotionFeatures>
  )
}

export { List }
