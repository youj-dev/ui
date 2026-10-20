'use client'

import type { ReactNode } from 'react'
import { Skeleton } from '../../../components/ui/skeleton'
import { cn } from '../../../lib/utils'
import { cellBase } from './body'
import { pinStyle, type GridColumnLayout } from './head'
import { SELECT_COLUMN_ID, type DataGridColumnMeta, type DataGridSkeleton } from './model'

const WIDTHS = ['62%', '48%', '78%', '55%', '70%', '40%', '84%', '52%']

/** Placeholder rows shaped like the content: each column's `meta.skeleton`, with widths that vary like real text. */
export function GridSkeletonRows({
  rows,
  columns,
  metas,
  fillerAt,
  startIndex = 0,
}: {
  rows: number
  columns: readonly GridColumnLayout[]
  metas: ReadonlyArray<DataGridColumnMeta | undefined>
  fillerAt: number | null
  startIndex?: number
}) {
  return (
    <>
      {Array.from({ length: rows }, (_, r) => {
        const cells: ReactNode[] = columns.map((layout, c) => {
          const shape: DataGridSkeleton | 'check' =
            layout.id === SELECT_COLUMN_ID ? 'check' : layout.utility ? 'none' : (metas[c]?.skeleton ?? (layout.numeric ? 'number' : 'text'))
          const width = WIDTHS[(r * 3 + c * 5 + startIndex) % WIDTHS.length]!
          return (
            <td
              key={layout.id}
              style={pinStyle(layout)}
              className={cn(cellBase, layout.pinned && 'sticky z-1', layout.utility && 'own:px-0 own:first:ps-0 own:last:pe-0')}
            >
              <SkeletonShape shape={shape} width={width} align={layout.align} />
            </td>
          )
        })
        if (fillerAt !== null) cells.splice(fillerAt, 0, <td key="__filler" className={cellBase} />)
        return <tr key={`skeleton-${startIndex + r}`}>{cells}</tr>
      })}
    </>
  )
}

function SkeletonShape({ shape, width, align }: { shape: DataGridSkeleton | 'check'; width: string; align: GridColumnLayout['align'] }) {
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
    case 'identity':
      return (
        <span className="own:flex items-center gap-3">
          <Skeleton className="own:size-(--dg-avatar) shrink-0 own:rounded-[30%]" />
          <span className="own:flex min-w-0 flex-1 flex-col gap-1.5">
            <Skeleton className="own:h-3 own:rounded-sm" style={{ width }} />
            <Skeleton className="own:h-2.5 own:w-2/5 own:rounded-sm group-data-[density=compact]/dg:hidden" />
          </span>
        </span>
      )
    case 'badge':
      return <Skeleton className="own:h-5 own:w-20 own:rounded-full" />
    case 'tags':
      return (
        <span className="own:flex gap-1">
          <Skeleton className="own:h-5 own:w-14 own:rounded-full" />
          <Skeleton className="own:h-5 own:w-10 own:rounded-full" />
        </span>
      )
    case 'meter':
      return (
        <span className="own:flex items-center gap-2.5">
          <Skeleton className="own:h-1.5 flex-1 own:rounded-full" />
          <Skeleton className="own:h-3 own:w-9 own:rounded-sm" />
        </span>
      )
    case 'trend':
      return <Skeleton className="own:h-5 own:w-24 own:rounded-sm" />
    case 'people':
      return (
        <span className="own:flex -space-x-1.5">
          <Skeleton className="own:size-6 own:rounded-full" />
          <Skeleton className="own:size-6 own:rounded-full" />
        </span>
      )
    case 'toggle':
      return (
        <span className={cn('own:flex', justify)}>
          <Skeleton className="own:h-3.5 own:w-6 own:rounded-full" />
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
