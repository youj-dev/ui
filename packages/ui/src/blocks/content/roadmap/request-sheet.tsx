'use client'

import { useId, useState } from 'react'
import { PresenceItem, PresenceList } from '@youj/motion'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Badge } from '../../../components/ui/badge'
import { AsyncButton } from '../../../components/ui/async-button'
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../../../components/ui/sheet'
import { Textarea } from '../../../components/ui/textarea'
import { Timeline, type TimelineEvent, type TimelineEventType } from '../../../components/ui/timeline'
import { useRoadmap } from './context'
import { shortDate, STATUS, STATUS_ORDER, type Comment, type RoadmapCopy, type RoadmapRequest } from './data'
import { StatusTag } from './status-tag'
import { VoteButton } from './vote-button'

/* One request in full: its status and category, the vote, what was asked,
 * where it's headed, how it moved through the pipeline (Timeline, one typed
 * mark per status) and the conversation, with a composer whose new comment
 * slides into place. The block keeps the last request while the sheet slides
 * out, so it never blanks mid-exit. */

const types = (copy: RoadmapCopy): Record<string, TimelineEventType> =>
  Object.fromEntries(STATUS_ORDER.map((s) => [s, { icon: STATUS[s].icon, tone: STATUS[s].tone, label: copy.status[s] }]))

function history(r: RoadmapRequest, copy: RoadmapCopy): TimelineEvent[] {
  return r.history.map((step, i) => {
    const status = STATUS_ORDER[i]!
    return {
      id: `${r.id}-${status}`,
      type: status,
      title: i === 0 ? copy.submitted : copy.movedTo(copy.status[status]),
      actor: { name: step.by },
      time: `${step.date}T12:00:00Z`,
      details: step.note,
    }
  })
}

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return ((words[0]?.[0] ?? '') + (words.length > 1 ? (words.at(-1)?.[0] ?? '') : '')).toUpperCase() || '?'
}

function CommentItem({ comment }: { comment: Comment }) {
  const { copy, locale, today } = useRoadmap()
  return (
    <div className="flex gap-3">
      <Avatar size="sm" className="mt-0.5">
        <AvatarFallback>{initials(comment.author)}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="flex flex-wrap items-center gap-x-2 text-ui-sm">
          <span className="font-medium text-fg">{comment.author}</span>
          {comment.team && <Badge variant="default">{copy.team}</Badge>}
          <time dateTime={comment.date} className="text-fg-muted tabular-nums">
            {shortDate(comment.date, locale, today)}
          </time>
        </p>
        <p className="text-ui text-pretty text-fg">{comment.body}</p>
      </div>
    </div>
  )
}

export function RequestSheet({
  request,
  open,
  onOpenChange,
  count,
  voted,
  onVote,
  onComment,
}: {
  request: RoadmapRequest | null
  open: boolean
  onOpenChange: (open: boolean) => void
  count: number
  voted: boolean
  onVote: (voted: boolean) => void
  /** Posts the comment; reject to keep the draft and shake the button. */
  onComment: (body: string) => Promise<unknown> | unknown
}) {
  const ids = useId()
  const { copy, categories, locale, viewer, today } = useRoadmap()
  const [draft, setDraft] = useState('')
  const r = request
  return (
    <Sheet open={open} onOpenChange={onOpenChange} onOpenChangeComplete={(isOpen) => !isOpen && setDraft('')}>
      <SheetContent className="sm:max-w-lg">
        {r && (
          <>
            <SheetHeader>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-ui-sm text-fg-muted">
                <StatusTag status={r.status} />
                <span>{categories[r.category] ?? r.category}</span>
                {r.target && <span className="tabular-nums">{r.status === 'shipped' ? copy.released(r.target) : copy.aiming(r.target)}</span>}
              </div>
              <SheetTitle className="pe-8 text-balance">{r.title}</SheetTitle>
              <SheetDescription>{copy.requestedBy(r.author, shortDate(r.history[0]!.date, locale, today))}</SheetDescription>
            </SheetHeader>
            <SheetBody className="flex flex-col gap-7">
              <div className="flex flex-col gap-3">
                <p className="text-ui text-pretty text-fg">{r.body}</p>
                <div className="flex items-center gap-3">
                  <VoteButton layout="row" title={r.title} count={count} voted={voted} onVote={onVote} />
                  <span className="text-ui-sm text-fg-muted">{voted ? copy.following : copy.follow}</span>
                </div>
              </div>

              <section aria-labelledby={`${ids}-history`} className="flex flex-col gap-3">
                <h3 id={`${ids}-history`} className="text-ui font-semibold text-fg">
                  {copy.history}
                </h3>
                <Timeline events={history(r, copy)} types={types(copy)} />
              </section>

              <section aria-labelledby={`${ids}-comments`} className="flex flex-col gap-4">
                <h3 id={`${ids}-comments`} className="text-ui font-semibold text-fg">
                  {copy.commentsTitle} <span className="font-normal text-fg-muted tabular-nums">{r.comments.length}</span>
                </h3>
                {r.comments.length === 0 ? (
                  <p className="text-ui-sm text-fg-muted">{copy.noComments}</p>
                ) : (
                  <PresenceList className="flex flex-col gap-4">
                    {r.comments.map((comment) => (
                      <PresenceItem key={comment.id}>
                        <CommentItem comment={comment} />
                      </PresenceItem>
                    ))}
                  </PresenceList>
                )}
                <form
                  className="flex flex-col gap-2"
                  onSubmit={(event) => event.preventDefault()}
                  aria-label={copy.commentOn(r.title)}
                >
                  <Textarea
                    aria-label={copy.yourComment}
                    rows={3}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={copy.commentPlaceholder}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-ui-xs text-fg-muted">{copy.postingAs(viewer, shortDate(today, locale, today))}</span>
                    <AsyncButton
                      size="sm"
                      disabled={draft.trim().length === 0}
                      pendingLabel={copy.posting}
                      successLabel={copy.posted}
                      onAction={async () => {
                        await onComment(draft.trim())
                        setDraft('')
                      }}
                    >
                      {copy.comment}
                    </AsyncButton>
                  </div>
                </form>
              </section>
            </SheetBody>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
