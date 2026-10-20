'use client'

import type { ReactNode } from 'react'
import { CircleAlertIcon, MessagePlusIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../../../components/ui/empty'
import { Skeleton } from '../../../components/ui/skeleton'
import { cn } from '../../../lib/utils'
import { Composer } from '../comment-thread/composer'
import { useDiscussionContext } from '../comment-thread/context'
import type { LiveThread } from '../comment-thread/data'
import { ThreadView } from '../comment-thread/thread'
import type { DocCommentsCopy } from './data'

/* The rail's cards: a thread (Comment thread's, so replies, mentions,
 * reactions and the rest work the same), a new comment being written, and
 * the rail's empty state. In the list under the document (narrow), each card
 * quotes the words it's about. */

const shell = 'rounded-lg border bg-surface p-3 shadow-xs outline-none transition-[border-color,box-shadow] yj-duration-fast ease-standard'

function Quote({ text, tone }: { text: string; tone: 'warning' | 'accent' }) {
  return (
    <p
      className={cn(
        'mb-2.5 truncate border-s-2 ps-2 text-ui-sm text-fg-muted @3xl:hidden',
        tone === 'warning' ? 'border-warning-line' : 'border-accent-line',
      )}
    >
      “{text}”
    </p>
  )
}

export function DocCard({
  thread,
  quote,
  active,
  linked,
  onActivate,
  onLink,
}: {
  thread: LiveThread
  quote: string
  active: boolean
  linked: boolean
  onActivate: () => void
  onLink: (id: string | null) => void
}) {
  const copy = useDiscussionContext().copy as DocCommentsCopy
  return (
    <div
      role="group"
      tabIndex={-1}
      aria-label={copy.commentOn(quote)}
      data-slot="doc-comment"
      data-active={active || undefined}
      data-yj-linked={linked || undefined}
      onClick={onActivate}
      onFocus={onActivate}
      onPointerEnter={() => onLink(thread.id)}
      onPointerLeave={() => onLink(null)}
      className={cn(
        shell,
        'border-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
        'data-yj-linked:border-line-strong data-active:border-line-strong data-active:shadow-md',
      )}
    >
      <Quote text={quote} tone="warning" />
      <ThreadView thread={thread} compact={!active} />
    </div>
  )
}

export function DraftCard({ quote, onPost, onCancel }: { quote: string; onPost: (body: string, mentions: string[]) => void; onCancel: () => void }) {
  const ctx = useDiscussionContext()
  const copy = ctx.copy as DocCommentsCopy
  return (
    <div data-slot="doc-comment-draft" className={cn(shell, 'border-accent-line shadow-md')}>
      <Quote text={quote} tone="accent" />
      <Composer
        people={ctx.people}
        copy={copy}
        label={copy.commentOn(quote)}
        placeholder={copy.newThreadPlaceholder}
        submitLabel={copy.send}
        autoFocus
        onSubmit={onPost}
        onCancel={onCancel}
      />
    </div>
  )
}

export function RailEmpty({ copy }: { copy: DocCommentsCopy }) {
  return (
    <li className="flex flex-col items-center gap-1.5 px-4 py-8 text-center">
      <span aria-hidden className="mb-1 grid size-8 place-items-center rounded-full border border-line bg-surface text-fg-muted">
        <MessagePlusIcon size={15} />
      </span>
      <p className="text-ui font-medium text-fg">{copy.emptyTitle}</p>
      <p className="text-ui-sm text-pretty text-fg-muted">{copy.emptyDescription}</p>
    </li>
  )
}

/** The document didn't load: why, and Retry when the app can try again. */
export function DocError({ error, onRetry, copy }: { error: ReactNode; onRetry?: () => void; copy: DocCommentsCopy }) {
  return (
    <Empty className="border-0 py-10">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleAlertIcon />
        </EmptyMedia>
        <EmptyTitle>{copy.errorTitle}</EmptyTitle>
        <EmptyDescription>{error}</EmptyDescription>
      </EmptyHeader>
      {onRetry && (
        <EmptyContent>
          <Button variant="outline" size="sm" onClick={onRetry}>
            {copy.retry}
          </Button>
        </EmptyContent>
      )}
    </Empty>
  )
}

export function DocSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="flex flex-col gap-3 px-(--card-spacing) py-6">
      <Skeleton className="h-4 w-24" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-11/12" />
          <Skeleton className={cn('h-3', i % 2 ? 'w-1/2' : 'w-2/3')} />
        </div>
      ))}
    </div>
  )
}

export function RailSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-3 pt-14 @max-3xl:hidden">
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-16 w-full rounded-lg" />
    </div>
  )
}
