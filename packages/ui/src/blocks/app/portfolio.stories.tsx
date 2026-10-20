import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import {
  BanknoteIcon,
  LayersIcon,
  MailIcon,
  MegaphoneIcon,
  MicIcon,
  PackageIcon,
  PieChartIcon,
  SearchIcon,
  SparklesIcon,
  StoreIcon,
  VideoIcon,
  WrenchIcon,
} from '@youj/icons'
import { Portfolio } from './portfolio'
import { build, type PortfolioPeriod } from './portfolio/data'

const meta: Meta<typeof Portfolio> = {
  title: 'Blocks/App/Portfolio',
  component: Portfolio,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'See what something is worth, how it moved over a period and what it is made of: investments, revenue by product line, spend by campaign. The period switch morphs the chart, and hovering or arrowing along it reads the value on a date.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Portfolio>

export const Default: Story = { name: 'Investments' }

/** A falling period: the arrows, colors and spoken direction turn with it. */
export const PastMonth: Story = { name: 'Past month', args: { defaultPeriod: '1M' } }

/** Fed other holdings and another currency and locale. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    locale: 'de-DE',
    format: { style: 'currency', currency: 'EUR' },
    copy: { title: 'Retirement', investments: 'Positions' },
    holdings: [
      {
        id: 'a',
        name: 'World index',
        icon: <PieChartIcon size={16} />,
        count: 1,
        value: 18200,
        change: { '1M': 0.01, '6M': 0.05, '1Y': 0.09, '5Y': 0.4, max: 0.7 },
      },
      {
        id: 'b',
        name: 'Government bonds',
        icon: <BanknoteIcon size={16} />,
        count: 3,
        value: 6400,
        change: { '1M': -0.004, '6M': 0.01, '1Y': 0.02, '5Y': 0.05, max: 0.08 },
      },
    ],
  },
}

/** A series per period, ending at `total` and starting from `total / (1 + change)`, `count` points `days` apart. */
const series = (shape: Record<string, [count: number, days: number]>, total: number, change: Record<string, number>) =>
  Object.fromEntries(Object.entries(shape).map(([id, [count, days]], i) => [id, build(i + 1, count, days, total, change[id]!)]))

const WEEKS: PortfolioPeriod[] = [
  { id: '7d', label: '7D', name: 'past 7 days', axis: { month: 'short', day: 'numeric' } },
  { id: '30d', label: '30D', name: 'past 30 days', axis: { month: 'short', day: 'numeric' } },
  { id: '90d', label: '90D', name: 'past 90 days', axis: { month: 'short', day: 'numeric' } },
  { id: '1y', label: '1Y', name: 'past year', axis: { month: 'short', year: '2-digit' } },
]
const SHAPE: Record<string, [number, number]> = { '7d': [8, 1], '30d': [31, 1], '90d': [26, 3.5], '1y': [53, 7] }

/** Revenue by product line over time: compact dollars, four spans, a glyph per line. */
export const ProductLines: Story = {
  name: 'Product lines',
  args: {
    format: { style: 'currency', currency: 'USD', notation: 'compact', minimumFractionDigits: 0, maximumFractionDigits: 1 },
    periods: WEEKS,
    defaultPeriod: '90d',
    series: series(SHAPE, 2_497_500, { '7d': 0.014, '30d': 0.052, '90d': 0.118, '1y': 0.431 }),
    holdings: [
      {
        id: 'core',
        name: 'Core plans',
        icon: <LayersIcon size={16} />,
        count: 3,
        value: 1_310_000,
        change: { '7d': 0.011, '30d': 0.04, '90d': 0.09, '1y': 0.36 },
      },
      {
        id: 'addons',
        name: 'Add-ons',
        icon: <PackageIcon size={16} />,
        count: 5,
        value: 482_000,
        change: { '7d': 0.021, '30d': 0.074, '90d': 0.163, '1y': 0.52 },
      },
      {
        id: 'services',
        name: 'Services',
        icon: <WrenchIcon size={16} />,
        count: 2,
        value: 356_000,
        change: { '7d': -0.006, '30d': 0.013, '90d': 0.058, '1y': 0.21 },
      },
      {
        id: 'market',
        name: 'Marketplace',
        icon: <StoreIcon size={16} />,
        count: 4,
        value: 231_500,
        change: { '7d': 0.034, '30d': 0.12, '90d': 0.27, '1y': 0.94 },
      },
      {
        id: 'training',
        name: 'Training',
        icon: <SparklesIcon size={16} />,
        count: 2,
        value: 118_000,
        change: { '7d': -0.018, '30d': -0.026, '90d': 0.012, '1y': 0.08 },
      },
    ],
    onPeriodChange: fn(),
    copy: {
      title: 'Revenue',
      valueLabel: 'Total revenue',
      valueInfo: 'Billed revenue across product lines, at the last close. Figures here are made up for the demo.',
      investments: 'Product lines',
      holdings: (count: number) => `${count} ${count === 1 ? 'plan' : 'SKUs'}`,
    },
  },
}

/** Ad spend by campaign: whole dollars, three spans, spend that rose over each of them. */
export const AdCampaigns: Story = {
  name: 'Ad campaigns',
  args: {
    format: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 },
    periods: WEEKS.slice(0, 3),
    defaultPeriod: '30d',
    series: series(SHAPE, 186_400, { '7d': 0.06, '30d': 0.21, '90d': 0.48 }),
    holdings: [
      {
        id: 'search',
        name: 'Search · brand',
        icon: <SearchIcon size={16} />,
        count: 12,
        value: 64_200,
        change: { '7d': 0.03, '30d': 0.11, '90d': 0.25 },
      },
      {
        id: 'video',
        name: 'Video · autumn launch',
        icon: <VideoIcon size={16} />,
        count: 4,
        value: 41_800,
        change: { '7d': 0.12, '30d': 0.44, '90d': 0.9 },
      },
      {
        id: 'news',
        name: 'Newsletter sponsorships',
        icon: <MailIcon size={16} />,
        count: 6,
        value: 33_500,
        change: { '7d': 0, '30d': 0.04, '90d': 0.1 },
      },
      {
        id: 'social',
        name: 'Social · retargeting',
        icon: <MegaphoneIcon size={16} />,
        count: 9,
        value: 29_700,
        change: { '7d': 0.05, '30d': 0.18, '90d': 0.37 },
      },
      { id: 'pod', name: 'Podcast reads', icon: <MicIcon size={16} />, count: 3, value: 17_200, change: { '7d': -0.04, '30d': -0.02, '90d': 0.06 } },
    ],
    copy: {
      title: 'Ad spend',
      valueLabel: 'Total spend',
      valueInfo: 'Spend across live campaigns at the last close. Figures here are made up for the demo.',
      investments: 'Campaigns',
      holdings: (count: number) => `${count} ad ${count === 1 ? 'set' : 'sets'}`,
    },
  },
}

/** Skeletons in the figures, the chart and the rows. */
export const Loading: Story = { args: { loading: true } }

/** Nothing to draw yet. */
export const Empty: Story = { args: { series: {}, holdings: [] } }

/** The data failed to load: the message and Retry take the chart's place. */
export const Error: Story = { args: { error: 'Couldn’t load the portfolio.', onRetry: fn() } }

/** Drawn as its own page, with the card's title as the page's `h1`. */
export const Standalone: Story = { args: { embedded: false } }
