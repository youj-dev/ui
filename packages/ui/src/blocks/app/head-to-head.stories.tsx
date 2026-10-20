import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { HeadToHead } from './head-to-head'
import { CONTENDERS, METRICS } from './head-to-head/data'

const meta: Meta<typeof HeadToHead> = {
  title: 'Blocks/App/Head To Head',
  component: HeadToHead,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Put two things side by side before you choose: who leads overall, every measure as a bar from a shared center, and the trade-off between two of them. Models, job offers and supplier quotes read the same way.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof HeadToHead>

export const Default: Story = { name: 'Model eval' }

/** The production model holds on: the candidate wins on cost but loses on quality. */
export const BaselineHolds: Story = {
  name: 'Baseline holds',
  args: {
    contenders: { a: CONTENDERS.a, b: { ...CONTENDERS.b, y: 86.1 } },
    metrics: METRICS.map((m) =>
      m.id === 'accuracy' ? { ...m, b: 87.9 } : m.id === 'refusals' ? { ...m, b: 4.4 } : m.id === 'latency' ? { ...m, b: 1990 } : m,
    ),
  },
}

const percent = new Intl.NumberFormat('en-US', { style: 'percent', signDisplay: 'exceptZero', maximumFractionDigits: 0 })
const days = (winner: number, other: number) => `+${winner - other} days`

/** Personal: two job offers. Salary and days off are better higher, commute is better lower; the trade-off is commute against salary, and the margins are written in days. */
export const JobOffers: Story = {
  name: 'Job offers',
  args: {
    contenders: {
      a: { name: 'Northwind Labs', role: 'Offer A', x: 45, y: 142_000 },
      b: { name: 'Cobalt Health', role: 'Offer B', x: 15, y: 128_000 },
    },
    metrics: [
      {
        id: 'salary',
        label: 'Salary',
        a: 142_000,
        b: 128_000,
        better: 'higher',
        format: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 },
        margin: 'relative',
      },
      {
        id: 'commute',
        label: 'Commute each way',
        a: 45,
        b: 15,
        better: 'lower',
        format: { style: 'unit', unit: 'minute', unitDisplay: 'short' },
        margin: 'relative',
      },
      {
        id: 'pto',
        label: 'Paid time off',
        a: 15,
        b: 24,
        better: 'higher',
        format: { style: 'unit', unit: 'day', unitDisplay: 'long' },
        margin: days,
      },
      {
        id: 'remote',
        label: 'Remote days a week',
        a: 1,
        b: 3,
        better: 'higher',
        format: { style: 'unit', unit: 'day', unitDisplay: 'long' },
        margin: days,
      },
    ],
    format: { x: (value) => `${value} min`, yDelta: (from, to) => percent.format((to - from) / from) },
    copy: {
      title: 'Job offers',
      subtitle: 'Product designer · Seattle',
      contenders: 'Offers',
      winner: 'Better fit',
      xUnit: 'each way',
      tradeoff: 'Commute against salary',
      xAxis: 'Commute',
      yAxis: 'Salary',
      bestCorner: 'Shorter and better paid',
      xChange: 'Commute',
      yChange: 'Salary',
      summary: (name: string, commute: string, salary: string) => `${name}: ${commute} commute, ${salary} salary.`,
      chooseLabel: 'Offer to accept',
      choose: (name: string) => `Accept ${name}`,
      choosing: 'Accepting…',
      chosen: 'Accepted',
      status: 'Both offers expire Oct 31',
    },
    onChoose: fn(),
  },
}

/** Operations: two suppliers quoting the same order. Price, lead time, defects and the smallest order are better lower; the trade-off is price against on-time delivery. */
export const SupplierQuote: Story = {
  name: 'Supplier quote',
  args: {
    contenders: {
      a: { name: 'Harbor Packaging Co.', role: 'Current supplier', x: 0.84, y: 94.2 },
      b: { name: 'Delta Pack Ltd.', role: 'New quote', x: 0.71, y: 91.8 },
    },
    metrics: [
      {
        id: 'price',
        label: 'Unit price',
        a: 0.84,
        b: 0.71,
        better: 'lower',
        format: { style: 'currency', currency: 'USD', minimumFractionDigits: 2 },
        margin: 'relative',
      },
      {
        id: 'lead',
        label: 'Lead time',
        a: 21,
        b: 14,
        better: 'lower',
        format: { style: 'unit', unit: 'day', unitDisplay: 'long' },
        margin: 'relative',
      },
      {
        id: 'defects',
        label: 'Defect rate',
        a: 0.8,
        b: 1.4,
        better: 'lower',
        format: { style: 'unit', unit: 'percent', maximumFractionDigits: 1 },
        margin: 'points',
      },
      { id: 'minimum', label: 'Minimum order', a: 5000, b: 2000, better: 'lower', format: { maximumFractionDigits: 0 }, margin: 'relative' },
    ],
    format: { x: (value) => `$${value.toFixed(2)}` },
    copy: {
      title: 'Supplier quote',
      subtitle: 'Corrugated mailers · 10K a month',
      contenders: 'Suppliers',
      winner: 'Better deal',
      xUnit: 'per unit',
      tradeoff: 'Price against on-time delivery',
      xAxis: 'Price',
      yAxis: 'On time',
      bestCorner: 'Cheaper and more reliable',
      xChange: 'Price',
      yChange: 'On time',
      summary: (name: string, price: string, onTime: string) => `${name}: ${price} price, ${onTime} on time.`,
      chooseLabel: 'Supplier to order from',
      choose: (name: string) => `Order from ${name}`,
      choosing: 'Placing order…',
      chosen: 'Order placed',
      status: 'Quote valid through Nov 15',
    },
    onChoose: fn(),
  },
}

export const Loading: Story = { args: { loading: true } }

export const Empty: Story = { args: { metrics: [] } }

export const Error: Story = { args: { error: 'Couldn’t load the comparison.', onRetry: fn() } }
