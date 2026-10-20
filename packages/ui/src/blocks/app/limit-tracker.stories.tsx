import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { LimitTracker } from './limit-tracker'

const meta: Meta<typeof LimitTracker> = {
  title: 'Blocks/App/Limit Tracker',
  component: LimitTracker,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Track what has been used of a limit, with what is left on a ruler, categories and rules you can switch. The demo is a team card’s spending limit; stories show a yearly time-off allowance and a cloud storage plan.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof LimitTracker>

export const Default: Story = { name: 'Team card' }

/** A tighter limit, under the freeze line: the ruler loses the line and the pace counts to the limit. */
export const NearTheLimit: Story = { name: 'Near the limit', args: { limit: 1500 } }

const days = new Intl.NumberFormat('en', { style: 'unit', unit: 'day', unitDisplay: 'long', maximumFractionDigits: 1 })
const months = (count: number) => `${count} ${count === 1 ? 'month' : 'months'}`

/** A yearly allowance in days, nine months in: 17 of 25 used, so approval is needed in about two months at this pace. */
export const PaidTimeOff: Story = {
  name: 'Paid time off',
  args: {
    format: (value: number) => days.format(value),
    entries: [
      { id: 'vacation', name: 'vacation', amount: 10 },
      { id: 'sick', name: 'sick', amount: 2 },
      { id: 'personal', name: 'personal', amount: 5 },
    ],
    limit: 25,
    limits: [20, 25, 30, 35],
    increase: 5,
    count: 7,
    elapsed: 9,
    rules: [
      {
        id: 'approval',
        title: (format) => `Manager approval past ${format(22)}`,
        hint: 'Requests wait for a manager instead of auto-approving',
        on: true,
        line: { at: 22, label: 'approval' },
      },
      { id: 'note', title: (format) => `Doctor’s note over ${format(2)}`, hint: 'Due within 3 days of coming back', on: true },
      { id: 'team', title: 'Tell the team', hint: (format) => `On every request over ${format(3)}` },
    ],
    copy: {
      title: 'Time off',
      aside: 'for 2026',
      subtitle: 'Design team · resets Jan 1',
      more: 'More time-off actions',
      viewHistory: 'History',
      viewDetails: 'Policy',
      meter: 'Yearly allowance',
      runway: months,
      untilLine: 'until approval',
      untilLimit: 'until the allowance is used',
      countLabel: 'requests so far',
      perUnit: 'a month on average',
      categories: 'By type',
      rules: 'Policy',
      change: 'Change allowance',
      limitLabel: 'Yearly allowance',
      increase: 'Ask for more days',
      requesting: 'Asking…',
      emptyTitle: 'No time off taken yet',
      emptyDescription: 'Your allowance and types appear with the first request.',
    },
    onRequestIncrease: fn(),
  },
}

const tb = new Intl.NumberFormat('en', { maximumFractionDigits: 1 })

/** A family plan in gigabytes, 14 months in: 1.3 of 2 TB used, so uploads stop in about four months at this pace. */
export const CloudStorage: Story = {
  name: 'Cloud storage',
  args: {
    format: (value: number) => (value >= 1000 ? `${tb.format(value / 1000)} TB` : `${Math.round(value)} GB`),
    entries: [
      { id: 'photos', name: 'photos', amount: 690 },
      { id: 'videos', name: 'videos', amount: 438 },
      { id: 'documents', name: 'documents', amount: 119 },
      { id: 'backups', name: 'backups', amount: 96 },
    ],
    limit: 2000,
    limits: [1000, 2000, 5000, 10000],
    increase: 1000,
    count: 312,
    elapsed: 14,
    rules: [
      {
        id: 'stop',
        title: (format) => `Stop uploads at ${format(1800)}`,
        hint: 'New files wait until you free space or upgrade',
        on: true,
        line: { at: 1800, label: 'uploads stop' },
      },
      { id: 'large', title: (format) => `Ask before files over ${format(5)}`, hint: 'Large uploads need a tap to confirm', on: true },
      { id: 'email', title: 'Email me when it fills up', hint: (format) => `At ${format(1600)} and again at ${format(1900)}` },
    ],
    copy: {
      title: 'Cloud storage',
      aside: 'Family plan',
      subtitle: 'Renews Dec 4 · 4 devices',
      more: 'More storage actions',
      viewHistory: 'Usage history',
      viewDetails: 'Plan details',
      meter: 'Storage plan',
      runway: months,
      untilLine: 'until uploads stop',
      untilLimit: 'until the plan is full',
      countLabel: 'uploads so far',
      perUnit: 'a month on average',
      categories: 'By type',
      change: 'Change plan',
      limitLabel: 'Storage plan',
      increase: 'Upgrade plan',
      requesting: 'Upgrading…',
      emptyTitle: 'Nothing stored yet',
      emptyDescription: 'Your usage appears with the first upload.',
    },
    onRequestIncrease: fn(),
  },
}

/** While your data loads, the ruler, tiles and rules are skeletons at their own size. */
export const Loading: Story = { args: { loading: true } }

/** No entries: the message takes the ruler’s place, at the card’s size. */
export const Empty: Story = { args: { entries: [] } }

/** A failed request: Retry sits where the ruler is. */
export const Error: Story = { args: { error: 'Couldn’t load the card’s limit.', onRetry: fn() } }

/** The standalone card: its own page, an h1 and the sections h2. */
export const Standalone: Story = { args: { embedded: false } }
