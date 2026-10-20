export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
export function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  return wait(ms)
}

const plural = (n: number, one: string, other: string) => (new Intl.PluralRules('en').select(n) === 'one' ? one : other)

/** Someone who can comment, react and be mentioned. */
export interface CommentThreadPerson {
  id: string
  name: string
  /** What follows @ when they're mentioned: "mara". Default: their id. */
  handle?: string
  /** An image URL for their avatar. Default: their initials. */
  avatar?: string
}

/** One emoji on a comment and who put it there (person ids). */
export interface CommentThreadReaction {
  emoji: string
  by: string[]
}

export interface CommentThreadComment {
  id: string
  author: CommentThreadPerson
  /** The text, in markdown-lite: **bold**, _italic_, ~~strike~~, `code`, [links](https://…), lists, > quotes and @handle mentions. */
  body: string
  createdAt: Date | number | string
  /** When it was last edited; shows "edited". */
  editedAt?: Date | number | string
  reactions?: CommentThreadReaction[]
  /** Deleted while it had replies: shown as a placeholder so the replies keep their context. */
  deleted?: boolean
}

/** A thread: a comment and its replies, in order. */
export interface CommentThreadItem {
  id: string
  /** The first is the thread's own comment; the rest are its replies, oldest first. */
  comments: CommentThreadComment[]
  /** Who resolved it and when. A resolved thread folds to one line. */
  resolved?: { by: CommentThreadPerson; at: Date | number | string } | null
}

/** What the composer sends to `onPost`. */
export interface CommentThreadDraft {
  /** The thread it replies to; null for a new thread. */
  threadId: string | null
  body: string
  /** The ids of the people it @mentions. */
  mentions: string[]
}

/** A comment as the block holds it: sending, or failed with the reason. */
export type LiveComment = CommentThreadComment & { status?: 'sending' | 'failed'; error?: string }
export type LiveThread = Omit<CommentThreadItem, 'comments'> & { comments: LiveComment[] }

/** GitHub's eight. */
export const REACTIONS = ['👍', '👎', '😄', '🎉', '😕', '❤️', '🚀', '👀']

/** Every string the block shows or announces. Pass any of them through `copy` to rewrite or translate it. */
export const DEFAULT_COPY = {
  title: 'Discussion',
  demoData: 'Demo data',
  count: (n: number) => `${n} ${plural(n, 'comment', 'comments')}`,
  participants: 'Participants',
  subscribe: 'Subscribe',
  subscribed: 'Subscribed',
  subscribeHint: 'Get notified about new comments',
  justNow: 'just now',
  edited: 'edited',
  editedAt: (date: string) => `Edited ${date}`,
  sending: 'Sending…',
  sendFailed: 'Couldn’t send.',
  retry: 'Retry',
  discard: 'Discard',
  failed: 'That didn’t go through. Try again.',
  deleted: 'This comment was deleted.',
  /** The composer. */
  newLabel: 'New comment',
  newPlaceholder: 'Leave a comment…',
  replyLabel: 'Reply',
  replyPlaceholder: 'Reply…',
  editLabel: 'Edit comment',
  send: 'Comment',
  sendReply: 'Reply',
  save: 'Save',
  cancel: 'Cancel',
  composerHint: 'Markdown and @mentions. ⌘Enter to send.',
  composerHintOther: 'Markdown and @mentions. Ctrl+Enter to send.',
  formatting: 'Formatting',
  bold: 'Bold',
  italic: 'Italic',
  code: 'Code',
  mention: 'Mention someone',
  mentionList: 'People',
  mentionResults: (n: number) => (n ? `${n} ${plural(n, 'person', 'people')} found. Up and down to choose, Enter to insert.` : 'No one found.'),
  /** A comment's actions. */
  actions: 'Comment actions',
  react: 'Add reaction',
  reply: 'Reply',
  more: 'More',
  edit: 'Edit',
  copyLink: 'Copy link',
  delete: 'Delete',
  resolve: 'Resolve',
  reopen: 'Reopen',
  deleteTitle: 'Delete this comment?',
  deleteDescription: 'It’s removed for everyone. This can’t be undone.',
  deleteConfirm: 'Delete comment',
  resolvedBy: (name: string) => `Resolved by ${name}`,
  showThread: 'Show thread',
  hideThread: 'Hide thread',
  moreReplies: (n: number) => `${n} more ${plural(n, 'reply', 'replies')}`,
  replies: (n: number) => `${n} ${plural(n, 'reply', 'replies')}`,
  /** Emoji names, spoken and shown in tooltips. An emoji without one is read as itself. */
  emojiNames: {
    '👍': 'Thumbs up',
    '👎': 'Thumbs down',
    '😄': 'Laugh',
    '🎉': 'Hooray',
    '😕': 'Confused',
    '❤️': 'Heart',
    '🚀': 'Rocket',
    '👀': 'Eyes',
  } as Record<string, string>,
  reactions: 'Reactions',
  you: 'you',
  others: (n: number) => `${n} ${plural(n, 'other', 'others')}`,
  reactedWith: (names: string, emoji: string) => `${names} reacted with ${emoji}`,
  reactionLabel: (emoji: string, count: number) => `${emoji}, ${count}`,
  typing: (names: string, n: number) => `${names} ${plural(n, 'is', 'are')} typing…`,
  emptyTitle: 'No comments yet',
  emptyDescription: 'Ask a question, share a decision or @mention someone to bring them in.',
  loading: 'Loading comments…',
  errorTitle: 'Comments didn’t load',
  /** Announcements. */
  announceSent: 'Comment sent.',
  announceReply: (name: string) => `New reply from ${name}.`,
  announceComment: (name: string) => `New comment from ${name}.`,
  announceDeleted: 'Comment deleted.',
  announceEdited: 'Comment updated.',
  announceResolved: 'Thread resolved.',
  announceReopened: 'Thread reopened.',
  announceLinkCopied: 'Link copied.',
}

export type CommentThreadCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale its times are written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}

/** The demo's clock, fixed so the server and the browser render the same times; it ticks on once mounted. */
export const DEMO_NOW = Date.UTC(2026, 9, 9, 15, 20)
const MIN = 60_000

export const DEMO_USER: CommentThreadPerson = { id: 'you', name: 'Jordan Diaz', handle: 'jordan' }
export const DEMO_PEOPLE: CommentThreadPerson[] = [
  { id: 'mara', name: 'Mara Okafor', handle: 'mara' },
  { id: 'theo', name: 'Theo Lindqvist', handle: 'theo' },
  { id: 'priya', name: 'Priya Raman', handle: 'priya' },
  { id: 'jonas', name: 'Jonas Weber', handle: 'jonas' },
  { id: 'aiko', name: 'Aiko Tanaka', handle: 'aiko' },
  DEMO_USER,
]
const [MARA, THEO, PRIYA, JONAS] = DEMO_PEOPLE as [CommentThreadPerson, CommentThreadPerson, CommentThreadPerson, CommentThreadPerson]

/** A launch plan's discussion, an hour and a half old at the demo's now. */
export const DEMO_THREADS: CommentThreadItem[] = [
  {
    id: 't-pricing',
    comments: [
      {
        id: 'c-1',
        author: MARA,
        body: 'The **annual column** in the pricing table still shows last year’s discount. @theo can you check it against the [rate card](https://example.com/rate-card) before we send this to legal?',
        createdAt: DEMO_NOW - 94 * MIN,
        reactions: [
          { emoji: '👀', by: ['theo', 'priya'] },
          { emoji: '👍', by: ['you'] },
        ],
      },
      {
        id: 'c-2',
        author: THEO,
        body: 'Good catch. It should be _20%_, not 15%. Fixed in the source sheet, and `pricing.annual` now reads from it.',
        createdAt: DEMO_NOW - 71 * MIN,
        reactions: [{ emoji: '🎉', by: ['mara'] }],
      },
      {
        id: 'c-3',
        author: DEMO_USER,
        body: 'Thanks both. I’ll regenerate the PDF after lunch.',
        createdAt: DEMO_NOW - 66 * MIN,
        editedAt: DEMO_NOW - 64 * MIN,
      },
    ],
  },
  {
    id: 't-launch',
    comments: [
      {
        id: 'c-4',
        author: PRIYA,
        body: 'Proposed order for launch day:\n- Blog post at 9:00\n- Changelog and email at 9:30\n- Social at 10:00\n\nAny objections? @jordan',
        createdAt: DEMO_NOW - 38 * MIN,
        reactions: [{ emoji: '🚀', by: ['mara', 'jonas', 'theo'] }],
      },
    ],
  },
  {
    id: 't-logo',
    resolved: { by: JONAS, at: DEMO_NOW - 22 * MIN },
    comments: [
      {
        id: 'c-5',
        author: JONAS,
        body: 'Partner logos are in the shared drive now, all at 2×.',
        createdAt: DEMO_NOW - 52 * MIN,
      },
      {
        id: 'c-6',
        author: MARA,
        body: 'Perfect, swapped them in.',
        createdAt: DEMO_NOW - 24 * MIN,
      },
    ],
  },
]

/** What happens while the demo is open: someone types, then replies; a reaction lands. */
export type DemoBeat =
  | { after: number; kind: 'typing'; person: CommentThreadPerson; until: number }
  | { after: number; kind: 'reply'; threadId: string; comment: Omit<CommentThreadComment, 'createdAt'> }
  | { after: number; kind: 'react'; commentId: string; emoji: string; personId: string }
  | {
      after: number
      kind: 'thread'
      thread: Omit<CommentThreadItem, 'comments'> & { comments: Omit<CommentThreadComment, 'createdAt'>[] } & Record<string, unknown>
    }

export const DEMO_BEATS: DemoBeat[] = [
  { after: 6000, kind: 'typing', person: MARA, until: 9800 },
  {
    after: 9800,
    kind: 'reply',
    threadId: 't-launch',
    comment: { id: 'live-1', author: MARA, body: 'Works for me. Can we move social to **10:30**? The video export takes a while.' },
  },
  { after: 15000, kind: 'react', commentId: 'live-1', emoji: '👍', personId: 'priya' },
]
