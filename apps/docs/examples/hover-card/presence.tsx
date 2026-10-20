'use client'

import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, HoverCard, HoverCardContent, HoverCardTrigger } from '@youj/react'

const VIEWERS = [
  { handle: 'ana', name: 'Ana Lima', initials: 'AL', role: 'Design', page: '/pricing' },
  { handle: 'kenji', name: 'Kenji Sato', initials: 'KS', role: 'Frontend', page: '/pricing' },
  { handle: 'priya', name: 'Priya Raman', initials: 'PR', role: 'Platform', page: '/docs/deploys' },
]

export default function HoverCardPresence() {
  return (
    <div className="flex w-full max-w-sm items-center justify-between rounded-xl border border-line bg-surface px-4 py-3 shadow-xs">
      <span className="text-ui text-fg-muted">Viewing this preview</span>
      <AvatarGroup>
        {VIEWERS.map((viewer) => (
          <HoverCard key={viewer.handle}>
            {/* The avatar shows initials, so the link carries the person's name. */}
            <HoverCardTrigger href={`#${viewer.handle}`} aria-label={viewer.name} className="rounded-full focus-ring">
              <Avatar className="ring-2 ring-surface">
                <AvatarFallback>{viewer.initials}</AvatarFallback>
                <AvatarBadge />
              </Avatar>
            </HoverCardTrigger>
            <HoverCardContent side="top" className="w-60 flex-row items-center">
              <Avatar size="lg">
                <AvatarFallback>{viewer.initials}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="text-ui font-semibold text-fg">{viewer.name}</span>
                <span className="text-ui-sm text-fg-muted">{viewer.role}</span>
                <span className="truncate font-mono text-ui-sm text-fg-muted">{viewer.page}</span>
              </div>
            </HoverCardContent>
          </HoverCard>
        ))}
        <AvatarGroupCount>
          <span aria-hidden>+2</span>
          <span className="sr-only">and 2 more</span>
        </AvatarGroupCount>
      </AvatarGroup>
    </div>
  )
}
