import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { BreakdownList, type BreakdownItem, type BreakdownListProps } from './breakdown-list'
import { ShareBar } from './share-bar'

const meta: Meta<BreakdownListProps> = {
  title: 'UI/Data/Breakdown List',
  component: BreakdownList,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'How a total splits, as rows of a color marker, a name (with an optional line of `detail`), a value and its share of the total. It is the key to a ShareBar given the same `parts`: both take the chart colors in order, so rows and segments match. Hovering or focusing a row reports it through `onActiveChange`; pass it to the bar’s `active` and the segment lights while the rest quiet. The rows are one tab stop, moved with the arrow keys, Home and End. `variant="tiles"` leads with the value for counts; `columns={2}` sets rows side by side while each column can be 14rem wide.',
      },
    },
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['rows', 'tiles'] },
    marker: { control: 'inline-radio', options: ['swatch', 'bar'] },
    columns: { control: 'inline-radio', options: [1, 2] },
  },
}
export default meta
type Story = StoryObj<BreakdownListProps>

const CHANNELS: BreakdownItem[] = [
  { label: 'Direct', value: 61_420, tone: 'neutral' },
  { label: 'Partners', value: 38_960 },
  { label: 'Marketplace', value: 21_310 },
  { label: 'Resellers', value: 9_840 },
  { label: 'Other', value: 4_150 },
]
const EUR: Intl.NumberFormatOptions = { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }
const total = CHANNELS.reduce((sum, c) => sum + c.value, 0)

/** The key under a split bar: point at a row and its segment lights. */
export const WithShareBar: Story = {
  name: 'With a share bar',
  render: function Render() {
    const [active, setActive] = useState<number | null>(null)
    return (
      <section className="flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-4 rounded-2xl border border-line bg-surface p-5">
        <div className="flex flex-col gap-0.5">
          <span className="text-ui-sm text-fg-muted">Bookings by channel, this quarter</span>
          <span className="font-mono text-2xl font-semibold tracking-tight tabular-nums">{new Intl.NumberFormat('en-US', EUR).format(total)}</span>
        </div>
        <ShareBar parts={CHANNELS.map((c) => ({ value: c.value, tone: c.tone }))} active={active} className="h-2" />
        <BreakdownList items={CHANNELS} format={EUR} active={active} onActiveChange={setActive} aria-label="Bookings by channel" />
      </section>
    )
  },
}

const VAULTS: BreakdownItem[] = [
  { label: 'Money market', detail: 'Northbank ·· 4410', value: 1_920_000, tone: 'success' },
  { label: 'Operating', detail: 'Ledgerline ·· 0182', value: 486_000, tone: 'chart-2' },
  { label: 'Reserve', detail: 'Northbank ·· 7731', value: 702_000, tone: 'chart-4' },
  { label: 'Payroll', detail: 'Ledgerline ·· 2209', value: 268_000, tone: 'warning' },
  { label: 'EU operating', detail: 'Kantor ·· 5520 · €390k', value: 421_000, tone: 'danger' },
  { label: 'Collections', detail: 'Northbank ·· 9034', value: 133_000, tone: 'neutral' },
]
const USD: Intl.NumberFormatOptions = { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2 }

/** Two columns of accounts, each with a bar marker and a detail line, under a solid split bar. */
export const TwoColumns: Story = {
  name: 'Two columns',
  render: function Render() {
    const [active, setActive] = useState<number | null>(null)
    return (
      <section className="flex w-[min(40rem,calc(100vw-2rem))] flex-col gap-4 rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-2xl font-semibold tracking-tight tabular-nums">$3.93M</span>
          <span className="text-ui-sm text-fg-muted">across six accounts</span>
        </div>
        <ShareBar parts={VAULTS.map((v) => ({ value: v.value, tone: v.tone }))} active={active} className="h-2.5" />
        <BreakdownList items={VAULTS} format={USD} marker="bar" columns={2} active={active} onActiveChange={setActive} aria-label="Cash by account" />
      </section>
    )
  },
}

const SEATS: BreakdownItem[] = [
  { label: 'Online', value: 21, tone: 'success' },
  { label: 'In a meeting', value: 6, tone: 'chart-2' },
  { label: 'Away', value: 9, tone: 'warning' },
  { label: 'Invited', value: 4, tone: 'neutral' },
]

/** Counts as tiles that lead with the number, keyed to a run of ticks. */
export const Counts: Story = {
  render: function Render() {
    const [active, setActive] = useState<number | null>(null)
    return (
      <section className="flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-4 rounded-2xl border border-line bg-surface p-4">
        <span className="text-ui font-medium">Team presence</span>
        <ShareBar parts={SEATS.map((s) => ({ value: s.value, tone: s.tone }))} segments={40} mark="tick" active={active} />
        <BreakdownList items={SEATS} variant="tiles" active={active} onActiveChange={setActive} aria-label="Team presence" />
      </section>
    )
  },
}

export const Playground: Story = {
  args: { items: CHANNELS, format: EUR, variant: 'rows', marker: 'swatch', columns: 1, showShare: true },
  render: (args) => <BreakdownList {...args} className="w-[min(24rem,calc(100vw-2rem))]" />,
}
