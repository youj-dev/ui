import {
  DEFAULT_COPY as THREAD_COPY,
  DEMO_NOW,
  DEMO_PEOPLE,
  type CommentThreadDraft,
  type CommentThreadItem,
  type CommentThreadPerson,
  type DemoBeat,
} from '../comment-thread/data'

export { DEMO_NOW, DEMO_PEOPLE }
export { DEMO_USER } from '../comment-thread/data'

const plural = (n: number, one: string, other: string) => (new Intl.PluralRules('en').select(n) === 'one' ? one : other)

/** A block of the document: a heading or a paragraph of plain text. */
export interface DocCommentsBlock {
  id: string
  type?: 'heading' | 'paragraph'
  text: string
}

export interface DocCommentsDoc {
  title: string
  blocks: DocCommentsBlock[]
}

/** Where a thread is pinned: a run of characters in one block, `start` to `end` (exclusive). */
export interface DocCommentsAnchor {
  block: string
  start: number
  end: number
}

/** A thread pinned to the words it's about. */
export type DocCommentsThread = CommentThreadItem & { anchor: DocCommentsAnchor }

/** What `onPost` gets: a reply, or a new thread with its anchor. */
export type DocCommentsDraft = CommentThreadDraft & { anchor?: DocCommentsAnchor }

/** Someone with the document open. */
export type DocCommentsViewer = CommentThreadPerson & { presence?: 'online' | 'away' | 'busy' | 'offline' }

/** Every string the block shows or announces, the thread's included. */
export const DEFAULT_COPY = {
  ...THREAD_COPY,
  comments: 'Comments',
  counts: (open: number, resolved: number) => `${open} open${resolved ? ` · ${resolved} resolved` : ''}`,
  showResolved: 'Show resolved',
  viewers: 'Viewing now',
  addComment: 'Comment',
  commentOn: (quote: string) => `Comment on “${quote}”`,
  commentsFrom: (names: string, n: number) => `${n} ${plural(n, 'comment', 'comments')} from ${names}`,
  docHint: 'Select text, then press Comment or ⌘⌥M to comment on it. Alt+Up and Alt+Down move between comments.',
  docHintOther: 'Select text, then press Comment or Ctrl+Alt+M to comment on it. Alt+Up and Alt+Down move between comments.',
  newThreadPlaceholder: 'Add a comment…',
  emptyTitle: 'No comments yet',
  emptyDescription: 'Select a few words and press Comment to start a thread about them.',
  loading: 'Loading the document…',
  errorTitle: 'The document didn’t load',
  retry: 'Retry',
}

export type DocCommentsCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale its times are written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}

/** The run of `phrase` in `text`, as an anchor's offsets. */
const span = (blocks: DocCommentsBlock[], id: string, phrase: string): DocCommentsAnchor => {
  const text = blocks.find((b) => b.id === id)!.text
  const start = text.indexOf(phrase)
  return { block: id, start, end: start + phrase.length }
}

export const DEMO_DOC: DocCommentsDoc = {
  title: 'Q4 pricing launch',
  blocks: [
    { id: 'h-goals', type: 'heading', text: 'Goals' },
    {
      id: 'p-launch',
      text: 'Launch the new pricing to every self-serve workspace on October 21, with annual plans at a 20% discount and a 14-day trial on the Team plan.',
    },
    {
      id: 'p-target',
      text: 'We expect the annual share of new subscriptions to rise from 31% to 40% by the end of the quarter, without lowering conversion from trial to paid.',
    },
    { id: 'h-rollout', type: 'heading', text: 'Rollout' },
    {
      id: 'p-rollout',
      text: 'Existing customers keep their price for twelve months. We email admins two weeks ahead, show an in-app banner on launch day, and publish the changelog at 9:30.',
    },
    { id: 'p-support', text: 'Support gets a macro for price questions and a one-pager that explains the grandfathering rules in plain words.' },
    { id: 'h-risks', type: 'heading', text: 'Risks' },
    {
      id: 'p-risks',
      text: 'Enterprise prospects may read the public annual discount as a ceiling in negotiations, so sales will lead with the Team plan’s limits instead.',
    },
  ],
}

const MIN = 60_000
const [MARA, THEO, PRIYA, JONAS, AIKO, YOU] = DEMO_PEOPLE as [
  CommentThreadPerson,
  CommentThreadPerson,
  CommentThreadPerson,
  CommentThreadPerson,
  CommentThreadPerson,
  CommentThreadPerson,
]
const B = DEMO_DOC.blocks

export const DEMO_THREADS: DocCommentsThread[] = [
  {
    id: 'd-discount',
    anchor: span(B, 'p-launch', '20% discount'),
    comments: [
      {
        id: 'd1',
        author: MARA,
        body: 'Legal wants this as **save 20%**, to match the checkout copy.',
        createdAt: DEMO_NOW - 130 * MIN,
        reactions: [{ emoji: '👍', by: ['theo'] }],
      },
      { id: 'd2', author: THEO, body: 'Done, and I changed the checkout string too.', createdAt: DEMO_NOW - 118 * MIN },
    ],
  },
  {
    id: 'd-target',
    anchor: span(B, 'p-target', 'rise from 31% to 40%'),
    comments: [
      { id: 'd3', author: PRIYA, body: 'Is 40% realistic? The last launch moved it four points.', createdAt: DEMO_NOW - 75 * MIN },
      { id: 'd4', author: YOU, body: 'It’s the stretch goal. The base case is _36%_, I’ll add both.', createdAt: DEMO_NOW - 61 * MIN },
    ],
  },
  {
    id: 'd-banner',
    anchor: span(B, 'p-rollout', 'show an in-app banner on launch day'),
    comments: [
      {
        id: 'd5',
        author: JONAS,
        body: 'The banner should be dismissible per workspace, not per person. @priya can design check?',
        createdAt: DEMO_NOW - 33 * MIN,
      },
    ],
  },
  {
    id: 'd-onepager',
    anchor: span(B, 'p-support', 'a one-pager'),
    resolved: { by: MARA, at: DEMO_NOW - 20 * MIN },
    comments: [{ id: 'd6', author: AIKO, body: 'Draft is in the support folder.', createdAt: DEMO_NOW - 48 * MIN }],
  },
]

export const DEMO_VIEWERS: DocCommentsViewer[] = [
  { ...MARA, presence: 'online' },
  { ...THEO, presence: 'online' },
  { ...PRIYA, presence: 'away' },
]

/** While the demo is open, Theo comments lower down and the rail makes room; then Mara replies. */
export const DEMO_BEATS: DemoBeat[] = [
  {
    after: 7000,
    kind: 'thread',
    thread: {
      id: 'd-limits',
      anchor: span(B, 'p-risks', 'lead with the Team plan’s limits'),
      comments: [{ id: 'live-d1', author: THEO, body: 'Can we get the limits table into the sales deck by Friday?' }],
    },
  },
  { after: 12000, kind: 'reply', threadId: 'd-target', comment: { id: 'live-d2', author: MARA, body: '36% base and 40% stretch works for me.' } },
]

/** An id inside a quoted attribute selector. */
export const quoted = (id: string) => id.replace(/["\\]/g, '\\$&')
/** Where an anchor sits in the document, for sorting threads into reading order. */
export const position = (doc: DocCommentsDoc, anchor: DocCommentsAnchor) => doc.blocks.findIndex((b) => b.id === anchor.block) * 1e6 + anchor.start
