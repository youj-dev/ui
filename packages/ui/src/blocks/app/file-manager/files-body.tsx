'use client'

import type { ComponentProps, ReactNode } from 'react'
import { CloudUploadIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../../../components/ui/empty'
import { Skeleton } from '../../../components/ui/skeleton'
import { useFileManager } from './context'
import { FileGrid, FileList } from './file-views'

/** The main pane's body: skeleton tiles while loading, the error, the empty folder or no match, else the files as a grid or a list. */
export function FilesBody({
  loading,
  error,
  onRetry,
  empty,
  query,
  folderName,
  view,
  views,
}: {
  loading: boolean
  error?: ReactNode
  onRetry?: () => void
  empty?: ReactNode
  query: string
  folderName: string
  view: 'grid' | 'list'
  views: ComponentProps<typeof FileGrid>
}) {
  const { copy } = useFileManager()
  if (loading)
    return (
      <div aria-busy className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="aspect-[4/3] rounded-lg" />
        ))}
      </div>
    )
  if (error)
    return (
      <Empty className="h-full">
        <EmptyHeader>
          <EmptyTitle>{copy.errorTitle}</EmptyTitle>
          <EmptyDescription>{error}</EmptyDescription>
        </EmptyHeader>
        {onRetry && (
          <EmptyContent>
            <Button variant="outline" onClick={onRetry}>
              {copy.retry}
            </Button>
          </EmptyContent>
        )}
      </Empty>
    )
  if (views.shown.length === 0 && views.subfolders.length === 0) {
    if (!query && empty !== undefined) return empty
    return (
      <Empty className="h-full">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CloudUploadIcon />
          </EmptyMedia>
          <EmptyTitle>{query ? copy.noMatchTitle : copy.emptyTitle(folderName)}</EmptyTitle>
          <EmptyDescription>{query ? copy.noMatchDescription : copy.emptyDescription}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }
  return view === 'grid' ? <FileGrid {...views} /> : <FileList {...views} />
}
