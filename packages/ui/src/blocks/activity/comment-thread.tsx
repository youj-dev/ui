'use client'

import { useId, useMemo, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, useYouj, type ThemeInput } from '@youj/core'
import { Collapse, PresenceItem, PresenceList } from '@youj/motion'
import { BellIcon, BellOffIcon, CircleAlertIcon, LoaderDotsIcon, MessageIcon } from '@youj/icons'
import { AvatarStack } from '../../components/ui/avatar-stack'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { ConfirmDialog } from '../../components/ui/alert-dialog'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../../components/ui/empty'
import { Skeleton } from '../../components/ui/skeleton'
import { Toggle } from '../../components/ui/toggle'
import { Tooltip, TooltipContent, TooltipTrigger } from '../../components/ui/tooltip'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { useVisible } from '../../hooks/use-visible'
import { cn, listFormat } from '../../lib/utils'
import { PersonAvatar } from './comment-thread/comment'
import { Composer } from './comment-thread/composer'
import { DiscussionContext, type DiscussionContextValue } from './comment-thread/context'
import {
  DEFAULT_COPY,
  DEMO_BEATS,
  DEMO_NOW,
  DEMO_PEOPLE,
  DEMO_THREADS,
  DEMO_USER,
  REACTIONS,
  type CommentThreadComment,
  type CommentThreadCopy,
  type CommentThreadDraft,
  type CommentThreadItem,
  type CommentThreadPerson,
  type CommentThreadReaction,
} from './comment-thread/data'
import { peopleByHandle } from './comment-thread/markdown'
import { ThreadView } from './comment-thread/thread'
import { useClock } from './comment-thread/time'
import { useDiscussion, type DiscussionHandlers } from './comment-thread/use-discussion'

/* The discussion on a record (an issue, a doc, a deal): threads of a comment
 * and its replies on a rail, written in markdown-lite with @mentions, and
 * the composer at the foot. Everything you do shows at once and settles
 * when your `on…` callback resolves; a rejection takes it back and says
 * why, and a post that fails stays, marked, with Retry and Discard.
 * Reactions pop, threads fold when resolved, replies past three fold behind
 * "N more replies", and someone typing shows above the composer. Without
 * `threads` it runs a demo: Mara types, then replies, and a reaction lands.
 * Keyboard: ⌘/Ctrl+Enter sends, Esc cancels an edit or reply, ↑ in the
 * empty composer edits your last comment, @ mentions (↑ ↓ Enter Tab Esc),
 * ⌘/Ctrl+B, I, E format. Built for the compact density, taken from the
 * page. Reduced motion: comments appear and leave in place, threads fold
 * instantly, reactions don't pop. */

interface CommentThreadProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the card. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (640px at 100% scale). Default false. */
  fill?: boolean
  /** Classes for its parts: `card` holds the block's size (852px tall at 100%; the threads scroll inside it, so replies, reactions, someone typing and a longer draft never resize it). */
  classNames?: { card?: string }
  /** The title's heading level. Default 1, or 2 when `embedded`. */
  headingLevel?: 1 | 2 | 3
  /** Formats its times. Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<CommentThreadCopy>
  /** What the discussion is about, under the title: "Q4 launch plan". */
  subject?: string
  /** The threads, oldest first. Default: a launch plan's discussion, with a reply arriving while it's open (a demo, marked). */
  threads?: CommentThreadItem[]
  /** Who can be @mentioned, and whose reactions are named. Default: the demo's team. */
  people?: CommentThreadPerson[]
  /** The signed-in person: new comments are theirs, and they can edit and delete their own. Default: the demo's Jordan. */
  user?: CommentThreadPerson
  /** People typing right now, from your realtime layer. */
  typing?: CommentThreadPerson[]
  /** The emoji a comment can get. Default: 👍 👎 😄 🎉 😕 ❤️ 🚀 👀. */
  reactions?: string[]
  /** Whether the signed-in person gets notified, when your app owns it; pair with `onSubscribedChange`. */
  subscribed?: boolean
  /** Subscribed at first, when the block owns it. Default true. */
  defaultSubscribed?: boolean
  onSubscribedChange?: (subscribed: boolean) => void
  /** The time the first render shows, which the server and the browser agree on; it ticks on once mounted. Default: the demo's, or the browser's clock with your `threads`. */
  now?: Date | number
  /** Shows the threads' shapes while they load. */
  loading?: boolean
  /** Why the threads didn't load; shows with Retry when `onRetry` is set. */
  error?: ReactNode
  onRetry?: () => void
  /** Shown when there are no threads. Default: a quiet "No comments yet". */
  empty?: ReactNode
  /** Shows a dashed "Demo data" badge while the block runs on its demo threads. Default true. */
  demoMarker?: boolean
  /** A new comment (`threadId` null) or a reply. Resolve with the saved comment (its `id`, `createdAt`) to replace the one shown. */
  onPost?: DiscussionHandlers['onPost']
  onEdit?: DiscussionHandlers['onEdit']
  onDelete?: DiscussionHandlers['onDelete']
  onReact?: DiscussionHandlers['onReact']
  onResolve?: DiscussionHandlers['onResolve']
  /** A comment's Copy link. Default: this page's address with the comment's anchor. */
  onCopyLink?: (commentId: string) => void
  /** More controls at the end of the header, after Subscribe: the host's own actions on the discussion (Resolve, Delete). */
  actions?: ReactNode
}

function CommentThread({
  theme,
  embedded = true,
  fill = false,
  headingLevel,
  locale: localeProp,
  copy: copyProp,
  subject,
  threads: threadsProp,
  people = DEMO_PEOPLE,
  user = DEMO_USER,
  typing = [],
  reactions = REACTIONS,
  subscribed: subscribedProp,
  defaultSubscribed = true,
  onSubscribedChange,
  now: nowProp,
  loading = false,
  error,
  onRetry,
  empty,
  demoMarker = true,
  onPost,
  onEdit,
  onDelete,
  onReact,
  onResolve,
  onCopyLink,
  actions: headerActions,
  classNames,
  className,
  ...rest
}: CommentThreadProps) {
  const locale = useLocale(localeProp ?? copyProp?.locale)
  const copy: CommentThreadCopy = { ...DEFAULT_COPY, ...copyProp, locale }
  const titleId = useId()
  const root = useRef<HTMLElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const k = useYouj()
  const visible = useVisible(root)
  const { announce, announcer } = useAnnouncer()
  const simulated = threadsProp === undefined
  const { now, read } = useClock(nowProp !== undefined ? +nowProp : simulated ? DEMO_NOW : undefined)
  const [subscribed, setSubscribed] = useControllableState(subscribedProp, defaultSubscribed)
  const [deleting, setDeleting] = useState<string | null>(null)
  const afterDelete = useRef<HTMLElement | null>(null)
  const everyone = useMemo(() => (people.some((p) => p.id === user.id) ? people : [...people, user]), [people, user])
  const byHandle = useMemo(() => peopleByHandle(everyone), [everyone])
  const byId = useMemo(() => new Map(everyone.map((p) => [p.id, p])), [everyone])
  const discussion = useDiscussion({
    threads: threadsProp,
    demoThreads: DEMO_THREADS,
    user,
    copy,
    read,
    announce,
    live: simulated && visible && !loading,
    beats: DEMO_BEATS,
    block: 'CommentThread',
    handlers: { onPost, onEdit, onDelete, onReact, onResolve },
  })
  const { threads, actions } = discussion
  const level = headingLevel ?? (embedded ? 2 : 1)
  const Title = (['h1', 'h2', 'h3'] as const)[level - 1]!

  const comments = threads.flatMap((t) => t.comments)
  const count = comments.filter((c) => !c.deleted).length
  const participants = [...new Map(comments.map((c) => [c.author.id, c.author])).values()].map((p) => ({ id: p.id, name: p.name, src: p.avatar }))
  const typists = [...typing, ...discussion.typing].filter((p, i, all) => p.id !== user.id && all.findIndex((q) => q.id === p.id) === i)

  const context: DiscussionContextValue = {
    people: everyone,
    byHandle,
    byId,
    user,
    copy,
    locale,
    now,
    palette: reactions,
    discussion,
    copyLink: (commentId) => {
      if (onCopyLink) onCopyLink(commentId)
      else void navigator.clipboard?.writeText(`${location.href.split('#')[0]}#comment-${commentId}`).catch(() => {})
      announce(copy.announceLinkCopied)
    },
    confirmDelete: setDeleting,
  }

  const editLast = () => {
    const last = comments.filter((c) => c.author.id === user.id && !c.deleted && !c.status).at(-1)
    if (!last) return
    discussion.setEditing(last.id)
    document.getElementById(`comment-${last.id}`)?.scrollIntoView?.({ block: 'nearest' })
  }

  const remove = () => {
    if (!deleting) return
    // Focus lands on a neighbour once the dialog closes: the next comment, the one before, or the composer.
    const item = document.getElementById(`comment-${deleting}`)?.closest('li')
    const near = (item?.nextElementSibling ?? item?.previousElementSibling)?.querySelector<HTMLElement>('[data-slot=comment]')
    afterDelete.current = near ?? root.current?.querySelector<HTMLElement>('[data-slot=card-footer] textarea') ?? null
    void actions.remove(deleting)
  }

  const names = listFormat(locale, { type: 'conjunction' }).format(typists.slice(0, 3).map((p) => p.name.split(' ')[0]!))
  const body = loading ? (
    <div role="status" aria-label={copy.loading} className="flex flex-col gap-5 py-1">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex gap-2.5">
          <Skeleton className="size-6 rounded-full" />
          <div className="flex flex-1 flex-col gap-2 pt-1">
            <Skeleton className="h-3 w-32" />
            <Skeleton className={cn('h-3', i % 2 ? 'w-2/3' : 'w-5/6')} />
          </div>
        </div>
      ))}
    </div>
  ) : error ? (
    <Empty className="border-0 py-8">
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
  ) : threads.length === 0 ? (
    (empty ?? (
      <Empty className="border-0 py-8">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MessageIcon />
          </EmptyMedia>
          <EmptyTitle>{copy.emptyTitle}</EmptyTitle>
          <EmptyDescription>{copy.emptyDescription}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    ))
  ) : (
    <PresenceList as="ol" aria-label={copy.title} className="flex flex-col divide-y divide-line-subtle">
      {threads.map((thread) => (
        <PresenceItem key={thread.id} className="list-none py-4 first:pt-0 last:pb-1">
          <ThreadView thread={thread} />
        </PresenceItem>
      ))}
    </PresenceList>
  )

  const card = (
    // A fixed height: the threads scroll in what the header and the composer leave.
    <Card className={cn('h-213 w-full', !embedded && !fill && 'max-w-160', !embedded && 'shadow-lg', classNames?.card)}>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Title id={titleId}>{copy.title}</Title>
          {simulated && demoMarker && (
            <Badge variant="outline" data-slot="demo-marker" className="border-dashed border-line-strong">
              {copy.demoData}
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="tabular-nums">{subject ? `${subject} · ${copy.count(count)}` : copy.count(count)}</CardDescription>
        <CardAction className="flex items-center gap-2">
          {participants.length > 0 && <AvatarStack users={participants} max={3} size="sm" label={copy.participants} className="max-sm:hidden" />}
          <Tooltip>
            <TooltipTrigger
              render={
                <Toggle
                  variant="outline"
                  size="sm"
                  aria-label={copy.subscribe}
                  pressed={subscribed}
                  onPressedChange={(next) => {
                    setSubscribed(next)
                    onSubscribedChange?.(next)
                  }}
                  className="w-control-sm px-0"
                />
              }
            >
              {subscribed ? <BellIcon size={15} /> : <BellOffIcon size={15} />}
            </TooltipTrigger>
            <TooltipContent>{subscribed ? copy.subscribed : copy.subscribeHint}</TooltipContent>
          </Tooltip>
          {headerActions}
        </CardAction>
      </CardHeader>
      <CardContent ref={list} className="-my-1 flex min-h-0 flex-1 flex-col overflow-y-auto py-1 yj-scrollbar">
        {body}
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-2">
        <Collapse open={typists.length > 0}>
          <p data-slot="typing" className="flex h-5 items-center gap-1.5 text-ui-sm text-fg-muted">
            <LoaderDotsIcon aria-hidden size={18} className="-ms-0.5" />
            {typists.length > 0 && copy.typing(names, typists.length)}
          </p>
        </Collapse>
        <div className="flex items-start gap-2.5">
          <PersonAvatar person={user} className="mt-1.5" />
          <Composer
            people={everyone}
            copy={copy}
            label={copy.newLabel}
            placeholder={copy.newPlaceholder}
            submitLabel={copy.send}
            participants={participants.map((p) => p.id)}
            onSubmit={(text, mentions) => {
              actions.post(null, text, mentions)
              // The new thread lands at the foot of the list: bring it into view.
              requestAnimationFrame(() => list.current?.scrollTo?.({ top: list.current.scrollHeight, behavior: k.reduced ? 'auto' : 'smooth' }))
            }}
            onEditLast={editLast}
            className="min-w-0 flex-1"
          />
        </div>
        {discussion.failure && (
          <p role="alert" className="text-ui-sm text-danger-text">
            {discussion.failure}
          </p>
        )}
      </CardFooter>
      {announcer}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={copy.deleteTitle}
        description={copy.deleteDescription}
        confirmLabel={copy.deleteConfirm}
        cancelLabel={copy.cancel}
        destructive
        onConfirm={remove}
        finalFocus={() => {
          const target = afterDelete.current
          afterDelete.current = null
          return target ?? true
        }}
      />
    </Card>
  )

  const view = (
    <DiscussionContext.Provider value={context}>
      {embedded ? (
        <section ref={root} aria-labelledby={titleId} {...rest} className={cn('w-full', !fill && 'max-w-160', className)}>
          {card}
        </section>
      ) : (
        <main
          ref={root}
          aria-labelledby={titleId}
          {...rest}
          className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}
        >
          {card}
        </main>
      )}
    </DiscussionContext.Provider>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

export {
  CommentThread,
  type CommentThreadProps,
  type CommentThreadCopy,
  type CommentThreadItem,
  type CommentThreadComment,
  type CommentThreadPerson,
  type CommentThreadReaction,
  type CommentThreadDraft,
}
