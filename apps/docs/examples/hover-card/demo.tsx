'use client'

import { CalendarIcon, CheckCircleIcon, ClockIcon, GitMergeIcon } from '@youj/icons'
import { Avatar, AvatarBadge, AvatarFallback, Badge, HoverCard, HoverCardContent, HoverCardTrigger } from '@youj/react'

const link =
  'rounded-sm font-medium text-fg underline decoration-line-strong underline-offset-3 transition-[text-decoration-color] yj-duration-fast ease-standard hover:decoration-fg data-popup-open:decoration-fg focus-ring'

function PullRequestPreview() {
  return (
    <HoverCard>
      <HoverCardTrigger href="#pull-1284" className={link}>
        #1284
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex items-start gap-2.5">
          <GitMergeIcon size={16} className="mt-0.5 text-accent-text" />
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-ui font-semibold text-fg">Stream search results from the edge</span>
            <span className="text-ui-sm text-fg-muted">youj/web #1284 · merged 12 minutes ago</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">feat/search</Badge>
          <Badge variant="secondary">+412 −96</Badge>
        </div>
        <div className="flex items-center gap-2 border-t border-line pt-3 text-ui-sm text-fg-muted">
          <CheckCircleIcon size={14} className="text-success" />
          14 checks passed
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

function PersonPreview() {
  return (
    <HoverCard>
      <HoverCardTrigger href="#priya" className={link}>
        @priya
      </HoverCardTrigger>
      <HoverCardContent>
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            <AvatarFallback>PR</AvatarFallback>
            <AvatarBadge />
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="text-ui-lg font-semibold text-fg">Priya Raman</span>
            <span className="text-ui-sm text-fg-muted">@priya · Platform lead</span>
          </div>
        </div>
        <p className="text-ui text-fg-muted">Owns deploys, the edge runtime and anything that pages at 3am.</p>
        <div className="flex flex-col gap-1.5 text-ui-sm text-fg-muted">
          <span className="flex items-center gap-2">
            <ClockIcon size={14} /> 14:32 in Lisbon
          </span>
          <span className="flex items-center gap-2">
            <CalendarIcon size={14} /> Joined March 2023
          </span>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

const EARLIER = [
  { who: 'Ana Lima', initials: 'AL', what: 'opened a preview for the new pricing page.', when: 'Preview · 1 hour ago' },
  { who: 'Priya Raman', initials: 'PR', what: 'rotated the analytics key.', when: 'Settings · 3 hours ago' },
]

export default function HoverCardDemo() {
  return (
    <ul aria-label="Activity" className="w-full max-w-md divide-y divide-line rounded-xl border border-line bg-surface shadow-xs">
      <li className="flex gap-3 p-4">
        <Avatar size="sm">
          <AvatarFallback>KS</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-ui leading-6 text-fg-muted">
            <span className="font-medium text-fg">Kenji Sato</span> promoted <PullRequestPreview /> to production.
            Thanks <PersonPreview /> for the review.
          </p>
          <span className="text-ui-sm text-fg-muted">Production · 8 minutes ago</span>
        </div>
      </li>
      {EARLIER.map((item) => (
        <li key={item.who} className="flex gap-3 p-4">
          <Avatar size="sm">
            <AvatarFallback>{item.initials}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-ui leading-6 text-fg-muted">
              <span className="font-medium text-fg">{item.who}</span> {item.what}
            </p>
            <span className="text-ui-sm text-fg-muted">{item.when}</span>
          </div>
        </li>
      ))}
    </ul>
  )
}
