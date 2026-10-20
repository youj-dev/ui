import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { VersionHistory, type VersionHistoryVersion } from './version-history'

const meta: Meta<typeof VersionHistory> = {
  title: 'Blocks/Activity/Version history',
  component: VersionHistory,
  // The gallery's picture: the demo history, without its Demo data badge.
  args: { demoMarker: false },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'A document’s versions by day beside the document as it was, with what changed marked word by word, changed properties as before → after, named versions and a restore that keeps the history.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof VersionHistory>

/** The newest version against the one before it. Walk the list with ↑ ↓, step through changes with Alt+↑ ↓, restore an older one. */
export const Default: Story = {}

/** An older version, compared to the one before it: whole paragraphs added and removed, properties changed. */
export const OlderVersion: Story = { name: 'Older version', args: { defaultVersion: 'v4' } }

/** Only the named versions in the list. */
export const NamedOnly: Story = { name: 'Named only', args: { defaultNamedOnly: true } }

/** While the history loads. */
export const Loading: Story = { args: { versions: [], loading: true } }

/** On a page of its own: `embedded={false}` draws the centered canvas and the page's `h1` around it. */
export const Standalone: Story = { args: { embedded: false } }

const NOW = Date.UTC(2026, 9, 2, 10, 0)
const ANA = { id: 'ana', name: 'Ana Ruiz' }
const LEE = { id: 'lee', name: 'Lee Park' }
const VERSIONS: VersionHistoryVersion[] = [
  {
    id: 'r3',
    createdAt: NOW - 20 * 60_000,
    authors: [ANA],
    doc: {
      title: 'Refund policy',
      blocks: [
        { id: 'a', text: 'Ask for a refund within 30 days of any charge and we’ll return it in full, no questions asked.' },
        { id: 'b', text: 'Refunds reach your card in 5 to 10 business days.' },
      ],
      properties: { Status: 'Published' },
    },
  },
  {
    id: 'r2',
    createdAt: NOW - 3 * 60 * 60_000,
    authors: [LEE],
    name: 'Reviewed by finance',
    doc: {
      title: 'Refund policy',
      blocks: [{ id: 'a', text: 'Ask for a refund within 14 days of any charge and we’ll return it in full.' }],
      properties: { Status: 'In review' },
    },
  },
]

/** A help-center article's history: your versions, your clock, and restore and rename wired. */
export const WithYourData: Story = {
  name: 'With your data',
  args: { versions: VERSIONS, now: NOW, user: ANA, copy: { title: 'Article history' }, onRestore: fn(), onRename: fn(), onVersionChange: fn() },
}

const MARTA = { id: 'marta', name: 'Marta Kowalski' }
const OWEN = { id: 'owen', name: 'Owen Fischer' }

/** Legal: a contract's drafts, one named for the client, with terms and status changing. */
export const ContractVersions: Story = {
  name: 'Contract versions',
  args: {
    now: NOW,
    user: MARTA,
    demoMarker: false,
    copy: { title: 'Draft history' },
    versions: [
      {
        id: 'c3',
        createdAt: NOW - 2 * 60 * 60_000,
        authors: [MARTA],
        name: 'Sent to client',
        doc: {
          title: 'Services agreement · Northwind Dental',
          blocks: [
            { id: 'a', text: 'Provider shall deliver the services within 45 days of the effective date.' },
            { id: 'b', text: 'Either party may terminate this agreement with 30 days written notice.' },
          ],
          properties: { Status: 'Sent', Fee: '$18,000' },
        },
      },
      {
        id: 'c2',
        createdAt: NOW - 26 * 60 * 60_000,
        authors: [OWEN],
        doc: {
          title: 'Services agreement · Northwind Dental',
          blocks: [
            { id: 'a', text: 'Provider shall deliver the services within 60 days of the effective date.' },
            { id: 'b', text: 'Either party may terminate this agreement with 14 days written notice.' },
          ],
          properties: { Status: 'In review', Fee: '$16,500' },
        },
      },
      {
        id: 'c1',
        createdAt: NOW - 3 * 24 * 60 * 60_000,
        authors: [MARTA],
        doc: {
          title: 'Services agreement · Northwind Dental',
          blocks: [{ id: 'a', text: 'Provider shall deliver the services within 60 days of the effective date.' }],
          properties: { Status: 'Draft', Fee: '$16,500' },
        },
      },
    ],
  },
}

const CHEF = { id: 'chef', name: 'Lucia Ferraro' }
const MANAGER = { id: 'mgr', name: 'Dev Patel' }

/** Restaurant: dishes and prices changing from one printing of the menu to the next. */
export const MenuVersions: Story = {
  name: 'Menu versions',
  args: {
    now: NOW,
    user: CHEF,
    demoMarker: false,
    copy: { title: 'Menu history' },
    versions: [
      {
        id: 'm3',
        createdAt: NOW - 90 * 60_000,
        authors: [CHEF],
        name: 'Autumn menu',
        doc: {
          title: 'Dinner menu',
          blocks: [
            { id: 'a', text: 'Roasted squash soup with sage brown butter, $11.' },
            { id: 'b', text: 'Wild mushroom risotto with parmesan and thyme, $24.' },
            { id: 'c', text: 'Apple tart with cinnamon ice cream, $10.' },
          ],
          properties: { Season: 'Autumn', Printed: 'Oct 2' },
        },
      },
      {
        id: 'm2',
        createdAt: NOW - 8 * 24 * 60 * 60_000,
        authors: [MANAGER],
        doc: {
          title: 'Dinner menu',
          blocks: [
            { id: 'a', text: 'Chilled tomato soup with basil oil, $10.' },
            { id: 'b', text: 'Grilled corn risotto with parmesan, $22.' },
            { id: 'c', text: 'Peach tart with vanilla ice cream, $9.' },
          ],
          properties: { Season: 'Summer', Printed: 'Jul 12' },
        },
      },
    ],
  },
}
