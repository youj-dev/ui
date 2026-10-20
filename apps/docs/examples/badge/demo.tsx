'use client'

import { AlertTriangleIcon, CheckIcon, ClockIcon, LoaderRingIcon } from '@youj/icons'
import { Badge } from '@youj/react'

const DEPLOYMENTS = [
  { id: 'dpl_8f2k', branch: 'main', message: 'Tighten cache headers', status: 'Ready', variant: 'success', Icon: CheckIcon },
  { id: 'dpl_7h1c', branch: 'feat/pricing', message: 'New pricing page', status: 'Building', variant: 'default', Icon: LoaderRingIcon },
  { id: 'dpl_6a9x', branch: 'fix/og-images', message: 'OG images for blog posts', status: 'Queued', variant: 'secondary', Icon: ClockIcon },
  { id: 'dpl_5b0q', branch: 'chore/deps', message: 'Bump the build image', status: 'Error', variant: 'danger', Icon: AlertTriangleIcon },
] as const

export default function BadgeDemo() {
  return (
    <ul className="w-full max-w-lg divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
      {DEPLOYMENTS.map(({ id, branch, message, status, variant, Icon }) => (
        <li key={id} className="flex items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-ui font-medium text-fg">{message}</p>
            <p className="truncate font-mono text-ui-xs text-fg-muted">
              {branch} · {id}
            </p>
          </div>
          {branch === 'main' && <Badge variant="outline">Production</Badge>}
          {/* The badge carries the state; the row carries the content. */}
          <Badge variant={variant}>
            <Icon />
            {status}
          </Badge>
        </li>
      ))}
    </ul>
  )
}
