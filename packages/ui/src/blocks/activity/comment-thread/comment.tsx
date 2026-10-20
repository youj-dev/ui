'use client'

import { useEffect, useId, useRef } from 'react'
import { CircleAlertIcon, LinkIcon, MoreHorizontalIcon, PencilIcon, ReplyIcon, TrashIcon } from '@youj/icons'
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar'
import { Button } from '../../../components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../components/ui/tooltip'
import { cn, initials } from '../../../lib/utils'
import { Composer } from './composer'
import { useDiscussionContext } from './context'
import type { CommentThreadPerson, LiveComment } from './data'
import { CommentBody } from './markdown'
import { ReactionPicker, Reactions } from './reactions'
import { ago, fullDate, toTime } from './time'

export function PersonAvatar({ person, className }: { person: CommentThreadPerson; className?: string }) {
  return (
    <Avatar size="sm" aria-hidden className={className}>
      {person.avatar && <AvatarImage src={person.avatar} alt="" />}
      <AvatarFallback>{initials(person.name)}</AvatarFallback>
    </Avatar>
  )
}

/** The rail from a comment's avatar down to the next row's: solid, or dashed past folded replies. */
export function Rail({ dashed, className }: { dashed?: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      data-slot="thread-rail"
      className={cn('absolute start-3 w-px', dashed ? 'border-s border-dashed border-line' : 'bg-line-subtle', className)}
    />
  )
}

/* One comment: who, when (and whether it was edited), what they said, and
 * the reactions. Its actions (react, reply, the rest in a menu) sit at the
 * end of its first line, shown on hover or focus and always on touch. A
 * comment that just arrived is lit for a moment. Sending, it says so in place
 * of its time; failed, it says why with Retry and Discard. */
export function CommentView({
  comment,
  fresh,
  rail,
  clamp,
  onReply,
}: {
  comment: LiveComment
  fresh?: boolean
  rail?: boolean
  clamp?: boolean
  onReply?: () => void
}) {
  const ctx = useDiscussionContext()
  const { copy, user, locale, now, discussion } = ctx
  const id = useId()
  const article = useRef<HTMLElement>(null)
  const time = toTime(comment.createdAt)
  const own = comment.author.id === user.id
  const editing = discussion.editing === comment.id
  const sending = comment.status === 'sending'
  const failed = comment.status === 'failed'
  const settled = !sending && !failed && !comment.deleted
  const mine = (comment.reactions ?? []).filter((r) => r.by.includes(user.id)).map((r) => r.emoji)
  const react = (emoji: string, on: boolean) => void discussion.actions.react(comment.id, emoji, on)

  // An edit ends inside the field, so focus comes back to the comment instead of the page.
  const wasEditing = useRef(editing)
  useEffect(() => {
    if (wasEditing.current && !editing) article.current?.focus({ preventScroll: true })
    wasEditing.current = editing
  }, [editing])

  return (
    <article
      ref={article}
      id={`comment-${comment.id}`}
      tabIndex={-1}
      aria-labelledby={`${id}-who`}
      aria-describedby={`${id}-when`}
      data-slot="comment"
      data-yj-status={comment.status}
      className={cn(
        'group/comment relative flex gap-2.5 rounded-md outline-none focus-visible:outline-none',
        // A comment that just arrived is lit, then the light fades.
        fresh && 'transition-[background-color] yj-duration-deliberate ease-standard starting:bg-band',
      )}
    >
      {rail && <Rail className="top-7 -bottom-3" />}
      <PersonAvatar person={comment.author} className="relative mt-px" />
      <div className="min-w-0 flex-1">
        <div className="flex min-h-6 items-center gap-1.5">
          <p className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-1.5">
            <span id={`${id}-who`} className="truncate text-ui font-medium text-fg">
              {comment.author.name}
            </span>
            <span id={`${id}-when`} className="text-ui-sm whitespace-nowrap text-fg-muted tabular-nums">
              {sending ? (
                copy.sending
              ) : (
                <time dateTime={new Date(time).toISOString()} title={fullDate(time, locale, now === null)}>
                  {ago(time, now, locale, copy.justNow)}
                </time>
              )}
              {comment.editedAt && !sending && (
                <>
                  <span aria-hidden> · </span>
                  <span title={copy.editedAt(fullDate(toTime(comment.editedAt), locale, now === null))}>{copy.edited}</span>
                </>
              )}
            </span>
          </p>
          {settled && !editing && (
            <div
              role="group"
              aria-label={copy.actions}
              data-slot="comment-actions"
              className={cn(
                // A small bar floating over the comment's top end, so it never takes room from the name and time.
                'absolute -top-1.5 end-0 z-10 flex items-center gap-px rounded-md border border-line bg-overlay p-px shadow-xs transition-opacity yj-duration-fast ease-standard',
                'opacity-0 group-hover/comment:opacity-100 group-focus-within/comment:opacity-100 has-[[aria-expanded=true]]:opacity-100',
                // Touch has no hover: there it sits in the line, always shown.
                'touch:static touch:-my-1 touch:border-0 touch:bg-transparent touch:p-0 touch:opacity-100 touch:shadow-none',
              )}
            >
              <ReactionPicker mine={mine} onPick={react} />
              {onReply && (
                <Tooltip>
                  <TooltipTrigger render={<Button variant="ghost" size="icon-xs" aria-label={copy.reply} onClick={onReply} />}>
                    <ReplyIcon size={14} className="rtl:-scale-x-100" />
                  </TooltipTrigger>
                  <TooltipContent>{copy.reply}</TooltipContent>
                </Tooltip>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" aria-label={copy.more} />}>
                  <MoreHorizontalIcon size={14} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {own && (
                    <DropdownMenuItem onClick={() => discussion.setEditing(comment.id)}>
                      <PencilIcon />
                      {copy.edit}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => ctx.copyLink(comment.id)}>
                    <LinkIcon />
                    {copy.copyLink}
                  </DropdownMenuItem>
                  {own && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="danger" onClick={() => ctx.confirmDelete(comment.id)}>
                        <TrashIcon />
                        {copy.delete}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
        {editing ? (
          <Composer
            people={ctx.people}
            copy={copy}
            label={copy.editLabel}
            placeholder={copy.newPlaceholder}
            submitLabel={copy.save}
            initial={comment.body}
            autoFocus
            onSubmit={(body) => discussion.actions.edit(comment.id, body)}
            onCancel={() => discussion.setEditing(null)}
            className="mt-1"
          />
        ) : comment.deleted ? (
          <p className="text-ui text-fg-muted italic">{copy.deleted}</p>
        ) : (
          <CommentBody source={comment.body} people={ctx.byHandle} me={user.id} clamp={clamp} />
        )}
        {failed && (
          <p role="alert" className="mt-1 flex flex-wrap items-center gap-x-1.5 text-ui-sm text-danger-text">
            <CircleAlertIcon size={13} aria-hidden className="shrink-0" />
            <span>{comment.error && comment.error !== copy.failed ? `${copy.sendFailed} ${comment.error}` : copy.sendFailed}</span>
            <Button variant="link" size="xs" className="h-auto px-0 text-danger-text" onClick={() => discussion.actions.retry(comment.id)}>
              {copy.retry}
            </Button>
            <span aria-hidden>·</span>
            <Button variant="link" size="xs" className="h-auto px-0 text-fg-muted" onClick={() => discussion.actions.discard(comment.id)}>
              {copy.discard}
            </Button>
          </p>
        )}
        {settled && !editing && <Reactions reactions={comment.reactions ?? []} onReact={react} />}
      </div>
    </article>
  )
}
