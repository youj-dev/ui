'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Collapse, PresenceItem, PresenceList } from '@youj/motion'
import { CheckIcon, ChevronDownIcon, ReplyIcon } from '@youj/icons'
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from '../../../components/ui/avatar'
import { Button } from '../../../components/ui/button'
import { cn, initials } from '../../../lib/utils'
import { CommentView, PersonAvatar, Rail } from './comment'
import { Composer } from './composer'
import { useDiscussionContext } from './context'
import type { LiveComment, LiveThread } from './data'
import { handleOf, plainText } from './markdown'
import { ago, toTime } from './time'

/* A thread: its comment, the replies under it on one rail, and a reply
 * field at the end. Past `collapseAfter` replies the earlier ones fold
 * behind "N more replies" (a dashed stretch of the rail), keeping the last
 * two in view. Resolving folds the whole thread to one line that says who
 * resolved it; it opens again in place (motion's Collapse), with Reopen.
 * Replies drop in and leave with presence; reduced motion: in place. */

function MoreReplies({ hidden, all, onShow }: { hidden: LiveComment[]; all?: boolean; onShow: () => void }) {
  const { copy } = useDiscussionContext()
  const faces = [...new Map(hidden.map((c) => [c.author.id, c.author])).values()].slice(0, 3)
  return (
    <div className="relative flex items-center gap-2.5">
      <Rail dashed className={cn('-top-3', all ? 'bottom-1/2' : '-bottom-3')} />
      <span aria-hidden className="w-6 shrink-0" />
      <button
        type="button"
        onClick={onShow}
        className="-ms-1.5 flex items-center gap-2 rounded-md px-1.5 py-1 text-ui-sm font-medium text-fg-muted transition-colors yj-duration-fast ease-standard hover:bg-hover hover:text-fg focus-ring"
      >
        <AvatarGroup aria-hidden className="-space-x-1.5">
          {faces.map((person) => (
            <Avatar key={person.id} size="sm" className="size-5">
              {person.avatar && <AvatarImage src={person.avatar} alt="" />}
              <AvatarFallback className="text-ui-xs">{initials(person.name)}</AvatarFallback>
            </Avatar>
          ))}
        </AvatarGroup>
        {all ? copy.replies(hidden.length) : copy.moreReplies(hidden.length)}
      </button>
    </div>
  )
}

export interface ThreadViewProps {
  thread: LiveThread
  /** Replies shown before the earlier ones fold away. Default 3. */
  collapseAfter?: number
  /** Opens the reply field at once (a new anchored thread, a thread picked from elsewhere). */
  replying?: boolean
  /** A summary for a list of threads: the first comment (three lines at most), its replies as a count, no reply row. */
  compact?: boolean
  className?: string
}

export function ThreadView({ thread, collapseAfter = 3, replying = false, compact = false, className }: ThreadViewProps) {
  const ctx = useDiscussionContext()
  const { copy, user, discussion, now, locale } = ctx
  const [expanded, setExpanded] = useState(false)
  const [reply, setReply] = useState<{ seed: string; n: number } | null>(replying ? { seed: '', n: 0 } : null)
  const [showResolved, setShowResolved] = useState(false)
  const contentId = useId()
  const replyButton = useRef<HTMLButtonElement>(null)
  const resolved = thread.resolved ?? null
  const [root, ...replies] = thread.comments
  // A reply that's closed hands focus back to the field it came from.
  const wasReplying = useRef(reply !== null)
  useEffect(() => {
    if (wasReplying.current && reply === null) replyButton.current?.focus({ preventScroll: true })
    wasReplying.current = reply !== null
  }, [reply])
  if (!root) return null

  const hidden = compact ? replies : !expanded && replies.length > collapseAfter ? replies.slice(0, -2) : []
  const shown = compact ? [] : hidden.length ? replies.slice(-2) : replies
  const participants = [...new Set(thread.comments.map((c) => c.author.id))]
  const startReply = (to?: LiveComment) =>
    setReply((r) => ({ seed: to && to !== root && to.author.id !== user.id ? `@${handleOf(to.author)} ` : '', n: (r?.n ?? 0) + 1 }))

  return (
    <div data-slot="thread" data-yj-resolved={resolved ? '' : undefined} className={className}>
      {resolved && (
        <button
          type="button"
          aria-expanded={showResolved}
          aria-controls={contentId}
          onClick={() => setShowResolved((open) => !open)}
          className="-mx-1.5 flex w-[calc(100%+var(--spacing)*3)] items-center gap-2.5 rounded-md px-1.5 py-1 text-start transition-colors yj-duration-fast ease-standard hover:bg-hover focus-ring"
        >
          <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-success-subtle text-success-text">
            <CheckIcon size={13} strokeWidth={2.5} />
          </span>
          <span className="min-w-0 flex-1 truncate text-ui-sm text-fg-muted">
            <span className="font-medium text-fg">{copy.resolvedBy(resolved.by.name)}</span>
            <span aria-hidden> · </span>
            {ago(toTime(resolved.at), now, locale, copy.justNow)}
            <span aria-hidden> · </span>
            {root.deleted ? copy.deleted : plainText(root.body, ctx.byHandle)}
          </span>
          <span className="sr-only">{showResolved ? copy.hideThread : copy.showThread}</span>
          <ChevronDownIcon
            aria-hidden
            size={14}
            className={cn('shrink-0 text-fg-muted transition-transform yj-duration-base ease-standard', showResolved && 'rotate-180')}
          />
        </button>
      )}
      <Collapse id={contentId} open={!resolved || showResolved}>
        <div className={cn(resolved && 'pt-3')}>
          <PresenceList as="ol" className="flex flex-col gap-3">
            <PresenceItem key={root.id} className="list-none">
              <CommentView
                comment={root}
                rail={replies.length > 0 || reply !== null}
                clamp={compact}
                onReply={() => startReply()}
                fresh={discussion.fresh.has(root.id)}
              />
            </PresenceItem>
            {hidden.length > 0 && (
              <PresenceItem key="more" className="list-none">
                <MoreReplies hidden={hidden} all={compact} onShow={() => setExpanded(true)} />
              </PresenceItem>
            )}
            {shown.map((comment, i) => (
              <PresenceItem key={comment.id} className="list-none">
                <CommentView
                  comment={comment}
                  rail={i < shown.length - 1 || reply !== null}
                  onReply={() => startReply(comment)}
                  fresh={discussion.fresh.has(comment.id)}
                />
              </PresenceItem>
            ))}
          </PresenceList>
          {compact ? null : reply ? (
            <div data-slot="thread-reply" className="mt-3 flex items-start gap-2.5">
              <PersonAvatar person={user} className="mt-1.5" />
              <Composer
                key={reply.n}
                people={ctx.people}
                copy={copy}
                label={copy.replyLabel}
                placeholder={copy.replyPlaceholder}
                submitLabel={copy.sendReply}
                initial={reply.seed}
                autoFocus
                participants={participants}
                onSubmit={(body, mentions) => discussion.actions.post(thread.id, body, mentions)}
                onCancel={() => setReply(null)}
                className="min-w-0 flex-1"
              />
            </div>
          ) : (
            <div data-slot="thread-reply" className="mt-1.5 flex items-center gap-1 ps-7">
              <Button ref={replyButton} variant="ghost" size="xs" onClick={() => startReply()}>
                <ReplyIcon size={13} className="rtl:-scale-x-100" />
                {copy.reply}
              </Button>
              <Button variant="ghost" size="xs" onClick={() => void discussion.actions.resolve(thread.id, !resolved)}>
                <CheckIcon size={13} />
                {resolved ? copy.reopen : copy.resolve}
              </Button>
            </div>
          )}
        </div>
      </Collapse>
    </div>
  )
}
