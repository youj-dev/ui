import type { Meta, StoryObj } from '@storybook/react-vite'
import { ShareGauge } from './share-gauge'

const meta: Meta<typeof ShareGauge> = {
  title: 'Blocks/App/Share Gauge',
  component: ShareGauge,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Where a total went: a half-donut of the biggest items over a ranked list, the tail folded into Other. Point at a segment or a row, or arrow through the list, and both light up with a tag over the segment. Switching the period moves the segments instead of redrawing them.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ShareGauge>

export const Default: Story = { name: 'Spend by service' }

/** The page-sized version: the card on its own canvas under an `h1`. */
export const Standalone: Story = { args: { embedded: false } }

/** Fed one period of other data, another currency and a smaller top. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    locale: 'de-DE',
    top: 3,
    copy: { title: 'Ausgaben nach Dienst', currency: 'EUR', other: (count: number) => `Übrige · ${count}`, otherDetail: 'Alles Kleinere' },
    periods: [
      {
        id: 'q',
        label: 'Q3',
        name: 'Q3 2026',
        items: [
          { id: 'a', label: 'Hosting', detail: 'Orrery', value: 9200 },
          { id: 'b', label: 'Backups', detail: 'Brindle', value: 4100 },
          { id: 'c', label: 'Mail', detail: 'Quillmark', value: 2600 },
          { id: 'd', label: 'Monitoring', detail: 'Sable', value: 900 },
          { id: 'e', label: 'DNS', detail: 'Fenwick', value: 400 },
        ],
      },
    ],
  },
}

/** A marketing team's ad budget: channels instead of services, the agency behind each as the detail. */
export const AdBudgetByChannel: Story = {
  name: 'Ad budget by channel',
  args: {
    top: 4,
    copy: { title: 'Ad budget by channel', periodLabel: 'Period', listLabel: 'Ad budget by channel, largest first', empty: 'No ad spend yet', emptyDescription: 'Spend appears here once a campaign goes live.' },
    periods: [
      {
        id: 'month',
        label: 'Month',
        name: 'October 2026',
        items: [
          { id: 'search', label: 'Search ads', detail: 'Northline Media', value: 18_400 },
          { id: 'social', label: 'Social ads', detail: 'Brightpost', value: 14_250 },
          { id: 'video', label: 'Video pre-roll', detail: 'Northline Media', value: 9_800 },
          { id: 'creators', label: 'Creator partnerships', detail: 'Loomwell', value: 7_500 },
          { id: 'email', label: 'Email newsletters', detail: 'Quillmark', value: 3_200 },
          { id: 'events', label: 'Trade shows', detail: 'In-house', value: 2_900 },
          { id: 'print', label: 'Print inserts', detail: 'Paperfold Press', value: 1_150 },
        ],
      },
      {
        id: 'quarter',
        label: 'Quarter',
        name: 'Q4 2026 plan',
        items: [
          { id: 'search', label: 'Search ads', detail: 'Northline Media', value: 61_000 },
          { id: 'social', label: 'Social ads', detail: 'Brightpost', value: 52_400 },
          { id: 'video', label: 'Video pre-roll', detail: 'Northline Media', value: 33_500 },
          { id: 'creators', label: 'Creator partnerships', detail: 'Loomwell', value: 28_000 },
          { id: 'email', label: 'Email newsletters', detail: 'Quillmark', value: 10_800 },
          { id: 'events', label: 'Trade shows', detail: 'In-house', value: 15_600 },
          { id: 'print', label: 'Print inserts', detail: 'Paperfold Press', value: 4_300 },
        ],
      },
    ],
  },
}

/** A charity's year of donations, three uses and no Other: the same card as a share of money raised. */
export const DonationUse: Story = {
  name: 'Donation use',
  args: {
    top: 3,
    copy: {
      title: 'Where donations went',
      listLabel: 'Donation use, largest first',
      periodLabel: 'Year',
      empty: 'No donations yet',
      emptyDescription: 'Use of funds appears once gifts arrive.',
    },
    periods: [
      {
        id: '2025',
        label: '2025',
        name: 'Fiscal year 2025',
        items: [
          { id: 'programs', label: 'Programs', detail: 'Meals, shelter and tutoring', value: 2_184_000 },
          { id: 'admin', label: 'Administration', detail: 'Staff, audit and insurance', value: 246_000 },
          { id: 'fundraising', label: 'Fundraising', detail: 'Events and donor care', value: 310_000 },
        ],
      },
      {
        id: '2024',
        label: '2024',
        name: 'Fiscal year 2024',
        items: [
          { id: 'programs', label: 'Programs', detail: 'Meals, shelter and tutoring', value: 1_962_000 },
          { id: 'admin', label: 'Administration', detail: 'Staff, audit and insurance', value: 238_000 },
          { id: 'fundraising', label: 'Fundraising', detail: 'Events and donor care', value: 295_000 },
        ],
      },
    ],
  },
}

export const Loading: Story = { args: { loading: true } }

export const Failed: Story = { args: { error: 'The spend could not be loaded.', onRetry: () => undefined } }

export const Empty: Story = { args: { periods: [{ id: 'm', label: 'Month', name: 'September 2026', items: [] }] } }
