'use client'

import { GitBranchIcon, GitCommitIcon } from '@youj/icons'
import { Avatar, AvatarFallback, Badge, HoverCard, HoverCardContent, HoverCardTrigger } from '@youj/react'

const DEPLOYS = [
  { sha: '4f2a91c', message: 'Stream search results from the edge', author: 'Priya Raman', initials: 'PR', branch: 'feat/search', age: '2m', files: 12 },
  { sha: '9b1e03d', message: 'Tighten cache headers on /docs', author: 'Kenji Sato', initials: 'KS', branch: 'main', age: '1h', files: 3 },
  { sha: 'c7d42e8', message: 'New pricing page', author: 'Ana Lima', initials: 'AL', branch: 'feat/pricing', age: '3h', files: 21 },
]

export default function HoverCardCommits() {
  return (
    <ul aria-label="Deployments" className="w-full max-w-md divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface shadow-xs">
      {DEPLOYS.map((deploy) => (
        <li key={deploy.sha} className="flex items-center gap-3 px-4 py-3">
          <span className="min-w-0 flex-1 truncate text-ui text-fg">{deploy.message}</span>
          <HoverCard>
            <HoverCardTrigger
              href={`#commit-${deploy.sha}`}
              className="rounded-sm font-mono text-ui-sm text-fg-muted underline-offset-3 hover:text-fg hover:underline data-popup-open:text-fg focus-ring"
            >
              {deploy.sha}
            </HoverCardTrigger>
            {/* A hover card previews; the commit page it links to holds the same facts. */}
            <HoverCardContent side="top" align="end">
              <div className="flex items-start gap-2.5">
                <GitCommitIcon size={16} className="mt-0.5 text-fg-muted" />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-ui font-semibold text-fg">{deploy.message}</span>
                  <span className="font-mono text-ui-sm text-fg-muted">{deploy.sha}</span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2 text-ui-sm text-fg-muted">
                  <Avatar size="sm">
                    <AvatarFallback>{deploy.initials}</AvatarFallback>
                  </Avatar>
                  <span className="truncate">
                    {deploy.author} · {deploy.age} ago
                  </span>
                </span>
                <Badge variant="secondary">
                  <GitBranchIcon /> {deploy.branch}
                </Badge>
              </div>
              <p className="text-ui-sm text-fg-muted">{deploy.files} files changed</p>
            </HoverCardContent>
          </HoverCard>
        </li>
      ))}
    </ul>
  )
}
