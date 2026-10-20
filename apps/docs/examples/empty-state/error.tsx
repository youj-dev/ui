'use client'

import { AlertTriangleIcon } from '@youj/icons'
import { AsyncButton, buttonVariants, Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@youj/react'

// The API is down for this demo, so every retry fails after a realistic wait.
const retry = () => new Promise((_, reject) => setTimeout(() => reject(new Error('Gateway timeout')), 1200))

export default function EmptyStateError() {
  return (
    <Empty className="w-full max-w-md border border-line bg-surface">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <AlertTriangleIcon className="text-warning" />
        </EmptyMedia>
        <EmptyTitle>Couldn’t load deployments</EmptyTitle>
        <EmptyDescription>The API timed out after 10 seconds. Your deployments are fine; only this list failed to load.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {/* onAction shows the whole attempt in place: Retrying…, then the outcome. */}
        <AsyncButton variant="outline" onAction={retry} pendingLabel="Retrying…" errorLabel="Still failing">
          Try again
        </AsyncButton>
        {/* Navigation stays a link, dressed as a button. */}
        <a href="#status" className={buttonVariants({ variant: 'ghost' })}>
          View status page
        </a>
      </EmptyContent>
    </Empty>
  )
}
