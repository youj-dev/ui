import type { Meta, StoryObj } from '@storybook/react-vite'
import { illustrations } from '@youj/illustrations'
import { fn } from 'storybook/test'
import { MarketingCta } from './cta'

const meta: Meta<typeof MarketingCta> = {
  title: 'Blocks/Marketing/CTA',
  component: MarketingCta,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section', illustration: true },
    docs: {
      description: {
        component:
          "Give your landing page a closing call to action with a headline, reassurance and room for a secondary link.",
      },
    },
  },
  argTypes: { illustration: { control: 'select', options: illustrations.map((i) => i.id) } },
}
export default meta
type Story = StoryObj<typeof MarketingCta>

export const Default: Story = {
  render: (args) => (
    <div className="min-h-dvh bg-canvas">
      <MarketingCta {...args} />
    </div>
  ),
}

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    illustration: null,
    primaryCta: { label: 'Reserve a table', href: '/reserve', onClick: fn() },
    secondaryCta: { label: 'See the menu', href: '/menu' },
    copy: {
      title: 'A table for Friday is still open',
      description: 'Book online in under a minute. Cancel free until noon on the day.',
    },
  },
  render: (args) => (
    <div className="min-h-dvh bg-canvas">
      <MarketingCta {...args} />
    </div>
  ),
}
