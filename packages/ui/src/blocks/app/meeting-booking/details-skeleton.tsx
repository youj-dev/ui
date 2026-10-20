'use client'

import { Skeleton } from '../../../components/ui/skeleton'

function DetailsSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      {[0, 1].map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-control w-full" />
        </div>
      ))}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  )
}

export { DetailsSkeleton }
