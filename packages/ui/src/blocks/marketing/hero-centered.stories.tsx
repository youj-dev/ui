import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { HeroCentered } from './hero-centered'

const meta: Meta<typeof HeroCentered> = {
  title: 'Blocks/Marketing/Hero centered',
  component: HeroCentered,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section' },
    docs: {
      description: {
        component:
          "Introduce your product with a centered headline and calls to action over a soft animated background.",
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof HeroCentered>

export const Default: Story = {
  render: (args) => (
    <div className="min-h-dvh bg-canvas">
      <HeroCentered {...args} />
    </div>
  ),
}

/** A finance product's copy, links and handlers in place of the demo's. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    copy: {
      badge: 'Beta',
      headline: 'Accounting that keeps up with your business',
      description: 'Ledgerly reconciles every card swipe, invoice and payout as it happens, so month end is a Tuesday, not a week.',
      note: 'Free for 30 days · Cancel anytime',
    },
    announcement: { label: 'Ledgerly now closes your books in real time', href: '/changelog' },
    primaryCta: { label: 'Open an account', href: '/signup', onClick: fn() },
    secondaryCta: { label: 'See pricing', href: '/pricing', onClick: fn() },
  },
  render: Default.render,
}
