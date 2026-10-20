'use client'

import { useState } from 'react'
import { PresenceItem, PresenceList } from '@youj/motion'
import { ArrowUpIcon } from '@youj/icons'

const REQUESTS = [
  { id: 'dark-mode-charts', title: 'Dark mode for embedded charts', votes: 48 },
  { id: 'saml', title: 'SAML single sign-on', votes: 44 },
  { id: 'csv', title: 'Export any table as CSV', votes: 41 },
  { id: 'webhooks', title: 'Retry failed webhooks', votes: 37 },
  { id: 'regions', title: 'Pick a region per project', votes: 35 },
]

export default function PresenceListReorder() {
  const [votes, setVotes] = useState(() => Object.fromEntries(REQUESTS.map((r) => [r.id, r.votes])))
  const [last, setLast] = useState<string>()
  // Sorted on every render: when a vote changes the order, the rows glide to their new slots.
  const ranked = [...REQUESTS].sort((a, b) => votes[b.id]! - votes[a.id]!)

  return (
    <div className="w-full max-w-md rounded-xl border border-line bg-surface p-2">
      <p className="px-2 pb-2 text-xs font-medium text-fg-muted">Feature requests · most wanted first</p>
      <PresenceList as="ol" className="flex flex-col gap-1">
        {ranked.map((request, i) => (
          // The row you voted for rides above the others as it climbs.
          <PresenceItem key={request.id} className={`flex items-center gap-3 rounded-lg bg-surface px-2 py-1.5 ${last === request.id ? 'z-1' : ''}`}>
            <span aria-hidden className="w-4 text-end font-mono text-xs text-fg-muted tabular-nums">{i + 1}</span>
            <span className="min-w-0 flex-1 truncate text-sm text-fg">{request.title}</span>
            <button
              type="button"
              aria-label={`Upvote ${request.title}, ${votes[request.id]} votes`}
              onClick={() => {
                setLast(request.id)
                setVotes((v) => ({ ...v, [request.id]: v[request.id]! + 5 }))
              }}
              className="inline-flex h-8 min-w-14 items-center justify-center gap-1 rounded-md border border-line font-mono text-xs text-fg tabular-nums outline-none transition-colors yj-duration-fast ease-standard hover:border-line-strong hover:bg-raised focus-visible:ring-2 focus-visible:ring-accent"
            >
              <ArrowUpIcon size={13} />
              {votes[request.id]}
            </button>
          </PresenceItem>
        ))}
      </PresenceList>
    </div>
  )
}
