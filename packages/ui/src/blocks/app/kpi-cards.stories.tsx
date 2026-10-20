import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { fn } from 'storybook/test'
import { KpiCards, type KpiCardsKpi, type KpiCardsProps } from './kpi-cards'

const meta: Meta<typeof KpiCards> = {
  title: 'Blocks/App/KPI cards',
  component: KpiCards,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'The numbers at the top of a dashboard, each with its change against the period before, in three looks: figures on hairlines, a line with last period’s ghost, or a bar per bucket. Scrub any tile and every tile reads that day.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof KpiCards>

export const Default: Story = {}

/** Figures only, joined on hairlines in one panel. */
export const Minimal: Story = { args: { variant: 'minimal' } }

/** A bar per bucket, last period as a tick on each. */
export const Bars: Story = { args: { variant: 'bars', defaultRange: '7d' } }

export const Loading: Story = { args: { loading: true } }

export const LoadError: Story = { name: 'Error', args: { error: "Metrics couldn't be loaded. The warehouse query timed out.", onRetry: fn() } }

export const Empty: Story = { args: { kpis: [], dates: [] } }

/* A support desk's last two weeks, in British English, with no range switch. */
const DATES = Array.from({ length: 14 }, (_, i) => new Date(Date.UTC(2026, 8, 27 + i)).toISOString().slice(0, 10))
const KPIS: KpiCardsKpi[] = [
  { id: 'solved', label: 'Tickets solved', series: [182, 204, 96, 88, 231, 248, 239, 226, 214, 101, 92, 256, 262, 140], previous: [170, 188, 90, 84, 205, 221, 230, 210, 199, 95, 80, 230, 241, 128], description: 'Tickets marked solved by an agent.' },
  { id: 'reply', label: 'First reply', series: [41, 38, 55, 61, 34, 31, 36, 39, 42, 58, 63, 29, 27, 33], previous: [52, 47, 66, 70, 45, 44, 49, 50, 51, 69, 75, 40, 38, 41], aggregate: 'average', unit: 'min', invert: true, format: { maximumFractionDigits: 0 }, description: 'Median minutes to the first human reply.' },
  { id: 'csat', label: 'Satisfaction', series: [0.91, 0.93, 0.9, 0.88, 0.94, 0.95, 0.93, 0.92, 0.94, 0.9, 0.89, 0.95, 0.96, 0.95], previous: [0.9, 0.91, 0.89, 0.87, 0.92, 0.92, 0.91, 0.9, 0.92, 0.88, 0.88, 0.93, 0.93, 0.92], aggregate: 'average', format: { style: 'percent', maximumFractionDigits: 0 }, description: 'Good ratings out of all ratings.' },
  { id: 'backlog', label: 'Open tickets', series: [312, 298, 330, 351, 309, 274, 262, 251, 247, 266, 281, 240, 221, 214], aggregate: 'last', invert: true, previousValue: 289, description: 'Tickets waiting on the team right now.' },
]

export const WithYourData: Story = {
  name: 'With your data',
  args: { kpis: KPIS, dates: DATES, partial: true, ranges: [{ id: '30d', label: '30D', comparison: 'vs. the fortnight before' }], locale: 'en-GB', copy: { title: 'Support desk' } },
}

/* A shop's week and month, in dollars: the range switch is the app's data, answered with the window picked. */
const usd = { style: 'currency', currency: 'USD', maximumFractionDigits: 0 } as const
const usdCents = { style: 'currency', currency: 'USD' } as const
const pct1 = { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 } as const
const STORE_RANGES = [
  { id: 'week', label: 'Week', name: 'this week', comparison: 'vs. last week' },
  { id: 'month', label: 'Month', name: 'the last 4 weeks', comparison: 'vs. the 4 weeks before' },
]
const STORE: Record<string, { dates: string[]; granularity: 'day' | 'week'; kpis: KpiCardsKpi[] }> = {
  week: {
    dates: ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11'],
    granularity: 'day',
    kpis: [
      { id: 'revenue', label: 'Revenue', series: [4820, 5140, 4690, 5310, 6280, 8450, 7120], previous: [4410, 4780, 4520, 4960, 5870, 7790, 6640], format: usd, tone: 'chart-1', description: 'Paid orders, less returns and sales tax.' },
      { id: 'orders', label: 'Orders', series: [96, 104, 92, 108, 127, 171, 143], previous: [90, 98, 95, 101, 118, 158, 136], tone: 'chart-2', description: 'Orders placed online and at the register.' },
      { id: 'basket', label: 'Basket size', series: [50.2, 49.4, 51, 49.2, 49.4, 49.4, 49.8], previous: [49, 48.8, 47.6, 49.1, 49.7, 49.3, 48.8], value: 49.71, previousValue: 48.96, format: usdCents, tone: 'chart-3', description: 'Average order value.' },
      { id: 'returns', label: 'Returns', series: [0.042, 0.038, 0.047, 0.041, 0.036, 0.033, 0.039], previous: [0.044, 0.046, 0.045, 0.043, 0.04, 0.037, 0.042], aggregate: 'average', format: pct1, invert: true, tone: 'chart-4', description: 'Orders sent back within 30 days.' },
    ],
  },
  month: {
    dates: ['2026-09-14', '2026-09-21', '2026-09-28', '2026-10-05'],
    granularity: 'week',
    kpis: [
      { id: 'revenue', label: 'Revenue', series: [31200, 33850, 36410, 41810], previous: [29800, 30950, 32100, 33400], format: usd, tone: 'chart-1', description: 'Paid orders, less returns and sales tax.' },
      { id: 'orders', label: 'Orders', series: [632, 684, 731, 841], previous: [610, 641, 672, 702], tone: 'chart-2', description: 'Orders placed online and at the register.' },
      { id: 'basket', label: 'Basket size', series: [49.4, 49.5, 49.8, 49.7], previous: [48.9, 48.3, 47.8, 47.6], value: 49.6, previousValue: 48.1, format: usdCents, tone: 'chart-3', description: 'Average order value.' },
      { id: 'returns', label: 'Returns', series: [0.041, 0.043, 0.04, 0.039], previous: [0.046, 0.045, 0.044, 0.044], aggregate: 'average', format: pct1, invert: true, tone: 'chart-4', description: 'Orders sent back within 30 days.' },
    ],
  },
}

function StoreOverviewCard(args: KpiCardsProps) {
  const [range, setRange] = useState('week')
  return <KpiCards {...args} range={range} onRangeChange={setRange} {...STORE[range]} />
}

export const StoreOverview: Story = {
  name: 'Store overview',
  args: { ranges: STORE_RANGES, copy: { title: 'Store overview', announcement: (range, figures) => `Showing ${range}. ${figures}.` } },
  render: (args) => <StoreOverviewCard {...args} />,
}

/* A clinic's eight weeks: counts, rates where down is good, and minutes. */
const WEEKS = ['2026-08-17', '2026-08-24', '2026-08-31', '2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28', '2026-10-05']
export const ClinicOverview: Story = {
  name: 'Clinic overview',
  args: {
    dates: WEEKS,
    granularity: 'week',
    ranges: [{ id: '8w', label: '8W', name: 'the last 8 weeks', comparison: 'vs. the 8 weeks before' }],
    defaultRange: '8w',
    variant: 'bars',
    copy: { title: 'Clinic overview', emptyDescription: 'Figures appear here once the first visits are recorded.', loading: 'Loading clinic figures' },
    kpis: [
      { id: 'visits', label: 'Visits', series: [612, 598, 634, 641, 655, 628, 672, 689], previous: [586, 571, 602, 615, 623, 601, 640, 655], tone: 'chart-1', description: 'Completed appointments, in person and by video.' },
      { id: 'no-show', label: 'No-show rate', series: [0.082, 0.085, 0.079, 0.077, 0.074, 0.078, 0.071, 0.068], previous: [0.091, 0.094, 0.09, 0.088, 0.087, 0.089, 0.085, 0.083], aggregate: 'average', format: pct1, invert: true, tone: 'chart-4', description: 'Booked visits where the patient did not arrive.' },
      { id: 'wait', label: 'Wait time', series: [24, 26, 23, 22, 21, 22, 19, 18], previous: [29, 30, 28, 27, 27, 28, 26, 25], aggregate: 'average', unit: 'min', format: { maximumFractionDigits: 0 }, invert: true, tone: 'chart-2', description: 'Minutes from check-in to seeing a clinician.' },
      { id: 'satisfaction', label: 'Satisfaction', series: [0.91, 0.9, 0.92, 0.92, 0.93, 0.92, 0.94, 0.95], previous: [0.88, 0.89, 0.89, 0.9, 0.9, 0.9, 0.91, 0.91], aggregate: 'average', format: { style: 'percent', maximumFractionDigits: 0 }, tone: 'chart-3', description: 'Patients rating the visit good or very good.' },
    ],
  },
}

export const Standalone: Story = { args: { embedded: false } }
