import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { basalt } from '@youj/core'
import { FlaskIcon } from '@youj/icons'
import { Waitlist } from './waitlist'

const meta: Meta<typeof Waitlist> = {
  title: 'Blocks/Marketing/Waitlist',
  component: Waitlist,
  // The showcase's look: the block itself inherits the app's theme.
  args: { theme: basalt },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen' },
    docs: {
      description: {
        component:
          'Build interest before launch with a waitlist page, a countdown and a referral link. The demo shows your place in line after you join.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Waitlist>

export const Default: Story = {}

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    brand: { name: 'Fieldnote', logo: <FlaskIcon size={22} className="text-accent" /> },
    cta: { label: 'How it works', href: '#how' },
    launchAt: new Date(2027, 2, 1).getTime(),
    onJoin: fn(async (email: string) => ({ position: 312, referralLink: `fieldnote.app/i/${email.split('@')[0]}` })),
    onShare: fn(),
    people: [
      { id: 'r', name: 'Rosa Diaz' },
      { id: 'k', name: 'Kai Lund' },
      { id: 'o', name: 'Omar Said' },
    ],
    waitingCount: 1_207,
    live: false,
    copy: {
      badge: 'Early access · spring 2027',
      title: 'Lab notes that write themselves.',
      description: 'Fieldnote listens at the bench and files every measurement where your team can find it.',
      emailPlaceholder: 'you@lab.org',
      join: 'Request access',
      waiting: 'researchers are waiting',
    },
  },
}
