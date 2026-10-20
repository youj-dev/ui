import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { AnalyticsOverview, type AnalyticsSummary } from './analytics-overview'

const meta: Meta<typeof AnalyticsOverview> = {
  title: 'Blocks/App/Analytics Overview',
  component: AnalyticsOverview,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen' },
    docs: {
      description: {
        component: 'See how your store did over any date range: headline numbers, a trend against the previous period, channels, categories and top products.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof AnalyticsOverview>

export const Default: Story = {}

/** Its own page, for an app without the frame: the store header over a centered canvas. */
export const Standalone: Story = { args: { embedded: false } }

/* A coffee roaster's week, as an analytics API would return it. */
const week = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const visits = [1820, 1940, 2010, 1890, 2230, 2610, 2480]
const orders = [61, 66, 70, 64, 79, 96, 88]
const before = [1700, 1810, 1880, 1790, 2050, 2320, 2290]
const beforeOrders = [55, 58, 63, 57, 70, 82, 79]
const point = (label: string, v: number, o: number) => ({ label, visitors: v, orders: o, revenue: o * 34.5 })
const sum = (list: { visitors: number; orders: number; revenue: number }[]) =>
  list.reduce((t, d) => ({ visitors: t.visitors + d.visitors, orders: t.orders + d.orders, revenue: t.revenue + d.revenue }), { visitors: 0, orders: 0, revenue: 0 })
const series = week.map((d, i) => point(d, visits[i]!, orders[i]!))
const previousSeries = week.map((d, i) => point(d, before[i]!, beforeOrders[i]!))
const totals = sum(series)
const summary: AnalyticsSummary = {
  span: { from: new Date(2026, 8, 21), to: new Date(2026, 8, 27) },
  previousSpan: { from: new Date(2026, 8, 14), to: new Date(2026, 8, 20) },
  days: 7,
  unit: 'day',
  totals,
  previousTotals: sum(previousSeries),
  series,
  previousSeries,
  channels: [
    { key: 'subscriptions', label: 'Abonnements', revenue: totals.revenue * 0.46 },
    { key: 'shop', label: 'Boutique en ligne', revenue: totals.revenue * 0.31 },
    { key: 'wholesale', label: 'Cafés partenaires', revenue: totals.revenue * 0.23 },
  ],
  products: [
    { id: 'ethiopia', name: 'Ethiopia Guji, 250 g', category: 'single', revenue: 5120, units: 341, previous: 4380, trend: [610, 680, 700, 690, 760, 880, 800] },
    { id: 'house', name: 'House espresso, 1 kg', category: 'blends', revenue: 4310, units: 151, previous: 4420, trend: [590, 600, 620, 560, 640, 700, 600] },
    { id: 'decaf', name: 'Swiss water decaf, 250 g', category: 'single', revenue: 1690, units: 121, previous: 1510, trend: [210, 230, 240, 220, 260, 280, 250] },
    { id: 'grinder', name: 'Hand grinder', category: 'gear', revenue: 1480, units: 16, previous: 990, trend: [180, 90, 270, 180, 270, 300, 190] },
  ],
  categories: [
    { key: 'single', label: 'Origine unique', revenue: 6810 },
    { key: 'blends', label: 'Assemblages', revenue: 4310 },
    { key: 'gear', label: 'Matériel', revenue: 1480 },
  ],
}

/** A coffee roaster's own figures in euros and French, with two KPIs of its own. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    summary,
    range: summary.span,
    today: new Date(2026, 8, 27),
    currency: 'EUR',
    locale: 'fr-FR',
    brand: { name: 'Torréfaction Lumen' },
    kpis: [
      { label: 'Chiffre d’affaires', value: (d) => d.revenue, format: { style: 'currency', maximumFractionDigits: 0 }, tone: 'chart-1', bars: true },
      { label: 'Commandes', value: (d) => d.orders, format: { maximumFractionDigits: 0 }, tone: 'chart-2', bars: true },
    ],
    copy: {
      title: 'Vue d’ensemble',
      section: 'Statistiques',
      badge: 'Boutique',
      comparedWith: 'comparé à',
      metrics: { revenue: 'Chiffre d’affaires', orders: 'Commandes', visitors: 'Visiteurs' },
      overTime: (label) => `${label} dans le temps`,
      channelsTitle: 'Revenus par canal',
      productsTitle: 'Meilleures ventes',
      categoriesTitle: 'Ventes par catégorie',
    },
    onRangeChange: fn(),
    onMetricChange: fn(),
  },
}
