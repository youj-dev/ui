'use client'

import { AnimatePresence, m } from 'motion/react'
import type { Header, RowData } from '@tanstack/react-table'
import { useYouj } from '@youj/core'
import { cn } from '../../../lib/utils'
import type { DataGridFeatures } from './model'

/**
 * One arrow that turns: up ascending, down descending, on the snappy spring,
 * so a reversal mid-turn continues from where it is. Unsorted, it rests the
 * way a click would sort and shows faintly on hover or focus. With several
 * sorted columns each shows its place in the sort.
 */
export function SortIndicator({ direction, next, index, showIndex }: { direction: false | 'asc' | 'desc'; next: false | 'asc' | 'desc'; index: number; showIndex: boolean }) {
  const k = useYouj()
  const pointing = direction || next || 'asc'
  return (
    <span
      aria-hidden
      data-slot="data-grid-sort-indicator"
      data-direction={direction || undefined}
      className={cn(
        'own:inline-flex shrink-0 items-center gap-0.5 transition-opacity yj-duration-fast ease-standard',
        direction ? 'own:text-fg opacity-100' : 'opacity-0 group-hover/head:opacity-60 group-has-[:focus-visible]/head:opacity-60',
      )}
    >
      <m.svg
        viewBox="0 0 16 16"
        width={13}
        height={13}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={false}
        animate={{ rotate: pointing === 'desc' ? 180 : 0 }}
        transition={k.reduced ? { type: false } : k.spring('snappy')}
      >
        <path d="M8 12.75V3.5M4.25 7.25L8 3.5L11.75 7.25" />
      </m.svg>
      <AnimatePresence initial={false} mode="popLayout">
        {showIndex && direction && (
          <m.span
            key={index}
            className="min-w-[1ch] own:font-mono own:text-ui-xs own:leading-none own:tabular-nums"
            initial={k.reduced ? false : { opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0, transition: k.reduced ? { type: false } : k.tween('fast', 'enter') }}
            exit={k.reduced ? undefined : { opacity: 0, y: -3, transition: k.tween('instant', 'exit') }}
          >
            {index + 1}
          </m.span>
        )}
      </AnimatePresence>
    </span>
  )
}

export function ResizeHandle<TData extends RowData>({ header, resizing }: { header: Header<DataGridFeatures, TData, unknown>; resizing: boolean }) {
  const resize = header.getResizeHandler()
  return (
    <div
      aria-hidden
      data-slot="data-grid-resize-handle"
      data-resizing={resizing || undefined}
      onMouseDown={resize}
      onTouchStart={resize}
      onDoubleClick={() => header.column.resetSize()}
      className={cn(
        'absolute inset-y-0 end-0 z-1 own:w-2 cursor-col-resize touch-none select-none',
        'after:absolute after:inset-y-2.5 after:end-0 after:w-px after:rounded-full own:after:bg-transparent',
        'after:transition-[background-color,width] after:yj-duration-fast after:ease-standard',
        'group-hover/head:after:bg-line-strong hover:after:bg-fg-subtle',
        'data-resizing:after:inset-y-0 data-resizing:after:w-0.5 data-resizing:after:bg-focus',
      )}
    />
  )
}
