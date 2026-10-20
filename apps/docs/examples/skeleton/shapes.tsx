'use client'

import { Skeleton } from '@youj/react'

export default function SkeletonShapes() {
  return (
    // One region waits, so it carries aria-busy. The skeletons themselves are hidden from assistive tech.
    <div aria-busy className="grid w-full max-w-lg gap-4 sm:grid-cols-2">
      <div className="rounded-xl border border-line bg-surface p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="grid flex-1 gap-2">
            <Skeleton className="h-3.5 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        </div>
        <div className="mt-4 grid gap-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-11/12" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </div>
      <div className="rounded-xl border border-line bg-surface p-4">
        <Skeleton className="aspect-video w-full rounded-lg" />
        <div className="mt-4 flex items-center justify-between gap-3">
          <Skeleton className="h-3.5 w-1/2" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </div>
    </div>
  )
}
