'use client'

import { Avatar, AvatarFallback } from '../../../../components/ui/avatar'
import { buttonVariants } from '../../../../components/ui/button'
import { initials, type Tracked } from '../model'

export function Contacts({ ship }: { ship: Tracked }) {
  const people = [{ name: ship.master, role: `Master, ${ship.vessel}`, email: `bridge.${ship.imo}@harbor.app` }, ship.agent]
  return (
    <ul className="flex flex-col divide-y divide-line rounded-lg border border-line">
      {people.map((p) => (
        <li key={p.email} className="flex items-center gap-3 px-3 py-2.5">
          <Avatar>
            <AvatarFallback>{initials(p.name)}</AvatarFallback>
          </Avatar>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-ui font-medium text-fg">{p.name}</span>
            <span className="truncate text-ui-sm text-fg-muted">{p.role}</span>
          </span>
          <a href={`mailto:${p.email}`} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            Email
          </a>
        </li>
      ))}
    </ul>
  )
}
