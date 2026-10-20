import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Careers } from './careers'

const meta: Meta<typeof Careers> = {
  title: 'Blocks/Marketing/Careers',
  component: Careers,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section' },
    docs: {
      description: {
        component:
          'List the open roles so people find theirs: teams as tabs with live counts, a search that marks its words, a location filter, rows that line up their place, kind and salary band, and an open application at the end.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Careers>

export const Default: Story = {}

/** Nothing open right now: the perks and the open application stay. */
export const NotHiring: Story = { name: 'Not hiring', args: { roles: [] } }

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    copy: { eyebrow: 'Jobs', title: 'Roast with us', description: 'Early starts, good coffee, and Sundays off.', all: 'Everything' },
    perks: ['A bag of coffee every week', 'Sundays off, always'],
    roles: [
      {
        id: 'roaster',
        title: 'Roaster',
        team: 'Roastery',
        location: 'Leeds',
        type: 'Full-time',
        salary: '£28–32k',
        posted: '2026-10-01',
        href: '/jobs/roaster',
        onClick: fn(),
      },
      {
        id: 'driver',
        title: 'Delivery rider',
        team: 'Wholesale',
        location: 'Leeds',
        type: 'Part-time',
        salary: '£13 an hour',
        posted: '2026-09-02',
        href: '/jobs/rider',
      },
      {
        id: 'buyer',
        title: 'Green coffee buyer',
        team: 'Wholesale',
        location: 'Remote, Europe',
        remote: true,
        type: 'Full-time',
        salary: '£40–48k',
        posted: '2026-09-20',
        href: '/jobs/buyer',
      },
    ],
    now: new Date('2026-10-08'),
    cta: { label: 'Write to us', href: '/jobs/open' },
    onTeamChange: fn(),
    onQueryChange: fn(),
    onLocationChange: fn(),
  },
}
