import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { CtaProof } from './cta-proof'

const meta: Meta<typeof CtaProof> = {
  title: 'Blocks/Marketing/CTA proof',
  component: CtaProof,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section' },
    docs: {
      description: {
        component:
          'Close with a ledger of customer results and the words behind them, ending on the reader’s own line and the call to action.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof CtaProof>

export const Default: Story = {}

/** Opening on the shortest quote: the panel keeps the longest one's height. */
export const ShortQuote: Story = { args: { defaultQuote: 3 } }

/** Inside a customers page, laid out by the host. */
export const Embedded: Story = {
  args: { embedded: true },
  render: (args) => (
    <main className="mx-auto min-h-dvh max-w-5xl bg-canvas p-6">
      <h1 className="sr-only">Customers</h1>
      <CtaProof {...args} />
    </main>
  ),
}

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    customers: [
      {
        id: 'harbor',
        company: 'Harbor Freight Co.',
        measure: 'Invoice disputes',
        before: '212 / mo',
        after: '19 / mo',
        change: { value: -0.91, kind: 'share' },
        quote: 'Our carriers stopped calling about payments. Every invoice matches the bill of lading before it leaves.',
        name: 'Ines Duarte',
        role: 'Controller, Harbor Freight',
      },
      {
        id: 'atlas',
        company: 'Atlas Lines',
        measure: 'Days to close',
        before: '11',
        after: '3',
        change: { value: -0.73, kind: 'share' },
        quote: 'Month-end used to be a week of spreadsheets. Now it is a Tuesday.',
        name: 'Ken Mori',
        role: 'Head of Finance, Atlas Lines',
      },
    ],
    logos: [
      { id: 'meridian', name: 'Meridian' },
      { id: 'polar', name: 'Polar Cargo' },
    ],
    primaryCta: { label: 'Book a demo', href: '#demo', onClick: fn() },
    secondaryCta: { label: 'Read the case studies', href: '#cases' },
    onQuoteChange: fn(),
    copy: {
      eyebrow: 'Results',
      title: 'Finance teams that closed the books faster',
      description: 'Numbers from each team’s own ledger, six months after switching.',
      readerName: 'Your finance team',
      readerMeasure: 'First reconciled invoice',
      readerQualifier: 'typically',
      readerAfter: '1 day',
      moreCount: '1,240',
      moreAfter: 'more carriers, including',
    },
  },
}
