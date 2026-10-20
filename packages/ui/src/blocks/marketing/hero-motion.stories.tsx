import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { HeroMotion } from './hero-motion'

const meta: Meta<typeof HeroMotion> = {
  title: 'Blocks/Marketing/Hero motion',
  component: HeroMotion,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section' },
    docs: {
      description: {
        component:
          "Open with a headline that rises word by word over a pointer-reactive dot matrix, beside a live panel where visitors change speed, reduced motion and theme and watch a real checklist answer.",
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof HeroMotion>

export const Default: Story = {
  render: () => (
    <div className="min-h-dvh bg-canvas">
      <HeroMotion />
    </div>
  ),
}

/** A finance product's pitch, figures and links in place of the demo's. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    copy: {
      eyebrow: 'Ledgerly · Accounting for growing teams',
      headlineLead: 'Books that',
      demoTitle: 'Month-end close',
      description: 'Every card swipe, invoice and payout reconciled as it happens, so month end is a Tuesday and tax season is a download.',
      shortcutHint: 'or search with',
    },
    facts: [
      { value: '4,800', label: 'businesses' },
      { value: '1.2 days', label: 'average close' },
      { value: '$3B', label: 'reconciled a year' },
    ],
    accents: ['close themselves.', 'reconcile overnight.'],
    tasks: [
      { id: 'bank', label: 'Match the bank feed', done: true },
      { id: 'invoices', label: 'Chase two overdue invoices', done: false },
      { id: 'tax', label: 'Review the VAT return', done: false },
    ],
    moreTasks: ['Approve the payroll run', 'Send the board pack'],
    onShip: fn(),
    shortcut: ['Ctrl', 'K'],
    primaryCta: { label: 'Open an account', href: '/signup', onClick: fn() },
    secondaryCta: { label: 'See pricing', href: '/pricing', onClick: fn() },
  },
  render: (args) => (
    <div className="min-h-dvh bg-canvas">
      <HeroMotion {...args} />
    </div>
  ),
}
