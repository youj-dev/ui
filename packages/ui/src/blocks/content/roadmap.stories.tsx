import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { defineTheme } from '@youj/core'
import { Roadmap } from './roadmap'

/** Relay's indigo. */
const relay = defineTheme({ accent: 'oklch(0.56 0.2 275)', radius: 'lg' }) // youj-allow: theme accent

const meta: Meta<typeof Roadmap> = {
  title: 'Blocks/Content/Roadmap',
  component: Roadmap,
  // The showcase's look: the block itself inherits the app's theme.
  args: { theme: relay },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen', theme: 'Relay', accent: 'oklch(0.56 0.2 275)', address: 'relay.dev/roadmap' },
    docs: {
      description: {
        component:
          'Share what you are planning with a public roadmap and a place for feature requests.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Roadmap>

export const Default: Story = {}

/** Its own page, for an app without the frame: a top bar over a centered board. */
export const Standalone: Story = { args: { embedded: false } }

/** Opens on the three-column roadmap: Planned, In progress, Shipped. */
export const RoadmapView: Story = { args: { defaultView: 'roadmap' } }

/** A brand-new board: no requests yet, and an empty roadmap. */
export const Empty: Story = { args: { requests: [] } }

/** Inside a host app: a named section in the host's theme, with no top bar. */
export const Embedded: Story = { args: { embedded: true } }

/** With your data: a note-taking app's board with its own areas, requests and words; votes, posts and comments go to Actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    brand: { name: 'Quire' },
    changelogHref: null,
    viewer: 'Mina',
    categories: { editor: 'Editor', sync: 'Sync', mobile: 'Mobile' },
    requests: [
      { id: 'q1', title: 'Offline mode on iPad', body: 'Edit notes on a flight and sync when you land.', category: 'mobile', status: 'progress', votes: 812, recent: 64, author: 'Jonas', history: [{ date: '2026-06-02', by: 'Jonas' }, { date: '2026-07-01', by: 'Quire team' }, { date: '2026-09-10', by: 'Quire team' }], comments: [], target: 'Q4 2026' },
      { id: 'q2', title: 'Tables with formulas', body: 'Sum a column without leaving the note.', category: 'editor', status: 'review', votes: 341, recent: 22, author: 'Ana', history: [{ date: '2026-09-01', by: 'Ana' }], comments: [] },
      { id: 'q3', title: 'Selective sync for big vaults', body: 'Pick which folders live on this device.', category: 'sync', status: 'shipped', votes: 1204, recent: 3, author: 'Priya', history: [{ date: '2026-02-11', by: 'Priya' }, { date: '2026-03-01', by: 'Quire team' }, { date: '2026-05-20', by: 'Quire team' }, { date: '2026-08-14', by: 'Quire team' }], comments: [], target: 'v4.2' },
    ],
    copy: { title: 'Help shape Quire', description: 'Vote on what we build next and follow it to release.', team: 'Quire team' },
    onVote: fn(),
    onSubmit: fn(async () => {}),
    onComment: fn(async () => {}),
  },
}
