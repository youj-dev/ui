import type { Meta, StoryObj } from '@storybook/react-vite'
import { type ComponentProps } from 'react'
import { YoujProvider } from '@youj/core'
import { fn } from 'storybook/test'
import { PercentileTrend } from './percentile-trend'

const meta: Meta<typeof PercentileTrend> = {
  title: 'Blocks/App/Percentile Trend',
  component: PercentileTrend,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'See how long things take, as a spread: the p99 and its change, every sample on a strip against a target, and the worst items. Latency, delivery times and wait times read the same way.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof PercentileTrend>

export const Default: Story = { name: 'API latency' }

/** The last seven days: a fatter tail, more of it past the objective. */
export const LastWeek: Story = { name: 'Last week', args: { defaultRange: '7d' } }

/** A search service in Frankfurt, with its own objective, wording and handlers. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    subtitle: 'search-api · eu-central-1',
    target: 250,
    defaultRange: '1h',
    locale: 'de-DE',
    copy: { title: 'Search latency', openTraces: 'View traces' },
    onRangeChange: fn(),
    onSetAlert: fn(),
    onCopyLink: fn(),
    onExport: fn(),
    onOpenTraces: fn(),
  },
}

/** A seeded spread of samples around a median, log-normal, with a share of slow ones further out. */
function samplesAround(count: number, median: number, spread: number, slowShare: number, seed: number) {
  let t = seed
  const random = () => {
    t = (t + 0x6d2b79f5) | 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
  const normal = () => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random())
  return Array.from({ length: count }, () => {
    const slow = random() < slowShare
    return Math.round(Math.exp(Math.log(slow ? median * 3 : median) + normal() * (slow ? spread * 1.3 : spread)) * 10) / 10
  })
}

/** The strip's own words (the objective's name and line, the summary) come from the labels, so a story renames them for its world. */
const words = (labels: ComponentProps<typeof YoujProvider>['labels']) => [
  (Story: () => React.ReactElement) => <YoujProvider labels={labels}>{Story()}</YoujProvider>,
]

const minutes = (value: number) => `${Math.round(value)} min`

/** Logistics: minutes from order to door, by zone, against the promised 45. Written as minutes, with its own windows and words. */
export const DeliveryTimes: Story = {
  name: 'Delivery times',
  decorators: words({
    latencyWithinSlo: 'Within promise',
    latencySloAt: (value) => `Promise ${value}`,
    latencySummary: (count, percentiles) => `${count} orders sampled: ${percentiles}.`,
    latencyWithin: (share, target) => `${share} delivered within the ${target} promise.`,
  }),
  args: {
    subtitle: 'Metro area · all couriers',
    target: 45,
    format: minutes,
    ranges: [
      { id: 'today', label: 'Today', name: 'today' },
      { id: 'week', label: 'Week', name: 'this week' },
      { id: 'month', label: 'Month', name: 'this month' },
    ],
    defaultRange: 'week',
    snapshots: {
      today: {
        samples: samplesAround(360, 27, 0.3, 0.04, 21),
        previous: 78,
        count: 3_940,
        updated: '2:15 PM',
        items: [
          { id: 'dt', prefix: 'DT', name: 'Downtown', value: 52, over: 0.06 },
          { id: 'hb', prefix: 'HB', name: 'Harbor', value: 71, over: 0.14 },
          { id: 'ns', prefix: 'NS', name: 'Northside', value: 49, over: 0.04 },
          { id: 'ap', prefix: 'AP', name: 'Airport', value: 88, over: 0.21 },
        ],
      },
      week: {
        samples: samplesAround(360, 29, 0.32, 0.05, 22),
        previous: 84,
        count: 27_600,
        updated: '2:15 PM',
        items: [
          { id: 'dt', prefix: 'DT', name: 'Downtown', value: 58, over: 0.08 },
          { id: 'hb', prefix: 'HB', name: 'Harbor', value: 79, over: 0.17 },
          { id: 'ns', prefix: 'NS', name: 'Northside', value: 54, over: 0.06 },
          { id: 'ap', prefix: 'AP', name: 'Airport', value: 96, over: 0.24 },
        ],
      },
      month: {
        samples: samplesAround(360, 31, 0.34, 0.06, 23),
        previous: 95,
        count: 118_000,
        updated: '2:10 PM',
        items: [
          { id: 'dt', prefix: 'DT', name: 'Downtown', value: 63, over: 0.1 },
          { id: 'hb', prefix: 'HB', name: 'Harbor', value: 84, over: 0.2 },
          { id: 'ns', prefix: 'NS', name: 'Northside', value: 60, over: 0.08 },
          { id: 'ap', prefix: 'AP', name: 'Airport', value: 104, over: 0.27 },
        ],
      },
    },
    copy: {
      title: 'Delivery times',
      headline: 'p99 door to door',
      count: 'Orders',
      strip: 'Sampled orders',
      items: 'Zones',
      itemColumns: 'Over 45 min · p99',
      overShare: (share: string) => share,
      status: { ok: 'within the promise', slow: 'over the promise' },
      announcement: (range: string, p99: string, within: string) => `${range}: p99 ${p99}, ${within} delivered within the promise.`,
      sampled: (shown: string, total: string) => `Sampled ${shown} of ${total} orders`,
      openTraces: 'View orders',
      setAlert: 'Alert dispatch',
      settingAlert: 'Setting alert…',
      alertSet: 'Alert set',
      exportSamples: 'Export orders',
    },
    onSetAlert: fn(),
  },
}

/** Health: minutes until a patient is seen, by triage level, against one hour. */
export const ErWaitTimes: Story = {
  name: 'ER wait times',
  decorators: words({
    latencyWithinSlo: 'Seen within target',
    latencySloAt: (value) => `Target ${value}`,
    latencySummary: (count, percentiles) => `${count} visits sampled: ${percentiles}.`,
    latencyWithin: (share, target) => `${share} seen within the ${target} target.`,
  }),
  args: {
    subtitle: 'Riverside General · Emergency',
    target: 60,
    format: minutes,
    ranges: [
      { id: 'day', label: 'Day', name: 'the last 24 hours' },
      { id: 'week', label: 'Week', name: 'the last 7 days' },
    ],
    snapshots: {
      day: {
        samples: samplesAround(120, 44, 0.45, 0.07, 31),
        previous: 175,
        count: 312,
        updated: '6:40 PM',
        items: [
          { id: 'l2', prefix: 'L2', name: 'Emergent', value: 38, over: 0.02 },
          { id: 'l3', prefix: 'L3', name: 'Urgent', value: 112, over: 0.31 },
          { id: 'l4', prefix: 'L4', name: 'Less urgent', value: 168, over: 0.52 },
          { id: 'l5', prefix: 'L5', name: 'Non-urgent', value: 205, over: 0.63 },
        ],
      },
      week: {
        samples: samplesAround(120, 41, 0.42, 0.06, 32),
        previous: 162,
        count: 2_140,
        updated: '6:40 PM',
        items: [
          { id: 'l2', prefix: 'L2', name: 'Emergent', value: 34, over: 0.01 },
          { id: 'l3', prefix: 'L3', name: 'Urgent', value: 98, over: 0.26 },
          { id: 'l4', prefix: 'L4', name: 'Less urgent', value: 151, over: 0.46 },
          { id: 'l5', prefix: 'L5', name: 'Non-urgent', value: 188, over: 0.58 },
        ],
      },
    },
    copy: {
      title: 'ER wait times',
      headline: 'p99 wait',
      count: 'Visits',
      strip: 'Sampled visits',
      items: 'Triage levels',
      itemColumns: 'Over 60 min · p99',
      overShare: (share: string) => share,
      status: { ok: 'seen within the hour', slow: 'waiting over the hour' },
      announcement: (range: string, p99: string, within: string) => `${range}: p99 wait ${p99}, ${within} seen within the hour.`,
      sampled: (shown: string, total: string) => `Sampled ${shown} of ${total} visits`,
      openTraces: 'View visits',
      setAlert: 'Alert charge nurse',
      settingAlert: 'Notifying…',
      alertSet: 'Nurse alerted',
      exportSamples: 'Export waits',
    },
  },
}

export const Loading: Story = { args: { loading: true } }

export const Empty: Story = { args: { snapshots: { '24h': { samples: [], previous: 0, count: 0, items: [], updated: '14:32' } } } }

export const Error: Story = { args: { error: 'Couldn’t load the latency.', onRetry: fn() } }
