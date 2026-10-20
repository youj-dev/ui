'use client'

import { useId, useMemo, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from 'react'
import { ThemeScope, useLocale, useYouj, type ThemeInput } from '@youj/core'
import { Card } from '../../components/ui/card'
import { ConfirmDialog } from '../../components/ui/alert-dialog'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { useVisible } from '../../hooks/use-visible'
import { cn, listFormat } from '../../lib/utils'
import { DiscussionContext, type DiscussionContextValue } from './comment-thread/context'
import { REACTIONS, type CommentThreadPerson } from './comment-thread/data'
import { peopleByHandle } from './comment-thread/markdown'
import { useClock } from './comment-thread/time'
import { useDiscussion, type DiscussionHandlers } from './comment-thread/use-discussion'
import { useApple } from './comment-thread/composer-bar'
import { DocCard, DocError, DocSkeleton, DraftCard, RailEmpty, RailSkeleton } from './doc-comments/cards'
import {
  DEFAULT_COPY,
  DEMO_BEATS,
  DEMO_DOC,
  DEMO_NOW,
  DEMO_PEOPLE,
  DEMO_THREADS,
  DEMO_USER,
  DEMO_VIEWERS,
  position,
  quoted,
  type DocCommentsAnchor,
  type DocCommentsCopy,
  type DocCommentsDoc,
  type DocCommentsDraft,
  type DocCommentsThread,
  type DocCommentsViewer,
} from './doc-comments/data'
import { Document } from './doc-comments/document'
import { AddComment, DocHeader } from './doc-comments/header'
import { Rail } from './doc-comments/rail'
import { useDocSelection } from './doc-comments/use-selection'

/* A document with comments pinned to its words, the way Google Docs does
 * it: highlights in the text, and beside them a rail of threads, each level
 * with its words, the one you're on set right against them and the rest
 * pushed clear (they glide on the CSS spring). Select a few words and press
 * Comment (or ⌘⌥M / Ctrl+Alt+M) to start a thread on them. Pointing at a
 * highlight lights its thread and the other way round; Alt+↑ and Alt+↓ walk
 * the threads in reading order; Esc lets go. Resolved threads leave the text
 * until Show resolved. Who has the document open is in the header. Below
 * 48rem of its own width the rail becomes a list under the document, each
 * thread quoting its words. Every thread works as in Comment thread
 * (replies, mentions, reactions, edit, delete), optimistic through your
 * `on…` callbacks. Without `threads`, a demo: Theo comments further down and
 * the rail makes room, then Mara replies. Reduced motion: cards jump. */

interface DocCommentsProps extends Omit<ComponentProps<'section'>, 'children' | 'title'> {
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`. Default true; `false` draws its own page around it. */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (960px at 100% scale). Default false. */
  fill?: boolean
  /** Classes for its parts: `card` holds the block's size (568px tall at 100%; the document and its comments scroll inside it, so opening, replying and showing resolved threads never resize it). */
  classNames?: { card?: string }
  /** The title's heading level; the document's headings sit one under it. Default 1, or 2 when `embedded`. */
  headingLevel?: 1 | 2 | 3
  locale?: string
  copy?: Partial<DocCommentsCopy>
  /** The document: its title and its blocks of text. Default: a pricing launch brief. */
  doc?: DocCommentsDoc
  /** The threads, each pinned to a run of a block's text. Default: the brief's discussion (a demo, marked). */
  threads?: DocCommentsThread[]
  /** Who can be @mentioned. Default: the demo's team. */
  people?: CommentThreadPerson[]
  /** The signed-in person. Default: the demo's Jordan. */
  user?: CommentThreadPerson
  /** Who has the document open, from your realtime layer. Default: three of the demo's team, with the demo. */
  viewers?: DocCommentsViewer[]
  reactions?: string[]
  /** The thread that's open, when your app owns it (a deep link); pair with `onActiveThreadChange`. */
  activeThread?: string | null
  defaultActiveThread?: string | null
  onActiveThreadChange?: (threadId: string | null) => void
  /** Whether resolved threads show in the text and the rail at first. Default false. */
  defaultShowResolved?: boolean
  now?: Date | number
  loading?: boolean
  error?: ReactNode
  onRetry?: () => void
  demoMarker?: boolean
  /** A reply, or a new thread with its `anchor`. Resolve with the saved comment to replace the one shown. */
  onPost?: (draft: DocCommentsDraft) => ReturnType<NonNullable<DiscussionHandlers['onPost']>>
  onEdit?: DiscussionHandlers['onEdit']
  onDelete?: DiscussionHandlers['onDelete']
  onReact?: DiscussionHandlers['onReact']
  onResolve?: DiscussionHandlers['onResolve']
  onCopyLink?: (commentId: string) => void
}

function DocComments({
  theme,
  embedded = true,
  fill = false,
  headingLevel,
  locale: localeProp,
  copy: copyProp,
  doc = DEMO_DOC,
  threads: threadsProp,
  people = DEMO_PEOPLE,
  user = DEMO_USER,
  viewers,
  reactions = REACTIONS,
  activeThread,
  defaultActiveThread = null,
  onActiveThreadChange,
  defaultShowResolved = false,
  now: nowProp,
  loading = false,
  error,
  onRetry,
  demoMarker = true,
  onPost,
  onEdit,
  onDelete,
  onReact,
  onResolve,
  onCopyLink,
  classNames,
  className,
  ...rest
}: DocCommentsProps) {
  const locale = useLocale(localeProp ?? copyProp?.locale)
  const copy: DocCommentsCopy = { ...DEFAULT_COPY, ...copyProp, locale }
  const k = useYouj()
  const apple = useApple()
  const id = useId()
  const root = useRef<HTMLElement>(null)
  const docRef = useRef<HTMLDivElement>(null)
  const visible = useVisible(root)
  const { announce, announcer } = useAnnouncer()
  const simulated = threadsProp === undefined
  const { now, read } = useClock(nowProp !== undefined ? +nowProp : simulated ? DEMO_NOW : undefined)
  const [active, setActiveState] = useControllableState(activeThread, defaultActiveThread)
  const [linked, setLinked] = useState<string | null>(null)
  const [showResolved, setShowResolved] = useState(defaultShowResolved)
  const [draft, setDraft] = useState<DocCommentsAnchor | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const selection = useDocSelection(docRef, !loading && !draft)
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
    block: 'DocComments',
    handlers: { onPost: onPost as DiscussionHandlers['onPost'], onEdit, onDelete, onReact, onResolve },
  })
  const level = headingLevel ?? (embedded ? 2 : 1)

  const threads = (discussion.threads as DocCommentsThread[])
    .filter((t) => t.anchor && doc.blocks.some((b) => b.id === t.anchor.block))
    .sort((a, b) => position(doc, a.anchor) - position(doc, b.anchor))
  const open = threads.filter((t) => !t.resolved)
  const shown = showResolved ? threads : open
  const quoteOf = (anchor: DocCommentsAnchor) => doc.blocks.find((b) => b.id === anchor.block)?.text.slice(anchor.start, anchor.end) ?? ''

  const setActive = (next: string | null) => {
    setActiveState(next)
    onActiveThreadChange?.(next)
  }
  /** The thread's card takes focus, and its words scroll into view. */
  const focusCard = (threadId: string) => {
    root.current?.querySelector<HTMLElement>(`[data-yj-card="${quoted(threadId)}"] [data-slot=doc-comment]`)?.focus({ preventScroll: true })
    docRef.current
      ?.querySelector(`[data-yj-threads~="${quoted(threadId)}"]`)
      ?.scrollIntoView?.({ block: 'nearest', behavior: k.reduced ? 'auto' : 'smooth' })
  }
  const activate = (threadId: string, focus: boolean) => {
    setActive(threadId)
    if (focus) focusCard(threadId)
  }
  const startDraft = () => {
    if (!selection) return
    setDraft(selection.anchor)
    setActive(null)
    document.getSelection()?.removeAllRanges()
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.altKey && event.code === 'KeyM' && selection) {
      event.preventDefault()
      startDraft()
    } else if (event.altKey && (event.key === 'ArrowDown' || event.key === 'ArrowUp') && shown.length) {
      event.preventDefault()
      const at = shown.findIndex((t) => t.id === active)
      const next =
        shown[
          at === -1 ? (event.key === 'ArrowDown' ? 0 : shown.length - 1) : (at + (event.key === 'ArrowDown' ? 1 : -1) + shown.length) % shown.length
        ]!
      activate(next.id, true)
    } else if (event.key === 'Escape' && (draft || active)) {
      if (draft) setDraft(null)
      else setActive(null)
    }
  }

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

  const cards = [
    ...shown.map((thread) => ({
      id: thread.id,
      at: position(doc, thread.anchor),
      node: (
        <DocCard
          thread={thread}
          quote={quoteOf(thread.anchor)}
          active={active === thread.id}
          linked={linked === thread.id}
          onActivate={() => active !== thread.id && setActive(thread.id)}
          onLink={setLinked}
        />
      ),
    })),
    ...(draft
      ? [
          {
            id: 'draft',
            at: position(doc, draft),
            node: (
              <DraftCard
                quote={quoteOf(draft)}
                onPost={(body, mentions) => {
                  setActive(discussion.actions.post(null, body, mentions, { anchor: draft }))
                  setDraft(null)
                }}
                onCancel={() => setDraft(null)}
              />
            ),
          },
        ]
      : []),
  ].sort((a, b) => a.at - b.at)

  const here = (viewers ?? (simulated ? DEMO_VIEWERS : [])).map((v) => ({ id: v.id, name: v.name, src: v.avatar, presence: v.presence }))
  const describe = (thread: DocCommentsThread) => {
    const names = [...new Set(thread.comments.map((c) => c.author.name))]
    return copy.commentsFrom(listFormat(locale, { type: 'conjunction' }).format(names), thread.comments.length)
  }

  const card = (
    <Card
      className={cn(
        '@container h-142 w-full gap-0 overflow-clip py-0',
        !embedded && !fill && 'max-w-240',
        !embedded && 'shadow-lg',
        classNames?.card,
      )}
    >
      {/* The rail runs the card's full height beside the header and the text, like a document's margin, so a card has room to move up.
       * The card keeps its height: the text and the rail scroll together inside it as threads open, grow or come back. */}
      <div className="grid min-h-0 flex-1 overflow-y-auto yj-scrollbar @3xl:grid-cols-[minmax(0,1fr)_--spacing(76)]">
        <div className="min-w-0">
          <DocHeader
            title={doc.title}
            titleId={`${id}-title`}
            level={level}
            copy={copy}
            demo={simulated && demoMarker}
            open={open.length}
            resolved={threads.length - open.length}
            viewers={here}
            showResolved={showResolved}
            onShowResolvedChange={setShowResolved}
          />
          {loading ? (
            <DocSkeleton label={copy.loading} />
          ) : error ? (
            <DocError error={error} onRetry={onRetry} copy={copy} />
          ) : (
            <div className="relative px-(--card-spacing) py-6">
              <Document
                ref={docRef}
                doc={doc}
                threads={shown.map((t) => ({ id: t.id, anchor: t.anchor, resolved: !!t.resolved }))}
                draft={draft}
                active={active}
                linked={linked}
                describedBy={`${id}-d`}
                headingLevel={Math.min(level + 1, 4) as 2 | 3 | 4}
                onActivate={activate}
                onLink={setLinked}
              />
              {selection && (
                <AddComment selection={selection} label={copy.addComment} shortcut={apple ? 'Meta+Alt+M' : 'Control+Alt+M'} onAdd={startDraft} />
              )}
            </div>
          )}
        </div>
        <aside
          aria-labelledby={`${id}-rail`}
          className="rounded-b-[calc(var(--card-radius)-1px)] border-t border-line bg-band p-3 @3xl:rounded-none @3xl:rounded-e-[calc(var(--card-radius)-1px)] @3xl:border-s @3xl:border-t-0"
        >
          <h3 id={`${id}-rail`} className="sr-only">
            {copy.comments}
          </h3>
          {loading ? (
            <RailSkeleton />
          ) : (
            <Rail cards={cards} active={draft ? 'draft' : active} doc={docRef} label={copy.comments} empty={<RailEmpty copy={copy} />} />
          )}
        </aside>
      </div>
      <div hidden>
        <span id={`${id}-hint`}>{apple ? copy.docHint : copy.docHintOther}</span>
        {shown.map((thread) => (
          <span key={thread.id} id={`${id}-d-${thread.id}`}>
            {describe(thread)}
          </span>
        ))}
      </div>
      {discussion.failure && (
        <p role="alert" className="border-t border-line px-(--card-spacing) py-3 text-ui-sm text-danger-text">
          {discussion.failure}
        </p>
      )}
      {announcer}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(next) => !next && setDeleting(null)}
        title={copy.deleteTitle}
        description={copy.deleteDescription}
        confirmLabel={copy.deleteConfirm}
        cancelLabel={copy.cancel}
        destructive
        onConfirm={() => deleting && void discussion.actions.remove(deleting)}
      />
    </Card>
  )

  const view = (
    <DiscussionContext.Provider value={context}>
      {embedded ? (
        <section
          ref={root}
          aria-labelledby={`${id}-title`}
          aria-describedby={`${id}-hint`}
          onKeyDown={onKeyDown}
          {...rest}
          className={cn('w-full', !fill && 'max-w-240', className)}
        >
          {card}
        </section>
      ) : (
        <main
          ref={root}
          aria-labelledby={`${id}-title`}
          aria-describedby={`${id}-hint`}
          onKeyDown={onKeyDown}
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
  DocComments,
  type DocCommentsProps,
  type DocCommentsCopy,
  type DocCommentsDoc,
  type DocCommentsThread,
  type DocCommentsAnchor,
  type DocCommentsDraft,
  type DocCommentsViewer,
}
