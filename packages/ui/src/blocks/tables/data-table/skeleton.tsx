'use client'

import type { ReactNode } from 'react'
import { DATA_TABLE_SELECT_COLUMN_ID, type DataTableColumnMeta } from '../../../components/ui/data-table'
import { Skeleton } from '../../../components/ui/skeleton'
import { cn } from '../../../lib/utils'
import { cellBase } from './body'
import { pinStyle, type ColumnLayout } from './head'

const SKELETON_WIDTHS = ['62%', '48%', '78%', '55%', '70%', '40%', '84%', '52%']

/** Placeholder rows shaped like the content: each column's `meta.skeleton`, with widths that vary like real text. */
export function SkeletonRows({
  rows,
  columns,
  metas,
  fillerAt,
}: {
  rows: number
  columns: readonly ColumnLayout[]
  metas: ReadonlyArray<DataTableColumnMeta | undefined>
  fillerAt: number | null
}) {
  return (
    <>
      {Array.from({ length: rows }, (_, r) => {
        const cells: ReactNode[] = columns.map((layout, c) => {
          const shape = layout.id === DATA_TABLE_SELECT_COLUMN_ID ? 'check' : (metas[c]?.skeleton ?? (layout.numeric ? 'number' : 'text'))
          const width = SKELETON_WIDTHS[(r * 3 + c * 5) % SKELETON_WIDTHS.length]
          return (
            <td
              key={layout.id}
              style={pinStyle(layout)}
              className={cn(cellBase, layout.pinned && 'sticky z-1', layout.id === DATA_TABLE_SELECT_COLUMN_ID && 'own:px-0')}
            >
              <SkeletonShape shape={shape} width={width!} align={layout.align} />
            </td>
          )
        })
        if (fillerAt !== null) cells.splice(fillerAt, 0, <td key="__filler" className={cellBase} />)
        return <tr key={r}>{cells}</tr>
      })}
    </>
  )
}

function SkeletonShape({ shape, width, align }: { shape: string; width: string; align: ColumnLayout['align'] }) {
  const justify = align === 'end' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'
  switch (shape) {
    case 'none':
      return null
    case 'check':
      return (
        <span className="own:flex justify-center">
          <Skeleton className="own:size-4 own:rounded-sm" />
        </span>
      )
    case 'avatar':
      return (
        <span className="own:flex items-center gap-2">
          <Skeleton className="own:size-6 shrink-0 own:rounded-full" />
          <Skeleton className="own:h-3 own:rounded-sm" style={{ width }} />
        </span>
      )
    case 'badge':
      return <Skeleton className="own:h-5 own:w-16 own:rounded-full" />
    case 'short':
      return (
        <span className={cn('own:flex', justify)}>
          <Skeleton className="own:h-3 own:w-12 own:rounded-sm" />
        </span>
      )
    case 'number':
      return (
        <span className={cn('own:flex', justify)}>
          <Skeleton className="own:h-3 own:w-16 own:rounded-sm" />
        </span>
      )
    default:
      return (
        <span className={cn('own:flex', justify)}>
          <Skeleton className="own:h-3 own:rounded-sm" style={{ width }} />
        </span>
      )
  }
}
