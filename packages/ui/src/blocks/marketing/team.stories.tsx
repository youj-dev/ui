import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { MarketingTeam } from './team'

const meta: Meta<typeof MarketingTeam> = {
  title: 'Blocks/Marketing/Team',
  component: MarketingTeam,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section' },
    docs: {
      description: {
        component:
          'Introduce the people behind the product: portraits that look designed even without a photo, each with their local time, a bio that rises over the portrait on hover, focus or a tap, and a team filter that re-flows the grid.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof MarketingTeam>

export const Default: Story = {}

/** Inside another page: a section laid out by the host. */
export const Embedded: Story = {
  args: { embedded: true },
  render: (args) => (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="sr-only">MarketingTeam</h1>
      <MarketingTeam {...args} />
    </main>
  ),
}

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    copy: {
      eyebrow: 'Who you’ll meet',
      title: 'The roastery',
      description: 'Fourteen of us between Leeds and Bristol. Everyone answers the phone on Fridays.',
      all: 'All of us',
    },
    people: [
      {
        id: 'ines',
        name: 'Ines Duarte',
        role: 'Founder',
        team: 'Roastery',
        location: 'Leeds',
        timeZone: 'Europe/London',
        bio: 'Started on a stall with a sample roaster and a borrowed van.',
      },
      {
        id: 'jo',
        name: 'Jo Marsh',
        role: 'Head of wholesale',
        team: 'Wholesale',
        location: 'Bristol',
        timeZone: 'Europe/London',
        bio: 'Knows every café we roast for, and what they had for lunch.',
      },
      {
        id: 'sam',
        name: 'Sam Lee',
        role: 'Head roaster',
        team: 'Roastery',
        location: 'Leeds',
        timeZone: 'Europe/London',
        bio: 'Cups every batch before it leaves.',
        links: [{ label: 'Instagram', href: '#ig-sam' }],
      },
    ],
    cta: { label: 'Work with us', href: '/jobs' },
    onTeamChange: fn(),
  },
}
