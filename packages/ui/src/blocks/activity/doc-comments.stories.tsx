import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { DocComments, type DocCommentsDoc, type DocCommentsThread } from './doc-comments'

const meta: Meta<typeof DocComments> = {
  title: 'Blocks/Activity/Doc comments',
  component: DocComments,
  // The gallery's picture: the demo brief, without its Demo data badge.
  args: { demoMarker: false },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'A document with comments pinned to its words: highlights in the text and a rail of threads beside them, each level with its words and pushed clear of the others. Select text to start a thread.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof DocComments>

/** The demo: a few seconds in, Theo comments further down and the rail makes room; then Mara replies. Select any words and press Comment. */
export const Default: Story = {}

/** A thread open: its card sits right against its words and the others make way. */
export const Active: Story = { args: { defaultActiveThread: 'd-target' } }

/** Resolved threads shown: their words keep a dashed underline. */
export const ShowResolved: Story = { name: 'Show resolved', args: { defaultShowResolved: true } }

/** No comments yet: the rail says how to start one. */
export const Empty: Story = { args: { threads: [] } }

/** On a page of its own: `embedded={false}` draws the centered canvas and the page's `h1` around it. */
export const Standalone: Story = { args: { embedded: false } }

const DOC: DocCommentsDoc = {
  title: 'Onboarding email · draft 3',
  blocks: [
    { id: 'subject', type: 'heading', text: 'Subject: Your workspace is ready' },
    {
      id: 'intro',
      text: 'Welcome to Fernway! Your team can start tracking shipments today: invite a colleague, connect a carrier and import your first manifest.',
    },
    { id: 'cta', text: 'Most teams are live within an hour. If you get stuck, reply to this email and a person will answer.' },
  ],
}
const ADA = { id: 'ada', name: 'Ada Brennan', handle: 'ada' }
const LUCA = { id: 'luca', name: 'Luca Moretti', handle: 'luca' }
const NOW = Date.UTC(2026, 9, 2, 10, 0)
const anchor = (block: string, phrase: string) => {
  const text = DOC.blocks.find((b) => b.id === block)!.text
  return { block, start: text.indexOf(phrase), end: text.indexOf(phrase) + phrase.length }
}
const THREADS: DocCommentsThread[] = [
  {
    id: 'n1',
    anchor: anchor('intro', 'connect a carrier'),
    comments: [{ id: 'n1a', author: LUCA, body: 'Link this to the carriers page?', createdAt: NOW - 50 * 60_000 }],
  },
  {
    id: 'n2',
    anchor: anchor('cta', 'within an hour'),
    comments: [{ id: 'n2a', author: ADA, body: 'Median is **42 minutes**, so this holds.', createdAt: NOW - 20 * 60_000 }],
  },
]

/** Your own document and threads, the clock from your server, every action wired. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    doc: DOC,
    threads: THREADS,
    people: [ADA, LUCA],
    user: ADA,
    viewers: [{ ...LUCA, presence: 'online' }],
    now: NOW,
    copy: { showResolved: 'Include resolved' },
    onPost: fn(),
    onEdit: fn(),
    onDelete: fn(),
    onReact: fn(),
    onResolve: fn(),
    onActiveThreadChange: fn(),
  },
}

const lease = (block: string, phrase: string, doc: DocCommentsDoc) => {
  const text = doc.blocks.find((b) => b.id === block)!.text
  return { block, start: text.indexOf(phrase), end: text.indexOf(phrase) + phrase.length }
}
const LEASE: DocCommentsDoc = {
  title: 'Lease agreement · 410 Alder Street',
  blocks: [
    { id: 'term', type: 'heading', text: '2. Term and rent' },
    {
      id: 'rent',
      text: 'Tenant shall pay monthly rent of $2,450 on the first day of each month. A late fee of 8% applies after a five-day grace period.',
    },
    { id: 'deposit', type: 'heading', text: '3. Security deposit' },
    {
      id: 'return',
      text: 'Landlord shall return the security deposit within 60 days after the tenant vacates, less lawful deductions for damage beyond normal wear.',
    },
  ],
}
const PAUL = { id: 'paul', name: 'Paula Whitman', handle: 'paula' }
const NIKO = { id: 'niko', name: 'Nikolai Petrov', handle: 'nikolai' }

/** Legal: comments pinned to the clauses they question. */
export const LeaseAgreement: Story = {
  name: 'Lease agreement',
  args: {
    doc: LEASE,
    threads: [
      {
        id: 'l1',
        anchor: lease('rent', 'late fee of 8%', LEASE),
        comments: [
          {
            id: 'l1a',
            author: NIKO,
            body: 'State law caps late fees at 5% of rent. This clause is unenforceable as drafted.',
            createdAt: NOW - 70 * 60_000,
          },
          { id: 'l1b', author: PAUL, body: 'Agreed. I will change it to **5%** and re-send.', createdAt: NOW - 25 * 60_000 },
        ],
      },
      {
        id: 'l2',
        anchor: lease('return', 'within 60 days', LEASE),
        comments: [{ id: 'l2a', author: NIKO, body: 'Our template says 30 days. Which one did the client agree to?', createdAt: NOW - 45 * 60_000 }],
      },
    ],
    people: [PAUL, NIKO],
    user: PAUL,
    viewers: [{ ...NIKO, presence: 'online' }],
    now: NOW,
    demoMarker: false,
    copy: { comments: 'Review notes', newThreadPlaceholder: 'Note on this clause…' },
  },
}

const PLAN: DocCommentsDoc = {
  title: 'Lesson plan · Fractions in the kitchen, grade 4',
  blocks: [
    { id: 'goal', type: 'heading', text: 'Objective' },
    { id: 'goal-text', text: 'Students compare and add fractions with like denominators by doubling and halving a simple recipe.' },
    { id: 'act', type: 'heading', text: 'Activity' },
    {
      id: 'act-text',
      text: 'In pairs, students measure out flour and water with fraction cups, record each amount and then explain why 3/4 plus 1/4 fills a whole cup.',
    },
  ],
}
const plan = (block: string, phrase: string) => {
  const text = PLAN.blocks.find((b) => b.id === block)!.text
  return { block, start: text.indexOf(phrase), end: text.indexOf(phrase) + phrase.length }
}
const MS_LIN = { id: 'lin', name: 'Grace Lin', handle: 'grace' }
const MR_ODUYA = { id: 'oduya', name: 'Samuel Oduya', handle: 'samuel' }

/** Education: teachers' notes on a plan. */
export const LessonPlan: Story = {
  name: 'Lesson plan',
  args: {
    doc: PLAN,
    threads: [
      {
        id: 'p1',
        anchor: plan('goal-text', 'doubling and halving'),
        comments: [
          {
            id: 'p1a',
            author: MR_ODUYA,
            body: 'Halving 3/4 cup trips up half my class. Add a number line warm-up?',
            createdAt: NOW - 3 * 60 * 60_000,
          },
          {
            id: 'p1b',
            author: MS_LIN,
            body: 'Yes, 10 minutes before the pairs start. I will attach the printable.',
            createdAt: NOW - 2 * 60 * 60_000,
          },
        ],
      },
      {
        id: 'p2',
        anchor: plan('act-text', 'fraction cups'),
        comments: [{ id: 'p2a', author: MR_ODUYA, body: 'We only have 6 sets. Groups of 4 instead of pairs?', createdAt: NOW - 35 * 60_000 }],
      },
    ],
    people: [MS_LIN, MR_ODUYA],
    user: MS_LIN,
    now: NOW,
    demoMarker: false,
    copy: { comments: 'Teacher notes', newThreadPlaceholder: 'Add a note…' },
  },
}
