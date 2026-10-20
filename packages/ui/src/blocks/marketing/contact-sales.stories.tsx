import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { ContactSales } from './contact-sales'

const meta: Meta<typeof ContactSales> = {
  title: 'Blocks/Marketing/Contact sales',
  component: ContactSales,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section' },
    docs: {
      description: {
        component:
          'Let a visitor book a sales call the way a good scheduler does, one question at a time: a day and a time with the person their region puts forward, then three short rows of details, then a confirmation; or a message instead.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ContactSales>

export const Default: Story = {}

/** Starts on sending a message. */
export const Message: Story = { args: { defaultValues: { mode: 'message' } } }

/** Inside another page: a section laid out by the host. */
export const Embedded: Story = {
  args: { embedded: true },
  render: (args) => (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="sr-only">Contact</h1>
      <ContactSales {...args} />
    </main>
  ),
}

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    copy: {
      eyebrow: 'Wholesale',
      title: 'Stock Fernhill in your café',
      description: 'Tell us about your shop and Ines will arrange a tasting.',
      proof: ['Samples on the house', 'Delivery weekly, from Leeds', 'No minimum order for the first month'],
      pickTitle: 'Pick a tasting',
      pickDescription: '45 minutes at your shop',
      withWhom: (name: string) => `45 minutes with ${name}`,
      submitCall: 'Book the tasting',
    },
    regions: [
      { id: 'north', label: 'North', contact: { name: 'Ines Duarte', role: 'Founder', location: 'Leeds' } },
      { id: 'south', label: 'South', contact: { name: 'Jo Marsh', role: 'Head of wholesale', location: 'Bristol' } },
    ],
    slots: [
      { id: 'n1', start: new Date(2026, 9, 7, 10, 0), region: 'north' },
      { id: 'n2', start: new Date(2026, 9, 8, 14, 0), region: 'north' },
      { id: 's1', start: new Date(2026, 9, 7, 11, 0), region: 'south' },
      { id: 's2', start: new Date(2026, 9, 9, 15, 0), region: 'south', left: 0 },
    ],
    sizes: ['1 shop', '2–5 shops', '6+ shops'],
    topics: ['A tasting', 'Pricing', 'Delivery'],
    onSubmit: fn(),
    onModeChange: fn(),
    onRegionChange: fn(),
    onSlotChange: fn(),
  },
}
