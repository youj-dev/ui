import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { CommentThread, type CommentThreadItem, type CommentThreadPerson } from './comment-thread'

const meta: Meta<typeof CommentThread> = {
  title: 'Blocks/Activity/Comment thread',
  component: CommentThread,
  // The gallery's picture: the demo discussion, without its Demo data badge.
  args: { demoMarker: false, subject: 'Q4 launch plan' },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'The discussion on a record: threads with replies, @mentions with autocomplete, reactions, edit and delete, resolve, and an optimistic composer with markdown-lite and keyboard shortcuts.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof CommentThread>

/** The demo: Mara starts typing a few seconds in, then replies, and a reaction lands. Try @ in the composer, ⌘Enter to send and ↑ to edit your last comment. */
export const Default: Story = {}

/** Nothing said yet: the composer and a quiet line. */
export const Empty: Story = { args: { threads: [] } }

/** While the threads load. */
export const Loading: Story = { args: { threads: [], loading: true } }

/** Offline: a comment that can't be sent stays, marked, with Retry and Discard. */
export const SendFails: Story = {
  name: 'Send fails',
  args: { onPost: () => Promise.reject(new Error('You’re offline.')) },
}

/** On a page of its own: `embedded={false}` draws the centered canvas and the page's `h1` around it. */
export const Standalone: Story = { args: { embedded: false } }

const ADA: CommentThreadPerson = { id: 'ada', name: 'Ada Brennan', handle: 'ada' }
const LUCA: CommentThreadPerson = { id: 'luca', name: 'Luca Moretti', handle: 'luca' }
const SAM: CommentThreadPerson = { id: 'sam', name: 'Sam Okoye', handle: 'sam' }
const NOW = Date.UTC(2026, 9, 2, 10, 0)
const MIN = 60_000

const THREADS: CommentThreadItem[] = [
  {
    id: 'q1',
    comments: [
      {
        id: 'q1-1',
        author: LUCA,
        body: 'Customer says the **export** times out above 50k rows. Repro attached, `export.csv` dies at ~38s.',
        createdAt: NOW - 180 * MIN,
        reactions: [{ emoji: '👀', by: ['ada'] }],
      },
      {
        id: 'q1-2',
        author: ADA,
        body: 'The query planner skips the index on `created_at`. @sam can you look before the release?',
        createdAt: NOW - 150 * MIN,
      },
      {
        id: 'q1-3',
        author: SAM,
        body: 'On it. Streaming the rows fixes it locally: 52k rows in 4s.',
        createdAt: NOW - 95 * MIN,
        reactions: [{ emoji: '🚀', by: ['ada', 'luca'] }],
      },
      { id: 'q1-4', author: LUCA, body: 'Confirmed on staging 👍', createdAt: NOW - 40 * MIN },
      { id: 'q1-5', author: ADA, body: 'Shipping it with 4.12.', createdAt: NOW - 12 * MIN },
    ],
  },
]

/** A support ticket's thread: your own people, threads, words and time, with every action wired. Replies past three fold away. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    subject: 'Ticket #4821 · Export times out',
    threads: THREADS,
    people: [ADA, LUCA, SAM],
    user: ADA,
    now: NOW,
    copy: { title: 'Internal notes', newPlaceholder: 'Add a note for the team…', send: 'Add note' },
    onPost: fn(),
    onEdit: fn(),
    onDelete: fn(),
    onReact: fn(),
    onResolve: fn(),
    onSubscribedChange: fn(),
    onCopyLink: fn(),
  },
}

const REVIEWER: CommentThreadPerson = { id: 'noor', name: 'Noor Haddad', handle: 'noor' }
const AUTHOR: CommentThreadPerson = { id: 'kai', name: 'Kai Brandt', handle: 'kai' }

/** Dev: a review on a code change, with the author replying and a suggestion taken. */
export const PullRequestReview: Story = {
  name: 'Pull request review',
  args: {
    subject: 'PR #482 · Stream CSV exports',
    threads: [
      {
        id: 'pr1',
        comments: [
          {
            id: 'pr1-1',
            author: REVIEWER,
            body: 'Should `flush()` run after every row? On 50k rows that is 50k syscalls. @kai could we batch by 500?',
            createdAt: NOW - 75 * MIN,
          },
          {
            id: 'pr1-2',
            author: AUTHOR,
            body: 'Good catch. Batching by **500** cuts the export from 9s to 2s.',
            createdAt: NOW - 40 * MIN,
            reactions: [{ emoji: '🚀', by: ['noor'] }],
          },
          {
            id: 'pr1-3',
            author: REVIEWER,
            body: 'Approved once the benchmark is in the description.',
            createdAt: NOW - 18 * MIN,
            reactions: [{ emoji: '👍', by: ['kai'] }],
          },
        ],
      },
      {
        id: 'pr2',
        resolved: { by: AUTHOR, at: NOW - 30 * MIN },
        comments: [{ id: 'pr2-1', author: REVIEWER, body: 'Nit: rename `rows2` to `pending`.', createdAt: NOW - 110 * MIN }],
      },
    ],
    people: [AUTHOR, REVIEWER],
    user: AUTHOR,
    now: NOW,
    demoMarker: false,
    copy: { title: 'Review', newPlaceholder: 'Leave a review comment…', send: 'Comment' },
  },
}

const COOK: CommentThreadPerson = { id: 'rosa', name: 'Rosa Alvarez', handle: 'rosa' }
const BAKER: CommentThreadPerson = { id: 'dev', name: 'Devika Rao', handle: 'devika' }
const NEIGHBOR: CommentThreadPerson = { id: 'tom', name: 'Tomas Berg', handle: 'tomas' }

/** Food community: cooks' tips and replies under a recipe. */
export const RecipeComments: Story = {
  name: 'Recipe comments',
  args: {
    subject: 'Sunday focaccia',
    threads: [
      {
        id: 'rc1',
        comments: [
          {
            id: 'rc1-1',
            author: BAKER,
            body: 'Made this twice. An overnight rest in the fridge gives a _much_ better crumb 🍞',
            createdAt: NOW - 26 * 60 * MIN,
            reactions: [{ emoji: '❤️', by: ['rosa', 'tom'] }],
          },
          { id: 'rc1-2', author: COOK, body: 'Thank you @devika! How long did you rest it?', createdAt: NOW - 24 * 60 * MIN },
          { id: 'rc1-3', author: BAKER, body: 'About 14 hours, covered, at 38°F.', createdAt: NOW - 23 * 60 * MIN },
        ],
      },
      {
        id: 'rc2',
        comments: [
          {
            id: 'rc2-1',
            author: NEIGHBOR,
            body: 'Swapped the rosemary for thyme and cherry tomatoes. Dinner party hit.',
            createdAt: NOW - 5 * 60 * MIN,
            reactions: [{ emoji: '🎉', by: ['rosa'] }],
          },
        ],
      },
    ],
    people: [COOK, BAKER, NEIGHBOR],
    user: COOK,
    now: NOW,
    demoMarker: false,
    copy: { title: 'Cooks’ notes', newPlaceholder: 'Share a tip or a swap…', send: 'Post tip' },
  },
}
