'use client'

import { useEffect, useState } from 'react'
import { ContentSwap } from '@youj/motion'
import { Avatar, AvatarFallback, Badge, Button, Skeleton } from '@youj/react'

const MEMBERS = [
  { name: 'Ana Lima', email: 'ana@youj.dev', role: 'Owner', initials: 'AL' },
  { name: 'Jonas Weber', email: 'jonas@youj.dev', role: 'Admin', initials: 'JW' },
  { name: 'Priya Raman', email: 'priya@youj.dev', role: 'Member', initials: 'PR' },
]

const row = 'flex h-16 items-center gap-3 px-4 [&+&]:border-t [&+&]:border-line'

/* Shaped like the rows it stands in for, so nothing shifts when they land. */
function MembersSkeleton() {
  return MEMBERS.map((member) => (
    <div key={member.email} className={row}>
      <Skeleton className="size-8 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-2.5 w-36" />
      </div>
      <Skeleton className="h-5 w-14 rounded-full" />
    </div>
  ))
}

export default function SkeletonDemo() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!loading) return
    const timer = setTimeout(() => setLoading(false), 2200)
    return () => clearTimeout(timer)
  }, [loading])

  return (
    <div className="w-full max-w-md">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-ui-lg font-medium text-fg">Members</p>
        <Button size="sm" variant="outline" onClick={() => setLoading(true)}>
          Reload
        </Button>
      </div>
      {/* ContentSwap sets aria-busy, announces the wait once, and morphs the height between the two. */}
      <ContentSwap
        loading={loading}
        fallback={<MembersSkeleton />}
        loadingLabel="Loading members"
        className="overflow-hidden rounded-xl border border-line bg-surface"
      >
        {MEMBERS.map((member) => (
          <div key={member.email} className={row}>
            <Avatar aria-hidden>
              <AvatarFallback>{member.initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-ui font-medium text-fg">{member.name}</p>
              <p className="truncate text-ui-sm text-fg-muted">{member.email}</p>
            </div>
            <Badge variant="secondary">{member.role}</Badge>
          </div>
        ))}
      </ContentSwap>
    </div>
  )
}
