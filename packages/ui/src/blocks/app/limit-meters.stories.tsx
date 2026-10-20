import type { Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider } from '@youj/core'
import { fn } from 'storybook/test'
import { LimitMeters } from './limit-meters'

const meta: Meta<typeof LimitMeters> = {
  title: 'Blocks/App/Limit Meters',
  component: LimitMeters,
  // The gallery's picture: the demo traffic, without its Demo data badge.
  args: { demoMarker: false },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Watch how much of an allowance is used: a picker for what is limited, a live bucket of what is left, the figures and a raise. Gateways, data plans and library cards read the same way.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof LimitMeters>

export const Default: Story = { name: 'API limits' }

/** An endpoint over its limit: the bucket rarely holds a batch, and 429s pile up. */
export const Throttling: Story = { args: { defaultLimiter: 'embeddings' } }

/** Your gateway's figures: no simulated traffic, so the card holds still until you re-render it with fresh ones. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    copy: { title: 'API quotas', scope: 'Per key, last hour' },
    limiters: [
      {
        id: 'search',
        kind: 'key',
        name: 'search-svc',
        hint: 'sk_demo_…9b1c',
        limit: 1200,
        capacity: 120,
        burst: 40,
        volume: 860,
        spikiness: 0.2,
        tokens: 74,
        refusals: [0, 0, 2, 0, 1, 0, 0, 4, 0, 0, 1, 0],
      },
      {
        id: 'export',
        kind: 'endpoint',
        name: 'POST /v2/export',
        hint: 'per workspace',
        limit: 60,
        capacity: 10,
        burst: 4,
        volume: 58,
        spikiness: 0.7,
        tokens: 1,
        refusals: [3, 5, 2, 8, 6, 4, 9, 7, 5, 6, 8, 11],
      },
    ],
  },
}

/** The bucket's own words (the marker and the refill line) come from the labels, so a data plan renames them for its world. */
const words = (labels: { bucketBurst: string; bucketRefill: string }) => [
  (Story: () => React.ReactElement) => <YoujProvider labels={labels}>{Story()}</YoujProvider>,
]

const gb = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })

/** Telecom: each line on a family plan is a limiter. The cap is its monthly data, the bucket what is left (it doesn't refill), the marker where a warning starts. */
export const MobileDataPlan: Story = {
  name: 'Mobile data plan',
  decorators: words({ bucketBurst: 'Warn at', bucketRefill: 'Added' }),
  args: {
    kinds: [
      { id: 'phone', label: 'Phones' },
      { id: 'tablet', label: 'Tablets' },
    ],
    format: { rate: (value) => gb.format(value) },
    limiters: [
      {
        id: 'dana',
        kind: 'phone',
        name: 'Dana',
        hint: '(555) 013-2284',
        limit: 15,
        capacity: 15,
        burst: 3,
        volume: 10,
        spikiness: 0.2,
        tokens: 5,
        refill: 0,
        refusals: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      },
      {
        id: 'marcus',
        kind: 'phone',
        name: 'Marcus',
        hint: '(555) 013-7731',
        limit: 25,
        capacity: 25,
        burst: 4,
        volume: 18,
        spikiness: 0.3,
        tokens: 7,
        refill: 0,
        refusals: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      },
      {
        id: 'ellie',
        kind: 'tablet',
        name: 'Ellie’s tablet',
        hint: '(555) 013-9046',
        limit: 5,
        capacity: 5,
        burst: 2,
        volume: 4,
        spikiness: 0.8,
        tokens: 1,
        refill: 0,
        refusals: [0, 0, 0, 0, 0, 1, 0, 2, 0, 3, 2, 4],
      },
      {
        id: 'noah',
        kind: 'tablet',
        name: 'Noah’s tablet',
        hint: '(555) 013-5520',
        limit: 5,
        capacity: 5,
        burst: 1,
        volume: 1,
        spikiness: 0.4,
        tokens: 4,
        refill: 0,
        refusals: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      },
    ],
    copy: {
      title: 'Family plan',
      scope: 'Resets Nov 1',
      limiter: 'Line',
      viewLogs: 'View usage',
      copyId: 'Copy line number',
      throughput: 'Used this cycle',
      perMinute: 'GB',
      status: { ok: 'Within the cap', low: 'Near the cap', empty: 'Slowed' },
      tokens: 'Data left',
      throttledCode: '',
      throttledWindow: 'Slowdowns · last 12 weeks',
      throttledChart: (count: string) => `${count} slowdowns in the last 12 weeks, by week`,
      limit: 'Cap',
      capacity: 'Plan',
      tokensUnit: 'GB',
      perMinuteUnit: 'GB',
      accepted: 'Full speed',
      policy: (limit: string, burst: string) => `Cap ${limit} GB · warn under ${burst} GB`,
      raise: 'Add data',
      raising: 'Adding…',
      raised: (limit: string) => `Cap raised to ${limit} GB`,
    },
    onRaiseLimit: fn(),
  },
}

/** Education: each member of a library is a limiter, items out against the most they may borrow. */
export const LibraryLoans: Story = {
  name: 'Library loans',
  decorators: words({ bucketBurst: 'Hold at', bucketRefill: 'Returned' }),
  args: {
    kinds: [
      { id: 'adult', label: 'Adults' },
      { id: 'child', label: 'Children' },
    ],
    limiters: [
      {
        id: 'priya',
        kind: 'adult',
        name: 'Priya Nair',
        hint: 'Card …0412',
        limit: 12,
        capacity: 12,
        burst: 2,
        volume: 7,
        spikiness: 0.3,
        tokens: 5,
        refill: 0,
        refusals: [0, 1, 0, 2, 1, 0, 1, 0, 2, 0, 1, 0],
      },
      {
        id: 'tomas',
        kind: 'adult',
        name: 'Tomás Rivera',
        hint: 'Card …7788',
        limit: 12,
        capacity: 12,
        burst: 2,
        volume: 11,
        spikiness: 0.6,
        tokens: 1,
        refill: 0,
        refusals: [0, 2, 1, 0, 3, 1, 2, 0, 2, 4, 1, 3],
      },
      {
        id: 'maya',
        kind: 'child',
        name: 'Maya Chen',
        hint: 'Card …2054',
        limit: 6,
        capacity: 6,
        burst: 1,
        volume: 3,
        spikiness: 0.2,
        tokens: 3,
        refill: 0,
        refusals: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      },
    ],
    copy: {
      title: 'Borrowing limits',
      scope: 'Riverside branch',
      limiter: 'Member',
      viewLogs: 'View loan history',
      copyId: 'Copy card number',
      throughput: 'Items out',
      perMinute: 'items',
      status: { ok: 'Room to borrow', low: 'Near the limit', empty: 'At the limit' },
      tokens: 'Available',
      throttledCode: '',
      throttledWindow: 'Declined · last 12 weeks',
      throttledChart: (count: string) => `${count} loans declined in the last 12 weeks, by week`,
      limit: 'Limit',
      capacity: 'Maximum',
      tokensUnit: 'items',
      perMinuteUnit: 'items',
      accepted: 'Approved',
      policy: (limit: string, burst: string) => `Up to ${limit} items · hold under ${burst}`,
      raise: 'Raise limit',
      raised: (limit: string) => `Limit raised to ${limit} items`,
    },
  },
}

export const Loading: Story = { args: { loading: true } }

export const Empty: Story = { args: { limiters: [] } }

export const Error: Story = { args: { error: 'The limits could not be loaded.', onRetry: fn() } }
