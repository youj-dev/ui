'use client'

import { useCallback, useEffect, useLayoutEffect, type ReactNode, type RefObject } from 'react'
import type { RowData } from '@tanstack/react-table'
import { defaultRangeExtractor, useVirtualizer, type Range } from '@tanstack/react-virtual'
import type { DataTableRow } from '../../../components/ui/data-table'

export interface VirtualHandle {
  scrollToIndex: (index: number, options: { align: 'auto' }) => void
}

/**
 * The rows of a virtualized grid: only the rows in view (plus overscan) are
 * in the DOM, between spacer rows that keep the scroll height and the native
 * table layout (sticky header, pinned columns, borders all keep working).
 * It owns the virtualizer, so a scroll re-renders this body and nothing else.
 * The focused row is held mounted when it scrolls out, so focus is never lost.
 */
export function VirtualRows<TData extends RowData>({
  count,
  rowAt,
  scrollRef,
  rowHeight,
  headHeight,
  span,
  activeRow,
  handle,
  renderRow,
  onRendered,
  className,
  loading,
}: {
  /* The rows arrive as a count and a lookup, not as the array: React's
   * development build diffs array props element by element, which for
   * 10,000 rows costs more than the sort itself. */
  count: number
  /** Stable while the rows are the same: the virtualizer's measurements are keyed on it. */
  rowAt: (index: number) => DataTableRow<TData> | undefined
  scrollRef: RefObject<HTMLDivElement | null>
  rowHeight: number
  headHeight: number
  /** Cells per row, for the spacers' colspan. */
  span: number
  activeRow: RefObject<{ row: number }>
  handle: RefObject<VirtualHandle | null>
  renderRow: (row: DataTableRow<TData>, index: number) => ReactNode
  /** After every commit: keeps the grid's single Tab stop on a mounted cell. */
  onRendered: () => void
  className?: string
  loading?: boolean
}) {
  // Stable callbacks: the virtualizer memoizes its 10k measurements on their
  // identity, so an inline function here would re-measure on every scroll frame.
  const getScrollElement = useCallback(() => scrollRef.current, [scrollRef])
  const estimateSize = useCallback(() => rowHeight, [rowHeight])
  const getItemKey = useCallback((index: number) => rowAt(index)?.id ?? index, [rowAt])
  const rangeExtractor = useCallback(
    (range: Range) => {
      const indexes = defaultRangeExtractor(range)
      const active = activeRow.current.row
      if (active >= 0 && active < range.count && !indexes.includes(active)) {
        indexes.push(active)
        indexes.sort((a, b) => a - b)
      }
      return indexes
    },
    [activeRow],
  )
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Virtual's virtualizer changes in place; React Compiler leaves this component as written, which is what it needs
  const virtualizer = useVirtualizer({
    count,
    getScrollElement,
    estimateSize,
    overscan: 12,
    paddingStart: headHeight,
    scrollPaddingStart: headHeight,
    getItemKey,
    rangeExtractor,
  })
  handle.current = virtualizer
  useEffect(() => {
    virtualizer.measure()
  }, [virtualizer, rowHeight, headHeight])
  useLayoutEffect(() => {
    onRendered()
  })

  const out: ReactNode[] = []
  let cursor = headHeight
  for (const item of virtualizer.getVirtualItems()) {
    const row = rowAt(item.index)
    if (!row) continue
    if (item.start > cursor + 0.5)
      out.push(
        // The leading spacer keeps one key while it grows and shrinks, so scrolling resizes it instead of replacing it.
        <tr key={out.length === 0 ? 'gap-start' : `gap-${item.index}`} aria-hidden>
          <td colSpan={span} style={{ height: item.start - cursor, padding: 0 }} />
        </tr>,
      )
    out.push(renderRow(row, item.index))
    cursor = item.end
  }
  const rest = virtualizer.getTotalSize() - cursor
  if (rest > 0.5)
    out.push(
      <tr key="gap-end" aria-hidden>
        <td colSpan={span} style={{ height: rest, padding: 0 }} />
      </tr>,
    )
  return (
    <tbody data-loading={loading || undefined} className={className}>
      {out}
    </tbody>
  )
}
