'use client'

import type { ReactNode } from 'react'
import { Illustration, type IllustrationSlot } from '@youj/illustrations'
import { AlarmClockIcon, AtSignIcon, BellIcon, CircleAlertIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../../../components/ui/empty'
import { Kbd } from '../../../components/ui/kbd'
import { Skeleton } from '../../../components/ui/skeleton'
import { cn } from '../../../lib/utils'
import type { ActivityInboxCopy, Tab } from './data'

/* The inbox's quieter parts: each tab's empty state (inbox zero gets its
 * picture), the rows' shapes while loading, the error, and the foot: the
 * keys to triage with, or what was just done with its Undo. */

export function InboxEmpty({ tab, copy, illustration }: { tab: Tab; copy: ActivityInboxCopy; illustration?: IllustrationSlot }) {
  const [title, description, icon] =
    tab === 'inbox'
      ? [copy.emptyTitle, copy.emptyDescription, null]
      : tab === 'mentions'
        ? [copy.noMentionsTitle, copy.noMentionsDescription, <AtSignIcon key="icon" />]
        : [copy.noSnoozedTitle, copy.noSnoozedDescription, <AlarmClockIcon key="icon" />]
  return (
    <Empty className="border-0 py-10">
      <EmptyHeader>
        {icon ? (
          <EmptyMedia variant="icon">{icon}</EmptyMedia>
        ) : illustration === null ? (
          <EmptyMedia variant="icon">
            <BellIcon />
          </EmptyMedia>
        ) : (
          <div data-slot="inbox-illustration" className="-mt-2 mb-2 flex justify-center">
            <Illustration scene={illustration} fallback="success" unit={14} />
          </div>
        )}
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export function InboxSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="flex flex-col gap-4 px-(--card-spacing) py-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex flex-1 flex-col gap-2 pt-1">
            <Skeleton className={cn('h-3', i % 2 ? 'w-2/3' : 'w-5/6')} />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function InboxError({ error, copy, onRetry }: { error: ReactNode; copy: ActivityInboxCopy; onRetry?: () => void }) {
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

export function InboxFooter({ copy, undo, onUndo }: { copy: ActivityInboxCopy; undo: string | null; onUndo: () => void }) {
  return (
    <div
      data-slot="inbox-footer"
      className="flex min-h-11 items-center gap-3 border-t border-line bg-band px-(--card-spacing) py-2 text-ui-sm text-fg-muted"
    >
      {undo ? (
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate">{undo}</span>
          <Button variant="link" size="xs" className="ms-auto h-auto shrink-0 px-0" onClick={onUndo}>
            {copy.undo}
          </Button>
        </div>
      ) : (
        <p aria-hidden className="flex flex-wrap items-center gap-x-3 gap-y-1 touch:hidden">
          {(
            [
              [['↑', '↓'], copy.hintMove],
              [['E'], copy.hintDone],
              [['S'], copy.hintSnooze],
              [['R'], copy.hintReply],
              [['U'], copy.hintRead],
            ] as const
          ).map(([keys, label]) => (
            <span key={label} className="inline-flex items-center gap-1">
              {keys.map((key) => (
                <Kbd key={key}>{key}</Kbd>
              ))}
              {label}
            </span>
          ))}
        </p>
      )}
    </div>
  )
}
