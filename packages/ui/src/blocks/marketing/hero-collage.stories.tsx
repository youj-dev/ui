import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { HeroCollage } from './hero-collage'

const meta: Meta<typeof HeroCollage> = {
  title: 'Blocks/Marketing/Hero collage',
  component: HeroCollage,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section', preset: 'basalt' },
    docs: {
      description: {
        component:
          'Open with a release in flight: a desk of live interface cards that change state stage by stage, with a tour you can take over and a caption that tells the story in words.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof HeroCollage>

export const Default: Story = {}

/** Inside another page: a section named by an h2, laid out by the host. */
export const Embedded: Story = {
  args: { embedded: true },
  render: (args) => (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="sr-only">Northwind for teams</h1>
      <HeroCollage {...args} />
    </main>
  ),
}

/** A finance product's copy, stages and calls to action; the cards stay the kit's showcase, following the stages in order. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    copy: {
      eyebrow: 'Ledgerly for teams',
      headline: 'Every payment your team touches, in one ledger',
      description: 'Invoices, cards and payouts update as they happen, so finance and the founders see the same numbers at the same moment.',
      note: '30 days free for up to 10 people · no card',
      stagesLabel: 'A payment, step by step',
    },
    stages: [
      { id: 'invoice', label: 'Invoice', caption: 'An invoice goes out with a pay link; the customer sees it in their own language.' },
      { id: 'pay', label: 'Pay', caption: 'The card is charged and the money is matched to the invoice within seconds.' },
      { id: 'reconcile', label: 'Reconcile', caption: 'Bank lines and payouts are matched on their own; only real exceptions reach a person.' },
      { id: 'close', label: 'Close', caption: 'Month end is a review, not a project. The books close on the first business day.' },
    ],
    onValueChange: fn(),
    primaryCta: { label: 'Start a team trial', href: '/signup', onClick: fn() },
    secondaryCta: { label: 'Talk to finance', href: '/sales', onClick: fn() },
  },
}
