'use client'

import { useState } from 'react'
import { LiveCursors, PresenceAvatars, ScrollArea } from '@youj/react'
import { useWalkers, type Walker } from './simulate'

const PEOPLE: Walker[] = [
  { id: 'ada', name: 'Ada', status: 'editing', cx: 0.5, cy: 0.5, rx: 0.42, ry: 0.4, pace: 2, phase: 0 },
  { id: 'lin', name: 'Lin', status: 'viewing', cx: 0.2, cy: 0.2, rx: 0.1, ry: 0.1, pace: 3, phase: 0.2 },
]

export default function LiveCursorsFollow() {
  const users = useWalkers(PEOPLE)
  const [following, setFollowing] = useState<string | null>(null)
  const name = users.find((user) => user.id === following)?.name

  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-ui-sm text-fg-muted">{name ? `Following ${name}` : 'Press an avatar to follow'}</span>
        <PresenceAvatars users={users} following={following} onFollowingChange={setFollowing} />
      </div>
      <div className="rounded-2xl border border-line bg-canvas p-1.5">
        <ScrollArea orientation="both" className="h-72">
        <LiveCursors users={users} following={following} className="h-[1200px] w-[1800px] [background-image:radial-gradient(var(--color-line)_1px,transparent_1px)] [background-size:16px_16px]" />
      </ScrollArea>
      </div>
    </div>
  )
}
