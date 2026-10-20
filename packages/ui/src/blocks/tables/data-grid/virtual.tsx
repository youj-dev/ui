'use client'

import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, type ReactNode, type RefObject } from 'react'
import type { RowData } from '@tanstack/react-table'
import { defaultRangeExtractor, useVirtualizer, type Range } from '@tanstack/react-virtual'
import type { GridItem } from './body'

export interface GridVirtualHandle {
  scrollToIndex: (index: number, options: { align: 'auto' }) => void
}

/**
 * The lines of a virtualized grid: only those in view (plus overscan) are in
 * the DOM, between spacer rows that keep the scroll height and the native
 * table layout (the sticky header, pinned columns and borders keep working).
 * Lines are measured, so detail panels take their own height. The focused
 * line and the heading of the group in view stay mounted, so focus is never
 * lost and the heading keeps sticking.
 */
export function VirtualBody<TData extends RowData>({
  count,
  itemAt,
  estimate,
  scrollRef,
  headHeight,
  span,
  activeRow,
  groupStartOf,
  handle,
  renderItem,
  onRendered,
  onEndReached,
  className,
  loading,
}: {
  count: number
  itemAt: (index: number) => GridItem<TData> | undefined
  estimate: (index: number) => number
  scrollRef: RefObject<HTMLDivElement | null>
  headHeight: number
  span: number
  activeRow: RefObject<{ row: number }>
  /** The index of the heading of the group a line is in, or -1. */
  groupStartOf: (index: number) => number
  handle: RefObject<GridVirtualHandle | null>
  renderItem: (item: GridItem<TData>, index: number, measure: (el: HTMLElement | null) => void) => ReactNode
  onRendered: () => void
  onEndReached?: () => void
  className?: string
  loading?: boolean
}) {
  const getScrollElement = useCallback(() => scrollRef.current, [scrollRef])
  const getItemKey = useCallback((index: number) => itemAt(index)?.key ?? index, [itemAt])
  const rangeExtractor = useCallback(
    (range: Range) => {
      const indexes = defaultRangeExtractor(range)
      const extra = [activeRow.current.row, groupStartOf(range.startIndex)]
      for (const index of extra) if (index >= 0 && index < range.count && !indexes.includes(index)) indexes.push(index)
      return indexes.sort((a, b) => a - b)
    },
    [activeRow, groupStartOf],
  )
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Virtual's virtualizer changes in place; React Compiler leaves this component as written, which is what it needs
  const virtualizer = useVirtualizer({
    count,
    getScrollElement,
    estimateSize: estimate,
    overscan: 10,
    paddingStart: headHeight,
    scrollPaddingStart: headHeight,
    getItemKey,
    rangeExtractor,
  })
  handle.current = virtualizer
  // The scroll area's ref lands after this body's first layout pass: look again once it has.
  const [, remeasure] = useReducer((n: number) => n + 1, 0)
  useLayoutEffect(() => remeasure(), [])
  useLayoutEffect(() => {
    onRendered()
  })
  const items = virtualizer.getVirtualItems()
  const last = items[items.length - 1]
  const reachedEnd = last !== undefined && last.index >= count - 1
  const endRef = useRef(onEndReached)
  endRef.current = onEndReached
  useEffect(() => {
    if (reachedEnd) endRef.current?.()
  }, [reachedEnd, count])

  const out: ReactNode[] = []
  let cursor = headHeight
  for (const item of items) {
    const line = itemAt(item.index)
    if (!line) continue
    if (item.start > cursor + 0.5)
      out.push(
        <tr key={out.length === 0 ? 'gap-start' : `gap-${item.index}`} aria-hidden>
          <td colSpan={span} style={{ height: item.start - cursor, padding: 0, border: 0 }} />
        </tr>,
      )
    out.push(renderItem(line, item.index, virtualizer.measureElement))
    cursor = Math.max(cursor, item.end)
  }
  const rest = virtualizer.getTotalSize() - cursor
  if (rest > 0.5)
    out.push(
      <tr key="gap-end" aria-hidden>
        <td colSpan={span} style={{ height: rest, padding: 0, border: 0 }} />
      </tr>,
    )
  return (
    <tbody data-loading={loading || undefined} className={className}>
      {out}
    </tbody>
  )
}
