import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { MarketingMetrics } from './metrics'

const meta: Meta<typeof MarketingMetrics> = {
  title: 'Blocks/Marketing/Metrics',
  component: MarketingMetrics,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section' },
    docs: {
      description: {
        component:
          'Back your claims with numbers that come with context: figures that count up for a chosen period, the change on the one before, a trend line, a baseline to compare with and a footnote for the source.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof MarketingMetrics>

export const Default: Story = {}

/** The figures while their data loads. */
export const Loading: Story = { args: { loading: true } }

/** Starts on another period. */
export const TwelveMonths: Story = { args: { defaultPeriod: '12m' } }

/** Inside another page: a section laid out by the host. */
export const Embedded: Story = {
  args: { embedded: true },
  render: (args) => (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="sr-only">Results</h1>
      <MarketingMetrics {...args} />
    </main>
  ),
}

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    copy: { eyebrow: 'Impact', title: 'What a cleaner ledger buys you', description: 'Averages across 4,800 businesses on Ledgerly.' },
    periods: [
      { id: 'q', label: 'This quarter' },
      { id: 'y', label: 'This year' },
    ],
    metrics: [
      {
        id: 'close',
        label: 'Days to close the books',
        format: { maximumFractionDigits: 1 },
        better: 'down',
        baselineLabel: 'Before Ledgerly',
        source: 'survey',
        values: {
          q: { value: 1.2, delta: -0.18, baseline: 6.5, series: [3.1, 2.6, 2.1, 1.8, 1.5, 1.3, 1.2] },
          y: { value: 1.6, delta: -0.4, baseline: 6.5, series: [5.2, 4.1, 3.2, 2.4, 2, 1.8, 1.6] },
        },
      },
      {
        id: 'reconciled',
        label: 'Reconciled by itself',
        suffix: '%',
        source: 'survey',
        values: { q: { value: 94, delta: 0.03, series: [82, 85, 88, 90, 92, 93, 94] }, y: { value: 91, delta: 0.22, series: [60, 70, 78, 84, 88, 90, 91] } },
      },
      { id: 'volume', label: 'Reconciled a year', format: { style: 'currency', currency: 'USD', notation: 'compact' }, values: { q: { value: 3_000_000_000 }, y: { value: 3_000_000_000, delta: 0.4 } } },
    ],
    sources: [{ id: 'survey', text: 'Ledgerly customer survey, 1,204 responses, September.', href: '/methodology' }],
    onPeriodChange: fn(),
  },
}
