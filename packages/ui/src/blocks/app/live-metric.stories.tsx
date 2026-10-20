import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { LiveMetric, type LiveMetricSnapshot } from './live-metric'

const meta: Meta<typeof LiveMetric> = {
  title: 'Blocks/App/Live metric',
  component: LiveMetric,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'What is happening right now: people on the site rolling digit by digit, the last five minutes as a strip that slides along as each bucket opens, and the pages they are on re-ranking. Pause holds it; the figure is spoken every half minute.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof LiveMetric>

export const Default: Story = { args: { demoMarker: false } }

/** Held: the dot rests and nothing moves until Resume. */
export const Paused: Story = { args: { defaultPaused: true, demoMarker: false } }

export const Loading: Story = { args: { loading: true, snapshot: undefined } }

export const LoadError: Story = { name: 'Error', args: { error: 'The live feed disconnected.', onRetry: fn() } }

/* A support queue's feed: tickets open now, new tickets per minute for the last half hour, by channel. */
const QUEUE: LiveMetricSnapshot = {
  current: 86,
  previous: 71,
  bucket: 412,
  series: [3, 4, 2, 5, 6, 4, 3, 7, 8, 6, 5, 4, 6, 9, 11, 8, 7, 6, 5, 7, 6, 8, 10, 12, 9, 8, 7, 9, 10, 4],
  pages: [
    { id: 'email', label: 'Email', value: 41 },
    { id: 'chat', label: 'Live chat', value: 27 },
    { id: 'phone', label: 'Phone', value: 12 },
    { id: 'social', label: 'Social', value: 6 },
  ],
}

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    snapshot: QUEUE,
    bucketSeconds: 60,
    copy: {
      title: 'Support queue',
      description: 'Open tickets and where they came from',
      people: 'tickets open',
      strip: (seconds, minutes) => `New tickets every ${seconds}, the last ${minutes}`,
      pages: 'Channels',
      pagePeople: 'Open',
      page: (label, people) => `${label}: ${people} open`,
      announcement: (people) => `${people} tickets open`,
    },
    onPausedChange: fn(),
  },
}

/* A grocery store's door counters: people inside now, entries per minute for the last half hour, and the aisles they are in. */
const STORE: LiveMetricSnapshot = {
  current: 142,
  previous: 118,
  bucket: 930,
  series: [4, 5, 3, 6, 7, 5, 4, 8, 9, 7, 6, 5, 7, 10, 12, 9, 8, 7, 6, 8, 7, 9, 11, 13, 10, 9, 8, 10, 12, 5],
  pages: [
    { id: 'produce', label: 'Produce', value: 34 },
    { id: 'checkout', label: 'Checkout lanes', value: 29 },
    { id: 'dairy', label: 'Dairy and eggs', value: 21 },
    { id: 'bakery', label: 'Bakery', value: 17 },
    { id: 'frozen', label: 'Frozen foods', value: 12 },
  ],
}

export const StoreFootTraffic: Story = {
  name: 'Store foot traffic',
  args: {
    snapshot: STORE,
    bucketSeconds: 60,
    copy: {
      title: 'In the store',
      description: 'Shoppers inside, live',
      people: 'shoppers inside',
      versus: (minutes) => `vs. ${minutes} ago`,
      strip: (seconds, minutes) => `Shoppers entering every ${seconds}, the last ${minutes}`,
      pages: 'Busiest aisles',
      pagePeople: 'Shoppers',
      page: (label, people) => `${label}: ${people} shoppers`,
      announcement: (people) => `${people} shoppers in the store now`,
      empty: 'The store is empty',
    },
    demoMarker: false,
  },
}

/* A support line: calls waiting now, calls offered every 30 seconds for the last quarter hour, and the queues holding them. */
const CALLS: LiveMetricSnapshot = {
  current: 23,
  previous: 31,
  bucket: 2204,
  series: [2, 3, 1, 2, 4, 3, 2, 1, 3, 5, 4, 3, 2, 4, 6, 5, 4, 3, 5, 4, 3, 2, 3, 4, 3, 2, 4, 3, 2, 1],
  pages: [
    { id: 'billing', label: 'Billing', value: 9 },
    { id: 'orders', label: 'Orders and returns', value: 7 },
    { id: 'tech', label: 'Technical support', value: 4 },
    { id: 'accounts', label: 'Account access', value: 2 },
    { id: 'press', label: 'Press and partners', value: 1 },
  ],
}

export const CallCenter: Story = {
  name: 'Call center',
  args: {
    snapshot: CALLS,
    bucketSeconds: 30,
    copy: {
      title: 'Call queue',
      description: 'Customers waiting for an agent, live',
      people: 'calls in queue',
      strip: (seconds, minutes) => `Calls offered every ${seconds}, the last ${minutes}`,
      pages: 'Queues',
      pagePeople: 'Waiting',
      page: (label, people) => `${label}: ${people} waiting`,
      announcement: (people) => `${people} calls in the queue`,
      empty: 'No calls waiting',
    },
    demoMarker: false,
  },
}

export const Standalone: Story = { args: { embedded: false, demoMarker: false } }
