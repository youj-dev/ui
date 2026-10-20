'use client'

import type { KeyboardEvent, ReactNode } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { XIcon } from '@youj/icons/components/youj/icons/x'
import { MotionFeatures } from '@youj/core'
import { Counter } from '@youj/motion'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import { useComponentLabels } from '@youj/core/labels'
import { dataTableBulkBarLabels } from '@youj/core/labels'
import { cn } from '../../../lib/utils'
import { Button } from '../button'

export interface DataTableSelectionBarProps {
  /** How many rows are selected. The bar shows while it's above zero. */
  count: number
  /** Every row the selection could reach (all pages, or the server's total), for "Select all 1,204 orders". */
  total?: number
  /** The page is fully selected and more rows exist beyond it: offer every row. */
  canSelectAll?: boolean
  onSelectAll?: () => void
  /** Clears the selection: the ✕ button, and Escape anywhere in the bar. */
  onClear: () => void
  /** What a row is, plural: "orders". Default "rows". */
  noun?: string
  /** The selection's actions: buttons, a menu, a DataTableConfirmAction. */
  children?: ReactNode
  className?: string
}

/**
 * The actions for a selection, rising from the bottom edge of the table it
 * sits in when the first row is selected and dropping away when the last is
 * cleared. Put it inside the table's frame (a positioned element): it rides a
 * zero-height sticky anchor, so it floats at the bottom of the viewport while
 * a long table scrolls and never shifts the layout when it appears. The count
 * rolls digit by digit, an accent mark echoes the header's checkbox, and
 * "Select all" grows in and out of the bar instead of popping. Escape clears.
 * Reduced motion: it appears and leaves in place, and the count changes
 * without rolling.
 */
export function DataTableSelectionBar({ count, total, canSelectAll = false, onSelectAll, onClear, noun, children, className }: DataTableSelectionBarProps) {
  const k = useYouj()
  const locale = useLocale()
  const labels = useComponentLabels(dataTableBulkBarLabels)
  noun ??= labels.rowsNoun
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClear()
    }
  }
  const offerAll = canSelectAll && onSelectAll !== undefined && total !== undefined
  return (
    <MotionFeatures>
      <div data-slot="data-table-selection-anchor" className="pointer-events-none sticky bottom-0 z-20 h-0">
        <AnimatePresence initial={false}>
          {count > 0 && (
            <m.div
              key="bar"
              role="group"
              aria-label={labels.selectionActions}
              data-slot="data-table-selection-bar"
              onKeyDown={onKeyDown}
              initial={k.reduced ? false : { opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: k.reduced ? { type: false } : k.spring('snappy') }}
              exit={k.reduced ? undefined : { opacity: 0, y: 10, scale: 0.98, transition: k.tween('fast', 'exit') }}
              className={cn(
                'pointer-events-auto absolute inset-x-0 bottom-3 own:mx-auto own:flex w-fit max-w-[calc(100%_-_var(--spacing)*6)] items-center gap-1',
                'own:rounded-xl border border-line own:bg-overlay own:p-1 own:text-fg own:shadow-lg',
                className,
              )}
            >
              <span className="own:flex shrink-0 items-center gap-2 ps-2.5 pe-1.5 own:text-ui whitespace-nowrap">
                {/* The header checkbox's own mark, so the bar reads as the selection it acts on. */}
                <span aria-hidden className="own:grid size-4 place-items-center rounded-[calc(var(--spacing)*1.25)] bg-accent own:text-on-accent">
                  <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round">
                    <path d="M4 8h8" />
                  </svg>
                </span>
                <Counter
                  value={count}
                  from={count}
                  mode="roll"
                  inView={false}
                  duration="fast"
                  ease="standard"
                  className="own:font-medium own:text-fg own:tabular-nums"
                />
                <span className="own:text-fg-muted">{labels.selected}</span>
              </span>
              <AnimatePresence initial={false}>
                {offerAll && (
                  <m.span
                    key="all"
                    className="flex shrink-0 overflow-hidden"
                    initial={k.reduced ? false : { width: 0, opacity: 0 }}
                    animate={{ width: 'auto', opacity: 1, transition: k.reduced ? { type: false } : k.tween('base', 'standard') }}
                    exit={k.reduced ? undefined : { width: 0, opacity: 0, transition: k.tween('fast', 'standard') }}
                  >
                    <Button variant="ghost" size="sm" className="own:text-accent-text own:hover:text-accent-text" onClick={onSelectAll}>
                      {labels.selectAllCount(total.toLocaleString(locale), noun)}
                    </Button>
                  </m.span>
                )}
              </AnimatePresence>
              {children && (
                <>
                  <span aria-hidden className="own:mx-1 h-5 w-px shrink-0 bg-line" />
                  {/* On a narrow screen the actions scroll; the count and Clear always stay in reach. */}
                  <span className="own:-m-1 own:flex min-w-0 items-center gap-1 overflow-x-auto p-1 [scrollbar-width:none]">{children}</span>
                </>
              )}
              <span aria-hidden className="own:mx-1 h-5 w-px shrink-0 bg-line" />
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={labels.clearSelection}
                title={labels.clearSelectionShortcut}
                onClick={onClear}
                className="shrink-0"
              >
                <XIcon />
              </Button>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </MotionFeatures>
  )
}
