import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { graphite } from '@youj/core'
import { CreditCardIcon, MailIcon, MapPinIcon, MessagesIcon, ShieldCheckIcon } from '@youj/icons'
import { HelpCenter } from './help-center'

const meta: Meta<typeof HelpCenter> = {
  title: 'Blocks/Content/Help Center',
  component: HelpCenter,
  // The showcase's look: the block itself inherits the app's theme.
  args: { theme: graphite },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen' },
    docs: {
      description: {
        component:
          'Help your customers find answers with live search, topic cards and a contact form.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof HelpCenter>

export const Default: Story = {}

/** Its own page, for an app without the frame: a brand bar over a centered hero with the search. */
export const Standalone: Story = { args: { embedded: false } }

/** With your data: a bike-share's help center with its own topics, articles, questions and channels; searches and requests go to Actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    brand: { name: 'Spoke' },
    statusHref: null,
    categories: [
      { id: 'rides', title: 'Rides', description: 'Unlocking, parking and ending a ride.', count: 18, icon: MapPinIcon },
      { id: 'billing', title: 'Billing', description: 'Passes, receipts and refunds.', count: 11, icon: CreditCardIcon },
      { id: 'safety', title: 'Safety', description: 'Helmets, lights and reporting a fault.', count: 7, icon: ShieldCheckIcon },
    ],
    articles: [
      { id: 'unlock', title: 'Unlock a bike with the app', category: 'rides', minutes: 2 },
      { id: 'park', title: 'Where can I park?', category: 'rides', minutes: 3 },
      { id: 'refund', title: 'Get a refund for a ride that would not end', category: 'billing', minutes: 2 },
    ],
    popular: ['unlock', 'refund'],
    questions: [{ q: 'Do I need a helmet?', a: 'Not by law in most cities we run in, but we recommend one, and day passes include a discount at partner shops.' }],
    channels: [
      { id: 'chat', title: 'In-app chat', description: 'Every day, 7am–11pm', icon: MessagesIcon, reply: 3, unit: 'minutes' },
      { id: 'email', title: 'Email', description: 'Every day', icon: MailIcon, reply: 6, unit: 'hours' },
    ],
    topics: [
      { value: 'ride', label: 'A ride' },
      { value: 'bill', label: 'A charge' },
    ],
    copy: { brandSuffix: 'Support', title: 'Need a hand?', description: 'Rides, passes and parking, answered by the people who fix the bikes.' },
    onSubmit: fn(async () => 'SP-1042'),
  },
}
